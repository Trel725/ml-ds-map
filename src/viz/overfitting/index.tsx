import { scaleLinear, scaleLog } from 'd3-scale';
import { line } from 'd3-shape';
import { useId, useMemo, useState } from 'react';
import { Axis } from '../Axis';
import { Slider } from '../controls/Slider';
import { flatPrices } from '../datasets';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { evalPoly, fitPolynomial, mse, toScaled } from './model';
import type { Pt } from './model';

const W = 360;
const H = 300;
const MAX_DEGREE = 9;

// Top: the data and the fitted curve.
const x = scaleLinear().domain([25, 155]).range([44, W - 10]);
const y = scaleLinear().domain([50, 420]).range([170, 12]);
// Bottom: error against degree.
const ex = scaleLinear().domain([1, MAX_DEGREE]).range([44, W - 10]);

const split = (s: 'train' | 'test'): Pt[] => flatPrices().filter((p) => p.split === s).map((p) => ({ x: p.size, y: p.price }));

function Overfitting() {
  const [degree, setDegree] = useState(1);
  const clip = useId();
  const { train, test, fits, errors } = useMemo(() => {
    const train = split('train');
    const test = split('test');
    const fits = Array.from({ length: MAX_DEGREE }, (_, i) => fitPolynomial(train, i + 1));
    const errors = fits.map((c) => ({ train: mse(train, c), test: mse(test, c) }));
    return { train, test, fits, errors };
  }, []);

  const coeffs = fits[degree - 1];
  const curve = line<number>()
    .x((v) => x(v))
    .y((v) => y(evalPoly(coeffs, toScaled(v))))(Array.from({ length: 121 }, (_, i) => 30 + i))!;
  const all = errors.flatMap((e) => [e.train, e.test]);
  const ey = scaleLog()
    .domain([Math.min(...all) * 0.8, Math.max(...all) * 1.2])
    .range([H - 26, 214]);
  const errLine = (k: 'train' | 'test') =>
    line<{ train: number; test: number }>()
      .x((_, i) => ex(i + 1))
      .y((e) => ey(e[k]))(errors)!;
  const now = errors[degree - 1];

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="A polynomial fit to flats, and training and test error by degree">
        <defs>
          <clipPath id={clip}>
            <rect x={44} y={12} width={W - 54} height={158} />
          </clipPath>
        </defs>
        <Axis scale={x} orient="bottom" at={170} ticks={4} />
        <Axis scale={y} orient="left" at={44} ticks={3} label="price (k)" />
        <path d={curve} fill="none" stroke="var(--viz-prediction)" strokeWidth={2} clipPath={`url(#${clip})`} />
        {train.map((p, i) => (
          <circle key={`a${i}`} cx={x(p.x)} cy={y(p.y)} r={4} fill="var(--viz-train)" />
        ))}
        {test.map((p, i) => (
          <rect key={`b${i}`} x={x(p.x) - 4} y={y(p.y) - 4} width={8} height={8} fill="none" stroke="var(--viz-test)" strokeWidth={2} />
        ))}
        <circle cx={52} cy={202} r={4} fill="var(--viz-train)" />
        <text x={60} y={206} className="viz-note">
          training data
        </text>
        <rect x={150} y={198} width={8} height={8} fill="none" stroke="var(--viz-test)" strokeWidth={2} />
        <text x={162} y={206} className="viz-note">
          test data
        </text>

        <Axis scale={ex} orient="bottom" at={H - 26} tickValues={[1, 3, 5, 7, 9]} label="degree" />
        <path d={errLine('train')} fill="none" stroke="var(--viz-train)" strokeWidth={2} />
        <path d={errLine('test')} fill="none" stroke="var(--viz-test)" strokeWidth={2} strokeDasharray="5 3" />
        <line x1={ex(degree)} x2={ex(degree)} y1={214} y2={H - 26} stroke="var(--viz-axis)" strokeDasharray="2 3" />
        <circle cx={ex(degree)} cy={ey(now.train)} r={4} fill="var(--viz-train)" />
        <rect x={ex(degree) - 4} y={ey(now.test) - 4} width={8} height={8} fill="var(--viz-test)" />
        <text x={44} y={226} className="viz-note">
          error (log scale)
        </text>
      </svg>
      <div className="viz-controls">
        <Slider label="Complexity" min={1} max={MAX_DEGREE} step={1} value={degree} onChange={setDegree} format={(d) => `degree ${d}`} />
      </div>
      <Readout>{`Degree ${degree} · training error ${Math.round(now.train)} · test error ${Math.round(now.test)}`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'Training error always falls; test error falls then rises',
  altText:
    'As the polynomial gets more flexible it bends through the training flats; training error keeps falling while test error falls, then climbs.',
  Component: Overfitting,
};
export default viz;
