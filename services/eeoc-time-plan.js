// EEOC curriculum time-allocation planner.
//
// Deterministically distributes a 40-hour (2 400-minute) budget across the
// 13-lesson skeleton produced by buildEeocLessonMap().  No AI, no prose.
//
// ── Weight formula ────────────────────────────────────────────────────────────
//
// Each lesson's share of the 2 400-minute budget is proportional to:
//
//   weight = effectiveDepth × 12 + breadth × 10 + topicDiversity × 5
//
// where:
//   effectiveDepth  = paragraphCount / sourceLaws.length
//                     Normalises for cross-law lessons where paragraphCount
//                     sums every paragraph from every contributing section.
//                     Represents "average substantive paragraphs per law".
//
//   breadth         = sourceLaws.length
//                     A lesson touching 9 statutes requires comparative
//                     analysis; +10 min per additional statute is conservative.
//
//   topicDiversity  = sourceSubheadings.length
//                     More detected sub-topics → more distinct concepts
//                     to explain, illustrate, and check for understanding.
//
// ── Component split ───────────────────────────────────────────────────────────
//
//   baseInstruction     50%  — lecture / reading / explainer content
//   examples            20%  — worked examples drawn from source statutes
//   scenarioDiscussion  20%  — fact-pattern analysis and group discussion
//   quiz                10%  — knowledge checks and formative assessment
//
// All components are rounded to the nearest 5 minutes; the last component
// (quiz) absorbs any rounding remainder so lesson totals are exact.
//
// ── Scaling ───────────────────────────────────────────────────────────────────
//
// Raw proportional minutes are rounded to the nearest 5 per lesson.
// The remaining difference from 2 400 (always a multiple of 5) is added to
// the highest-weighted lesson, ensuring totalPlannedMinutes === 2 400.

import { buildEeocLessonMap } from "./eeoc-lesson-map.js";

const TARGET_MINUTES = 40 * 60; // 2 400

// Component split ratios — must sum to exactly 1.0.
// quiz is the remainder slot; it absorbs rounding so totals stay exact.
const SPLIT = {
  baseInstruction:    0.50,
  examples:           0.20,
  scenarioDiscussion: 0.20,
  // quiz = remainder (≈ 10%)
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const round5 = (n) => Math.round(n / 5) * 5;

/**
 * Lesson planning weight — see module header for full derivation.
 */
function lessonWeight({ sourceLaws, paragraphCount, sourceSubheadings }) {
  const lawCount      = Math.max(sourceLaws.length, 1);
  const effectiveDepth = paragraphCount / lawCount;
  const breadth        = lawCount;
  const topicDiversity = sourceSubheadings.length;
  return effectiveDepth * 12 + breadth * 10 + topicDiversity * 5;
}

/**
 * Splits a totalMinutes value into activity components.
 * Returns all values as multiples of 5; quiz is the exact remainder so that
 *   base + examples + scenario + quiz === total always.
 */
function splitMinutes(total) {
  const base     = round5(total * SPLIT.baseInstruction);
  const examples = round5(total * SPLIT.examples);
  const scenario = round5(total * SPLIT.scenarioDiscussion);
  const quiz     = total - base - examples - scenario; // absorbs rounding
  return { base, examples, scenario, quiz };
}

// ── Main planner ──────────────────────────────────────────────────────────────

/**
 * Builds a time-allocation plan for the 40-hour EEOC certification curriculum.
 *
 * @returns {{
 *   targetHours, targetMinutes, totalPlannedMinutes, totalPlannedHours,
 *   weightFormula, componentSplits,
 *   sectionPlans, lessonPlans,
 *   _meta
 * }}
 */
async function buildEeocTimePlan() {
  const {
    url, fetchedAt, lawCount, notFound, totalLessonCount, courseSections,
  } = await buildEeocLessonMap();

  // ── Flatten all lessons with section context ──────────────────────────────
  const flat = [];
  courseSections.forEach(({ sectionTitle, lessonTopics }, idx) => {
    lessonTopics.forEach((topic) => {
      flat.push({ ...topic, sectionIndex: idx, sectionTitle });
    });
  });

  // ── Compute weights ───────────────────────────────────────────────────────
  const weights    = flat.map(lessonWeight);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  // ── Proportional allocation, rounded to nearest 5 ────────────────────────
  const allocated = weights.map((w) => round5((w / totalWeight) * TARGET_MINUTES));

  // Fix rounding drift: remainder is always a multiple of 5 (both TARGET and
  // every allocated value are multiples of 5).  Assign to the heaviest lesson.
  const drift = TARGET_MINUTES - allocated.reduce((a, b) => a + b, 0);
  const heaviest = weights.indexOf(Math.max(...weights));
  allocated[heaviest] += drift;

  // ── Build per-lesson plans ────────────────────────────────────────────────
  const lessonPlans = flat.map((lesson, i) => {
    const total = allocated[i];
    const { base, examples, scenario, quiz } = splitMinutes(total);

    return {
      title:                       lesson.title,
      section:                     `Section ${lesson.sectionIndex + 1}`,
      sectionTitle:                lesson.sectionTitle,
      sourceLawCount:              lesson.sourceLaws.length,
      paragraphCount:              lesson.paragraphCount,
      subheadingCount:             lesson.sourceSubheadings.length,
      planningWeight:              Math.round(weights[i] * 10) / 10,
      baseInstructionMinutes:      base,
      exampleMinutes:              examples,
      scenarioDiscussionMinutes:   scenario,
      quizMinutes:                 quiz,
      totalMinutes:                total,
      totalHours:                  (total / 60).toFixed(1),
    };
  });

  // ── Build per-section plans ───────────────────────────────────────────────
  const sectionPlans = courseSections.map(({ sectionTitle, lessonTopics }, idx) => {
    const label = `Section ${idx + 1}`;
    const sls = lessonPlans.filter((lp) => lp.section === label);

    const sum = (key) => sls.reduce((a, lp) => a + lp[key], 0);
    const total = sum("totalMinutes");

    return {
      section:                   label,
      sectionTitle,
      lessonCount:               lessonTopics.length,
      totalMinutes:              total,
      totalHours:                (total / 60).toFixed(1),
      baseInstructionMinutes:    sum("baseInstructionMinutes"),
      exampleMinutes:            sum("exampleMinutes"),
      scenarioDiscussionMinutes: sum("scenarioDiscussionMinutes"),
      quizMinutes:               sum("quizMinutes"),
    };
  });

  // ── Top-level totals ──────────────────────────────────────────────────────
  const totalPlannedMinutes = lessonPlans.reduce((a, lp) => a + lp.totalMinutes, 0);

  return {
    targetHours:          40,
    targetMinutes:        TARGET_MINUTES,
    totalPlannedMinutes,
    totalPlannedHours:    (totalPlannedMinutes / 60).toFixed(1),

    // Surfaced so callers can audit the allocation logic.
    weightFormula: "effectiveDepth×12 + breadth×10 + topicDiversity×5  " +
                   "(effectiveDepth = paragraphCount / sourceLaws.length)",
    componentSplits: {
      baseInstruction:    "50%",
      examples:           "20%",
      scenarioDiscussion: "20%",
      quiz:               "≈10% (exact remainder after rounding other three)",
    },

    sectionPlans,
    lessonPlans,

    _meta: { url, fetchedAt, lawCount, notFound, totalLessonCount },
  };
}

export { buildEeocTimePlan };
