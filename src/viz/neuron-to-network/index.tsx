import { scaleLinear } from 'd3-scale';
import { useId, useMemo, useState } from 'react';
import { Axis } from '../Axis';
import { Slider } from '../controls/Slider';
import { emails } from '../datasets';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { SEED, trainMLP } from './model';
import type { Mlp } from './model';

const W = 360;
const H = 270;
const GRID = 40;
const MAX_UNITS = 4;

const x = scaleLinear().domain([0, 10]).range([44, W - 10]);
const y = scaleLinear().domain([0, 1]).range([H - 50, 10]);
const cw = (x(10) - x(0)) / GRID;
const ch = (y(0) - y(1)) / GRID;
const at = (i: number, j: number) => ({ links: ((i + 0.5) / GRID) * 10, capsShare: (j + 0.5) / GRID });

/** The 0.5 contour on the grid: an edge wherever two neighbouring cells get different classes. */
function boundary(net: Mlp): string {
  const spam = Array.from({ length: GRID }, (_, i) => Array.from({ length: GRID }, (_, j) => net.predict(at(i, j)) >= 0.5));
  const segs: string[] = [];
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const left = x(0) + i * cw;
      const top = y(1) + (GRID - 1 - j) * ch;
      if (i + 1 < GRID && spam[i][j] !== spam[i + 1][j]) segs.push(`M${left + cw},${top}v${ch}`);
      if (j + 1 < GRID && spam[i][j] !== spam[i][j + 1]) segs.push(`M${left},${top}h${cw}`);
    }
  }
  return segs.join('');
}

function NeuronToNetwork() {
  const [units, setUnits] = useState(1);
  const clip = useId();
  const all = useMemo(() => emails(), []);
  const nets = useMemo(() => new Map<number, Mlp>(), []);
  if (!nets.has(units)) nets.set(units, trainMLP(all, units, SEED));
  const net = nets.get(units)!;
  const acc = all.filter((e) => (net.predict(e) >= 0.5 ? 1 : 0) === e.label).length / all.length;

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Emails with the boundary a small neural network draws, and each hidden unit's own straight line">
        <defs>
          <clipPath id={clip}>
            <rect x={x(0)} y={y(1)} width={x(10) - x(0)} height={y(0) - y(1)} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clip})`}>
          {net.hiddenLines.map((l, k) => {
            // a·links + b·caps + c = 0, drawn across the plot.
            const pts =
              Math.abs(l.b) > 1e-9
                ? [0, 10].map((lk) => [lk, -(l.a * lk + l.c) / l.b])
                : [0, 1].map((cp) => [-(l.b * cp + l.c) / l.a, cp]);
            return <line key={k} x1={x(pts[0][0])} y1={y(pts[0][1])} x2={x(pts[1][0])} y2={y(pts[1][1])} stroke="var(--viz-axis)" strokeOpacity={0.6} strokeDasharray="4 3" />;
          })}
          <path d={boundary(net)} fill="none" stroke="var(--viz-prediction)" strokeWidth={2.5} strokeLinecap="square" />
        </g>
        <Axis scale={x} orient="bottom" at={y(0)} ticks={5} label="links" />
        <Axis scale={y} orient="left" at={x(0)} ticks={4} format={(v) => `${Math.round(v * 100)}%`} label="capitals" />
        {all.map((e, i) =>
          e.label === 1 ? (
            <circle key={i} cx={x(e.links)} cy={y(e.capsShare)} r={3.5} fill="var(--viz-train)" />
          ) : (
            <circle key={i} cx={x(e.links)} cy={y(e.capsShare)} r={3.5} fill="var(--surface)" stroke="var(--viz-train)" strokeWidth={1.5} />
          ),
        )}
        <g transform={`translate(44, ${H - 12})`} className="viz-note">
          <line x1={0} x2={16} y1={-4} y2={-4} stroke="var(--viz-prediction)" strokeWidth={2.5} />
          <text x={22}>network boundary</text>
          <line x1={128} x2={144} y1={-4} y2={-4} stroke="var(--viz-axis)" strokeDasharray="4 3" />
          <text x={150}>one hidden unit's line</text>
        </g>
      </svg>
      <div className="viz-controls">
        <Slider label="Hidden units" min={1} max={MAX_UNITS} step={1} value={units} onChange={setUnits} />
      </div>
      <Readout>{`${units} hidden ${units === 1 ? 'unit' : 'units'} · training accuracy ${Math.round(acc * 100)}%`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'Combining simple boundaries makes curved ones',
  altText:
    'With one hidden unit the network splits the emails with a straight line; with more units, their straight lines combine into a bent boundary.',
  Component: NeuronToNetwork,
};
export default viz;
