import { useMemo } from 'react';
import { useApp, useGraph } from '../../app/StoreContext';
import type { Node } from '../../data/schema';
import { neededBy } from '../../graph/graph';
import { traceUp } from '../../graph/trace';
import { Chip } from '../Chip';
import { sameIds } from '../highlight';

/** Foundation and math nodes only: why this matters in ML, and what needs it. */
export function ShowsUpIn({ node }: { node: Node }) {
  const graph = useGraph();
  const startTrace = useApp((s) => s.traceUp);
  const highlight = useApp((s) => s.highlight);
  const trace = useMemo(() => traceUp(graph, node.id), [graph, node.id]);
  const tracing = highlight.mode === 'trace-up' && sameIds(highlight.ids, [...trace.nodeIds, ...trace.edgeIds]);
  if (node.kind !== 'foundation' && node.kind !== 'math') return null;
  const users = neededBy(graph, node.id);
  if (!node.showsUpIn && users.length === 0) return null;
  return (
    <section className="panel-section" aria-labelledby="shows-up-heading">
      <h3 id="shows-up-heading">Where it shows up</h3>
      {node.showsUpIn && <p>{node.showsUpIn}</p>}
      {users.length > 0 && (
        <>
          <div className="chips">
            {users.map((n) => (
              <Chip key={n.id} nodeId={n.id} testId="shows-up-chip" />
            ))}
          </div>
          <button type="button" className="button trace-button" onClick={() => startTrace(node.id)} aria-pressed={tracing}>
            Trace all uses
          </button>
        </>
      )}
      {tracing && (
        <>
          <p className="trace-intro">Used by {trace.order.length} ideas:</p>
          <div className="chips uses-list">
            {trace.order.map((id) => (
              <Chip key={id} nodeId={id} testId="uses-chip" />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
