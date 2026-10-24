import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { useMemo, useState } from 'react';
import { Axis } from '../Axis';
import { StepButton } from '../controls/StepButton';
import { flatPrices } from '../datasets';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { useReducedMotion } from '../useReducedMotion';
import { boostStumps, predictAt } from './model';

const W = 360;
const H = 240;
const MAX_TREES = 30;

const x = scaleLinear().domain([25, 155]).range([44, W - 10]);
const y = scaleLinear().domain([50, 420]).range([H - 30, 12]);
const xs = Array.from({ length: 261 }, (_, i) => 25 + i * 0.5);

function GradientBoosting() {
  const [n, setN] = useState(0);
  const reduced = useReducedMotion();
  const { train, model } = useMemo(() => {
    const train = flatPrices().filter((p) => p.split === 'train').map((p) => ({ x: p.size, y: p.price }));
    return { train, model: boostStumps(train, MAX_TREES) };
  }, []);
  const fitted = train.map((p) => predictAt(model, n, p.x));
  const err = train.reduce((a, p, i) => a + (p.y - fitted[i]) ** 2, 0) / train.length;
  // A step curve: d3's curveStepAfter would shift the steps, so sample densely instead.
  const curve = line<number>()
    .x((v) => x(v))
    .y((v) => y(predictAt(model, n, v)))(xs)!;

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Flats with a step-shaped fit built from small trees, and the leftover errors">
        <Axis scale={x} orient="bottom" at={H - 30} ticks={4} label="size (m²)" />
        <Axis scale={y} orient="left" at={44} ticks={3} label="price (k)" />
        {train.map((p, i) => (
          <line key={`r${i}`} x1={x(p.x)} x2={x(p.x)} y1={y(p.y)} y2={y(fitted[i])} stroke="var(--viz-error)" strokeWidth={1.5} strokeDasharray="3 2" />
        ))}
        <path d={curve} fill="none" stroke="var(--viz-prediction)" strokeWidth={2} style={{ transition: reduced ? 'none' : 'd var(--motion) ease' }} />
        {train.map((p, i) => (
          <circle key={i} cx={x(p.x)} cy={y(p.y)} r={3.5} fill="var(--viz-train)" />
        ))}
        <g transform="translate(52, 24)" className="viz-note">
          <line x1={0} x2={14} y1={-4} y2={-4} stroke="var(--viz-prediction)" strokeWidth={2} />
          <text x={20}>prediction</text>
          <line x1={92} x2={92} y1={-10} y2={2} stroke="var(--viz-error)" strokeWidth={1.5} strokeDasharray="3 2" />
          <text x={100}>what is still wrong</text>
        </g>
      </svg>
      <div className="viz-controls">
        <StepButton label="Add a tree" onStep={() => setN((v) => Math.min(MAX_TREES, v + 1))} disabled={n >= MAX_TREES} />
        <StepButton label="Reset" onStep={() => setN(0)} />
      </div>
      <Readout>{`${n} ${n === 1 ? 'tree' : 'trees'} · training error ${Math.round(err)}`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'Each tree fixes what the last ones got wrong',
  altText:
    'Starting from a flat line at the average price, each added one-question tree nudges the fit toward the flats it missed, and the error sticks shrink.',
  Component: GradientBoosting,
};
export default viz;
