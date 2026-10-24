import { scaleLinear, scaleSymlog } from 'd3-scale';
import { line } from 'd3-shape';
import { useId, useMemo, useState } from 'react';
import { Axis } from '../Axis';
import { Slider } from '../controls/Slider';
import { Toggle } from '../controls/Toggle';
import { flatPrices } from '../datasets';
import { evalPoly, mse, toScaled } from '../overfitting/model';
import type { Pt } from '../overfitting/model';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { fitLasso, fitRidge } from './model';

const W = 360;
const H = 230;
const DEGREE = 9;
const POSITIONS = 25;
/** Slider position i maps to a penalty from 0.001 to 100, evenly spaced on a log scale. */
const strengthAt = (i: number) => 10 ** (-3 + (5 * i) / (POSITIONS - 1));

// Left: data and the degree-9 fit.
const x = scaleLinear().domain([25, 155]).range([40, 200]);
const y = scaleLinear().domain([50, 420]).range([H - 30, 12]);
// Right: one bar per weight.
const bx = scaleLinear().domain([0, DEGREE]).range([222, W - 6]);

const split = (s: 'train' | 'test'): Pt[] => flatPrices().filter((p) => p.split === s).map((p) => ({ x: p.size, y: p.price }));
const sig3 = (v: number) => String(Number(v.toPrecision(3)));

function Regularization() {
  const [pos, setPos] = useState(12);
  const [lasso, setLasso] = useState(false);
  const clip = useId();
  const { train, test, fits } = useMemo(() => {
    const train = split('train');
    const test = split('test');
    const strengths = Array.from({ length: POSITIONS }, (_, i) => strengthAt(i));
    return {
      train,
      test,
      fits: { ridge: strengths.map((s) => fitRidge(train, DEGREE, s)), lasso: strengths.map((s) => fitLasso(train, DEGREE, s)) },
    };
  }, []);

  const all = lasso ? fits.lasso : fits.ridge;
  const coeffs = all[pos];
  const weights = coeffs.slice(1);
  const nonZero = weights.filter((w) => w !== 0).length;
  const testErr = mse(test, coeffs);
  const maxAbs = Math.max(1, ...all.flatMap((c) => c.slice(1).map(Math.abs)));
  const by = scaleSymlog().domain([-maxAbs, maxAbs]).range([H - 30, 12]);

  const curve = line<number>()
    .x((v) => x(v))
    .y((v) => y(evalPoly(coeffs, toScaled(v))))(Array.from({ length: 121 }, (_, i) => 30 + i))!;
  const barW = (bx(1) - bx(0)) * 0.7;

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="A degree-9 fit to flats, and bars for its nine weights">
        <defs>
          <clipPath id={clip}>
            <rect x={40} y={12} width={160} height={H - 42} />
          </clipPath>
        </defs>
        <Axis scale={x} orient="bottom" at={H - 30} tickValues={[50, 100, 150]} label="size (m²)" />
        <Axis scale={y} orient="left" at={40} ticks={3} label="price (k)" />
        <path d={curve} fill="none" stroke="var(--viz-prediction)" strokeWidth={2} clipPath={`url(#${clip})`} />
        {train.map((p, i) => (
          <circle key={`a${i}`} cx={x(p.x)} cy={y(p.y)} r={3} fill="var(--viz-train)" />
        ))}
        {test.map((p, i) => (
          <rect key={`b${i}`} x={x(p.x) - 3} y={y(p.y) - 3} width={6} height={6} fill="none" stroke="var(--viz-test)" strokeWidth={1.5} />
        ))}

        <line x1={bx(0)} x2={bx(DEGREE)} y1={by(0)} y2={by(0)} stroke="var(--viz-axis)" />
        {weights.map((w, j) => (
          <g key={j}>
            <rect
              className="viz-bar"
              x={bx(j) + (bx(1) - bx(0) - barW) / 2}
              y={Math.min(by(w), by(0))}
              width={barW}
              height={Math.max(w === 0 ? 0 : 1, Math.abs(by(w) - by(0)))}
              fill="var(--viz-prediction)"
            />
            {w === 0 && (
              <text x={bx(j + 0.5)} y={by(0) - 4} textAnchor="middle" className="viz-note">
                0
              </text>
            )}
            <text x={bx(j + 0.5)} y={H - 16} textAnchor="middle" className="viz-note">
              {j + 1}
            </text>
          </g>
        ))}
        <text x={bx(0)} y={H - 4} className="viz-note">
          weight for size to the power…
        </text>
      </svg>
      <div className="viz-controls">
        <Slider label="Penalty strength" min={0} max={POSITIONS - 1} step={1} value={pos} onChange={setPos} format={(i) => sig3(strengthAt(i))} />
        <Toggle label="Lasso" checked={lasso} onChange={setLasso} />
      </div>
      <Readout>{`${lasso ? 'Lasso' : 'Ridge'} · penalty ${sig3(strengthAt(pos))} · ${nonZero} of 9 weights non-zero · test error ${Math.round(testErr)}`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'Penalties shrink weights; Lasso sets some to zero',
  altText:
    'A wiggly degree-9 curve through the flats calms down as the penalty grows; its nine weight bars shrink, and with Lasso many drop to exactly zero.',
  Component: Regularization,
};
export default viz;
