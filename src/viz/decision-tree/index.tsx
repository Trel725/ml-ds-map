import { scaleLinear } from 'd3-scale';
import { useMemo, useState } from 'react';
import { Axis } from '../Axis';
import { Slider } from '../controls/Slider';
import { emails } from '../datasets';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { accuracy, growTree, regions } from './model';
import type { Region, Tree } from './model';

const W = 360;
const H = 270;
const BOUNDS = { x0: 0, x1: 10, y0: 0, y1: 1 };
const MAX_DEPTH = 6;

const x = scaleLinear().domain([0, 10]).range([44, W - 10]);
const y = scaleLinear().domain([0, 1]).range([H - 50, 10]);

/** Cut segments, each clipped to the box its node owns. */
function cuts(t: Tree, b: Omit<Region, 'label'>): { x1: number; y1: number; x2: number; y2: number }[] {
  if (t.leaf) return [];
  if (t.feature === 'links') {
    return [
      { x1: t.threshold, x2: t.threshold, y1: b.y0, y2: b.y1 },
      ...cuts(t.left, { ...b, x1: t.threshold }),
      ...cuts(t.right, { ...b, x0: t.threshold }),
    ];
  }
  return [
    { x1: b.x0, x2: b.x1, y1: t.threshold, y2: t.threshold },
    ...cuts(t.left, { ...b, y1: t.threshold }),
    ...cuts(t.right, { ...b, y0: t.threshold }),
  ];
}

function DecisionTree() {
  const [maxDepth, setMaxDepth] = useState(1);
  const train = useMemo(() => emails().filter((e) => e.split === 'train'), []);
  const tree = useMemo(() => growTree(train, maxDepth), [train, maxDepth]);
  const rs = regions(tree, BOUNDS);
  const acc = accuracy(tree, train);

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Emails split into rectangles by yes/no cuts">
        {rs.map((r, i) => (
          <rect
            key={i}
            x={x(r.x0)}
            y={y(r.y1)}
            width={x(r.x1) - x(r.x0)}
            height={y(r.y0) - y(r.y1)}
            fill={r.label === 1 ? 'var(--viz-prediction)' : 'transparent'}
            fillOpacity={0.18}
          />
        ))}
        {cuts(tree, BOUNDS).map((c, i) => (
          <line key={i} x1={x(c.x1)} x2={x(c.x2)} y1={y(c.y1)} y2={y(c.y2)} stroke="var(--viz-prediction)" strokeWidth={2} />
        ))}
        <Axis scale={x} orient="bottom" at={y(0)} ticks={5} label="links" />
        <Axis scale={y} orient="left" at={x(0)} ticks={4} format={(v) => `${Math.round(v * 100)}%`} label="capitals" />
        {train.map((e, i) =>
          e.label === 1 ? (
            <circle key={i} cx={x(e.links)} cy={y(e.capsShare)} r={3.5} fill="var(--viz-train)" />
          ) : (
            <circle key={i} cx={x(e.links)} cy={y(e.capsShare)} r={3.5} fill="var(--surface)" stroke="var(--viz-train)" strokeWidth={1.5} />
          ),
        )}
        <g transform={`translate(44, ${H - 12})`} className="viz-note">
          <circle cx={4} cy={-4} r={3.5} fill="var(--viz-train)" />
          <text x={12}>spam</text>
          <circle cx={62} cy={-4} r={3.5} fill="var(--surface)" stroke="var(--viz-train)" strokeWidth={1.5} />
          <text x={70}>not spam</text>
          <rect x={140} y={-9} width={10} height={10} fill="var(--viz-prediction)" fillOpacity={0.3} />
          <text x={156}>predicted spam</text>
        </g>
      </svg>
      <div className="viz-controls">
        <Slider label="Depth" min={0} max={MAX_DEPTH} step={1} value={maxDepth} onChange={setMaxDepth} />
      </div>
      <Readout>{`Depth ${maxDepth} · ${rs.length} regions · training accuracy ${Math.round(acc * 100)}%`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'A tree is a stack of yes/no cuts',
  altText: 'Emails plotted by links and capital letters are carved into rectangles by straight cuts; deeper trees make more, smaller rectangles.',
  Component: DecisionTree,
};
export default viz;
