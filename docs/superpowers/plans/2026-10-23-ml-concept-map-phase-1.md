# ML Concept Map — Phase 1 ("Usable map") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Phase 1 ML Concept Map as a static site on GitHub Pages: a layered, expandable concept map with typed edges, prerequisite trace, search, a detail panel, 8 interactive visualizations, tour 1 and content for ~125 nodes.

**Architecture:** YAML content is validated and linted at build time by a Vite plugin and emitted as one JSON module (`virtual:content`). Pure modules (`graph/`, `layout/`, viz `model.ts`) do all computation and are unit-tested; React components render SVG from a single Zustand store that is synced with the URL hash.

**Tech Stack:** Vite, TypeScript (strict), React, Zustand, d3-zoom / d3-scale / d3-shape / d3-array, Zod, `yaml`, Fuse.js, Vitest (+ jsdom, Testing Library), Playwright, tsx, GitHub Actions + GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-23-ml-concept-map-design.md` (technical design, "the design"). It builds on the product spec, `ML Concept Map — Spec.md`. Read both. Section numbers like §7.4 refer to the design.

## Global Constraints

- TypeScript `strict: true`. No `any` in `src/`.
- Hash routes only: `#/n/<node-id>`, `#/e/<edge-id>`. Vite `base: './'`, so the site works under any GitHub Pages path.
- D3 is used only for scales, shapes, array helpers and d3-zoom. React renders every DOM/SVG element.
- Node ids are kebab-case and globally unique across nodes, groups and edges.
- Node labels have at most 3 words and render at 13 px or larger.
- Writing rules (linted): one-liner < 15 words; every sentence < 20 words; intuition has 2–4 sentences; no `Σ ∂ ∇ = ^` and no Greek letters (U+0370–U+03FF) in `oneLiner` or `intuition`.
- At most 12 groups per lane. Grids of expanded groups have at most 4 columns.
- Motion: transitions last 250 ms and are disabled under `prefers-reduced-motion: reduce`. Visualizations then jump straight to their end state.
- Edge type is never shown by color alone. Line style comes from the table in Task 17.
- Every `localStorage` access goes through `src/app/storage.ts` (try/catch). The app works when storage throws.
- Each visualization has at most 2 controls, uses only the shared datasets and only the `--viz-*` color tokens.
- CI: content warnings count as errors (`--strict`).
- Storage keys: `mlmap.theme`, `mlmap.expandedGroups`, `mlmap.visited`.

## Review Focus

1. **Malformed or stale hash** (`#/n/`, `#/x/foo`, `#/n/Gradient%20Descent`, an edge id under `#/n/`): the app falls back to the default view, shows the "not found" notice and never throws. Pinned in Task 15.
2. **Corrupt or stale `localStorage`** (non-JSON `mlmap.expandedGroups`, a group id that no longer exists, an unknown theme string): the bad value is ignored and defaults apply. Pinned in Task 15.
3. **Search queries with punctuation, odd case or no match** (`"bayes rule"` vs "Bayes' rule", `"   "`, `"zzzz"`): punctuation and case don't matter, and blank or unmatched queries return an empty list with no stale dropdown. Pinned in Tasks 13 and 19.
4. **A visualization chunk fails to load, or the user switches nodes while one loads:** the fallback with a working Retry appears, and the panel never shows the previous node's visualization. Pinned in Task 20.
5. **A node with no prerequisites, or whose prerequisites sit in collapsed groups:** a node with no outgoing `needs` hides section 6 and its trace button entirely. A trace expands every group on the path. Pinned in Task 18.

---

## Shared decisions

### Content inventory (ids, group orders)

Kinds follow layers: foundations → `foundation`, math → `math`, core → `concept`, algorithms → `algorithm`, problems → `problem`, tools → `tool`. A group's file is `content/nodes/<layer>/<group-id>.yaml`. Format: `group-id` "Label" (order): member node ids. Labels are given only where the id doesn't make them obvious.

**foundations**
- `algebra-basics` "Algebra basics" (1): `functions-and-graphs`, `exponents-and-logarithms` "Logarithms", `notation` "Notation: Σ, vectors", `slope` "Slope", `distance`
- `data-basics` "Data basics" (2): `averages-and-spread` "Averages and spread", `basic-probability`, `reading-plots`

**math**
- `linear-algebra` (1): `vectors`, `dot-product`, `matrices`, `projections`, `eigen-svd` "Eigenvectors and SVD"
- `calculus` (2): `derivative`, `gradient`, `chain-rule`
- `optimization` (3): `loss-landscape`, `analytical-solution`, `gradient-descent`, `sgd-adam` "SGD and Adam", `learning-rate`, `convexity`, `newtons-method`, `greedy-search`
- `probability` (4): `random-variables`, `distributions`, `bayes-rule` "Bayes' rule", `expectation-variance`, `independence`, `mle` "Maximum likelihood" (synonyms `[MLE, likelihood]`)
- `statistics` (5): `sampling-distributions`, `central-limit-theorem`, `standard-errors`, `confidence-intervals`, `hypothesis-testing`, `bootstrap`, `correlation-causation` "Correlation vs causation"

**core**
- `modeling-basics` (1): `features-and-target`, `hyperparameters` "Parameters vs hyperparameters", `loss-function` "Loss vs metric", `log-loss`, `parametric-vs-nonparametric`, `generative-vs-discriminative`
- `generalization` (2): `overfitting`, `bias-variance`, `regularization`, `curse-of-dimensionality`
- `validation` (3): `train-test-split`, `cross-validation`, `hyperparameter-tuning`, `data-leakage`
- `data-preparation` (4): `feature-engineering`, `feature-scaling`, `class-imbalance`
- `explaining-models` (5): `prediction-vs-explanation`, `interpretability`
- `econometrics` (6, lens `econometrics`): `econometric-ols`, `ols-assumptions`, `coefficient-interpretation`, `heteroskedasticity`, `multicollinearity`, `omitted-variable-bias`, `instrumental-variables`, `panel-data`, `difference-in-differences`, `logit-probit`
- `text-processing` (7, lens `nlp`): `tokenization`, `bag-of-words`, `tf-idf`, `word-embeddings`, `topic-models` (synonyms include "latent dirichlet allocation"), `transformers`
- `time-series-basics` (8, lens `time-series`): `trend-seasonality`, `stationarity`, `autocorrelation`, `lag-features`, `time-series-cv`

**algorithms**
- `linear-models` (1): `ols` (synonyms `[linear regression, ordinary least squares, least squares]`), `ridge`, `lasso`, `elastic-net`, `logistic-regression`, `glm`
- `neural-networks` (2, lens `neural-nets`): `perceptron`, `neural-network`, `backpropagation`
- `trees` (3): `decision-tree`, `decision-stump`
- `bagging` (4): `bagging-method` "Bagging", `random-forest`
- `boosting` (5): `adaboost`, `gradient-boosting`, `xgboost`, `lightgbm`
- `probabilistic-models` (6): `naive-bayes`, `lda-classifier` "LDA classifier" (synonyms `[linear discriminant analysis]`), `qda`, `gaussian-mixtures`
- `instance-based` (7): `knn` "k-nearest neighbors"
- `kernel-methods` (8): `svm`, `kernel-trick`
- `clustering` (9): `k-means`, `hierarchical-clustering`, `dbscan`
- `dimensionality-reduction` (10): `pca`, `t-sne`, `umap`
- `time-series-models` (11, lens `time-series`): `arima`, `exponential-smoothing`

**problems**
- `prediction-tasks` (1): `regression`, `classification`, `forecasting`
- `structure-tasks` (2): `clustering-task`, `dimensionality-reduction-task`, `anomaly-detection`
- `applied-tasks` (3): `causal-effect-estimation`, `text-tasks`

**tools**
- `tools` (1): `numpy`, `pandas`, `matplotlib-seaborn`, `scikit-learn`, `statsmodels`, `xgboost-lightgbm`, `pytorch`, `nltk-spacy`

**Visualization → node:** `logarithms` → `exponents-and-logarithms`, `slope-derivative` → `derivative`, `gradient-descent` → `gradient-descent`, `ols-fit` → `ols`, `overfitting` → `overfitting`, `decision-tree` → `decision-tree`, `classification-threshold` → `classification`, `bayes-rule` → `bayes-rule`.

### UI selectors (used by every Playwright test)

| Element | Selector |
| --- | --- |
| Lane band | `[data-lane="<layer>"]` |
| Group node (collapsed or expanded box) | `[data-group-id="<id>"]`, `role=button` when collapsed |
| Node | `[data-node-id="<id>"]`, `role=button`, `data-faded="true"` when faded, `data-highlighted="true"` when in the highlight set |
| Visible edge | `[data-edge-key="<key>"]`, invisible hit path `.edge-hit`, badge `.edge-badge` |
| Edge tooltip | `role=tooltip` |
| Node panel / edge panel | `[data-testid="panel"]` / `[data-testid="edge-panel"]` |
| Chips | `[data-testid="shows-up-chip"]`, `[data-testid="prereq-chip"]`, `[data-testid="trace-chip"]`, `[data-testid="edge-end-chip"]` |
| Notice | `[data-testid="notice"]` |
| Search | `getByRole('combobox', { name: 'Search' })`, results `role=option` |
| Breadcrumb | `nav[aria-label="Recent"]` |
| Buttons | "Explore the map", "Fit", "Theme", "Start the tour", "Trace all prerequisites", "Retry", tour "Back" / "Next" / "Finish" / "Close" |
| Tour card | `[data-testid="tour-card"]` |
| Visualization | `[data-testid="viz"][data-viz-id="<id>"]`, `[data-testid="viz-takeaway"]`, `[data-testid="viz-readout"]` (`aria-live="polite"`) |

---

### Task 1: Project scaffold and tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `eslint.config.js`, `index.html`, `src/main.tsx`, `src/app/App.tsx`, `.gitignore`
- Test: `tests/unit/smoke.test.ts`, `tests/e2e/smoke.spec.ts`, `tests/e2e/helpers.ts`

**Interfaces:**
- Produces: npm scripts `dev`, `build` (`tsc -b && vite build`), `preview`, `test` (`vitest run`), `e2e` (`playwright test`), `lint` (`eslint .`), `typecheck` (`tsc -b --noEmit`). Later tasks add `content:check` and `content:report`.
- Produces: `tests/e2e/helpers.ts` → `gotoMap(page: Page, hash = ''): Promise<void>`. It sets `localStorage['mlmap.visited'] = '1'` via `page.addInitScript`, then goes to `/${hash}`. Every e2e test uses it unless it is testing the first visit.

- [ ] **Step 1: Initialize.** Run `npm create vite@latest . -- --template react-ts`, keeping the existing files. Then install the runtime deps `zustand d3-zoom d3-selection d3-scale d3-shape d3-array fuse.js zod yaml` and the dev deps `vitest jsdom @testing-library/react @testing-library/user-event @playwright/test tsx @types/d3-zoom @types/d3-selection @types/d3-scale @types/d3-shape @types/d3-array typescript-eslint eslint-plugin-react-hooks`. Set `base: './'` in `vite.config.ts`. Vitest `include: ['tests/unit/**/*.test.ts?(x)']`, default environment `node`. Playwright `testDir: 'tests/e2e'`, chromium only, `webServer: { command: 'npm run build && npm run preview -- --port 4173 --strictPort', url: 'http://localhost:4173' }`, `use.baseURL` the same. Add `dist/`, `test-results/`, `playwright-report/` and `content-report.md` to `.gitignore`.

