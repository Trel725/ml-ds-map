import { buildContent } from '../../../src/data/build';
import type { Content } from '../../../src/data/schema';
import { buildGraph } from '../../../src/graph/graph';
import type { Graph } from '../../../src/graph/graph';

let cached: Promise<Content> | null = null;

/** The real content tree, built in strict mode (cached per test file). */
export function realContent(): Promise<Content> {
  cached ??= buildContent('content', { strict: true }).then((r) => r.content);
  return cached;
}

export async function realGraph(): Promise<Graph> {
  return buildGraph(await realContent());
}
