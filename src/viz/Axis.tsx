interface Scale {
  (v: number): number;
  ticks(count?: number): number[];
  range(): number[];
}

/** A plain axis drawn by React from a d3 scale: one baseline, a few ticks and labels. */
export function Axis({
  scale,
  orient,
  at,
  ticks = 4,
  format = (v: number) => String(v),
  label,
  tickValues,
}: {
  scale: Scale;
  orient: 'bottom' | 'left';
  /** y of a bottom axis, or x of a left axis. */
  at: number;
  ticks?: number;
  format?(v: number): string;
  label?: string;
  tickValues?: number[];
}) {
  const [r0, r1] = scale.range();
  const values = tickValues ?? scale.ticks(ticks);
  if (orient === 'bottom') {
    return (
      <g className="viz-axis" aria-hidden="true">
        <line x1={r0} x2={r1} y1={at} y2={at} />
        {values.map((v) => (
          <g key={v} transform={`translate(${scale(v)},${at})`}>
            <line y2={4} />
            <text y={16} textAnchor="middle">
              {format(v)}
            </text>
          </g>
        ))}
        {label && (
          <text x={r1} y={at + 30} textAnchor="end">
            {label}
          </text>
        )}
      </g>
    );
  }
  return (
    <g className="viz-axis" aria-hidden="true">
      <line y1={r0} y2={r1} x1={at} x2={at} />
      {values.map((v) => (
        <g key={v} transform={`translate(${at},${scale(v)})`}>
          <line x2={-4} />
          <text x={-7} dy="0.32em" textAnchor="end">
            {format(v)}
          </text>
        </g>
      ))}
      {label && (
        <text x={at + 4} y={Math.min(r0, r1) - 6}>
          {label}
        </text>
      )}
    </g>
  );
}
