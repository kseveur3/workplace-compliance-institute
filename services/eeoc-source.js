// EEOC source retrieval service.
// Fetches the EEOC Equal Employment Opportunity Laws page for use as
// source material in AI-assisted certification generation (Phase 2).
//
// Does not parse content — returns raw html for downstream processing.

const EEOC_LAWS_URL = "https://www.eeoc.gov/equal-employment-opportunity-laws";

/**
 * Fetches the EEOC EEO Laws page.
 * @returns {{ url: string, fetchedAt: string, html: string }}
 */
async function fetchEeocLawsPage() {
  const response = await fetch(EEOC_LAWS_URL, {
    headers: {
      // Identify the request politely; some government sites reject no-UA requests.
      "User-Agent": "WorkplaceComplianceInstitute/1.0 (content-research; not a scraper)",
      "Accept": "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`EEOC fetch failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  return {
    url: EEOC_LAWS_URL,
    fetchedAt: new Date().toISOString(),
    html,
  };
}

/**
 * Fetches the EEOC EEO Laws page and returns cleaned plain text.
 * Strips structural chrome, boilerplate phrases, and HTML noise so the
 * result contains mostly the law/statute content from the page body.
 * @returns {{ url: string, fetchedAt: string, text: string, textLength: number }}
 */
async function fetchEeocLawsPageText() {
  const { html, fetchedAt } = await fetchEeocLawsPage();

  let text = html
    // ── Remove entire noisy structural blocks ─────────────────────────────
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<(nav|header|footer|aside|form)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    // ── Replace block elements with newlines to preserve sentence breaks ──
    .replace(/<\/?(p|div|li|h[1-6]|section|article|main|br)\b[^>]*>/gi, "\n")
    // ── Strip all remaining tags ──────────────────────────────────────────
    .replace(/<[^>]+>/g, " ")
    // ── Decode HTML entities ──────────────────────────────────────────────
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/&[a-z]+;/g, " ")
    // ── Collapse inline whitespace ────────────────────────────────────────
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // ── Anchor to the first real law heading ─────────────────────────────────
  // Drop everything before "Equal Pay Act of 1963" — the first statute listed
  // on the page — so the output starts directly at the law content.
  const anchorMatch = text.match(/Equal Pay Act of 1963/i);
  if (anchorMatch && anchorMatch.index !== undefined) {
    text = text.slice(anchorMatch.index);
  }

  // ── Trim trailing junk after the law list ─────────────────────────────────
  // The page ends its statute list before standard .gov footer sections.
  // Cut at the first occurrence of known trailing landmarks.
  const trailingAnchors = [
    /\brelated content\b/i,
    /\bfooter\b/i,
    /\bback to top\b/i,
    /\bcontact eeoc\b/i,
    /\breeoc\.gov\b/i,
    /\bfreedom of information act\b/i,
  ];
  for (const pattern of trailingAnchors) {
    const m = text.match(pattern);
    if (m && m.index !== undefined) {
      text = text.slice(0, m.index);
      break;
    }
  }

  // Final whitespace cleanup
  text = text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    url: EEOC_LAWS_URL,
    fetchedAt,
    text,
    textLength: text.length,
  };
}

