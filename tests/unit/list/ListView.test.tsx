// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeAll, beforeEach, expect, test } from 'vitest';
import { createAppStore } from '../../../src/app/store';
import type { AppStore } from '../../../src/app/store';
import { StoreProvider } from '../../../src/app/StoreContext';
import type { Graph } from '../../../src/graph/graph';
import { ListView } from '../../../src/list/ListView';
import { realGraph } from '../helpers/real';

let g: Graph;
let store: AppStore;
beforeAll(async () => {
  g = await realGraph();
});
beforeEach(() => {
  store = createAppStore(g, null);
});
afterEach(cleanup);

const Wrap = ({ children }: { children: ReactNode }) => (
  <StoreProvider store={store} graph={g}>
    {children}
  </StoreProvider>
);
const item = (id: string) => document.querySelector<HTMLElement>(`.list-item[data-node-id="${id}"]`)!;

test('lists every node exactly once under six layer headings', () => {
  render(<Wrap><ListView hidden={false} /></Wrap>);
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Foundations', 'Math', 'Core concepts', 'Algorithms', 'Problems', 'Tools']);
  const ids = [...document.querySelectorAll('.list-item')].map((e) => (e as HTMLElement).dataset.nodeId);
  expect(ids).toHaveLength(g.content.nodes.length);
  expect(new Set(ids).size).toBe(ids.length);
});
test('clicking an item selects it without expanding groups', async () => {
  render(<Wrap><ListView hidden={false} /></Wrap>);
  await userEvent.click(item('ols'));
  expect(store.getState().selection).toEqual({ kind: 'node', id: 'ols' });
  expect(store.getState().expandedGroups.size).toBe(0);
});
test('a lens marks its items and fades the rest', () => {
  render(<Wrap><ListView hidden={false} /></Wrap>);
  act(() => store.getState().toggleLens('nlp'));
  expect(item('naive-bayes').dataset.highlighted).toBe('true');
  expect(item('slope').dataset.faded).toBe('true');
});
test('Start the tour starts tour 1', async () => {
  render(<Wrap><ListView hidden={false} /></Wrap>);
  await userEvent.click(screen.getByRole('button', { name: 'Start the tour' }));
  expect(store.getState().tour).toEqual({ id: 'how-a-model-learns', step: 0 });
});
test('items with a visualization carry the badge', () => {
  render(<Wrap><ListView hidden={false} /></Wrap>);
  expect(item('gradient-descent').querySelector('[aria-hidden="true"]')?.textContent).toBe('●');
});
test('shown again, the list focuses the last node that was open', () => {
  const { rerender } = render(<Wrap><ListView hidden={false} /></Wrap>);
  act(() => store.getState().select({ kind: 'node', id: 'random-forest' }));
  rerender(<Wrap><ListView hidden /></Wrap>);
  act(() => store.getState().clearSelection());
  rerender(<Wrap><ListView hidden={false} /></Wrap>);
  expect(document.activeElement).toBe(item('random-forest'));
});
