import { useGraph } from '../../app/StoreContext';
import type { Node } from '../../data/schema';
import { neededBy } from '../../graph/graph';
import { Chip } from '../Chip';

/** Foundation and math nodes only: why this matters in ML, and what needs it. */
export function ShowsUpIn({ node }: { node: Node }) {
  const graph = useGraph();
  if (node.kind !== 'foundation' && node.kind !== 'math') return null;
  const users = neededBy(graph, node.id);
  if (!node.showsUpIn && users.length === 0) return null;
  return (
    <section className="panel-section" aria-labelledby="shows-up-heading">
      <h3 id="shows-up-heading">Where it shows up</h3>
      {node.showsUpIn && <p>{node.showsUpIn}</p>}
      {users.length > 0 && (
        <div className="chips">
          {users.map((n) => (
            <Chip key={n.id} nodeId={n.id} testId="shows-up-chip" />
          ))}
        </div>
      )}
    </section>
  );
}