- [ ] **Step 2: Write the smoke tests**

```ts
// tests/unit/smoke.test.ts
import { expect, test } from 'vitest';
test('vitest runs', () => expect(1 + 1).toBe(2));
```
```ts
// tests/e2e/smoke.spec.ts
import { expect, test } from '@playwright/test';
import { gotoMap } from './helpers';
test('app shell renders', async ({ page }) => {
  await gotoMap(page);
  await expect(page).toHaveTitle('ML Concept Map');
  await expect(page.getByRole('heading', { name: 'ML Concept Map' })).toBeVisible();
});
```

- [ ] **Step 3: Implement the minimal `App`.** It renders a `<header>` with `<h1>ML Concept Map</h1>`. Set `<title>ML Concept Map</title>` in `index.html`.

- [ ] **Step 4: Verify.** Run `npm test && npm run lint && npm run typecheck && npx playwright install chromium && npm run e2e`. Expected: everything passes.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "chore: scaffold Vite React TS app with Vitest, Playwright, ESLint"`

---

### Task 2: Content schema and types

**Files:**
- Create: `src/data/schema.ts`, `src/viz/ids.ts`
- Test: `tests/unit/data/schema.test.ts`

**Interfaces:**
- Produces (`src/viz/ids.ts`): `export const VIZ_IDS = ['logarithms','slope-derivative','gradient-descent','ols-fit','overfitting','decision-tree','classification-threshold','bayes-rule'] as const; export type VizId = typeof VIZ_IDS[number];`. This file is plain TS with no React, so the build pipeline can import it.
- Produces (`src/data/schema.ts`): Zod schemas and their inferred types.

```ts
export const LAYERS = ['foundations','math','core','algorithms','problems','tools'] as const;
export const KINDS = ['foundation','math','concept','algorithm','problem','tool'] as const;
export const LENSES = ['econometrics','nlp','time-series','neural-nets'] as const;
export const EDGE_TYPES = ['needs','is-trained-by','solves','is-special-case-of','fixes-weakness-of','is-built-from','controls','implemented-in','not-same-as'] as const;
export type Layer, Kind, LensId, EdgeType  // = typeof X[number]
export const groupSchema, nodeSchema, edgeSchema, tourSchema;
export type Group = { id; label; layer: Layer; order: number; source: string };
export type Node  = { id; label; synonyms: string[]; layer; group; kind; lenses: LensId[]; oneLiner; intuition;
  analogy?; showsUpIn?; recipe?; reducedRecipe?; formula?; code?; strengths?; weaknesses?; confusions?;
  resources?; viz?: VizId; source: string };
export type Edge  = { id; from; to; type: EdgeType; sentence; explanation?; signature: boolean; source: string };
export type Tour  = { id; title; stops: { node: string; caption: string }[]; source: string };
export type Content = { groups: Group[]; nodes: Node[]; edges: Edge[]; tours: Tour[] };
```

Field shapes follow design §4.3 exactly. Recipe slots are `{text, node?}`. `resources` is capped at `.max(3)`, tour `stops` at `.min(5).max(8)`, and `id` matches `/^[a-z0-9]+(-[a-z0-9]+)*$/`. `synonyms` and `lenses` default to `[]`, `signature` to `false`. Edge `id` is optional in input; the schema transforms it to `${from}--${type}--${to}`. `viz` is `z.enum(VIZ_IDS)`. `source` (repo-relative file path) is not part of YAML; the loader adds it. Node `layer` and `group` are optional in YAML input (the loader fills them from the file path, Task 3) but required in the output type.

- [ ] **Step 1: Write failing tests**

```ts
test('edge id defaults to from--type--to', () => {
  const e = edgeSchema.parse({ from: 'derivative', to: 'slope', type: 'needs', sentence: 'A derivative needs slope.' });
  expect(e.id).toBe('derivative--needs--slope');
  expect(e.signature).toBe(false);
});
test('rejects unknown edge type', () =>
  expect(edgeSchema.safeParse({ from: 'a', to: 'b', type: 'related-to', sentence: 'x' }).success).toBe(false));
test('rejects non-kebab id', () =>
  expect(nodeSchema.safeParse({ ...minimalNode, id: 'Gradient_Descent' }).success).toBe(false));
test('rejects more than 3 resources', ...);
test('rejects tour with 4 stops and with 9 stops', ...);
test('rejects viz id not in VIZ_IDS', ...);
test('synonyms and lenses default to []', ...);
```

`minimalNode` = `{ id: 'slope', label: 'Slope', layer: 'foundations', group: 'algebra-basics', kind: 'foundation', oneLiner: 'How fast one thing changes when another does', intuition: 'One. Two.' }`.

- [ ] **Step 2: Run** `npx vitest run tests/unit/data/schema.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `schema.ts` and `ids.ts`.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(data): Zod content schema and viz id list"`

---

### Task 3: Loader, cycle detection and cross-checks

**Files:**
- Create: `src/data/issues.ts`, `src/data/load.ts`, `src/data/crossCheck.ts`, `src/graph/cycles.ts`
- Create fixtures: `tests/fixtures/valid/content/**` (a complete mini content tree), `tests/fixtures/bad-yaml/content/groups.yaml`, `tests/fixtures/rules/<rule>.yaml` (one per cross-check rule)
- Test: `tests/unit/data/load.test.ts`, `tests/unit/data/crossCheck.test.ts`, `tests/unit/graph/cycles.test.ts`, `tests/unit/helpers/fixtures.ts`

**Interfaces:**
- Produces (`issues.ts`):
  ```ts
  export type Severity = 'error' | 'warning';
  export interface ContentIssue { severity: Severity; rule: string; file: string; id?: string; message: string }
  export function formatIssue(i: ContentIssue): string  // `${file} [${id}] ${rule}: ${message}` (omit [id] if absent)
  ```
- Produces (`load.ts`): `loadContent(dir: string): Promise<{ content: Content; issues: ContentIssue[] }>`. It reads `groups.yaml`, `nodes/<layer>/<group>.yaml`, `edges/*.yaml` and `tours/*.yaml`, parses each file with the Task 2 schemas and sets `source` to the path relative to `dir`'s parent (e.g. `content/nodes/math/calculus.yaml`). Node `layer` and `group` are filled from the path when absent. YAML syntax errors produce rule `yaml-syntax` and Zod failures produce rule `schema`. Each Zod issue becomes one ContentIssue whose `id` is the item's id when present. Entries that fail parsing are dropped.
- Produces (`cycles.ts`): `findCycles(ids: string[], edges: { from: string; to: string }[]): string[][]`. Each cycle is a path that starts and ends at the same id, e.g. `['a','b','c','a']`. Each cycle is reported once, rotated so it starts at its lexicographically smallest id.
- Produces (`crossCheck.ts`): `crossCheck(content: Content, vizIds: readonly string[]): ContentIssue[]`, all with severity `error`. Rules:

| rule | condition |
| --- | --- |
| `duplicate-id` | id repeated across groups, nodes, edges |
| `unknown-group` | node.group not in groups |
| `layer-mismatch` | node.layer ≠ its group's layer |
| `file-location` | node's `source` is not `content/nodes/<layer>/<group>.yaml` |
| `unknown-endpoint` | edge from/to is neither a node nor a group |
| `needs-endpoints` | a `needs` edge has a group endpoint (needs must connect nodes, so traces stay node-to-node) |
| `implemented-in-target` | `implemented-in` edge whose `to` is not a `tool` node |
| `unknown-tour-stop` | tour stop not a node |
| `unknown-viz` | node.viz not in `vizIds` |
| `unresolved-ref` | `code.tool`, `fixedBy` or a recipe slot `node` not a node |
| `shows-up-in-required` | foundation/math node without `showsUpIn` |
| `needs-cycle` | one issue per cycle from `findCycles` over `needs` edges; message is the path joined by ` → ` |

- Produces (`tests/unit/helpers/fixtures.ts`): `loadValid(): Promise<Content>` and `withRule(rule: string): Promise<Content>`. `withRule` loads the valid fixture and merges `tests/fixtures/rules/<rule>.yaml` (keys `groups`, `nodes`, `edges`, `tours`) onto it: an entry with an existing id replaces that entry, a new one is appended. Rule-snippet entries get `source: 'tests/fixtures/rules/<rule>.yaml'`, except where the snippet sets `source` itself (used by `file-location`).

The valid fixture has groups `g-found` (foundations), `g-math`, `g-core`, `g-alg`, `g-prob` and `g-tools`, each with order 1. Its nodes are `slope` (foundation), `derivative` (math), `overfitting` (core), `ols` (algorithm, synonyms `[linear regression]`), `regression` (problem) and `sklearn` (tool). Its edges are `derivative needs slope`, `overfitting needs derivative`, `ols needs overfitting`, `ols solves regression` and `ols implemented-in sklearn`. Its tour `t1` stops at slope, derivative, overfitting, ols and regression. All of its text passes the Task 4 lint.

- [ ] **Step 1: Write failing tests**

```ts
// cycles.test.ts
test('no cycles in a DAG', () => expect(findCycles(['a','b','c'], [{from:'a',to:'b'},{from:'b',to:'c'}])).toEqual([]));
test('reports a 3-cycle once, starting at smallest id', () =>
  expect(findCycles(['a','b','c'], [{from:'b',to:'c'},{from:'c',to:'a'},{from:'a',to:'b'}])).toEqual([['a','b','c','a']]));
test('reports two disjoint cycles', ...);
// load.test.ts
test('valid fixture loads with no issues', async () => {
  const { content, issues } = await loadContent('tests/fixtures/valid/content');
  expect(issues).toEqual([]);
  expect(content.nodes.map(n => n.id).sort()).toEqual(['derivative','ols','overfitting','regression','sklearn','slope']);
  expect(content.nodes.find(n => n.id === 'slope')!.source).toBe('content/nodes/foundations/g-found.yaml');
});
test('bad YAML reports yaml-syntax with file name', async () => {
  const { issues } = await loadContent('tests/fixtures/bad-yaml/content');
  expect(issues[0]).toMatchObject({ rule: 'yaml-syntax', file: 'content/groups.yaml', severity: 'error' });
});
// crossCheck.test.ts
test('valid fixture passes', async () => expect(crossCheck(await loadValid(), VIZ_IDS)).toEqual([]));
test.each([
  ['duplicate-id','slope'], ['unknown-group','orphan-node'], ['layer-mismatch','wrong-layer'],
  ['file-location','misfiled'], ['unknown-endpoint','derivative--needs--ghost'], ['needs-endpoints','ols--needs--g-math'],
  ['implemented-in-target','ols--implemented-in--slope'], ['unknown-tour-stop','t1'], ['unknown-viz','bad-viz'],
  ['unresolved-ref','bad-ref'], ['shows-up-in-required','no-shows-up'], ['needs-cycle', undefined],
])('%s fixture reports %s', async (rule, id) => {
  const issues = crossCheck(await withRule(rule), VIZ_IDS);
  expect(issues).toContainEqual(expect.objectContaining({ rule, ...(id && { id }) }));
});
test('needs-cycle message shows the path', async () => {
  const [i] = crossCheck(await withRule('needs-cycle'), VIZ_IDS).filter(i => i.rule === 'needs-cycle');
  expect(i.message).toContain('slope → derivative → slope');
});
```

