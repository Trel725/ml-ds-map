import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import type { z } from 'zod';
import type { ContentIssue } from './issues';
import { LAYERS, edgeSchema, groupSchema, nodeSchema, tourSchema } from './schema';
import type { Content, Edge, Group, Layer, Node, Tour } from './schema';

const toPosix = (p: string) => p.split(path.sep).join('/');

async function listYaml(dir: string): Promise<string[]> {
  try {
    const names = await readdir(dir);
    return names.filter((n) => n.endsWith('.yaml') || n.endsWith('.yml')).sort();
  } catch {
    return [];
  }
}

/**
 * Reads the content tree under `dir` and parses it with the Zod schemas.
 * Entries that fail parsing are dropped and reported as issues.
 */
export async function loadContent(dir: string): Promise<{ content: Content; issues: ContentIssue[] }> {
  const root = path.dirname(path.resolve(dir));
  const issues: ContentIssue[] = [];
  const content: Content = { groups: [], nodes: [], edges: [], tours: [] };
  const rel = (abs: string) => toPosix(path.relative(root, abs));

  const readDoc = async (abs: string): Promise<{ ok: true; doc: unknown } | { ok: false }> => {
    try {
      return { ok: true, doc: parse(await readFile(abs, 'utf8')) };
    } catch (err) {
      issues.push({ severity: 'error', rule: 'yaml-syntax', file: rel(abs), message: (err as Error).message.split('\n')[0] });
      return { ok: false };
    }
  };

  const parseEntry = <S extends z.ZodType>(schema: S, raw: unknown, file: string): z.output<S> | null => {
    const r = schema.safeParse(raw);
    if (r.success) return r.data;
    const rawId = raw && typeof raw === 'object' && 'id' in raw && typeof raw.id === 'string' ? raw.id : undefined;
    for (const zi of r.error.issues) {
      issues.push({
        severity: 'error',
        rule: 'schema',
        file,
        ...(rawId && { id: rawId }),
        message: `${zi.path.join('.') || '(root)'}: ${zi.message}`,
      });
    }
    return null;
  };

  const readList = async (abs: string): Promise<unknown[] | null> => {
    const r = await readDoc(abs);
    if (!r.ok) return null;
    if (r.doc == null) return [];
    if (!Array.isArray(r.doc)) {
      issues.push({ severity: 'error', rule: 'schema', file: rel(abs), message: 'expected a list' });
      return null;
    }
    return r.doc;
  };

  const abs = path.resolve(dir);

  const groupsFile = path.join(abs, 'groups.yaml');
  for (const raw of (await readList(groupsFile)) ?? []) {
    const g = parseEntry(groupSchema, raw, rel(groupsFile));
    if (g) content.groups.push({ ...g, source: rel(groupsFile) } satisfies Group);
  }

  for (const layer of LAYERS) {
    const layerDir = path.join(abs, 'nodes', layer);
    for (const name of await listYaml(layerDir)) {
      const file = path.join(layerDir, name);
      const group = name.replace(/\.ya?ml$/, '');
      for (const raw of (await readList(file)) ?? []) {
        const n = parseEntry(nodeSchema, raw, rel(file));
        if (n) {
          const node: Node = { ...n, layer: n.layer ?? (layer as Layer), group: n.group ?? group, source: rel(file) };
          content.nodes.push(node);
        }
      }
    }
  }

  const edgesDir = path.join(abs, 'edges');
  for (const name of await listYaml(edgesDir)) {
    const file = path.join(edgesDir, name);
    for (const raw of (await readList(file)) ?? []) {
      const e = parseEntry(edgeSchema, raw, rel(file));
      if (e) content.edges.push({ ...e, source: rel(file) } satisfies Edge);
    }
  }

  const toursDir = path.join(abs, 'tours');
  for (const name of await listYaml(toursDir)) {
    const file = path.join(toursDir, name);
    const r = await readDoc(file);
    if (!r.ok) continue;
    const t = parseEntry(tourSchema, r.doc, rel(file));
    if (t) content.tours.push({ ...t, source: rel(file) } satisfies Tour);
  }

  return { content, issues };
}
