/** True when `ids` holds exactly `expected`, so a highlight belongs to this node's own trace. */
export function sameIds(ids: Set<string>, expected: Iterable<string>): boolean {
  const want = new Set(expected);
  return ids.size === want.size && [...want].every((id) => ids.has(id));
}
