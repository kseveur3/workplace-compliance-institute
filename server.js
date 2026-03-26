import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createRequire } from "module";
import "dotenv/config";
import Stripe from "stripe";
import cors from "cors";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
const require = createRequire(import.meta.url);
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

app.use(cors({ origin: "http://localhost:5173" }));

// ── Stripe webhook ────────────────────────────────────────────────────────────
// MUST be registered before express.json(). Stripe signature verification
// requires the raw request body; express.json() would consume it first.
app.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({ error: `Webhook error: ${err.message}` });
    }

    console.log("Stripe webhook received:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const clerkUserId = session.metadata?.clerkUserId;

      console.log("checkout.session.completed", {
        sessionId: session.id,
        clerkUserId,
      });

      if (!clerkUserId) {
        console.error("Missing clerkUserId in session metadata:", session.id);
        return res
          .status(400)
          .json({ error: "Missing clerkUserId in metadata" });
      }

      await prisma.paidUser.upsert({
        where: { clerkUserId },
        create: { clerkUserId },
        update: {},
      });

      console.log("Marked user as paid:", clerkUserId);
    }

    res.json({ received: true });
  },
);

// ── Standard JSON middleware (after webhook route) ────────────────────────────
app.use(express.json());
app.use(express.static(join(__dirname, "dist")));

// ── Checkout session creation ─────────────────────────────────────────────────
app.post("/create-checkout-session", async (req, res) => {
  const { clerkUserId } = req.body;
  if (!clerkUserId) {
    return res.status(400).json({ error: "clerkUserId is required" });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/checkout-success`,
      cancel_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/checkout-cancel`,
      metadata: { clerkUserId },
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Payment status — server-side source of truth ──────────────────────────────
app.get("/payment-status", async (req, res) => {
  const { clerkUserId } = req.query;
  if (!clerkUserId || typeof clerkUserId !== "string") {
    return res.status(400).json({ error: "clerkUserId is required" });
  }
  const record = await prisma.paidUser.findUnique({
    where: { clerkUserId },
  });
  res.json({ paid: !!record });
});

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get("*", (_req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
