// EEOC title-normalization layer.
//
// Converts raw lesson titles produced by the lesson-split planner into
// learner-facing names that sound like real course content rather than
// parser output.  No AI, fully deterministic.
//
// ── Normalization strategy ────────────────────────────────────────────────────
//
// Four lookup tables work together:
//
//   SECTION_TITLE_MAP    sectionTitle (from taxonomy) → learner-facing section name
//
//   LESSON_TITLE_MAP     raw lesson title → normalized title.
//                        Covers all simple (unsplit) lesson titles and all parent
//                        lesson titles in case they appear without a split.
//
//   PARENT_NORM_MAP      parent lesson title → short normalized prefix used when
//                        composing sublesson titles ("EEO Law Overview", etc.).
//
//   LAW_GROUP_MAP        law-abbreviation suffix (exactly as titleFromLaws()
//                        produces it) → learner-friendly topic label.
//                        Covers the three canonical 3-law groups produced by
//                        splitting 9-law lessons, plus 2-law and 1-law groups.
//
// normalizeTitle(rawTitle, parentTitle) applies these in order:
//   1. Exact match in LESSON_TITLE_MAP
//   2. "Parent — Part N of M" → "NormalizedParent (Part N)"
//   3. "Parent: suffix"       → "NormalizedParent: NormalizedSuffix"
//   4. Fallback: raw title unchanged
//
// Because parentLessonTitle is always passed in alongside rawTitle, the prefix
// is stripped by length — not by string-splitting at the first colon — so
// double-colon titles like "Who Must Comply: Coverage and Thresholds: EPA, ..."
// are handled correctly.
//
// ── Ordering ─────────────────────────────────────────────────────────────────
//
// LESSON_PARENT_ORDER controls the display order of parent lessons within a
// section.  It matches the COURSE_TAXONOMY order from eeoc-lesson-map.js.
// Sublessons of the same parent appear in the order the split planner produced
// them.

import { buildEeocLessonSplit } from "./eeoc-lesson-split.js";

// ── Static lookup tables ──────────────────────────────────────────────────────

const SECTION_TITLE_MAP = new Map([
  ["The Legal Framework for Equal Employment Opportunity", "Federal EEO Law Foundations"],
  ["Protected Characteristics",                           "Protected Classes Under Federal Law"],
  ["Employer Obligations and Prohibited Practices",       "Employer Obligations Under EEO Law"],
  ["Enforcement, Retaliation, and Remedies",              "Filing, Enforcement, and Remedies"],
]);

// Covers every simple lesson title (unsplit) and every parent title.
const LESSON_TITLE_MAP = new Map([
  // ── Section 1 ───────────────────────────────────────────────────────────
  ["Overview of Federal EEO Laws",
   "Federal EEO Law Overview"],

  // ── Section 2: Protected Characteristics ────────────────────────────────
  ["Race, Color, Religion, Sex, and National Origin",
   "Title VII: Protected Characteristics"],
  ["Equal Pay and Sex-Based Wage Discrimination",
   "Equal Pay Basics"],
  ["Pregnancy, Childbirth, and Nursing",
   "Pregnancy and Related Protections"],
  ["Age Discrimination",
   "Age Discrimination Protections"],
  ["Disability Discrimination and Accommodation",
   "Disability Discrimination and the ADA"],
  ["Genetic Information",
   "Genetic Information Nondiscrimination (GINA)"],

  // ── Section 3: Employer Obligations ─────────────────────────────────────
  ["Who Must Comply: Coverage and Thresholds",
   "Who Must Comply with EEO Law"],
  ["Prohibited Employment Practices and Harassment",
   "Harassment and Other Prohibited Practices"],
  ["Reasonable Accommodations Across Laws",
   "ADA Accommodation Principles"],

  // ── Section 4: Enforcement ───────────────────────────────────────────────
  ["Retaliation Protections",
   "How Retaliation Protections Work"],
  ["Filing a Charge of Discrimination",
   "How to File an EEOC Charge"],
  ["Remedies and Available Relief",
   "Available Remedies Under EEO Law"],
]);

// Short normalized prefix for each parent — used when composing sublesson titles.
const PARENT_NORM_MAP = new Map([
  ["Overview of Federal EEO Laws",              "EEO Law Overview"],
  ["Who Must Comply: Coverage and Thresholds",  "Who Must Comply"],
  ["Prohibited Employment Practices and Harassment", "Prohibited Practices"],
  ["Reasonable Accommodations Across Laws",     "Reasonable Accommodations"],
  ["Retaliation Protections",                   "Retaliation Protections"],
  ["Filing a Charge of Discrimination",         "Filing an EEOC Charge"],
  ["Remedies and Available Relief",             "Available Remedies"],
  ["Disability Discrimination and Accommodation", "Disability Discrimination"],
]);

