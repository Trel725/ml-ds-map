import { useMemo } from 'react';
import { useApp, useGraph } from '../../app/StoreContext';
import type { Node } from '../../data/schema';
import { recipeSet } from '../../graph/trace';
import { Chip } from '../Chip';
import { sameIds } from '../highlight';

const RECIPE_ROWS = [
  ['problem', 'Problem'],
  ['modelFamily', 'Model family'],
  ['loss', 'Loss'],
  ['optimizer', 'Optimizer'],
  ['evaluation', 'Evaluation'],
] as const;
const REDUCED_ROWS = [
  ['goal', 'Goal'],
  ['optimizes', 'Optimizes'],
  ['optimizer', 'Optimizer'],
  ['judgedBy', 'Judged by'],
] as const;

/** Section 4: the five-slot recipe (or the reduced one); slots that name a node link to it. */
export function RecipeCard({ node }: { node: Node }) {
  const graph = useGraph();
  const traceRecipe = useApp((s) => s.traceRecipe);
  const highlight = useApp((s) => s.highlight);
  const set = useMemo(() => recipeSet(graph, node.id), [graph, node.id]);
  const lit = highlight.mode === 'recipe' && sameIds(highlight.ids, [...set.nodeIds, ...set.edgeIds]);

  const recipe = node.recipe;
  const reduced = node.reducedRecipe;
  const slots: { key: string; name: string; text: string; ref?: string }[] = recipe
    ? RECIPE_ROWS.map(([key, name]) => ({ key, name, text: recipe[key].text, ref: recipe[key].node }))
    : reduced
      ? REDUCED_ROWS.map(([key, name]) => ({ key, name, text: reduced[key].text, ref: reduced[key].node }))
      : [];
  if (slots.length === 0) return null;
  const linked = slots.some((s) => s.ref !== undefined && graph.nodesById.has(s.ref));

  return (
    <section className="panel-section" aria-labelledby="recipe-heading" data-testid="recipe">
      <h3 id="recipe-heading">Recipe</h3>
      <dl className="recipe">
        {slots.map((s) => (
          <div key={s.key} className="recipe-row" data-testid="recipe-slot" data-slot={s.key}>
            <dt>{s.name}</dt>
            <dd>{s.ref !== undefined && graph.nodesById.has(s.ref) ? <Chip nodeId={s.ref} testId="recipe-chip" label={s.text} /> : s.text}</dd>
          </div>
        ))}
      </dl>
      {linked && (
        <button type="button" className="button trace-button" aria-pressed={lit} onClick={() => traceRecipe(node.id)}>
          Light up the recipe
        </button>
      )}
    </section>
  );
}
