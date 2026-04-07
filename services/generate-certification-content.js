// Full-certification AI content generator.
//
// Builds the EEOC skeleton payload, then replaces every lesson's content[]
// with AI-generated instructional prose by calling generateLessonContent()
// for each lesson in parallel.
//
// Payload shape is preserved exactly:
//   sourceSummary, curriculumOutline, lessons, examples,
//   sectionQuizzes (questions: []), finalExam (questions: [])
//
// _source traceability is kept on every lesson object — the AI generator
// reads it for grounding and passes it through on the returned lesson.
//
// Generation is parallel across all lessons (currently 25). Each call is
// independent so there are no ordering constraints. If rate limits become
// an issue, swap Promise.all for the batched helper below.

import { buildEeocCertificationSkeleton } from "./eeoc-certification-builder.js";
import { generateLessonContent }          from "./generate-lesson-content.js";
import { generateSectionQuiz }            from "./generate-section-quiz.js";
import { generateFinalExam }              from "./generate-final-exam.js";

// ── Optional: controlled-concurrency helper ───────────────────────────────────
// Uncomment and use withConcurrency(tasks, 5) instead of Promise.all if the
// Anthropic API returns 429s under full parallel load.
//
// async function withConcurrency(tasks, limit) {
//   const results = [];
//   let i = 0;
//   async function run() {
//     while (i < tasks.length) {
//       const idx = i++;
//       results[idx] = await tasks[idx]();
//     }
//   }
//   await Promise.all(Array.from({ length: limit }, run));
//   return results;
// }

// ── Main orchestrator ─────────────────────────────────────────────────────────

/**
 * Builds the full EEOC certification payload with AI-generated lesson prose.
 *
 * Steps:
 *   1. Fetch the live EEOC page and build the deterministic skeleton.
 *   2. Collect every lesson object (preserving section grouping and _source).
 *   3. Generate content[] for all lessons in parallel via Claude.
 *   4. Re-assemble the payload with filled lessons; leave quizzes and
 *      examples untouched (empty arrays — prose phase only).
 *
 * @returns {Promise<CertificationPayload>}  Full frontend-compatible payload.
 */
async function generateCertificationContent() {
  // ── Step 1: skeleton ──────────────────────────────────────────────────────
  const skeleton = await buildEeocCertificationSkeleton();

  // ── Step 2: flatten all lessons with their section index ──────────────────
  // We need to re-group by section after generation, so carry the index.
  const tasks = skeleton.lessons.flatMap((sectionGroup, si) =>
    sectionGroup.lessons.map((lesson, li) => ({ si, li, lesson }))
  );

  const DEBUG = process.env.DEBUG_CERT_GEN === '1';

  console.log(
    `[generate-certification-content] Starting — ${tasks.length} lessons across ${skeleton.lessons.length} sections`
  );

  // ── Step 3: parallel generation ───────────────────────────────────────────
  const filledLessons = await Promise.all(
    tasks.map(async ({ si, li, lesson }) => {
      if (DEBUG) console.log(`  → [${si + 1}/${li + 1}] ${lesson.title}`);
      const filled = await generateLessonContent(lesson);
      return { si, li, lesson: filled };
    })
  );

  console.log(`[generate-certification-content] Done — ${tasks.length} lessons generated`);

  // ── Step 4: re-assemble into section groups ───────────────────────────────
  const filledSections = skeleton.lessons.map((sectionGroup) => ({
    ...sectionGroup,
    lessons: sectionGroup.lessons.map((lesson) => lesson), // will be replaced below
  }));

  for (const { si, li, lesson } of filledLessons) {
    filledSections[si].lessons[li] = lesson;
  }

  // ── Step 5: generate section quizzes in parallel ──────────────────────────
  // Quizzes run after lessons are filled so the prompt can draw from real content.
  console.log(
    `[generate-certification-content] Generating quizzes — ${filledSections.length} sections`
  );

  const filledQuizzes = await Promise.all(
    filledSections.map(async (sectionGroup, si) => {
      if (DEBUG) console.log(`  → quiz [${si + 1}] ${sectionGroup.section}`);
      return generateSectionQuiz(sectionGroup);
    })
  );

  console.log(`[generate-certification-content] Done — ${filledSections.length} section quizzes generated`);

  // ── Step 6: generate final exam ───────────────────────────────────────────
  // Runs after section quizzes so the prompt can exclude already-used questions.
  console.log(`[generate-certification-content] Generating final exam`);

  const filledFinalExam = await generateFinalExam(
    filledSections,
    filledQuizzes,
    skeleton.finalExam,
  );

  console.log(
    `[generate-certification-content] Done — ${filledFinalExam.totalQuestions} final exam questions generated`
  );

  // ── Assemble final payload ────────────────────────────────────────────────
  return {
    sourceSummary:     skeleton.sourceSummary,
    curriculumOutline: skeleton.curriculumOutline,
    lessons:           filledSections,
    examples:          skeleton.examples,    // [] — prose phase only
    sectionQuizzes:    filledQuizzes,        // ← populated in step 5
    finalExam:         filledFinalExam,      // ← populated in step 6
    _meta:             skeleton._meta,
  };
}

export { generateCertificationContent };