// Ordered list of target EEO laws with regex patterns for heading detection.
//
// IMPORTANT: The order here must match the order headings appear on the EEOC page.
// The sequential scanner advances searchFrom after each match, so any law whose
// heading appears earlier in the text than the previous searchFrom will be missed.
//
// Confirmed page order (https://www.eeoc.gov/equal-employment-opportunity-laws):
//   Equal Pay Act (EPA) → Title VII → PDA → ADEA → Rehab Act →
//   ADA → Civil Rights Act of 1991 → GINA → PWFA
//
// Pattern rules:
// - Do NOT include anchors — findHeadingFrom() wraps patterns with (?:^|\n)\s*
// - Year is optional (some page variants omit it in the heading)
// - Abbreviations in parens are optional and may appear before OR after the year
// - findHeadingFrom() appends [^\n]* so trailing parens (e.g. "(EPA)") do not
//   break the end-of-line check — the full heading line is always captured
// - "Civil Rights Act" requires "1991" to avoid matching the Title VII heading
const EEO_LAW_HEADINGS = [
  {
    canonical: "Equal Pay Act of 1963",
    patterns: [
      /Equal Pay Act(?:\s+of\s+1963)?(?:\s+\(EPA\))?/,
    ],
  },
  {
    canonical: "Title VII of the Civil Rights Act of 1964",
    patterns: [
      /Title VII(?:\s+of\s+the\s+Civil Rights Act(?:\s+of\s+1964)?)?/,
    ],
  },
  // PDA (1978) appears BEFORE ADEA (1967) on the EEOC page — order must match.
  {
    canonical: "Pregnancy Discrimination Act (PDA) of 1978",
    patterns: [
      /Pregnancy Discrimination Act(?:\s+\(PDA\))?(?:\s+of\s+1978)?/,
      /Pregnancy Discrimination Act(?:\s+of\s+1978)?(?:\s+\(PDA\))?/,
    ],
  },
  {
    canonical: "Age Discrimination in Employment Act (ADEA) of 1967",
    patterns: [
      /Age Discrimination in Employment Act(?:\s+\(ADEA\))?(?:\s+of\s+1967)?/,
      /Age Discrimination in Employment Act(?:\s+of\s+1967)?(?:\s+\(ADEA\))?/,
    ],
  },
  {
    canonical: "Sections 501 and 505 of the Rehabilitation Act of 1973",
    patterns: [
      /Sections?\s+501\s+and\s+505\s+of\s+the\s+Rehabilitation Act(?:\s+of\s+1973)?/,
      /Rehabilitation Act(?:\s+of\s+1973)?(?:\s+\([^)]+\))?/,
    ],
  },
  {
    canonical: "Americans with Disabilities Act of 1990",
    patterns: [
      /Americans with Disabilities Act(?:\s+\(ADA\))?(?:\s+of\s+1990)?/,
      /Americans with Disabilities Act(?:\s+of\s+1990)?(?:\s+\(ADA\))?/,
    ],
  },
  {
    canonical: "Civil Rights Act of 1991",
    patterns: [
      /Civil Rights Act\s+of\s+1991/,  // year required — avoids matching Title VII heading
    ],
  },
  {
    canonical: "Genetic Information Nondiscrimination Act of 2008",
    patterns: [
      /Genetic Information Nondiscrimination Act(?:\s+\(GINA\))?(?:\s+of\s+2008)?/,
      /Genetic Information Nondiscrimination Act(?:\s+of\s+2008)?(?:\s+\(GINA\))?/,
    ],
  },
  {
    canonical: "Pregnant Workers Fairness Act of 2022",
    patterns: [
      /Pregnant Workers Fairness Act(?:\s+of\s+2022)?/,
    ],
  },
];

/**
 * Search for the first line-anchored match of any pattern, starting at fromIndex.
 *
 * Line-anchoring is the key: headings in the extracted text appear as standalone
 * lines (the HTML extractor emits \n for every block element). Cross-references
 * embedded mid-sentence on a longer line will NOT match because the law name is
 * not at the start of that line.
 *
 * The capture group is extended with [^\n]* so that any trailing parenthetical
 * abbreviations on the heading line (e.g. "(EPA)", "(PDA)") are included in the
 * matched length. Without this, a trailing ")" would cause the end-of-line check
 * to fail and the heading would silently go undetected.
 *
 * Returns { index, matchedLength } of the captured heading text, or null.
 */
function findHeadingFrom(text, patterns, fromIndex) {
  const slice = text.slice(fromIndex);
  let best = null;

  for (const pattern of patterns) {
    // Wrap: match the pattern at the start of a line, then capture the rest of
    // that line ([^\n]*) so trailing parentheticals don't break the match.
    const lineRe = new RegExp(
      "(?:^|\\n)[ \\t]*(" + pattern.source + "[^\\n]*)(?=\\n|$)",
      "i"
    );
    const m = lineRe.exec(slice);
    if (m) {
      // m.index = position of the \n (or 0), m[1] = full heading line text
      const headingOffset = m[0].indexOf(m[1]);
      const absIndex = fromIndex + m.index + headingOffset;
      if (!best || absIndex < best.index) {
        best = { index: absIndex, matchedLength: m[1].length };
      }
    }
  }

  return best;
}

/**
 * Fetches the EEOC EEO Laws page and splits it into per-law sections.
 *
 * Sequential scan: each heading search starts after the previous heading ended,
 * so later occurrences of a law name (in body text of an earlier section) are
 * never picked up as section headings.
 *
 * @returns {{ url: string, fetchedAt: string, sections: Array<{ title: string, body: string }> }}
 */
