// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { SMALL_SCREEN, useMediaQuery } from '../../../src/app/useMediaQuery';

const original = window.matchMedia;
afterEach(() => {
  window.matchMedia = original;
});

/** A matchMedia stand-in whose answer the test controls. */
function fakeMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  const mql = {
    get matches() {
      return matches;
    },
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  };
  window.matchMedia = (() => mql) as unknown as typeof window.matchMedia;
  return {
    set(v: boolean) {
      matches = v;
      for (const fn of listeners) fn();
    },
  };
}

test('follows the media query and its change events', () => {
  const fake = fakeMatchMedia(false);
  const { result } = renderHook(() => useMediaQuery(SMALL_SCREEN));
  expect(result.current).toBe(false);
  act(() => fake.set(true));
  expect(result.current).toBe(true);
});

test('is false when matchMedia is missing', () => {
  // @ts-expect-error simulating an environment without matchMedia
  delete window.matchMedia;
  const { result } = renderHook(() => useMediaQuery(SMALL_SCREEN));
  expect(result.current).toBe(false);
});

test('the small-screen query is under 768 px', () => expect(SMALL_SCREEN).toBe('(max-width: 767px)'));
