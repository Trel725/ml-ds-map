import type { Group } from '../data/schema';
import type { Box } from '../layout/layout';
import { activateOnEnter } from './NodeShape';

export interface GroupNodeProps {
  group: Group;
  box: Box & { expanded: boolean };
  memberCount: number;
  faded?: boolean;
  highlighted?: boolean;
  onToggle(): void;
}

/** A collapsed group is one clickable box; an expanded one is an outline whose header collapses it. */
export function GroupNode({ group, box, memberCount, faded, highlighted, onToggle }: GroupNodeProps) {
  const common = {
    'data-group-id': group.id,
    'data-faded': faded ? 'true' : undefined,
    'data-highlighted': highlighted ? 'true' : undefined,
    role: 'button',
    tabIndex: 0,
    'aria-expanded': box.expanded,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggle();
    },
    onKeyDown: activateOnEnter(onToggle),
  };
  const style = {
    ['--layer' as string]: `var(--layer-${group.layer})`,
    ['--layer-strong' as string]: `var(--layer-${group.layer}-strong)`,
  };

  if (!box.expanded) {
    return (
      <g
        {...common}
        className="group group-collapsed"
        aria-label={`${group.label} group, ${memberCount} topics`}
        style={{ ...style, transform: `translate(${box.x}px, ${box.y}px)` }}
      >
        <rect width={box.w} height={box.h} rx={10} className="group-shape" />
        <rect x={4} y={4} width={box.w} height={box.h} rx={10} className="group-stack" aria-hidden="true" />
        <text x={box.w / 2} y={box.h / 2} textAnchor="middle" dominantBaseline="middle" className="group-label">
          {group.label}
        </text>
      </g>
    );
  }

  return (
    <g className="group group-expanded" style={{ ...style, transform: `translate(${box.x}px, ${box.y}px)` }}>
      <rect width={box.w} height={box.h} rx={12} className="group-outline" />
      <g {...common} className="group-header" aria-label={`${group.label} group, ${memberCount} topics, expanded`}>
        <rect width={box.w} height={24} rx={8} className="group-header-hit" />
        <text x={12} y={14} dominantBaseline="middle" className="group-header-label">
          {group.label} <tspan className="group-header-hint">− collapse</tspan>
        </text>
      </g>
    </g>
  );
}
