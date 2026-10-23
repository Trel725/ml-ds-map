import { buildContent } from '../src/data/build';
import { formatIssue } from '../src/data/issues';

const strict = process.argv.includes('--strict');
const { content, issues, ok } = await buildContent('content', { strict });
for (const i of issues) console.log(`${i.severity.toUpperCase()} ${formatIssue(i)}`);
console.log(
  `${content.groups.length} groups, ${content.nodes.length} nodes, ${content.edges.length} edges, ${content.tours.length} tours; ` +
    `${issues.filter((i) => i.severity === 'error').length} errors, ${issues.filter((i) => i.severity === 'warning').length} warnings` +
    (strict ? ' (strict)' : ''),
);
process.exit(ok ? 0 : 1);
