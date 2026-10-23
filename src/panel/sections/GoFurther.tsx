import type { Node } from '../../data/schema';

/** Section 11: up to three trusted outside resources. */
export function GoFurther({ node }: { node: Node }) {
  if (!node.resources?.length) return null;
  return (
    <section className="panel-section" aria-labelledby="go-further-heading">
      <h3 id="go-further-heading">Go further</h3>
      <ul className="resources" data-testid="resources">
        {node.resources.map((r) => (
          <li key={r.url + r.title}>
            <a href={r.url} target="_blank" rel="noopener noreferrer">
              {r.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
