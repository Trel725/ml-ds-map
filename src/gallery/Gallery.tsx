import { useId, useMemo } from 'react';
import { useApp, useGraph } from '../app/StoreContext';
import { byLayerThenLabel } from '../graph/graph';
import { Chip } from '../panel/Chip';
import { VIZ_IDS } from '../viz/ids';
import { registry } from '../viz/registry';
import type { VizLoaders } from '../viz/registry';
import { VizSection } from '../viz/VizSection';
import './gallery.css';

/** Every visualization in one page, each with chips for the topics that use it. */
export function Gallery({ loaders = registry }: { loaders?: VizLoaders }) {
  const graph = useGraph();
  const closeGallery = useApp((s) => s.closeGallery);
  const headingId = useId();
  const topicsByViz = useMemo(() => {
    const sorted = [...graph.content.nodes].sort(byLayerThenLabel);
    return new Map(VIZ_IDS.map((id) => [id, sorted.filter((n) => n.viz === id)]));
  }, [graph]);

  return (
    <main className="gallery" aria-labelledby={headingId}>
      <div className="gallery-head">
        <h2 id={headingId}>Visualizations</h2>
        <p>Every visualization in the map, in one place. Open a topic to see it in context.</p>
        <button type="button" className="button" onClick={closeGallery}>
          Back to map
        </button>
      </div>
      <ul className="gallery-grid" aria-label="Visualizations">
        {VIZ_IDS.map((id) => {
          const topics = topicsByViz.get(id) ?? [];
          return (
            <li key={id} className="gallery-card" data-testid="gallery-card" data-viz-id={id}>
              <h3>{topics[0]?.label ?? id}</h3>
              <VizSection vizId={id} loaders={loaders} />
              <p className="gallery-topics">
                Open topic:{' '}
                {topics.map((n) => (
                  <Chip key={n.id} nodeId={n.id} testId="gallery-topic" />
                ))}
              </p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
