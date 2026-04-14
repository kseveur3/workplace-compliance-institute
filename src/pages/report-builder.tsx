import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ReportData = {
  summary: string;
  parties: string;
  allegations: string;
  steps: string;
  findings: string;
  conclusion: string;
};

type FeedbackData = {
  wellDone: string;
  improve: string;
  suggestions: string;
};

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS: {
  key: keyof ReportData;
  title: string;
  prompt: string;
  helper: string;
}[] = [
  {
    key: "summary",
    title: "Complaint Summary",
    prompt: "Summarize the complaint in your own words",
    helper:
      "Include: who reported the complaint · who the complaint is against · what behavior is being reported · when the incidents occurred",
  },
  {
    key: "parties",
    title: "Parties Involved",
    prompt: "List the individuals involved and their roles",
    helper:
      "Include: complainant · respondent · any identified witnesses · relevant roles or reporting relationships",
  },
  {
    key: "allegations",
    title: "Allegations",
    prompt: "What specific claims are being made?",
    helper:
      "Clearly outline: each allegation separately · the behavior being claimed · whether the allegation is disputed",
  },
  {
    key: "steps",
    title: "Investigation Steps",
    prompt: "What steps would you take to investigate this?",
    helper:
      "Include: who you would interview · what documents or evidence you would review · how you would ensure fairness and thoroughness",
  },
  {
    key: "findings",
    title: "Findings",
    prompt: "Based on the information, what did you determine?",
    helper:
      "Explain: what evidence supports or contradicts the allegations · how you evaluated conflicting statements · what facts you consider established",
  },
  {
    key: "conclusion",
    title: "Conclusion",
    prompt: "What is the outcome and rationale?",
    helper:
      "Include: whether the allegations are substantiated or not · a brief explanation of your reasoning · any recommended next steps (if applicable)",
  },
];

const TOTAL_STEPS = STEPS.length; // 6
const REVIEW_STEP = TOTAL_STEPS;      // 6
const FEEDBACK_STEP = TOTAL_STEPS + 1; // 7
const FINAL_STEP = TOTAL_STEPS + 2;   // 8

