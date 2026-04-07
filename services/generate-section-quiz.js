// AI quiz generator for a single EEOC course section.
//
// Takes a section group object (as assembled in generate-certification-content.js
// after lessons have been filled) and generates 5–10 multiple-choice questions
// grounded in:
//   • the filled lesson content[] paragraphs
//   • each lesson's _source.sourceLaws
//
// Each question includes: question, options (4), correctIndex.
// Returns the section quiz object: { section, questions: [...] }

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// ── Prompt builder ────────────────────────────────────────────────────────────

/**
 * @param {{ section: string, lessons: { title: string, content: string[], _source: { sourceLaws: string[] } }[] }} sectionGroup
 * @returns {{ system: string, user: string }}
 */
function buildSectionQuizPrompt(sectionGroup) {
  const { section, lessons } = sectionGroup;

  // Collect unique laws across all lessons in this section
  const allLaws = [
    ...new Set(lessons.flatMap((l) => l._source?.sourceLaws ?? [])),
  ];

  // Build a compact lesson digest for the prompt — titles + first two content
  // paragraphs each (enough for grounding without blowing context)
  const lessonDigest = lessons
    .map((lesson, i) => {
      const preview = (lesson.content ?? []).slice(0, 2).join(" ");
      return `### Lesson ${i + 1}: ${lesson.title}\n${preview}`;
    })
    .join("\n\n");

  const system = `You are a quiz author for a professional certification course on federal equal employment opportunity (EEO) law. Your audience is HR professionals, managers, and workplace investigators.

Your job is to write multiple-choice assessment questions that test genuine comprehension of the lesson material — not trick questions, not trivia, not questions answerable by common sense alone.

Rules:
- Every question must be directly answerable from the lesson content provided.
- Questions must vary in focus: definitions, application scenarios, procedural steps, legal thresholds, employer obligations.
- The correct answer must be clearly correct based on the material.
- The three distractors must be plausible but clearly wrong to someone who studied the material.
- No duplicate or near-duplicate questions.
- Plain language — no legalese beyond terms taught in the lessons.`;

  const user = `Generate a section quiz for the following EEO course section.

## Section
${section}

## Statutes covered in this section
${allLaws.join(", ")}

## Lesson content (use this as the sole grounding source)
${lessonDigest}

## Output requirements
- Write exactly 8 questions (allow 5–10 range).
- Each question has exactly 4 answer options (A–D).
- correctIndex is 0-based (0 = A, 1 = B, 2 = C, 3 = D).
- Vary the position of the correct answer — do not always put it at index 0.
- Mix question types: ~3 knowledge/recall, ~3 application/scenario, ~2 procedural.

## Return format
Return ONLY a valid JSON array. No other text before or after.

Each question MUST include an "explanation" field: 1–2 sentences that explain why the correct answer is right. Reference the specific legal concept or lesson content that supports it.

[
  {
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correctIndex": 0,
    "explanation": "..."
  }
]`;

  return { system, user };
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generates 5–10 multiple-choice quiz questions for one section group.
 *
 * @param {{ section: string, lessons: object[] }} sectionGroup  Filled section (lessons have real content[]).
 * @returns {Promise<{ section: string, questions: object[] }>}
 */
async function generateSectionQuiz(sectionGroup) {
  const { system, user } = buildSectionQuizPrompt(sectionGroup);

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: user }],
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
    if (!match) throw new Error(`Section quiz parse failed for "${sectionGroup.section}": no JSON array found.`);
    questions = JSON.parse(match[0]);
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error(`Section quiz returned empty array for "${sectionGroup.section}".`);
  }

  return {
    section: sectionGroup.section,
    questions,
  };
}

export { generateSectionQuiz };
