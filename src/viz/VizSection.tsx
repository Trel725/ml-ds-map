import { Component, useEffect, useId, useState } from 'react';
import type { ReactNode } from 'react';
import type { VizId } from './ids';
import { registry } from './registry';
import type { VizModule } from './types';
import './palette.css';

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

type LoadState =
  | { vizId: VizId; status: 'loading' }
  | { vizId: VizId; status: 'ready'; mod: VizModule }
  | { vizId: VizId; status: 'failed' };

/** Loads a visualization on demand and draws takeaway → visual, with fallbacks for load and render failures. */
export function VizSection({ vizId, loaders = registry }: { vizId: VizId; loaders?: typeof registry }) {
  const loader = loaders[vizId];
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ vizId, status: 'loading' });
  const altId = useId();

  useEffect(() => {
    if (!loader) return;
    let current = true;
    setState({ vizId, status: 'loading' });
    loader().then(
      (m) => current && setState({ vizId, status: 'ready', mod: m.default }),
      () => current && setState({ vizId, status: 'failed' }),
    );
    return () => {
      current = false;
    };
  }, [loader, vizId, attempt]);

  if (!loader) return null;
  // A state left over from another id is never shown.
  const s: LoadState = state.vizId === vizId ? state : { vizId, status: 'loading' };

  return (
    <section className="viz" data-testid="viz" data-viz-id={vizId} aria-label="Visualization">
      {s.status === 'loading' && <p className="viz-status">Loading…</p>}
      {s.status === 'failed' && (
        <div className="viz-status">
          <p>This visualization didn't load.</p>
          <button type="button" className="button" onClick={() => setAttempt((a) => a + 1)}>
            Retry
          </button>
        </div>
      )}
      {s.status === 'ready' && (
        <>
          <p className="viz-takeaway" data-testid="viz-takeaway">
            {s.mod.takeaway}
          </p>
          <figure className="viz-figure" aria-describedby={altId}>
            <Boundary key={vizId} fallback={<p className="viz-fallback">{s.mod.altText}</p>}>
              <s.mod.Component />
            </Boundary>
            <p id={altId} className="visually-hidden">
              {s.mod.altText}
            </p>
          </figure>
        </>
      )}
    </section>
  );
}