const EMPTY_DATA: ReportData = {
  summary: "",
  parties: "",
  allegations: "",
  steps: "",
  findings: "",
  conclusion: "",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ReportBuilderPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const storageKey = user?.id ? `wci_report_builder_${user.id}` : null;

  const [data, setData] = useState<ReportData>(() => {
    if (!storageKey) return EMPTY_DATA;
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? { ...EMPTY_DATA, ...JSON.parse(raw) } : EMPTY_DATA;
    } catch {
      return EMPTY_DATA;
    }
  });

  const [step, setStep] = useState(-1); // -1 = scenario screen, 0–5 = content steps
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Auto-save data on every change
  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data, storageKey]);

  // Scroll to top on each step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [step]);

  function updateField(key: keyof ReportData, value: string) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function getFeedback() {
    setFeedbackLoading(true);
    setFeedbackError(null);
    try {
      const token = await getToken();
      const base = import.meta.env.VITE_API_URL ?? "";
      const res = await fetch(`${base}/report-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      setFeedback(json);
      setStep(FEEDBACK_STEP);
    } catch {
      setFeedbackError(
        "Unable to get feedback right now. Please try again."
      );
    } finally {
      setFeedbackLoading(false);
    }
  }

  function downloadReport() {
    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Workplace Investigation Report</title>
  <style>
    body {
      font-family: Georgia, "Times New Roman", serif;
      max-width: 720px;
      margin: 48px auto;
      color: #1a2a4a;
      font-size: 14px;
      line-height: 1.7;
    }
    h1 {
      font-size: 20px;
      border-bottom: 2px solid #1a2a4a;
      padding-bottom: 8px;
      margin-bottom: 4px;
    }
    .meta {
      color: #666;
      font-size: 12px;
      margin-bottom: 36px;
    }
    h2 {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #1a2a4a;
      margin: 32px 0 6px;
      border-bottom: 1px solid #e0e6ef;
      padding-bottom: 4px;
    }
    p {
      white-space: pre-wrap;
      margin: 0;
    }
    @media print {
      body { margin: 20mm; }
    }
  </style>
</head>
<body>
  <h1>Workplace Investigation Report</h1>
  <p class="meta">Workplace Compliance Institute &nbsp;·&nbsp; ${date}</p>
  ${STEPS.map(
    ({ title, key }) =>
      `<h2>${title}</h2><p>${data[key] || "(Not completed)"}</p>`
  ).join("\n")}
</body>
</html>`;

    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.print();
  }

  // ── Step indicator (shown on content steps + review) ─────────────────────

  function StepIndicator({ current }: { current: number }) {
    const pct = Math.round(((current + 1) / TOTAL_STEPS) * 100);
    return (
      <div className="rb-progress">
        <span className="rb-progress__label">
          {current < TOTAL_STEPS
            ? `Step ${current + 1} of ${TOTAL_STEPS}`
            : "Review"}
        </span>
        <div className="rb-progress__bar">
          <div
            className="rb-progress__fill"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>
    );
  }

  // ── Scenario screen (−1) ─────────────────────────────────────────────────

  if (step === -1) {
    return (
      <div className="rb-shell">
        <Link to="/course" className="page-back-link">
          ← Back to Course
        </Link>
        <div className="rb-card">
          <p className="rb-eyebrow">Case Scenario</p>
          <h1 className="rb-title">Case Scenario</h1>
          <p className="rb-scenario-body">
            Sarah Mitchell, a Marketing Associate, has filed a complaint against
            her direct manager, David Reynolds. Sarah states that over the past
            ten weeks, David has made repeated comments she found dismissive and
            demeaning. In one team meeting, after she presented a campaign
            proposal, David said, "Let's hear from someone with a bit more
            experience before we move forward" — a remark she believes was
            directed at her in front of four colleagues.
          </p>
          <p className="rb-scenario-body">
            Sarah also describes a one-on-one check-in approximately three weeks
            ago in which David told her she "might want to reconsider whether
            this role is the right fit." She interpreted this as a veiled threat
            and left the meeting feeling shaken. She did not document the
            exchange at the time. David acknowledges making the "right fit"
            comment but says it was part of a broader performance conversation
            that Sarah has taken out of context.
          </p>
          <p className="rb-scenario-body">
            Two witnesses have been identified from the team meeting. One
            recalls feeling uncomfortable when David made the remark and
            understood it to be directed at Sarah. The other says they did not
            read it that way and believed David was simply redirecting the
            discussion. No prior complaints have been raised in connection with
            this specific conduct, and no additional documentation has yet been
            provided by either party.
          </p>
          <div className="rb-nav" style={{ marginTop: "8px" }}>
            <button className="btn-primary" onClick={() => setStep(0)}>
              Begin Report →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Content steps (0–5) ───────────────────────────────────────────────────

  if (step < TOTAL_STEPS) {
    const { title, prompt, helper, key } = STEPS[step];
    const isLast = step === TOTAL_STEPS - 1;
    const MIN_CHARS = 25;
    const tooShort = data[key].trim().length < MIN_CHARS;

    return (
      <div className="rb-shell">
        <Link to="/course" className="page-back-link">
          ← Back to Course
        </Link>
        <StepIndicator current={step} />
        <div className="rb-card">
          <p className="rb-eyebrow">
            Step {step + 1} of {TOTAL_STEPS}
          </p>
          <h1 className="rb-title">{title}</h1>
          <p className="rb-prompt">{prompt}</p>
          <p className="rb-helper">{helper}</p>
          <textarea
            className="rb-textarea"
            value={data[key]}
            onChange={(e) => updateField(key, e.target.value)}
            placeholder="Write your response here…"
            rows={8}
            autoFocus
          />
          {tooShort && data[key].trim().length > 0 && (
            <p className="rb-validation-msg">
              Add a bit more detail so your report is useful
            </p>
          )}
          <div className="rb-nav">
            {step > 0 && (
              <button
                className="btn-secondary"
                onClick={() => setStep(step - 1)}
              >
                ← Back
              </button>
            )}
            <button
              className="btn-primary"
              onClick={() => setStep(step + 1)}
              disabled={tooShort}
            >
              {isLast ? "Review Report →" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Review step (6) ───────────────────────────────────────────────────────

  if (step === REVIEW_STEP) {
    return (
      <div className="rb-shell">
        <Link to="/course" className="page-back-link">
          ← Back to Course
        </Link>
        <StepIndicator current={TOTAL_STEPS} />
        <div className="rb-card">
          <p className="rb-eyebrow">Review</p>
          <h1 className="rb-title">Review Your Report</h1>
          <p className="rb-prompt">
            Check each section. You can edit directly before requesting
            feedback.
          </p>

          <div className="rb-review-sections">
            {STEPS.map(({ title, key, helper }) => (
              <div key={key} className="rb-review-section">
                <p className="rb-review-section__title">{title}</p>
                <p className="rb-helper">{helper}</p>
                <textarea
                  className="rb-textarea"
                  value={data[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                  rows={4}
                />
              </div>
            ))}
          </div>

          <div className="rb-nav">
            <button
              className="btn-secondary"
              onClick={() => setStep(TOTAL_STEPS - 1)}
            >
              ← Back
            </button>
            <button
              className="btn-primary"
              onClick={getFeedback}
              disabled={feedbackLoading}
            >
              {feedbackLoading ? "Getting feedback…" : "Get Feedback →"}
            </button>
          </div>
          {feedbackError && <p className="rb-error">{feedbackError}</p>}
        </div>
      </div>
    );
  }

  // ── Feedback step (7) ─────────────────────────────────────────────────────

  // Guard: if feedback hasn't loaded yet, fall back to review screen.
  if (step === FEEDBACK_STEP && !feedback) {
    setStep(REVIEW_STEP);
    return null;
  }

  if (step === FEEDBACK_STEP && feedback) {
    return (
      <div className="rb-shell">
        <Link to="/course" className="page-back-link">
          ← Back to Course
        </Link>
        <div className="rb-card">
          <p className="rb-eyebrow">AI Feedback</p>
          <h1 className="rb-title">Report Feedback</h1>

          <div className="rb-feedback-block rb-feedback-block--good">
            <p className="rb-feedback-block__heading">What's working</p>
            <p className="rb-feedback-block__body">{feedback.wellDone}</p>
          </div>

          <div className="rb-feedback-block rb-feedback-block--improve">
            <p className="rb-feedback-block__heading">What to improve</p>
            <p className="rb-feedback-block__body">{feedback.improve}</p>
          </div>

          <div className="rb-feedback-block">
            <p className="rb-feedback-block__heading">Suggested edits</p>
            <p className="rb-feedback-block__body">{feedback.suggestions}</p>
          </div>

          <div className="rb-nav">
            <button
              className="btn-secondary"
              onClick={() => setStep(REVIEW_STEP)}
            >
              ← Edit Report
            </button>
            <button
              className="btn-primary"
              onClick={() => setStep(FINAL_STEP)}
            >
              Download Report →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Final step (8) ────────────────────────────────────────────────────────

  if (step === FINAL_STEP) {
    return (
      <div className="rb-shell">
        <div className="rb-card rb-card--final">
          <p className="rb-final-icon">📄</p>
          <h1 className="rb-title">Your report is ready</h1>
          <p className="rb-prompt">
            Your investigation report has been completed. Download it to
            save and reference before taking the final exam.
          </p>
          <div className="rb-nav rb-nav--center">
            <button className="btn-primary" onClick={downloadReport}>
              Download Report (PDF)
            </button>
            <Link to="/course" className="btn-secondary">
              Back to Course →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
