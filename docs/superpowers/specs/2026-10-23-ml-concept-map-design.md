# ML Concept Map — Technical Design

Date: 2026-10-23
Product spec: [`ML Concept Map — Spec.md`](../../../ML%20Concept%20Map%20—%20Spec.md) (the "product spec")

## 1. Goal and scope

Build the ML Concept Map described in the product spec as a hosted static website. The student opens a link; nothing to install.

- **This design covers the whole product spec architecturally**, so later phases add features without rework.
- **Detailed implementation scope is Phase 1** ("Usable map"). Phases 2 and 3 each get their own short spec → plan → build cycle on this foundation (see §10).
- **Content is a parallel workstream.** Claude drafts node content; a human (developer, tutor or student) reviews it for accuracy and level via pull requests.

Assumptions:

- Open questions in the product spec (exact syllabus, econometrics depth, Bayesian statistics) do not block Phase 1. The product spec's draft node set is used as written.
- Content is edited by developers through the repo, not by non-technical editors and not through a CMS.

## 2. Stack

| Concern | Choice |
| --- | --- |
| Build tool | Vite |
| Language | TypeScript (strict) |
| UI | React |
| State | Zustand (single store) |
| Map rendering | Hand-written SVG with a custom lane layout |
| Pan/zoom | d3-zoom |
| Visualization helpers | d3-scale, d3-shape, d3-array (no D3 DOM manipulation) |
| Content format | YAML files, validated with Zod at build time |
| Search | Fuse.js |
| Math rendering | KaTeX, lazy-loaded (Phase 2) |
| Unit tests | Vitest |
| End-to-end tests | Playwright |
| Hosting | GitHub Pages, deployed by GitHub Actions |
| Routing | URL hash (`#/n/<node-id>`, `#/e/<edge-id>`) |

Rejected alternatives:

- **Cytoscape.js:** automatic layouts fight strict lanes, and canvas rendering makes keyboard and screen-reader access hard.
- **Astro page per node:** the map is a single-page experience. Per-node links are covered by hash routing.

## 3. Repository layout

```
content/
  groups.yaml                  # group id, label, layer, order within lane
  nodes/<layer>/<group>.yaml   # one file per group, listing its member nodes
  edges/*.yaml                 # edges, split into files by theme
  tours/*.yaml
src/
  data/      Zod schema, build-time loader, cross-reference validation, content linter
  graph/     pure logic: neighbors, traces, highlight sets, search index
  layout/    pure lane layout: positions from expansion state
  map/       SVG map components: lanes, nodes, edges, tools rail
  panel/     detail panel and its section components; edge panel
  viz/       registry, shared datasets/palette/controls, one folder per visualization
  tours/     tour player
  app/       store, hash router, theme, top bar (search, breadcrumb, theme toggle)
scripts/
  content-report.ts   # renders all node panels into one Markdown file for review
tests/
  unit/      Vitest
  e2e/       Playwright
  fixtures/  deliberately broken content for validation tests
```

## 4. Data model

### 4.1 Layers and kinds

- `layer`: `foundations | math | core | algorithms | problems | tools`.
- `kind` sets the node shape:

| Kind | Shape |
| --- | --- |
| `foundation` | circle |
| `math` | circle |
| `concept` | pill |
| `algorithm` | rounded rectangle |
| `problem` | rounded rectangle |
| `tool` | small tag in the tools rail |

### 4.2 Group

```yaml
- id: optimization
  label: Optimization
  layer: math
  order: 3          # left-to-right position within the lane
```

A lane holds at most 12 groups; the linter enforces this.

### 4.3 Node

| Field | Type | Phase 1 required | Notes |
| --- | --- | --- | --- |
| id | kebab-case string | yes | globally unique |
| label | string, ≤ 3 words | yes | |
| synonyms | string[] | no | used by search |
| layer | layer enum | yes | must match its group's layer |
| group | group id | yes | |
| kind | kind enum | yes | |
| lenses | (`econometrics`, `nlp`, `time-series`, `neural-nets`)[] | no | |
| oneLiner | string, < 15 words | yes | |
| intuition | string, 2–4 sentences | yes | |
| analogy | string | no | the one analogy reused wherever the concept appears |
| showsUpIn | string | yes for foundation/math | the "Shows up in ML as" text |
| recipe | {problem, modelFamily, loss, optimizer, evaluation} | no | each slot: `{text, node?}`; algorithms only |
| reducedRecipe | {goal, optimizes, optimizer, judgedBy} | no | unsupervised algorithms only |
| formula | {tex, symbols: [{symbol, meaning}]} | no | |
| code | {tool: node id, snippet} | no | 3–6 lines |
| strengths / weaknesses | {text, fixedBy?: node id}[] | no | algorithms only |
| confusions | string[] | no | |
| resources | {title, url}[] | no | at most 3 |
| viz | visualization id | no | must exist in the registry |

