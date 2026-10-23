import { useGraph } from '../../app/StoreContext';
import type { Node } from '../../data/schema';
import { directEdges } from '../../graph/graph';
import { Chip } from '../Chip';

/** Section 10: "not the same as" links in either direction, then typical beginner mix-ups. */
export function Confusions({ node }: { node: Node }) {
  const graph = useGraph();
  const notSame = directEdges(graph, node.id).filter(
    (e) => e.type === 'not-same-as' && graph.nodesById.has(e.from === node.id ? e.to : e.from),
  );
  const notes = node.confusions ?? [];
  if (notSame.length === 0 && notes.length === 0) return null;

  return (
    <section className="panel-section" aria-labelledby="confusions-heading">
      <h3 id="confusions-heading">Common confusions</h3>
      {notSame.map((e) => (
        <div key={e.id} className="not-same">
          <span className="not-same-label">Not the same as</span> <Chip nodeId={e.from === node.id ? e.to : e.from} testId="confusion-chip" />
          <p>{e.explanation ?? e.sentence}</p>
        </div>
      ))}
      {notes.length > 0 && (
        <ul className="confusion-list">
          {notes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
