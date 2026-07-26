/**
 * Intelligent, fuzzy, case-insensitive, space-and-separator-agnostic search utility.
 * Provides GitHub/Notion/LinkedIn style forgiving search matching and relevance scoring.
 */

export interface FieldConfig<T = any> {
  field: keyof T | ((item: T) => string | string[] | undefined | null);
  weight?: number;
}

/**
 * Normalizes a string: converts to lowercase, removes punctuation/separators, collapses spaces.
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s]/g, ' ') // replace punctuation and separators with space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Removes ALL spaces and non-alphanumeric characters to form a clean compact string.
 * Example: "Sir C.R. Reddy" -> "sircrreddy", "Project-Hub" -> "projecthub"
 */
export function cleanCompactText(text: string | null | undefined): string {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Tokenizes text into clean word tokens.
 */
export function tokenizeText(text: string | null | undefined): string[] {
  const norm = normalizeText(text);
  if (!norm) return [];
  return norm.split(' ').filter(Boolean);
}

/**
 * Calculates Levenshtein Distance for fuzzy typo matching.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row: number[] = Array.from({ length: a.length + 1 }, (_, i) => i);

  for (let i = 1; i <= b.length; i++) {
    let prev = i;
    for (let j = 1; j <= a.length; j++) {
      const val = b[i - 1] === a[j - 1] ? row[j - 1] : Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      row[j - 1] = prev;
      prev = val;
    }
    row[a.length] = prev;
  }

  return row[a.length];
}

/**
 * Returns fuzzy similarity score between 0.0 and 1.0.
 */
export function fuzzySimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(a, b);
  return 1 - dist / maxLen;
}

/**
 * Evaluates how well targetText matches query string, returning a relevance score (0 = no match).
 * Priority Ranking:
 *  10000+ : Exact Match
 *  7000+  : Prefix Match
 *  5000+  : Compact Substring / Separator-agnostic match
 *  3000+  : Full Multi-Word Token Match (Order independent)
 *  1000+  : Partial Token Match
 *  100+   : Fuzzy Typo Match
 */
export function scoreTextMatch(targetText: string | null | undefined, rawQuery: string): number {
  if (!rawQuery || !rawQuery.trim()) return 1;
  if (!targetText) return 0;

  const normTarget = normalizeText(targetText);
  const compactTarget = cleanCompactText(targetText);
  const targetTokens = tokenizeText(targetText);

  const normQuery = normalizeText(rawQuery);
  const compactQuery = cleanCompactText(rawQuery);
  const queryTokens = tokenizeText(rawQuery);

  if (!normQuery || !compactQuery || queryTokens.length === 0) return 0;

  let score = 0;

  // 1. Exact Match
  if (normTarget === normQuery || compactTarget === compactQuery) {
    return 10000;
  }

  // 2. Prefix Match
  if (normTarget.startsWith(normQuery) || compactTarget.startsWith(compactQuery)) {
    score += 7000;
  }

  // 3. Compact Contains (Handles "c r r" -> "crr", "projecthub" -> "Project Hub", "PuttiRam" -> "Putti Ram")
  if (compactTarget.includes(compactQuery)) {
    score += 5000;
  } else if (normTarget.includes(normQuery)) {
    score += 4000;
  }

  // 4. Token Matching & Multi-word Order Independence (e.g. "Ram Putti" matching "Putti Ram", "CRR Engineering" matching "Sir C.R. Reddy College of Engineering")
  let matchedTokensCount = 0;
  let tokenScoreSum = 0;

  for (const qToken of queryTokens) {
    let bestTokenScore = 0;

    // Direct token search in target tokens
    for (const tToken of targetTokens) {
      if (tToken === qToken) {
        bestTokenScore = Math.max(bestTokenScore, 1000);
      } else if (tToken.startsWith(qToken)) {
        bestTokenScore = Math.max(bestTokenScore, 700);
      } else if (tToken.includes(qToken) || qToken.includes(tToken)) {
        bestTokenScore = Math.max(bestTokenScore, 400);
      } else if (qToken.length >= 3 && tToken.length >= 3) {
        const sim = fuzzySimilarity(qToken, tToken);
        if (sim >= 0.7) {
          bestTokenScore = Math.max(bestTokenScore, Math.round(350 * sim));
        }
      }
    }

    // Fallback: check compact target if token not found directly in target tokens
    if (bestTokenScore === 0 && compactTarget.includes(qToken)) {
      bestTokenScore = 500;
    }

    if (bestTokenScore > 0) {
      matchedTokensCount++;
      tokenScoreSum += bestTokenScore;
    }
  }

  if (matchedTokensCount > 0) {
    score += tokenScoreSum;

    // Multi-word bonus if all query tokens are present
    if (matchedTokensCount === queryTokens.length) {
      score += 3000;
    } else if (matchedTokensCount / queryTokens.length >= 0.5) {
      score += 1500;
    }
  }

  // 5. Global Fuzzy Match fallback if no direct matches found
  if (score === 0 && compactQuery.length >= 4) {
    const sim = fuzzySimilarity(compactQuery, compactTarget);
    if (sim >= 0.65) {
      score += Math.round(600 * sim);
    }
  }

  return score;
}

/**
 * Filters and ranks an array of items based on intelligent multi-field search logic.
 */
export function smartFilterItems<T>(
  items: T[],
  queryStr: string,
  fields: FieldConfig<T>[]
): T[] {
  if (!queryStr || !queryStr.trim()) return items;

  const scored = items.map((item) => {
    let maxScore = 0;
    let totalWeightedScore = 0;

    for (const cfg of fields) {
      const weight = cfg.weight ?? 1.0;
      let val: any;

      if (typeof cfg.field === 'function') {
        val = cfg.field(item);
      } else {
        val = item[cfg.field];
      }

      if (Array.isArray(val)) {
        for (const element of val) {
          const s = scoreTextMatch(String(element || ''), queryStr) * weight;
          maxScore = Math.max(maxScore, s);
          totalWeightedScore += s * 0.2;
        }
      } else if (val !== null && val !== undefined) {
        const s = scoreTextMatch(String(val), queryStr) * weight;
        maxScore = Math.max(maxScore, s);
        totalWeightedScore += s * 0.2;
      }
    }

    const finalScore = maxScore + totalWeightedScore;
    return { item, score: finalScore };
  });

  return scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}
