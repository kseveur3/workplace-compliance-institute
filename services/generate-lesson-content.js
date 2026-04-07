// AI prose generator for a single EEOC lesson.
//
// Takes one lesson object (as emitted by the certification skeleton builder,
// including its _source metadata block) and replaces the [SKELETON] content[]
// array with real instructional paragraphs grounded in the listed statutes.
//
// Constraints enforced by the prompt:
//   • Only laws listed in _source.sourceLaws may be referenced.
//   • Plain instructional language — not legal-document style.
//   • Practical workplace examples woven into paragraphs.
//   • Target: 800–1 500 words (5–10 minutes of reading).
//   • No markdown, no headers, no bullet points — plain paragraphs only.
//   • Returns content[] as a JSON array of strings (one string = one paragraph).

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

// ── Prompt builder ────────────────────────────────────────────────────────────

/**
 * Builds the system + user prompt for a single lesson.
 *
 * @param {{ title: string, _source: { sourceLaws: string[], sourceSubheadings: string[], plannedMinutes: number } }} lesson
 * @returns {{ system: string, user: string }}
 */
function buildLessonPrompt(lesson) {
  const { title, _source } = lesson;
  const { sourceLaws, sourceSubheadings, plannedMinutes } = _source;

  const lawList = sourceLaws.join(", ");

  const topicsSection =
    sourceSubheadings.length > 0
      ? `Key statutory topics to cover (drawn from the source material):\n${sourceSubheadings.map((s) => `  - ${s}`).join("\n")}`
      : `No discrete subheadings were detected in the source material. Cover the core provisions of the statutes listed above as they apply to the lesson title.`;

  // Target word count: clamp plannedMinutes to the 5–10 min reading band,
  // then convert at 150 words/min (measured reading-with-comprehension pace).
  const clampedMinutes = Math.min(Math.max(plannedMinutes, 5), 10);
  const wordTarget = clampedMinutes * 150; // 750–1 500
  const paragraphTarget = Math.round(wordTarget / 120); // ~120 words/paragraph

  const system = `You are a curriculum writer for a professional certification course on federal equal employment opportunity (EEO) law. Your audience is non-lawyers: HR professionals, managers, and workplace investigators who need to understand EEO law in practical, plain terms.

Your job is to write the full instructional content for a single lesson. Your writing must be:
- Grounded exclusively in the federal statutes provided. Do not invent, paraphrase, or cite any law not in the provided list.
- Instructional in tone — teach the concept clearly, as if explaining to an attentive adult with no legal background.
- Practical — include real-world workplace scenarios and examples naturally within the paragraphs.
- Plain prose only — no markdown, no headers, no bullet points, no numbered lists. Every item in your output is a complete paragraph.
- Accurate — do not overstate or understate what a law requires.`;

  const user = `Write the complete lesson content for the following EEO certification lesson.

## Lesson title
${title}

## Statutes that ground this lesson
${lawList}

## ${topicsSection}

## Output requirements
- Write exactly ${paragraphTarget} paragraphs (allow ± 2).
- Each paragraph: 4–7 sentences, approximately 100–140 words.
- Total target: ~${wordTarget} words (${clampedMinutes}-minute read).
- The first paragraph introduces the topic and explains why it matters to the learner's work.
- The last paragraph summarizes the key takeaways a learner should leave with.
- Weave in at least two concrete workplace scenarios or examples across the lesson.
- Every factual claim must be traceable to one of the statutes listed above.
- Do not mention any statute, case, regulation, or legal body not in the provided statute list.

## Return format
Return ONLY a valid JSON array of strings. Each string is one paragraph. No other text before or after the array.

Example:
["First paragraph text.", "Second paragraph text.", "Third paragraph text."]`;

  return { system, user };
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generates real instructional content for a single lesson object.
 *
 * @param {object} lesson  A lesson as emitted by the skeleton builder, including _source.
 * @returns {Promise<object>}  Same lesson object with content[] replaced by AI prose.
 */
async function generateLessonContent(lesson) {
  if (!lesson?._source?.sourceLaws) {
    throw new Error("Lesson is missing _source.sourceLaws — cannot generate grounded content.");
  }

  const { system, user } = buildLessonPrompt(lesson);

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: user }],
  });

  // Extract the text block from the response.
  const raw = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  // Parse the JSON array Claude returned.
  let paragraphs;
  try {
    paragraphs = JSON.parse(raw);
  } catch {
    // Fallback: try to extract the array from within surrounding text.
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Model did not return a parseable JSON array.");
    paragraphs = JSON.parse(match[0]);
  }

  if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
    throw new Error("Model returned an empty or non-array response.");
  }

  // Return the lesson with content replaced; preserve everything else including _source.
  return {
    ...lesson,
    content: paragraphs,
  };
}

export { generateLessonContent };