The `needs-cycle` fixture adds `slope needs derivative`. `unknown-viz` validation happens in crossCheck, not only in the schema, because fixtures bypass it: `withRule` merges raw objects without re-parsing.

- [ ] **Step 2: Run** `npx vitest run tests/unit/data tests/unit/graph/cycles.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `issues.ts`, `cycles.ts` (DFS with an on-stack set), `load.ts` (use `yaml`'s `parse` and `fs/promises`) and `crossCheck.ts`. Create the fixtures.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(data): content loader, cross-checks and needs-cycle detection"`

---

### Task 4: Content linter

**Files:**
- Create: `src/data/lint.ts`, `content/lint.config.ts`, `tests/fixtures/rules/<lint-rule>.yaml` (one per lint rule)
- Test: `tests/unit/data/lint.test.ts`

**Interfaces:**
- Consumes: `Content`, `ContentIssue`, `withRule` (Task 3).
- Produces: `export type LintRule = 'label-words' | 'one-liner-length' | 'sentence-length' | 'intuition-sentences' | 'no-math-symbols' | 'needs-outgoing' | 'orphan-node' | 'lane-groups' | 'signature-explanation';`
- Produces: `lintContent(content: Content, opts?: { warningRules?: LintRule[] }): ContentIssue[]`. Every rule is an `error` unless listed in `warningRules`, which makes it a `warning`.
- Produces (`content/lint.config.ts`): `export const warningRules: LintRule[] = ['needs-outgoing', 'orphan-node'];` These two stay warnings while nodes exist before their edges. Task 10 empties the list.
- Produces: `splitSentences(text: string): string[]`. It splits on `/(?<=[.!?])\s+/`, trims and drops empties. `countWords(text: string): number` splits on whitespace.

| rule | check |
| --- | --- |
| `label-words` | `countWords(label) > 3` (tools exempt) |
| `one-liner-length` | `countWords(oneLiner) >= 15` |
| `sentence-length` | a sentence with ≥ 20 words in `oneLiner`, `intuition`, `analogy`, `showsUpIn`, edge `sentence`/`explanation`, tour `caption` |
| `intuition-sentences` | `splitSentences(intuition).length` not in 2..4 |
| `no-math-symbols` | `/[Σ∂∇=^Ͱ-Ͽ]/` matches `oneLiner` or `intuition` |
| `needs-outgoing` | node in math, core or algorithms with no outgoing `needs` edge |
| `orphan-node` | node that is no edge's endpoint |
| `lane-groups` | a layer with > 12 groups (`file` = `content/groups.yaml`, `id` = layer) |
| `signature-explanation` | `signature: true` edge without `explanation` |

- [ ] **Step 1: Write failing tests**

```ts
test('valid fixture is lint-clean', async () => expect(lintContent(await loadValid())).toEqual([]));
test.each([
  ['label-words','long-label'], ['one-liner-length','wordy'], ['sentence-length','rambling'],
  ['intuition-sentences','one-sentence'], ['no-math-symbols','greek'], ['needs-outgoing','no-needs'],
  ['orphan-node','lonely'], ['lane-groups','foundations'], ['signature-explanation','slope--needs--x'],
])('%s fixture reports %s', async (rule, id) =>
  expect(lintContent(await withRule(rule))).toContainEqual(expect.objectContaining({ rule, id, severity: 'error' })));
test('warningRules downgrades severity', async () => {
  const issues = lintContent(await withRule('orphan-node'), { warningRules: ['orphan-node'] });
  expect(issues.find(i => i.rule === 'orphan-node')!.severity).toBe('warning');
});
test('problems and tools are exempt from needs-outgoing', async () =>
  expect(lintContent(await loadValid()).some(i => i.rule === 'needs-outgoing')).toBe(false));
test('splitSentences', () => expect(splitSentences('One two. Three? Four!')).toEqual(['One two.', 'Three?', 'Four!']));
```

The `no-math-symbols` fixture uses intuition `'The rate is called λ. It is small.'`. The `lane-groups` fixture adds 12 foundation groups, 13 in total.

- [ ] **Step 2: Run** `npx vitest run tests/unit/data/lint.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `lint.ts`, `content/lint.config.ts` and the fixtures.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(data): content linter with warning downgrades"`

---

### Task 5: Build pipeline — Vite plugin, check and report scripts

**Files:**
- Create: `src/data/build.ts`, `src/data/vitePlugin.ts`, `src/virtual-content.d.ts`, `scripts/content-check.ts`, `scripts/content-report.ts`, `src/data/report.ts`
- Create: `content/groups.yaml` containing `[]`, plus empty `content/edges/` and `content/tours/` directories (with `.gitkeep`)
- Modify: `vite.config.ts`, `package.json`
- Test: `tests/unit/data/build.test.ts`, `tests/unit/data/report.test.ts`

**Interfaces:**
- Consumes: `loadContent`, `crossCheck`, `lintContent`, `warningRules`, `VIZ_IDS`, `formatIssue`.
- Produces: `buildContent(dir: string, opts: { strict: boolean }): Promise<{ content: Content; issues: ContentIssue[]; ok: boolean }>`. `ok` is false when any issue is an error, or, in strict mode, when any issue exists at all.
- Produces: `contentPlugin(opts: { dir: string; strict: boolean }): Plugin`. It resolves `virtual:content` to `export default <JSON>`. It throws, failing the build with every `formatIssue` line, when `!ok`, and prints warnings otherwise. In dev it adds `content/**` to the watcher and triggers a full reload on change. `vite.config.ts` uses `contentPlugin({ dir: 'content', strict: process.env.CONTENT_STRICT === '1' })`.
- Produces: `src/virtual-content.d.ts` → `declare module 'virtual:content' { const content: import('./data/schema').Content; export default content; }`.
- Produces: `renderReport(content: Content): string` (Markdown). Nodes are ordered by layer (`LAYERS` order), then group `order`, then file order. Each node renders as `## <label> (\`<id>\`)` followed by bold-labelled lines for One-liner, Intuition, Analogy and Shows up in (only those present), then `Needs: <labels>`.
- Produces scripts: `content:check` → `tsx scripts/content-check.ts` (`--strict` flag; exits 1 when `!ok`); `content:report` → `tsx scripts/content-report.ts`, which writes `content-report.md`.

- [ ] **Step 1: Write failing tests**

```ts
test('valid fixture builds ok in strict mode', async () =>
  expect((await buildContent('tests/fixtures/valid/content', { strict: true })).ok).toBe(true));
test('warnings fail only in strict mode', async () => {
  // fixture tests/fixtures/warn-only/content = valid fixture plus one node with no edges (orphan-node, a warning rule)
  expect((await buildContent('tests/fixtures/warn-only/content', { strict: false })).ok).toBe(true);
  expect((await buildContent('tests/fixtures/warn-only/content', { strict: true })).ok).toBe(false);
});
test('report orders nodes foundations first and shows needs', async () => {
  const md = renderReport(await loadValid());
  expect(md.indexOf('(`slope`)')).toBeLessThan(md.indexOf('(`derivative`)'));
  expect(md).toContain('Needs: Slope');
});
```