Fields that are not required in Phase 1 are still in the schema, so Phase 2 adds content without schema changes.

### 4.4 Edge

| Field | Type | Notes |
| --- | --- | --- |
| id | string | optional in YAML; defaults to `<from>--<type>--<to>` |
| from, to | node or group id | |
| type | `needs \| is-trained-by \| solves \| is-special-case-of \| fixes-weakness-of \| is-built-from \| controls \| implemented-in \| not-same-as` | |
| sentence | string | the hover text, e.g. "Random forest fixes the variance of a decision tree" |
| explanation | string | optional; shown in the edge panel |
| signature | boolean | true for the product spec's signature connections |

Edge direction: `from` is the subject of the sentence, so "A needs B" means `from: A, to: B`. The product spec's "Slope is needed by Derivative" is stored as `from: derivative, type: needs, to: slope`.

"What you need first" and "Where it shows up" are **computed** from `needs` edges, never stored.

### 4.5 Tour

```yaml
id: how-a-model-learns
title: How a model learns
stops:
  - node: functions-and-graphs
    caption: Every model is a function...
```

5–8 stops per tour.

## 5. Build-time content pipeline

A Vite plugin (also callable from tests and scripts) runs these steps:

1. **Load:** read all YAML under `content/`.
2. **Parse:** check each file with the Zod schemas.
3. **Cross-check:**
   - ids are unique
   - each node's group exists and its layer matches the group's
   - edge endpoints exist
   - edge types are valid
   - `implemented-in` edges point to `tool` nodes
   - tour stops exist
   - `viz` ids exist in the registry
   - `code.tool` and `fixedBy` resolve to nodes
   - the `needs` graph has no cycles (each cycle is reported with its path)
4. **Lint** content against the writing rules:
   - one-liner < 15 words
   - sentences < 20 words
   - no mathematical symbols (Σ, ∂, ∇, =, ^, Greek letters) in `oneLiner` or `intuition`
   - every node in the math, core or algorithms layers has at least one outgoing `needs` edge (problems connect through incoming `solves` edges, tools through `implemented-in`)
   - no node without any edges
   - ≤ 12 groups per lane
5. **Emit:** one JSON module (`virtual:content`) bundled into the app.

Every error names the file, the node or edge id and the rule it breaks, and fails the build. Lint rules can be marked as warnings while content is being drafted. CI treats warnings as errors before deploy.

`npm run content:report` writes `content-report.md`. It holds every node's panel text in layer order, for human review.

## 6. Application state

One Zustand store:

```ts
{
  selection: { kind: 'node' | 'edge', id } | null
  expandedGroups: Set<GroupId>
  zoomLevel: 'layers' | 'groups' | 'nodes'
  highlight: { mode: 'none' | 'trace-down' | 'trace-up' | 'recipe' | 'lens' | 'tour', ids: Set<Id> }
  activeLens: LensId | null        // Phase 2
  tour: { id, step } | null
  breadcrumb: NodeId[]             // last 5 selections
  theme: 'system' | 'light' | 'dark'
}
```

- Traces, lenses and tours all use the single `highlight` set, so Phase 2 features are new ways of filling it, not new rendering paths.
- The hash router keeps `selection` and the URL in sync: `#/n/<id>` and `#/e/<id>`.
- An unknown id in the hash falls back to the default view with a brief "node not found" notice.
- `theme` and `expandedGroups` are kept in `localStorage` as a convenience. Every access is wrapped in try/catch, and the app works without storage.

## 7. Map

### 7.1 Screen layout

- **Left:** the map area.
- **Map area:** five horizontal lanes stacked bottom to top: Foundations, Math, Core concepts, Algorithms, Problems. Each lane label sits at its left edge.
- **Tools rail:** a narrow column at the right edge of the map area.
- **Right:** the detail panel, about 400 px wide. When nothing is selected, the panel collapses or shows a short welcome text with a "Start the tour" button.
- **Top bar:** search, breadcrumb, theme toggle.

### 7.2 Lane layout (`layout/`)

`layout(groups, nodes, expandedGroups) → { lanes, groupBoxes, nodePositions }` is a pure, deterministic function.

- Groups are placed left to right by `order`. Orders are hand-tuned so that related groups line up vertically across lanes, which keeps edges short.
- A collapsed group is one node sized to its label: ≥ 13 px text, ≤ 3-word labels.
- An expanded group lays out its member nodes in a grid of up to 4 columns, in place of the group node. The lane grows taller, and later groups in the lane shift right.
- Node positions animate over 250 ms with CSS transforms. Animation is off under `prefers-reduced-motion`.
- The tools rail lists tool nodes vertically.

### 7.3 Zoom levels

- **Layers:** only lane bands and labels. This is the first screen on a visitor's first visit.
- **Groups:** the default view after the first visit.
- **Nodes:** groups expanded.

