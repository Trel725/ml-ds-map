import { scaleLinear } from 'd3-scale';
import { useMemo, useState } from 'react';
import { Axis } from '../Axis';
import { Slider } from '../controls/Slider';
import { emails } from '../datasets';
import { regions } from '../decision-tree/model';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { forestVote, growForest } from './model';

const W = 360;
const H = 270;
const MAX_TREES = 25;
const SEED = 3;
const BOUNDS = { x0: 0, x1: 10, y0: 0, y1: 1 };
const GRID_X = 40;
const GRID_Y = 24;

const x = scaleLinear().domain([0, 10]).range([44, W - 10]);
const y = scaleLinear().domain([0, 1]).range([H - 50, 10]);

/** Three shading levels for the share of trees voting spam; below half, no shading. */
const shade = (vote: number) => (vote >= 0.85 ? 0.38 : vote >= 0.67 ? 0.24 : vote >= 0.5 ? 0.12 : 0);

function RandomForest() {
  const [n, setN] = useState(1);
  const { train, test, forest } = useMemo(() => {
    const train = emails().filter((e) => e.split === 'train');
    return { train, test: emails().filter((e) => e.split === 'test'), forest: growForest(train, MAX_TREES, SEED) };
  }, []);
  const trees = forest.slice(0, n);
  const cells = useMemo(() => {
    const out: { i: number; j: number; vote: number }[] = [];
    for (let i = 0; i < GRID_X; i++) {
      for (let j = 0; j < GRID_Y; j++) {
        out.push({ i, j, vote: forestVote(trees, { links: ((i + 0.5) / GRID_X) * 10, capsShare: (j + 0.5) / GRID_Y }) });
      }
    }
    return out;
  }, [trees]);
  const acc = test.filter((e) => (forestVote(trees, e) >= 0.5 ? 1 : 0) === e.label).length / test.length;
  const cw = (x(10) - x(0)) / GRID_X;
  const ch = (y(0) - y(1)) / GRID_Y;

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Emails shaded by how many trees in the forest vote spam">
        {cells.map((c) =>
          shade(c.vote) > 0 ? (
            <rect key={`${c.i}-${c.j}`} x={x(0) + c.i * cw} y={y(1) + (GRID_Y - 1 - c.j) * ch} width={cw + 0.3} height={ch + 0.3} fill="var(--viz-prediction)" fillOpacity={shade(c.vote)} />
          ) : null,
        )}
        {trees.slice(0, 3).flatMap((t, k) =>
          regions(t, BOUNDS).map((r, i) => (
            <rect
              key={`${k}-${i}`}
              x={x(r.x0)}
              y={y(r.y1)}
              width={x(r.x1) - x(r.x0)}
              height={y(r.y0) - y(r.y1)}
              fill="none"
              stroke="var(--viz-axis)"
              strokeOpacity={0.35}
              strokeDasharray={k === 0 ? undefined : k === 1 ? '4 3' : '1 3'}
            />
          )),
        )}
        <Axis scale={x} orient="bottom" at={y(0)} ticks={5} label="links" />
        <Axis scale={y} orient="left" at={x(0)} ticks={4} format={(v) => `${Math.round(v * 100)}%`} label="capitals" />
        {train.map((e, i) =>
          e.label === 1 ? (
            <circle key={i} cx={x(e.links)} cy={y(e.capsShare)} r={3.5} fill="var(--viz-train)" />
          ) : (
            <circle key={i} cx={x(e.links)} cy={y(e.capsShare)} r={3.5} fill="var(--surface)" stroke="var(--viz-train)" strokeWidth={1.5} />
          ),
        )}
        <g transform={`translate(44, ${H - 12})`} className="viz-note">
          <circle cx={4} cy={-4} r={3.5} fill="var(--viz-train)" />
          <text x={12}>spam</text>
          <circle cx={62} cy={-4} r={3.5} fill="var(--surface)" stroke="var(--viz-train)" strokeWidth={1.5} />
          <text x={70}>not spam</text>
          <rect x={140} y={-9} width={10} height={10} fill="var(--viz-prediction)" fillOpacity={0.38} />
          <text x={156}>darker: more trees say spam</text>
        </g>
      </svg>
      <div className="viz-controls">
        <Slider label="Trees" min={1} max={MAX_TREES} step={1} value={n} onChange={setN} />
      </div>
      <Readout>{`${n} ${n === 1 ? 'tree' : 'trees'} · test accuracy ${Math.round(acc * 100)}%`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'Averaging many noisy guesses gives a smooth one',
  altText:
    'One random tree carves the emails into jagged boxes; as more trees vote, the shaded spam area becomes smoother and test accuracy steadies.',
  Component: RandomForest,
};
export default viz;
