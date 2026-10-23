import { useApp, useGraph } from '../app/StoreContext';
import './tour.css';

/** A small non-modal card that walks through a tour's stops. */
export function TourCard() {
  const graph = useGraph();
  const tour = useApp((s) => s.tour);
  const tourStep = useApp((s) => s.tourStep);
  const endTour = useApp((s) => s.endTour);
  const t = tour && graph.content.tours.find((x) => x.id === tour.id);
  if (!tour || !t) return null;
  const stop = t.stops[tour.step];
  const last = tour.step === t.stops.length - 1;

  return (
    <div className="tour-card" data-testid="tour-card" role="dialog" aria-modal="false" aria-label={t.title}>
      <div className="tour-head">
        <h2>{t.title}</h2>
        <span className="tour-progress">
          Step {tour.step + 1} of {t.stops.length}
        </span>
      </div>
      <p className="tour-stop">{graph.nodesById.get(stop.node)?.label}</p>
      <p className="tour-caption" aria-live="polite">
        {stop.caption}
      </p>
      <div className="tour-actions">
        <button type="button" className="button" onClick={() => tourStep(-1)} disabled={tour.step === 0}>
          Back
        </button>
        <button type="button" className="button button-primary" onClick={() => tourStep(1)}>
          {last ? 'Finish' : 'Next'}
        </button>
        <button type="button" className="button tour-close" onClick={endTour}>
          Close
        </button>
      </div>
    </div>
  );
}
