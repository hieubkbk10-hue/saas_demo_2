export const normalizeSearchText = (value: string) => value
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d")
  .replace(/[^a-z0-9\s]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const isSubsequence = (needle: string, haystack: string) => {
  if (!needle || !haystack) {
    return false;
  }
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j += 1) {
    if (needle[i] === haystack[j]) {
      i += 1;
    }
  }
  return i === needle.length;
};

const levenshteinDistance = (a: string, b: string, maxDistance = 2) => {
  const aLen = a.length;
  const bLen = b.length;

  if (Math.abs(aLen - bLen) > maxDistance) {
    return maxDistance + 1;
  }

  const prev = Array.from({ length: bLen + 1 }, (_, i) => i);
  const curr = Array.from({ length: bLen + 1 }, () => 0);

  for (let i = 1; i <= aLen; i += 1) {
    curr[0] = i;
    let rowMin = curr[0];

    for (let j = 1; j <= bLen; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      );
      rowMin = Math.min(rowMin, curr[j]);
    }

    if (rowMin > maxDistance) {
      return maxDistance + 1;
    }

    for (let j = 0; j <= bLen; j += 1) {
      prev[j] = curr[j];
    }
  }

  return prev[bLen];
};

const scoreNormalizedText = (candidate: string, query: string) => {
  if (!candidate || !query) {
    return 0;
  }

  if (candidate === query) {
    return 100;
  }
  if (candidate.startsWith(query)) {
    return 92;
  }
  if (candidate.includes(query)) {
    return 82;
  }

  const tokens = candidate.split(" ").filter(Boolean);
  for (const token of tokens) {
    if (token === query) {
      return 96;
    }
    if (token.startsWith(query)) {
      return 76;
    }
    if (token.includes(query)) {
      return 68;
    }
    const distance = levenshteinDistance(token, query, 2);
    if (distance === 1) {
      return 58;
    }
    if (distance === 2) {
      return 48;
    }
  }

  if (isSubsequence(query, candidate)) {
    return 42;
  }

  return 0;
};

export function rankByFuzzyMatches<T>(
  items: T[],
  query: string,
  getText: (item: T) => string | string[],
  minScore = 42,
) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return items.map((item) => ({ item, score: 0 }));
  }

  const scored = items
    .map((item) => {
      const raw = getText(item);
      const texts = Array.isArray(raw) ? raw : [raw];
      let best = 0;

      for (const text of texts) {
        const normalized = normalizeSearchText(text || "");
        const score = scoreNormalizedText(normalized, normalizedQuery);
        if (score > best) {
          best = score;
        }
      }

      return { item, score: best };
    })
    .filter((entry) => entry.score >= minScore)
    .sort((a, b) => b.score - a.score);

  return scored;
}
