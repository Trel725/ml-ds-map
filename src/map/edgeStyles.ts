import type { EdgeType } from '../data/schema';
import type { Box } from '../layout/layout';

export type EdgeMarker = 'arrow' | 'open-arrow' | 'bar' | 'none';

/** Line style per edge type. Width, dash and marker together are unique, so color is never the only cue. */
export const EDGE_STYLES: Record<EdgeType, { width: number; dash?: string; marker: EdgeMarker; muted?: boolean }> = {
  needs: { width: 1.5, marker: 'arrow' },
  'is-trained-by': { width: 3, marker: 'arrow' },
  solves: { width: 2, marker: 'open-arrow' },
  'is-special-case-of': { width: 1.5, dash: '4 4', marker: 'open-arrow' },
  'fixes-weakness-of': { width: 2, dash: '8 4', marker: 'arrow' },
  'is-built-from': { width: 2, dash: '2 4', marker: 'arrow' },
  controls: { width: 2, marker: 'bar' },
  'implemented-in': { width: 1, marker: 'none', muted: true },
  'not-same-as': { width: 1.5, dash: '8 3 2 3', marker: 'none' },
};

interface Pt {
  x: number;
  y: number;
}

const BEND = 0.15;
const center = (b: Box): Pt => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

function control(a: Pt, b: Pt): Pt {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // Perpendicular to the chord, 15% of its length (|(-dy, dx)| equals the chord length).
  return { x: (a.x + b.x) / 2 - dy * BEND, y: (a.y + b.y) / 2 + dx * BEND };
}

/** Where a ray from `from` toward the center of `box` first crosses the box border. */
function exitPoint(from: Pt, box: Box): Pt {
  const c = center(box);
  const dx = c.x - from.x;
  const dy = c.y - from.y;
  const tx = dx === 0 ? Infinity : box.w / 2 / Math.abs(dx);
  const ty = dy === 0 ? Infinity : box.h / 2 / Math.abs(dy);
  const t = Math.min(tx, ty, 1);
  return { x: c.x - dx * t, y: c.y - dy * t };
}

const f = (n: number) => Math.round(n * 100) / 100;

/**
 * A quadratic curve between box centers, bent perpendicular to the chord.
 * With `trim`, the ends are moved to the box borders so arrowheads stay visible.
 */
export function edgePath(a: Box, b: Box, opts: { trim?: boolean } = {}): string {
  const p0 = center(a);
  const p2 = center(b);
  const c = control(p0, p2);
  const s = opts.trim ? exitPoint(c, a) : p0;
  const e = opts.trim ? exitPoint(c, b) : p2;
  return `M ${f(s.x)} ${f(s.y)} Q ${f(c.x)} ${f(c.y)} ${f(e.x)} ${f(e.y)}`;
}

/** The curve's point at t = 0.5, for labels and badges. */
export function edgeMidpoint(a: Box, b: Box): Pt {
  const p0 = center(a);
  const p2 = center(b);
  const c = control(p0, p2);
  return { x: 0.25 * p0.x + 0.5 * c.x + 0.25 * p2.x, y: 0.25 * p0.y + 0.5 * c.y + 0.25 * p2.y };
}
