import Fuse from 'fuse.js';
import type { Node } from '../data/schema';

export interface SearchResult {
  id: string;
  label: string;
  group: string;
}

const MAX_RESULTS = 8;

/** Lowercase, drop apostrophes, dots and commas, collapse whitespace. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Fuzzy search over node labels (weight 2) and synonyms (weight 1). */
export function createSearch(nodes: Node[]): (query: string) => SearchResult[] {
  const docs = nodes.map((n) => ({ id: n.id, label: n.label, group: n.group, l: normalize(n.label), s: n.synonyms.map(normalize) }));
  const fuse = new Fuse(docs, {
    keys: [
      { name: 'l', weight: 2 },
      { name: 's', weight: 1 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
  });
  return (query) => {
    const q = normalize(query);
    if (!q) return [];
    return fuse.search(q, { limit: MAX_RESULTS }).map(({ item }) => ({ id: item.id, label: item.label, group: item.group }));
  };
}