- [ ] **Step 2: Run** `npx vitest run tests/unit/data/build.test.ts tests/unit/data/report.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** In `App.tsx`, temporarily render `import content from 'virtual:content'` as `<p>{content.nodes.length} nodes</p>`, to prove the module resolves (Task 16 replaces it).
- [ ] **Step 4: Verify.** Run the tests (PASS), then `npm run content:check -- --strict` (exit 0 on empty content) and `npm run build` (succeeds).
- [ ] **Step 5: Commit** — `git commit -m "feat(data): Vite content plugin, content:check and content:report"`

---

### Task 6: Content — groups, foundations, math

**Files:**
- Modify: `content/groups.yaml` (all 30 groups from the inventory with their layer and order)
- Create: `content/nodes/foundations/{algebra-basics,data-basics}.yaml`, `content/nodes/math/{linear-algebra,calculus,optimization,probability,statistics}.yaml`

**Interfaces:**
- Consumes: the schema (Task 2), the inventory (Shared decisions).
- Produces: node ids exactly as listed in the inventory.

Each node needs `id`, `label`, `kind`, `oneLiner`, `intuition` and `showsUpIn`; add `synonyms` where people use other names. Base foundation one-liners and shows-up-in text on the product spec's Foundations table. Every intuition contains one everyday analogy, which is also stored in `analogy`. Gradient descent's is "walking downhill in fog, feeling the slope with your feet". Set `viz` for `exponents-and-logarithms`, `derivative`, `gradient-descent` and `bayes-rule`.

- [ ] **Step 1: Write** `groups.yaml` and the foundations files.
- [ ] **Step 2: Run** `npm run content:check`. Expected: exit 0. Only `needs-outgoing`/`orphan-node` warnings may appear.
- [ ] **Step 3: Write** the five math files.
- [ ] **Step 4: Run** `npm run content:check && npm run content:report`. Expected: exit 0, and the math section of `content-report.md` reads as plain language. Read it once yourself for jargon used before it is explained.
- [ ] **Step 5: Commit** — `git commit -m "content: groups, foundations and math layers"`

---

### Task 7: Content — core concepts (including lens groups)

**Files:**
- Create: `content/nodes/core/{modeling-basics,generalization,validation,data-preparation,explaining-models,econometrics,text-processing,time-series-basics}.yaml`

Set `lenses` on every node in the three lens groups. Set `viz: overfitting` on `overfitting`. `topic-models` gets synonyms `[latent dirichlet allocation, LDA topics]`. `econometric-ols`'s one-liner explains "explain, not predict". The other fields are as in Task 6, minus `showsUpIn`.

- [ ] **Step 1: Write** the eight files.
- [ ] **Step 2: Run** `npm run content:check && npm run content:report`. Expected: exit 0, warnings only from the two downgraded rules.
- [ ] **Step 3: Commit** — `git commit -m "content: core concepts layer with econometrics, NLP and time-series groups"`

---

### Task 8: Content — algorithms

**Files:**
- Create: `content/nodes/algorithms/<group>.yaml` for all 11 algorithm groups

Set `viz: ols-fit` on `ols` and `viz: decision-tree` on `decision-tree`. Set `lenses: [neural-nets]` on the neural-network group's nodes, and `[time-series]` on the time-series models. `ols` synonyms come from the inventory. `logistic-regression` synonyms: `[logit model]`. `knn` synonyms: `[k nearest neighbors, nearest neighbours]`. `pca` synonyms: `[principal component analysis]`.

- [ ] **Step 1: Write** the files.
- [ ] **Step 2: Run** `npm run content:check`. Expected: exit 0.
- [ ] **Step 3: Commit** — `git commit -m "content: algorithms layer"`

---

### Task 9: Content — problems and tools

**Files:**
- Create: `content/nodes/problems/{prediction-tasks,structure-tasks,applied-tasks}.yaml`, `content/nodes/tools/tools.yaml`

Set `viz: classification-threshold` on `classification`. Tool labels: "NumPy", "pandas", "matplotlib / seaborn", "scikit-learn", "statsmodels", "XGBoost / LightGBM", "PyTorch", "NLTK / spaCy" (exempt from `label-words`).

- [ ] **Step 1: Write** the files.
- [ ] **Step 2: Run** `npm run content:check`. Expected: exit 0. Node count is now 125: `node -e` or a check of the report.
- [ ] **Step 3: Commit** — `git commit -m "content: problems layer and tools rail"`

---

### Task 10: Content — edges (strict build passes)

**Files:**
- Create: `content/edges/signature.yaml`, `content/edges/needs-foundations-math.yaml`, `content/edges/needs-core.yaml`, `content/edges/needs-algorithms.yaml`, `content/edges/training-and-families.yaml` (is-trained-by, is-special-case-of, fixes-weakness-of, is-built-from, controls), `content/edges/solves.yaml`, `content/edges/tools.yaml`, `content/edges/confusions.yaml`
- Modify: `content/lint.config.ts` → `warningRules: []`
- Test: `tests/unit/data/realContent.test.ts`

**Signature edges** (all `signature: true`, each with `explanation` taken from the product spec's "Why it matters" column):

| from | type | to |
| --- | --- | --- |
| derivative | needs | slope |
| gradient | needs | derivative |
| gradient-descent | needs | gradient |
| logistic-regression, neural-network, gradient-boosting | is-trained-by | gradient-descent |
| ols | is-trained-by | analytical-solution |
| log-loss, mle | needs | exponents-and-logarithms |
| ols | is-special-case-of | mle |
| ridge, lasso | controls | overfitting |
| bagging-method | needs | bootstrap |
| random-forest | fixes-weakness-of | decision-tree |
| gradient-boosting | fixes-weakness-of | decision-stump |
| neural-network | is-built-from | logistic-regression |
| backpropagation | needs | chain-rule |
| pca | needs | eigen-svd |
| naive-bayes, lda-classifier, qda | needs | bayes-rule |
| knn, k-means | needs | distance |
| cross-validation | controls | hyperparameters |
| econometric-ols | not-same-as | ols |
| hypothesis-testing | needs | sampling-distributions |

Also: `lda-classifier not-same-as topic-models`, `logistic-regression not-same-as ols` and `log-loss not-same-as loss-function` are non-signature edges with explanations.

Remaining edges: enough `needs` edges that every math, core and algorithm node has at least one outgoing `needs` edge, with no cycles. Every problem node gets ≥ 1 incoming `solves`, and every tool ≥ 1 incoming `implemented-in`; these may start at groups (e.g. `linear-models implemented-in scikit-learn`). Include at least: `gradient-descent needs loss-landscape`, `gradient-descent needs learning-rate`, `loss-landscape needs functions-and-graphs`, `loss-function needs functions-and-graphs`, `slope needs functions-and-graphs`, `logistic-regression needs log-loss`. Foundation nodes may have outgoing `needs` edges (not required) as long as the graph stays acyclic. Every edge `sentence` reads subject first, e.g. "Random forest fixes the variance of a decision tree".

- [ ] **Step 1: Write the failing test**

```ts
test('real content builds in strict mode', async () => {
  const r = await buildContent('content', { strict: true });
  expect(r.issues.map(formatIssue)).toEqual([]);
  expect(r.content.nodes.length).toBeGreaterThanOrEqual(120);
  expect(r.content.edges.filter(e => e.signature).length).toBe(26);
});
```

- [ ] **Step 2: Run** `npx vitest run tests/unit/data/realContent.test.ts`. Expected: FAIL, listing the missing-edge issues.
- [ ] **Step 3: Write** the edge files and empty `warningRules`.
- [ ] **Step 4: Run** the test, then `npm run content:check -- --strict`. Expected: PASS and exit 0.
- [ ] **Step 5: Commit** — `git commit -m "content: signature, needs, solves and tools edges; lint is strict"`

---

### Task 11: Graph index and prerequisite trace

**Files:**
- Create: `src/graph/graph.ts`, `src/graph/trace.ts`
- Test: `tests/unit/graph/graph.test.ts`, `tests/unit/graph/trace.test.ts`

**Interfaces:**
- Consumes: `Content`, `Edge`, `LAYERS`.
- Produces (`graph.ts`):
  ```ts
  export interface Graph {
    content: Content;
    nodesById: Map<string, Node>; groupsById: Map<string, Group>; edgesById: Map<string, Edge>;
    out: Map<string, Edge[]>; in: Map<string, Edge[]>;   // keyed by node or group id; [] when none
    membersByGroup: Map<string, Node[]>;                 // in file order
  }
  export function buildGraph(content: Content): Graph;
  export function needsOf(g: Graph, id: string): Node[];     // direct outgoing needs targets, sorted by layer then label
  export function neededBy(g: Graph, id: string): Node[];    // direct incoming needs sources, same sort
  export function directEdges(g: Graph, id: string): Edge[]; // out ∪ in for a node or group id
  ```
- Produces (`trace.ts`): `traceDown(g: Graph, nodeId: string): { order: string[]; nodeIds: Set<string>; edgeIds: Set<string> }`. A breadth-first search along outgoing `needs` edges collects the reachable nodes (excluding the start node) and the traversed edges. `nodeIds` includes the start node; `order` excludes it. `order` is the learning order, a topological sort in which every prerequisite comes before the nodes that need it. It uses Kahn's algorithm on the reachable subgraph: among ready nodes, always pick the lowest `LAYERS` index, then the lowest label (`localeCompare`).

- [ ] **Step 1: Write failing tests** (using `buildGraph(await loadValid())`, plus a small inline content for ties)

```ts
test('neededBy(slope) is [derivative]', ...);
test('directEdges(ols) has needs, solves and implemented-in', ...);
test('traceDown(ols) order is foundations first', async () => {
  const t = traceDown(g, 'ols');
  expect(t.order).toEqual(['slope', 'derivative', 'overfitting']);
  expect(t.nodeIds).toEqual(new Set(['ols','overfitting','derivative','slope']));
  expect(t.edgeIds.size).toBe(3);
});
test('traceDown of a node with no needs returns empty order', () => expect(traceDown(g, 'slope').order).toEqual([]));
test('ties break by layer, then label', () => {
  // inline: x needs b-math, x needs a-found, x needs c-found → order [a-found, c-found, b-math]
});
test('real content: traceDown(gradient-descent) starts with a foundation and contains slope and derivative', async () => {
  const real = buildGraph((await buildContent('content', { strict: true })).content);
  const t = traceDown(real, 'gradient-descent');
  expect(real.nodesById.get(t.order[0])!.layer).toBe('foundations');
  expect(t.order.indexOf('slope')).toBeLessThan(t.order.indexOf('derivative'));
});
```

- [ ] **Step 2: Run** `npx vitest run tests/unit/graph`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(graph): graph index, neighbors and traceDown learning order"`

---

### Task 12: Visible edges and focus set (pure)

**Files:**
- Create: `src/graph/visibleEdges.ts`
- Test: `tests/unit/graph/visibleEdges.test.ts`

**Interfaces:**
- Consumes: `Graph`, `directEdges`.
- Produces:
  ```ts
  export type Selection = { kind: 'node' | 'edge'; id: string };
  export interface VisibleEdge { key: string; from: string; to: string; edgeIds: string[]; type: EdgeType; count: number }
  export function visualId(g: Graph, id: string, expanded: ReadonlySet<string>): string;
  export function visibleEdges(g: Graph, selection: Selection | null, expanded: ReadonlySet<string>,
                               extraEdgeIds?: ReadonlySet<string>): { edges: VisibleEdge[]; related: Set<string> };
  ```
- `visualId`: tool nodes map to themselves. A node in a collapsed group maps to its group id, a node in an expanded group to itself, and a group id to itself.
- `visibleEdges` draws a selected node's direct edges, or the selected edge alone, plus any `extraEdgeIds` (the trace or tour edges). Both endpoints map through `visualId`. Edges whose mapped endpoints are equal are dropped. Edges with the same mapped `(from, to)` pair merge into one `VisibleEdge`: `key = ${from}->${to}`, `count` = number merged, `type` = the type of the first edge in `EDGE_TYPES` order, `edgeIds` in content order. `related` holds the visual ids of every endpoint drawn plus the selection's own visual id. The badge text is `+${count - 1}`, rendered only when `count > 1`.

- [ ] **Step 1: Write failing tests** with the real-content graph

```ts
test('null selection → no edges, empty related', ...);
test('selecting gradient-descent with nothing expanded attaches neighbors to their groups', () => {
  const { edges, related } = visibleEdges(g, { kind: 'node', id: 'gradient-descent' }, new Set());
  expect(related.has('optimization')).toBe(true);           // selection's own collapsed group
  expect(related.has('calculus')).toBe(true);               // gradient lives there
  expect(edges.every(e => e.from !== e.to)).toBe(true);
});
test('three edges from one collapsed group merge with count 3', () => {
  // naive-bayes, lda-classifier, qda all need bayes-rule and share the collapsed group probabilistic-models
  const { edges } = visibleEdges(g, { kind: 'node', id: 'bayes-rule' }, new Set(['probability']));
  const merged = edges.find(e => e.from === 'probabilistic-models' && e.to === 'bayes-rule')!;
  expect(merged.count).toBe(3);
  expect(merged.edgeIds).toHaveLength(3);
});
test('edges with different types into the same group merge and keep the earliest EDGE_TYPES type', ...);
test('group endpoint stays the group id when that group is expanded', ...);  // e.g. linear-models implemented-in scikit-learn
test('selecting an edge shows only it; related = its two ends', ...);
test('extraEdgeIds are drawn in addition to the selection', ...);
```

- [ ] **Step 2: Run** `npx vitest run tests/unit/graph/visibleEdges.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(graph): visible edges with collapsed-group merging"`

---

### Task 13: Search index

**Files:**
- Create: `src/graph/search.ts`
- Test: `tests/unit/graph/search.test.ts`

**Interfaces:**
- Produces: `export interface SearchResult { id: string; label: string; group: string }`, `createSearch(nodes: Node[]): (query: string) => SearchResult[]`.
- Normalization (applied to the index and the query): lowercase, then strip `'` `’` `.` `,` and collapse whitespace. The Fuse documents are `{ id, label, group, l: norm(label), s: synonyms.map(norm) }` with keys `l` (weight 2) and `s` (weight 1), `threshold: 0.35`, `ignoreLocation: true`. The function returns at most 8 results, and `[]` for a blank query.

- [ ] **Step 1: Write failing tests** with real content

```ts
test('synonym resolves: "linear regression" → ols first', () => expect(search('linear regression')[0].id).toBe('ols'));
test('label match', () => expect(search('gradient descent')[0].id).toBe('gradient-descent'));
test('punctuation-insensitive: "bayes rule" → bayes-rule', () => expect(search('bayes rule')[0].id).toBe('bayes-rule'));
test('case-insensitive: "PCA" → pca', ...);
test('blank query → []', () => { expect(search('')).toEqual([]); expect(search('   ')).toEqual([]); });
test('no match → []', () => expect(search('zzzzqqq')).toEqual([]));
test('at most 8 results', () => expect(search('a').length).toBeLessThanOrEqual(8));
```

- [ ] **Step 2: Run** `npx vitest run tests/unit/graph/search.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(graph): Fuse search over labels and synonyms"`

