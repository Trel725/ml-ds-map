import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { loadContent } from '../../../src/data/load';
import type { Content } from '../../../src/data/schema';

const VALID = 'tests/fixtures/valid/content';

export async function loadValid(): Promise<Content> {
  const { content, issues } = await loadContent(VALID);
  if (issues.length) throw new Error(`valid fixture has issues: ${JSON.stringify(issues)}`);
  return content;
}

type Raw = Record<string, unknown> & { id?: string };

const defaults: Record<keyof Content, (r: Raw) => Raw> = {
  groups: (r) => r,
  nodes: (r) => ({ synonyms: [], lenses: [], ...r }),
  edges: (r) => ({ signature: false, id: r.id ?? `${r.from}--${r.type}--${r.to}`, ...r }),
  tours: (r) => r,
};

/** Valid fixture with tests/fixtures/rules/<rule>.yaml merged on top (raw, not re-parsed). */
export async function withRule(rule: string): Promise<Content> {
  const base = await loadValid();
  const file = `tests/fixtures/rules/${rule}.yaml`;
  const snippet = (parse(await readFile(file, 'utf8')) ?? {}) as Partial<Record<keyof Content, Raw[]>>;
  const out = { ...base } as unknown as Record<keyof Content, Raw[]>;
  for (const key of Object.keys(defaults) as (keyof Content)[]) {
    const list = [...out[key]];
    for (const raw of snippet[key] ?? []) {
      const entry = defaults[key]({ source: file, ...raw });
      const at = list.findIndex((e) => e.id === entry.id);
      if (at >= 0) list[at] = entry;
      else list.push(entry);
    }
    out[key] = list;
  }
  return out as unknown as Content;
}
