// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import type { VizModule } from '../../../src/viz/types';
import { VizSection } from '../../../src/viz/VizSection';

afterEach(cleanup);

const ok: VizModule = { takeaway: 'T', altText: 'Alt', Component: () => <p>drawn</p> };
const boom: VizModule = {
  takeaway: 'T',
  altText: 'Alt text',
  Component: () => {
    throw new Error('x');
  },
};

test('renders takeaway then component', async () => {
  render(<VizSection vizId="logarithms" loaders={{ logarithms: async () => ({ default: ok }) }} />);
  expect(await screen.findByText('drawn')).toBeTruthy();
  const takeaway = screen.getByTestId('viz-takeaway');
  expect(takeaway.textContent).toBe('T');
  expect(takeaway.compareDocumentPosition(screen.getByText('drawn')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByTestId('viz').dataset.vizId).toBe('logarithms');
});

test('altText describes the figure', async () => {
  render(<VizSection vizId="logarithms" loaders={{ logarithms: async () => ({ default: ok }) }} />);
  await screen.findByText('drawn');
  const fig = screen.getByRole('figure');
  const described = document.getElementById(fig.getAttribute('aria-describedby')!);
  expect(described?.textContent).toBe('Alt');
});

test('shows Loading… while the chunk loads', () => {
  render(<VizSection vizId="logarithms" loaders={{ logarithms: () => new Promise(() => {}) }} />);
  expect(screen.getByText('Loading…')).toBeTruthy();
});

test('component error shows altText, nothing else breaks', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  render(
    <div>
      <p>sibling</p>
      <VizSection vizId="logarithms" loaders={{ logarithms: async () => ({ default: boom }) }} />
    </div>,
  );
  expect(await screen.findByText('Alt text', { selector: '.viz-fallback' })).toBeTruthy();
  expect(screen.getByText('sibling')).toBeTruthy();
  spy.mockRestore();
});

test('load failure shows Retry; retry succeeds', async () => {
  let calls = 0;
  const loader = async () => {
    if (calls++ === 0) throw new Error('chunk');
    return { default: ok };
  };
  render(<VizSection vizId="logarithms" loaders={{ logarithms: loader }} />);
  expect(await screen.findByText("This visualization didn't load.")).toBeTruthy();
  await userEvent.click(await screen.findByRole('button', { name: 'Retry' }));
  expect(await screen.findByText('drawn')).toBeTruthy();
});

test('switching vizId while loading never shows the old module', async () => {
  const slowOld = () =>
    new Promise<{ default: VizModule }>((res) =>
      setTimeout(() => res({ default: { takeaway: 'old takeaway', altText: 'a', Component: () => <p>old</p> } }), 50),
    );
  const fastNew = async () => ({ default: { takeaway: 'new takeaway', altText: 'a', Component: () => <p>new</p> } });
  const loaders = { logarithms: slowOld, 'ols-fit': fastNew };
  const { rerender } = render(<VizSection vizId="logarithms" loaders={loaders} />);
  rerender(<VizSection vizId="ols-fit" loaders={loaders} />);
  expect(await screen.findByText('new')).toBeTruthy();
  await new Promise((r) => setTimeout(r, 80));
  expect(screen.queryByText('old')).toBeNull();
});

test('missing registry entry renders nothing', () => {
  const { container } = render(<VizSection vizId="bayes-rule" loaders={{}} />);
  expect(container.innerHTML).toBe('');
});
