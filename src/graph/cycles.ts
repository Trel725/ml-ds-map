/**
 * Finds directed cycles with a DFS that tracks the current path (the on-stack set).
 * Each cycle is returned once as a closed path rotated to start at its smallest id.
 */
export function findCycles(ids: string[], edges: { from: string; to: string }[]): string[][] {
  const out = new Map<string, string[]>();
  for (const id of ids) out.set(id, []);
  for (const e of edges) {
    if (!out.has(e.from)) out.set(e.from, []);
    out.get(e.from)!.push(e.to);
  }

  const done = new Set<string>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const found = new Map<string, string[]>();

  const visit = (id: string) => {
    stack.push(id);
    onStack.add(id);
    for (const next of out.get(id) ?? []) {
      if (onStack.has(next)) {
        const ring = stack.slice(stack.indexOf(next));
        const start = ring.indexOf([...ring].sort()[0]);
        const rotated = [...ring.slice(start), ...ring.slice(0, start)];
        const key = rotated.join('\u0000');
        if (!found.has(key)) found.set(key, [...rotated, rotated[0]]);
      } else if (!done.has(next)) {
        visit(next);
      }
    }
    stack.pop();
    onStack.delete(id);
    done.add(id);
  };

  for (const id of [...out.keys()].sort()) if (!done.has(id)) visit(id);
  return [...found.values()];
}
