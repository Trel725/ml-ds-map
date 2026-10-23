import { useGraph } from '../../app/StoreContext';
import type { Node } from '../../data/schema';
import { Chip } from '../Chip';

/** Section 7: what the method is good and bad at, with "fixed by" links. */
export function StrengthsWeaknesses({ node }: { node: Node }) {
  const graph = useGraph();
  const { strengths, weaknesses } = node;
  if (!strengths?.length && !weaknesses?.length) return null;

  return (
    <section className="panel-section" aria-labelledby="sw-heading">
      <h3 id="sw-heading">Strengths and weaknesses</h3>
      <div className="sw">
        {strengths?.length ? (
          <div>
            <h4>Strengths</h4>
            <ul>
              {strengths.map((p) => (
                <li key={p.text}>{p.text}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {weaknesses?.length ? (
          <div>
            <h4>Weaknesses</h4>
            <ul>
              {weaknesses.map((p) => (
                <li key={p.text}>
                  {p.text}
                  {p.fixedBy !== undefined && graph.nodesById.has(p.fixedBy) && (
                    <span className="fixed-by">
                      Fixed by <Chip nodeId={p.fixedBy} testId="fixed-by-chip" />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
