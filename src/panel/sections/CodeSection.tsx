import type { Node } from '../../data/schema';
import { Chip } from '../Chip';

/** Section 9: a short snippet using the linked tool. */
export function CodeSection({ node }: { node: Node }) {
  if (!node.code) return null;
  return (
    <section className="panel-section" aria-labelledby="code-heading">
      <h3 id="code-heading">In code</h3>
      <div className="chips">
        <Chip nodeId={node.code.tool} testId="code-tool-chip" />
      </div>
      <pre className="code" data-testid="code">
        <code>{node.code.snippet.trimEnd()}</code>
      </pre>
    </section>
  );
}
