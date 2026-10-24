# ML Concept Map — Phase 3 ("Polish") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the product spec's Phase 3: arrow-key edge navigation on the map, a visualization gallery that lists the registry, and a list view under 768 px that reuses the panel and search.

**Architecture:** No schema or content changes. Arrow navigation is a pure module (`src/map/edgeNav.ts`) plus a key handler in `MapView`. The gallery is a new app view (`view: 'map' | 'gallery'` in the store, routed as `#/gallery`) that renders one `VizSection` per registry id. The list view is a different layout chosen by a media query in `App`: it swaps the map for a layered list and shows the existing `Panel` full-screen on selection.

**Tech Stack:** As in Phases 1–2 (Vite, TypeScript strict, React 19, Zustand, Vitest + Testing Library on jsdom, Playwright). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-23-ml-concept-map-design.md` ("the design"; §-numbers refer to it), §10 row 3 and §13 "Keyboard", built on the product spec `ML Concept Map — Spec.md` ("Small screens: a searchable list view with the same panels, no graph"; "arrow keys to follow edges"; visualizations "also browsable together as a gallery view"). The design (§1) calls for a short Phase 3 spec. This plan's **Shared decisions** section takes that role, so read it before any task.

## Global Constraints

- Everything in Phase 1–2 Global Constraints still holds: strict TS, no `any`, hash routes, D3 for math only, motion off under reduced motion, `storage.ts` for all `localStorage`, CI warnings counted as errors.
- Small-screen breakpoint is exactly `(max-width: 767px)` ("list view under 768 px", design §10). The existing `@media (max-width: 767px)` block in `src/app/theme.css` is replaced, not duplicated.
- The list view and gallery reuse `Panel`, `Search`, `Chip` and `VizSection` unchanged in behavior. No second panel or search implementation.
- Visualizations still load on demand: the gallery imports `registry`, never a visualization module directly.
- Existing selectors and e2e tests (Phase 1–2 UI selector tables) keep passing at the default Desktop Chrome viewport.
- Copy follows the product spec's writing rules: sentences under 20 words, no symbols.

## Review Focus

1. **Arrow key on a selected node whose neighbors sit in collapsed groups.** Focus must land on a neighbor, not drop to `<body>`. The groups open so the neighbor exists. Pinned in Task 2 (e2e `toBeFocused` from `gradient-descent` with everything collapsed).
2. **Returning from a panel to the list on a phone.** The student scrolled deep, opened a topic, pressed "Back to list". The list should show the same item, scrolled into view and focused. Pinned in Task 5.
3. **Horizontal overflow at 375 px.** Wide visualization SVGs, code blocks and the top bar must not make the page scroll sideways, in the list, a panel and the gallery. Pinned in Task 5.
4. **Resizing across 768 px.** Rotating a tablet or resizing a window keeps the selection and the hash; the map comes back with the node selected. Pinned in Task 5.
5. **All 25 visualizations mounted at once in the gallery.** None may fall back to its `altText` or throw, and each control stays independent. Pinned in Task 4 (e2e: 25 takeaways, zero `.viz-fallback`).

---

## Shared decisions

### Arrow-key edge navigation (map only)

- Active only when a node is selected and DOM focus is on that node or one of its **neighbors**. A neighbor is a node at the other end of one of the selected node's direct edges (`directEdges`). Group endpoints are skipped. Duplicates collapse to one, keeping the first edge in `directEdges` order.
- Arrows move **focus**, not selection. Enter on a focused neighbor selects it (existing `activateOnEnter`), which follows the edge. Escape works as before.
- **Up / Down:** move to the nearest candidate strictly above / below the focused one (center `y` differs by ≥ 8 px). "Nearest" means the smallest Manhattan distance between centers. Ties go to the smaller node id.
- **Left / Right:** previous / next candidate in reading order, wrapping. Reading order sorts by `Math.round(center y)`, then center `x`, then id. This guarantees every neighbor is reachable.
- Candidates are the selected node plus its neighbors. Boxes come from `layout(groups, nodes, expanded ∪ groups of the selected node and its neighbors)`. Tools use `toolPositions`.
- The first arrow press opens any collapsed neighbor groups (`expandGroups`), so each neighbor can take focus.
- A visually hidden live region (`data-testid="nav-announce"`, `aria-live="polite"`) holds the connecting edge's `sentence` when a neighbor takes focus. It is empty when focus returns to the selected node.
- Keys pressed anywhere outside the map's SVG (panel sliders, search) are never handled.
- Welcome text gains one line: "Keyboard: Tab moves between topics, Enter opens one, arrow keys follow its connections."

### Gallery

- Store: `view: 'map' | 'gallery'`, default `'map'`. `openGallery()` sets `'gallery'` and ends any tour (same highlight rule as `endTour`). `closeGallery()` sets `'map'`. `select()` always sets `'map'`. `escape()` checks the gallery first: gallery → tour → selection → lens.
- Route: `#/gallery`. Opening the gallery keeps `selection` in the store, so closing it returns to the same map state and hash.
- Top bar: a button "Gallery" after the lens chips, `aria-pressed` while the gallery is open; it toggles open/close.
- Page (`src/gallery/Gallery.tsx`): `<main className="gallery" aria-labelledby=…>`, heading "Visualizations" (h2), intro "Every visualization in the map, in one place. Open a topic to see it in context.", button "Back to map". Then `<ul aria-label="Visualizations">` with one `<li data-testid="gallery-card" data-viz-id="<id>">` per id in `VIZ_IDS` order.
- Card: an h3 with the label of the first node using that viz (nodes sorted by `byLayerThenLabel`; the viz id when no node uses it), the `VizSection`, then "Open topic:" and one `Chip` per node using it, `testId="gallery-topic"`.
- The gallery replaces both the map and the panel at every screen width.

