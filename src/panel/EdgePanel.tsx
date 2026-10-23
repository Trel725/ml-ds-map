import { useGraph } from '../app/StoreContext';
import { Chip } from './Chip';

const TYPE_WORDS = {
  needs: 'needs',
  'is-trained-by': 'is trained by',
  solves: 'solves',
  'is-special-case-of': 'is a special case of',
  'fixes-weakness-of': 'fixes a weakness of',
  'is-built-from': 'is built from',
  controls: 'controls',
  'implemented-in': 'is implemented in',
  'not-same-as': 'is not the same as',
} as const;

export function EdgePanel({ edgeId }: { edgeId: string }) {
  const graph = useGraph();
  const edge = graph.edgesById.get(edgeId);
  if (!edge) return null;
  return (
    <article className="panel" data-testid="edge-panel" aria-label="Connection">
      <header className="panel-header">
        <p className="panel-where">Connection: {TYPE_WORDS[edge.type]}</p>
        <h2>{edge.sentence}</h2>
      </header>
      {edge.explanation && (
        <section className="panel-section panel-intuition">
          <p>{edge.explanation}</p>
        </section>
      )}
      <section className="panel-section" aria-label="Both ends">
        <div className="chips">
          <Chip nodeId={edge.from} testId="edge-end-chip" />
          <span className="edge-type-word">{TYPE_WORDS[edge.type]}</span>
          <Chip nodeId={edge.to} testId="edge-end-chip" />
        </div>
      </section>
    </article>
  );
}
