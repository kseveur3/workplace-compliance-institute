// Display-layer title transformation.
//
// Converts stored lesson titles (as emitted by the backend normalization
// pipeline) into shorter, cleaner strings for the course page UI.
//
// Rules applied in order:
//   1. Exact lookup  — covers every known composed sublesson title
//   2. "Under the X" — ": Under the X" → " (X)"
//   3. "Under X"     — ": Under X"     → " (X)"
//   4. Year/section  — strips legal year suffixes, act amendment names,
//                      and Section references
//   5. Long law list — drops colon suffix when it's a comma-separated
//                      enumeration of statutes
//   6. Fallback      — returns the title unchanged

// ── 1. Exact lookup ───────────────────────────────────────────────────────────
// Keys = normalizedTitle values produced by the backend.
// Values = what the learner sees in the lesson list.

const DISPLAY_MAP = new Map<string, string>([
  // EEO Law Overview sublessons
  ["EEO Law Overview: Pay Equity and Civil Rights Laws",        "EEO Law Overview (Pay Equity)"],
  ["EEO Law Overview: Age and Disability Laws",                 "EEO Law Overview (Age & Disability)"],
  ["EEO Law Overview: Modern EEO Statutes",                     "EEO Law Overview (Modern Laws)"],

  // Who Must Comply sublessons
  ["Who Must Comply: Pay Equity and Civil Rights Laws",         "Who Must Comply (Pay Equity)"],
  ["Who Must Comply: Age and Disability Laws",                  "Who Must Comply (Age & Disability)"],
  ["Who Must Comply: Modern EEO Statutes",                      "Who Must Comply (Modern Laws)"],

  // Prohibited Practices sublessons
  ["Prohibited Practices: Title VII, ADEA, and ADA",            "Prohibited Practices (Title VII & ADEA)"],
  ["Prohibited Practices: Rehabilitation Act, EPA, and GINA",   "Prohibited Practices (Rehab Act & GINA)"],
  ["Prohibited Practices: Under the PDA",                       "Prohibited Practices (PDA)"],

  // Reasonable Accommodations sublessons
  ["Reasonable Accommodations: Under the ADA and Rehabilitation Act", "Accommodations (ADA & Rehab Act)"],
  ["Reasonable Accommodations: Under Pregnancy-Related Laws",   "Accommodations (Pregnancy)"],

  // Retaliation Protections sublessons — full base name kept for consistency
  ["Retaliation Protections: Pay Equity and Civil Rights Laws", "Retaliation Protections (Pay Equity)"],
  ["Retaliation Protections: Age and Disability Laws",          "Retaliation Protections (Age & Disability)"],
  ["Retaliation Protections: Modern EEO Statutes",              "Retaliation Protections (Modern Laws)"],

  // Filing an EEOC Charge sublessons — all three carry a qualifier
  ["Filing an EEOC Charge: Pay Equity and Civil Rights Laws",   "Filing an EEOC Charge (Pay Equity)"],
  ["Filing an EEOC Charge: Age and Disability Laws",            "Filing an EEOC Charge (Age & Disability)"],
  ["Filing an EEOC Charge: Modern EEO Statutes",                "Filing an EEOC Charge (Modern Laws)"],

  // Available Remedies sublessons
  ["Available Remedies: Civil Rights Act, Title VII, and ADEA", "Remedies (Civil Rights & Title VII)"],
  ["Available Remedies: ADA, Rehabilitation Act, and EPA",      "Remedies (ADA & Rehab Act)"],
  ["Available Remedies: GINA and PWFA",                         "Remedies (GINA & PWFA)"],

  // Disability Discrimination sublessons (ADA/Rehab Act split)
  ["Disability Discrimination: Under the ADA",                  "Disability Discrimination (ADA)"],
  ["Disability Discrimination: Under the Rehabilitation Act",   "Disability Discrimination (Rehab Act)"],
]);

// ── 2–5. Regex fallbacks ──────────────────────────────────────────────────────
// Applied only when no exact match is found.
// Ordered from most specific to most general.

const SUFFIX_RULES: [RegExp, string | ((m: string, ...g: string[]) => string)][] = [
  // "Title: Under the X"  →  "Title (X)"
  [/:\s+Under\s+the\s+(.+)$/, (_m: string, x: string) => ` (${x})`],

  // "Title: Under X"  →  "Title (X)"
  [/:\s+Under\s+(.+)$/, (_m: string, x: string) => ` (${x})`],

  // Strip year-based legal amendments/section references from anywhere in title
  // e.g. "Amendments of 1992 and Section 504" → ""
  [/\s+(Amendments\s+of\s+\d{4}|Section\s+\d+)(\s+and\s+.*)?$/i, ""],

  // Strip standalone year suffix: "of 1992", "of 2008" etc.
  [/\s+of\s+\d{4}\b.*$/i, ""],

  // Drop colon suffix that is a comma-separated list of statutes/acts
  // e.g. ": Title VII, ADEA, and ADA"  →  ""
  [/:\s+\w[^:]*,\s+\w[^:]*(?:,|\s+and\s+)\s*\w.*$/, ""],
];

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns a clean, learner-facing display title for a lesson.
 * Never mutates or discards the original title — falls back to it unchanged.
 */
export function displayTitle(title: string): string {
  // 1. Exact match
  if (DISPLAY_MAP.has(title)) return DISPLAY_MAP.get(title)!;

  // 2–5. Regex rules — apply the first matching rule
  for (const [pattern, replacement] of SUFFIX_RULES) {
    if (pattern.test(title)) {
      const result = typeof replacement === "string"
        ? title.replace(pattern, replacement).trim()
        : title.replace(pattern, replacement as (...args: string[]) => string).trim();
      if (result && result !== title) return result;
    }
  }

  // 6. Fallback
  return title;
}
