# ML Concept Map — Phase 2 ("Full depth") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Phase 1 map into the full-depth product: panel sections 4 and 7–11 with their content, the remaining 17 visualizations, lens chips, trace up, recipe trace and tours 2–5.

**Architecture:** Phase 1's foundations stay as they are. The schema already holds every Phase 2 field, so content is added without schema changes, and only the linter and cross-checks tighten. Lenses, trace up and recipe trace are new ways to fill the store's single `highlight` set (design §6). New panel sections are components that return `null` without data. Each visualization is a `model.ts` plus `index.tsx` behind the existing registry contract.

**Tech Stack:** As in Phase 1 (Vite, TypeScript strict, React, Zustand, d3-scale/shape/array, Zod, Vitest, Playwright), plus **KaTeX** (`katex`, lazy-loaded).

**Spec:** `docs/superpowers/specs/2026-10-23-ml-concept-map-design.md` ("the design"; §-numbers refer to it), built on the product spec `ML Concept Map — Spec.md`. The design (§1, §10) calls for a short Phase 2 spec. This plan's **Shared decisions** section takes that role, so read it before any task. Phase 1's plan (`docs/superpowers/plans/2026-10-23-ml-concept-map-phase-1.md`) defines the node inventory and UI selectors this plan extends.

## Global Constraints

- Everything in Phase 1's Global Constraints still holds: strict TS, no `any`, hash routes, D3 for math only, 250 ms motion off under reduced motion, `storage.ts` for all `localStorage`, and CI warnings counted as errors.
- Writing rules (linted): every sentence < 20 words in every prose field, including `confusions`, strengths/weaknesses `text`, recipe slot `text`, formula symbol `meaning`, tour captions and edge text. One analogy per node, reused.
- Panel section order is fixed: 1 Header, 2 Intuition, 3 Visualization, 4 Recipe card, 5 Where it shows up, 6 What you need first, 7 Strengths and weaknesses, 8 The math, 9 In code, 10 Common confusions, 11 Go further. A section with no data renders nothing, including its heading.
- KaTeX is loaded only when a "The math, one level deeper" section is opened. It must never be in the entry chunk.
- `code.snippet` has 3–6 non-empty lines. `resources` has at most 3 entries. Strengths and weaknesses have 2–3 entries each.
- Each visualization has at most 2 controls (a group of text inputs counts as one) and uses only `--viz-*` colors. Regression visuals use `flatPrices()` and classification visuals use `emails()`. Visuals whose lesson needs other data (TF-IDF, time series, backpropagation, omitted variable bias) build fixed data in their own `model.ts`, from `mulberry32` with a literal seed.
- One lens at a time. One highlight source at a time: starting a lens, trace or tour replaces the previous highlight.
- Tours have 5–8 stops (schema-enforced), and every stop is an existing node.

## Review Focus

1. **Resource URLs that don't exist.** Drafted `resources` can name pages that 404 or were never real. The student should only see links that open. Pinned in Task 1 by `npm run content:links`, which every content task runs before it commits.
2. **Malformed TeX or a KaTeX chunk that fails to load.** The math section should still show the formula as plain `<code>` text and every symbol's meaning, and the rest of the panel must keep working. Pinned in Task 8 (unit tests with a rejecting loader and with TeX that KaTeX cannot parse).
3. **Lens, trace and selection used together.** Turning on a lens, selecting a node, pressing Escape, then starting a trace should behave predictably. The lens survives selection changes and Escape steps back one layer at a time (tour → selection → lens). A trace or tour turns the lens off, and its chip shows that. Pinned in Tasks 6 and 9.
4. **Trace up from a heavily used foundation** (`slope`, `functions-and-graphs`). Dozens of nodes depend on these. The map must stay readable: collapsed groups are not force-expanded, groups containing used nodes are highlighted instead, and the panel list stays a single scrollable chip list. Pinned in Tasks 6 and 7.
5. **Visualizations at the edges of their controls**: k-means stepped past convergence, boosting with many trees, empty TF-IDF sentences, PCA at 0° and 180°, a slider at its min and max. Each stays finite and keeps its readout well-formed: no `NaN`, no thrown error, no fallback text. Pinned per visualization in Tasks 10–26 (each model test includes its edge case).

---

## Shared decisions

### Panel sections (new)

| # | Component (`src/panel/sections/`) | Shows when | Content |
| --- | --- | --- | --- |
| 4 | `RecipeCard.tsx` | `recipe` or `reducedRecipe` | Heading "Recipe". Rows in order: Problem, Model family, Loss, Optimizer, Evaluation. For `reducedRecipe`: Goal, Optimizes, Optimizer, Judged by. A slot with `node` renders its text as a chip-style button that selects the node. Below the rows: button "Light up the recipe" (only if at least one slot has `node`). |
| 5 | `ShowsUpIn.tsx` (modify) | as Phase 1 | Adds button "Trace all uses" when the node has incoming `needs` edges. While that trace is active, it shows "Used by {n} ideas:" and the chips. |
| 7 | `StrengthsWeaknesses.tsx` | `strengths` or `weaknesses` | Heading "Strengths and weaknesses". Two lists, "Strengths" and "Weaknesses". A weakness with `fixedBy` adds "Fixed by" and a chip. |
| 8 | `MathSection.tsx` | `formula` | `<details>`, collapsed, summary "The math, one level deeper". It holds the formula in display mode, then a `<dl>` with each symbol (TeX, inline) and its meaning. |
| 9 | `CodeSection.tsx` | `code` | Heading "In code", the tool as a chip, then `<pre><code>` with the snippet. |
| 10 | `Confusions.tsx` | `confusions` or a `not-same-as` edge in either direction | Heading "Common confusions". One "Not the same as" row per edge: the other node as a chip plus the edge's `explanation` (or `sentence` when there is none). Then a bullet list of `confusions`. |
| 11 | `GoFurther.tsx` | `resources` | Heading "Go further", then a list of links with `target="_blank" rel="noopener noreferrer"`. |

### UI selectors (additions to Phase 1's table)

| Element | Selector |
| --- | --- |
| Recipe card / slot | `[data-testid="recipe"]` / `[data-testid="recipe-slot"]` with `data-slot="<key>"` |
| Uses chips | `[data-testid="uses-chip"]` |
| Fixed-by chip | `[data-testid="fixed-by-chip"]` |
| Math section | `[data-testid="math"]` (the `<details>`), rendered formula `.katex-display`, fallback `[data-testid="math-raw"]` |
| Code | `[data-testid="code"]` |
| Confusion chip | `[data-testid="confusion-chip"]` |
| Resources | `[data-testid="resources"] a` |
| Lens chips | `getByRole('group', { name: 'Lenses' })`, buttons "Econometrics", "NLP", "Time series", "Neural nets" with `aria-pressed` |
| Tour list | `getByRole('list', { name: 'More tours' })`, buttons named by tour title |
| Buttons | "Light up the recipe", "Trace all uses" |

