import { useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Node } from '../data/schema';
import type { Box } from '../layout/layout';
import { wrapLabel } from './labels';

const LINE_H = 15;

export interface NodeShapeProps {
  node: Node;
  box: Box;
  /** Where the node animates from when it first appears (its group box). */
  from?: Box;
  faded?: boolean;
  highlighted?: boolean;
  selected?: boolean;
  onActivate(): void;
}

const activateOnEnter = (fn: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

/** A member node drawn in its grid cell; the shape encodes its kind. */
export function NodeShape({ node, box, from, faded, highlighted, selected, onActivate }: NodeShapeProps) {
  const [placed, setPlaced] = useState(!from);
  useEffect(() => {
    if (placed) return;
    const id = requestAnimationFrame(() => setPlaced(true));
    return () => cancelAnimationFrame(id);
  }, [placed]);
  const at = placed || !from ? box : { ...from, w: box.w, h: box.h };

  const round = node.kind === 'foundation' || node.kind === 'math';
  const d = box.h - 8;
  const textX = round ? d + 10 : 12;
  const lines = wrapLabel(node.label, round ? 13 : 17);
  const textY = box.h / 2 - ((lines.length - 1) * LINE_H) / 2;

  return (
    <g
      className={`node node-${node.kind}${selected ? ' is-selected' : ''}`}
      data-node-id={node.id}
      data-faded={faded ? 'true' : undefined}
      data-highlighted={highlighted ? 'true' : undefined}
      role="button"
      tabIndex={0}
      aria-label={`${node.label}: ${node.oneLiner}`}
      aria-pressed={selected}
      style={{ transform: `translate(${at.x}px, ${at.y}px)`, ['--layer' as string]: `var(--layer-${node.layer})`, ['--layer-strong' as string]: `var(--layer-${node.layer}-strong)` }}
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
      onKeyDown={activateOnEnter(onActivate)}
    >
      {round ? (
        <circle cx={4 + d / 2} cy={box.h / 2} r={d / 2} className="node-shape" />
      ) : (
        <rect x={0} y={4} width={box.w} height={box.h - 8} rx={node.kind === 'concept' ? (box.h - 8) / 2 : 8} className="node-shape" />
      )}
      {round && <rect x={0} y={0} width={box.w} height={box.h} className="node-hit" />}
      <text x={textX} y={textY} className="node-label" dominantBaseline="middle">
        {lines.map((l, i) => (
          <tspan key={i} x={textX} dy={i === 0 ? 0 : LINE_H}>
            {l}
          </tspan>
        ))}
      </text>
      {node.viz && (
        <text x={round ? 4 + d - 4 : box.w - 10} y={round ? 12 : 16} className="viz-badge" aria-hidden="true">
          ●<title>Has visualization</title>
        </text>
      )}
    </g>
  );
}

export { activateOnEnter };