Expanding happens by click, not by zooming. d3-zoom provides pan and zoom, and a "fit" button resets the view.

### 7.4 Edges

- Edges are hidden in the calm view.
- **On selection:**
  - Draw the selected node's direct edges as quadratic curves.
  - An edge whose other end is inside a collapsed group attaches to the group node. Several such edges collapse into one, with a "+n" badge.
  - Unrelated nodes fade to 20% opacity.
- Line style by type follows the product spec's edge-type table. SVG markers provide the arrowheads and the bar end. Color is never the only cue.
- **Hovering an edge** shows its `sentence` in a tooltip. Paths have a wider invisible hit area to make hovering easier.
- **Clicking an edge** selects it and opens the edge panel.
- Escape or a click on the background clears the selection.

### 7.5 Traces (`graph/`)

- `traceDown(nodeId)`: breadth-first search along outgoing `needs` edges. It returns the reachable set and a **learning order**: a topological sort with foundations first, ties broken by layer, then by label.
- `traceUp(nodeId)`: the same search along reverse edges (Phase 2).
- `recipeSet(nodeId)`: the recipe slot node ids (Phase 2).
- Starting a trace expands every group on the path, fills `highlight`, lights up the path edges on the map, and lists the ordered prerequisites in the panel as chips.

### 7.6 Search

- Fuse.js over labels and synonyms, with up to 8 results shown as autocomplete.
- Picking a result expands its group, centers the view on the node and selects it.
- Keyboard: `/` focuses search, arrow keys move through results, Enter selects.

### 7.7 Tour player

- A small overlay card at the bottom of the map with the tour title, step n/m, caption, Back/Next and Close.
- Each step selects its node, opens the panel, centers the view on the node and highlights the stops visited so far.
- Phase 1 ships tour 1. Tours 2–5 are data only (Phase 2).

## 8. Detail panel

`panel/NodePanel.tsx` draws the product spec's 11 sections in fixed order. Each section is its own component and returns `null` when its data is absent, so sections are hidden, never empty.

| # | Section | Source | Phase |
| --- | --- | --- | --- |
| 1 | Name and one-liner | `label`, `oneLiner` | 1 |
| 2 | Intuition | `intuition`, `analogy` | 1 |
| 3 | Concept visualization | `viz` → registry | 1 (8 visualizations) |
| 4 | Recipe card | `recipe` / `reducedRecipe`; slots link to nodes | 2 |
| 5 | Where it shows up | incoming `needs` edges (foundation/math only); `showsUpIn` text above the chips | 1 |
| 6 | What you need first | outgoing `needs` edges + *Trace all prerequisites* button | 1 |
| 7 | Strengths and weaknesses | `strengths`, `weaknesses`, `fixedBy` links | 2 |
| 8 | The math, one level deeper | `formula`; collapsed; KaTeX lazy-loaded | 2 |
| 9 | In code | `code` | 2 |
| 10 | Common confusions | `confusions` + `not-same-as` edges | 2 |
| 11 | Go further | `resources` | 2 |

`panel/EdgePanel.tsx` shows the edge's `sentence`, its `explanation` and both end nodes as chips.

## 9. Visualizations

### 9.1 Contract

```ts
// viz/registry.ts
export const registry: Record<VizId, () => Promise<{ default: VizModule }>>

interface VizModule {
  takeaway: string   // shown above the visual
  altText: string    // one-sentence text alternative
  Component: React.FC
}
```

- The panel draws `takeaway`, then `Component` inside an error boundary. If the component throws, the boundary shows `altText` instead.
- `altText` is also attached to the visual as its accessible description.
- Visualizations load on demand, so their code reaches the browser only when a panel opens.

### 9.2 Shared pieces

- **`viz/datasets.ts`:** the **flat prices** (size → price) and **emails** (spam / not spam, two numeric features) toy datasets. Both come from a seeded random generator, so every visualization sees identical data.
- **`viz/palette.ts`:** semantic color tokens `--viz-train`, `--viz-test`, `--viz-prediction` and `--viz-error`, as CSS variables with light and dark values. Visualizations never use raw colors.
- **`viz/controls/`:** `Slider`, `StepButton`, `Toggle` and `useDrag`. All are keyboard-accessible and labelled. Each visualization uses at most two controls.
- Rendering is React drawing SVG. D3 is used only for scales, shapes and math helpers.

### 9.3 Per-visualization structure

```
viz/<id>/
  index.tsx    # VizModule export, ~100–250 lines
  model.ts     # pure math (fits, splits, gradient steps, confusion matrix), unit-tested
```

### 9.4 Phase 1 visualizations (P1)

