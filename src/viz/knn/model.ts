import type { Label, Sample } from '../decision-tree/model';

type Features = Pick<Sample, 'links' | 'capsShare'>;

/** z-scores of both features, using the training mean and spread. */
export function standardize(train: Features[]): (p: Features) => [number, number] {
  const stats = (['links', 'capsShare'] as const).map((f) => {
    const m = train.reduce((a, p) => a + p[f], 0) / train.length;
    const sd = Math.sqrt(train.reduce((a, p) => a + (p[f] - m) ** 2, 0) / train.length) || 1;
    return { m, sd };
  });
  return (p) => [(p.links - stats[0].m) / stats[0].sd, (p.capsShare - stats[1].m) / stats[1].sd];
}

/** Indices of the k nearest training points by Euclidean distance, on raw or standardized features. */
export function neighbors(train: Features[], query: Features, k: number, scaled: boolean): number[] {
  const f = scaled ? standardize(train) : (p: Features): [number, number] => [p.links, p.capsShare];
  const q = f(query);
  return train
    .map((p, i) => {
      const v = f(p);
      return { i, d: (v[0] - q[0]) ** 2 + (v[1] - q[1]) ** 2 };
    })
    .sort((a, b) => a.d - b.d || a.i - b.i)
    .slice(0, k)
    .map((n) => n.i);
}

/** Majority label of the chosen points; a tie goes to spam (1). */
export function vote(train: Pick<Sample, 'label'>[], idx: number[]): Label {
  const spam = idx.filter((i) => train[i].label === 1).length;
  return spam * 2 >= idx.length ? 1 : 0;
}
