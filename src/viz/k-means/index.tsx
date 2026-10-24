import { scaleLinear } from 'd3-scale';
import { useMemo, useState } from 'react';
import { Axis } from '../Axis';
import { StepButton } from '../controls/StepButton';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { assign, inertia, kMeansStart, move } from './model';
import type { Centroid } from './model';

const W = 360;
const H = 260;

const x = scaleLinear().domain([-2.5, 2.8]).range([44, W - 10]);
const y = scaleLinear().domain([-2.5, 2.8]).range([H - 40, 10]);

interface State {
  labels: number[];
  centroids: Centroid[];
}

/** Marker per cluster: a circle, a square and a triangle, so clusters don't rely on color. */
function Marker({ k, cx, cy }: { k: number; cx: number; cy: number }) {
  const fill = ['var(--viz-train)', 'var(--viz-test)', 'var(--viz-prediction)'][k];
  if (k === 0) return <circle cx={cx} cy={cy} r={3.5} fill={fill} />;
  if (k === 1) return <rect x={cx - 3.5} y={cy - 3.5} width={7} height={7} fill={fill} />;
  return <path d={`M ${cx} ${cy - 4.5} L ${cx + 4.5} ${cy + 3.5} L ${cx - 4.5} ${cy + 3.5} Z`} fill={fill} />;
}

function KMeans() {
  const [n, setN] = useState(0);
  const { points, states } = useMemo(() => {
    const { points, centroids } = kMeansStart();
    // States after each step: even steps assign, odd steps move. 60 steps is far past convergence.
    const states: State[] = [{ centroids, labels: assign(points, centroids) }];
    for (let i = 1; i <= 60; i++) {
      const prev = states[i - 1];
      states.push(i % 2 === 1 ? { labels: prev.labels, centroids: move(points, prev.labels, prev.centroids) } : { centroids: prev.centroids, labels: assign(points, prev.centroids) });
    }
    return { points, states };
  }, []);
  const at = Math.min(n, states.length - 1);
  const s = states[at];
  const prev = at > 0 ? states[at - 1] : null;
  const same = (u: unknown, v: unknown) => JSON.stringify(u) === JSON.stringify(v);
  const unchanged = prev !== null && same(prev.labels, s.labels) && same(prev.centroids, s.centroids);
  const total = inertia(points, s.labels, s.centroids);

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Emails grouped into three clusters around moving centers">
        <Axis scale={x} orient="bottom" at={H - 40} ticks={5} label="links (standardized)" />
        <Axis scale={y} orient="left" at={44} ticks={5} label="capitals (std.)" />
        {points.map((p, i) => (
          <Marker key={i} k={s.labels[i]} cx={x(p[0])} cy={y(p[1])} />
        ))}
        {s.centroids.map((c, k) => (
          <g key={k} transform={`translate(${x(c[0])}, ${y(c[1])})`}>
            <path d="M -8 -8 L 8 8 M -8 8 L 8 -8" stroke="var(--surface)" strokeWidth={5} />
            <path d="M -8 -8 L 8 8 M -8 8 L 8 -8" stroke="var(--fg)" strokeWidth={2.5} />
          </g>
        ))}
        <text x={44} y={H - 6} className="viz-note">
          ✕ marks each cluster's center
        </text>
      </svg>
      <div className="viz-controls">
        <StepButton label="Step" onStep={() => setN((v) => v + 1)} />
        <StepButton label="Reset" onStep={() => setN(0)} />
      </div>
      <Readout>{`Step ${n} · ${n % 2 === 1 ? 'move' : 'assign'} · total distance ${total.toFixed(1)}${unchanged ? ' · converged' : ''}`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'Two simple steps repeated until nothing changes',
  altText:
    'Three centers start on random emails; each step either gives every email to its nearest center or moves each center to the middle of its emails, until nothing changes.',
  Component: KMeans,
};
export default viz;
