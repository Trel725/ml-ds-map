import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { useState } from 'react';
import { Axis } from '../Axis';
import { useDrag } from '../controls/useDrag';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { P_MAX, P_MIN, clampP, losses } from './model';

const W = 360;
const H = 240;
const Y_MAX = 4.7;

const x = scaleLinear().domain([0, 1]).range([44, W - 60]);
const y = scaleLinear().domain([0, Y_MAX]).range([H - 30, 12]);
const grid = Array.from({ length: 99 }, (_, i) => P_MIN + i * 0.01);

const CURVES = [
  { key: 'squared', name: 'squared', dash: undefined },
  { key: 'absolute', name: 'absolute', dash: '6 4' },
  { key: 'log', name: 'log', dash: '2 3' },
] as const;

const round2 = (v: number) => Math.round(v * 100) / 100;

function LossFunctions() {
  const [p, setP] = useState(0.5);
  const l = losses(p);
  const drag = useDrag({
    label: 'Prediction',
    valueText: `predicted chance ${p.toFixed(2)}`,
    step: 0.01,
    pxToData: (dx) => [dx / (x(1) - x(0)), 0],
    onDrag: (dx) => setP((v) => round2(clampP(v + dx))),
  });

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Three loss curves for a true answer of yes, against the predicted chance">
        <Axis scale={x} orient="bottom" at={y(0)} tickValues={[0, 0.25, 0.5, 0.75, 1]} label="predicted chance of yes (truth is yes)" />
        <Axis scale={y} orient="left" at={x(0)} ticks={4} label="loss" />
        {CURVES.map((c) => {
          const d = line<number>()
            .x((q) => x(q))
            .y((q) => y(losses(q)[c.key]))(grid)!;
          const end = losses(P_MIN)[c.key];
          return (
            <g key={c.key}>
              <path d={d} fill="none" stroke="var(--viz-error)" strokeWidth={2} strokeDasharray={c.dash} />
              <text x={x(P_MIN) + 6} y={y(end) + (c.key === 'log' ? 12 : -4)} className="viz-label" fill="var(--viz-error)">
                {c.name}
              </text>
            </g>
          );
        })}
        <line x1={x(p)} x2={x(p)} y1={y(0)} y2={y(Y_MAX)} stroke="var(--viz-prediction)" strokeWidth={2} />
        {CURVES.map((c) => (
          <circle key={c.key} cx={x(p)} cy={y(l[c.key])} r={3.5} fill="var(--viz-error)" />
        ))}
        <rect x={x(p) - 9} y={y(Y_MAX) - 2} width={18} height={18} rx={4} fill="var(--viz-prediction)" {...drag} />
        <text x={x(P_MAX)} y={y(Y_MAX) + 12} textAnchor="end" className="viz-note">
          drag the marker
        </text>
      </svg>
      <Readout>{`Prediction ${p.toFixed(2)} · squared ${l.squared.toFixed(2)} · absolute ${l.absolute.toFixed(2)} · log ${l.log.toFixed(2)}`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'How hard each loss punishes a wrong answer',
  altText:
    'Squared, absolute and log loss all fall to zero as the predicted chance of the true answer nears one, but log loss shoots up when a confident guess is wrong.',
  Component: LossFunctions,
};
export default viz;
