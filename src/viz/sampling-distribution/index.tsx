import { scaleLinear } from 'd3-scale';
import { useMemo, useState } from 'react';
import { Axis } from '../Axis';
import { Slider } from '../controls/Slider';
import { StepButton } from '../controls/StepButton';
import { skewedPrices } from '../datasets';
import { mulberry32 } from '../random';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { sampleMeans } from './model';

const W = 360;
const H = 280;
const BATCH = 100;
const BINS = 24;

const sd = (v: number[]) => {
  if (v.length === 0) return 0;
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length);
};

function bins(values: number[], lo: number, hi: number): number[] {
  const out = new Array<number>(BINS).fill(0);
  for (const v of values) out[Math.min(BINS - 1, Math.max(0, Math.floor(((v - lo) / (hi - lo)) * BINS)))]++;
  return out;
}

function SamplingDistribution() {
  const [size, setSize] = useState(10);
  const [batches, setBatches] = useState(1);
  const pop = useMemo(() => skewedPrices(), []);
  const lo = Math.min(...pop);
  const hi = Math.max(...pop);
  // Each batch has its own seed, so the same size and batch count always shows the same means.
  const means = useMemo(
    () => Array.from({ length: batches }, (_, k) => sampleMeans(pop, size, BATCH, mulberry32(size * 1000 + k))).flat(),
    [pop, size, batches],
  );

  const x = scaleLinear().domain([lo, hi]).range([44, W - 10]);
  const popBins = bins(pop, lo, hi);
  const meanBins = bins(means, lo, hi);
  const py = scaleLinear().domain([0, Math.max(...popBins)]).range([86, 24]);
  const my = scaleLinear().domain([0, Math.max(1, ...meanBins)]).range([H - 30, 120]);
  const bw = (x(hi) - x(lo)) / BINS;
  const millions = (v: number) => `${(v / 1e6).toFixed(0)}M`;

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="A skewed population of prices, and a histogram of averages of samples drawn from it">
        <text x={44} y={14} className="viz-note">
          the population: 40 skewed prices
        </text>
        {popBins.map((c, i) => (
          <rect key={`p${i}`} x={x(lo) + i * bw + 0.5} y={py(c)} width={bw - 1} height={86 - py(c)} fill="var(--viz-train)" fillOpacity={0.6} />
        ))}
        <line x1={44} x2={W - 10} y1={86} y2={86} stroke="var(--viz-axis)" />
        <text x={44} y={112} className="viz-note">
          {`averages of samples of ${size}`}
        </text>
        {meanBins.map((c, i) => (
          <rect key={`m${i}`} className="viz-bar" x={x(lo) + i * bw + 0.5} y={my(c)} width={bw - 1} height={H - 30 - my(c)} fill="var(--viz-prediction)" />
        ))}
        <Axis scale={x} orient="bottom" at={H - 30} ticks={4} format={millions} label="price" />
      </svg>
      <div className="viz-controls">
        <Slider
          label="Sample size"
          min={1}
          max={50}
          step={1}
          value={size}
          onChange={(v) => {
            setSize(v);
            setBatches(1);
          }}
        />
        <StepButton label="Draw 100" onStep={() => setBatches((b) => b + 1)} />
      </div>
      <Readout>{`Sample size ${size} · ${means.length} means drawn · spread of means ${Math.round(sd(means))}`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'Averages of samples form a bell curve',
  altText:
    'Prices are heavily skewed, but averages of samples drawn from them pile up into a narrower, more bell-shaped histogram as the sample size grows.',
  Component: SamplingDistribution,
};
export default viz;
