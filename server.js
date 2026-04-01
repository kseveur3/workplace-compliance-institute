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
import Anthropic from "@anthropic-ai/sdk";

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

      if (session.metadata?.productType === "ceu") {
        // CEU renewal payment: unlock the exam for the specific certification.
        const { certId } = session.metadata;
        if (!certId) {
          console.error("CEU webhook missing certId:", session.id);
          return res.status(400).json({ error: "Missing certId in metadata" });
        }
        const ceuCert = await prisma.certification.findFirst({
          where: { id: certId, clerkUserId },
        });
        if (!ceuCert) {
          console.error("CEU webhook: cert not found or ownership mismatch:", certId);
          return res.status(400).json({ error: "Certification not found" });
        }
        await prisma.certification.update({
          where: { id: certId },
          data: { ceuPaidAt: new Date() },
        });
        console.log("CEU payment recorded for cert:", certId, "user:", clerkUserId);
      } else {
        // Full certification purchase.
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

// ── CEU checkout session creation ────────────────────────────────────────────
app.post("/create-ceu-checkout-session", clerkMiddleware(), async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  if (!clerkUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { certId } = req.body;
  if (!certId) {
    return res.status(400).json({ error: "certId is required" });
  }

  const cert = await prisma.certification.findFirst({
    where: { id: certId, clerkUserId },
  });
  if (!cert) {
    return res.status(404).json({ error: "Certification not found" });
  }

  const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: process.env.STRIPE_CEU_PRICE_ID, quantity: 1 }],
      success_url: `${CLIENT_URL}/ceu?certId=${certId}&type=paid`,
      cancel_url: `${CLIENT_URL}/ceu?certId=${certId}&type=cancel`,
      metadata: { clerkUserId, certId, productType: "ceu" },
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
    data: { renewedAt: issuedAt, issuedAt, expiresAt, ceuPaidAt: null },
  });

  return res.json({ success: true });
});

// ── CEU exam access check ─────────────────────────────────────────────────────
// Returns { allowed: true } only when the user has a paid, unused CEU token.
app.get("/ceu-access", clerkMiddleware(), async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  if (!clerkUserId) {
    return res.status(401).json({ allowed: false });
  }
  const { certId } = req.query;
  if (!certId || typeof certId !== "string") {
    return res.status(400).json({ allowed: false });
  }
  const cert = await prisma.certification.findFirst({
    where: { id: certId, clerkUserId, ceuPaidAt: { not: null } },
  });
  res.json({ allowed: !!cert });
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

// ── Admin: AI content generation ─────────────────────────────────────────────
app.post("/api/admin/generate-content", async (req, res) => {
  const { sectionTitle, topic, notes, generationType } = req.body;

  if (generationType !== "lesson" && generationType !== "examples" && generationType !== "quiz") {
    return res.status(400).json({ error: "Unsupported generationType." });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured." });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const context = `Section: ${sectionTitle || "General Compliance"}\nTopic: ${topic}\nNotes: ${notes || "None"}`;

  const lessonPrompt = `You are an instructional writer for workplace compliance training.

Generate a lesson for the following:
${context}

Return ONLY a JSON object with no markdown, no code fences, no extra text. The shape must be exactly:
{
  "title": "A clear, professional lesson title",
  "estimatedTime": "X minutes",
  "body": [
    "First paragraph...",
    "Second paragraph...",
    "Third paragraph..."
  ]
}

Rules:
- Professional HR/workplace compliance tone
- Concise and readable
- No fake citations or legal overclaiming
- Body must be an array of short paragraphs (3–5 items)
- No HTML tags`;

  const examplesPrompt = `You are an instructional writer for workplace compliance training.

Generate 2–3 realistic workplace scenario examples for the following:
${context}

Return ONLY a JSON object with no markdown, no code fences, no extra text. The shape must be exactly:
{
  "examples": [
    { "title": "Short scenario title", "scenario": "One or two sentence description of the scenario." },
    { "title": "Short scenario title", "scenario": "One or two sentence description of the scenario." }
  ]
}

Rules:
- Realistic workplace investigation or EEO-style scenarios
- Professional tone
- Concise
- No fake citations or legal overclaiming
- No HTML tags`;

  const quizPrompt = `You are an instructional writer for workplace compliance training.

Generate a multiple choice quiz for the following:
${context}

Return ONLY a JSON object with no markdown, no code fences, no extra text. The shape must be exactly:
{
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Brief explanation of the correct answer."
    }
  ]
}

Rules:
- Generate 3–5 questions
- Exactly 4 options per question
- Exactly one correct answer per question (indicated by correctAnswerIndex, zero-based)
- Professional HR/workplace compliance tone
- No trick wording
- No fake citations or legal overclaiming
- No HTML tags`;

  const prompt = generationType === "lesson" ? lessonPrompt : generationType === "examples" ? examplesPrompt : quizPrompt;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].text.trim();
    let content;
    try {
      content = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: "AI returned invalid JSON. Try again." });
    }

    if (generationType === "lesson") {
      if (!content.title || !content.estimatedTime || !Array.isArray(content.body)) {
        return res.status(500).json({ error: "AI response was missing expected fields." });
      }
    } else if (generationType === "examples") {
      if (!Array.isArray(content.examples)) {
        return res.status(500).json({ error: "AI response was missing expected fields." });
      }
    } else {
      if (!Array.isArray(content.questions)) {
        return res.status(500).json({ error: "AI response was missing expected fields." });
      }
    }

    return res.json({ success: true, generationType, content });
  } catch (err) {
    console.error("[generate-content] AI call failed:", err.message);
    return res.status(500).json({ error: "AI generation failed. Please try again." });
  }
});

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get("*", (_req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
