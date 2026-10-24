// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, expect, test } from 'vitest';
import { createAppStore } from '../../../src/app/store';
import type { AppStore } from '../../../src/app/store';
import { StoreProvider } from '../../../src/app/StoreContext';
import { Gallery } from '../../../src/gallery/Gallery';
import type { Graph } from '../../../src/graph/graph';
import { VIZ_IDS } from '../../../src/viz/ids';
import type { VizLoaders } from '../../../src/viz/registry';
import { realGraph } from '../helpers/real';

let g: Graph;
let store: AppStore;
beforeAll(async () => {
  g = await realGraph();
});
afterEach(cleanup);

const fake: VizLoaders = Object.fromEntries(
  VIZ_IDS.map((id) => [id, async () => ({ default: { takeaway: id, altText: 'alt', Component: () => <p>drawn {id}</p> } })]),
);

const card = (vizId: string) => screen.getAllByTestId('gallery-card').find((c) => c.dataset.vizId === vizId)!;

beforeEach(() => {
  store = createAppStore(g, null);
  render(
    <StoreProvider store={store} graph={g}>
      <Gallery loaders={fake} />
    </StoreProvider>,
  );
});

test('one card per registry id, in VIZ_IDS order', async () => {
  const cards = screen.getAllByTestId('gallery-card');
  expect(cards.map((c) => c.dataset.vizId)).toEqual([...VIZ_IDS]);
  expect(await screen.findAllByTestId('viz-takeaway')).toHaveLength(25);
});
test('every card names its topics as chips; sampling-distribution has two', () => {
  for (const c of screen.getAllByTestId('gallery-card')) expect(within(c).getAllByTestId('gallery-topic').length).toBeGreaterThan(0);
  expect(within(card('sampling-distribution')).getAllByTestId('gallery-topic')).toHaveLength(2);
});
test('the card title is the first topic by layer, then label', () => {
  expect(within(card('gradient-descent')).getByRole('heading', { level: 3 }).textContent).toBe(g.nodesById.get('gradient-descent')!.label);
});
test('a topic chip selects the node and returns to the map', async () => {
  store.getState().openGallery();
  await userEvent.click(within(card('gradient-descent')).getAllByTestId('gallery-topic')[0]);
  expect(store.getState().view).toBe('map');
  expect(store.getState().selection).toEqual({ kind: 'node', id: 'gradient-descent' });
});
test('Back to map closes the gallery', async () => {
  store.getState().openGallery();
  await userEvent.click(screen.getByRole('button', { name: 'Back to map' }));
  expect(store.getState().view).toBe('map');
});
test('the page is a main landmark named Visualizations', () => {
  expect(screen.getByRole('main', { name: 'Visualizations' })).toBeTruthy();
});
