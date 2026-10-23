import { scaleLinear } from 'd3-scale';
import { useState } from 'react';
import { Axis } from '../Axis';
import { useDrag } from '../controls/useDrag';
import { flatPrices } from '../datasets';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { fitOLS, totalSquareArea } from './model';
import type { Line, Pt } from './model';

const W = 360;
const H = 270;
const SIDE = 220; // the plot is square: one pixel means the same share of each axis
const LEFT = 60;
const TOP = 12;
const X_DOMAIN: [number, number] = [20, 160];
const Y_DOMAIN: [number, number] = [50, 420];
const N_POINTS = 8;

const x = scaleLinear().domain(X_DOMAIN).range([LEFT, LEFT + SIDE]);
const y = scaleLinear().domain(Y_DOMAIN).range([TOP + SIDE, TOP]);
const clampTo = (v: number, [lo, hi]: [number, number]) => Math.min(hi, Math.max(lo, v));

const initialPoints = (): Pt[] =>
  flatPrices()
    .filter((p) => p.split === 'train')
    .slice(0, N_POINTS)
    .map((p) => ({ x: p.size, y: p.price }));

function Handle({ p, i, onMove }: { p: Pt; i: number; onMove(i: number, dx: number, dy: number): void }) {
  const drag = useDrag({
    onDrag: (dx, dy) => onMove(i, dx, dy),
    step: 2,
    pxToData: (dxPx, dyPx) => [x.invert(LEFT + dxPx) - X_DOMAIN[0], -(y.invert(TOP + SIDE + dyPx) - Y_DOMAIN[0])],
    label: `Flat ${i + 1}`,
    valueText: `${Math.round(p.x)} square meters, price ${Math.round(p.y)} thousand`,
  });
  return <circle cx={x(p.x)} cy={y(p.y)} r={6} fill="var(--viz-train)" stroke="var(--surface)" strokeWidth={1.5} {...drag} />;
}

function Square({ p, line }: { p: Pt; line: Line }) {
  const fit = line.intercept + line.slope * p.x;
  const side = Math.abs(y(p.y) - y(fit));
  const right = x(p.x) + side <= LEFT + SIDE + 40;
  return (
    <rect
      x={right ? x(p.x) : x(p.x) - side}
      y={Math.min(y(p.y), y(fit))}
      width={side}
      height={side}
      fill="var(--viz-error)"
      fillOpacity={0.16}
      stroke="var(--viz-error)"
      strokeWidth={1}
    />
  );
}

function OlsFit() {
  const [points, setPoints] = useState(initialPoints);
  const line = fitOLS(points);
  const area = totalSquareArea(points, line);
  const move = (i: number, dx: number, dy: number) =>
    setPoints((ps) => ps.map((p, j) => (j === i ? { x: clampTo(p.x + dx, X_DOMAIN), y: clampTo(p.y + dy, Y_DOMAIN) } : p)));

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Flats with a fitted line and a square drawn on each miss">
        <Axis scale={x} orient="bottom" at={TOP + SIDE} ticks={4} label="size (m²)" />
        <Axis scale={y} orient="left" at={LEFT} ticks={4} label="price (k)" />
        {points.map((p, i) => (
          <Square key={i} p={p} line={line} />
        ))}
        <line
          x1={x(X_DOMAIN[0])}
          y1={y(line.intercept + line.slope * X_DOMAIN[0])}
          x2={x(X_DOMAIN[1])}
          y2={y(line.intercept + line.slope * X_DOMAIN[1])}
          stroke="var(--viz-prediction)"
          strokeWidth={2.5}
        />
        {points.map((p, i) => (
          <Handle key={i} p={p} i={i} onMove={move} />
        ))}
      </svg>
      <p className="viz-hint">Drag a point, or focus it and use the arrow keys. The line always takes the smallest total area.</p>
      <Readout>{`Total square area ${Math.round(area)}`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: '"Least squares" is the line with the smallest total square area',
  altText: 'Each flat\'s miss from the fitted line is drawn as a square; moving points moves the line to keep the squares\' total area as small as possible.',
  Component: OlsFit,
};
export default viz;