### Content coverage (what "full depth" means, checked by `realContent.test.ts`)

- **Recipe** (`recipe`, five slots): `ols`, `ridge`, `lasso`, `elastic-net`, `logistic-regression`, `glm`, `perceptron`, `neural-network`, `decision-tree`, `bagging-method`, `random-forest`, `adaboost`, `gradient-boosting`, `xgboost`, `lightgbm`, `naive-bayes`, `lda-classifier`, `qda`, `knn`, `svm`, `arima`, `exponential-smoothing`. The five product-spec rows (OLS, logistic regression, decision tree, gradient boosting, neural network) use the spec's table text. Slots link (`node`) where a node exists. Problem slots link to `regression` / `classification` / `forecasting`. Optimizer slots link to `analytical-solution`, `gradient-descent`, `sgd-adam`, `newtons-method` or `greedy-search`. Loss slots link to `log-loss` or `loss-function`.
- **Reduced recipe**: `gaussian-mixtures`, `k-means`, `hierarchical-clustering`, `dbscan`, `pca`, `t-sne`, `umap`.
- **No recipe** (they are parts or tricks, not whole methods): `backpropagation`, `kernel-trick`, `decision-stump`.
- **Strengths and weaknesses** (2–3 each): every node with a recipe or reduced recipe. These `fixedBy` links are required: `decision-tree` high variance → `random-forest`; `decision-stump` high bias → `gradient-boosting` (`decision-stump` gets strengths/weaknesses too); `ols` overfitting with many features → `ridge`; `perceptron` straight boundaries only → `neural-network`; `knn` slow on big data → none.
- **Formula**: every `math` node, plus every node with a recipe or reduced recipe. Symbols use TeX in `symbol`, and every symbol in `tex` is explained.
- **Code**: every node with a recipe or reduced recipe, plus `vectors`, `matrices`, `dot-product`, `gradient-descent`, `cross-validation`, `train-test-split`, `feature-scaling`, `hypothesis-testing`, `bootstrap`, `confidence-intervals`, `tf-idf`, `tokenization`, `backpropagation`. `code.tool` must be a tool node.
- **Confusions**: every node that is an end of a `not-same-as` edge, plus at least 20 more nodes where beginners typically mix things up.
- **Resources**: at least 1 on every non-tool node. Only these domains are allowed: `statquest.org`, `www.youtube.com/@statquest`, `www.3blue1brown.com`, `www.youtube.com/@3blue1brown`, `www.statlearning.com`, `scikit-learn.org`, `www.khanacademy.org`, `numpy.org`, `pandas.pydata.org`, `www.statsmodels.org`, `pytorch.org`, `mlu-explain.github.io`, `seeing-theory.brown.edu`. Pages must be specific (a video, a chapter, a user-guide section), not a home page, except for book sites.

### Lenses

Membership is the node `lenses` field. Phase 1 tagged the lens groups only, and Task 4 adds these cross-layer members:

- `econometrics`: `ols`, `logistic-regression`, `glm`, `hypothesis-testing`, `standard-errors`, `confidence-intervals`, `correlation-causation`, `prediction-vs-explanation`, `causal-effect-estimation`, `statsmodels`
- `nlp`: `naive-bayes`, `logistic-regression`, `text-tasks`, `nltk-spacy`
- `time-series`: `forecasting`, `statsmodels`
- `neural-nets`: `chain-rule`, `gradient-descent`, `sgd-adam`, `logistic-regression`, `transformers`, `word-embeddings`, `pytorch`

