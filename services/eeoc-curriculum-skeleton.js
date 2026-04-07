// EEOC curriculum skeleton builder.
//
// Converts the deterministic lesson map produced by buildEeocLessonMap() into
// a certification-shaped payload that matches the contract the frontend already
// reads.  No prose is generated and no AI is used.  Content arrays are
// structured placeholder strings derived purely from the lesson map fields
// (title, sourceLaws, sourceSubheadings, paragraphCount) so the payload is
// fully re-computable from the live EEOC page.
//
// Payload contract (must stay aligned with buildStaticCertificationPayload):
//   sourceSummary        string
//   curriculumOutline    { section: string, lessons: number }[]
//   lessons              { section: string, lessons: { title, estimatedTime, content: string[] }[] }[]
//   examples             { title: string, scenario: string }[]
//   sectionQuizzes       { section: string, questions: [] }[]
//   finalExam            { totalQuestions, passingScore, coverage: string[], questions: [] }

import { buildEeocLessonMap } from "./eeoc-lesson-map.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Maps a lesson's paragraphCount to a rough time estimate.
 *
 * Calibrated against the existing static lessons (which average ~15 min for
 * 3 paragraphs and ~20–25 min for deeper topics):
 *
 *   ≤ 3 paragraphs  →  10 minutes   (concise single-law section)
 *   4–8             →  15 minutes   (standard lesson depth)
 *   9–14            →  20 minutes   (multi-law or detailed section)
 *   15+             →  25 minutes   (broad cross-law topic)
 */
function estimateTime(paragraphCount) {
  if (paragraphCount <= 3)  return "10 minutes";
  if (paragraphCount <= 8)  return "15 minutes";
  if (paragraphCount <= 14) return "20 minutes";
  return "25 minutes";
}

/**
 * Builds a deterministic placeholder content array for one lesson.
 *
 * Three lines, always:
 *   1. What this lesson covers (title)
 *   2. Which statutes contribute content (sourceLaws)
 *   3. Key in-section topics identified on the page (sourceSubheadings),
 *      or a fallback noting the raw paragraph depth when none were found
 *
 * The [SKELETON] tag lets downstream tooling identify placeholder entries
 * and replace them when prose generation is added.
 */
function buildPlaceholderContent({ title, sourceLaws, sourceSubheadings, paragraphCount }) {
  const lawList = sourceLaws.length > 0
    ? sourceLaws.join("; ")
    : "no matching statutes found on page";

  const topicsLine = sourceSubheadings.length > 0
    ? `Key statutory topics: ${sourceSubheadings.join("; ")}.`
    : `Content will draw from ${paragraphCount} substantive paragraph block${paragraphCount !== 1 ? "s" : ""} in source material (no discrete subheadings detected).`;

  return [
    `[SKELETON] This lesson covers: ${title}.`,
    `Grounded in ${sourceLaws.length} federal statute${sourceLaws.length !== 1 ? "s" : ""}: ${lawList}.`,
    topicsLine,
  ];
}

/**
 * Builds a short section label from a zero-based index.
 * Matches the convention the frontend uses: "Section 1", "Section 2", …
 */
const sectionLabel = (i) => `Section ${i + 1}`;

// ── Main builder ──────────────────────────────────────────────────────────────

/**
 * Fetches the live EEOC page, runs the lesson-map layer, and produces a
 * certification-shaped skeleton payload.
 *
 * All content arrays are deterministic placeholders — no AI, no prose.
 * examples[], sectionQuiz questions[], and finalExam questions[] are empty;
 * they will be populated when the prose-generation step is added.
 *
 * Returns the full frontend-compatible payload plus a _meta block with
 * diagnostic info (url, fetchedAt, notFound) that the route can expose
 * without it interfering with frontend consumers.
 *
 * @returns {{ sourceSummary, curriculumOutline, lessons, examples,
 *             sectionQuizzes, finalExam, _meta }}
 */
async function buildEeocCurriculumSkeleton() {
  const {
    url,
    fetchedAt,
    lawCount,
    notFound,
    totalLessonCount,
    courseSections,
  } = await buildEeocLessonMap();

  // ── sourceSummary ───────────────────────────────────────────────────────────
  // Collect unique laws in first-appearance order across all lessons.
  const seenLaws = new Set();
  const orderedUniqueLaws = [];
  for (const { lessonTopics } of courseSections) {
    for (const { sourceLaws } of lessonTopics) {
      for (const law of sourceLaws) {
        if (!seenLaws.has(law)) {
          seenLaws.add(law);
          orderedUniqueLaws.push(law);
        }
      }
    }
  }

  const sourceSummary =
    `Source material drawn from ${orderedUniqueLaws.length} EEOC-enforced federal ` +
    `statute${orderedUniqueLaws.length !== 1 ? "s" : ""}: ` +
    `${orderedUniqueLaws.join("; ")}. ` +
    `Curriculum spans ${courseSections.length} course section${courseSections.length !== 1 ? "s" : ""} ` +
    `and ${totalLessonCount} lesson topic${totalLessonCount !== 1 ? "s" : ""} grounded in ` +
    `statutory text retrieved from the EEOC Equal Employment Opportunity Laws page.`;

  // ── curriculumOutline ───────────────────────────────────────────────────────
  // { section: "Section N: <Title>", lessons: <count> }
  const curriculumOutline = courseSections.map(({ sectionTitle, lessonTopics }, i) => ({
    section: `${sectionLabel(i)}: ${sectionTitle}`,
    lessons: lessonTopics.length,
  }));

  // ── lessons ─────────────────────────────────────────────────────────────────
  // One group per course section; each lesson has a placeholder content array.
  const lessons = courseSections.map(({ lessonTopics }, i) => ({
    section: sectionLabel(i),
    lessons: lessonTopics.map((topic) => ({
      title: topic.title,
      estimatedTime: estimateTime(topic.paragraphCount),
      content: buildPlaceholderContent(topic),
    })),
  }));

  // ── examples ────────────────────────────────────────────────────────────────
  // Reserved for prose-generation phase.
  const examples = [];

  // ── sectionQuizzes ──────────────────────────────────────────────────────────
  // One entry per section; questions reserved for prose-generation phase.
  const sectionQuizzes = courseSections.map((_, i) => ({
    section: sectionLabel(i),
    questions: [],
  }));

  // ── finalExam ───────────────────────────────────────────────────────────────
  // Coverage strings derived from section titles.
  // Questions reserved for prose-generation phase.
  const finalExam = {
    totalQuestions: 0,
    passingScore: "80%",
    coverage: courseSections.map(({ sectionTitle }) => sectionTitle),
    questions: [],
  };

  return {
    sourceSummary,
    curriculumOutline,
    lessons,
    examples,
    sectionQuizzes,
    finalExam,
    _meta: {
      url,
      fetchedAt,
      lawCount,
      notFound,
      totalLessonCount,
    },
  };
}

export { buildEeocCurriculumSkeleton };
