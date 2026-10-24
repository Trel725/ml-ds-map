import { expect, test } from 'vitest';
import { buildContent } from '../../../src/data/build';
import { formatIssue } from '../../../src/data/issues';
import { checkResourceUrl } from '../../../src/data/links';
import { VIZ_IDS } from '../../../src/viz/ids';
import { realContent } from '../helpers/real';

test('real content builds in strict mode', async () => {
  const r = await buildContent('content', { strict: true });
  expect(r.issues.map(formatIssue)).toEqual([]);
  expect(r.content.nodes.length).toBeGreaterThanOrEqual(120);
  expect(r.content.edges.filter((e) => e.signature).length).toBe(26);
});

test('tour 1 exists with 6 stops', async () => {
  const t = (await buildContent('content', { strict: true })).content.tours.find((t) => t.id === 'how-a-model-learns')!;
  expect(t.title).toBe('How a model learns');
  expect(t.stops.map((s) => s.node)).toEqual(['functions-and-graphs', 'loss-function', 'slope', 'gradient', 'gradient-descent', 'logistic-regression']);
});

const RECIPE = ['ols','ridge','lasso','elastic-net','logistic-regression','glm','perceptron','neural-network','decision-tree','bagging-method','random-forest','adaboost','gradient-boosting','xgboost','lightgbm','naive-bayes','lda-classifier','qda','knn','svm','arima','exponential-smoothing'];
const REDUCED = ['gaussian-mixtures','k-means','hierarchical-clustering','dbscan','pca','t-sne','umap'];
const NO_RECIPE = ['backpropagation', 'kernel-trick', 'decision-stump'];

test('algorithms carry recipes', async () => {
  const c = await realContent();
  const byId = new Map(c.nodes.map((n) => [n.id, n]));
  for (const id of RECIPE) expect(byId.get(id)?.recipe, id).toBeDefined();
  for (const id of REDUCED) expect(byId.get(id)?.reducedRecipe, id).toBeDefined();
  for (const id of NO_RECIPE) expect(byId.get(id)?.recipe ?? byId.get(id)?.reducedRecipe, id).toBeUndefined();
  expect(byId.get('ols')!.recipe!.optimizer.node).toBe('analytical-solution');
  expect(byId.get('logistic-regression')!.recipe!.loss.node).toBe('log-loss');
});

test('recipe slots link problems, optimizers and losses to the shared nodes', async () => {
  const c = await realContent();
  const byId = new Map(c.nodes.map((n) => [n.id, n]));
  for (const id of RECIPE) {
    const r = byId.get(id)!.recipe!;
    expect(['regression', 'classification', 'forecasting'], `${id} problem`).toContain(r.problem.node);
    // kNN stores the examples and fits nothing, so its optimizer slot has no node to link.
    if (id === 'knn') expect(r.optimizer.node).toBeUndefined();
    else expect(['analytical-solution', 'gradient-descent', 'sgd-adam', 'newtons-method', 'greedy-search'], `${id} optimizer`).toContain(r.optimizer.node);
    if (r.loss.node !== undefined) expect(['log-loss', 'loss-function'], `${id} loss`).toContain(r.loss.node);
  }
});

test('recipe algorithms have strengths, weaknesses, formula and code', async () => {
  const c = await realContent();
  const byId = new Map(c.nodes.map((n) => [n.id, n]));
  for (const id of [...RECIPE, ...REDUCED]) {
    const n = byId.get(id)!;
    expect(n.strengths?.length, `${id} strengths`).toBeGreaterThanOrEqual(2);
    expect(n.weaknesses?.length, `${id} weaknesses`).toBeGreaterThanOrEqual(2);
    expect(n.formula, `${id} formula`).toBeDefined();
    expect(n.code, `${id} code`).toBeDefined();
    expect(n.resources?.length, `${id} resources`).toBeGreaterThanOrEqual(1);
  }
  expect(byId.get('decision-stump')!.weaknesses?.length).toBeGreaterThanOrEqual(2);
});

test('required fixedBy links', async () => {
  const c = await realContent();
  const fixers = (id: string) => (c.nodes.find((n) => n.id === id)!.weaknesses ?? []).map((w) => w.fixedBy);
  expect(fixers('decision-tree')).toContain('random-forest');
  expect(fixers('decision-stump')).toContain('gradient-boosting');
  expect(fixers('ols')).toContain('ridge');
  expect(fixers('perceptron')).toContain('neural-network');
});