Chip labels: Econometrics, NLP, Time series, Neural nets. A lens highlights its nodes and does **not** expand groups. Instead, a collapsed group that holds a lens node is drawn highlighted (Phase 1's `groupHighlighted` already does this).

### Highlight rules (store)

| Action | highlight | Groups expanded | activeLens | tour |
| --- | --- | --- | --- | --- |
| `traceDown` (Phase 1) | `trace-down` | path groups | → null | unchanged |
| `traceUp(id)` | `trace-up`: reachable nodes + edges | none | → null | unchanged |
| `traceRecipe(id)` | `recipe`: node, slot nodes, edges between them | slot groups | → null | unchanged |
| `toggleLens(l)` | `lens`: lens nodes, or none when toggling off | none | `l` or null | → null |
| `startTour` | `tour` | as Phase 1 | → null | set |
| `select` / `clearSelection` | kept when mode is `tour` or `lens`, else none | as Phase 1 | unchanged | unchanged |

Escape steps back one layer at a time: it ends the tour; with no tour, it clears the selection; with no tour and no selection, it turns off the lens.

### Tours 2–5

| File / id | Title | Stops |
| --- | --- | --- |
| `from-tree-to-forest` | From one tree to a forest | `decision-tree` → `overfitting` → `bias-variance` → `bootstrap` → `bagging-method` → `random-forest` → `gradient-boosting` |
| `why-logs-are-everywhere` | Why logs are everywhere | `exponents-and-logarithms` → `basic-probability` → `distributions` → `mle` → `log-loss` → `logistic-regression` |
| `explain-vs-predict` | Explain vs predict | `ols` → `prediction-vs-explanation` → `econometric-ols` → `coefficient-interpretation` → `omitted-variable-bias` → `train-test-split` |
| `from-neuron-to-network` | From a neuron to a network | `logistic-regression` → `perceptron` → `neural-network` → `chain-rule` → `backpropagation` |

The Welcome panel keeps "Start the tour" (tour 1). Below it, the list "More tours" has one button per other tour, in the table's order.

### Visualizations → nodes

| Viz id | Node(s) | Takeaway (verbatim; `=` replaced by words, as in Phase 1's `ols-fit`) |
| --- | --- | --- |
| `loss-functions` | `loss-function` | How hard each loss punishes a wrong answer |
| `regularization` | `regularization` | Penalties shrink weights; Lasso sets some to zero |
| `cross-validation` | `cross-validation` | Every point gets a turn as test data |
| `random-forest` | `random-forest` | Averaging many noisy guesses gives a smooth one |
| `gradient-boosting` | `gradient-boosting` | Each tree fixes what the last ones got wrong |
| `knn` | `knn` | A prediction is a vote of the neighbors; unscaled features distort distance |
| `k-means` | `k-means` | Two simple steps repeated until nothing changes |
| `pca` | `pca` | The best line keeps the most spread |
| `logistic-regression` | `logistic-regression` | A line bent into probabilities |
| `neuron-to-network` | `neural-network` | Combining simple boundaries makes curved ones |
| `backpropagation` | `backpropagation` | Error flows backward through the chain rule |
| `sampling-distribution` | `sampling-distributions`, `central-limit-theorem` | Averages of samples form a bell curve |
| `bootstrap` | `bootstrap` | Fake new datasets from the one you have |
| `hypothesis-test` | `hypothesis-testing` | A p-value is how often chance alone does this well |
| `omitted-variable-bias` | `omitted-variable-bias` | Leaving out a cause can flip a coefficient |
| `tf-idf` | `tf-idf` | Common words count for little |
| `time-series-decomposition` | `trend-seasonality` | A series is layers you can pull apart |

The product spec gives kNN three controls (drag, k slider, scaling toggle). The two-control rule wins: k is fixed at 5, and the controls are drag and the "Scale features" toggle, which carry the takeaway.

---

### Task 1: Content rules for Phase 2 fields and the link checker

**Files:**
- Modify: `src/data/lint.ts`, `src/data/crossCheck.ts`, `src/data/report.ts`, `package.json` (script `content:links`)
- Create: `tests/fixtures/rules/{code-lines,points-count,algorithm-only-fields,code-tool-kind,phase2-sentence-length}.yaml`, `src/data/links.ts`, `scripts/content-links.ts`
- Test: `tests/unit/data/lint.test.ts`, `tests/unit/data/crossCheck.test.ts`, `tests/unit/data/report.test.ts`, `tests/unit/data/links.test.ts`

**Interfaces:**
- Produces: `LintRule` gains `'code-lines' | 'points-count' | 'algorithm-only-fields'`. `sentence-length` now also covers `confusions[]`, `strengths[].text`, `weaknesses[].text`, recipe and reduced-recipe slot `text`, and `formula.symbols[].meaning`.
- Produces: the cross-check rule `code-tool-kind`: `code.tool` resolves to a node whose `kind` is `tool`.
- Produces: `renderReport` adds, per node when present: `**Recipe:**` (one `- Slot: text (→ node-id)` line per slot), `**Strengths:**` / `**Weaknesses:**` lists (with `(fixed by node-id)`), `**Formula:**` as `` `tex` `` plus the symbol list, `**Code (tool):**` as a fenced `python` block, `**Confusions:**` list, and `**Go further:**` as `[title](url)` lines.

- Produces: `src/data/links.ts` → `checkResourceUrl(url: string): { ok: true } | { ok: false; reason: string }`, a pure check: `https` only, host on the allow-list in Shared decisions, and a path longer than `/` (except `www.statlearning.com`). `scripts/content-links.ts` runs that check on every resource, then sends a `HEAD` request to each URL (falling back to `GET` on a 405), 6 at a time with a 10 s timeout. It prints `file id url status` for each failure and exits 1 if any fail. It is **not** part of `npm run ci`, because the network is flaky in CI. Every content task runs it before committing.

Rule details: `code-lines` requires 3–6 non-empty lines. `points-count` requires 2–3 entries for `strengths` and for `weaknesses`, each checked when present. `algorithm-only-fields` limits `recipe`, `reducedRecipe`, `strengths` and `weaknesses` to `kind: algorithm`.

- [ ] **Step 1: Write the failing tests.** Follow the existing fixture-per-rule pattern (`withRule('<rule>')`, then expect exactly one issue with that rule and id):
  - `code-lines`: a node whose snippet has 2 lines, and one with 7 lines → 2 issues.
  - `points-count`: `strengths` with 1 entry → 1 issue. `weaknesses` with 4 → 1 issue.
  - `algorithm-only-fields`: a `concept` node with a `recipe` → 1 issue.
  - `code-tool-kind`: `code.tool` naming a math node → 1 issue.
  - `phase2-sentence-length`: a 20-word confusion and a 20-word weakness text → 2 `sentence-length` issues.
  - Report: a node with every Phase 2 field renders each heading above, and a node without them renders none of them.
  - `links.test.ts`: `checkResourceUrl('https://www.statlearning.com/')` passes; `https://www.youtube.com/@statquest` (a home page) fails; `https://example.com/ml` (unknown domain) fails; `http://scikit-learn.org/stable/modules/linear_model.html` (not https) fails.
- [ ] **Step 2: Run** `npx vitest run tests/unit/data`. Expected: FAIL on the new cases only.
- [ ] **Step 3: Implement** the rules, the report additions, `links.ts` and the script.
- [ ] **Step 4: Run** `npx vitest run tests/unit/data && npm run content:check -- --strict`. Expected: PASS, and real content is still clean.
- [ ] **Step 5: Commit** — `git commit -m "feat(data): lint and cross-check rules for full-depth panel fields; resource link checker"`

---

### Task 2: Content — algorithms at full depth

**Files:**
- Modify: all 11 files in `content/nodes/algorithms/`
- Test: `tests/unit/data/realContent.test.ts`

**Interfaces:**
- Consumes: Task 1's rules. The coverage lists in Shared decisions.
- Produces: algorithm nodes with `recipe` / `reducedRecipe`, `strengths`, `weaknesses`, `formula`, `code`, `confusions` (where useful) and `resources`.

Formulas use plain TeX that KaTeX supports (no custom macros). Code uses the tool linked by an `implemented-in` edge where one exists. Snippets are runnable on their own, apart from data variables named `X`, `y`, `X_train`, `y_train` and `X_test`.

- [ ] **Step 1: Write the failing coverage tests** in `realContent.test.ts`:

```ts
const RECIPE = ['ols','ridge','lasso','elastic-net','logistic-regression','glm','perceptron','neural-network','decision-tree','bagging-method','random-forest','adaboost','gradient-boosting','xgboost','lightgbm','naive-bayes','lda-classifier','qda','knn','svm','arima','exponential-smoothing'];
const REDUCED = ['gaussian-mixtures','k-means','hierarchical-clustering','dbscan','pca','t-sne','umap'];
test('algorithms carry recipes', async () => {
  const c = await realContent();
  const byId = new Map(c.nodes.map((n) => [n.id, n]));
  for (const id of RECIPE) expect(byId.get(id)?.recipe, id).toBeDefined();
  for (const id of REDUCED) expect(byId.get(id)?.reducedRecipe, id).toBeDefined();
  expect(byId.get('ols')!.recipe!.optimizer.node).toBe('analytical-solution');
  expect(byId.get('logistic-regression')!.recipe!.loss.node).toBe('log-loss');
});
test('recipe algorithms have strengths, weaknesses, formula and code', ...); // every id in RECIPE ∪ REDUCED
test('required fixedBy links', async () => {
  // decision-tree → random-forest, decision-stump → gradient-boosting, ols → ridge, perceptron → neural-network
});
```

- [ ] **Step 2: Run** `npx vitest run tests/unit/data/realContent.test.ts`. Expected: FAIL.
- [ ] **Step 3: Write** the content, group by group. After each group, run `npm run content:check -- --strict`.
- [ ] **Step 4: Run** the realContent tests, then `npm run content:report`, then `npm run content:links`. On the first pass, read the algorithms section of `content-report.md` for jargon used before it is explained. Expected: tests PASS, no lint issues.
- [ ] **Step 5: Commit** — `git commit -m "content: recipes, strengths, formulas, code and resources for algorithms"`

---

### Task 3: Content — foundations, math, core, problems at full depth

**Files:**
- Modify: every file under `content/nodes/{foundations,math,core,problems}/`, and `content/nodes/tools/tools.yaml` (no resources; tools are linked from `code`)
- Test: `tests/unit/data/realContent.test.ts`

**Interfaces:**
- Consumes: Task 1's rules and `npm run content:links`. The coverage lists in Shared decisions.

- [ ] **Step 1: Write the failing tests:**

```ts
// realContent.test.ts
test('every math node has a formula', ...);
test('every non-tool node has 1–3 resources, all allow-listed', ...);
test('code coverage list from Shared decisions', ...);
test('every not-same-as end has confusions or the edge has an explanation; ≥ 20 more nodes have confusions', ...);
```

- [ ] **Step 2: Run** `npx vitest run tests/unit/data`. Expected: FAIL.
- [ ] **Step 3: Write** the content, in layer order: foundations → math → core → problems.
- [ ] **Step 4: Run** `npx vitest run tests/unit/data && npm run content:check -- --strict && npm run content:links`. Expected: PASS, and `content:links` exits 0. Replace any failing URL with a working page from the allow-list instead of deleting the entry, unless the node then has 0 resources.
- [ ] **Step 5: Commit** — `git commit -m "content: full-depth fields for foundations, math, core and problems"`

---

### Task 4: Content — cross-layer lenses and tours 2–5

**Files:**
- Modify: node YAML files for the lens members listed in Shared decisions
- Create: `content/tours/{from-tree-to-forest,why-logs-are-everywhere,explain-vs-predict,from-neuron-to-network}.yaml`
- Test: `tests/unit/data/realContent.test.ts`

Captions follow tour 1's style: 1–2 sentences under 20 words, and each one says why this stop follows the last.

- [ ] **Step 1: Write the failing tests:** each lens's member set contains the listed ids. Each new tour has the exact title and stop order from Shared decisions. `content.tours.length === 5`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/data/realContent.test.ts`. Expected: FAIL.
- [ ] **Step 3: Write** the lens tags and the four tour files.
- [ ] **Step 4: Run** the same tests, plus `npm run content:check -- --strict`. Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "content: cross-layer lens members and tours 2–5"`

---

### Task 5: Graph — trace up, recipe set, lens set

**Files:**
- Modify: `src/graph/trace.ts`
- Create: `src/graph/lens.ts`
- Test: `tests/unit/graph/trace.test.ts`, `tests/unit/graph/lens.test.ts`

**Interfaces:**
- Produces: `traceUp(g: Graph, nodeId: string): Trace`. It runs BFS over **incoming** `needs` edges. `nodeIds` includes the start node and `edgeIds` holds the traversed edges. `order` holds the reachable nodes except the start, sorted by `byLayerThenLabel`.
- Produces: `recipeSet(g: Graph, nodeId: string): { nodeIds: Set<string>; edgeIds: Set<string> }`. `nodeIds` is the start node plus every slot `node` of `recipe` and `reducedRecipe` that exists in the graph. `edgeIds` is every edge, either direction, between the start node and a slot node. A node without a recipe returns just itself and no edges.
- Produces: `lensSet(g: Graph, lens: LensId): Set<string>`, the ids of nodes whose `lenses` includes `lens`.

- [ ] **Step 1: Write the failing tests** against the valid fixture (`loadValid()` + `buildGraph`), extended as needed. Add to `tests/fixtures/valid/content` one algorithm with a recipe whose two slots link to nodes, one with a `needs` edge between them, and one node carrying a lens. Tests:
  - `traceUp` from the fixture's foundation node reaches every node that needs it transitively, and nothing else.
  - `traceUp` from a node nobody needs returns `order: []`.
  - `traceUp` order puts lower layers first.
  - `recipeSet` contains the start node, both slot nodes and the edge between them.
  - A slot `node` missing from the graph is skipped.
  - `lensSet` returns exactly the tagged nodes.
  - Real content: `traceUp(g, 'slope').nodeIds` contains `gradient-descent` and `backpropagation`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/graph`. Expected: FAIL.
- [ ] **Step 3: Implement.** Share the BFS between `traceDown` and `traceUp` through a direction parameter. `traceDown` keeps its Kahn ordering.
- [ ] **Step 4: Run** `npx vitest run tests/unit/graph tests/unit/data`. Expected: PASS. The fixture additions must not break the data tests.
- [ ] **Step 5: Commit** — `git commit -m "feat(graph): trace up, recipe set and lens membership"`

---

### Task 6: Store — trace up, recipe trace, lenses, Escape order

**Files:**
- Modify: `src/app/store.ts`, `src/app/App.tsx` (Escape handler)
- Test: `tests/unit/app/store.test.ts`

**Interfaces:**
- Consumes: Task 5's `traceUp`, `recipeSet` and `lensSet`.
- Produces `AppActions` additions: `traceUp(nodeId: string): void`, `traceRecipe(nodeId: string): void`, `toggleLens(lens: LensId): void`, and `escape(): void` (tour → selection → lens, per Shared decisions). `App.tsx` calls `escape()` instead of its inline logic. Every other behavior follows the Highlight rules table exactly.

- [ ] **Step 1: Write the failing tests** (real graph, `mem()` storage):
  - `toggleLens('nlp')` sets `activeLens` to `'nlp'`, sets the mode to `'lens'`, puts `tf-idf` in the ids and expands no groups. Toggling it again clears both.
  - Toggling `'nlp'` then `'econometrics'` leaves only econometrics active.
  - With a lens on, `select(gradient-descent)` and `clearSelection()` keep the lens highlight.
  - With a lens on, `traceDown`, `traceUp`, `traceRecipe` and `startTour` each set `activeLens` to null.
  - With a tour running, `toggleLens` ends the tour.
  - `traceUp('slope')` sets the mode to `'trace-up'` and leaves `expandedGroups` unchanged.
  - `traceRecipe('ols')` sets the mode to `'recipe'`, its ids include `regression` and `analytical-solution`, and the groups `prediction-tasks` and `optimization` are expanded.
  - `escape()` runs in order: with a tour, selection and lens, the first call ends the tour, the second clears the selection, the third turns off the lens, and a fourth is a no-op.
- [ ] **Step 2: Run** `npx vitest run tests/unit/app/store.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npx vitest run tests/unit/app && npx playwright test tests/e2e/tour.spec.ts tests/e2e/map.spec.ts`. Expected: PASS. Phase 1's Escape and tour behaviour is unchanged.
- [ ] **Step 5: Commit** — `git commit -m "feat(store): trace up, recipe trace, lenses and layered Escape"`

---

### Task 7: Panel — recipe card, trace up, strengths and weaknesses

**Files:**
- Create: `src/panel/sections/RecipeCard.tsx`, `src/panel/sections/StrengthsWeaknesses.tsx`
- Modify: `src/panel/sections/ShowsUpIn.tsx`, `src/panel/NodePanel.tsx`, `src/panel/Chip.tsx` (optional `label` override, used for slot text), `src/panel/panel.css`
- Test: `tests/e2e/panel.spec.ts`

**Interfaces:**
- Consumes: store `traceRecipe`, `traceUp`, `highlight`. `Chip({ nodeId, testId, label? })`.
- Produces: the section components from Shared decisions. "Light up the recipe" and "Trace all uses" are toggle buttons with `aria-pressed`, true while their highlight is active for this node.

- [ ] **Step 1: Write the failing e2e tests:**

```ts
test('OLS recipe card: five slots in order, optimizer links to analytical solution', async ({ page }) => {
  await gotoMap(page, '#/n/ols');
  const slots = page.getByTestId('recipe-slot');
  await expect(slots).toHaveCount(5);
  expect(await slots.evaluateAll((els) => els.map((e) => e.getAttribute('data-slot')))).toEqual(['problem','modelFamily','loss','optimizer','evaluation']);
  await page.locator('[data-slot="optimizer"] [data-node-ref="analytical-solution"]').click();
  await expect(page).toHaveURL(/#\/n\/analytical-solution$/);
});
test('k-means shows the reduced recipe with four slots', ...);
test('Light up the recipe highlights slot nodes across layers', async ({ page }) => {
  await gotoMap(page, '#/n/logistic-regression');
  await page.getByRole('button', { name: 'Light up the recipe' }).click();
  await expect(page.locator('[data-node-id="log-loss"]')).toHaveAttribute('data-highlighted', 'true');
  await expect(page.locator('[data-node-id="classification"]')).toHaveAttribute('data-highlighted', 'true');
});
test('Trace all uses from slope highlights groups, lists uses, expands nothing new', async ({ page }) => {
  await gotoMap(page, '#/n/slope');
  await page.getByRole('button', { name: 'Trace all uses' }).click();
  await expect(page.getByTestId('uses-chip').first()).toBeVisible();
  await expect(page.locator('[data-group-id="optimization"]')).toHaveAttribute('data-highlighted', 'true');
});
test('decision tree weakness links to random forest via fixed-by chip', ...);
test('a concept node has no recipe and no strengths section', ...); // #/n/overfitting
test('section order is fixed', async ({ page }) => {
  // #/n/ols: headings appear in order Recipe, What you need first, Strengths and weaknesses (compare index in panel text)
});
```

- [ ] **Step 2: Run** `npx playwright test tests/e2e/panel.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the components and insert them into `NodePanel` in the fixed order.
- [ ] **Step 4: Run** the same command. Expected: PASS, including all Phase 1 panel cases.
- [ ] **Step 5: Commit** — `git commit -m "feat(panel): recipe card with recipe trace, trace all uses, strengths and weaknesses"`

---

### Task 8: Panel — math (lazy KaTeX), code, confusions, go further

**Files:**
- Create: `src/panel/sections/{MathSection,CodeSection,Confusions,GoFurther}.tsx`, `src/panel/katex.ts`
- Modify: `src/panel/NodePanel.tsx`, `src/panel/panel.css`, `package.json` (add `katex`, and `@types/katex` if the package ships no types)
- Test: `tests/unit/panel/MathSection.test.tsx`, `tests/e2e/panel.spec.ts`

**Interfaces:**
- Produces `src/panel/katex.ts`: `renderTex(tex: string, display: boolean): string`. It imports `katex` and `katex/dist/katex.min.css` and calls `katex.renderToString(tex, { displayMode: display, throwOnError: true })`.
- Produces `MathSection({ formula, load = () => import('../katex') }: { formula: NonNullable<Node['formula']>; load?: () => Promise<{ renderTex: typeof renderTex }> })`. It loads on the first `toggle` to open. While loading, it shows "Loading…". It uses `dangerouslySetInnerHTML` only for KaTeX output. If loading or rendering any piece throws, that piece falls back to `<code data-testid="math-raw">{tex}</code>`. Symbol meanings always render as plain text.
- `CodeSection`, `Confusions` and `GoFurther` render as described in Shared decisions.

- [ ] **Step 1: Write the failing tests:**

```tsx
// MathSection.test.tsx  (// @vitest-environment jsdom)
const formula = { tex: 'y = \\beta_0 + \\beta_1 x', symbols: [{ symbol: '\\beta_1', meaning: 'How much y moves per unit of x.' }] };
test('collapsed by default and does not load until opened', ...); // load is a vi.fn; not called before the details are opened
test('opening renders KaTeX output', ...);                        // fake load returns renderTex: (t) => `<span class="katex">${t}</span>`
test('loader rejection shows raw tex and the meanings', ...);     // findByTestId('math-raw') has the tex; meaning text is visible
test('a piece that throws falls back alone', ...);                // renderTex throws for '\\bad'; the other symbol still renders
```
```ts
// panel.spec.ts
test('math section opens and renders KaTeX', async ({ page }) => {
  await gotoMap(page, '#/n/ols');
  const math = page.getByTestId('math');
  await expect(math).not.toHaveAttribute('open', '');
  await math.locator('summary').click();
  await expect(math.locator('.katex-display')).toBeVisible();
});
test('KaTeX is not requested before the math section opens', async ({ page }) => {
  const urls: string[] = [];
  page.on('request', (r) => urls.push(r.url()));
  await gotoMap(page, '#/n/ols');
  await expect(page.getByTestId('panel')).toBeVisible();
  expect(urls.some((u) => /katex/i.test(u))).toBe(false);
});
test('code, confusions and resources render for logistic regression', ...); // code mentions sklearn; confusion chip → ols; ≥ 1 resource link with target=_blank
```

- [ ] **Step 2: Run** `npx vitest run tests/unit/panel && npx playwright test tests/e2e/panel.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Check that `vite build` emits KaTeX in its own chunk. `grep -l katex dist/assets/index-*.js` should print nothing.
- [ ] **Step 4: Run** the same commands. Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(panel): math with lazy KaTeX, code, confusions and go-further sections"`

---

### Task 9: Lens chips and tour list

**Files:**
- Create: `src/app/LensChips.tsx`
- Modify: `src/app/TopBar.tsx` (between Breadcrumb and spacer), `src/panel/Welcome.tsx`, `src/app/theme.css`
- Test: `tests/e2e/lens.spec.ts`, `tests/e2e/tour.spec.ts`

**Interfaces:**
- Consumes: store `activeLens`, `toggleLens`, `startTour`. `LENSES` from the schema, and the chip labels from Shared decisions.
- Produces: `LensChips`, a `role="group" aria-label="Lenses"` element with four `aria-pressed` buttons. Each pressed chip also carries a visible check mark, so color is not the only cue. `Welcome` adds `<ul aria-label="More tours">` with one button per tour other than `how-a-model-learns`, in content order.

- [ ] **Step 1: Write the failing e2e tests:**

```ts
test('NLP lens highlights NLP nodes across layers and fades the rest', async ({ page }) => {
  await gotoMap(page);
  const lenses = page.getByRole('group', { name: 'Lenses' });
  await lenses.getByRole('button', { name: 'NLP' }).click();
  await expect(lenses.getByRole('button', { name: 'NLP' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-group-id="text-processing"]')).toHaveAttribute('data-highlighted', 'true');
  await expect(page.locator('[data-group-id="probabilistic-models"]')).toHaveAttribute('data-highlighted', 'true'); // naive-bayes
  await expect(page.locator('[data-group-id="calculus"]')).toHaveAttribute('data-faded', 'true');
});
test('only one lens at a time', ...);
test('lens survives selection; Escape clears selection, then the lens', ...);
test('starting a trace turns the lens chip off', ...);
test('each of tours 2–5 starts from the welcome list and finishes', async ({ page }) => {
  for (const [title, n] of [['From one tree to a forest', 7], ['Why logs are everywhere', 6], ['Explain vs predict', 6], ['From a neuron to a network', 5]] as const) {
    await gotoMap(page);
    await page.getByRole('list', { name: 'More tours' }).getByRole('button', { name: title }).click();
    const card = page.getByTestId('tour-card');
    await expect(card).toContainText(`Step 1 of ${n}`);
    for (let i = 2; i <= n; i++) await card.getByRole('button', { name: 'Next' }).click();
    await card.getByRole('button', { name: 'Finish' }).click();
    await expect(card).toHaveCount(0);
  }
});
```

- [ ] **Step 2: Run** `npx playwright test tests/e2e/lens.spec.ts tests/e2e/tour.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(app): lens chips and tours 2–5 in the welcome panel"`

---

### Tasks 10–26: The seventeen P2 visualizations

Every visualization task has the shape of Phase 1's Tasks 21–28, with one added step.

**Files** (per `<id>`):
- Create: `src/viz/<id>/model.ts`, `src/viz/<id>/index.tsx`
- Modify: `src/viz/ids.ts` (append the id to `VIZ_IDS`), `src/viz/registry.ts` (add the entry), and the node YAML (`viz: <id>` on the node(s) from the Shared decisions table)
- Test: `tests/unit/viz/<id>.test.ts`, one case in `tests/e2e/viz.spec.ts`, and the pair added to the "every visualization renders" list in that file (rename it from "every P1 visualization renders")

**Interfaces:** the same as Phase 1. `index.tsx` default-exports a `VizModule` with the takeaway from Shared decisions, copied verbatim, and a one-sentence `altText`. It renders `<Readout>` in the given format, uses the shared controls (`Slider`, `StepButton`, `Toggle`, `useDrag`), and under `useReducedMotion()` jumps to end states. Numbers in readouts use the stated decimals and never show `NaN`.

**Steps** (per task):
- [ ] **Step 1:** Write the model unit tests below. Run `npx vitest run tests/unit/viz/<id>.test.ts`. Expected: FAIL.
- [ ] **Step 2:** Implement `model.ts`. Run again. Expected: PASS.
- [ ] **Step 3:** Add the e2e case. It opens `#/n/<node>`, operates the named control by keyboard and expects the readout to change, then match the format regex. Run `npx playwright test tests/e2e/viz.spec.ts -g <id>`. Expected: FAIL.
- [ ] **Step 4:** Implement `index.tsx`, the id, the registry entry and the YAML `viz:`. Run the e2e case, `npx vitest run tests/unit/viz/registry.test.ts` and `npm run content:check -- --strict`. Expected: PASS.
- [ ] **Step 5:** Commit — `git commit -m "feat(viz): <id> visualization"`

#### Task 10: `loss-functions` (node `loss-function`)

- Model: `losses(p: number): { squared: number; absolute: number; log: number }` for a true answer of 1 and a predicted probability `p` clamped to [0.01, 0.99]: `(1-p)²`, `|1-p|`, `-ln p`.
- Tests: at p = 0.99 all three are < 0.02; at p = 0.01 the order is log > squared and log > absolute; all three are non-increasing in p over a 0.01 grid; p = 0 and p = 1 are clamped and finite.
- View: the three curves over p ∈ [0.01, 0.99]. Each has a distinct dash pattern and a direct label, and all share the error color family. A vertical marker sits at the dragged prediction. Control: drag the marker (`useDrag`, step 0.01, label "Prediction").
- Readout: `"Prediction {p, 2 dp} · squared {2 dp} · absolute {2 dp} · log {2 dp}"`.

#### Task 11: `regularization` (node `regularization`)

- Model: `polyFeatures(xs: number[], degree: number): number[][]` (scaled x, as in `overfitting/model.ts`, whose `toScaled` and `evalPoly` are reused). `fitRidge(points, degree, strength): number[]` is least squares on rows augmented with `√strength · I`, leaving the intercept unpenalized, solved with the existing QR. `fitLasso(points, degree, strength, iters = 2000): number[]` uses coordinate descent with soft-thresholding and an unpenalized intercept.
- Tests: `fitRidge(..., 0)` matches `fitPolynomial` within 1e-6; the coefficient L2 norm (excluding the intercept) is non-increasing over strengths `[0.001, 0.01, 0.1, 1, 10]`; Lasso at strength 10 has ≥ 5 of 9 weights exactly 0; Ridge at strength 10 has none exactly 0; both stay finite at strength 1000.
- View: `flatPrices` train/test points with the degree-9 fit, and beside it 9 coefficient bars on a symmetric scale. Controls: Slider "Penalty strength" (log-spaced over 0.001–100, 25 positions) and Toggle "Lasso" (off means Ridge).
- Readout: `"{Ridge|Lasso} · penalty {strength, 3 significant} · {k} of 9 weights non-zero · test error {mse, 0 dp}"`.

#### Task 12: `cross-validation` (node `cross-validation`)

- Model: `foldOf(n: number, k: number, seed: number): number[]` (shuffled, with fold sizes differing by ≤ 1), and `foldErrors(points, k, seed): number[]` (OLS from `ols-fit/model.ts` trained on the other folds, MSE on the held-out one).
- Tests: every index appears in exactly one fold; the fold sizes for n = 40, k = 5 are all 8; for n = 41, sizes differ by ≤ 1; `foldErrors` has length k with all values finite and > 0; same seed, same folds.
- View: a strip of all 40 `flatPrices` points as cells colored by role in the current fold (train vs test colors, plus a fold-number label for non-color reading), above a scatter with that fold's fitted line. Control: StepButton "Next fold" (wraps from 5 back to 1).
- Readout: `"Fold {i} of 5 · test error {0 dp} · average so far {0 dp}"`.

#### Task 13: `random-forest` (node `random-forest`)

- Model: extend `decision-tree/model.ts`'s `growTree` with an optional third parameter `opts?: { featuresAt?: () => Feature[] }`, which defaults to both features. Existing tests must still pass. Add `growForest(points, nTrees, seed): Tree[]`: bootstrap samples, depth 6, one random feature per split. Add `forestVote(forest, p): number` (share of trees voting 1).
- Tests: deterministic for a seed; `growForest(train, 1, s)` has 1 tree; the vote is in [0, 1]; on `emails` test, the 25-tree accuracy ≥ the accuracy of a single depth-6 tree on all of train; nTrees = 0 is rejected (the slider minimum is 1, and the function throws on 0).
- View: `emails` train points; faint outlines of the first 3 trees' regions; the forest vote as shading at 3 opacity levels. Control: Slider "Trees" (1–25).
- Readout: `"{n} trees · test accuracy {pct}%"`.

#### Task 14: `gradient-boosting` (node `gradient-boosting`)

- Model: `fitStump(xs: number[], ys: number[]): { split: number; left: number; right: number }` (the best single split on x by SSE), and `boost(points, nTrees, rate = 0.3): number[][]`, which returns the predictions after 0..nTrees trees, starting from the mean.
- Tests: the stump fitted to a step function finds the step; training MSE is non-increasing over 0..30 trees; predictions after 0 trees all equal the mean; 200 trees stay finite.
- View: `flatPrices` train points, the current fitted step curve, and residual sticks from points to the curve. Controls: StepButton "Add a tree" (max 30, then disabled) and StepButton "Reset". Under reduced motion the curve jumps.
- Readout: `"{n} trees · training error {0 dp}"`.

#### Task 15: `knn` (node `knn`)

- Model: `standardize(points): (p) => [number, number]` (z-scores from train), `neighbors(train, query, k, scaled: boolean): number[]` (indices, Euclidean), `vote(train, idx): 0 | 1`.
- Tests: unscaled neighbors of a query differ from scaled ones on `emails` for a query at `{ links: 4, capsShare: 0.9 }` (the unscaled distance is dominated by `links`); k = 5 returns 5 distinct indices; ties in the vote go to class 1, as in Phase 1's `majority`.
- View: `emails` train points; a draggable query point (`useDrag`, label "Query email"); lines to its 5 neighbors. Controls: drag and Toggle "Scale features". k is fixed at 5 (see Shared decisions).
- Readout: `"Neighbors: {s} spam, {5-s} not spam · prediction {spam|not spam} · features {scaled|unscaled}"`.

#### Task 16: `k-means` (node `k-means`)

- Model: `assign(points, centroids): number[]`, `move(points, labels, centroids): Centroid[]` (an empty cluster keeps its centroid), and `inertia(points, labels, centroids): number`. Points are standardized `emails` features, with k = 3 and seeded starting centroids.
- Tests: inertia is non-increasing over alternating assign/move steps; after convergence, a further step changes nothing; an empty cluster keeps its centroid and stays finite.
- View: points colored by cluster, also marked with a cluster-specific shape, and centroids drawn as crosses. Controls: StepButton "Step" (alternates assign and move) and StepButton "Reset".
- Readout: `"Step {n} · {assign|move} · total distance {1 dp}"`, plus `" · converged"` once a step changes nothing.

#### Task 17: `pca` (node `pca`)

- Model: `projectionSpread(points, angleDeg): number` (the variance of the projections on a unit vector through the mean), and `bestAngle(points): number` (the closed-form 2×2 eigenvector, in [0, 180)). Points are standardized `emails` features.
- Tests: `bestAngle` maximizes `projectionSpread` over a 1° grid within 1°; the spread at the best angle plus the spread at best + 90 equals the total variance within 1e-9; 0° and 180° give equal spread.
- View: the point cloud, a line through the mean at the current angle, and projection ticks. Control: Slider "Angle" (0–180°, step 1).
- Readout: `"Angle {deg}° · keeps {pct}% of the spread · best is {pct}% at {deg}°"`.

#### Task 18: `logistic-regression` (node `logistic-regression`)

- Model: `sigmoid(z)`, `predict(w, b, x)`, `logLoss(points, w, b): number` (probabilities clipped to [1e-9, 1 − 1e-9]), and `fit1D(points): { w; b }` (gradient descent, fixed iterations). Data: `emails` with x = `links` and y = label.
- Tests: `sigmoid(0)` = 0.5; `logLoss` at the `fit1D` result ≤ the loss at ±0.1 nudges of w and of b; the loss is finite for extreme w = ±20.
- View: points at y = 0 or 1, with vertical jitter, along `links`, and the sigmoid curve. Controls: Slider "Weight" (−3–3, step 0.1) and Slider "Bias" (−10–10, step 0.5).
- Readout: `"Weight {1 dp} · bias {1 dp} · log loss {2 dp} · best {2 dp}"`.

#### Task 19: `neuron-to-network` (node `neural-network`)

- Model: `trainMLP(points, hidden: number, seed: number, epochs = 1500, rate = 0.5)`: one hidden tanh layer, a sigmoid output, full-batch gradient descent, inputs standardized. It returns `{ predict(p): number; loss: number }`. Data: `emails` train.
- Tests: deterministic for a seed; final loss < initial loss for hidden = 1..4; the final loss with 3 hidden units ≤ the 1-unit loss + 1e-6; predictions are in (0, 1).
- View: the decision boundary (the 0.5 contour drawn on a 40×40 grid) over the points, with each hidden unit's own line drawn faintly. Control: Slider "Hidden units" (1–4). Training runs in the model synchronously, memoized per unit count.
- Readout: `"{n} hidden units · training accuracy {pct}%"`.

#### Task 20: `backpropagation` (node `backpropagation`)

- Model: a fixed 2-2-1 network (literal weights, sigmoid units, squared error) with one example. `forward(net, x): { h: number[]; out: number }`, `backward(net, x, y): Grads`, and `steps(net, x, y): Phase[]`, where a phase is a list of labeled values to show: forward hidden, forward output, loss, output gradient, hidden gradients, weight gradients.
- Tests: `backward` matches finite differences (h = 1e-6) for every weight within 1e-6; `steps` has 6 phases in the order above.
- View: the network as nodes and edges, with the current phase's values printed on its nodes or edges. Forward values use the prediction color and backward values the error color, plus "→"/"←" labels. Control: StepButton "Step" (wraps after the last phase).
- Readout: `"Step {i} of 6 · {phase name}"`.

#### Task 21: `sampling-distribution` (nodes `sampling-distributions`, `central-limit-theorem`)

- Model: move `skewedPrices()` from `logarithms/index.tsx` to `datasets.ts` (exported, memoized), and have `logarithms` import it. Add `sampleMeans(pop: number[], size: number, count: number, rand): number[]` (with replacement).
- Tests: `skewness(sampleMeans(size 30))` < `skewness(pop)` (reusing `logarithms/model.ts`'s `skewness`); the sd of the means shrinks as the size goes 2 → 10 → 30, staying near σ/√n within 25%; same seed, same means.
- View: the skewed population histogram (small) above the histogram of the sample means. Controls: Slider "Sample size" (1–50) and StepButton "Draw 100" (adds 100 means; changing the size resets).
- Readout: `"Sample size {n} · {count} means drawn · spread of means {sd, 0 dp}"`.

#### Task 22: `bootstrap` (node `bootstrap`)

- Model: `resample(values, rand): number[]`, `percentileInterval(values, level = 0.95): [number, number]`. Data: `flatPrices` train prices.
- Tests: a resample has the same length and only original values; with seed 1 at least one value repeats; the interval over 1000 bootstrap means contains the sample mean; an interval of a single value is that value twice.
- View: the original 20 prices as dots; the latest resample, with repeat counts; a histogram of bootstrap means with the interval marked. Control: StepButton "Draw 20".
- Readout: `"{count} resamples · middle 95% of means {lo, 0 dp}–{hi, 0 dp}"`, or `"No resamples yet"` before the first draw.

#### Task 23: `hypothesis-test` (node `hypothesis-testing`)

- Model: `diffInMeans(values, labels): number`, `shuffledDiffs(values, labels, n, rand): number[]`, and `pValue(observed, nullDiffs): number` (two-sided share of |d| ≥ |observed|). Data: `emails` `links` by label.
- Tests: the shuffled diffs average within 0.3 of 0; `pValue` is in [0, 1]; for the real labels p < 0.01 after 1000 shuffles; with labels made independent (a seeded random 0/1), p > 0.05; `pValue(x, [])` returns 1.
- View: a histogram of the shuffled differences with the observed difference as a marked line. Control: StepButton "Shuffle 50".
- Readout: `"{n} shuffles · {k} as extreme as the real gap · p ≈ {3 dp}"`, or `"Real gap {2 dp} links · no shuffles yet"`.

#### Task 24: `omitted-variable-bias` (node `omitted-variable-bias`)

- Model: own data from `mulberry32(11)`: 60 flats with `size` U(30, 150), `distance = 0.1·size + N(0, 1)` km, and `price = 2·size − 25·distance + N(0, 15)`. Add `fitSimple(points): slope` (price on size) and `fitWithControl(points): { size; distance }` (2-regressor OLS, closed form).
- Tests: the simple slope is < 0; the controlled size coefficient is within 0.3 of 2; the controlled distance coefficient is within 3 of −25.
- View: price against size, with the fitted line; with the toggle on, points are colored by distance band (also shaped by band) and the size effect is drawn at the mean distance. Control: Toggle "Include distance to centre".
- Readout: `"Size coefficient {2 dp} ({with|without} distance)"`.

#### Task 25: `tf-idf` (node `tf-idf`)

- Model: `tokenize(s): string[]` (lowercase, split on non-letters, no stop list), and `tfidf(docs: string[][]): Map<string, number>[]` with tf = count / doc length and idf = ln((1 + N) / (1 + df)) + 1 (scikit-learn's smooth idf).
- Tests: a word in every doc has the lowest weight in each doc; a word in one doc only has the highest idf; an empty sentence gives an empty map and no `NaN`; punctuation and case don't create new terms.
- View: three editable sentences (default: `"Win a free prize now"`, `"Your invoice for the meeting is attached"`, `"Claim the free gift and the prize"`). Under each one, its words are shown as bars sorted by weight. Control: three `<input type=text>` labelled "Sentence 1"–"Sentence 3" (one control group).
- Readout: `"Highest weight: \"{word}\" in sentence {i} · lowest: \"{word}\""`, or `"Type a sentence to see word weights"` when all are empty.

#### Task 26: `time-series-decomposition` (node `trend-seasonality`)

- Model: `makeSeries(trend: number, season: number, n = 48, seed = 5): number[]` (100 + trend·t + season·sin(2πt/12) + N(0, 3)), and `decompose(series, period = 12): { trend: (number | null)[]; seasonal: number[]; residual: (number | null)[] }` (a centred 2×12 moving average, with seasonal means of the detrended values centred to sum 0).
- Tests: on a noise-free series, the interior trend is within 0.5 of the true line; `trend + seasonal + residual` reconstructs the series wherever the trend is defined; trend 0 and season 0 give a seasonal swing < 3.
- View: four small stacked panels (series, trend, seasonal, residual) sharing the x axis. Controls: Slider "Trend" (−2 to 2 per month, step 0.1) and Slider "Season" (0–20, step 1). Noise is fixed.
- Readout: `"Trend {1 dp} per month · seasonal swing ±{0 dp}"`.

---

### Task 27: Phase 2 verification

**Files:**
- Modify: `tests/unit/data/realContent.test.ts`, `tests/e2e/viz.spec.ts`

- [ ] **Step 1: Write the final assertions.** Every id in `VIZ_IDS` (25) is used by at least one node's `viz`. `registry` covers `VIZ_IDS` (the existing test). "Every visualization renders" in `viz.spec.ts` visits all 25 pairs with no `.viz-fallback`.
- [ ] **Step 2: Run** `npm run ci && npx playwright test && npm run content:links`. Expected: all pass. This is the full Phase 2 verification.
- [ ] **Step 3: Check the bundle.** `npm run build`, then confirm that KaTeX and every visualization are in separate chunks: `grep -L "katex" dist/assets/index-*.js` lists the entry file.
- [ ] **Step 4: Regenerate** `npm run content:report` and tell the user it is ready for the human accuracy review (design §11). Content PRs were split per task for this reason.
- [ ] **Step 5: Commit** — `git commit -m "test: phase 2 coverage — every visualization wired and rendering"`
