import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import "dotenv/config";
import Stripe from "stripe";
import cors from "cors";
import { clerkMiddleware, getAuth } from "@clerk/express";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL?.replace(/[?&]sslmode=require\b/, ""),
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
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

      // Create a Certification record so renewal reminders can track expiry.
      // issuedAt = now, expiresAt = 1 year from now.
      const issuedAt = new Date();
      const expiresAt = new Date(issuedAt);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await prisma.certification.create({
        data: { clerkUserId, issuedAt, expiresAt },
      });

      console.log("Created certification record for:", clerkUserId);
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

// ── CEU renewal completion ────────────────────────────────────────────────────
// Server-authoritative hook that marks a certification as renewed.
// clerkUserId is read from the verified Clerk session — never trusted from the body.
app.post("/ceu-complete", clerkMiddleware(), async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  if (!clerkUserId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const { certId } = req.body;
  if (!certId) {
    return res.status(400).json({ success: false, error: "certId is required" });
  }

  const cert = await prisma.certification.findFirst({
    where: { id: certId, clerkUserId },
  });

  if (!cert) {
    return res.status(404).json({ success: false, error: "Certification not found" });
  }

  const issuedAt = new Date();
  const expiresAt = new Date(cert.expiresAt);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await prisma.certification.update({
    where: { id: certId },
    data: { renewedAt: issuedAt, issuedAt, expiresAt },
  });

  return res.json({ success: true });
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

// ── Email CTA click tracking ──────────────────────────────────────────────────
// Records that the user clicked a renewal reminder email, then redirects to CEU flow.
app.get("/renew", async (req, res) => {
  const { certId, type } = req.query;
  const params = certId && type ? `?certId=${encodeURIComponent(certId)}&type=${encodeURIComponent(type)}` : "";
  const REDIRECT = `https://workplace-compliance-institute-7038dd310f4d.herokuapp.com/ceu${params}`;

  if (certId && type) {
    try {
      await prisma.emailLog.updateMany({
        where: {
          certificationId: certId,
          type,
          clickedAt: null,
        },
        data: { clickedAt: new Date() },
      });
    } catch (err) {
      console.error("[/renew] Failed to record click:", err.message);
    }
  }

  res.redirect(302, REDIRECT);
});

// ── Current user's most recent certification ──────────────────────────────────
// Returns the latest Certification record for the authenticated user.
app.get("/my-certification", clerkMiddleware(), async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  if (!clerkUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const cert = await prisma.certification.findFirst({
    where: { clerkUserId },
    orderBy: { createdAt: "desc" },
    select: { id: true, issuedAt: true, expiresAt: true, renewedAt: true },
  });
  res.json(cert ?? null);
});

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get("*", (_req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
