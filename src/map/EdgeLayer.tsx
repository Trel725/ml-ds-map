import type { KeyboardEvent, MouseEvent } from 'react';
import type { Graph } from '../graph/graph';
import type { VisibleEdge } from '../graph/visibleEdges';
import type { Box } from '../layout/layout';
import { EDGE_STYLES, edgeMidpoint, edgePath } from './edgeStyles';

export interface EdgeLayerProps {
  graph: Graph;
  edges: VisibleEdge[];
  boxOf(visualId: string): Box | undefined;
  onSelect(edgeId: string): void;
  /** `at` is in client coordinates; null hides the tooltip. */
  onHover(lines: string[] | null, at?: { x: number; y: number }): void;
}

export function EdgeLayer({ graph, edges, boxOf, onSelect, onHover }: EdgeLayerProps) {
  return (
    <g className="edges">
      {edges.map((ve) => {
        const a = boxOf(ve.from);
        const b = boxOf(ve.to);
        if (!a || !b) return null;
        const style = EDGE_STYLES[ve.type];
        const sentences = ve.edgeIds.map((id) => graph.edgesById.get(id)?.sentence ?? id);
        const d = edgePath(a, b, { trim: true });
        const mid = edgeMidpoint(a, b);
        const show = (e: MouseEvent<SVGPathElement>) => onHover(sentences, { x: e.clientX, y: e.clientY });
        const onKey = (e: KeyboardEvent<SVGPathElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(ve.edgeIds[0]);
          }
        };
        return (
          <g key={ve.key} data-edge-key={ve.key} data-edge-type={ve.type} className={`edge${style.muted ? ' edge-muted' : ''}`}>
            <path
              d={d}
              className="edge-line"
              strokeWidth={style.width}
              strokeDasharray={style.dash}
              markerEnd={style.marker === 'none' ? undefined : `url(#edge-${style.marker})`}
            />
            <path
              d={`${d} Z`}
              className="edge-hit"
              tabIndex={0}
              role="button"
              aria-label={sentences.join('. ')}
              aria-describedby="edge-tooltip"
              onMouseEnter={show}
              onMouseMove={show}
              onMouseLeave={() => onHover(null)}
              onFocus={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                onHover(sentences, { x: r.x + r.width / 2, y: r.y + r.height / 2 });
              }}
              onBlur={() => onHover(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(ve.edgeIds[0]);
              }}
              onKeyDown={onKey}
            />
            {ve.type === 'not-same-as' && (
              <text x={mid.x} y={mid.y} className="edge-neq" textAnchor="middle" dominantBaseline="middle" aria-hidden="true">
                ≠
              </text>
            )}
            {ve.count > 1 && (
              <text x={mid.x} y={mid.y - 10} className="edge-badge" textAnchor="middle">
                {`+${ve.count - 1}`}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
