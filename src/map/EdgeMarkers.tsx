/** Arrowheads and the bar end, shared by every edge. */
export function EdgeMarkers() {
  return (
    <defs>
      <marker id="edge-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" className="edge-marker-fill" />
      </marker>
      <marker id="edge-open-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
        <path d="M 1 1 L 9 5 L 1 9" className="edge-marker-line" />
      </marker>
      <marker id="edge-bar" viewBox="0 0 4 12" refX="2" refY="6" markerWidth="4" markerHeight="10" orient="auto">
        <rect x="0.5" y="0" width="3" height="12" className="edge-marker-fill" />
      </marker>
    </defs>
  );
}
