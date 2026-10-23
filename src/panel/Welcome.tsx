import { useApp } from '../app/StoreContext';

export function Welcome() {
  const startTour = useApp((s) => s.startTour);
  return (
    <div className="welcome">
      <h2>Find where an idea fits</h2>
      <p>
        Each band is a layer of ideas, with the math you already know at the bottom. Pick any topic to see what it needs and
        what it leads to.
      </p>
      <button type="button" className="button button-primary" onClick={() => startTour('how-a-model-learns')}>
        Start the tour
      </button>
    </div>
  );
}
