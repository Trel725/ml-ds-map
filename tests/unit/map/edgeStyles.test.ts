import { expect, test } from 'vitest';
import { EDGE_TYPES } from '../../../src/data/schema';
import { EDGE_STYLES, edgeMidpoint, edgePath } from '../../../src/map/edgeStyles';

test('every edge type has a style', () => expect(Object.keys(EDGE_STYLES).sort()).toEqual([...EDGE_TYPES].sort()));
test('no two types share width+dash+marker', () => {
  const sig = Object.values(EDGE_STYLES).map((s) => `${s.width}|${s.dash ?? ''}|${s.marker}`);
  expect(new Set(sig).size).toBe(sig.length);
});
test('implemented-in is muted with no marker', () => expect(EDGE_STYLES['implemented-in']).toMatchObject({ marker: 'none', muted: true }));

const a = { x: 0, y: 0, w: 20, h: 20 };
const b = { x: 200, y: 0, w: 20, h: 20 };
const nums = (d: string) => d.match(/-?\d+(\.\d+)?/g)!.map(Number);

test('edgePath starts at a center and ends at b center', () => {
  const d = edgePath(a, b);
  expect(d.startsWith('M')).toBe(true);
  expect(d).toContain('Q');
  const n = nums(d);
  expect(n.slice(0, 2)).toEqual([10, 10]);
  expect(n.slice(-2)).toEqual([210, 10]);
});
test('the control point sits 15% of the chord off the line', () => {
  const [, , cx, cy] = nums(edgePath(a, b));
  expect(cx).toBeCloseTo(110);
  expect(Math.abs(cy - 10)).toBeCloseTo(30);
});
test('trimmed path ends on the box borders, not the centers', () => {
  const n = nums(edgePath(a, b, { trim: true }));
  expect(n[0]).toBeGreaterThanOrEqual(19);
  expect(n.at(-2)!).toBeLessThanOrEqual(201);
});
test('edgeMidpoint lies on the curve between the ends', () => {
  const m = edgeMidpoint(a, b);
  expect(m.x).toBeCloseTo(110);
  expect(Math.abs(m.y - 10)).toBeCloseTo(15);
});
