// CEU renewal assessment generator.
//
// Generates a CeuContent-shaped payload in one API call:
//   modules:   4 learning modules, each with 3–4 scenario-based MCQs
//   finalExam: 20–25 MCQs spanning all four module themes
//
// Question structure: { id, question, options[], correctIndex }
// All content is grounded in federal EEO law and EEOC enforcement guidance.
//
// Runtime usage: loadActiveCeuContent() in App.tsx reads
// localStorage["generatedCeuContent"] and validates this shape.

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// ── Module themes ─────────────────────────────────────────────────────────────
// Four practical areas covering what a working EEO investigator needs to
// refresh annually. Lighter than full certification — focused on decisions,
// not law recall.

const CEU_MODULE_THEMES = [
  {
    id: "ceu-mod-1",
    theme: "Current Expectations & EEOC Trends",
    scope:
      "Recent EEOC guidance, updated enforcement priorities, and how current workplace trends (remote work, AI hiring tools, evolving protected class interpretations) affect investigator obligations.",
  },
  {
    id: "ceu-mod-2",
    theme: "Investigation Quality Risks",
    scope:
      "Common investigator errors that compromise report quality or create legal exposure: premature conclusions, inadequate documentation, witness credibility missteps, and failure to follow-up on material inconsistencies.",
  },
  {
    id: "ceu-mod-3",
    theme: "Modern Workplace Scenarios",
    scope:
      "Practical decision-making in current workplace contexts: hybrid and remote environments, social media evidence, multi-generational teams, third-party contractors, and intersectional complaints.",
  },
  {
    id: "ceu-mod-4",
    theme: "Decision & Documentation",
    scope:
      "How to reach a well-supported finding, write a defensible conclusion, and document the investigation in a way that withstands legal review — including what to include, what to exclude, and how to handle conflicting evidence.",
  },
];

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildCeuPrompt() {
  const system = `You are writing annual renewal assessment questions for certified EEO investigators and HR professionals who completed their initial certification 1–3 years ago.

This is NOT a law school exam. It is a practical renewal check designed to sharpen applied judgment, not retest foundational definitions.

Tone and style:
- Direct, professional, business-focused
- Questions read like real decisions the learner faces on the job
- No legal memo style — write as a senior investigator briefing a colleague
- Short scenario stems: 2–4 sentences max, then a clear decision question
- Answer options are plausible and reflect real workplace choices or common mistakes
- Exactly one option is clearly correct for an experienced investigator

What good questions look like:
- "You receive a complaint from a remote employee who says her manager excludes her from video meetings where promotions are discussed. She cannot point to a specific adverse action yet. What is the appropriate first step?"
- "During an investigation interview, the respondent offers you text messages that contradict the complainant's account. You have not yet interviewed the complainant about these messages. What should you do?"

What to avoid:
- Pure definition recall ("Title VII prohibits discrimination based on...")
- Trick questions or questions with two plausibly correct answers
- Vague scenario language that makes the correct answer obvious by elimination
- Repetitive scenarios across modules or between modules and the final exam`;

  const themesBlock = CEU_MODULE_THEMES
    .map((t, i) => `Module ${i + 1} — ${t.theme}:\n  ${t.scope}`)
    .join("\n\n");

  const user = `Generate a complete CEU renewal assessment payload with exactly 4 modules and a finalExam array.

## Module themes
${themesBlock}

## Question requirements (apply to all questions)
- Each question is a brief scenario or a targeted decision-point question
- Exactly 4 answer options per question
- correctIndex is 0-based integer (0 = first option, 3 = fourth)
- Vary correct answer positions — do not cluster correct answers at index 0 or 2
- Distractors must reflect real mistakes or reasonable-sounding wrong choices
- No duplicate scenarios or question stems across modules or final exam
- No filler questions with obviously wrong distractors

## Per-module requirements
- id: use the exact IDs listed above ("ceu-mod-1" through "ceu-mod-4")
- title: the module theme name (from the heading above, verbatim)
- summary: 2–3 sentences. What will the learner practice in this module? Why does it matter for their current work? (40–70 words)
- content: Deep instructional reading content structured with ## section headings. 6 sections, 1500–2500 words total. Write as a senior investigator briefing colleagues — direct, authoritative, practice-focused. Each section covers a distinct principle or decision area. No bullet lists in content; use full explanatory paragraphs. Non-repetitive across modules.
- examples: 4–6 realistic workplace scenarios with analysis. Each scenario is 2–4 sentences describing a real situation. The explanation (3–6 sentences) shows how the principle applies and what the correct action is, including what an investigator should do differently than a common error. Scenario text goes in "scenario", analysis goes in "explanation".
- guidance: 6–10 actionable takeaways the learner should remember after finishing the module. Each item is a single clear sentence starting with a verb or key term. No redundancy between items or between modules.
- caseStudies: 1–2 multi-step investigation case studies. Each case study has a scenario (3–6 sentences describing a realistic, complex workplace situation that an investigator must navigate), 3–5 questions (same structure as module questions — scenario-based decision points that arise from the case facts, testing multi-step reasoning not single-principle recall), and an explanation (4–8 sentences analyzing the key decisions and what the correct approach was and why). Case study questions are harder than module questions — they require applying multiple principles simultaneously. Scenario text goes in "scenario", explanation goes in "explanation", questions use the same { "question", "options", "correctIndex" } structure with unique IDs like "ceu-mod-1-cs1-q1".
- practicalExercises: 1–2 practical written exercises. Each exercise has: title (short, action-oriented), prompt (2–4 sentences describing a realistic investigator task using a specific scenario), instructions (3–5 bullet points telling the learner what to produce), sampleResponse (a model answer of 150–400 words that demonstrates best practice), and estimatedMinutes (integer, 20–30). Exercises should require active professional judgment — drafting documents, building plans, rewriting flawed work — not passive recall. No two exercises in the same module should cover the same task type.
- questions: exactly 3 questions per module, all scenario-based

## Final exam requirements
- 20 questions total (5 per module theme, in module order)
- All questions distinct from module questions — no reuse, no near-duplicates
- Higher decision complexity than module questions: present situations where the wrong choice is a common real-world mistake
- Same structure: { "question": "...", "options": [...4 strings...], "correctIndex": 0–3 }

## Return format
Return ONLY valid JSON. No markdown fences, no text before or after the JSON object.

{
  "modules": [
    {
      "id": "ceu-mod-1",
      "title": "...",
      "summary": "...",
      "content": "## Section Heading\\n\\nParagraph text...\\n\\n## Next Section\\n\\nMore text...",
      "examples": [
        { "scenario": "...", "explanation": "..." }
      ],
      "guidance": [
        "Actionable takeaway one.",
        "Actionable takeaway two."
      ],
      "caseStudies": [
        {
          "scenario": "...",
          "questions": [
            { "id": "ceu-mod-1-cs1-q1", "question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0 }
          ],
          "explanation": "..."
        }
      ],
      "practicalExercises": [
        {
          "title": "...",
          "prompt": "...",
          "instructions": ["...", "..."],
          "sampleResponse": "...",
          "estimatedMinutes": 25
        }
      ],
      "questions": [
        { "question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0 }
      ]
    }
  ],
  "finalExam": [
    { "question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0 }
  ]
}`;

  return { system, user };
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generates a full CEU assessment payload.
 *
 * @returns {Promise<{ modules: object[], finalExam: object[] }>}
 */
async function generateCeuContent() {
  const { system, user } = buildCeuPrompt();

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 16000,
    system,
    messages: [{ role: "user", content: user }],
  });

  const raw = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    // Fallback: extract JSON object from surrounding text/markdown
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Model did not return parseable JSON.");
    payload = JSON.parse(match[0]);
  }

  if (!Array.isArray(payload?.modules) || payload.modules.length === 0) {
    throw new Error("Generated payload is missing or has empty modules array.");
  }
  if (!Array.isArray(payload?.finalExam) || payload.finalExam.length === 0) {
    throw new Error("Generated payload is missing or has empty finalExam array.");
  }

  // ── Normalize: stamp IDs, fill missing summaries ─────────────────────────
  payload.modules = payload.modules.map((mod, mi) => ({
    ...mod,
    id:       mod.id       ?? `ceu-mod-${mi + 1}`,
    title:    mod.title    ?? `Module ${mi + 1}`,
    summary:  mod.summary  ?? "",
    content:     mod.content      ?? undefined,
    examples:    Array.isArray(mod.examples)     ? mod.examples     : undefined,
    guidance:    Array.isArray(mod.guidance)     ? mod.guidance     : undefined,
    caseStudies:         Array.isArray(mod.caseStudies)         ? mod.caseStudies         : undefined,
    practicalExercises:  Array.isArray(mod.practicalExercises)  ? mod.practicalExercises  : undefined,
    questions: (mod.questions ?? []).map((q, qi) => ({
      ...q,
      id: q.id ?? `ceu-mod-${mi + 1}-q-${qi + 1}`,
    })),
  }));

  payload.finalExam = payload.finalExam.map((q, i) => ({
    ...q,
    id: q.id ?? `ceu-final-q-${i + 1}`,
  }));

  // ── Validate question shape ───────────────────────────────────────────────
  function validateQuestion(q, label) {
    if (typeof q.question !== "string" || !q.question.trim()) {
      throw new Error(`${label}: question field is missing or empty.`);
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      throw new Error(`${label}: options must be an array with at least 2 items.`);
    }
    if (
      typeof q.correctIndex !== "number" ||
      q.correctIndex < 0 ||
      q.correctIndex >= q.options.length
    ) {
      throw new Error(
        `${label}: correctIndex ${q.correctIndex} is out of range (options.length=${q.options.length}).`,
      );
    }
  }

  for (const mod of payload.modules) {
    if (!Array.isArray(mod.questions) || mod.questions.length === 0) {
      throw new Error(`Module "${mod.id}" has no questions.`);
    }
    for (const q of mod.questions) {
      validateQuestion(q, `Module "${mod.id}" question "${q.id}"`);
    }
  }

  if (payload.finalExam.length < 10) {
    throw new Error(
      `finalExam has only ${payload.finalExam.length} questions — minimum 10 required.`,
    );
  }
  for (const q of payload.finalExam) {
    validateQuestion(q, `finalExam question "${q.id}"`);
  }

  return payload;
}

export { generateCeuContent };
