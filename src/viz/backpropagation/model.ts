/** A fixed 2-2-1 network with sigmoid units, trained on one example with squared error. */
export interface Net {
  /** W1[j][i]: input i → hidden j. */
  W1: number[][];
  b1: number[];
  /** w2[j]: hidden j → output. */
  w2: number[];
  b2: number;
}
export type Grads = Net;

/** Where a value is drawn: an input, a unit, the loss, or an edge `from>to`. */
export type Target = 'x0' | 'x1' | 'h0' | 'h1' | 'out' | 'loss' | 'x0>h0' | 'x1>h0' | 'x0>h1' | 'x1>h1' | 'h0>out' | 'h1>out';
export interface Phase {
  name: string;
  direction: 'forward' | 'backward';
  values: { label: string; value: number; at: Target }[];
}

export const NET: Net = { W1: [[0.5, -0.4], [0.3, 0.8]], b1: [0.1, -0.2], w2: [0.7, -0.6], b2: 0.05 };
export const EXAMPLE = { x: [1, 0.5] as [number, number], y: 1 };

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export function forward(net: Net, x: [number, number]): { h: number[]; out: number } {
  const h = net.W1.map((w, j) => sigmoid(w[0] * x[0] + w[1] * x[1] + net.b1[j]));
  return { h, out: sigmoid(net.w2[0] * h[0] + net.w2[1] * h[1] + net.b2) };
}

/** Squared error, halved so its slope is simply (out − y). */
export function loss(net: Net, x: [number, number], y: number): number {
  return 0.5 * (forward(net, x).out - y) ** 2;
}

function backwardParts(net: Net, x: [number, number], y: number) {
  const { h, out } = forward(net, x);
  // Chain rule: dL/dz_out = (out − y) · σ'(z_out), with σ' = out · (1 − out).
  const dOut = (out - y) * out * (1 - out);
  const dHidden = h.map((hj, j) => dOut * net.w2[j] * hj * (1 - hj));
  const grads: Grads = {
    W1: dHidden.map((d) => [d * x[0], d * x[1]]),
    b1: dHidden,
    w2: h.map((hj) => dOut * hj),
    b2: dOut,
  };
  return { h, out, dOut, dHidden, grads };
}

export function backward(net: Net, x: [number, number], y: number): Grads {
  return backwardParts(net, x, y).grads;
}

/** The six phases of one forward and backward pass, as labelled values to draw. */
export function steps(net: Net, x: [number, number], y: number): Phase[] {
  const { h, out, dOut, dHidden, grads } = backwardParts(net, x, y);
  return [
    {
      name: 'forward: hidden units',
      direction: 'forward',
      values: [
        { label: 'h₁', value: h[0], at: 'h0' },
        { label: 'h₂', value: h[1], at: 'h1' },
      ],
    },
    { name: 'forward: output', direction: 'forward', values: [{ label: 'ŷ', value: out, at: 'out' }] },
    { name: 'loss', direction: 'forward', values: [{ label: 'loss', value: loss(net, x, y), at: 'loss' }] },
    { name: 'backward: output gradient', direction: 'backward', values: [{ label: 'δout', value: dOut, at: 'out' }] },
    {
      name: 'backward: hidden gradients',
      direction: 'backward',
      values: [
        { label: 'δ₁', value: dHidden[0], at: 'h0' },
        { label: 'δ₂', value: dHidden[1], at: 'h1' },
      ],
    },
    {
      name: 'backward: weight gradients',
      direction: 'backward',
      values: [
        { label: '', value: grads.W1[0][0], at: 'x0>h0' },
        { label: '', value: grads.W1[0][1], at: 'x1>h0' },
        { label: '', value: grads.W1[1][0], at: 'x0>h1' },
        { label: '', value: grads.W1[1][1], at: 'x1>h1' },
        { label: '', value: grads.w2[0], at: 'h0>out' },
        { label: '', value: grads.w2[1], at: 'h1>out' },
      ],
    },
  ];
}
