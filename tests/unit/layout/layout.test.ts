import { beforeAll, describe, expect, test } from 'vitest';
import type { Group, Node } from '../../../src/data/schema';
import { CELL_GAP, CELL_H, CELL_W, EXPANDED_HEADER } from '../../../src/layout/constants';
import { layout } from '../../../src/layout/layout';
import type { Box, Layout } from '../../../src/layout/layout';
import { realContent } from '../helpers/real';

let groups: Group[];
let nodes: Node[];
beforeAll(async () => {
  ({ groups, nodes } = await realContent());
});

const serialize = (l: Layout) => ({
  lanes: l.lanes,
  groupBoxes: [...l.groupBoxes.entries()].sort(([a], [b]) => a.localeCompare(b)),
  nodePositions: [...l.nodePositions.entries()].sort(([a], [b]) => a.localeCompare(b)),
  toolPositions: [...l.toolPositions.entries()].sort(([a], [b]) => a.localeCompare(b)),
  width: l.width,
  height: l.height,
});
const inside = (inner: Box, outer: Box) =>
  inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;
const states = (): Record<string, Set<string>> => ({
  collapsed: new Set<string>(),
  oneExpanded: new Set(['optimization']),
  allExpanded: new Set(groups.map((g) => g.id)),
});
const STATE_NAMES = ['collapsed', 'oneExpanded', 'allExpanded'];

describe.each(STATE_NAMES)('%s', (name) => {
  const run = () => layout(groups, nodes, states()[name]);
  test('snapshot', () => expect(serialize(run())).toMatchSnapshot());
  test('no two group boxes in a lane overlap', () => {
    const l = run();
    for (const lane of l.lanes) {
      const boxes = groups.filter((g) => g.layer === lane.layer).map((g) => l.groupBoxes.get(g.id)!).sort((a, b) => a.x - b.x);
      for (let i = 1; i < boxes.length; i++) expect(boxes[i].x).toBeGreaterThanOrEqual(boxes[i - 1].x + boxes[i - 1].w);
    }
  });
  test('every visible node box lies inside its group box and its lane', () => {
    const l = run();
    for (const n of nodes.filter((n) => n.kind !== 'tool')) {
      const p = l.nodePositions.get(n.id)!;
      const g = l.groupBoxes.get(n.group)!;
      const lane = l.lanes.find((x) => x.layer === n.layer)!;
      expect(inside(g, { x: 0, y: lane.y, w: l.width, h: lane.h })).toBe(true);
      if (p.visible) expect(inside(p, g)).toBe(true);
      else expect(p).toMatchObject({ x: g.x, y: g.y, w: g.w, h: g.h });
    }
  });
  test('tools rail sits right of every lane', () => {
    const l = run();
    const rightmost = Math.max(...[...l.groupBoxes.values()].map((b) => b.x + b.w));
    for (const t of l.toolPositions.values()) expect(t.x).toBeGreaterThan(rightmost);
    expect(l.toolPositions.size).toBe(8);
  });
});

test('5 lanes, foundations lane is the bottom lane', () => {
  const l = layout(groups, nodes, new Set()).lanes;
  expect(l.map((x) => x.layer)).toEqual(['problems', 'algorithms', 'core', 'math', 'foundations']);
  expect(l.at(-1)!.layer).toBe('foundations');
});
test('tools and the tools group are not in any lane', () => {
  const l = layout(groups, nodes, new Set());
  expect(l.groupBoxes.has('tools')).toBe(false);
  expect(l.nodePositions.has('numpy')).toBe(false);
});
test('expanding a group shifts later groups in its lane right and leaves other lanes alone', () => {
  const a = layout(groups, nodes, new Set());
  const b = layout(groups, nodes, new Set(['calculus']));
  expect(b.groupBoxes.get('linear-algebra')!.x).toBe(a.groupBoxes.get('linear-algebra')!.x);
  expect(b.groupBoxes.get('optimization')!.x).toBeGreaterThan(a.groupBoxes.get('optimization')!.x);
  expect(b.groupBoxes.get('trees')).toEqual(a.groupBoxes.get('trees'));
  expect(b.groupBoxes.get('calculus')!.expanded).toBe(true);
});
test('deterministic: same input → deep-equal output', () =>
  expect(serialize(layout(groups, nodes, new Set(['calculus'])))).toEqual(serialize(layout(groups, nodes, new Set(['calculus'])))));
test('optimization (8 members) expands to 4 columns × 2 rows', () => {
  const l = layout(groups, nodes, new Set(['optimization']));
  const box = l.groupBoxes.get('optimization')!;
  expect(box.w).toBe(4 * CELL_W + 3 * CELL_GAP + 2 * CELL_GAP);
  expect(box.h).toBe(EXPANDED_HEADER + 2 * CELL_H + CELL_GAP + CELL_GAP);
  const members = nodes.filter((n) => n.group === 'optimization').map((n) => l.nodePositions.get(n.id)!);
  expect(new Set(members.map((m) => m.x)).size).toBe(4);
  expect(new Set(members.map((m) => m.y)).size).toBe(2);
  expect(members[1].x).toBeGreaterThan(members[0].x); // row-major in file order
  expect(members[4].y).toBeGreaterThan(members[0].y);
});
