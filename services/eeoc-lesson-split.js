// EEOC lesson-splitting planner.
//
// Inspects the time-allocated lesson plans from buildEeocTimePlan() and splits
// any lesson over SPLIT_THRESHOLD minutes into learner-friendly sublessons.
//
// ── Split strategy (in priority order) ───────────────────────────────────────
//
//   1. sourceSubheadings  — most specific; groups detected subheadings into
//      equal buckets.  Each bucket becomes one sublesson whose title reflects
//      the actual statutory topics it covers.
//
//   2. sourceLaws  — used when subheadings are too few.  Groups the contributing
//      laws into equal chunks.  Each sublesson covers a named subset of statutes.
//
//   3. Generic parts  — last resort when a lesson has only one law and no
//      usable subheadings (shouldn't occur in this curriculum, but guards
//      against future additions).  Named parts are drawn from a fixed table
//      indexed by sublesson count so results are reproducible.
//
// ── Time invariant ────────────────────────────────────────────────────────────
//
//   The sublessons produced from a split lesson sum to exactly the original
//   totalMinutes.  The program total is therefore unchanged.
//
// ── Data join ────────────────────────────────────────────────────────────────
//
//   buildEeocTimePlan() lessonPlans only carry sourceLawCount / subheadingCount
//   (counts, not arrays).  This planner concurrently fetches the lesson map to
//   obtain the actual arrays, then joins by lesson title.  Two page fetches are
//   made; that is acceptable for a diagnostic / planning route.

import { buildEeocTimePlan }   from "./eeoc-time-plan.js";
import { buildEeocLessonMap }  from "./eeoc-lesson-map.js";

// ── Configuration ─────────────────────────────────────────────────────────────

const SPLIT_THRESHOLD = 120; // minutes; lessons at or below this are kept whole

// Deterministic short name for each canonical law title.
// Used when generating sublesson titles for law-based splits.
const LAW_SHORT = new Map([
  ["Equal Pay Act of 1963",                                    "EPA"],
  ["Title VII of the Civil Rights Act of 1964",                "Title VII"],
  ["Pregnancy Discrimination Act (PDA) of 1978",               "PDA"],
  ["Age Discrimination in Employment Act (ADEA) of 1967",      "ADEA"],
  ["Sections 501 and 505 of the Rehabilitation Act of 1973",   "Rehabilitation Act"],
  ["Americans with Disabilities Act of 1990",                  "ADA"],
  ["Civil Rights Act of 1991",                                 "Civil Rights Act of 1991"],
  ["Genetic Information Nondiscrimination Act of 2008",        "GINA"],
  ["Pregnant Workers Fairness Act of 2022",                    "PWFA"],
]);

const lawShort = (canonical) =>
  LAW_SHORT.get(canonical) ?? canonical.split(/\s+/).slice(0, 3).join(" ");

