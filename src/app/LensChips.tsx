import { LENSES } from '../data/schema';
import type { LensId } from '../data/schema';
import { useApp } from './StoreContext';

const LABELS: Record<LensId, string> = {
  econometrics: 'Econometrics',
  nlp: 'NLP',
  'time-series': 'Time series',
  'neural-nets': 'Neural nets',
};

/** One lens at a time; a pressed chip also shows a check mark so color is not the only cue. */
export function LensChips() {
  const active = useApp((s) => s.activeLens);
  const toggle = useApp((s) => s.toggleLens);
  return (
    <div className="lens-chips" role="group" aria-label="Lenses">
      {LENSES.map((lens) => (
        <button key={lens} type="button" className="lens-chip" aria-pressed={active === lens} onClick={() => toggle(lens)}>
          {active === lens && (
            <span className="lens-check" aria-hidden="true">
              ✓{' '}
            </span>
          )}
          {LABELS[lens]}
        </button>
      ))}
    </div>
  );
}
