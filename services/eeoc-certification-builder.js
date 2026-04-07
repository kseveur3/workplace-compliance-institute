// EEOC certification skeleton builder — final assembly stage.
//
// Converts the normalized outline (sections + split lessons with learner-facing
// titles) into the exact certification payload shape the frontend already reads.
//
// Payload contract (must stay aligned with buildCertificationFromSeedData):
//   sourceSummary        string
//   curriculumOutline    { section: "Section N: <Title>", lessons: number }[]
//   lessons              { section: "Section N",
//                          lessons: { title, estimatedTime, content: string[] }[] }[]
//   examples             { title, scenario }[]       ← empty until prose phase
//   sectionQuizzes       { section, questions: [] }[]  ← empty until prose phase
//   finalExam            { totalQuestions, passingScore, coverage, questions: [] }
//
// All content arrays are deterministic [SKELETON] placeholders that reference
// normalizedTitle, originalTitle, sourceLaws, and sourceSubheadings so the
// link back to the source material is never lost.  Source traceability is
// also preserved in a _source field on each lesson object (extra fields are
// ignored by the frontend).
//
// Pipeline stages that feed this builder:
//   fetchEeocLawSections      (eeoc-source.js)
//   buildEeocLessonMap        (eeoc-lesson-map.js)
//   buildEeocTimePlan         (eeoc-time-plan.js)
//   buildEeocLessonSplit      (eeoc-lesson-split.js)
//   buildEeocNormalizedOutline (eeoc-normalize-titles.js)
//   buildEeocCertificationSkeleton ← this file

import { buildEeocNormalizedOutline } from "./eeoc-normalize-titles.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Converts a minute count to a human-readable duration string.
 *   55  → "55 minutes"
 *   60  → "1 hour"
 *   90  → "1 hour 30 minutes"
 *   150 → "2 hours 30 minutes"
 */
function formatTime(minutes) {
  if (minutes < 60) return `${minutes} minutes`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hLabel = `${h} hour${h !== 1 ? "s" : ""}`;
  return m === 0 ? hLabel : `${hLabel} ${m} minutes`;
}

/**
 * Builds a deterministic three-line placeholder content array for one lesson.
 *
 * Line 1 — normalizedTitle: what learners will see on the lesson card
 * Line 2 — sourceLaws: which statutes contribute content
 * Line 3 — sourceSubheadings (if any): key statutory topics detected on the
 *           live EEOC page, or a fallback note when no subheadings were found
 *
 * The [SKELETON] tag marks every entry so downstream tooling can replace them
 * without scanning for prose.
 *
 * The originalTitle is embedded in line 1 as a "(was: ...)" annotation so the
 * traceability is present even when reading raw content strings.
 */
function buildPlaceholderContent({ normalizedTitle, originalTitle, sourceLaws, sourceSubheadings }) {
  const traceNote = normalizedTitle !== originalTitle
    ? ` (parser title: "${originalTitle}")`
    : "";

  const lawLine = sourceLaws.length > 0
    ? sourceLaws.join("; ")
    : "no matching statutes detected on page";

  const topicsLine = sourceSubheadings.length > 0
    ? `Key statutory topics from source material: ${sourceSubheadings.join("; ")}.`
    : `Content draws from ${sourceLaws.length} contributing statute${sourceLaws.length !== 1 ? "s" : ""}` +
      ` (no discrete subheadings detected for this unit).`;

  return [
    `[SKELETON] ${normalizedTitle}${traceNote}.`,
    `Grounded in: ${lawLine}.`,
    topicsLine,
  ];
}

// ── Main builder ──────────────────────────────────────────────────────────────

/**
 * Fetches the live EEOC page, runs the full planning pipeline, and returns a
 * certification payload matching the contract the frontend already consumes.
 *
 * curriculumOutline  — normalized section titles + post-split lesson counts
 * lessons            — normalized titles, time from split planner, [SKELETON] content
 * examples           — [] (prose phase)
 * sectionQuizzes     — [] questions per section (prose phase)
 * finalExam          — [] questions, coverage from normalized section titles
 * _meta              — pipeline stages, time totals, lesson count (not part of
 *                      the frontend contract; extra fields are silently ignored)
 *
 * @returns {Promise<CertificationPayload>}
 */
