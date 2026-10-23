import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { useState } from 'react';
import { Axis } from '../Axis';
import { useDrag } from '../controls/useDrag';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { derivativeAt, f, secantSlope } from './model';

const W = 360;
const H = 240;
const A = 1;
const B_MIN = 1.01;
const B_MAX = 3;
const TANGENT_GAP = 0.02;

const x = scaleLinear().domain([0, 3.2]).range([36, W - 12]);
const y = scaleLinear().domain([0, 10]).range([H - 28, 12]);
const curve = line<number>()
  .x((t) => x(t))
  .y((t) => y(f(t)))(Array.from({ length: 65 }, (_, i) => (i / 64) * 3.2))!;

const clamp = (v: number) => Math.min(B_MAX, Math.max(B_MIN, Math.round(v * 100) / 100));

function SlopeDerivative() {
  const [b, setB] = useState(B_MAX);
  const slope = secantSlope(f, A, b);
  const tangent = b - A < TANGENT_GAP;
  const pxPerUnit = x(1) - x(0);
  const drag = useDrag({
    onDrag: (dx) => setB((v) => clamp(v + dx)),
    step: 0.05,
    pxToData: (dxPx) => [dxPx / pxPerUnit, 0],
    label: 'Second point',
    valueText: `x ${b.toFixed(2)}`,
  });
  const lineAt = (t: number) => f(A) + slope * (t - A);

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="A curve with a line through two of its points">
        <Axis scale={x} orient="bottom" at={y(0)} ticks={4} />
        <Axis scale={y} orient="left" at={x(0)} ticks={4} />
        <path d={curve} fill="none" stroke="var(--viz-train)" strokeWidth={2} />
        <line x1={x(0)} y1={y(lineAt(0))} x2={x(3.2)} y2={y(lineAt(3.2))} stroke="var(--viz-prediction)" strokeWidth={2} />
        {tangent && (
          <text x={x(1.6)} y={y(lineAt(1.6)) - 10} className="viz-label" fill="var(--viz-prediction)">
            tangent
          </text>
        )}
        <circle cx={x(A)} cy={y(f(A))} r={6} fill="var(--viz-prediction)" />
        <circle cx={x(b)} cy={y(f(b))} r={9} fill="var(--surface)" stroke="var(--viz-prediction)" strokeWidth={3} {...drag} />
      </svg>
      <p className="viz-hint">Drag the open point toward the filled one, or use the arrow keys.</p>
      <Readout>{`Gap ${(b - A).toFixed(2)} · slope ${slope.toFixed(2)} · slope at the point ${derivativeAt(f, A).toFixed(2)}`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'A derivative is a slope at one point',
  altText: 'A line through two points of a curve turns into the tangent line as the points move together, and its slope settles at 2.',
  Component: SlopeDerivative,
};
export default viz;
