// EEOC lesson-map service.
//
// Deterministic grouping layer that takes the per-law structural analysis
// produced by analyzeEeocStructure() and maps it into learner-facing course
// sections and lesson topics.
//
// Architecture
// ─────────────
// COURSE_TAXONOMY  – static table; defines sections, lessons, which laws
//                    contribute to each lesson, and keyword patterns for
//                    pulling matching subheadings out of those law sections.
//
// buildEeocLessonMap()  – runtime enrichment; fetches the live page outline,
//                         joins it against the taxonomy, and returns the
//                         fully populated course map.
//
// Grouping rules encoded in the taxonomy:
//  • Related laws are bundled into a single lesson (PDA + PWFA, ADA + Rehab Act)
//  • Horizontal concepts (retaliation, remedies, coverage) span ALL laws
//  • subheadingMatch patterns let each lesson cherry-pick only the subheadings
//    that are topically relevant from each contributing law section
//  • An empty subheadingMatch ([]) means "take every subheading from this
//    law section" — used for single-law or tightly scoped lessons where all
//    subheadings are on-topic

import { analyzeEeocStructure } from "./eeoc-source.js";

// ── Canonical law title constants ─────────────────────────────────────────────
// Must match exactly what fetchEeocLawSections() returns as `title`.

const EPA   = "Equal Pay Act of 1963";
const T7    = "Title VII of the Civil Rights Act of 1964";
const PDA   = "Pregnancy Discrimination Act (PDA) of 1978";
const ADEA  = "Age Discrimination in Employment Act (ADEA) of 1967";
const REHAB = "Sections 501 and 505 of the Rehabilitation Act of 1973";
const ADA   = "Americans with Disabilities Act of 1990";
const CRA91 = "Civil Rights Act of 1991";
const GINA  = "Genetic Information Nondiscrimination Act of 2008";
const PWFA  = "Pregnant Workers Fairness Act of 2022";

const ALL_LAWS = [EPA, T7, PDA, ADEA, REHAB, ADA, CRA91, GINA, PWFA];

// ── Static course taxonomy ────────────────────────────────────────────────────
//
// Each lesson entry:
//   title           – learner-facing lesson name
//   laws            – canonical titles of law sections that contribute content
//   subheadingMatch – regex[] tested against actual subheadings extracted from
//                     those sections; first match wins per subheading.
//                     Empty array [] → include ALL subheadings from source laws.
//
// Laws may appear in multiple lessons — a law's coverage language belongs in
// the "Coverage" lesson AND its prohibited-conduct language belongs in the
// "Prohibited Practices" lesson.  paragraphCount is intentionally not de-duped;
// it shows how much raw content each lesson has to draw from.