async function buildEeocCertificationSkeleton() {
  const outline = await buildEeocNormalizedOutline();

  // ── sourceSummary ─────────────────────────────────────────────────────────
  // Collect unique laws in first-appearance order across all lesson units.
  const seenLaws = new Set();
  const orderedLaws = [];
  for (const sec of outline.sections) {
    for (const lesson of sec.lessons) {
      for (const law of lesson.sourceLaws) {
        if (!seenLaws.has(law)) {
          seenLaws.add(law);
          orderedLaws.push(law);
        }
      }
    }
  }

  const sourceSummary =
    `Source material drawn from ${orderedLaws.length} EEOC-enforced federal ` +
    `statute${orderedLaws.length !== 1 ? "s" : ""}: ${orderedLaws.join("; ")}. ` +
    `Curriculum spans ${outline.sections.length} course sections and ` +
    `${outline.totalLessonCount} lesson unit${outline.totalLessonCount !== 1 ? "s" : ""} ` +
    `grounded in statutory text retrieved from the EEOC Equal Employment Opportunity ` +
    `Laws page. Content placeholders are marked [SKELETON] and will be replaced ` +
    `during the prose-generation phase.`;

  // ── curriculumOutline ─────────────────────────────────────────────────────
  const curriculumOutline = outline.sections.map((sec) => ({
    section: `${sec.section}: ${sec.normalizedSectionTitle}`,
    lessons: sec.lessonCount,
  }));

  // ── lessons ───────────────────────────────────────────────────────────────
  const lessons = outline.sections.map((sec) => ({
    section: sec.section,
    lessons: sec.lessons.map((lesson) => ({
      title:         lesson.normalizedTitle,
      estimatedTime: formatTime(lesson.plannedMinutes),
      content:       buildPlaceholderContent(lesson),
      // _source is not part of the frontend contract but preserves full
      // traceability back to the parser and split planner.
      _source: {
        originalTitle:      lesson.originalTitle,
        parentLessonTitle:  lesson.parentLessonTitle,
        sourceLaws:         lesson.sourceLaws,
        sourceSubheadings:  lesson.sourceSubheadings,
        plannedMinutes:     lesson.plannedMinutes,
      },
    })),
  }));

  // ── examples ──────────────────────────────────────────────────────────────
  const examples = [];

  // ── sectionQuizzes ────────────────────────────────────────────────────────
  const sectionQuizzes = outline.sections.map((sec) => ({
    section:   sec.section,
    questions: [],
  }));

  // ── finalExam ─────────────────────────────────────────────────────────────
  const finalExam = {
    totalQuestions: 0,
    passingScore:   "80%",
    coverage:       outline.sections.map((sec) => sec.normalizedSectionTitle),
    questions:      [],
  };

  // ── _meta (diagnostic, not part of frontend contract) ────────────────────
  const _meta = {
    targetHours:         outline.targetHours,
    totalPlannedMinutes: outline.totalPlannedMinutes,
    totalLessonCount:    outline.totalLessonCount,
    pipelineStages: [
      "eeoc-source          → fetchEeocLawSections",
      "eeoc-lesson-map      → buildEeocLessonMap",
      "eeoc-time-plan       → buildEeocTimePlan",
      "eeoc-lesson-split    → buildEeocLessonSplit",
      "eeoc-normalize-titles→ buildEeocNormalizedOutline",
      "eeoc-certification-builder → buildEeocCertificationSkeleton",
    ],
  };

  return {
    sourceSummary,
    curriculumOutline,
    lessons,
    examples,
    sectionQuizzes,
    finalExam,
    _meta,
  };
}

export { buildEeocCertificationSkeleton };
