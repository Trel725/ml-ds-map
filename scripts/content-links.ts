import { loadContent } from '../src/data/load';
import { checkResourceUrl } from '../src/data/links';

const CONCURRENCY = 6;
const TIMEOUT_MS = 10_000;

interface Target {
  file: string;
  id: string;
  url: string;
}

async function fetchStatus(url: string): Promise<string | null> {
  const attempt = async (method: 'HEAD' | 'GET') => {
    const res = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) });
    return res.status;
  };
  try {
    let status = await attempt('HEAD');
    if (status === 405 || status === 403) status = await attempt('GET');
    return status >= 200 && status < 400 ? null : String(status);
  } catch (e) {
    return e instanceof Error ? e.name : 'error';
  }
}

const { content } = await loadContent('content');
const targets: Target[] = content.nodes.flatMap((n) => (n.resources ?? []).map((r) => ({ file: n.source, id: n.id, url: r.url })));
const failures: string[] = [];

for (const t of targets) {
  const check = checkResourceUrl(t.url);
  if (!check.ok) failures.push(`${t.file} ${t.id} ${t.url} ${check.reason}`);
}

const queue = [...targets.filter((t) => checkResourceUrl(t.url).ok)];
const statusByUrl = new Map<string, Promise<string | null>>();
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let t = queue.shift(); t; t = queue.shift()) {
      if (!statusByUrl.has(t.url)) statusByUrl.set(t.url, fetchStatus(t.url));
      const status = await statusByUrl.get(t.url)!;
      if (status !== null) failures.push(`${t.file} ${t.id} ${t.url} ${status}`);
    }
  }),
);

for (const f of failures) console.log(f);
console.log(`${targets.length} resources checked, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
