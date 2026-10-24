/** Lowercase words, split on anything that is not a letter. No stop list. */
export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter(Boolean);
}

/**
 * One weight per word per document: tf = count / document length, and
 * idf = ln((1 + N) / (1 + df)) + 1, scikit-learn's smoothed idf.
 */
export function tfidf(docs: string[][]): Map<string, number>[] {
  const n = docs.length;
  const df = new Map<string, number>();
  for (const d of docs) for (const w of new Set(d)) df.set(w, (df.get(w) ?? 0) + 1);
  return docs.map((d) => {
    const counts = new Map<string, number>();
    for (const w of d) counts.set(w, (counts.get(w) ?? 0) + 1);
    const out = new Map<string, number>();
    for (const [w, c] of counts) out.set(w, (c / d.length) * (Math.log((1 + n) / (1 + df.get(w)!)) + 1));
    return out;
  });
}
