import { emails } from '../datasets';
import { shuffledIndices } from '../random';

type Label = 0 | 1;

/** Links per email, and whether each is spam, for all 80 emails. */
export function linksByLabel(): { values: number[]; labels: Label[] } {
  const all = emails();
  return { values: all.map((e) => e.links), labels: all.map((e) => e.label) };
}

/** Mean of the spam group minus the mean of the other group (0 when a group is empty). */
export function diffInMeans(values: number[], labels: Label[]): number {
  let s1 = 0;
  let n1 = 0;
  let s0 = 0;
  let n0 = 0;
  values.forEach((v, i) => {
    if (labels[i] === 1) {
      s1 += v;
      n1++;
    } else {
      s0 += v;
      n0++;
    }
  });
  return n1 === 0 || n0 === 0 ? 0 : s1 / n1 - s0 / n0;
}

/** The gap after shuffling the labels, `n` times: what chance alone produces. */
export function shuffledDiffs(values: number[], labels: Label[], n: number, rand: () => number): number[] {
  return Array.from({ length: n }, () => {
    const order = shuffledIndices(rand, labels.length);
    return diffInMeans(
      values,
      order.map((i) => labels[i]),
    );
  });
}

/** Two-sided: the share of shuffled gaps at least as far from zero as the observed one. 1 with no shuffles. */
export function pValue(observed: number, nullDiffs: number[]): number {
  if (nullDiffs.length === 0) return 1;
  return nullDiffs.filter((d) => Math.abs(d) >= Math.abs(observed) - 1e-12).length / nullDiffs.length;
}
