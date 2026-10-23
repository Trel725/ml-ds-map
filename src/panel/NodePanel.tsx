import { useGraph } from '../app/StoreContext';
import { CodeSection } from './sections/CodeSection';
import { Confusions } from './sections/Confusions';
import { GoFurther } from './sections/GoFurther';
import { Header } from './sections/Header';
import { Intuition } from './sections/Intuition';
import { MathSection } from './sections/MathSection';
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
      {/* Keyed so the section starts collapsed again on every node. */}
      {node.formula && <MathSection key={node.id} formula={node.formula} />}
      <CodeSection node={node} />
      <Confusions node={node} />
      <GoFurther node={node} />
    </article>
  );
}
