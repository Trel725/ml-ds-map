import { useApp, useGraph } from '../app/StoreContext';

export const FIRST_TOUR = 'how-a-model-learns';
/** The product spec's numbering for tours 2–5; tours not listed follow in content order. */
const TOUR_ORDER = ['from-tree-to-forest', 'why-logs-are-everywhere', 'explain-vs-predict', 'from-neuron-to-network'];

export function Welcome() {
  const graph = useGraph();
  const startTour = useApp((s) => s.startTour);
  const rank = (id: string) => (TOUR_ORDER.includes(id) ? TOUR_ORDER.indexOf(id) : TOUR_ORDER.length);
  const more = graph.content.tours.filter((t) => t.id !== FIRST_TOUR).sort((a, b) => rank(a.id) - rank(b.id));
  return (
    <div className="welcome">
      <h2>Find where an idea fits</h2>
      <p>
        Each band is a layer of ideas, with the math you already know at the bottom. Pick any topic to see what it needs and
        what it leads to.
      </p>
      <p className="welcome-keys">Keyboard: Tab moves between topics, Enter opens one, arrow keys follow its connections.</p>
      <button type="button" className="button button-primary" onClick={() => startTour(FIRST_TOUR)}>
        Start the tour
      </button>
      {more.length > 0 && (
        <>
          <h3 className="welcome-more">More tours</h3>
          <ul className="tour-list" aria-label="More tours">
            {more.map((t) => (
              <li key={t.id}>
                <button type="button" className="button" onClick={() => startTour(t.id)}>
                  {t.title}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
