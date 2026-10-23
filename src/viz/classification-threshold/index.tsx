import { scaleLinear } from 'd3-scale';
import { useMemo, useRef, useState } from 'react';
import { Axis } from '../Axis';
import { Slider } from '../controls/Slider';
import { useDrag } from '../controls/useDrag';
import { emails } from '../datasets';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { confusion, precision, probability, recall } from './model';

const W = 360;
const H = 270;
const STEP = 0.05;
const ROW_SPAM = 48;
const ROW_HAM = 92;

const x = scaleLinear().domain([0, 1]).range([84, W - 14]);
const snap = (v: number) => Math.round(Math.min(1, Math.max(0, v)) / STEP) * STEP;

function Cell({ cx, cy, n, label, good }: { cx: number; cy: number; n: number; label: string; good: boolean }) {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <rect width={120} height={34} rx={4} fill={good ? 'var(--viz-prediction)' : 'var(--viz-error)'} fillOpacity={0.16} />
      <text x={10} y={22} className="viz-label">
        {n}
      </text>
      <text x={38} y={22} className="viz-note">
        {label}
      </text>
    </g>
  );
}

function ClassificationThreshold() {
  const [threshold, setThreshold] = useState(0.5);
  const raw = useRef(0.5);
  const set = (v: number) => {
    raw.current = Math.min(1, Math.max(0, v));
    setThreshold(snap(raw.current));
  };
  const data = useMemo(() => emails().map((e, i) => ({ ...e, p: probability(e), jitter: ((i * 37) % 17) - 8 })), []);
  const c = confusion(
    data.map((d) => d.p),
    data.map((d) => d.label),
    threshold,
  );
  const drag = useDrag({
    onDrag: (dx) => set(raw.current + dx),
    step: STEP,
    pxToData: (dxPx) => [dxPx / (x(1) - x(0)), 0],
    label: 'Threshold line',
    valueText: threshold.toFixed(2),
  });

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Emails sorted by predicted spam chance, a threshold line, and the resulting counts">
        <rect x={x(threshold)} y={22} width={x(1) - x(threshold)} height={96} fill="var(--viz-prediction)" fillOpacity={0.12} />
        <text x={8} y={ROW_SPAM + 4} className="viz-note">
          spam
        </text>
        <text x={8} y={ROW_HAM + 4} className="viz-note">
          not spam
        </text>
        {data.map((d, i) =>
          d.label === 1 ? (
            <circle key={i} cx={x(d.p)} cy={ROW_SPAM + d.jitter} r={3.5} fill="var(--viz-train)" />
          ) : (
            <circle key={i} cx={x(d.p)} cy={ROW_HAM + d.jitter} r={3.5} fill="var(--surface)" stroke="var(--viz-train)" strokeWidth={1.5} />
          ),
        )}
        <Axis scale={x} orient="bottom" at={122} tickValues={[0, 0.25, 0.5, 0.75, 1]} label="predicted chance of spam" />
        <line x1={x(threshold)} x2={x(threshold)} y1={16} y2={122} stroke="var(--viz-prediction)" strokeWidth={2.5} />
        <rect x={x(threshold) - 7} y={6} width={14} height={14} rx={3} fill="var(--viz-prediction)" {...drag} />
        <text x={x(threshold) + 10} y={17} className="viz-note">
          flagged as spam →
        </text>

        <text x={84} y={176} className="viz-note">
          flagged
        </text>
        <text x={210} y={176} className="viz-note">
          not flagged
        </text>
        <text x={8} y={200} className="viz-note">
          spam
        </text>
        <text x={8} y={240} className="viz-note">
          not spam
        </text>
        <Cell cx={84} cy={182} n={c.tp} label="caught" good />
        <Cell cx={210} cy={182} n={c.fn} label="missed" good={false} />
        <Cell cx={84} cy={222} n={c.fp} label="false alarm" good={false} />
        <Cell cx={210} cy={222} n={c.tn} label="left alone" good />
      </svg>
      <div className="viz-controls">
        <Slider label="Threshold" min={0} max={1} step={STEP} value={threshold} onChange={set} format={(v) => v.toFixed(2)} />
      </div>
      <Readout>{`Threshold ${threshold.toFixed(2)} · precision ${precision(c).toFixed(2)} · recall ${recall(c).toFixed(2)}`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'Precision and recall trade off against each other',
  altText:
    'Moving the spam threshold right flags fewer emails: false alarms drop and precision rises, but more spam is missed and recall falls.',
  Component: ClassificationThreshold,
};
export default viz;