---

### Task 14: Lane layout (pure)

**Files:**
- Create: `src/layout/layout.ts`, `src/layout/constants.ts`
- Test: `tests/unit/layout/layout.test.ts` (+ `__snapshots__`)

**Interfaces:**
- Produces:
  ```ts
  export interface Box { x: number; y: number; w: number; h: number }
  export const LANE_ORDER = ['problems','algorithms','core','math','foundations'] as const; // top → bottom (foundations at bottom)
  export interface Layout {
    lanes: { layer: Layer; label: string; y: number; h: number }[];
    groupBoxes: Map<string, Box & { expanded: boolean }>;
    nodePositions: Map<string, Box & { visible: boolean }>;   // every non-tool node
    toolPositions: Map<string, Box>;
    width: number; height: number;
  }
  export function layout(groups: Group[], nodes: Node[], expanded: ReadonlySet<string>): Layout;
  ```
- Constants (`constants.ts`): `LANE_LABEL_W = 120`, `LANE_PAD = 20`, `LANE_MIN_H = 72`, `GROUP_GAP = 24`, `GROUP_H = 40`, `GROUP_W_MIN = 96`, `GROUP_W_MAX = 220`, `CHAR_W = 8`, `CELL_W = 150`, `CELL_H = 44`, `CELL_GAP = 12`, `EXPANDED_HEADER = 28`, `MAX_COLS = 4`, `RAIL_GAP = 40`, `TOOL_W = 140`, `TOOL_H = 28`, `TOOL_GAP = 8`.
- Rules:
  - Groups in each lane are sorted by `order`. The first starts at `x = LANE_LABEL_W`, each next one at the previous right edge + `GROUP_GAP`, and each is vertically centered in its lane.
  - A collapsed group's width is `clamp(label.length*CHAR_W + 32, GROUP_W_MIN, GROUP_W_MAX)` and its height `GROUP_H`.
  - An expanded group with `n` members uses `cols = min(MAX_COLS, n)` and `rows = ceil(n/cols)`. Its box is `w = cols*CELL_W + (cols-1)*CELL_GAP + 2*CELL_GAP` and `h = EXPANDED_HEADER + rows*CELL_H + (rows-1)*CELL_GAP + CELL_GAP`. Members fill it row-major in file order with `visible: true`.
  - Members of a collapsed group get the group's box with `visible: false`. That is where they animate from.
  - Lane `h = max(LANE_MIN_H, tallest box + 2*LANE_PAD)`. Lanes are stacked from `y = 0` in `LANE_ORDER`.
  - The tools rail starts at `x = max lane content right edge + RAIL_GAP`. Tools are stacked from `y = LANE_PAD` with `TOOL_GAP` between them.
  - `width` = rail right edge + `LANE_PAD`, `height` = sum of lane heights.

- [ ] **Step 1: Write failing tests** with real content

```ts
const states = { collapsed: new Set<string>(), oneExpanded: new Set(['optimization']), allExpanded: new Set(groups.map(g => g.id)) };
test.each(Object.entries(states))('%s: snapshot', (_, s) => expect(serialize(layout(groups, nodes, s))).toMatchSnapshot());
test.each(Object.entries(states))('%s: no two group boxes in a lane overlap', ...);
test.each(Object.entries(states))('%s: every visible node box lies inside its group box and its lane', ...);
test('foundations lane is the bottom lane', () => { const l = layout(groups, nodes, new Set()).lanes; expect(l.at(-1)!.layer).toBe('foundations'); });
test('expanding a group shifts later groups in its lane right and leaves other lanes alone', ...);
test('deterministic: same input → deep-equal output', ...);
test('optimization (8 members) expands to 4 columns × 2 rows', ...);
```

`serialize` converts the Maps to sorted entry arrays so snapshots are stable.

- [ ] **Step 2: Run** `npx vitest run tests/unit/layout`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS (snapshots written). Inspect the collapsed snapshot once: there are 5 lanes and the rail sits right of every lane.
- [ ] **Step 5: Commit** — `git commit -m "feat(layout): deterministic lane layout with in-place group expansion"`

---

### Task 15: Store, safe storage and hash router

**Files:**
- Create: `src/app/storage.ts`, `src/app/store.ts`, `src/app/router.ts`, `src/app/StoreContext.tsx`
- Test: `tests/unit/app/storage.test.ts`, `tests/unit/app/store.test.ts`, `tests/unit/app/router.test.ts`

**Interfaces:**
- Produces (`storage.ts`): `export interface KV { getItem(k: string): string | null; setItem(k: string, v: string): void }`. Also `readJson<T>(kv: KV | null, key: string, guard: (v: unknown) => v is T): T | null`, `writeJson(kv: KV | null, key: string, value: unknown): void` and `browserStorage(): KV | null`, which returns `window.localStorage` inside try/catch, or null. None of these throw.
- Produces (`store.ts`):
  ```ts
  export type Theme = 'system' | 'light' | 'dark';
  export type ZoomLevel = 'layers' | 'groups' | 'nodes';
  export type HighlightMode = 'none' | 'trace-down' | 'trace-up' | 'recipe' | 'lens' | 'tour';
  export interface AppState {
    selection: Selection | null; expandedGroups: Set<string>; zoomLevel: ZoomLevel;
    highlight: { mode: HighlightMode; ids: Set<string> };        // node ids and edge ids
    activeLens: LensId | null; tour: { id: string; step: number } | null;
    breadcrumb: string[]; theme: Theme; notice: string | null;
    focusRequest: { id: string; nonce: number } | null;           // map centers on this node/group when nonce changes
  }
  export interface AppActions {
    select(sel: Selection, opts?: { reveal?: boolean }): void;  // reveal: expand node's group + focusRequest
    clearSelection(): void;                                     // also clears highlight unless mode is 'tour'
    toggleGroup(id: string): void; expandGroups(ids: Iterable<string>): void;
    explore(): void;                                            // layers → groups, writes mlmap.visited
    traceDown(nodeId: string): void;                            // fills highlight from traceDown, expands groups of every traced node
    startTour(id: string): void; tourStep(delta: 1 | -1): void; endTour(): void;
    setTheme(t: Theme): void; showNotice(text: string): void; dismissNotice(): void;
  }
  export function createAppStore(graph: Graph, kv: KV | null): StoreApi<AppState & AppActions>;  // zustand/vanilla
  ```
  Behaviour:
  - Initial `zoomLevel` is `'layers'` if `mlmap.visited` is absent. Otherwise it is `'nodes'` when the restored `expandedGroups` is non-empty, else `'groups'`.
  - Restored `expandedGroups` keeps only ids present in `graph.groupsById`. Restored `theme` must be one of the three values.
  - `select` of a node moves it to the end of `breadcrumb`, de-duplicated and capped at 5. It resets `highlight` to none unless a tour is active, and sets `zoomLevel` to `'groups'` if it was `'layers'`.
  - `toggleGroup` keeps `zoomLevel` at `'nodes'` while any group is expanded, else `'groups'`.
  - `expandedGroups` and `theme` are persisted with `writeJson` on change.
  - Tour actions read `graph.content.tours`. A step selects the stop's node with `reveal: true` and sets highlight `{mode:'tour', ids: stops[0..step] node ids}`. `tourStep(1)` past the last stop calls `endTour()`, and `endTour()` resets highlight to none.
- Produces (`router.ts`): `parseHash(hash: string): Selection | null | 'invalid'` (`''` or `'#/'` → null), `formatHash(sel: Selection | null): string`, and `startHashSync(store, graph, win: Window): () => void`. On load and on `hashchange`, a valid selection whose id exists for its kind calls `select(sel, { reveal: true })`. `'invalid'` or a missing id clears the selection, sets the hash to `''` without adding a history entry, and calls `showNotice('Not found')`. The store's selection changes write `formatHash` through `history.replaceState`, or `pushState` when the id changed.
- Produces (`StoreContext.tsx`): `StoreProvider` and `useApp<T>(selector: (s: AppState & AppActions) => T): T`, plus `useGraph(): Graph`.

- [ ] **Step 1: Write failing tests**

```ts
// storage.test.ts
const throwing: KV = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
test('readJson returns null when storage throws', () => expect(readJson(throwing, 'k', isArr)).toBeNull());
test('writeJson swallows errors', () => expect(() => writeJson(throwing, 'k', 1)).not.toThrow());
test('readJson returns null on non-JSON', () => expect(readJson(mem({ k: '{oops' }), 'k', isArr)).toBeNull());
// store.test.ts (real-content graph, in-memory KV)
test('first visit starts at layers; explore sets visited and groups', ...);
test('stale group ids in storage are dropped', () => {
  const s = createAppStore(g, mem({ 'mlmap.visited': '1', 'mlmap.expandedGroups': '["calculus","gone-group"]' }));
  expect([...s.getState().expandedGroups]).toEqual(['calculus']);
  expect(s.getState().zoomLevel).toBe('nodes');
});
test('unknown theme string falls back to system', ...);
test('works with null storage', () => expect(() => createAppStore(g, null).getState().toggleGroup('calculus')).not.toThrow());
test('breadcrumb keeps the last 5 distinct nodes', ...);
test('select with reveal expands the group and bumps focusRequest.nonce', ...);
test('traceDown(gradient-descent) expands calculus and algebra-basics and fills highlight with nodes and edges', ...);
test('tour: start, step through, past last ends tour and clears highlight', ...);
// router.test.ts
test.each([
  ['#/n/gradient-descent', { kind: 'node', id: 'gradient-descent' }], ['#/e/derivative--needs--slope', { kind: 'edge', id: 'derivative--needs--slope' }],
  ['', null], ['#/', null], ['#/n/', 'invalid'], ['#/x/foo', 'invalid'], ['#/n/Gradient%20Descent', 'invalid'], ['#garbage', 'invalid'],
])('parseHash(%s)', (h, want) => expect(parseHash(h)).toEqual(want));
test('formatHash round-trips', ...);
```

- [ ] **Step 2: Run** `npx vitest run tests/unit/app`. Expected: FAIL.
- [ ] **Step 3: Implement.** For a store built on `zustand/vanilla`, a subscription persists `expandedGroups` and `theme`.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(app): Zustand store, safe storage and hash router"`

---

### Task 16: App shell and map (lanes, groups, nodes, tools rail, pan/zoom, keyboard)

**Files:**
- Create: `src/app/theme.css`, `src/app/TopBar.tsx`, `src/app/ThemeToggle.tsx`, `src/app/Notice.tsx`, `src/map/MapView.tsx`, `src/map/Lanes.tsx`, `src/map/GroupNode.tsx`, `src/map/NodeShape.tsx`, `src/map/ToolsRail.tsx`, `src/map/useZoom.ts`, `src/map/map.css`
- Modify: `src/app/App.tsx`, `src/main.tsx`
- Test: `tests/e2e/map.spec.ts`

**Interfaces:**
- Consumes: `layout`, `createAppStore`, `startHashSync`, `useApp`, `useGraph`, `browserStorage`, `virtual:content`.
- Produces: the selectors from "UI selectors". `MapView` renders an `<svg>` holding a `<g class="viewport">`, which d3-zoom transforms. `useZoom(svgRef, viewportRef, layout): { fit(): void; centerOn(box: Box): void }`. Transitions last 250 ms, or 0 under reduced motion. `centerOn` runs whenever `focusRequest.nonce` changes, for the requested node's box (from `nodePositions`, falling back to its group box).

