import { useGraph } from '../app/StoreContext';
import { Header } from './sections/Header';
import { Intuition } from './sections/Intuition';
import { NeedsFirst } from './sections/NeedsFirst';
import { RecipeCard } from './sections/RecipeCard';
import { ShowsUpIn } from './sections/ShowsUpIn';
import { StrengthsWeaknesses } from './sections/StrengthsWeaknesses';
import { VizSlot } from './sections/VizSlot';

/** The product spec's panel sections in fixed order; each hides itself when it has no data. */
export function NodePanel({ nodeId }: { nodeId: string }) {
  const graph = useGraph();
  const node = graph.nodesById.get(nodeId);
  if (!node) return null;
  return (
    <article className="panel" data-testid="panel" aria-label={node.label}>
      <Header node={node} groupLabel={graph.groupsById.get(node.group)?.label} />
      <Intuition node={node} />
      {node.viz && <VizSlot nodeId={node.id} vizId={node.viz} />}
      <RecipeCard node={node} />
      <ShowsUpIn node={node} />
      <NeedsFirst node={node} />
      <StrengthsWeaknesses node={node} />
    </article>
  );
}
