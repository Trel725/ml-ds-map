import { scaleLinear } from 'd3-scale';
import { useMemo, useState } from 'react';
import { Axis } from '../Axis';
import { StepButton } from '../controls/StepButton';
import { mulberry32 } from '../random';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { diffInMeans, linksByLabel, pValue, shuffledDiffs } from './model';

const W = 360;
const H = 240;
const BATCH = 50;
const BINS = 30;
const SEED = 6;

function HypothesisTest() {
  const [n, setN] = useState(0);
  const { values, labels, observed } = useMemo(() => {
    const d = linksByLabel();
    return { ...d, observed: diffInMeans(d.values, d.labels) };
  }, []);
  const diffs = useMemo(() => shuffledDiffs(values, labels, n, mulberry32(SEED)), [values, labels, n]);
  const extreme = diffs.filter((d) => Math.abs(d) >= Math.abs(observed) - 1e-12).length;
  const p = pValue(observed, diffs);

  const lim = Math.ceil(Math.abs(observed) + 0.5);
  const x = scaleLinear().domain([-lim, lim]).range([44, W - 10]);
  const bw = (x(lim) - x(-lim)) / BINS;
  const counts = new Array<number>(BINS).fill(0);
  for (const d of diffs) counts[Math.min(BINS - 1, Math.max(0, Math.floor((x(d) - 44) / bw)))]++;
  const y = scaleLinear().domain([0, Math.max(5, ...counts)]).range([H - 40, 24]);

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gaps in average links after shuffling the spam labels, beside the real gap">
        {counts.map((c, i) => (
          <rect key={i} x={44 + i * bw + 0.5} y={y(c)} width={bw - 1} height={H - 40 - y(c)} fill="var(--viz-train)" fillOpacity={0.7} />
        ))}
        <line x1={x(observed)} x2={x(observed)} y1={18} y2={H - 40} stroke="var(--viz-error)" strokeWidth={2.5} />
        <text x={x(observed) - 4} y={14} textAnchor="end" className="viz-label" fill="var(--viz-error)">
          real gap
        </text>
        <Axis scale={x} orient="bottom" at={H - 40} ticks={6} label="spam minus normal, average links" />
        <text x={44} y={14} className="viz-note">
          {n === 0 ? 'shuffle the labels to see what chance does' : 'gaps from shuffled labels'}
        </text>
      </svg>
      <div className="viz-controls">
        <StepButton label="Shuffle 50" onStep={() => setN((v) => v + BATCH)} />
      </div>
      <Readout>
        {n === 0 ? `Real gap ${observed.toFixed(2)} links · no shuffles yet` : `${n} shuffles · ${extreme} as extreme as the real gap · p ≈ ${p.toFixed(3)}`}
      </Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'A p-value is how often chance alone does this well',
  altText:
    'Shuffling which emails are spam and recomputing the gap in links builds a pile of chance gaps around zero; the real gap sits far outside it.',
  Component: HypothesisTest,
};
export default viz;
