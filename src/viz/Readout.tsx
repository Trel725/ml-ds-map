/** The live text line every visualization updates as its controls move. */
export function Readout({ children }: { children: string }) {
  return (
    <p className="viz-readout" data-testid="viz-readout" aria-live="polite">
      {children}
    </p>
  );
}