Details:
- `theme.css` defines tokens on `:root`, the dark set under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {…} }` and `:root[data-theme="dark"] {…}`. It also defines `--layer-<layer>` (one muted hue per layer), `--layer-<layer>-strong`, `--bg`, `--fg`, `--muted`, `--panel-bg`, `--edge` and `--focus`, and gives `body` an explicit background. A `@media (prefers-reduced-motion: reduce)` block sets `--motion: 0ms`; the default is `250ms`.
- `ThemeToggle` is a button labelled "Theme" that cycles system → light → dark and sets `document.documentElement.dataset.theme` (removed for system).
- Grid: top bar across, map left (flex 1), panel right (400 px; Task 18 fills it). Node and group boxes are `<g>` elements with `transform: translate(...)` and `transition: transform var(--motion)`.
- Shapes by kind: `foundation`/`math` circle (diameter `CELL_H - 8`, label beside it), `concept` pill (rx = h/2), `algorithm`/`problem` rounded rect (rx 8), `tool` small tag in the rail. Labels are ≥ 13 px. A small badge (●, `aria-hidden`, `<title>Has visualization</title>`) marks nodes with `viz`.
- Zoom level `layers` renders lane bands and labels plus an "Explore the map" button (→ `explore()`). `groups`/`nodes` render group nodes, plus the members of expanded groups.
- Clicking a collapsed group, or pressing Enter on it, toggles it. An expanded group's header toggles it closed. Clicking a node selects it (no reveal).
- Every node and collapsed group is `tabindex=0`, `role=button`, with an `aria-label` of `${label}: ${oneLiner}` (for groups, `${label} group, ${n} topics`). Enter activates; a global Escape calls `clearSelection()`.
- The "Fit" button calls `fit()`. A click on the empty map background calls `clearSelection()`.
- `Notice` shows `notice` with `role=status` and auto-dismisses after 4 s.

- [ ] **Step 1: Write failing e2e tests**

```ts
test('first visit shows only lanes, then Explore shows groups', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-lane]')).toHaveCount(5);
  await expect(page.locator('[data-group-id]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Explore the map' }).click();
  await expect(page.locator('[data-group-id="calculus"]')).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-group-id="calculus"]')).toBeVisible();   // visited remembered
});
test('foundations lane is at the bottom', async ({ page }) => {
  await gotoMap(page);
  const f = await page.locator('[data-lane="foundations"]').boundingBox();
  const p = await page.locator('[data-lane="problems"]').boundingBox();
  expect(f!.y).toBeGreaterThan(p!.y);
});
test('click expands a group in place; keyboard Enter collapses it', async ({ page }) => {
  await gotoMap(page);
  await page.locator('[data-group-id="calculus"]').click();
  await expect(page.locator('[data-node-id="chain-rule"]')).toBeVisible();
  await page.locator('[data-group-id="calculus"]').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('[data-node-id="chain-rule"]')).toBeHidden();
});
test('tools rail lists 8 tools', async ({ page }) => { await gotoMap(page); await expect(page.locator('[data-node-id="scikit-learn"]')).toBeVisible(); });
test('theme toggle sets data-theme', async ({ page }) => {
  await gotoMap(page);
  await page.getByRole('button', { name: 'Theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
test('unknown hash shows notice', async ({ page }) => {
  await gotoMap(page, '#/n/no-such-node');
  await expect(page.getByTestId('notice')).toHaveText('Not found');
});
test('works with storage blocked', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  await page.goto('/');
  await expect(page.locator('[data-lane]')).toHaveCount(5);
});
```

- [ ] **Step 2: Run** `npx playwright test tests/e2e/map.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** `main.tsx` builds the graph, creates the store with `browserStorage()`, starts hash sync and renders `<StoreProvider>`.
- [ ] **Step 4: Run** `npx playwright test tests/e2e/map.spec.ts tests/e2e/smoke.spec.ts && npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(map): lanes, groups, nodes, tools rail, pan/zoom, theme and keyboard basics"`

---

### Task 17: Edges on selection

**Files:**
- Create: `src/map/edgeStyles.ts`, `src/map/EdgeLayer.tsx`, `src/map/EdgeMarkers.tsx`, `src/map/EdgeTooltip.tsx`
- Modify: `src/map/MapView.tsx`, `src/map/NodeShape.tsx`, `src/map/GroupNode.tsx`
- Test: `tests/unit/map/edgeStyles.test.ts`, `tests/e2e/edges.spec.ts`

**Interfaces:**
- Consumes: `visibleEdges`, `layout` boxes, store `selection`/`highlight`/`expandedGroups`.
- Produces: `EDGE_STYLES: Record<EdgeType, { width: number; dash?: string; marker: 'arrow' | 'open-arrow' | 'bar' | 'none'; muted?: boolean }>` and `edgePath(a: Box, b: Box): string`. The path is a quadratic curve between box centers, with its control point offset perpendicular to the chord by 15% of the chord length.

| type | width | dash | marker |
| --- | --- | --- | --- |
| needs | 1.5 | — | arrow |
| is-trained-by | 3 | — | arrow |
| solves | 1.5 | — | arrow |
| is-special-case-of | 1.5 | `4 4` | open-arrow |
| fixes-weakness-of | 2 | `8 4` | arrow |
| is-built-from | 2 | `2 4` | arrow |
| controls | 2 | — | bar |
| implemented-in | 1 | — | none, `muted: true` (gray) |
| not-same-as | 1.5 | `8 3 2 3` | none, plus a "≠" label at the midpoint |

Behaviour (§7.4):
- With no selection and an empty highlight, no edges render.
- With a selection, `EdgeLayer` renders `visibleEdges(graph, selection, expanded, highlightEdgeIds)`. Each edge is a `<g data-edge-key>` holding a visible path with `marker-end`, a `.edge-hit` path (transparent, `stroke-width: 12`, `pointer-events: stroke`) and `.edge-badge` text `+${count-1}` when `count > 1`.
- Nodes and groups whose visual id is not in `related` ∪ highlight node ids get `data-faded="true"` (opacity 0.2, transitioned). Highlighted ones get `data-highlighted="true"` and full-saturation color.
- Hovering or focusing a hit path shows `EdgeTooltip` (`role=tooltip`) with the edge's `sentence`. For merged edges it shows each sentence on its own line.
- Clicking a hit path calls `select({kind:'edge', id: edgeIds[0]})`. Edge hit paths are `tabindex=0` with `aria-label` = sentence, and Enter selects.

- [ ] **Step 1: Write failing tests**

```ts
// edgeStyles.test.ts
test('every edge type has a style', () => expect(Object.keys(EDGE_STYLES).sort()).toEqual([...EDGE_TYPES].sort()));
test('no two types share width+dash+marker', ...);  // color is never the only cue
test('edgePath starts at a center and ends at b center', ...);
// edges.spec.ts
test('calm view has no edges', async ({ page }) => { await gotoMap(page); await expect(page.locator('[data-edge-key]')).toHaveCount(0); });
test('selecting a node draws its edges and fades unrelated nodes', async ({ page }) => {
  await gotoMap(page);
  await page.locator('[data-group-id="optimization"]').click();
  await page.locator('[data-node-id="gradient-descent"]').click();
  await expect(page.locator('[data-edge-key]').first()).toBeVisible();
  await expect(page.locator('[data-group-id="clustering"]')).toHaveAttribute('data-faded', 'true');
  await expect(page.locator('[data-group-id="calculus"]')).not.toHaveAttribute('data-faded', 'true');
});
test('hovering an edge shows its sentence; clicking opens the edge panel', async ({ page }) => {
  await gotoMap(page, '#/n/derivative');
  await page.locator('[data-group-id="algebra-basics"]').click();
  const edge = page.locator('[data-edge-key="derivative->slope"] .edge-hit');
  await edge.hover();
  await expect(page.getByRole('tooltip')).toContainText('slope');
  await edge.click();
  await expect(page.getByTestId('edge-panel')).toBeVisible();   // Task 18 implements the panel; this assertion passes after Task 18
});
test('merged edges show a +n badge', async ({ page }) => {
  await gotoMap(page, '#/n/bayes-rule');
  await expect(page.locator('[data-edge-key="probabilistic-models->bayes-rule"] .edge-badge')).toHaveText('+2');
});
test('Escape returns to the calm view', async ({ page }) => {
  await gotoMap(page, '#/n/gradient-descent');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-edge-key]')).toHaveCount(0);
  await expect(page.locator('[data-faded="true"]')).toHaveCount(0);
});
```

Mark the `edge-panel` assertion with `test.fixme` until Task 18, and remove the `fixme` there.

- [ ] **Step 2: Run** `npx vitest run tests/unit/map && npx playwright test tests/e2e/edges.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS (one fixme skipped).
- [ ] **Step 5: Commit** — `git commit -m "feat(map): typed edges on selection, merging, fade, tooltip and edge selection"`

---

### Task 18: Detail panel, edge panel, breadcrumb and trace

**Files:**
- Create: `src/panel/Panel.tsx` (switches between welcome, node and edge), `src/panel/Welcome.tsx`, `src/panel/NodePanel.tsx`, `src/panel/sections/{Header,Intuition,VizSlot,ShowsUpIn,NeedsFirst}.tsx`, `src/panel/EdgePanel.tsx`, `src/panel/Chip.tsx`, `src/app/Breadcrumb.tsx`
- Modify: `src/app/App.tsx`, `src/app/TopBar.tsx`, `tests/e2e/edges.spec.ts` (remove the fixme)
- Test: `tests/e2e/panel.spec.ts`

**Interfaces:**
- Consumes: `needsOf`, `neededBy`, store `traceDown`/`select`/`startTour`/`highlight`/`breadcrumb`.
- Produces: `Chip({ nodeId, testId }): JSX.Element` → a button with the node label that calls `select({kind:'node', id}, {reveal:true})`. `VizSlot({ nodeId, vizId })` is a placeholder that renders nothing until Task 20 replaces its body.

Sections in fixed order. Each returns `null` without data:
1. **Header:** `<h2>` label, then the one-liner.
2. **Intuition:** the intuition paragraph. If `analogy` is present it is italicized below as "Like: …".
3. **VizSlot:** renders when `viz` is set.
5. **ShowsUpIn** (foundation/math only, hidden if there is neither `showsUpIn` nor any `neededBy`): heading "Where it shows up", the `showsUpIn` text, then `shows-up-chip`s.
6. **NeedsFirst** (hidden if `needsOf` is empty): heading "What you need first", `prereq-chip`s and a "Trace all prerequisites" button. When `highlight.mode === 'trace-down'` and the selection is this node, it also renders an ordered list `<ol>` of `trace-chip`s from `traceDown(...).order`.

`Welcome` (no selection): two sentences of welcome text and a "Start the tour" button (`startTour('how-a-model-learns')`). `EdgePanel`: the sentence as `<h2>`, the explanation, and two `edge-end-chip`s. `Breadcrumb`: `nav[aria-label="Recent"]` with chip buttons for `breadcrumb`, oldest first.

- [ ] **Step 1: Write failing e2e tests**

```ts
test('direct link opens the panel', async ({ page }) => {
  await gotoMap(page, '#/n/gradient-descent');
  await expect(page.getByTestId('panel').getByRole('heading', { level: 2 })).toHaveText('Gradient descent');
  await expect(page.locator('[data-node-id="gradient-descent"]')).toBeVisible();   // group revealed
});
test('trace prerequisites from gradient descent: foundations first, path highlighted', async ({ page }) => {
  await gotoMap(page, '#/n/gradient-descent');
  await page.getByRole('button', { name: 'Trace all prerequisites' }).click();
  const chips = page.getByTestId('trace-chip');
  await expect(chips.first()).toBeVisible();
  const ids = await chips.evaluateAll(els => els.map(e => (e as HTMLElement).dataset.nodeRef));
  expect(ids.indexOf('slope')).toBeLessThan(ids.indexOf('derivative'));
  await expect(page.locator('[data-node-id="slope"]')).toHaveAttribute('data-highlighted', 'true');  // algebra-basics auto-expanded
});
test('foundation node shows "where it shows up" and no trace button', async ({ page }) => {
  await gotoMap(page, '#/n/functions-and-graphs');
  await expect(page.getByTestId('shows-up-chip').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Trace all prerequisites' })).toHaveCount(0);
  await expect(page.getByText('What you need first')).toHaveCount(0);
});
test('edge link opens the edge panel with both ends', async ({ page }) => {
  await gotoMap(page, '#/e/random-forest--fixes-weakness-of--decision-tree');
  await expect(page.getByTestId('edge-panel')).toContainText('variance');
  await expect(page.getByTestId('edge-end-chip')).toHaveCount(2);
});
test('chip navigation updates the hash and the breadcrumb', async ({ page }) => {
  await gotoMap(page, '#/n/gradient-descent');
  await page.locator('[data-testid="prereq-chip"][data-node-ref="gradient"]').click();
  await expect(page).toHaveURL(/#\/n\/gradient$/);
  await expect(page.locator('nav[aria-label="Recent"] button')).toHaveCount(2);
});
test('no selection shows welcome with Start the tour', ...);
```

Chips carry `data-node-ref="<id>"`.

- [ ] **Step 2: Run** `npx playwright test tests/e2e/panel.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Remove the `test.fixme` from `edges.spec.ts`.
- [ ] **Step 4: Run** `npx playwright test tests/e2e/panel.spec.ts tests/e2e/edges.spec.ts`. Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(panel): node panel sections 1/2/5/6, edge panel, breadcrumb and trace"`

---

### Task 19: Search UI

**Files:**
- Create: `src/app/Search.tsx`
- Modify: `src/app/TopBar.tsx`
- Test: `tests/e2e/search.spec.ts`

**Interfaces:**
- Consumes: `createSearch` (built once from `graph.content.nodes`), `select(..., { reveal: true })`.
- Produces: an ARIA combobox (`role=combobox`, `aria-label="Search"`, `aria-expanded`, `aria-controls` → `role=listbox` of `role=option`, `aria-activedescendant`). Each option shows its label and its group label. `/` anywhere outside an input focuses the field. ArrowDown/ArrowUp move the active option and Enter picks it (or the first option if none is active). Picking clears the input and closes the list. Escape closes the list. A blank or unmatched query closes it.

- [ ] **Step 1: Write failing e2e tests**

```ts
test('"linear regression" selects OLS', async ({ page }) => {
  await gotoMap(page);
  await page.keyboard.press('/');
  await page.keyboard.type('linear regression');
  await expect(page.getByRole('option').first()).toContainText('OLS');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/n\/ols$/);
  await expect(page.locator('[data-node-id="ols"]')).toBeVisible();
});
test('arrow keys move through results', ...);
test('no match shows no listbox', async ({ page }) => {
  await gotoMap(page);
  await page.getByRole('combobox', { name: 'Search' }).fill('zzzzqqq');
  await expect(page.getByRole('option')).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Search' })).toHaveAttribute('aria-expanded', 'false');
});
test('clearing the query closes the list', ...);
```

- [ ] **Step 2: Run** `npx playwright test tests/e2e/search.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(app): search combobox with keyboard navigation"`

---

### Task 20: Visualization infrastructure

**Files:**
- Create: `src/viz/registry.ts`, `src/viz/types.ts`, `src/viz/VizSection.tsx`, `src/viz/palette.css`, `src/viz/random.ts`, `src/viz/datasets.ts`, `src/viz/controls/{Slider,StepButton,Toggle}.tsx`, `src/viz/controls/useDrag.ts`, `src/viz/useReducedMotion.ts`
- Modify: `src/panel/sections/VizSlot.tsx`
- Test: `tests/unit/viz/datasets.test.ts`, `tests/unit/viz/VizSection.test.tsx`

**Interfaces:**
- Produces (`types.ts`): `export interface VizModule { takeaway: string; altText: string; Component: React.FC }`.
- Produces (`registry.ts`): `export const registry: Partial<Record<VizId, () => Promise<{ default: VizModule }>>> = {}`. Each viz task adds its entry, `'<id>': () => import('./<id>')`. It stays `Partial` until Task 28 adds the full-coverage test.
- Produces (`VizSection.tsx`): `VizSection({ vizId, loaders = registry }: { vizId: VizId; loaders?: typeof registry })`. It renders `[data-testid="viz"][data-viz-id]`. While loading it shows "Loading…". Once loaded it shows `[data-testid="viz-takeaway"]` and then `Component`, inside an error boundary, wrapped in `<figure aria-describedby>` pointing to a visually hidden `altText`. If the component throws, it shows `altText`. If the import rejects, it shows the text "This visualization didn't load." plus a "Retry" button that re-calls the loader. A missing registry entry renders `null`. The loaded module is keyed by `vizId`, so a late resolve for a previous id is discarded.
- Produces (`random.ts`): `mulberry32(seed: number): () => number` and `normal(rand: () => number, mean: number, sd: number): number` (Box–Muller).
- Produces (`datasets.ts`):
  - `flatPrices(): { size: number; price: number; split: 'train' | 'test' }[]` has 40 points from seed 42. `size` is uniform on 30–150 m². `price` (thousands) = `40 + 3*size - 0.006*size² + normal(0, 20)`. A seeded shuffle splits the first 20 into train, the rest into test.
  - `emails(): { links: number; capsShare: number; label: 0 | 1; split: 'train' | 'test' }[]` has 80 points from seed 7, 40 per label. Spam has `links ~ N(6, 2)` and `capsShare ~ N(0.6, 0.15)`. Not spam has `links ~ N(2, 1.5)` and `capsShare ~ N(0.25, 0.12)`. `links` is clipped to [0, 10] and `capsShare` to [0, 1]. Splits are 60 train and 20 test.
  - Both are memoized.
- Produces (`palette.css`): `--viz-train`, `--viz-test`, `--viz-prediction` and `--viz-error`, with light and dark values that follow the theme rules of Task 16.
- Produces controls. Each is labelled, keyboard-operable and accepts `disabled`.
  - `Slider({label, min, max, step, value, onChange, format?})` is a native `<input type=range>` with a visible formatted value.
  - `StepButton({label, onStep})` and `Toggle({label, checked, onChange})` (`role=switch`).
  - `useDrag({ onDrag(dx, dy), step })` returns props for an SVG handle: pointer drag plus arrow keys (moving `step` per press), `tabindex=0`, `role=slider`-style `aria-valuetext` supplied by the caller.
- Produces: `useReducedMotion(): boolean`.

- [ ] **Step 1: Write failing tests**

```ts
// datasets.test.ts
test('flatPrices is deterministic, 40 points, 20 train', () => {
  expect(flatPrices()).toEqual(flatPrices());
  expect(flatPrices()).toHaveLength(40);
  expect(flatPrices().filter(p => p.split === 'train')).toHaveLength(20);
});
test('emails: 80 points, 40 spam, values clipped', ...);
test('mulberry32 same seed same sequence', ...);
// VizSection.test.tsx  (// @vitest-environment jsdom)
const ok = { takeaway: 'T', altText: 'Alt', Component: () => <p>drawn</p> };
const boom = { takeaway: 'T', altText: 'Alt text', Component: () => { throw new Error('x'); } };
test('renders takeaway then component', async () => { render(<VizSection vizId="logarithms" loaders={{ logarithms: async () => ({ default: ok }) }} />); expect(await screen.findByText('drawn')).toBeTruthy(); });
test('component error shows altText, nothing else breaks', async () => { /* boom → findByText('Alt text') */ });
test('load failure shows Retry; retry succeeds', async () => {
  let calls = 0;
  const loader = async () => { if (calls++ === 0) throw new Error('chunk'); return { default: ok }; };
  render(<VizSection vizId="logarithms" loaders={{ logarithms: loader }} />);
  await userEvent.click(await screen.findByRole('button', { name: 'Retry' }));
  expect(await screen.findByText('drawn')).toBeTruthy();
});
test('switching vizId while loading never shows the old module', async () => {
  // logarithms loader resolves after 50 ms with Component <p>old</p>; rerender with ols-fit resolving immediately <p>new</p>
  // await findByText('new'); wait 80 ms; expect(queryByText('old')).toBeNull()
});
test('missing registry entry renders nothing', ...);
```

- [ ] **Step 2: Run** `npx vitest run tests/unit/viz`. Expected: FAIL.
- [ ] **Step 3: Implement.** `VizSlot` renders `<VizSection vizId={vizId} key={nodeId} />`.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(viz): registry contract, VizSection with fallbacks, datasets, palette and controls"`

---

### Tasks 21–28: The eight P1 visualizations

Every visualization task has the same shape.

**Files** (per `<id>`):
- Create: `src/viz/<id>/model.ts`, `src/viz/<id>/index.tsx`
- Modify: `src/viz/registry.ts` (add the entry)
- Test: `tests/unit/viz/<id>.test.ts`, plus one case in `tests/e2e/viz.spec.ts`

**Interfaces:** each consumes `datasets`, the controls, `VizModule` and `useReducedMotion`. `index.tsx` default-exports a `VizModule` with the takeaway from design §9.4, copied verbatim. It renders a `[data-testid="viz-readout"]` in the format given, and uses SVG with d3-scale/d3-shape, `--viz-*` colors and at most the listed controls.

**Steps** (per task):
- [ ] **Step 1:** Write the model unit tests below. Run `npx vitest run tests/unit/viz/<id>.test.ts`. Expected: FAIL.
- [ ] **Step 2:** Implement `model.ts`. Run again. Expected: PASS.
- [ ] **Step 3:** Add the e2e case. It opens `#/n/<node>`, waits for `[data-viz-id="<id>"]`, reads the readout, operates the control with the keyboard (focus, then `ArrowRight` ×3 or `Enter`) and expects the readout text to change. Run `npx playwright test tests/e2e/viz.spec.ts -g <id>`. Expected: FAIL.
- [ ] **Step 4:** Implement `index.tsx` and the registry entry. Run the e2e case. Expected: PASS.
- [ ] **Step 5:** Commit — `git commit -m "feat(viz): <id> visualization"`

#### Task 21: `logarithms` (node `exponents-and-logarithms`)

- Model: `histogram(values: number[], bins: number, logScale: boolean): { x0: number; x1: number; count: number }[]` (equal-width bins in linear or log10 space) and `skewness(values: number[]): number`.
- Tests: the counts sum to n; `skewness` of log10 prices < skewness of prices, using a right-skewed sample made by exponentiating `normal` draws with seed 1; `Math.log10(a*b)` ≈ `log10(a) + log10(b)` at the `powerOfTen(x)` helper the viz uses for its readout.
- View: the top half is a number line with a draggable/keyboard slider x ∈ [1, 1 000 000] on a log-spaced slider. The bottom half is a histogram of `flatPrices` prices, scaled ×1000 and exponentiated so it is visibly skewed. Controls: Slider "x" and Toggle "Log scale".
- Readout: `"{x formatted with thousands separators} is 10 to the power {log10 x, 1 decimal} · log scale {on|off}"`.

#### Task 22: `slope-derivative` (node `derivative`)

- Model: `f(x) = x*x`, `secantSlope(f, a, b): number`, `derivativeAt(f, x, h = 1e-6): number`.
- Tests: `secantSlope(f, 1, 3) === 4`; `derivativeAt(f, 1)` ≈ 2 within 1e-4; |secant − 2| shrinks monotonically as b goes 2 → 1.5 → 1.1 → 1.01.
- View: the curve with a fixed point at x = 1 and a second point dragged with `useDrag` (step 0.05, clamped to (1, 3]). The secant line runs through both points. At gap < 0.02 the line is labelled "tangent". Control: drag only.
- Readout: `"Gap {b-1, 2 dp} · slope {secant, 2 dp} · slope at the point 2.00"`.

#### Task 23: `gradient-descent` (node `gradient-descent`)

- Model: `gdPath1D(grad: (x: number) => number, x0: number, lr: number, steps: number): number[]` and `gdPath2D(grad: (p: [number, number]) => [number, number], p0: [number, number], lr: number, steps: number): [number, number][]`. Losses are `L1(x) = x²` and `L2(x, y) = x² + 4y²`.
- Tests: with lr 0.1, 50 steps from x0 = 3, |x| < 0.01 (converges); with lr 1.1, |x₂₀| > |x₀| (diverges); with lr 0.01, |x₅₀| > 1 (slow); the 2D path with lr 0.1 converges toward [0, 0]; lr 0.3 overshoots on y (its sign alternates).
- View: the 1D curve with a ball on top and the 2D contour (concentric ellipses computed directly; no extra d3 package) with the path drawn. Controls: Slider "Learning rate" (0.01–1.2, step 0.01; changing it resets the path) and StepButton "Step". Under reduced motion the ball jumps without tweening.
- Readout: `"Step {n} · learning rate {lr} · loss {L1(x), 2 dp}"`, plus `" · exploding"` when |x| > 100.

#### Task 24: `ols-fit` (node `ols`)

- Model: `fitOLS(points: {x: number; y: number}[]): { slope: number; intercept: number }` (closed form: slope = cov/var) and `totalSquareArea(points, line): number`.
- Tests: the points (0, 1), (1, 3), (2, 5) give slope 2 and intercept 1; on the `flatPrices` train set, `fitOLS` matches the normal-equation solution `(XᵀX)⁻¹Xᵀy` computed in the test within 1e-6; nudging the slope by ±0.01 increases `totalSquareArea`.
- View: the first 8 `flatPrices` train points, each a `useDrag` handle (step 2 in data units). The OLS line is drawn, and each residual is a literal square (side = |residual| in screen units, using equal x/y scales over a normalized plot) filled with `--viz-error` at low opacity. Control: drag only.
- Readout: `"Total square area {value, 0 dp}"`.

#### Task 25: `overfitting` (node `overfitting`)

- Model: `fitPolynomial(points: {x: number; y: number}[], degree: number): number[]` (least squares via Householder QR on x scaled to [−1, 1]; returns coefficients in scaled x), `evalPoly(coeffs, x): number` and `mse(points, coeffs): number`.
- Tests: on `flatPrices` train, train MSE is non-increasing for degree 1 → 9 (tolerance 1e-9); degree-1 coefficients match `fitOLS` after rescaling; with degree 9, test MSE > test MSE at degree 2.
- View: the train and test points (`--viz-train`, `--viz-test`) with the fitted curve, plus a small chart of train and test error against degree with a marker at the current degree. Control: Slider "Complexity" (degree 1–9).
- Readout: `"Degree {d} · training error {mse, 0 dp} · test error {mse, 0 dp}"`.

#### Task 26: `decision-tree` (node `decision-tree`)

- Model: `type Tree = { leaf: true; label: 0 | 1 } | { leaf: false; feature: 'links' | 'capsShare'; threshold: number; left: Tree; right: Tree }`, `growTree(points, maxDepth: number): Tree` (CART with Gini; thresholds at midpoints; stops when pure or at depth), `depth(t): number`, `regions(t, bounds): { x0; x1; y0; y1; label }[]` and `accuracy(t, points): number`.
- Tests: `depth(growTree(train, d)) <= d` for d = 0..6; `growTree(train, 0)` is a single leaf; training accuracy is non-decreasing in depth; `regions` count equals the leaf count.
- View: `emails` train points in the plane (links × capsShare). Regions are shaded by predicted label, and the cut lines are drawn. Control: Slider "Depth" (0–6).
- Readout: `"Depth {d} · {regions} regions · training accuracy {pct}%"`.

#### Task 27: `classification-threshold` (node `classification`)

- Model: `probability(e): number = sigmoid(-6 + 0.8*links + 5*capsShare)`, `confusion(probs: number[], labels: (0 | 1)[], threshold: number): { tp; fp; tn; fn }` (predict 1 when p ≥ threshold), `precision(c)` (1 when tp+fp = 0) and `recall(c)`.
- Tests: tp+fp+tn+fn = n for 11 thresholds; recall is non-increasing as the threshold rises; threshold 0 → recall 1; threshold 1.01 → tp = 0 and precision 1.
- View: emails sorted on a probability strip, colored by true label, with a draggable threshold line, beside a 2×2 confusion matrix. Control: Slider "Threshold" (0–1, step 0.05).
- Readout: `"Threshold {t, 2 dp} · precision {2 dp} · recall {2 dp}"`.

#### Task 28: `bayes-rule` (node `bayes-rule`) + registry coverage

- Model: `bayesCounts(baseRate: number, sensitivity = 0.9, specificity = 0.9, n = 1000): { tp; fp; fn; tn }` (integers summing to n; round tp and fp, derive the rest) and `posterior(baseRate, sensitivity = 0.9, specificity = 0.9): number`.
- Tests: `posterior(0.01)` ≈ 0.0833 within 1e-4 (0.009 / (0.009 + 0.099)); `posterior(0.5)` = 0.9; `bayesCounts(0.01)` gives tp 9, fp 99, summing to 1000; posterior is increasing in base rate. Also add to `tests/unit/viz/registry.test.ts`: `expect(Object.keys(registry).sort()).toEqual([...VIZ_IDS].sort())`.
- View: a 40×25 grid of 1000 dots grouped by condition × test result, with the positive-test dots outlined. Control: Slider "Base rate" (0.1%–50%, on a log-spaced slider).
- Readout: `"Base rate {pct, 1 dp}% · {tp} true positives, {fp} false positives · chance of the condition after a positive test {pct, 0 dp}%"`.

---

### Task 29: Tour player and tour 1

**Files:**
- Create: `content/tours/how-a-model-learns.yaml`, `src/tours/TourCard.tsx`
- Modify: `src/app/App.tsx` (render `TourCard` over the map)
- Test: `tests/unit/data/realContent.test.ts` (add a case), `tests/e2e/tour.spec.ts`

**Interfaces:**
- Consumes: store `tour`, `startTour`, `tourStep`, `endTour`. Tour `id` `how-a-model-learns`, title "How a model learns". Stops in order, each with a caption of 1–2 sentences under 20 words: `functions-and-graphs` → `loss-function` → `slope` → `gradient` → `gradient-descent` → `logistic-regression`.
- Produces: `TourCard` (`[data-testid="tour-card"]`, `role=dialog`, `aria-label` = title, non-modal) at the bottom of the map. It shows the title, `Step {n} of {m}`, the caption and the buttons Back (disabled on step 1), Next (labelled "Finish" on the last step) and Close. Escape closes the tour before it clears the selection.

- [ ] **Step 1: Write failing tests**

```ts
// realContent.test.ts
test('tour 1 exists with 6 stops', async () => {
  const t = (await buildContent('content', { strict: true })).content.tours.find(t => t.id === 'how-a-model-learns')!;
  expect(t.stops.map(s => s.node)).toEqual(['functions-and-graphs','loss-function','slope','gradient','gradient-descent','logistic-regression']);
});
// tour.spec.ts
test('tour 1 runs start to finish', async ({ page }) => {
  await gotoMap(page);
  await page.getByRole('button', { name: 'Start the tour' }).click();
  const card = page.getByTestId('tour-card');
  await expect(card).toContainText('Step 1 of 6');
  for (let i = 2; i <= 6; i++) { await card.getByRole('button', { name: 'Next' }).click(); await expect(card).toContainText(`Step ${i} of 6`); }
  await expect(page).toHaveURL(/#\/n\/logistic-regression$/);
  await expect(page.locator('[data-node-id="slope"]')).toHaveAttribute('data-highlighted', 'true');
  await card.getByRole('button', { name: 'Finish' }).click();
  await expect(card).toHaveCount(0);
});
test('Back is disabled on step 1; Close ends the tour', ...);
```

- [ ] **Step 2: Run** `npx vitest run tests/unit/data/realContent.test.ts && npx playwright test tests/e2e/tour.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the tour YAML and `TourCard`.
- [ ] **Step 4: Run** the same commands. Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(tours): tour player and tour 1 'How a model learns'"`

---

### Task 30: CI and GitHub Pages deploy

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `package.json` (add a `ci` script: `npm run lint && npm run typecheck && npm run content:check -- --strict && npm test && CONTENT_STRICT=1 npm run build`)

**Interfaces:**
- Workflow: triggers on `push` to `main` and on `pull_request`. Job `test` runs on ubuntu-latest with Node 22: `npm ci`, `npm run ci`, `npx playwright install --with-deps chromium`, `npx playwright test`, then on failure uploads `playwright-report/` as an artifact. Job `deploy` runs only when `github.ref == 'refs/heads/main' && github.event_name == 'push'` and `needs: test`. It uses `permissions: { pages: write, id-token: write }` and `environment: github-pages`, rebuilds with `CONTENT_STRICT=1` (or downloads the `dist` artifact from `test`), then runs `actions/configure-pages`, `actions/upload-pages-artifact` (path `dist`) and `actions/deploy-pages`.

- [ ] **Step 1: Run** `npm run ci && npx playwright test` locally. Expected: everything passes. This is the full verification of Phase 1.
- [ ] **Step 2: Write** `ci.yml`.
- [ ] **Step 3: Verify** the workflow file parses: `npx --yes action-validator .github/workflows/ci.yml` (or review it against the GitHub docs if that tool is unavailable).
- [ ] **Step 4: Commit** — `git commit -m "ci: test on PRs, deploy main to GitHub Pages"`
- [ ] **Step 5: Tell the user** that the repository's Settings → Pages source must be set to "GitHub Actions" before the first deploy. That is a manual, outward-facing step: don't push or change repo settings without the user's go-ahead.
