import { z } from 'zod';
import { VIZ_IDS } from '../viz/ids';

export const LAYERS = ['foundations', 'math', 'core', 'algorithms', 'problems', 'tools'] as const;
export const KINDS = ['foundation', 'math', 'concept', 'algorithm', 'problem', 'tool'] as const;
export const LENSES = ['econometrics', 'nlp', 'time-series', 'neural-nets'] as const;
export const EDGE_TYPES = [
  'needs',
  'is-trained-by',
  'solves',
  'is-special-case-of',
  'fixes-weakness-of',
  'is-built-from',
  'controls',
  'implemented-in',
  'not-same-as',
] as const;

export type Layer = (typeof LAYERS)[number];
export type Kind = (typeof KINDS)[number];
export type LensId = (typeof LENSES)[number];
export type EdgeType = (typeof EDGE_TYPES)[number];

const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case');
const text = z.string().min(1);
// Nested objects are strict: in a YAML flow map, a comma inside an unquoted value starts a new key.
const slot = z.strictObject({ text, node: id.optional() });
const point = z.strictObject({ text, fixedBy: id.optional() });

export const groupSchema = z.object({
  id,
  label: text,
  layer: z.enum(LAYERS),
  order: z.number().int(),
});

export const nodeSchema = z.object({
  id,
  label: text,
  synonyms: z.array(text).default([]),
  layer: z.enum(LAYERS).optional(),
  group: id.optional(),
  kind: z.enum(KINDS),
  lenses: z.array(z.enum(LENSES)).default([]),
  oneLiner: text,
  intuition: text,
  analogy: text.optional(),
  showsUpIn: text.optional(),
  recipe: z
    .strictObject({ problem: slot, modelFamily: slot, loss: slot, optimizer: slot, evaluation: slot })
    .optional(),
  reducedRecipe: z.strictObject({ goal: slot, optimizes: slot, optimizer: slot, judgedBy: slot }).optional(),
  formula: z
    .strictObject({ tex: text, symbols: z.array(z.strictObject({ symbol: text, meaning: text })) })
    .optional(),
  code: z.strictObject({ tool: id, snippet: text }).optional(),
  strengths: z.array(point).optional(),
  weaknesses: z.array(point).optional(),
  confusions: z.array(text).optional(),
  resources: z.array(z.strictObject({ title: text, url: z.string().url() })).max(3).optional(),
  viz: z.enum(VIZ_IDS).optional(),
});

export const edgeSchema = z
  .object({
    id: id.optional(),
    from: id,
    to: id,
    type: z.enum(EDGE_TYPES),
    sentence: text,
    explanation: text.optional(),
    signature: z.boolean().default(false),
  })
  .transform((e) => ({ ...e, id: e.id ?? `${e.from}--${e.type}--${e.to}` }));

export const tourSchema = z.object({
  id,
  title: text,
  stops: z.array(z.object({ node: id, caption: text })).min(5).max(8),
});

type WithSource<T> = T & { source: string };

export type Group = WithSource<z.output<typeof groupSchema>>;
export type Node = WithSource<Omit<z.output<typeof nodeSchema>, 'layer' | 'group'> & { layer: Layer; group: string }>;
export type Edge = WithSource<z.output<typeof edgeSchema>>;
export type Tour = WithSource<z.output<typeof tourSchema>>;
export interface Content {
  groups: Group[];
  nodes: Node[];
  edges: Edge[];
  tours: Tour[];
}