### List view (under 768 px)

- `App` renders the small layout when `useMediaQuery('(max-width: 767px)')` is true and `view` is `'map'`. The map is not mounted.
- No selection: `ListView`. With a selection: a "Back to list" button (calls `clearSelection`), then `Panel`. `TourCard` shows in both states, fixed to the bottom.
- `ListView` stays mounted (with `hidden`) while the panel shows. When it is shown again, it scrolls the item for the last node that was open into view (`block: 'center'`) and focuses it with `preventScroll: true`.
- `ListView` content: intro "Topics by layer, from the math you already know up to the problems people solve.", a "Start the tour" button (tour `how-a-model-learns`), then one `<section>` per layer in `LAYERS` order with an h2: Foundations, Math, Core concepts, Algorithms, Problems, Tools. Within a layer, one h3 per group by `order`, then a `<ul>` of member buttons in `membersByGroup` order.
- Item: `<button className="list-item" data-node-id>` holding the label, the one-liner and, for nodes with `viz`, the "●" badge (`aria-hidden`). Clicking selects without `reveal`. A lens or trace marks items with `data-highlighted="true"`; when the highlight is non-empty, the rest get `data-faded="true"` (same 20% fade as the map).
- The top bar wraps on small screens. Search takes the full width on its own row, and lens chips scroll sideways inside their own row. Search is the "searchable" part of the list view.

### UI selectors (additions)

| Element | Selector |
| --- | --- |
| Nav live region | `[data-testid="nav-announce"]` |
| Gallery button (top bar) | `getByRole('button', { name: 'Gallery' })` |
| Gallery page / card / topic chip | `getByRole('main', { name: 'Visualizations' })` / `[data-testid="gallery-card"]` / `[data-testid="gallery-topic"]` |
| Back buttons | "Back to map", "Back to list" |
| List view / item | `[data-testid="list-view"]` / `.list-item[data-node-id]` |

---

### Task 1: Pure edge-navigation logic

**Files:**
- Create: `src/map/edgeNav.ts`
- Test: `tests/unit/map/edgeNav.test.ts`

**Interfaces:**
- Consumes: `Graph`, `directEdges` (`src/graph/graph.ts`); `Box`, `layout` (`src/layout/layout.ts`).
- Produces:
  - `type Direction = 'up' | 'down' | 'left' | 'right'`
  - `interface NavCandidate { id: string; box: Box }`
  - `navNeighbors(graph: Graph, nodeId: string): { nodeId: string; edgeId: string }[]`: unique node neighbors along direct edges, group endpoints skipped; `[]` for unknown ids.
  - `navCandidates(graph: Graph, nodeId: string, expanded: ReadonlySet<string>): { candidates: NavCandidate[]; groupsToOpen: string[] }`: the selected node plus its neighbors, boxed by the layout described in Shared decisions. `groupsToOpen` holds the groups of those nodes that are not in `expanded` (tools excluded).
  - `pickInDirection(fromId: string, candidates: NavCandidate[], dir: Direction): string | null`

- [ ] **Step 1: Write the failing tests**

