import { scaleLinear } from 'd3-scale';
import { useMemo, useState } from 'react';
import { Axis } from '../Axis';
import { StepButton } from '../controls/StepButton';
import { mulberry32 } from '../random';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { bootstrapPrices, percentileInterval, resample } from './model';

const W = 360;
const H = 290;
const BATCH = 20;
const BINS = 20;
const SEED = 1;

const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;

function Bootstrap() {
  const [count, setCount] = useState(0);
  const prices = useMemo(() => bootstrapPrices(), []);
  // One seeded stream, replayed up to `count`, so the same count always shows the same resamples.
  const samples = useMemo(() => {
    const rand = mulberry32(SEED);
    return Array.from({ length: count }, () => resample(prices, rand));
  }, [prices, count]);
  const means = samples.map(mean);
  const latest = samples.at(-1);

  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  const x = scaleLinear().domain([lo - 10, hi + 10]).range([44, W - 10]);
  const repeats = new Map<number, number>();
  for (const v of latest ?? []) repeats.set(v, (repeats.get(v) ?? 0) + 1);

  const m0 = mean(prices);
  const mx = scaleLinear().domain([m0 - 60, m0 + 60]).range([44, W - 10]);
  const bw = (mx(m0 + 60) - mx(m0 - 60)) / BINS;
  const counts = new Array<number>(BINS).fill(0);
  for (const m of means) counts[Math.min(BINS - 1, Math.max(0, Math.floor((mx(m) - 44) / bw)))]++;
  const my = scaleLinear().domain([0, Math.max(4, ...counts)]).range([H - 30, 160]);
  const interval = means.length ? percentileInterval(means) : null;

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Twenty prices, the latest resample of them, and a histogram of resample averages">
        <text x={44} y={14} className="viz-note">
          the 20 prices you have
        </text>
        {prices.map((v, i) => (
          <circle key={`o${i}`} cx={x(v)} cy={30} r={4} fill="var(--viz-train)" />
        ))}
        <text x={44} y={62} className="viz-note">
          {latest ? 'latest resample (numbers show repeats)' : 'press Draw 20 to resample'}
        </text>
        {[...repeats].map(([v, n]) => (
          <g key={`r${v}`}>
            <circle cx={x(v)} cy={80} r={4 + n} fill="none" stroke="var(--viz-prediction)" strokeWidth={2} />
            {n > 1 && (
              <text x={x(v)} y={104} textAnchor="middle" className="viz-note">
                {`×${n}`}
              </text>
            )}
          </g>
        ))}
        <text x={44} y={136} className="viz-note">
          averages of the resamples
        </text>
        {counts.map((c, i) => (
          <rect key={`b${i}`} x={44 + i * bw + 0.5} y={my(c)} width={bw - 1} height={H - 30 - my(c)} fill="var(--viz-prediction)" fillOpacity={0.7} />
        ))}
        {interval &&
          interval.map((v, k) => (
            <line key={`i${k}`} x1={mx(v)} x2={mx(v)} y1={150} y2={H - 30} stroke="var(--viz-test)" strokeWidth={2} strokeDasharray="4 3" />
          ))}
        <Axis scale={mx} orient="bottom" at={H - 30} ticks={5} label="average price (k)" />
      </svg>
      <div className="viz-controls">
        <StepButton label="Draw 20" onStep={() => setCount((c) => c + BATCH)} />
      </div>
      <Readout>
        {interval ? `${count} resamples · middle 95% of means ${Math.round(interval[0])}–${Math.round(interval[1])}` : 'No resamples yet'}
      </Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'Fake new datasets from the one you have',
  altText:
    'Twenty prices are resampled with replacement again and again; the averages of those fake datasets spread out, and their middle 95% shows how unsure the average is.',
  Component: Bootstrap,
};
export default viz;
