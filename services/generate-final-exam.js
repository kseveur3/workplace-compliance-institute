// AI final exam generator for the full EEOC certification.
//
// Generates 25–40 multiple-choice questions covering ALL course sections
// proportionally.  Runs after section quizzes so it can avoid duplicating
// those questions.
//
// Per-section allocation:
//   target  = clamp(numSections × 6, 25, 40)
//   perSection = max(4, floor(target / numSections))
//   Any remainder is added to the last section bucket.
//
// Difficulty mix enforced in the prompt:
//   40% foundational   — definitions, core rules, key thresholds
//   40% applied        — scenario-based, employer obligations
//   20% edge / judgment — nuanced situations, exceptions, borderline cases
//
// Output shape matches the frontend contract:
//   finalExam: {
//     totalQuestions: number,
//     passingScore:   "80%",
//     coverage:       string[],           // section titles
//     questions: [
//       { question, options, correctIndex, explanation }
//     ]
//   }

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// ── Allocation helper ─────────────────────────────────────────────────────────

function computeAllocation(numSections) {
  const target = Math.max(25, Math.min(40, numSections * 6));
  const base   = Math.max(4, Math.floor(target / numSections));
  const alloc  = Array(numSections).fill(base);
  // Distribute any remainder to the later sections (they tend to be more complex)
  let remainder = target - base * numSections;
  for (let i = numSections - 1; i >= 0 && remainder > 0; i--, remainder--) {
    alloc[i]++;
  }
  return alloc; // alloc[si] = number of questions for section si
}

// ── Prompt builder ────────────────────────────────────────────────────────────

/**
 * @param {object[]} filledSections  Section groups with filled lesson content.
 * @param {object[]} sectionQuizzes  Already-generated section quizzes (for deduplication).
 * @returns {{ system: string, user: string }}
 */
function buildFinalExamPrompt(filledSections, sectionQuizzes) {
  const numSections = filledSections.length;
  const alloc       = computeAllocation(numSections);
  const totalTarget = alloc.reduce((s, n) => s + n, 0);

  // Build a digest of existing section quiz questions (question text only)
  // so the model can avoid duplicating them.
  const existingQuestions = sectionQuizzes
    .flatMap((sq) => (sq.questions ?? []).map((q) => q.question))
    .filter(Boolean);

  const existingBlock = existingQuestions.length > 0
    ? `## Questions already used in section quizzes — DO NOT duplicate these\n${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
    : "";

  // Build per-section content digest (title + first 2 paragraphs per lesson)
  const sectionBlocks = filledSections.map((sg, si) => {
    const lessonDigest = sg.lessons.map((l, li) => {
      const preview = (l.content ?? []).slice(0, 2).join(" ");
      return `  Lesson ${li + 1}: ${l.title}\n  ${preview}`;
    }).join("\n\n");

    return `### Section ${si + 1}: ${sg.section} (${alloc[si]} questions required)\n${lessonDigest}`;
  }).join("\n\n---\n\n");

  // Per-section allocation instructions
  const allocInstructions = filledSections.map((sg, si) =>
    `- Section ${si + 1} (${sg.section}): exactly ${alloc[si]} questions`
  ).join("\n");

  const system = `You are a senior assessment designer for a professional certification program in federal equal employment opportunity (EEO) law. Your audience is HR professionals, managers, and workplace investigators.

Your job is to write the final certification exam — a comprehensive, rigorous assessment that validates mastery across the entire course, not just section-level recall.

Assessment design rules:
- Every question must be answerable from the course content provided.
- Do NOT reuse or closely paraphrase questions from the section quizzes listed.
- Vary question type across the exam:
    40% foundational  — key definitions, statutory thresholds, core legal rules
    40% applied       — workplace scenarios, employer obligations, investigator decisions
    20% edge/judgment — nuanced situations, statutory exceptions, borderline cases
- Each question has exactly 4 options. The correct answer must be unambiguous.
- Distractors must be plausible but clearly wrong to a well-prepared candidate.
- The correct answer position must vary — do not cluster correct answers at any one index.
- Plain professional language — no legalese beyond what was taught in the course.`;

  const user = `Generate the final certification exam for the EEO Investigator Certification course.

## Allocation — you MUST produce exactly these counts per section
${allocInstructions}
Total questions: ${totalTarget}

## Course content by section
${sectionBlocks}

${existingBlock}

## Output requirements
- Write exactly ${totalTarget} questions.
- Order them by section (all Section 1 questions first, then Section 2, etc.).
- Each question must include an "explanation" field: 1–2 sentences explaining why the correct answer is right, referencing the specific rule or concept from the course material.
- correctIndex is 0-based (0 = A, 1 = B, 2 = C, 3 = D).
- Vary the correct answer position across the exam — avoid patterns.

## Return format
Return ONLY a valid JSON array. No other text before or after.

[
  {
    "section": "Section 1",
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correctIndex": 0,
    "explanation": "..."
  }
]`;

  return { system, user, alloc, totalTarget };
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generates the full final certification exam.
 *
 * @param {object[]} filledSections  Section groups after lesson prose generation.
 * @param {object[]} sectionQuizzes  Generated section quizzes (for dedup).
 * @param {object}   skeletonExam    The skeleton's finalExam object (for coverage/passingScore).
 * @returns {Promise<object>}  finalExam payload: { totalQuestions, passingScore, coverage, questions }
 */
async function generateFinalExam(filledSections, sectionQuizzes, skeletonExam) {
  const { system, user, totalTarget } = buildFinalExamPrompt(filledSections, sectionQuizzes);

  const message = await client.messages.create({
    model:      "claude-opus-4-6",
    max_tokens: 8192,
    system,
    messages:   [{ role: "user", content: user }],
  });

  const raw = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  let questions;
  try {
    questions = JSON.parse(raw);
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error(`Final exam parse failed: no JSON array found in model response.`);
    questions = JSON.parse(match[0]);
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error(`Final exam generation returned empty array.`);
  }

  if (questions.length < 25) {
    console.warn(`[generate-final-exam] Warning: only ${questions.length} questions returned (expected ${totalTarget})`);
  }

  return {
    totalQuestions: questions.length,
    passingScore:   skeletonExam?.passingScore ?? "80%",
    coverage:       filledSections.map((sg) => sg.section),
    questions,
  };
}

export { generateFinalExam };
