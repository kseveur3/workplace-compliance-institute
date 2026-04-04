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
  connectionString: process.env.DATABASE_URL?.replace(/[?&]sslmode=require\b/, "").replace(/[?&]channel_binding=require\b/, ""),
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"] }));

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
        if (certId) {
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
          // External user without a certId: grant 30-day CEU access window via PaidUser.
          const ceuAccessUntil = new Date();
          ceuAccessUntil.setDate(ceuAccessUntil.getDate() + 30);
          await prisma.paidUser.upsert({
            where: { clerkUserId },
            create: { clerkUserId, ceuAccessUntil },
            update: { ceuAccessUntil },
          });
          console.log("CEU 30-day access granted for external user:", clerkUserId, "until:", ceuAccessUntil);
        }
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
      cancel_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/`,
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

  try {
    if (certId) {
      const cert = await prisma.certification.findFirst({
        where: { id: certId, clerkUserId },
      });
      if (!cert) {
        return res.status(404).json({ error: "Certification not found" });
      }
    }
  } catch (err) {
    console.error("[/create-ceu-checkout-session] DB error:", err.message);
    return res.status(500).json({ error: "Failed to verify certification" });
  }

  const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
  const successUrl = certId
    ? `${CLIENT_URL}/ceu?certId=${certId}&type=paid`
    : `${CLIENT_URL}/ceu?type=paid`;
  const cancelUrl = certId
    ? `${CLIENT_URL}/ceu?certId=${certId}&type=cancel`
    : `${CLIENT_URL}/ceu?type=cancel`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: process.env.STRIPE_CEU_PRICE_ID, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { clerkUserId, certId: certId ?? "", productType: "ceu" },
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

  try {
    if (certId) {
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
    }
    // External user without certId: leave the 30-day CEU window active until it expires.
  } catch (err) {
    console.error("[/ceu-complete]", err.message);
    return res.status(500).json({ success: false, error: "Failed to record renewal" });
  }

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
  try {
    if (certId && typeof certId === "string") {
      const cert = await prisma.certification.findFirst({
        where: { id: certId, clerkUserId, ceuPaidAt: { not: null } },
      });
      return res.json({ allowed: !!cert });
    }
    // External user without certId: check 30-day CEU window on PaidUser.
    const record = await prisma.paidUser.findUnique({ where: { clerkUserId } });
    const allowed = !!(record?.ceuAccessUntil && record.ceuAccessUntil > new Date());
    res.json({ allowed });
  } catch (err) {
    console.error("[/ceu-access]", err.message);
    res.status(500).json({ allowed: false });
  }
});

// ── Payment status — server-side source of truth ──────────────────────────────
app.get("/payment-status", async (req, res) => {
  try {
    const { clerkUserId } = req.query;
    if (!clerkUserId || typeof clerkUserId !== "string") {
      return res.status(400).json({ error: "clerkUserId is required" });
    }
    const record = await prisma.paidUser.findUnique({
      where: { clerkUserId },
    });
    res.json({ paid: !!record, ceuAccessUntil: record?.ceuAccessUntil ?? null });
  } catch (err) {
    console.error("[/payment-status]", err);
    res.status(500).json({ error: "payment-status failed" });
  }
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
  try {
    const cert = await prisma.certification.findFirst({
      where: { clerkUserId },
      orderBy: { createdAt: "desc" },
      select: { id: true, issuedAt: true, expiresAt: true, renewedAt: true },
    });
    res.json(cert ?? null);
  } catch (err) {
    console.error("[/my-certification]", err.message);
    res.status(500).json({ error: "Failed to load certification" });
  }
});

// ── Admin: Generate full certification (mock) ────────────────────────────────
app.post("/api/admin/generate-certification", async (req, res) => {
  res.json({
    sourceSummary:
      "Source material drawn from EEOC-enforced federal statutes: Title VII of the Civil Rights Act (1964), the Age Discrimination in Employment Act (ADEA), the Americans with Disabilities Act (ADA), the Pregnancy Discrimination Act (PDA), and the Pregnant Workers Fairness Act (PWFA). Topics include harassment, discrimination, retaliation, accommodation obligations, and complaint procedures.",
    curriculumOutline: [
      { section: "Section 1: EEO Framework & Federal Law", lessons: 3 },
      { section: "Section 2: Harassment in the Workplace", lessons: 4 },
      { section: "Section 3: Discrimination & Protected Classes", lessons: 4 },
      { section: "Section 4: Reasonable Accommodation", lessons: 3 },
      { section: "Section 5: Retaliation & Whistleblower Protections", lessons: 2 },
      { section: "Section 6: Investigation & Reporting Procedures", lessons: 3 },
    ],
    lessons: [
      {
        section: "Section 1",
        lessons: [
          {
            title: "Overview of EEO Law",
            estimatedTime: "15 minutes",
            content: [
              "The Equal Employment Opportunity (EEO) legal framework is a set of federal laws designed to protect employees and job applicants from workplace discrimination based on protected characteristics.",
              "Key statutes include Title VII of the Civil Rights Act (1964), the Age Discrimination in Employment Act (ADEA), the Americans with Disabilities Act (ADA), and the Pregnant Workers Fairness Act (PWFA).",
              "These laws apply to employers with 15 or more employees and cover all aspects of employment including hiring, promotion, pay, discipline, and termination.",
            ],
          },
          {
            title: "Role of the EEOC",
            estimatedTime: "15 minutes",
            content: [
              "The Equal Employment Opportunity Commission (EEOC) is the federal agency responsible for enforcing EEO laws in the private sector, state and local governments, and federal agencies.",
              "The EEOC investigates charges of discrimination, attempts mediation between parties, and may file lawsuits on behalf of complainants when it finds reasonable cause.",
              "Employers are required to post EEOC notices in the workplace and cooperate with EEOC investigations, including providing requested documents and permitting interviews.",
            ],
          },
          {
            title: "Employee Rights & Employer Obligations",
            estimatedTime: "15 minutes",
            content: [
              "Employees have the right to work in an environment free from discrimination, harassment, and retaliation. They may file a charge with the EEOC within 180 or 300 days of an alleged violation depending on state law.",
              "Employers are obligated to maintain written anti-discrimination policies, conduct prompt investigations of complaints, and take corrective action when violations are found.",
              "Failing to meet these obligations can result in EEOC findings of cause, monetary damages, injunctive relief, and required policy changes.",
            ],
          },
        ],
      },
      {
        section: "Section 2",
        lessons: [
          {
            title: "Defining Harassment",
            estimatedTime: "15 minutes",
            content: [
              "Harassment is a form of employment discrimination that violates Title VII, the ADEA, and the ADA. It involves unwelcome conduct based on a protected characteristic.",
              "To be unlawful, harassment must either result in an adverse employment action (quid pro quo) or be severe or pervasive enough to create a hostile work environment.",
              "Isolated incidents, minor teasing, or offhand comments generally do not rise to the level of illegal harassment, though they may still violate company policy.",
            ],
          },
          {
            title: "Quid Pro Quo vs. Hostile Work Environment",
            estimatedTime: "20 minutes",
            content: [
              "Quid pro quo harassment occurs when a supervisor conditions an employment benefit — such as a raise, promotion, or continued employment — on an employee's submission to unwelcome conduct.",
              "A hostile work environment exists when unwelcome conduct based on a protected characteristic is so severe or pervasive that it alters the conditions of employment.",
              "Both types may involve the same underlying conduct. The distinction matters for determining employer liability: employers are strictly liable for quid pro quo harassment by supervisors.",
            ],
          },
          {
            title: "Bystander Responsibility",
            estimatedTime: "10 minutes",
            content: [
              "Bystanders — coworkers who witness harassment — play an important role in preventing and addressing misconduct. Inaction can contribute to a culture that tolerates harassment.",
              "Employees who witness harassment can intervene safely, document what they observed, or report the conduct to HR or a manager even if the target does not come forward.",
              "Organizations with active bystander training programs have lower rates of sustained harassment complaints and faster resolution times.",
            ],
          },
          {
            title: "Preventing Harassment as a Manager",
            estimatedTime: "20 minutes",
            content: [
              "Managers are responsible for maintaining a harassment-free environment in their teams. They must respond promptly to complaints or observed misconduct regardless of whether a formal complaint is filed.",
              "A manager's failure to act on known harassment may expose the employer to liability even if HR was never notified. Prompt escalation to HR is required.",
              "Managers should never discourage employees from reporting concerns and must avoid retaliating against anyone who raises a complaint in good faith.",
            ],
          },
        ],
      },
      {
        section: "Section 3",
        lessons: [
          {
            title: "Protected Classes Under Title VII",
            estimatedTime: "15 minutes",
            content: [
              "Title VII prohibits discrimination based on race, color, religion, sex, and national origin. Subsequent laws extended protections to age (ADEA), disability (ADA), and pregnancy (PDA/PWFA).",
              "The Supreme Court's decision in Bostock v. Clayton County (2020) held that Title VII's prohibition on sex discrimination includes discrimination based on sexual orientation and gender identity.",
              "Employers may not use protected characteristics as a factor in any employment decision, including hiring, pay, assignments, promotions, discipline, or termination.",
            ],
          },
          {
            title: "Recognizing Disparate Treatment",
            estimatedTime: "20 minutes",
            content: [
              "Disparate treatment is intentional discrimination — treating an employee less favorably because of a protected characteristic compared to similarly situated employees outside that class.",
              "Evidence may be direct (a discriminatory statement) or circumstantial. In most cases, complainants use the McDonnell Douglas burden-shifting framework to establish an inference of discrimination.",
              "Investigators look for comparator evidence: were employees in similar roles with similar performance records treated differently based on a protected characteristic?",
            ],
          },
          {
            title: "Disparate Impact & Neutral Policies",
            estimatedTime: "20 minutes",
            content: [
              "Disparate impact occurs when a facially neutral policy or practice disproportionately excludes or harms members of a protected class, even without discriminatory intent.",
              "Employers may defend a disparate impact claim by demonstrating the practice is job-related and consistent with business necessity. Complainants may still prevail by showing a less discriminatory alternative exists.",
              "Common examples include hiring tests, educational requirements, and physical standards that screen out protected groups at higher rates without a validated business justification.",
            ],
          },
          {
            title: "Age & Disability Discrimination",
            estimatedTime: "20 minutes",
            content: [
              "The ADEA prohibits discrimination against employees and applicants 40 years of age or older. Employers may not use age as a factor in layoffs, promotions, or hiring decisions.",
              "The ADA prohibits discrimination against qualified individuals with disabilities and requires employers to provide reasonable accommodations unless doing so causes undue hardship.",
              "A disability under the ADA is a physical or mental impairment that substantially limits a major life activity. The definition is interpreted broadly following the ADA Amendments Act of 2008.",
            ],
          },
        ],
      },
      {
        section: "Section 4",
        lessons: [
          {
            title: "What Is a Reasonable Accommodation?",
            estimatedTime: "15 minutes",
            content: [
              "A reasonable accommodation is any modification to a job, work environment, or the way work is performed that enables a qualified person with a disability to enjoy equal employment opportunities.",
              "Examples include modified schedules, remote work, assistive technology, reassignment to a vacant position, and adjustments to training materials or testing procedures.",
              "Accommodations are also required for sincerely held religious beliefs and practices under Title VII, and for pregnancy-related conditions under the PWFA.",
            ],
          },
          {
            title: "The Interactive Process",
            estimatedTime: "20 minutes",
            content: [
              "When an employee requests an accommodation, employers are required to engage in a good-faith interactive process — a dialogue to identify the employee's limitations and explore effective accommodations.",
              "The interactive process does not require the employer to accept the employee's preferred accommodation; it requires genuine consideration of effective alternatives.",
              "Failing to engage in the interactive process, or ending it prematurely, can itself constitute a violation of the ADA even if a reasonable accommodation would have been difficult to identify.",
            ],
          },
          {
            title: "Undue Hardship Analysis",
            estimatedTime: "15 minutes",
            content: [
              "An employer may deny a requested accommodation if it would impose an undue hardship — a significant difficulty or expense — considering the nature of the business, its financial resources, and the impact on operations.",
              "Undue hardship is a high bar. Cost alone is rarely sufficient; employers must assess available tax credits, external funding, and whether the hardship can be reduced through alternative accommodations.",
              "For religious accommodations, the Supreme Court raised the standard in Groff v. DeJoy (2023): employers must show substantial increased costs in the conduct of their business to establish undue hardship.",
            ],
          },
        ],
      },
      {
        section: "Section 5",
        lessons: [
          {
            title: "What Constitutes Retaliation",
            estimatedTime: "20 minutes",
            content: [
              "Retaliation occurs when an employer takes a materially adverse action against an employee because they engaged in protected activity, such as filing a complaint, cooperating with an investigation, or opposing discriminatory practices.",
              "Materially adverse actions include termination, demotion, pay cuts, schedule changes, negative performance reviews, and increased scrutiny — anything that would deter a reasonable person from making or supporting a complaint.",
              "Retaliation claims are among the most frequently filed charges with the EEOC and are actionable even when the underlying discrimination claim is not proven.",
            ],
          },
          {
            title: "Protected Activity & Reporting",
            estimatedTime: "15 minutes",
            content: [
              "Protected activity includes both 'opposition' (objecting to discriminatory practices) and 'participation' (filing a charge, testifying, or cooperating in an investigation). Both forms are protected from retaliation.",
              "The complaint does not need to be formal or legally precise to qualify as protected activity. An informal complaint to a manager or HR is sufficient if it raises concern about conduct prohibited by EEO law.",
              "Employers must maintain clear reporting channels, protect the confidentiality of complainants to the extent possible, and ensure that no adverse action follows a complaint within a suspicious timeframe.",
            ],
          },
        ],
      },
      {
        section: "Section 6",
        lessons: [
          {
            title: "How to Report a Complaint",
            estimatedTime: "10 minutes",
            content: [
              "Employees may report concerns internally through HR, a designated EEO officer, or a manager outside the chain of command. Employers should provide multiple reporting channels to reduce barriers.",
              "Externally, employees may file a charge with the EEOC within 180 days of the alleged violation (or 300 days if a state agency has a work-sharing agreement). Filing is a prerequisite to a federal lawsuit.",
              "Employers must post EEOC notices informing employees of their right to file charges and must not discourage or penalize employees who exercise that right.",
            ],
          },
          {
            title: "Conducting a Workplace Investigation",
            estimatedTime: "25 minutes",
            content: [
              "A prompt, thorough, and impartial investigation is the employer's primary defense against liability. The investigator must have no conflict of interest and must treat all parties with respect.",
              "The investigation should include interviews of the complainant, the respondent, and relevant witnesses; a review of documentary evidence; and a credibility assessment based on consistency, corroboration, and motive.",
              "Confidentiality should be maintained to the extent practicable, but absolute confidentiality cannot be promised. All participants should be reminded of the anti-retaliation policy.",
            ],
          },
          {
            title: "Documenting Findings & Next Steps",
            estimatedTime: "20 minutes",
            content: [
              "The investigator should prepare a written report summarizing the allegations, the evidence reviewed, credibility determinations, and a finding as to whether a policy violation occurred.",
              "If a violation is found, the employer must take prompt corrective action proportional to the severity of the conduct. Discipline, training, policy changes, or termination may be appropriate.",
              "All investigation records should be retained in a secure file separate from the employee's personnel file. Retention periods vary by jurisdiction but a minimum of three years is recommended.",
            ],
          },
        ],
      },
    ],
    examples: [
      { title: "Hostile Work Environment", scenario: "A supervisor regularly makes comments about a female employee's appearance in front of coworkers, creating an atmosphere she feels she cannot escape." },
      { title: "Disability Accommodation Request", scenario: "An employee with a chronic back condition requests a standing desk. The employer denies the request without engaging in an interactive process." },
      { title: "Retaliation After Complaint", scenario: "An employee files an internal harassment complaint. Two weeks later, she is transferred to a less desirable shift with no performance-related justification." },
      { title: "Age-Based Hiring Bias", scenario: "A hiring manager remarks that a candidate 'might not keep up with the pace' after reviewing their graduation year, and does not advance them without documented justification." },
    ],
    sectionQuizzes: [
      {
        section: "Section 1",
        questions: [
          { question: "Which federal agency is primarily responsible for enforcing EEO laws?", options: ["Department of Labor", "EEOC", "Department of Justice", "Office of Personnel Management"], correctIndex: 1 },
          { question: "How many employees must an employer have for Title VII to apply?", options: ["5 or more", "10 or more", "15 or more", "50 or more"], correctIndex: 2 },
          { question: "Within how many days must an employee file an EEOC charge in a state with a work-sharing agreement?", options: ["90 days", "180 days", "300 days", "365 days"], correctIndex: 2 },
          { question: "Which of the following is NOT a protected characteristic under Title VII?", options: ["Race", "Religion", "Political affiliation", "National origin"], correctIndex: 2 },
        ],
      },
      {
        section: "Section 2",
        questions: [
          { question: "Quid pro quo harassment requires the harasser to be:", options: ["A coworker", "A supervisor", "A client", "Any employee"], correctIndex: 1 },
          { question: "For a hostile work environment claim, conduct must be:", options: ["Physical only", "Intentional only", "Severe or pervasive", "Reported to HR first"], correctIndex: 2 },
          { question: "Which Supreme Court case established employer liability standards for supervisor harassment?", options: ["McDonnell Douglas v. Green", "Burlington Industries v. Ellerth", "Bostock v. Clayton County", "Groff v. DeJoy"], correctIndex: 1 },
          { question: "A manager who witnesses harassment and takes no action:", options: ["Is not liable if HR was not notified", "May expose the employer to liability", "Is only liable if the conduct was physical", "Has no obligation unless the victim complains"], correctIndex: 1 },
          { question: "Bystander intervention is best described as:", options: ["Mandatory reporting by law", "Encouraged but legally irrelevant", "A way employees can help prevent harassment", "Only appropriate for managers"], correctIndex: 2 },
        ],
      },
      {
        section: "Section 3",
        questions: [
          { question: "The Supreme Court's Bostock decision extended Title VII protections to:", options: ["Age and disability", "Sexual orientation and gender identity", "Political beliefs", "Immigration status"], correctIndex: 1 },
          { question: "Disparate treatment requires proof of:", options: ["Intentional discrimination", "A neutral policy with adverse impact", "A written discriminatory policy", "Economic harm only"], correctIndex: 0 },
          { question: "The ADEA protects employees who are:", options: ["Under 40", "40 or older", "50 or older", "Any age"], correctIndex: 1 },
          { question: "A neutral hiring test that disproportionately excludes a protected group is an example of:", options: ["Disparate treatment", "Quid pro quo harassment", "Disparate impact", "Retaliation"], correctIndex: 2 },
          { question: "The ADA definition of disability was expanded by:", options: ["The PWFA (2023)", "The ADA Amendments Act of 2008", "Bostock v. Clayton County", "The PDA"], correctIndex: 1 },
        ],
      },
      {
        section: "Section 4",
        questions: [
          { question: "An employer's obligation when receiving an accommodation request is to:", options: ["Grant it immediately", "Deny it if costly", "Engage in the interactive process", "Require medical documentation only"], correctIndex: 2 },
          { question: "Which of the following is NOT typically a reasonable accommodation?", options: ["Modified schedule", "Reassignment to a vacant position", "Eliminating an essential job function", "Assistive technology"], correctIndex: 2 },
          { question: "Under Groff v. DeJoy, an employer may deny a religious accommodation if it causes:", options: ["Any inconvenience", "Minor scheduling difficulty", "Substantial increased costs to the business", "Employee dissatisfaction"], correctIndex: 2 },
          { question: "Ending the interactive process prematurely:", options: ["Is acceptable if the employee stops responding", "Can itself constitute an ADA violation", "Relieves the employer of liability", "Is required after 30 days"], correctIndex: 1 },
        ],
      },
      {
        section: "Section 5",
        questions: [
          { question: "Retaliation is actionable even when:", options: ["The employer intended no harm", "The underlying discrimination claim is not proven", "The adverse action was minor", "HR was not involved"], correctIndex: 1 },
          { question: "Which of the following qualifies as protected activity?", options: ["Refusing a work assignment for personal reasons", "Informally complaining to a manager about discriminatory conduct", "Requesting a raise", "Calling in sick"], correctIndex: 1 },
          { question: "A 'materially adverse action' in a retaliation claim is defined as:", options: ["Any change in job duties", "Anything that would deter a reasonable person from complaining", "Only termination or demotion", "Actions affecting pay only"], correctIndex: 1 },
        ],
      },
      {
        section: "Section 6",
        questions: [
          { question: "The investigation report should include:", options: ["Only the complainant's account", "Allegations, evidence reviewed, credibility findings, and a conclusion", "HR's recommendation only", "A summary of disciplinary history"], correctIndex: 1 },
          { question: "Investigation records should be stored:", options: ["In the respondent's personnel file", "Destroyed after the investigation closes", "In a secure file separate from personnel files", "Shared with all employees for transparency"], correctIndex: 2 },
          { question: "Prompt corrective action after a founded complaint should be:", options: ["Always termination", "Proportional to the severity of the conduct", "Deferred pending an external investigation", "Limited to verbal warnings"], correctIndex: 1 },
          { question: "Absolute confidentiality during an investigation:", options: ["Is required by the EEOC", "Can always be guaranteed to witnesses", "Cannot be promised but should be maintained as much as practicable", "Is only required for the complainant"], correctIndex: 2 },
        ],
      },
    ],
    finalExam: {
      totalQuestions: 20,
      passingScore: "80%",
      coverage: [
        "Federal EEO law overview and enforcement agencies",
        "Harassment definitions, types, and employer liability",
        "Protected classes and forms of discrimination",
        "Accommodation obligations and the interactive process",
        "Retaliation and protected activity",
        "Complaint procedures and investigation responsibilities",
      ],
      questions: [
        { question: "Which federal agency is the primary enforcement body for EEO laws?", options: ["Department of Labor", "EEOC", "Department of Justice", "Office of Personnel Management"], correctIndex: 1 },
        { question: "Title VII of the Civil Rights Act of 1964 prohibits discrimination based on all of the following EXCEPT:", options: ["Race", "National origin", "Political affiliation", "Religion"], correctIndex: 2 },
        { question: "The burden-shifting framework for disparate treatment claims was established in:", options: ["Harris v. Forklift Systems", "McDonnell Douglas Corp. v. Green", "Meritor Savings Bank v. Vinson", "Burlington Industries v. Ellerth"], correctIndex: 1 },
        { question: "For a hostile work environment claim, the conduct must be:", options: ["Physical and intentional", "Reported to HR first", "Both subjectively and objectively offensive", "Committed only by a supervisor"], correctIndex: 2 },
        { question: "The Supreme Court's Bostock v. Clayton County decision extended Title VII protections to:", options: ["Age and disability", "Sexual orientation and gender identity", "Political beliefs", "Immigration status"], correctIndex: 1 },
        { question: "Quid pro quo harassment occurs when:", options: ["A coworker makes offensive jokes", "A supervisor conditions a job benefit on submission to unwelcome conduct", "An employer applies a neutral policy with disparate impact", "An employee is denied a reasonable accommodation"], correctIndex: 1 },
        { question: "Disparate impact occurs when:", options: ["An employer intentionally treats employees differently based on race", "A facially neutral policy disproportionately excludes a protected class", "A supervisor retaliates against a complainant", "An employer fails to engage in the interactive process"], correctIndex: 1 },
        { question: "The ADEA protects employees who are:", options: ["Under 40", "40 or older", "50 or older", "Any age"], correctIndex: 1 },
        { question: "Under the ADA, a reasonable accommodation must be provided unless it:", options: ["Is requested verbally", "Costs more than $500", "Causes undue hardship", "Requires supervisor approval"], correctIndex: 2 },
        { question: "The interactive process under the ADA requires:", options: ["The employer to grant the first accommodation requested", "A good-faith dialogue to identify effective accommodations", "HR approval before any discussion begins", "A written request from the employee's physician"], correctIndex: 1 },
        { question: "Following Groff v. DeJoy, an employer may deny a religious accommodation if it causes:", options: ["Any inconvenience", "Minor scheduling difficulty", "Substantial increased costs to the business", "Employee complaints"], correctIndex: 2 },
        { question: "Which of the following qualifies as protected activity under EEO law?", options: ["Refusing a work assignment for personal reasons", "Informally complaining to a manager about discriminatory conduct", "Requesting a pay raise", "Taking unscheduled leave"], correctIndex: 1 },
        { question: "Retaliation is actionable even when:", options: ["The employer acted in good faith", "The underlying discrimination claim is not proven", "The adverse action was minor", "HR was not informed"], correctIndex: 1 },
        { question: "A materially adverse action in a retaliation claim is defined as:", options: ["Any change in job duties", "Only termination or demotion", "Anything that would deter a reasonable person from complaining", "Actions affecting pay only"], correctIndex: 2 },
        { question: "Which of the following is NOT typically considered a reasonable accommodation?", options: ["Modified work schedule", "Reassignment to a vacant position", "Eliminating an essential job function", "Assistive technology"], correctIndex: 2 },
        { question: "An EEO investigation report must include:", options: ["Only the complainant's account", "Allegations, evidence, credibility findings, and a conclusion", "HR's disciplinary recommendation only", "A summary of the respondent's personnel file"], correctIndex: 1 },
        { question: "Employer liability for a hostile work environment created by a co-worker requires:", options: ["Strict liability regardless of knowledge", "That the employer knew or should have known and failed to act", "A prior written complaint from the victim", "That the conduct was physical"], correctIndex: 1 },
        { question: "The Pregnant Workers Fairness Act (PWFA) requires accommodations for:", options: ["Only conditions that meet ADA disability standards", "Known limitations related to pregnancy, childbirth, or related medical conditions", "Employees on FMLA leave only", "Medical conditions diagnosed before hire"], correctIndex: 1 },
        { question: "Investigation records should be retained:", options: ["In the respondent's personnel file", "Destroyed once the case is closed", "In a secure file separate from personnel records", "Only if a lawsuit is filed"], correctIndex: 2 },
        { question: "Which of the following best describes disparate treatment?", options: ["A neutral policy that screens out a protected group", "Intentionally treating an employee less favorably because of a protected characteristic", "Failure to provide a reasonable accommodation", "Conduct that creates a hostile work environment"], correctIndex: 1 },
      ],
    },
  });
});

// ── Admin: Scan EEOC updates for CEU (mock) ──────────────────────────────────
app.post("/api/admin/scan-ceu-updates", async (req, res) => {
  res.json({
    detectedChanges: [
      "EEOC updated enforcement guidance on harassment (April 2024): clarifies standards for hostile work environment claims and employer liability in remote and hybrid work settings.",
      "New EEOC guidance on workplace religious accommodations following Groff v. DeJoy (2023 Supreme Court ruling): raises the bar for employers claiming undue hardship.",
      "Pregnant Workers Fairness Act (PWFA) took effect June 2023: requires reasonable accommodations for pregnancy-related conditions beyond existing PDA protections.",
      "EEOC proposed rulemaking on AI and automated decision-making: guidance on avoiding discriminatory screening tools in hiring and performance evaluation.",
    ],
    ceuLessons: [
      "Harassment in Remote & Hybrid Work Environments: Updated EEOC Standards",
      "Religious Accommodations After Groff v. DeJoy: What Employers Must Know",
      "Pregnant Workers Fairness Act: New Obligations and the Interactive Process",
    ],
    ceuQuiz: [
      {
        question: "Under the updated EEOC harassment guidance, which of the following is true about remote work environments?",
        correctAnswer: "Harassment via digital communication is subject to the same standards as in-person conduct.",
      },
      {
        question: "Following Groff v. DeJoy, what standard must an employer meet to deny a religious accommodation?",
        correctAnswer: "The employer must demonstrate substantial increased costs in the conduct of its business.",
      },
      {
        question: "The Pregnant Workers Fairness Act requires employers to provide accommodations for:",
        correctAnswer: "Known limitations related to pregnancy, childbirth, or related medical conditions, regardless of whether they meet ADA disability standards.",
      },
    ],
  });
});

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get("*", (_req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
