import { useMemo, useState } from 'react';
import { StepButton } from '../controls/StepButton';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { EXAMPLE, NET, steps } from './model';
import type { Target } from './model';

const W = 360;
const H = 230;

const NODES: Record<'x0' | 'x1' | 'h0' | 'h1' | 'out' | 'loss', { x: number; y: number; name: string }> = {
  x0: { x: 40, y: 70, name: `x₁ = ${EXAMPLE.x[0]}` },
  x1: { x: 40, y: 160, name: `x₂ = ${EXAMPLE.x[1]}` },
  h0: { x: 160, y: 70, name: 'h₁' },
  h1: { x: 160, y: 160, name: 'h₂' },
  out: { x: 270, y: 115, name: 'ŷ' },
  loss: { x: 330, y: 115, name: `y = ${EXAMPLE.y}` },
};
const EDGES: [keyof typeof NODES, keyof typeof NODES][] = [
  ['x0', 'h0'],
  ['x1', 'h0'],
  ['x0', 'h1'],
  ['x1', 'h1'],
  ['h0', 'out'],
  ['h1', 'out'],
];

const fmt = (v: number) => (Math.abs(v) < 0.001 ? v.toExponential(1) : v.toFixed(3));

/** Where a value's text sits: beside its node, or a third of the way along its edge. */
function anchor(at: Target): { x: number; y: number } {
  if (at.includes('>')) {
    const [a, b] = at.split('>') as [keyof typeof NODES, keyof typeof NODES];
    return { x: NODES[a].x + (NODES[b].x - NODES[a].x) * 0.62, y: NODES[a].y + (NODES[b].y - NODES[a].y) * 0.62 - 6 };
  }
  const n = NODES[at as keyof typeof NODES];
  return { x: n.x, y: n.y - 24 };
}

function Backpropagation() {
  const [i, setI] = useState(0);
  const phases = useMemo(() => steps(NET, EXAMPLE.x, EXAMPLE.y), []);
  const phase = phases[i];
  const color = phase.direction === 'forward' ? 'var(--viz-prediction)' : 'var(--viz-error)';
  const arrow = phase.direction === 'forward' ? '→' : '←';

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="A network with two inputs, two hidden units and one output, showing values flowing forward and errors flowing back">
        {EDGES.map(([a, b]) => (
          <line key={`${a}${b}`} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} stroke="var(--viz-grid)" strokeWidth={2} />
        ))}
        <line x1={NODES.out.x} y1={NODES.out.y} x2={NODES.loss.x} y2={NODES.loss.y} stroke="var(--viz-grid)" strokeWidth={2} strokeDasharray="3 3" />
        {(Object.keys(NODES) as (keyof typeof NODES)[]).map((k) => (
          <g key={k}>
            {k === 'loss' ? (
              <rect x={NODES[k].x - 22} y={NODES[k].y - 12} width={44} height={24} rx={4} fill="var(--surface)" stroke="var(--viz-axis)" />
            ) : (
              <circle cx={NODES[k].x} cy={NODES[k].y} r={16} fill="var(--surface)" stroke="var(--viz-axis)" strokeWidth={1.5} />
            )}
            <text x={NODES[k].x} y={NODES[k].y + (k.startsWith('x') ? 32 : 4)} textAnchor="middle" className="viz-note">
              {NODES[k].name}
            </text>
          </g>
        ))}
        {phase.values.map((v) => {
          const p = anchor(v.at);
          return (
            <text key={v.at + v.label} x={p.x} y={p.y} textAnchor="middle" className="viz-label" fill={color}>
              {`${arrow} ${v.label ? `${v.label} ` : ''}${fmt(v.value)}`}
            </text>
          );
        })}
        <text x={8} y={H - 8} className="viz-note">
          {phase.direction === 'forward' ? '→ values flow forward' : '← error flows backward through the chain rule'}
        </text>
      </svg>
      <div className="viz-controls">
        <StepButton label="Step" onStep={() => setI((v) => (v + 1) % phases.length)} />
      </div>
      <Readout>{`Step ${i + 1} of ${phases.length} · ${phase.name}`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'Error flows backward through the chain rule',
  altText:
    'A tiny network computes its hidden values and output going forward, then passes the error backward, giving every weight its share of the blame.',
  Component: Backpropagation,
};
export default viz;