```ts
const box = (x: number, y: number): Box => ({ x, y, w: 20, h: 20 });
const C = [
  { id: 'sel', box: box(100, 100) },
  { id: 'up-near', box: box(130, 40) },
  { id: 'up-far', box: box(400, 40) },
  { id: 'down', box: box(90, 200) },
  { id: 'same-row', box: box(300, 103) }, // |dy| < 8: not above or below
];

test('up picks the nearest candidate above', () => expect(pickInDirection('sel', C, 'up')).toBe('up-near'));
test('down picks the candidate below', () => expect(pickInDirection('sel', C, 'down')).toBe('down'));
test('nothing below the lowest candidate', () => expect(pickInDirection('down', C, 'down')).toBeNull());
test('a same-row candidate is not above or below', () => {
  expect(pickInDirection('same-row', C.filter((c) => c.id !== 'up-near' && c.id !== 'up-far' && c.id !== 'down'), 'up')).toBeNull();
});
test('left/right walk reading order and wrap', () => {
  // reading order: up-near, up-far, sel, same-row, down
  expect(pickInDirection('sel', C, 'right')).toBe('same-row');
  expect(pickInDirection('down', C, 'right')).toBe('up-near');
  expect(pickInDirection('up-near', C, 'left')).toBe('down');
});
test('ties go to the smaller id', () => {
  expect(pickInDirection('s', [{ id: 's', box: box(0, 100) }, { id: 'b', box: box(-30, 0) }, { id: 'a', box: box(30, 0) }], 'up')).toBe('a');
});
test('unknown fromId returns null', () => expect(pickInDirection('nope', C, 'up')).toBeNull());

// real graph (realGraph helper)
test('navNeighbors(gradient-descent) lists each neighbor once with its edge', async () => {
  const n = navNeighbors(g, 'gradient-descent');
  expect(n.map((x) => x.nodeId)).toEqual(expect.arrayContaining(['gradient', 'loss-landscape', 'learning-rate', 'logistic-regression', 'backpropagation']));
  expect(new Set(n.map((x) => x.nodeId)).size).toBe(n.length);
  expect(n.find((x) => x.nodeId === 'gradient')!.edgeId).toBe('gradient-descent--needs--gradient');
});
test('navCandidates opens every neighbor group and boxes every candidate', async () => {
  const { candidates, groupsToOpen } = navCandidates(g, 'gradient-descent', new Set());
  expect(groupsToOpen).toEqual(expect.arrayContaining(['optimization', 'calculus']));
  expect(candidates.map((c) => c.id)).toContain('gradient-descent');
  expect(candidates).toHaveLength(navNeighbors(g, 'gradient-descent').length + 1);
  // distinct positions, so every candidate can be told apart
  expect(new Set(candidates.map((c) => `${c.box.x},${c.box.y}`)).size).toBe(candidates.length);
});
test('already-expanded groups are not reopened', async () => {
  expect(navCandidates(g, 'gradient-descent', new Set(['calculus'])).groupsToOpen).not.toContain('calculus');
});
test('left/right from the selected node reach every neighbor of every node', async () => {
  for (const n of g.content.nodes) {
    const { candidates } = navCandidates(g, n.id, new Set());
    const seen = new Set([n.id]);
    let at = n.id;
    for (let i = 0; i < candidates.length; i++) seen.add((at = pickInDirection(at, candidates, 'right')!));
    expect(seen.size, n.id).toBe(candidates.length);
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/map/edgeNav.test.ts`
Expected: FAIL, cannot resolve `src/map/edgeNav`.

- [ ] **Step 3: Implement `navNeighbors`, `navCandidates` and `pickInDirection` in `src/map/edgeNav.ts`**

Rules exactly as in Shared decisions → Arrow-key edge navigation (8 px row threshold, Manhattan distance between centers, id tie-break, reading-order wrap). Centers are `x + w/2`, `y + h/2`. For tools use `layout(...).toolPositions`, otherwise `nodePositions`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/map/edgeNav.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/map/edgeNav.ts tests/unit/map/edgeNav.test.ts
git commit -m "feat(map): pure arrow-key edge navigation"
```

---

### Task 2: Arrow keys follow edges on the map

**Files:**
- Modify: `src/map/MapView.tsx` (key handler on the `<svg className="map">`, focus effect, live region)
- Modify: `src/panel/Welcome.tsx` (keyboard line)
- Test: `tests/e2e/keyboard.spec.ts`

**Interfaces:**
- Consumes: `navNeighbors`, `navCandidates`, `pickInDirection`, `Direction` from Task 1; store `expandGroups`, `selection`, `expandedGroups`.
- Produces: the `nav-announce` live region; no new exports.

- [ ] **Step 1: Write the failing e2e tests**

```ts
// Helper: the focused element's node id.
const focusedId = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute('data-node-id') ?? null);

