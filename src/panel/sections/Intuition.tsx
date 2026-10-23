import type { Node } from '../../data/schema';

const norm = (s: string) => s.toLowerCase().replace(/[.!?]+$/, '');

/** Emphasizes the analogy where the intuition already contains it; otherwise adds it below as "Like: …". */
export function Intuition({ node }: { node: Node }) {
  if (!node.intuition) return null;
  const analogy = node.analogy ? norm(node.analogy) : '';
  const at = analogy ? node.intuition.toLowerCase().indexOf(analogy) : -1;
  return (
    <section className="panel-section panel-intuition" aria-label="Intuition">
      {at >= 0 ? (
        <p>
          {node.intuition.slice(0, at)}
          <em className="analogy">{node.intuition.slice(at, at + analogy.length)}</em>
          {node.intuition.slice(at + analogy.length)}
        </p>
      ) : (
        <>
          <p>{node.intuition}</p>
          {node.analogy && (
            <p className="panel-analogy">
              <em className="analogy">Like: {node.analogy}</em>
            </p>
          )}
        </>
      )}
    </section>
  );
}
