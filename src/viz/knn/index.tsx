import { scaleLinear } from 'd3-scale';
import { useMemo, useState } from 'react';
import { Axis } from '../Axis';
import { Toggle } from '../controls/Toggle';
import { useDrag } from '../controls/useDrag';
import { emails } from '../datasets';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { neighbors, vote } from './model';

const W = 360;
const H = 270;
const K = 5;

const x = scaleLinear().domain([0, 10]).range([44, W - 10]);
const y = scaleLinear().domain([0, 1]).range([H - 50, 10]);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (v: number, step: number) => Math.round(v / step) * step;

function Knn() {
  const [query, setQuery] = useState({ links: 4, capsShare: 0.9 });
  const [scaled, setScaled] = useState(false);
  const train = useMemo(() => emails().filter((e) => e.split === 'train'), []);
  const near = neighbors(train, query, K, scaled);
  const spam = near.filter((i) => train[i].label === 1).length;
  const label = vote(train, near) === 1 ? 'spam' : 'not spam';
  // Dragging works in plot units where both axes run 0–10, so one arrow step is 0.5 links or 5% capitals.
  const drag = useDrag({
    label: 'Query email',
    valueText: `${query.links.toFixed(2)} links, ${Math.round(query.capsShare * 100)}% capitals`,
    step: 0.5,
    pxToData: (dx, dy) => [dx / ((x(10) - x(0)) / 10), -dy / ((y(0) - y(1)) / 10)],
    onDrag: (dl, dc) =>
      setQuery((q) => ({
        links: clamp(round(q.links + dl, 0.01), 0, 10),
        capsShare: clamp(round(q.capsShare + dc / 10, 0.01), 0, 1),
      })),
  });

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Emails by links and capitals, with a query email joined to its five nearest neighbors">
        <Axis scale={x} orient="bottom" at={y(0)} ticks={5} label="links" />
        <Axis scale={y} orient="left" at={x(0)} ticks={4} format={(v) => `${Math.round(v * 100)}%`} label="capitals" />
        {near.map((i) => (
          <line key={`n${i}`} x1={x(query.links)} y1={y(query.capsShare)} x2={x(train[i].links)} y2={y(train[i].capsShare)} stroke="var(--viz-prediction)" strokeWidth={1.5} />
        ))}
        {train.map((e, i) =>
          e.label === 1 ? (
            <circle key={i} cx={x(e.links)} cy={y(e.capsShare)} r={3.5} fill="var(--viz-train)" />
          ) : (
            <circle key={i} cx={x(e.links)} cy={y(e.capsShare)} r={3.5} fill="var(--surface)" stroke="var(--viz-train)" strokeWidth={1.5} />
          ),
        )}
        <path
          d={`M ${x(query.links)} ${y(query.capsShare) - 8} l 8 8 l -8 8 l -8 -8 Z`}
          fill="var(--viz-prediction)"
          stroke="var(--surface)"
          strokeWidth={1.5}
          {...drag}
        />
        <g transform={`translate(44, ${H - 12})`} className="viz-note">
          <circle cx={4} cy={-4} r={3.5} fill="var(--viz-train)" />
          <text x={12}>spam</text>
          <circle cx={62} cy={-4} r={3.5} fill="var(--surface)" stroke="var(--viz-train)" strokeWidth={1.5} />
          <text x={70}>not spam</text>
          <path d="M 144 -12 l 6 6 l -6 6 l -6 -6 Z" fill="var(--viz-prediction)" />
          <text x={156}>query (drag me)</text>
        </g>
      </svg>
      <div className="viz-controls">
        <Toggle label="Scale features" checked={scaled} onChange={setScaled} />
      </div>
      <Readout>{`Neighbors: ${spam} spam, ${K - spam} not spam · prediction ${label} · features ${scaled ? 'scaled' : 'unscaled'}`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'A prediction is a vote of the neighbors; unscaled features distort distance',
  altText:
    'A draggable email is joined to its five closest training emails, which vote on spam; without scaling, the number of links swamps the share of capitals.',
  Component: Knn,
};
export default viz;
