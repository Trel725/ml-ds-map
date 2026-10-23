// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MathSection } from '../../../src/panel/sections/MathSection';

afterEach(cleanup);

const formula = {
  tex: 'y = \\beta_0 + \\beta_1 x',
  symbols: [
    { symbol: '\\beta_1', meaning: 'How much y moves per unit of x.' },
    { symbol: '\\bad', meaning: 'A symbol KaTeX cannot parse.' },
  ],
};
const fakeRender = (t: string) => `<span class="katex">${t}</span>`;

function open() {
  const details = screen.getByTestId('math') as HTMLDetailsElement;
  details.open = true;
  fireEvent(details, new Event('toggle'));
  return details;
}

test('collapsed by default and does not load until opened', () => {
  const load = vi.fn(async () => ({ renderTex: fakeRender }));
  render(<MathSection formula={formula} load={load} />);
  const details = screen.getByTestId('math') as HTMLDetailsElement;
  expect(details.open).toBe(false);
  expect(screen.getByText('The math, one level deeper')).toBeTruthy();
  expect(load).not.toHaveBeenCalled();
});

test('opening renders KaTeX output', async () => {
  const load = vi.fn(async () => ({ renderTex: fakeRender }));
  render(<MathSection formula={formula} load={load} />);
  const details = open();
  expect(await screen.findByText('y = \\beta_0 + \\beta_1 x')).toBeTruthy();
  expect(details.querySelector('.katex')).not.toBeNull();
  expect(load).toHaveBeenCalledTimes(1);
  expect(screen.getByText('How much y moves per unit of x.')).toBeTruthy();
});

test('shows Loading… while the renderer loads', () => {
  render(<MathSection formula={formula} load={() => new Promise(() => {})} />);
  open();
  expect(screen.getByText('Loading…')).toBeTruthy();
});

test('loader rejection shows raw tex and the meanings', async () => {
  render(<MathSection formula={formula} load={() => Promise.reject(new Error('chunk failed'))} />);
  open();
  const raw = await screen.findAllByTestId('math-raw');
  expect(raw.map((r) => r.textContent)).toContain('y = \\beta_0 + \\beta_1 x');
  expect(raw.map((r) => r.textContent)).toContain('\\beta_1');
  expect(screen.getByText('How much y moves per unit of x.')).toBeTruthy();
  expect(screen.queryByText('Loading…')).toBeNull();
});

test('a piece that throws falls back alone', async () => {
  const renderTex = (t: string) => {
    if (t === '\\bad') throw new Error('parse error');
    return fakeRender(t);
  };
  render(<MathSection formula={formula} load={async () => ({ renderTex })} />);
  const details = open();
  const raw = await screen.findAllByTestId('math-raw');
  expect(raw.map((r) => r.textContent)).toEqual(['\\bad']);
  expect(details.querySelectorAll('.katex').length).toBe(2); // the formula and the other symbol
  expect(screen.getByText('A symbol KaTeX cannot parse.')).toBeTruthy();
});
