import type { Sample } from '../decision-tree/model';
import { standardize } from '../knn/model';
import { mulberry32, normal } from '../random';

type Features = Pick<Sample, 'links' | 'capsShare'>;

export const SEED = 11;
const EPS = 1e-9;

export interface Mlp {
  /** Chance of spam. */
  predict(p: Features): number;
  /** Mean log loss on the training points after training, and before. */
  loss: number;
  initialLoss: number;
  /** Each hidden unit's boundary a·links + b·capitals + c = 0, in the original feature units. */
  hiddenLines: { a: number; b: number; c: number }[];
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** One tanh hidden layer and a sigmoid output, trained by full-batch gradient descent on log loss. */
export function trainMLP(points: Sample[], hidden: number, seed: number, epochs = 1500, rate = 0.5): Mlp {
  const z = standardize(points);
  const X = points.map(z);
  const y = points.map((p) => p.label);
  const n = points.length;
  // Units are drawn one after another from the same seed, and every unit after the first starts with
  // zero output weight: a bigger network starts as exactly the smaller one, plus room to bend.
  const rand = mulberry32(seed);
  const W1: number[][] = [];
  const b1: number[] = [];
  const w2: number[] = [];
  for (let j = 0; j < hidden; j++) {
    W1.push([normal(rand, 0, 1), normal(rand, 0, 1)]);
    b1.push(normal(rand, 0, 0.5));
    const out = normal(rand, 0, 1);
    w2.push(j === 0 ? out : 0);
  }
  let b2 = 0;

  const forward = (v: [number, number]) => {
    const h = W1.map((w, j) => Math.tanh(w[0] * v[0] + w[1] * v[1] + b1[j]));
    return { h, out: sigmoid(h.reduce((a, hj, j) => a + w2[j] * hj, b2)) };
  };
  const lossNow = () =>
    X.reduce((a, v, i) => {
      const q = Math.min(1 - EPS, Math.max(EPS, forward(v).out));
      return a - (y[i] === 1 ? Math.log(q) : Math.log(1 - q));
    }, 0) / n;

  const initialLoss = lossNow();
  for (let e = 0; e < epochs; e++) {
    const gW1 = W1.map(() => [0, 0]);
    const gb1 = b1.map(() => 0);
    const gw2 = w2.map(() => 0);
    let gb2 = 0;
    X.forEach((v, i) => {
      const { h, out } = forward(v);
      const dOut = out - y[i]; // log loss through a sigmoid
      gb2 += dOut;
      for (let j = 0; j < hidden; j++) {
        gw2[j] += dOut * h[j];
        const dh = dOut * w2[j] * (1 - h[j] * h[j]);
        gW1[j][0] += dh * v[0];
        gW1[j][1] += dh * v[1];
        gb1[j] += dh;
      }
    });
    for (let j = 0; j < hidden; j++) {
      W1[j][0] -= (rate * gW1[j][0]) / n;
      W1[j][1] -= (rate * gW1[j][1]) / n;
      b1[j] -= (rate * gb1[j]) / n;
      w2[j] -= (rate * gw2[j]) / n;
    }
    b2 -= (rate * gb2) / n;
  }

  // Undo the standardization so each unit's line can be drawn on the raw axes.
  const origin = z({ links: 0, capsShare: 0 });
  const unitLinks = z({ links: 1, capsShare: 0 })[0] - origin[0];
  const unitCaps = z({ links: 0, capsShare: 1 })[1] - origin[1];
  return {
    predict: (p) => forward(z(p)).out,
    loss: lossNow(),
    initialLoss,
    hiddenLines: W1.map((w, j) => ({ a: w[0] * unitLinks, b: w[1] * unitCaps, c: w[0] * origin[0] + w[1] * origin[1] + b1[j] })),
  };
}