async function fetchEeocLawSections() {
  const { url, fetchedAt, text } = await fetchEeocLawsPageText();

  const found = [];
  let searchFrom = 0;

  for (const { canonical, patterns } of EEO_LAW_HEADINGS) {
    const match = findHeadingFrom(text, patterns, searchFrom);
    if (match) {
      found.push({
        title: canonical,
        index: match.index,
        matchedLength: match.matchedLength,
      });
      searchFrom = match.index + match.matchedLength;
    }
    // If not found: silently skip — do not merge into previous section
  }

  // Slice body strictly from heading-end to next-heading-start.
  const sections = found.map((entry, i) => {
    const start = entry.index + entry.matchedLength;
    const end = i + 1 < found.length ? found[i + 1].index : text.length;
    const body = text.slice(start, end).replace(/^\s*[\n:–\-]+\s*/, "").trim();
    return { title: entry.title, body };
  });

  const notFound = EEO_LAW_HEADINGS
    .filter(({ canonical }) => !found.some((f) => f.title === canonical))
    .map(({ canonical }) => canonical);

  const _debug = {
    lawDefinitions: EEO_LAW_HEADINGS.map(({ canonical, patterns }) => ({
      canonical,
      aliases: patterns.map((p) => p.source),
    })),
    detectedHeadings: found.map(({ title, index }) => ({ title, startIndex: index })),
    notFound,
    pdaPresent: found.some((f) => f.title === "Pregnancy Discrimination Act (PDA) of 1978"),
    civilRightsAct1991Present: found.some((f) => f.title === "Civil Rights Act of 1991"),
  };

  return { url, fetchedAt, sections, _debug };
}

/**
 * Classifies lines in a law section body into structural categories.
 *
 * After HTML stripping, block elements (h3, h4, li, p) all become \n-separated
 * lines. We use line length and word count as a proxy for element type:
 *
 *   short  (≤ 10 words, ≤ 70 chars, no trailing period)
 *          → likely a subheading or labelled list item converted from an h-tag
 *   long   (> 10 words)
 *          → paragraph text; capture the first ~160 chars as an "opener"
 *   junk   (< 3 chars, or pure punctuation)
 *          → skip
 *
 * @param {string} body  Cleaned section body from fetchEeocLawSections
 * @returns {{ subheadings: string[], paragraphCount: number, paragraphOpeners: string[] }}
 */
function classifySectionLines(body) {
  const subheadings = [];
  const paragraphOpeners = [];

  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (line.length < 3 || /^[\s\W]+$/.test(line)) continue;

    const wordCount = line.split(/\s+/).length;

    if (wordCount <= 10 && line.length <= 70 && !/\.$/.test(line)) {
      subheadings.push(line);
    } else if (wordCount > 10) {
      paragraphOpeners.push(
        line.length > 160 ? line.slice(0, 160) + "…" : line
      );
    }
    // Lines between 10–70 chars that end with a period are likely short
    // sentences; they are not interesting enough to surface on their own.
  }

  // Deduplicate subheadings while preserving order (duplicate short lines
  // can appear when the same label is repeated across bullet groups).
  const seen = new Set();
  const uniqueSubheadings = subheadings.filter((s) => {
    if (seen.has(s)) return false;
    seen.add(s);
    return true;
  });

  return {
    subheadings: uniqueSubheadings,
    paragraphCount: paragraphOpeners.length,
    paragraphOpeners,
  };
}

/**
 * Fetches and structurally analyzes the EEOC EEO laws page.
 *
 * For each detected law section, classifies body lines into subheadings
 * (short, heading-like lines) and paragraph openers (first ~160 chars of
 * substantive text blocks). Fully deterministic — no AI involved.
 *
 * This is a diagnostic utility. Its output is the basis for deciding:
 * - how many distinct course modules each law warrants
 * - which compliance topics appear under each law (coverage, prohibitions,
 *   remedies, enforcement) so that course category labels can be grounded
 *   in the actual statutory text rather than guessed
 *
 * @returns {{ url, fetchedAt, lawCount, notFound, outline }}
 */
async function analyzeEeocStructure() {
  const { url, fetchedAt, sections, _debug } = await fetchEeocLawSections();

  const outline = sections.map(({ title, body }) => {
    const { subheadings, paragraphCount, paragraphOpeners } =
      classifySectionLines(body);

    return {
      law: title,
      bodyLength: body.length,
      subheadings,
      paragraphCount,
      paragraphOpeners,
    };
  });

  return {
    url,
    fetchedAt,
    lawCount: sections.length,
    notFound: _debug.notFound,
    outline,
  };
}

export { fetchEeocLawsPage, fetchEeocLawsPageText, fetchEeocLawSections, analyzeEeocStructure };