test('arrows move focus to neighbors, opening collapsed groups', async ({ page }) => {
  await gotoMap(page, '#/n/gradient-descent');
  await page.locator('[data-node-id="gradient-descent"]').focus();
  await page.keyboard.press('ArrowUp');
  const up = await focusedId(page);
  expect(up).not.toBeNull();
  expect(up).not.toBe('gradient-descent');
  const a = await page.locator('[data-node-id="gradient-descent"]').boundingBox();
  const b = await page.locator(`[data-node-id="${up}"]`).boundingBox();
  expect(b!.y).toBeLessThan(a!.y);
  await expect(page.getByTestId('nav-announce')).not.toBeEmpty();
});

test('right walks every neighbor and returns to the selected node', async ({ page }) => {
  await gotoMap(page, '#/n/gradient-descent');
  await page.locator('[data-node-id="gradient-descent"]').focus();
  const seen = new Set<string>();
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('ArrowRight');
    const id = (await focusedId(page))!;
    if (id === 'gradient-descent') break;
    seen.add(id);
  }
  for (const n of ['gradient', 'loss-landscape', 'learning-rate', 'logistic-regression', 'backpropagation']) expect(seen).toContain(n);
  await expect(page.getByTestId('nav-announce')).toBeEmpty();
});

test('Enter on a focused neighbor follows the edge', async ({ page }) => {
  await gotoMap(page, '#/n/gradient-descent');
  await page.locator('[data-node-id="gradient-descent"]').focus();
  await page.keyboard.press('ArrowRight');
  const id = (await focusedId(page))!;
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`#/n/${id}$`));
  await expect(page.locator(`[data-node-id="${id}"]`)).toBeFocused();
});