// Law-abbreviation group strings → learner-friendly topic labels.
// Keys must match exactly what titleFromLaws() in eeoc-lesson-split.js produces.
const LAW_GROUP_MAP = new Map([
  // ── 3-law groups from 9-law lessons split into three (Overview, Coverage,
  //    Retaliation, Filing all share these same three canonical groups) ──────
  ["EPA, Title VII, PDA",                   "Pay Equity and Civil Rights Laws"],
  ["ADEA, Rehabilitation Act, ADA",         "Age and Disability Laws"],
  ["Civil Rights Act of 1991, GINA, PWFA",  "Modern EEO Statutes"],

  // ── 1-law groups (Disability: ADA + Rehabilitation Act split into 2) ─────
  ["ADA",                                   "Under the ADA"],
  ["Rehabilitation Act",                    "Under the Rehabilitation Act"],

  // ── 2-law groups (Accommodations: 4 laws chunked into 2 groups of 2) ─────
  ["ADA and Rehabilitation Act",            "Under the ADA and Rehabilitation Act"],
  ["PWFA and PDA",                          "Under Pregnancy-Related Laws"],

  // ── 3-law groups from 7-law Prohibited Practices if split in thirds ───────
  ["Title VII, ADEA, ADA",                  "Title VII, ADEA, and ADA"],
  ["Rehabilitation Act, EPA, GINA",         "Rehabilitation Act, EPA, and GINA"],
  ["PDA",                                   "Under the PDA"],

  // ── 3-law groups from Remedies (8 laws) if split in thirds ───────────────
  ["Civil Rights Act of 1991, Title VII, ADEA", "Civil Rights Act, Title VII, and ADEA"],
  ["ADA, Rehabilitation Act, EPA",              "ADA, Rehabilitation Act, and EPA"],
  ["GINA, PWFA",                                "GINA and PWFA"],
]);

// Canonical order of parent lesson titles within the full curriculum.
// Controls the display order when assembling sections.
const LESSON_PARENT_ORDER = [
  "Overview of Federal EEO Laws",
  "Race, Color, Religion, Sex, and National Origin",
  "Equal Pay and Sex-Based Wage Discrimination",
  "Pregnancy, Childbirth, and Nursing",
  "Age Discrimination",
  "Disability Discrimination and Accommodation",
  "Genetic Information",
  "Who Must Comply: Coverage and Thresholds",
  "Prohibited Employment Practices and Harassment",
  "Reasonable Accommodations Across Laws",
  "Retaliation Protections",
  "Filing a Charge of Discrimination",
  "Remedies and Available Relief",
];

// ── Normalization function ────────────────────────────────────────────────────

/**
 * Normalizes a raw lesson/sublesson title into a learner-facing name.
 *
 * @param {string}      rawTitle     – the title as produced by the split planner
 * @param {string|null} parentTitle  – parentLessonTitle from the sublesson object
 *                                     (null for unsplit lessons; pass rawTitle for
 *                                     parent-is-self case)
 * @returns {string} normalized title
 */
function normalizeTitle(rawTitle, parentTitle) {
  // 1. Exact match (covers all unsplit lesson titles and all parent titles).
  if (LESSON_TITLE_MAP.has(rawTitle)) return LESSON_TITLE_MAP.get(rawTitle);

  // For sublesson titles, parentTitle is the actual parent lesson title.
  // Use it to strip the prefix reliably even when the parent itself contains
  // colons (e.g. "Who Must Comply: Coverage and Thresholds").
  if (parentTitle && parentTitle !== rawTitle) {
    const normalizedParent =
      PARENT_NORM_MAP.get(parentTitle) ??
      LESSON_TITLE_MAP.get(parentTitle) ??
      parentTitle;

    // 2. "Parent — Part N of M"  →  "NormalizedParent (Part N)"
    const dashPrefix = `${parentTitle} — `;
    if (rawTitle.startsWith(dashPrefix)) {
      const suffix    = rawTitle.slice(dashPrefix.length);
      const partMatch = suffix.match(/^Part\s+(\d+)(?:\s+of\s+\d+)?$/i);
      if (partMatch) return `${normalizedParent} (Part ${partMatch[1]})`;
      // Non-part dash suffix (e.g. from subheading split with 3+ headings)
      return `${normalizedParent}: ${suffix}`;
    }

    // 3. "Parent: Suffix"  →  "NormalizedParent: NormalizedSuffix"
    //    Slice from parentTitle.length + 2 to handle double-colon parents.
    const colonPrefix = `${parentTitle}: `;
    if (rawTitle.startsWith(colonPrefix)) {
      const suffix          = rawTitle.slice(colonPrefix.length);
      const normalizedSuffix = LAW_GROUP_MAP.get(suffix) ?? suffix;
      return `${normalizedParent}: ${normalizedSuffix}`;
    }
  }

  // 4. Fallback — return unchanged (surfaced in output so it's visible).
  return rawTitle;
}

