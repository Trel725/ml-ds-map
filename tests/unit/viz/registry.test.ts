import { expect, test } from 'vitest';
import { VIZ_IDS } from '../../../src/viz/ids';
import { registry } from '../../../src/viz/registry';

test('every visualization id has a registry entry, and nothing else does', () =>
  expect(Object.keys(registry).sort()).toEqual([...VIZ_IDS].sort()));