const COURSE_TAXONOMY = [
  {
    sectionTitle: "The Legal Framework for Equal Employment Opportunity",
    lessons: [
      {
        title: "Overview of Federal EEO Laws",
        // All nine laws contribute to the introductory landscape lesson.
        // subheadingMatch is empty so every detected subheading from every
        // section is surfaced — this gives the broadest possible topic list
        // for planners deciding how deep to go in later modules.
        laws: ALL_LAWS,
        subheadingMatch: [],
      },
    ],
  },

  {
    sectionTitle: "Protected Characteristics",
    lessons: [
      {
        // Title VII is the primary source; CRA91 strengthened its remedies
        // and explicitly covers race-based harassment, so it belongs here.
        title: "Race, Color, Religion, Sex, and National Origin",
        laws: [T7, CRA91],
        subheadingMatch: [
          /race|color|religion|sex\b|national origin|segregat|classif/i,
        ],
      },
      {
        // EPA is the dedicated pay-equity statute; Title VII covers pay
        // discrimination as part of its sex-discrimination prohibition.
        title: "Equal Pay and Sex-Based Wage Discrimination",
        laws: [EPA, T7],
        subheadingMatch: [/pay|wage|salary|compensat|equal work|sex\b/i],
      },
      {
        // PDA and PWFA are companion statutes — PDA defines pregnancy as
        // sex discrimination, PWFA adds the accommodation obligation.
        title: "Pregnancy, Childbirth, and Nursing",
        laws: [PDA, PWFA],
        subheadingMatch: [],
      },
      {
        title: "Age Discrimination",
        laws: [ADEA],
        subheadingMatch: [],
      },
      {
        // ADA covers private-sector disability; Rehab Act covers federal
        // agencies and federal contractors — same conceptual framework.
        title: "Disability Discrimination and Accommodation",
        laws: [ADA, REHAB],
        subheadingMatch: [],
      },
      {
        title: "Genetic Information",
        laws: [GINA],
        subheadingMatch: [],
      },
    ],
  },

  {
    sectionTitle: "Employer Obligations and Prohibited Practices",
    lessons: [
      {
        // Coverage rules differ by law (15+ employees, 20+ for ADEA, federal
        // agencies for Rehab Act, etc.) — important to surface across all laws.
        title: "Who Must Comply: Coverage and Thresholds",
        laws: ALL_LAWS,
        subheadingMatch: [
          /cover|employ|size|threshold|who\b|federal|private|state|local|contractor/i,
        ],
      },
      {
        // Core lesson: what actions are actually forbidden.
        // CRA91 and PWFA excluded here — their prohibitions are captured in
        // the Remedies lesson (CRA91) and the Pregnancy lesson (PWFA).
        title: "Prohibited Employment Practices and Harassment",
        laws: [T7, ADEA, ADA, REHAB, EPA, GINA, PDA],
        subheadingMatch: [
          /prohibit|unlawful|illegal|discriminat|harass|hostile|practice/i,
        ],
      },
      {
        // Accommodation spans four statutes; grouping them teaches the shared
        // interactive-process framework even though each law applies it differently.
        title: "Reasonable Accommodations Across Laws",
        laws: [ADA, REHAB, PWFA, PDA],
        subheadingMatch: [
          /accommodation|modif|adjust|undue hardship|interactive|pregnan|nursing|lactation/i,
        ],
      },
    ],
  },

  {
    sectionTitle: "Enforcement, Retaliation, and Remedies",
    lessons: [
      {
        // Retaliation prohibition exists in every statute — a single lesson
        // teaches the concept once and notes per-law nuances.
        title: "Retaliation Protections",
        laws: ALL_LAWS,
        subheadingMatch: [/retaliat|oppos|participat|report|whistleblow/i],
      },
      {
        // Filing procedures are consistent (EEOC intake), but deadlines and
        // applicable statutes differ — one lesson, all laws.
        title: "Filing a Charge of Discrimination",
        laws: ALL_LAWS,
        subheadingMatch: [
          /charg|filing|complaint|eeoc|time limit|deadline|\bdays\b|procedur|intake/i,
        ],
      },
      {
        // CRA91 is the primary remedies statute; it amended Title VII and ADA
        // to allow compensatory and punitive damages.  All laws have some remedy.
        title: "Remedies and Available Relief",
        laws: [CRA91, T7, ADEA, ADA, REHAB, EPA, GINA, PWFA],
        subheadingMatch: [
          /remedy|remedies|damage|relief|compensat|punitive|back pay|front pay|injunct|monetary/i,
        ],
      },
    ],
  },
];

// ── Runtime enrichment ────────────────────────────────────────────────────────

/**
 * Fetches the EEOC page, runs the structural analysis, then maps the output
 * into the COURSE_TAXONOMY to produce a fully populated lesson map.
 *
 * For each lesson topic the function collects:
 *   sourceLaws         – laws from the taxonomy that were actually detected
 *                        on the page (notFound laws are silently excluded)
 *   sourceSubheadings  – subheadings from those sections that match the
 *                        lesson's subheadingMatch patterns (or all subheadings
 *                        if the pattern list is empty), deduplicated
 *   paragraphCount     – sum of paragraphCount from all source law sections;
 *                        a rough proxy for how much body text this lesson
 *                        can draw from
 *
 * @returns {{ url, fetchedAt, lawCount, notFound, totalLessonCount, courseSections }}
 */
async function buildEeocLessonMap() {
  const { url, fetchedAt, lawCount, notFound, outline } =
    await analyzeEeocStructure();

  // Index outline entries by canonical law title for O(1) lookup.
  const byLaw = new Map(outline.map((entry) => [entry.law, entry]));

  let totalLessonCount = 0;

  const courseSections = COURSE_TAXONOMY.map(({ sectionTitle, lessons }) => {
    const lessonTopics = lessons.map(({ title, laws, subheadingMatch }) => {
      // Only include laws that were actually found on the page.
      const sourceLaws = laws.filter((l) => byLaw.has(l));

      const subheadingSet = new Set();
      let paragraphCount = 0;

      for (const law of sourceLaws) {
        const entry = byLaw.get(law);
        paragraphCount += entry.paragraphCount;

        const candidates = entry.subheadings;
        if (subheadingMatch.length === 0) {
          // No filter — include every subheading from this section.
          candidates.forEach((s) => subheadingSet.add(s));
        } else {
          // Filter to subheadings that match at least one pattern.
          for (const sh of candidates) {
            if (subheadingMatch.some((re) => re.test(sh))) {
              subheadingSet.add(sh);
            }
          }
        }
      }

      return {
        title,
        sourceLaws,
        sourceSubheadings: [...subheadingSet],
        paragraphCount,
      };
    });

    totalLessonCount += lessonTopics.length;
    return { sectionTitle, lessonTopics };
  });

  return {
    url,
    fetchedAt,
    lawCount,
    notFound,
    totalLessonCount,
    courseSections,
  };
}

export { buildEeocLessonMap, COURSE_TAXONOMY };