// ── Main builder ──────────────────────────────────────────────────────────────

/**
 * Calls buildEeocLessonSplit(), normalizes every section and lesson title,
 * and returns the final learner-facing curriculum outline grouped by section.
 *
 * Ordering within each section follows LESSON_PARENT_ORDER (taxonomy order),
 * with sublessons appearing in the same sequence the split planner produced
 * them (Part 1 before Part 2, etc.).
 *
 * @returns {{
 *   targetHours, totalPlannedMinutes, totalLessonCount,
 *   sections: [{
 *     section, originalSectionTitle, normalizedSectionTitle,
 *     totalMinutes, totalHours, lessonCount,
 *     lessons: [{
 *       originalTitle, normalizedTitle, section, plannedMinutes,
 *       sourceLaws, sourceSubheadings, parentLessonTitle
 *     }]
 *   }]
 * }}
 */
async function buildEeocNormalizedOutline() {
  const split = await buildEeocLessonSplit();

  // ── Flatten all output units into a single list ───────────────────────────
  // Each entry: { parentLessonTitle, rawTitle, section, sectionTitle,
  //               plannedMinutes, sourceLaws, sourceSubheadings }
  const flat = [];

  for (const sd of split.splitDetails) {
    for (const sl of sd.sublessons) {
      flat.push({
        parentLessonTitle:  sl.parentLessonTitle,
        rawTitle:           sl.sublessonTitle,
        section:            sl.section,
        sectionTitle:       sl.sectionTitle,
        plannedMinutes:     sl.plannedMinutes,
        sourceLaws:         sl.sourceLaws,
        sourceSubheadings:  sl.sourceSubheadings,
      });
    }
  }

  for (const ul of split.unsplitLessons) {
    flat.push({
      parentLessonTitle:  ul.title,
      rawTitle:           ul.title,
      section:            ul.section,
      sectionTitle:       ul.sectionTitle,
      plannedMinutes:     ul.plannedMinutes,
      sourceLaws:         ul.sourceLaws,
      sourceSubheadings:  ul.sourceSubheadings,
    });
  }

  // ── Sort by section then by parent position in the taxonomy ───────────────
  flat.sort((a, b) => {
    const sA = parseInt(a.section.replace("Section ", ""), 10);
    const sB = parseInt(b.section.replace("Section ", ""), 10);
    if (sA !== sB) return sA - sB;

    const pA = LESSON_PARENT_ORDER.indexOf(a.parentLessonTitle);
    const pB = LESSON_PARENT_ORDER.indexOf(b.parentLessonTitle);
    // Unknown parents sort to end; sublessons of the same parent keep stable order
    return (pA === -1 ? 999 : pA) - (pB === -1 ? 999 : pB);
  });

  // ── Normalize titles and group by section ─────────────────────────────────
  const sectionMap = new Map();

  for (const item of flat) {
    const normalizedTitle = normalizeTitle(item.rawTitle, item.parentLessonTitle);

    const key = item.section;
    if (!sectionMap.has(key)) {
      sectionMap.set(key, {
        section:               key,
        originalSectionTitle:  item.sectionTitle,
        normalizedSectionTitle: SECTION_TITLE_MAP.get(item.sectionTitle) ?? item.sectionTitle,
        totalMinutes:          0,
        lessonCount:           0,
        lessons:               [],
      });
    }

    const sec = sectionMap.get(key);
    sec.totalMinutes += item.plannedMinutes;
    sec.lessonCount  += 1;
    sec.lessons.push({
      originalTitle:      item.rawTitle,
      normalizedTitle,
      section:            item.section,
      plannedMinutes:     item.plannedMinutes,
      plannedHours:       (item.plannedMinutes / 60).toFixed(1),
      sourceLaws:         item.sourceLaws,
      sourceSubheadings:  item.sourceSubheadings,
      parentLessonTitle:  item.parentLessonTitle,
    });
  }

  const sections = [...sectionMap.values()].map((sec) => ({
    ...sec,
    totalHours: (sec.totalMinutes / 60).toFixed(1),
  }));

  return {
    targetHours:         split.targetHours,
    totalPlannedMinutes: split.totalPlannedMinutes,
    totalLessonCount:    split.summary.totalLessonsAfterSplit,
    sections,
    _meta: {
      splitThresholdMinutes: split.splitThresholdMinutes,
      originalLessonCount:   split.summary.originalLessonCount,
      lessonsWereSplit:      split.summary.lessonsRequiringSplit,
    },
  };
}

export { buildEeocNormalizedOutline, normalizeTitle };
