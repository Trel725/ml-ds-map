import { useEffect, useMemo, useRef } from 'react';
import { useApp, useGraph } from '../app/StoreContext';
import { LAYERS } from '../data/schema';
import type { Layer } from '../data/schema';
import { FIRST_TOUR } from '../panel/Welcome';
import './list.css';

const LAYER_LABELS: Record<Layer, string> = {
  foundations: 'Foundations',
  math: 'Math',
  core: 'Core concepts',
  algorithms: 'Algorithms',
  problems: 'Problems',
  tools: 'Tools',
};

/** The small-screen stand-in for the map: every topic, layer by layer, group by group. */
export function ListView({ hidden }: { hidden: boolean }) {
  const graph = useGraph();
  const selection = useApp((s) => s.selection);
  const highlight = useApp((s) => s.highlight);
  const select = useApp((s) => s.select);
  const startTour = useApp((s) => s.startTour);
  const rootRef = useRef<HTMLElement>(null);

  const layers = useMemo(
    () =>
      LAYERS.map((layer) => ({
        layer,
        groups: graph.content.groups
          .filter((g) => g.layer === layer)
          .sort((a, b) => a.order - b.order)
          .map((g) => ({ group: g, members: graph.membersByGroup.get(g.id) ?? [] }))
          .filter((x) => x.members.length > 0),
      })),
    [graph],
  );

  // The last node that was open, so coming back lands on its item.
  const lastNode = useRef<string | null>(null);
  useEffect(() => {
    if (selection?.kind === 'node') lastNode.current = selection.id;
  }, [selection]);
  useEffect(() => {
    if (hidden || !lastNode.current) return;
    const el = rootRef.current?.querySelector<HTMLElement>(`.list-item[data-node-id="${lastNode.current}"]`);
    el?.scrollIntoView?.({ block: 'center' });
    el?.focus({ preventScroll: true });
  }, [hidden]);

  const focusing = highlight.ids.size > 0;

  return (
    <section className="list-view" data-testid="list-view" aria-label="Topics" hidden={hidden} ref={rootRef}>
      <p className="list-intro">Topics by layer, from the math you already know up to the problems people solve.</p>
      <button type="button" className="button button-primary" onClick={() => startTour(FIRST_TOUR)}>
        Start the tour
      </button>
      {layers.map(({ layer, groups }) => (
        <section key={layer} className="list-layer" style={{ ['--layer-strong' as string]: `var(--layer-${layer}-strong)` }}>
          <h2>{LAYER_LABELS[layer]}</h2>
          {groups.map(({ group, members }) => (
            <div key={group.id} className="list-group">
              <h3>{group.label}</h3>
              <ul>
                {members.map((n) => {
                  const lit = highlight.ids.has(n.id);
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        className="list-item"
                        data-node-id={n.id}
                        data-highlighted={lit ? 'true' : undefined}
                        data-faded={focusing && !lit ? 'true' : undefined}
                        onClick={() => select({ kind: 'node', id: n.id })}
                      >
                        <span className="list-item-label">
                          {n.label}
                          {n.viz && (
                            <span className="viz-badge" aria-hidden="true">
                              ●
                            </span>
                          )}
                        </span>
                        <span className="list-item-line">{n.oneLiner}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </section>
  );
}
