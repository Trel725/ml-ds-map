import type { Group, Layer, Node } from '../data/schema';
import {
  CELL_GAP, CELL_H, CELL_W, CHAR_W, EXPANDED_HEADER, GROUP_GAP, GROUP_H, GROUP_W_MAX, GROUP_W_MIN,
  LANE_LABEL_W, LANE_MIN_H, LANE_PAD, MAX_COLS, RAIL_GAP, TOOL_GAP, TOOL_H, TOOL_W,
} from './constants';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Top → bottom: foundations sit at the bottom so the picture says "ideas build upward". */
export const LANE_ORDER = ['problems', 'algorithms', 'core', 'math', 'foundations'] as const;

export const LANE_LABELS: Record<(typeof LANE_ORDER)[number], string> = {
  problems: 'Problems',
  algorithms: 'Algorithms',
  core: 'Core concepts',
  math: 'Math',
  foundations: 'Foundations',
};

export interface Layout {
  lanes: { layer: Layer; label: string; y: number; h: number }[];
  groupBoxes: Map<string, Box & { expanded: boolean }>;
  /** Every non-tool node. Members of collapsed groups sit on the group box with visible: false. */
  nodePositions: Map<string, Box & { visible: boolean }>;
  toolPositions: Map<string, Box>;
  width: number;
  height: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Pure, deterministic lane layout for the current expansion state. */
export function layout(groups: Group[], nodes: Node[], expanded: ReadonlySet<string>): Layout {
  const members = new Map<string, Node[]>();
  for (const n of nodes) {
    if (n.kind === 'tool') continue;
    if (!members.has(n.group)) members.set(n.group, []);
    members.get(n.group)!.push(n);
  }

  const groupBoxes: Layout['groupBoxes'] = new Map();
  const nodePositions: Layout['nodePositions'] = new Map();
  const lanes: Layout['lanes'] = [];
  let y = 0;
  let contentRight = LANE_LABEL_W;

  for (const layer of LANE_ORDER) {
    const laneGroups = groups.filter((g) => g.layer === layer).sort((a, b) => a.order - b.order);
    // First pass: sizes and x positions.
    const sized = laneGroups.map((g) => {
      const list = members.get(g.id) ?? [];
      const isOpen = expanded.has(g.id) && list.length > 0;
      if (!isOpen) return { g, list, isOpen, w: clamp(g.label.length * CHAR_W + 32, GROUP_W_MIN, GROUP_W_MAX), h: GROUP_H, cols: 0 };
      const cols = Math.min(MAX_COLS, list.length);
      const rows = Math.ceil(list.length / cols);
      return {
        g, list, isOpen, cols,
        w: cols * CELL_W + (cols - 1) * CELL_GAP + 2 * CELL_GAP,
        h: EXPANDED_HEADER + rows * CELL_H + (rows - 1) * CELL_GAP + CELL_GAP,
      };
    });
    const tallest = Math.max(0, ...sized.map((s) => s.h));
    const h = Math.max(LANE_MIN_H, tallest + 2 * LANE_PAD);

    let x = LANE_LABEL_W;
    for (const s of sized) {
      const box = { x, y: y + (h - s.h) / 2, w: s.w, h: s.h };
      groupBoxes.set(s.g.id, { ...box, expanded: s.isOpen });
      s.list.forEach((n, i) => {
        if (!s.isOpen) {
          nodePositions.set(n.id, { ...box, visible: false });
          return;
        }
        const col = i % s.cols;
        const row = Math.floor(i / s.cols);
        nodePositions.set(n.id, {
          x: box.x + CELL_GAP + col * (CELL_W + CELL_GAP),
          y: box.y + EXPANDED_HEADER + row * (CELL_H + CELL_GAP),
          w: CELL_W,
          h: CELL_H,
          visible: true,
        });
      });
      x += s.w + GROUP_GAP;
      contentRight = Math.max(contentRight, box.x + box.w);
    }
    lanes.push({ layer, label: LANE_LABELS[layer], y, h });
    y += h;
  }

  const railX = contentRight + RAIL_GAP;
  const toolPositions: Layout['toolPositions'] = new Map();
  nodes
    .filter((n) => n.kind === 'tool')
    .forEach((n, i) => toolPositions.set(n.id, { x: railX, y: LANE_PAD + i * (TOOL_H + TOOL_GAP), w: TOOL_W, h: TOOL_H }));

  return { lanes, groupBoxes, nodePositions, toolPositions, width: railX + TOOL_W + LANE_PAD, height: y };
}
