import type { Layout } from '../layout/layout';

export function Lanes({ lay, prominent }: { lay: Layout; prominent: boolean }) {
  return (
    <g className="lanes">
      {lay.lanes.map((lane) => (
        <g key={lane.layer} data-lane={lane.layer} className={`lane lane-${lane.layer}`}>
          <rect x={0} y={lane.y} width={lay.width} height={lane.h} className="lane-band" style={{ fill: `var(--layer-${lane.layer})` }} />
          <text x={16} y={lane.y + lane.h / 2} dominantBaseline="middle" className={prominent ? 'lane-label lane-label-big' : 'lane-label'}>
            {lane.label}
          </text>
        </g>
      ))}
    </g>
  );
}