| Visualization | Interaction | Takeaway |
| --- | --- | --- |
| logarithms | slide x; toggle log scale | Logs turn multiplying into adding and tame huge numbers |
| slope-derivative | drag the two points together | A derivative is a slope at one point |
| gradient-descent | learning-rate slider; step button (1D curve, then 2D contour) | Too small is slow, too big overshoots or explodes |
| ols-fit | drag points | "Least squares" is the line with the smallest total square area |
| overfitting | complexity slider | Training error always falls; test error falls then rises |
| decision-tree | depth slider | A tree is a stack of yes/no cuts |
| classification-threshold | threshold slider | Precision and recall trade off against each other |
| bayes-rule | base-rate slider | A positive test can still mean "probably not" |

The remaining 17 visualizations are Phase 2 and use the same contract.

## 10. Phasing

| Phase | Delivers |
| --- | --- |
| 1 — Usable map (this plan) | Data pipeline + linter; lane layout with groups and nodes; typed edges on select; edge hover and edge panel; prerequisite trace; search with synonyms; panel sections 1, 2, 3, 5, 6; the 8 P1 visualizations; tour 1; light/dark theme; reduced motion; Tab/Enter/Escape keyboard basics; hash links; CI deploy to GitHub Pages; **content for all ~120 nodes** (label, one-liner, intuition, showsUpIn) plus edges covering every signature connection and enough `needs` edges to make every node traceable |
| 2 — Full depth | Panel sections 4, 7–11 and their content; the remaining 17 visualizations; lens chips; trace up; recipe trace; tours 2–5 |
| 3 — Polish | List view under 768 px (reusing the panel and search); arrow-key edge navigation; visualization gallery (lists the registry) |

Per-node links come early (Phase 1) because hash routing makes them almost free.

## 11. Content workstream

- Claude drafts content group by group, following the product spec's writing rules.
- Drafting order: foundations → math → core → algorithms → problems → tools. Then the signature edges, then the remaining `needs` edges.
- Each layer's content is its own commit or pull request for review. Reviewers can read `content-report.md` instead of YAML.
- The linter covers mechanical rules. Accuracy and level need a human reviewer, who stays unnamed until the product spec's open question is settled.

## 12. Error handling

| Failure | Behaviour |
| --- | --- |
| Invalid or inconsistent content | Build fails with file, id and rule |
| Unknown id in the URL hash | Default view plus a short "not found" notice |
| Visualization throws | Error boundary shows its `altText`; rest of panel unaffected |
| Visualization chunk fails to load | Same fallback with a "retry" button |
| `localStorage` unavailable | Ignored; defaults used |

## 13. Accessibility and theming

- **Theme:** colors are CSS custom properties on `:root`, with a dark set under `prefers-color-scheme: dark` plus manual override via `data-theme`.
- **Layer colors:** one muted hue per layer. Full saturation only for the selection and its connections.
- **Cues beyond color:** layer is also shown by position, edge type by line style, and visualization availability by a small badge on the node.
- **Keyboard:** nodes are focusable SVG elements with `role="button"` and an `aria-label` of label + one-liner. Tab, Enter and Escape work in Phase 1. Arrow-key edge-following comes in Phase 3.
- **Reduced motion:** `prefers-reduced-motion` turns off transitions and the animated steps in visualizations, which jump to their end state.

## 14. Testing

**Vitest:**

- **Schema and cross-checks:** one fixture per rule under `tests/fixtures/`.
- **Linter rules.**
- **Graph:** `traceDown` reachability and learning order, neighbor sets, cycle detection.
- **Layout:** snapshot of positions for collapsed, one-expanded and all-expanded states. No group overlaps; lanes contain their nodes.
- **Visualization `model.ts` files:**
  - OLS matches the closed-form solution.
  - Gradient descent converges for a small learning rate and diverges for a large one.
  - The confusion matrix sums to n.
  - Tree depth never exceeds the slider value.
  - Polynomial train error never rises as degree rises.
  - Bayes posterior matches the hand calculation.
- **Search:** synonyms resolve ("linear regression" → OLS).

**Playwright** (against the built site):

1. Select a node: its edges appear, unrelated nodes fade, the panel opens.
2. Hover an edge: its sentence shows. Click it: the edge panel opens.
3. Trace prerequisites from gradient descent: ordered chips run foundations first, and the path is highlighted.
4. Search "linear regression": OLS is selected.
5. Tour 1 runs from start to finish.
6. Each P1 visualization renders and responds to its control.
7. Opening `#/n/gradient-descent` directly shows that panel.
8. Escape returns to the calm view.

## 15. Deployment

GitHub Actions on push to `main`:

1. Install dependencies.
2. Lint and type-check.
3. Run the content build (warnings count as errors).
4. Run the Vitest tests.
5. Build the site.
6. Run the Playwright tests against the built preview.
7. Deploy `dist/` to GitHub Pages.

Pull requests run steps 1–6 without deploying. Hash routing means no server rewrites are needed.