// Learner-friendly generic part labels for the last-resort strategy.
// Indexed by intended sublesson count [2..5]; the last-resort path is only
// reached when a lesson has a single source law and no detected subheadings.
const GENERIC_PARTS = {
  2: [
    "Overview and Core Provisions",
    "Examples, Scenarios, and Review",
  ],
  3: [
    "Overview and Legal Background",
    "Core Provisions and Applications",
    "Scenario Analysis and Review",
  ],
  4: [
    "Overview and Legal Background",
    "Core Provisions and Prohibited Conduct",
    "Worked Examples and Scenario Analysis",
    "Knowledge Check and Review",
  ],
  5: [
    "Overview and Legal Background",
    "Core Provisions",
    "Prohibited Conduct and Exceptions",
    "Worked Examples and Scenarios",
    "Knowledge Check and Review",
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Splits `arr` into `n` contiguous groups as evenly as possible.
 * The first (arr.length % n) groups get one extra element.
 *
 * chunkInto(["a","b","c","d","e"], 3) → [["a","b"],["c","d"],["e"]]
 */
function chunkInto(arr, n) {
  const size = Math.ceil(arr.length / n);
  const groups = [];
  for (let i = 0; i < arr.length; i += size) {
    groups.push(arr.slice(i, i + size));
  }
  return groups;
}

/**
 * Distributes `totalMinutes` across `count` sublessons.
 *
 * Each value is a multiple of 5 (totalMinutes is always a multiple of 5 from
 * the time planner, so the excess is also always a multiple of 5).  The last
 * sublesson absorbs the rounding remainder (may be positive or negative ≤ ±5).
 */
function distributeTime(totalMinutes, count) {
  const base  = Math.round(totalMinutes / count / 5) * 5;
  const times = Array(count).fill(base);
  times[count - 1] += totalMinutes - base * count; // absorb remainder
  return times;
}

// Sublesson title generators
function titleFromSubheadings(parent, shs, partNum, partTotal) {
  if (shs.length === 1) return `${parent}: ${shs[0]}`;
  if (shs.length === 2) return `${parent}: ${shs[0]} and ${shs[1]}`;
  return `${parent} — Part ${partNum} of ${partTotal}`;
}

function titleFromLaws(parent, laws, partNum, partTotal) {
  const shorts = laws.map(lawShort);
  if (shorts.length === 1) return `${parent}: ${shorts[0]}`;
  if (shorts.length === 2) return `${parent}: ${shorts[0]} and ${shorts[1]}`;
  if (shorts.length === 3) return `${parent}: ${shorts.join(", ")}`;
  return `${parent} — Part ${partNum} of ${partTotal}`;
}

// ── Core split logic ──────────────────────────────────────────────────────────

/**
 * Attempts to split one enriched lesson plan into sublessons.
 *
 * Returns null if the lesson is within the threshold.
 * Returns a split record if a split is needed.
 *
 * @param {{ title, section, sectionTitle, totalMinutes, sourceLaws, sourceSubheadings }} lesson
 */
function splitLesson(lesson) {
  const { title, totalMinutes, sourceLaws, sourceSubheadings, section, sectionTitle } = lesson;

  if (totalMinutes <= SPLIT_THRESHOLD) return null;

  const targetCount = Math.ceil(totalMinutes / SPLIT_THRESHOLD);

  // ── Strategy 1: subheadings ─────────────────────────────────────────────
  if (sourceSubheadings.length >= targetCount) {
    const groups = chunkInto(sourceSubheadings, targetCount);
    const times  = distributeTime(totalMinutes, groups.length);

    return {
      originalTitle:   title,
      originalMinutes: totalMinutes,
      section,
      sectionTitle,
      splitBasis:      "subheadings",
      sublessonCount:  groups.length,
      sublessons: groups.map((shs, i) => ({
        parentLessonTitle: title,
        sublessonTitle:    titleFromSubheadings(title, shs, i + 1, groups.length),
        section,
        sectionTitle,
        plannedMinutes:    times[i],
        // All source laws still apply — the subheading scope narrows the topic.
        sourceLaws,
        sourceSubheadings: shs,
        splitBasis:        "subheadings",
      })),
    };
  }

  // ── Strategy 2: laws ────────────────────────────────────────────────────
  if (sourceLaws.length >= 2) {
    const actualCount = Math.min(targetCount, sourceLaws.length);
    const groups = chunkInto(sourceLaws, actualCount);
    const times  = distributeTime(totalMinutes, groups.length);

    return {
      originalTitle:   title,
      originalMinutes: totalMinutes,
      section,
      sectionTitle,
      splitBasis:      "laws",
      sublessonCount:  groups.length,
      sublessons: groups.map((laws, i) => ({
        parentLessonTitle:  title,
        sublessonTitle:     titleFromLaws(title, laws, i + 1, groups.length),
        section,
        sectionTitle,
        plannedMinutes:     times[i],
        sourceLaws:         laws,
        // Subheadings are not attributable to individual laws without further
        // analysis — leave empty so the split is self-consistent.
        sourceSubheadings:  [],
        splitBasis:         "laws",
      })),
    };
  }

  // ── Strategy 3: generic parts (last resort) ─────────────────────────────
  const cappedCount  = Math.min(targetCount, 5);
  const partLabels   = GENERIC_PARTS[cappedCount] ?? GENERIC_PARTS[4];
  const times        = distributeTime(totalMinutes, partLabels.length);

  return {
    originalTitle:   title,
    originalMinutes: totalMinutes,
    section,
    sectionTitle,
    splitBasis:      "generic",
    sublessonCount:  partLabels.length,
    sublessons: partLabels.map((label, i) => ({
      parentLessonTitle:  title,
      sublessonTitle:     `${title}: ${label}`,
      section,
      sectionTitle,
      plannedMinutes:     times[i],
      sourceLaws,
      sourceSubheadings:  [],
      splitBasis:         "generic",
    })),
  };
}

// ── Main builder ──────────────────────────────────────────────────────────────

/**
 * Fetches the time plan and lesson map concurrently, enriches each lesson plan
 * with the actual sourceLaws[] / sourceSubheadings[] arrays, then splits any
 * lesson over SPLIT_THRESHOLD minutes.
 *
 * Total program minutes are preserved: sublesson times always sum to the
 * original lesson's totalMinutes.
 *
 * @returns {{
 *   targetHours, totalPlannedMinutes, splitThresholdMinutes,
 *   summary, sectionSummary, splitDetails, unsplitLessons
 * }}
 */
async function buildEeocLessonSplit() {
  // Concurrent fetch — both internally call the EEOC page.
  const [timePlan, lessonMap] = await Promise.all([
    buildEeocTimePlan(),
    buildEeocLessonMap(),
  ]);

  // ── Enrich lessonPlans with actual arrays (join by title) ─────────────────
  const topicByTitle = new Map();
  for (const { lessonTopics } of lessonMap.courseSections) {
    for (const topic of lessonTopics) {
      topicByTitle.set(topic.title, topic);
    }
  }

  const enriched = timePlan.lessonPlans.map((lp) => {
    const topic = topicByTitle.get(lp.title) ?? {};
    return {
      ...lp,
      sourceLaws:        topic.sourceLaws        ?? [],
      sourceSubheadings: topic.sourceSubheadings ?? [],
    };
  });

  // ── Apply splits ──────────────────────────────────────────────────────────
  const splitDetails  = [];
  const unsplitLessons = [];

  for (const lesson of enriched) {
    const result = splitLesson(lesson);
    if (result) {
      splitDetails.push(result);
    } else {
      unsplitLessons.push({
        title:             lesson.title,
        section:           lesson.section,
        sectionTitle:      lesson.sectionTitle,
        plannedMinutes:    lesson.totalMinutes,
        sourceLaws:        lesson.sourceLaws,
        sourceSubheadings: lesson.sourceSubheadings,
      });
    }
  }

  // ── Per-section summary ───────────────────────────────────────────────────
  // Count resulting units (sublessons or intact lessons) per section label.
  const unitsBySection = new Map();

  for (const { section, sublessonCount } of splitDetails) {
    unitsBySection.set(section, (unitsBySection.get(section) ?? 0) + sublessonCount);
  }
  for (const { section } of unsplitLessons) {
    unitsBySection.set(section, (unitsBySection.get(section) ?? 0) + 1);
  }

  const sectionSummary = timePlan.sectionPlans.map((sp) => ({
    section:                sp.section,
    sectionTitle:           sp.sectionTitle,
    originalLessonCount:    sp.lessonCount,
    lessonCountAfterSplit:  unitsBySection.get(sp.section) ?? sp.lessonCount,
    totalMinutes:           sp.totalMinutes,
    totalHours:             sp.totalHours,
  }));

  // ── Top-level summary ─────────────────────────────────────────────────────
  const totalSublessonsFromSplits = splitDetails.reduce((a, s) => a + s.sublessonCount, 0);

  return {
    targetHours:          timePlan.targetHours,
    totalPlannedMinutes:  timePlan.totalPlannedMinutes,
    splitThresholdMinutes: SPLIT_THRESHOLD,

    summary: {
      originalLessonCount:        timePlan.lessonPlans.length,
      lessonsRequiringSplit:       splitDetails.length,
      unsplitLessonCount:          unsplitLessons.length,
      totalSublessonsFromSplits,
      totalLessonsAfterSplit:      unsplitLessons.length + totalSublessonsFromSplits,
    },

    // Per-section before/after counts, with total minutes unchanged.
    sectionSummary,

    // One entry per split lesson; includes the full sublesson array.
    splitDetails,

    // Lessons that needed no split.
    unsplitLessons,
  };
}

export { buildEeocLessonSplit };
