// Matching typed text against known titles. Pure.

// Lower-case, and turn anything that is not a letter or digit into a space,
// so "SPY×FAMILY", "spy x family" and "Spy-Family" can meet.
export function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

// How well one name answers the query: 3 = the name starts with it,
// 2 = a later word starts with it, 1 = it appears mid-word, 0 = no match.
// Mid-word hits need three letters, or one letter would match everything.
function scoreName(name, query) {
  if (name.startsWith(query)) return 3;
  if (name.includes(` ${query}`)) return 2;
  if (query.length >= 3 && name.includes(query)) return 1;
  return 0;
}

// `entries` are { anime, names } with names already normalized, listed most
// popular first. Returns the matching anime, best match first; ties keep the
// popularity order.
export function rankByQuery(entries, query, limit = 8) {
  const q = normalize(query);
  if (!q) return [];
  return entries
    .map((entry, index) => ({
      anime: entry.anime,
      index,
      score: Math.max(0, ...entry.names.map((name) => scoreName(name, q))),
    }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((hit) => hit.anime);
}
