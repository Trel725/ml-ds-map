export interface TooltipState {
  lines: string[];
  x: number;
  y: number;
}

/** The edge's sentence, one line per merged edge, near the pointer or the focused edge. */
export function EdgeTooltip({ tip }: { tip: TooltipState | null }) {
  if (!tip) return null;
  return (
    <div role="tooltip" id="edge-tooltip" className="edge-tooltip" style={{ left: tip.x + 12, top: tip.y + 12 }}>
      {tip.lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}
