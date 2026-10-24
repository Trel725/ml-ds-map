import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { useMemo, useState } from 'react';
import { Axis } from '../Axis';
import { Slider } from '../controls/Slider';
import { mulberry32 } from '../random';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { fit1D, logLoss, logisticPoints, predict } from './model';

const W = 360;
const H = 240;

const x = scaleLinear().domain([0, 10]).range([44, W - 10]);
const y = scaleLinear().domain([0, 1]).range([H - 40, 14]);
const xs = Array.from({ length: 101 }, (_, i) => i / 10);
/** Fixed vertical jitter so stacked emails stay visible. */
const jitter = (() => {
  const rand = mulberry32(5);
  return Array.from({ length: 200 }, () => (rand() - 0.5) * 0.08);
})();

function LogisticRegression() {
  const [w, setW] = useState(0.5);
  const [b, setB] = useState(-2);
  const { pts, best } = useMemo(() => {
    const pts = logisticPoints();
    const fit = fit1D(pts);
    return { pts, best: logLoss(pts, fit.w, fit.b) };
  }, []);
  const loss = logLoss(pts, w, b);
  const curve = line<number>()
    .x((v) => x(v))
    .y((v) => y(predict(w, b, v)))(xs)!;

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Spam and normal emails by number of links, with an S-shaped curve of the chance of spam">
        <Axis scale={x} orient="bottom" at={H - 40} ticks={5} label="links" />
        <Axis scale={y} orient="left" at={44} tickValues={[0, 0.5, 1]} label="chance of spam" />
        <line x1={x(0)} x2={x(10)} y1={y(0.5)} y2={y(0.5)} stroke="var(--viz-grid)" strokeDasharray="3 3" />
        {pts.map((p, i) =>
          p.y === 1 ? (
            <circle key={i} cx={x(p.x)} cy={y(1 - Math.abs(jitter[i]))} r={3.5} fill="var(--viz-train)" />
          ) : (
            <circle key={i} cx={x(p.x)} cy={y(Math.abs(jitter[i]))} r={3.5} fill="var(--surface)" stroke="var(--viz-train)" strokeWidth={1.5} />
          ),
        )}
        <path d={curve} fill="none" stroke="var(--viz-prediction)" strokeWidth={2.5} />
        <g transform={`translate(44, ${H - 8})`} className="viz-note">
          <circle cx={4} cy={-4} r={3.5} fill="var(--viz-train)" />
          <text x={12}>spam (top)</text>
          <circle cx={92} cy={-4} r={3.5} fill="var(--surface)" stroke="var(--viz-train)" strokeWidth={1.5} />
          <text x={100}>not spam (bottom)</text>
        </g>
      </svg>
      <div className="viz-controls">
        <Slider label="Weight" min={-3} max={3} step={0.1} value={w} onChange={setW} format={(v) => v.toFixed(1)} />
        <Slider label="Bias" min={-10} max={10} step={0.5} value={b} onChange={setB} format={(v) => v.toFixed(1)} />
      </div>
      <Readout>{`Weight ${w.toFixed(1)} · bias ${b.toFixed(1)} · log loss ${loss.toFixed(2)} · best ${best.toFixed(2)}`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'A line bent into probabilities',
  altText:
    'Emails sit at the top if spam and the bottom if not, by number of links; the weight and bias tilt and shift an S-curve, and log loss scores how well it fits.',
  Component: LogisticRegression,
};
export default viz;
