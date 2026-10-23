import { writeFile } from 'node:fs/promises';
import { loadContent } from '../src/data/load';
import { renderReport } from '../src/data/report';

const { content } = await loadContent('content');
await writeFile('content-report.md', renderReport(content));
console.log(`wrote content-report.md (${content.nodes.length} nodes)`);
