import { expect, test } from 'vitest';
import { emails } from '../../../src/viz/datasets';
import { accuracy, growTree, predict } from '../../../src/viz/decision-tree/model';
import type { Feature } from '../../../src/viz/decision-tree/model';
import { forestVote, growForest } from '../../../src/viz/random-forest/model';

const train = emails().filter((e) => e.split === 'train');
const testSet = emails().filter((e) => e.split === 'test');
const forestAccuracy = (forest: ReturnType<typeof growForest>) =>
  testSet.filter((e) => (forestVote(forest, e) >= 0.5 ? 1 : 0) === e.label).length / testSet.length;

test('growTree still defaults to both features, and featuresAt limits the choice', () => {
  const both = growTree(train, 1);
  expect(both.leaf).toBe(false);
  const onlyCaps = growTree(train, 3, { featuresAt: (): Feature[] => ['capsShare'] });
  const used = new Set<string>();
  const walk = (t: typeof onlyCaps) => {
    if (t.leaf) return;
    used.add(t.feature);
    walk(t.left);
    walk(t.right);
  };
  walk(onlyCaps);
  expect([...used]).toEqual(['capsShare']);
});
test('the same seed grows the same forest', () => expect(growForest(train, 5, 3)).toEqual(growForest(train, 5, 3)));
test('one tree means one tree', () => expect(growForest(train, 1, 3)).toHaveLength(1));
test('the vote is a share between 0 and 1', () => {
  const forest = growForest(train, 25, 3);
  for (const e of emails()) {
    const v = forestVote(forest, e);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  }
});
test('25 trees do at least as well on test emails as one deep tree', () => {
  const single = accuracy(growTree(train, 6), testSet);
  expect(forestAccuracy(growForest(train, 25, 3))).toBeGreaterThanOrEqual(single);
  expect(predict(growTree(train, 6), testSet[0])).toBeDefined();
});
test('zero trees is rejected', () => expect(() => growForest(train, 0, 3)).toThrow());
