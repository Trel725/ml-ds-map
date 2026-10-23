import { useMemo } from 'react';
import { useApp, useGraph } from '../../app/StoreContext';
import type { Node } from '../../data/schema';
import { needsOf } from '../../graph/graph';
import { traceDown } from '../../graph/trace';
import { Chip } from '../Chip';

export function NeedsFirst({ node }: { node: Node }) {
  const graph = useGraph();
  const startTrace = useApp((s) => s.traceDown);
  const tracing = useApp((s) => s.highlight.mode === 'trace-down' && s.highlight.ids.has(node.id));
  const direct = needsOf(graph, node.id);
  const order = useMemo(() => (tracing ? traceDown(graph, node.id).order : []), [graph, node.id, tracing]);
  if (direct.length === 0) return null;

  return (
    <section className="panel-section" aria-labelledby="needs-heading">
      <h3 id="needs-heading">What you need first</h3>
      <div className="chips">
        {direct.map((n) => (
          <Chip key={n.id} nodeId={n.id} testId="prereq-chip" />
        ))}
      </div>
      <button type="button" className="button trace-button" onClick={() => startTrace(node.id)} aria-pressed={tracing}>
        Trace all prerequisites
      </button>
      {tracing && (
        <>
          <p className="trace-intro">A learning order, starting from the basics:</p>
          <ol className="trace-list">
            {order.map((id) => (
              <li key={id}>
                <Chip nodeId={id} testId="trace-chip" />
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
