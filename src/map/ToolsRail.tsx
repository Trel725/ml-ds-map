import type { Node } from '../data/schema';
import type { Layout } from '../layout/layout';
import { activateOnEnter } from './NodeShape';

export interface ToolsRailProps {
  tools: Node[];
  lay: Layout;
  isFaded(id: string): boolean;
  isHighlighted(id: string): boolean;
  selectedId: string | null;
  onSelect(id: string): void;
}

export function ToolsRail({ tools, lay, isFaded, isHighlighted, selectedId, onSelect }: ToolsRailProps) {
  const first = [...lay.toolPositions.values()][0];
  return (
    <g className="tools-rail">
      {first && (
        <text x={first.x} y={first.y - 6} className="rail-label">
          Tools
        </text>
      )}
      {tools.map((t) => {
        const b = lay.toolPositions.get(t.id);
        if (!b) return null;
        return (
          <g
            key={t.id}
            className={`tool${selectedId === t.id ? ' is-selected' : ''}`}
            data-node-id={t.id}
            data-faded={isFaded(t.id) ? 'true' : undefined}
            data-highlighted={isHighlighted(t.id) ? 'true' : undefined}
            role="button"
            tabIndex={0}
            aria-label={`${t.label}: ${t.oneLiner}`}
            style={{ transform: `translate(${b.x}px, ${b.y}px)` }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(t.id);
            }}
            onKeyDown={activateOnEnter(() => onSelect(t.id))}
          >
            <rect width={b.w} height={b.h} rx={b.h / 2} className="tool-shape" />
            <text x={12} y={b.h / 2} dominantBaseline="middle" className="tool-label">
              {t.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