test('arrows in the search box and panel sliders do not move map focus', async ({ page }) => {
  await gotoMap(page, '#/n/gradient-descent');
  await page.getByRole('slider', { name: 'Learning rate' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('slider', { name: 'Learning rate' })).toBeFocused();
  await expect(page).toHaveURL(/#\/n\/gradient-descent$/);
});

test('arrows do nothing without a selection', async ({ page }) => {
  await gotoMap(page);
  await page.locator('[data-group-id="calculus"]').click(); // expands; nothing selected
  await page.locator('[data-node-id="gradient"]').focus();
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('[data-node-id="gradient"]')).toBeFocused();
});

test('welcome names the keyboard keys', async ({ page }) => {
  await gotoMap(page);
  await expect(page.getByText('arrow keys follow its connections')).toBeVisible();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx playwright test tests/e2e/keyboard.spec.ts`
Expected: FAIL (focus stays on `gradient-descent`; no `nav-announce`; welcome line missing).

- [ ] **Step 3: Implement the handler in `src/map/MapView.tsx`**

`onKeyDown` on the `<svg>`: map `ArrowUp/Down/Left/Right` to a `Direction`. Return unless `selection?.kind === 'node'` and the target's closest `[data-node-id]` is the selected node or one of `navNeighbors(graph, selection.id)`. Then `preventDefault()`, call `navCandidates(graph, selection.id, expanded)`, `expandGroups(groupsToOpen)` if any, and `pickInDirection`. Focus the picked element via `svgRef.current.querySelector('[data-node-id="…"]')`. If it is not rendered yet (its group just opened), keep the id in a ref and focus it from an effect on `lay`. Set the live region text to the picked neighbor's edge `sentence`, or `''` for the selected node. Reset the text when `selection` changes.

- [ ] **Step 4: Add the Welcome line**

In `src/panel/Welcome.tsx`, a `<p className="welcome-keys">` after the intro paragraph with the exact text from Shared decisions.

- [ ] **Step 5: Run the new and existing e2e tests**

Run: `npx playwright test tests/e2e/keyboard.spec.ts tests/e2e/map.spec.ts tests/e2e/edges.spec.ts tests/e2e/panel.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/map/MapView.tsx src/panel/Welcome.tsx tests/e2e/keyboard.spec.ts
git commit -m "feat(map): arrow keys follow a selected node's edges"
```

---

### Task 3: Gallery view in the store and router

**Files:**
- Modify: `src/app/store.ts`
- Modify: `src/app/router.ts`
- Test: `tests/unit/app/store.test.ts`, `tests/unit/app/router.test.ts`

**Interfaces:**
- Consumes: existing store and router.
- Produces:
  - `export type View = 'map' | 'gallery'`; `AppState.view: View`
  - `AppActions.openGallery(): void`, `AppActions.closeGallery(): void`
  - `parseHash(hash: string): Selection | 'gallery' | null | 'invalid'`
  - `formatHash(sel: Selection | null, view?: View): string` (`view` defaults to `'map'`; `'gallery'` → `'#/gallery'`)

- [ ] **Step 1: Write the failing tests**

Store (`store.test.ts`):

```ts
test('view starts on the map; openGallery and closeGallery switch it', () => {
  const s = createAppStore(g, null);
  expect(s.getState().view).toBe('map');
  s.getState().openGallery();
  expect(s.getState().view).toBe('gallery');
  s.getState().closeGallery();
  expect(s.getState().view).toBe('map');
});
test('openGallery keeps the selection and ends a tour', () => {
  const s = createAppStore(g, null);
  s.getState().startTour('how-a-model-learns');
  const sel = s.getState().selection;
  s.getState().openGallery();
  expect(s.getState().tour).toBeNull();
  expect(s.getState().highlight.mode).toBe('none');
  expect(s.getState().selection).toEqual(sel);
});
test('select returns to the map', () => {
  const s = createAppStore(g, null);
  s.getState().openGallery();
  s.getState().select({ kind: 'node', id: 'ols' });
  expect(s.getState().view).toBe('map');
});
test('escape closes the gallery before clearing the selection', () => {
  const s = createAppStore(g, null);
  s.getState().select({ kind: 'node', id: 'ols' });
  s.getState().openGallery();
  s.getState().escape();
  expect(s.getState().view).toBe('map');
  expect(s.getState().selection).toEqual({ kind: 'node', id: 'ols' });
});
```

Router (`router.test.ts`): add `['#/gallery', 'gallery']` and `['#/gallery/x', 'invalid']` to the `parseHash` table, and:

```ts
test('formatHash with the gallery view', () => {
  expect(formatHash({ kind: 'node', id: 'ols' }, 'gallery')).toBe('#/gallery');
  expect(formatHash(null, 'gallery')).toBe('#/gallery');
});
test('#/gallery opens the gallery; leaving it restores the node hash', () => {
  at('#/n/ols');
  const s = createAppStore(g, null);
  const stop = startHashSync(s, g, window);
  window.location.hash = '#/gallery';
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  expect(s.getState().view).toBe('gallery');
  s.getState().closeGallery();
  expect(window.location.hash).toBe('#/n/ols');
  s.getState().openGallery();
  expect(window.location.hash).toBe('#/gallery');
  stop();
});
test('a node hash while in the gallery returns to the map', () => {
  at('#/gallery');
  const s = createAppStore(g, null);
  const stop = startHashSync(s, g, window);
  expect(s.getState().view).toBe('gallery');
  window.location.hash = '#/n/gradient';
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  expect(s.getState().view).toBe('map');
  expect(s.getState().selection).toEqual({ kind: 'node', id: 'gradient' });
  stop();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/app`
Expected: FAIL (`view`, `openGallery` undefined; `#/gallery` parses as `'invalid'`).

- [ ] **Step 3: Implement the store changes in `src/app/store.ts`**

As in Shared decisions → Gallery. `openGallery` reuses `endTour`'s highlight rule (lens highlight if a lens is on, else none). `escape()` order: gallery → tour → selection → lens.

- [ ] **Step 4: Implement the router changes in `src/app/router.ts`**

Check the literal `#/gallery` before the `HASH` regex. In `apply`: `'gallery'` → `openGallery()` unless already open; `null` → `closeGallery()` and clear selection; a valid selection → `select` as now (which returns to the map). The subscription compares `formatHash(selection, view)` before and after. It pushes a history entry when the view or the selected id changes, and replaces it otherwise.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/unit/app`
Expected: PASS (old and new tests)

- [ ] **Step 6: Commit**

```bash
git add src/app/store.ts src/app/router.ts tests/unit/app/store.test.ts tests/unit/app/router.test.ts
git commit -m "feat(app): gallery view state and #/gallery route"
```

---

### Task 4: Visualization gallery page

**Files:**
- Create: `src/gallery/Gallery.tsx`, `src/gallery/gallery.css`
- Modify: `src/app/TopBar.tsx` (Gallery button), `src/app/App.tsx` (render `Gallery` when `view === 'gallery'`)
- Test: `tests/unit/gallery/Gallery.test.tsx`, `tests/e2e/gallery.spec.ts`

**Interfaces:**
- Consumes: `view`, `openGallery`, `closeGallery` (Task 3); `VIZ_IDS`, `registry`, `VizLoaders` (`src/viz`); `VizSection({ vizId, loaders })`; `Chip({ nodeId, testId })`; `byLayerThenLabel`.
- Produces: `Gallery({ loaders }: { loaders?: VizLoaders }): JSX.Element` (`loaders` defaults to `registry`, passed through to each `VizSection`).

- [ ] **Step 1: Write the failing unit tests**

Render `<StoreProvider store={createAppStore(g, null)} graph={g}><Gallery loaders={fake} /></StoreProvider>` in jsdom. `fake` maps every `VIZ_IDS` id to `async () => ({ default: { takeaway: id, altText: 'alt', Component: () => <p>drawn {id}</p> } })`.

```ts
test('one card per registry id, in VIZ_IDS order', async () => {
  const cards = screen.getAllByTestId('gallery-card');
  expect(cards.map((c) => c.dataset.vizId)).toEqual([...VIZ_IDS]);
  expect(await screen.findAllByTestId('viz-takeaway')).toHaveLength(25);
});
test('every card names its topics as chips; sampling-distribution has two', () => {
  for (const c of screen.getAllByTestId('gallery-card')) expect(within(c).getAllByTestId('gallery-topic').length).toBeGreaterThan(0);
  const sd = screen.getAllByTestId('gallery-card').find((c) => c.dataset.vizId === 'sampling-distribution')!;
  expect(within(sd).getAllByTestId('gallery-topic')).toHaveLength(2);
});
test('the card title is the first topic by layer, then label', () => {
  const gd = screen.getAllByTestId('gallery-card').find((c) => c.dataset.vizId === 'gradient-descent')!;
  expect(within(gd).getByRole('heading', { level: 3 }).textContent).toBe(g.nodesById.get('gradient-descent')!.label);
});
test('a topic chip selects the node and returns to the map', async () => {
  store.getState().openGallery();
  await userEvent.click(within(gdCard).getAllByTestId('gallery-topic')[0]);
  expect(store.getState().view).toBe('map');
  expect(store.getState().selection).toEqual({ kind: 'node', id: 'gradient-descent' });
});
test('Back to map closes the gallery', async () => {
  store.getState().openGallery();
  await userEvent.click(screen.getByRole('button', { name: 'Back to map' }));
  expect(store.getState().view).toBe('map');
});
```

- [ ] **Step 2: Write the failing e2e tests (`tests/e2e/gallery.spec.ts`)**

```ts
test('Gallery button opens every visualization, all rendered', async ({ page }) => {
  await gotoMap(page);
  await page.getByRole('button', { name: 'Gallery' }).click();
  await expect(page).toHaveURL(/#\/gallery$/);
  await expect(page.getByRole('main', { name: 'Visualizations' })).toBeVisible();
  await expect(page.getByTestId('gallery-card')).toHaveCount(25);
  await expect(page.getByTestId('viz-takeaway')).toHaveCount(25);
  await expect(page.locator('.viz-fallback')).toHaveCount(0);
  await expect(page.locator('svg.map')).toHaveCount(0);
});

test('controls in one card do not change another', async ({ page }) => {
  await gotoMap(page, '#/gallery');
  const gd = page.locator('[data-testid="gallery-card"][data-viz-id="gradient-descent"]');
  const ols = page.locator('[data-testid="gallery-card"][data-viz-id="ols-fit"]');
  const before = await ols.getByTestId('viz-readout').textContent();
  await gd.getByRole('button', { name: 'Step' }).click();
  await expect(gd.getByTestId('viz-readout')).toContainText('Step 1');
  await expect(ols.getByTestId('viz-readout')).toHaveText(before!);
});

test('a topic chip opens the node on the map; Back returns to the gallery', async ({ page }) => {
  await gotoMap(page, '#/gallery');
  await page.locator('[data-testid="gallery-card"][data-viz-id="gradient-descent"]').getByTestId('gallery-topic').first().click();
  await expect(page).toHaveURL(/#\/n\/gradient-descent$/);
  await expect(page.locator('svg.map')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('main', { name: 'Visualizations' })).toBeVisible();
});

test('Escape leaves the gallery for the map', async ({ page }) => {
  await gotoMap(page, '#/gallery');
  await page.keyboard.press('Escape');
  await expect(page.locator('svg.map')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gallery' })).toHaveAttribute('aria-pressed', 'false');
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/unit/gallery && npx playwright test tests/e2e/gallery.spec.ts`
Expected: FAIL (no `Gallery` module; no Gallery button).

- [ ] **Step 4: Implement `Gallery` in `src/gallery/Gallery.tsx` with `gallery.css`**

Markup and copy exactly as in Shared decisions → Gallery. Cards sit in a responsive grid (`repeat(auto-fill, minmax(min(100%, 380px), 1fr))`) and span the full app width (`grid-column: 1 / -1`). Use theme tokens only.

- [ ] **Step 5: Wire `TopBar` and `App`**

`TopBar`: the "Gallery" button after `<LensChips />`, with `aria-pressed={view === 'gallery'}`, toggling `openGallery`/`closeGallery`. `App`: when `view === 'gallery'`, render `<Gallery />` in place of the map column and the panel.

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run tests/unit/gallery && npx playwright test tests/e2e/gallery.spec.ts tests/e2e/smoke.spec.ts tests/e2e/viz.spec.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/gallery src/app/TopBar.tsx src/app/App.tsx tests/unit/gallery tests/e2e/gallery.spec.ts
git commit -m "feat(gallery): visualization gallery listing the registry"
```

---

### Task 5: List view under 768 px

**Files:**
- Create: `src/app/useMediaQuery.ts`, `src/list/ListView.tsx`, `src/list/SmallScreen.tsx`, `src/list/list.css`
- Modify: `src/app/App.tsx` (choose layout), `src/app/theme.css` (replace the `max-width: 767px` block; top bar wrapping), `src/panel/Welcome.tsx` (export `FIRST_TOUR`)
- Test: `tests/unit/app/useMediaQuery.test.tsx`, `tests/unit/list/ListView.test.tsx`, `tests/e2e/small-screen.spec.ts`

**Interfaces:**
- Consumes: `Panel`, `TourCard`, store `selection`, `select`, `clearSelection`, `startTour`, `highlight`, `view`; `LAYERS`; `FIRST_TOUR` (now exported from `Welcome.tsx`).
- Produces:
  - `SMALL_SCREEN = '(max-width: 767px)'` and `useMediaQuery(query: string): boolean` in `src/app/useMediaQuery.ts`. Uses `useSyncExternalStore` over `window.matchMedia`, and returns `false` when `matchMedia` is missing.
  - `ListView({ hidden }: { hidden: boolean })`, `SmallScreen()`

- [ ] **Step 1: Write the failing unit tests**

`useMediaQuery.test.tsx` (jsdom, stub `window.matchMedia` with a controllable fake that fires `change`):

```ts
test('follows the media query and its change events', () => { /* renderHook → false; fake.set(true) in act → true */ });
test('is false when matchMedia is missing', () => { /* delete window.matchMedia → renderHook → false */ });
```

`ListView.test.tsx` (jsdom, real graph, `StoreProvider`):

```ts
test('lists every node exactly once under six layer headings', () => {
  render(<Wrap><ListView hidden={false} /></Wrap>);
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Foundations', 'Math', 'Core concepts', 'Algorithms', 'Problems', 'Tools']);
  const ids = [...document.querySelectorAll('.list-item')].map((e) => (e as HTMLElement).dataset.nodeId);
  expect(ids).toHaveLength(g.content.nodes.length);
  expect(new Set(ids).size).toBe(ids.length);
});
test('clicking an item selects it without expanding groups', async () => {
  await userEvent.click(document.querySelector('.list-item[data-node-id="ols"]')!);
  expect(store.getState().selection).toEqual({ kind: 'node', id: 'ols' });
  expect(store.getState().expandedGroups.size).toBe(0);
});
test('a lens marks its items and fades the rest', () => {
  act(() => store.getState().toggleLens('nlp'));
  expect(item('naive-bayes').dataset.highlighted).toBe('true');
  expect(item('slope').dataset.faded).toBe('true');
});
test('Start the tour starts tour 1', async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Start the tour' }));
  expect(store.getState().tour).toEqual({ id: 'how-a-model-learns', step: 0 });
});
```

- [ ] **Step 2: Write the failing e2e tests (`tests/e2e/small-screen.spec.ts`)**

`test.use({ viewport: { width: 375, height: 740 } })`. Add a helper `noSideScroll(page)` that asserts `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.

```ts
test('the list replaces the map', async ({ page }) => {
  await gotoMap(page);
  await expect(page.getByTestId('list-view')).toBeVisible();
  await expect(page.locator('svg.map')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Foundations', level: 2 })).toBeVisible();
  await noSideScroll(page);
});

test('tap opens the full panel; Back to list returns to the same item, focused', async ({ page }) => {
  await gotoMap(page);
  const item = page.locator('.list-item[data-node-id="random-forest"]');
  await item.scrollIntoViewIfNeeded();
  await item.click();
  await expect(page.getByTestId('panel')).toBeVisible();
  await expect(page.getByTestId('list-view')).toBeHidden();
  await page.getByRole('button', { name: 'Back to list' }).click();
  await expect(item).toBeFocused();
  await expect(item).toBeInViewport();
});

test('browser Back from a panel returns to the list', async ({ page }) => {
  await gotoMap(page);
  await page.locator('.list-item[data-node-id="slope"]').click();
  await page.goBack();
  await expect(page.getByTestId('list-view')).toBeVisible();
});

test('search opens a panel', async ({ page }) => {
  await gotoMap(page);
  await page.getByRole('combobox', { name: 'Search' }).fill('linear regression');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/n\/ols$/);
  await expect(page.getByTestId('panel')).toBeVisible();
});

test('a deep link shows the panel with its visualization and code, without side scroll', async ({ page }) => {
  await gotoMap(page, '#/n/gradient-descent');
  await expect(page.getByTestId('viz-takeaway')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back to list' })).toBeVisible();
  await noSideScroll(page);
  await gotoMap(page, '#/n/ols');
  await expect(page.getByTestId('code')).toBeVisible();
  await noSideScroll(page);
});

test('the gallery fits the phone width', async ({ page }) => {
  await gotoMap(page, '#/gallery');
  await expect(page.getByTestId('viz-takeaway')).toHaveCount(25);
  await noSideScroll(page);
});

test('the tour runs over the panel', async ({ page }) => {
  await gotoMap(page);
  await page.getByRole('button', { name: 'Start the tour' }).click();
  await expect(page.getByTestId('tour-card')).toBeVisible();
  await expect(page.getByTestId('panel')).toBeVisible();
  const first = page.url();
  await page.getByTestId('tour-card').getByRole('button', { name: 'Next' }).click();
  await expect(page).not.toHaveURL(first);
});

test('resizing across 768 px keeps the selection', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await gotoMap(page, '#/n/ols');
  await expect(page.locator('[data-node-id="ols"]')).toHaveAttribute('aria-pressed', 'true');
  await page.setViewportSize({ width: 375, height: 740 });
  await expect(page.getByRole('button', { name: 'Back to list' })).toBeVisible();
  await expect(page).toHaveURL(/#\/n\/ols$/);
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.locator('[data-node-id="ols"]')).toHaveAttribute('aria-pressed', 'true');
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/unit/app/useMediaQuery.test.tsx tests/unit/list && npx playwright test tests/e2e/small-screen.spec.ts`
Expected: FAIL (modules missing; map still renders at 375 px).

- [ ] **Step 4: Implement `useMediaQuery` and export `FIRST_TOUR`**

As in Interfaces. `export const FIRST_TOUR` in `Welcome.tsx`, used there unchanged.

- [ ] **Step 5: Implement `ListView` and `SmallScreen` in `src/list/` with `list.css`**

Content, copy and behavior exactly as in Shared decisions → List view. `ListView` root: `<section data-testid="list-view" aria-label="Topics" hidden={hidden}>`. `SmallScreen` tracks the last node selection in a ref, so `ListView` knows which item to scroll to and focus when it is shown again. Item tap targets are at least 44 px tall. `.list-view[hidden] { display: none; }` so a `display` rule never overrides `hidden`.

- [ ] **Step 6: Choose the layout in `App` and fix the CSS**

`App`: gallery → `<Gallery />`; small → `<SmallScreen />` with root class `app app-small`; else the current map column and panel. In `theme.css`, replace the old `max-width: 767px` block. Under it: single column, rows `auto minmax(0, 1fr)`; the top bar wraps, search goes full width on its own row, and lens chips scroll sideways (`overflow-x: auto`). Inside the small layout, `.panel-area` has no height cap and no left border. Panel, viz and code content are capped to the container width: `svg { max-width: 100% }`, `pre { overflow-x: auto }`.

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run tests/unit/app/useMediaQuery.test.tsx tests/unit/list && npx playwright test tests/e2e/small-screen.spec.ts`
Expected: PASS

- [ ] **Step 8: Run the full suite as CI does**

Run: `npm run ci && npm run e2e`
Expected: lint, typecheck, strict content check, all Vitest tests and the build pass; all Playwright specs pass, including the Phase 1–2 specs at the desktop viewport.

- [ ] **Step 9: Commit**

```bash
git add src/app/useMediaQuery.ts src/list src/app/App.tsx src/app/theme.css src/panel/Welcome.tsx tests/unit/app/useMediaQuery.test.tsx tests/unit/list tests/e2e/small-screen.spec.ts
git commit -m "feat(list): searchable list view with full panels under 768 px"
```