test('every math node has a formula', async () => {
  const c = await realContent();
  for (const n of c.nodes.filter((n) => n.kind === 'math')) expect(n.formula, n.id).toBeDefined();
});

test('every non-tool node has 1–3 resources, all allow-listed', async () => {
  const c = await realContent();
  for (const n of c.nodes.filter((n) => n.kind !== 'tool')) {
    expect(n.resources?.length ?? 0, n.id).toBeGreaterThanOrEqual(1);
    for (const r of n.resources ?? []) expect(checkResourceUrl(r.url), `${n.id} ${r.url}`).toEqual({ ok: true });
  }
});

const CODE = ['vectors', 'matrices', 'dot-product', 'gradient-descent', 'cross-validation', 'train-test-split', 'feature-scaling', 'hypothesis-testing', 'bootstrap', 'confidence-intervals', 'tf-idf', 'tokenization', 'backpropagation'];
test('code coverage list from Shared decisions', async () => {
  const c = await realContent();
  const byId = new Map(c.nodes.map((n) => [n.id, n]));
  for (const id of CODE) expect(byId.get(id)?.code, id).toBeDefined();
});

test('every not-same-as end has confusions or the edge has an explanation; ≥ 20 more nodes have confusions', async () => {
  const c = await realContent();
  const byId = new Map(c.nodes.map((n) => [n.id, n]));
  const ends = new Set<string>();
  for (const e of c.edges.filter((e) => e.type === 'not-same-as')) {
    for (const end of [e.from, e.to]) {
      ends.add(end);
      expect(e.explanation !== undefined || (byId.get(end)?.confusions?.length ?? 0) > 0, `${e.id} at ${end}`).toBe(true);
    }
  }
  const more = c.nodes.filter((n) => !ends.has(n.id) && (n.confusions?.length ?? 0) > 0);
  expect(more.length).toBeGreaterThanOrEqual(20);
});

const LENS_MEMBERS = {
  econometrics: ['ols', 'logistic-regression', 'glm', 'hypothesis-testing', 'standard-errors', 'confidence-intervals', 'correlation-causation', 'prediction-vs-explanation', 'causal-effect-estimation', 'statsmodels'],
  nlp: ['naive-bayes', 'logistic-regression', 'text-tasks', 'nltk-spacy'],
  'time-series': ['forecasting', 'statsmodels'],
  'neural-nets': ['chain-rule', 'gradient-descent', 'sgd-adam', 'logistic-regression', 'transformers', 'word-embeddings', 'pytorch'],
} as const;
test.each(Object.entries(LENS_MEMBERS))('lens %s includes its cross-layer members', async (lens, ids) => {
  const c = await realContent();
  const members = new Set(c.nodes.filter((n) => (n.lenses as string[]).includes(lens)).map((n) => n.id));
  for (const id of ids) expect(members.has(id), id).toBe(true);
});

const TOURS = [
  ['from-tree-to-forest', 'From one tree to a forest', ['decision-tree', 'overfitting', 'bias-variance', 'bootstrap', 'bagging-method', 'random-forest', 'gradient-boosting']],
  ['why-logs-are-everywhere', 'Why logs are everywhere', ['exponents-and-logarithms', 'basic-probability', 'distributions', 'mle', 'log-loss', 'logistic-regression']],
  ['explain-vs-predict', 'Explain vs predict', ['ols', 'prediction-vs-explanation', 'econometric-ols', 'coefficient-interpretation', 'omitted-variable-bias', 'train-test-split']],
  ['from-neuron-to-network', 'From a neuron to a network', ['logistic-regression', 'perceptron', 'neural-network', 'chain-rule', 'backpropagation']],
] as const;
test.each(TOURS)('tour %s has its title and stops', async (id, title, stops) => {
  const t = (await realContent()).tours.find((t) => t.id === id);
  expect(t?.title).toBe(title);
  expect(t?.stops.map((s) => s.node)).toEqual(stops);
});
test('there are 5 tours', async () => expect((await realContent()).tours.length).toBe(5));

test('all 25 visualizations are wired to at least one node', async () => {
  const used = new Set((await realContent()).nodes.flatMap((n) => (n.viz ? [n.viz] : [])));
  expect(VIZ_IDS).toHaveLength(25);
  for (const id of VIZ_IDS) expect(used.has(id), id).toBe(true);
});
