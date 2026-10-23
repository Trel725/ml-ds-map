import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { useId, useState } from 'react';
import { Axis } from '../Axis';
import { Slider } from '../controls/Slider';
import { StepButton } from '../controls/StepButton';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { useReducedMotion } from '../useReducedMotion';
import { L1, gdPath1D, gdPath2D, grad1, grad2 } from './model';
import type { Vec2 } from './model';

const W = 360;
const H = 200;
const X0 = 3;
const P0: Vec2 = [2.5, 1.5];
const EXPLODING = 100;
const LEVELS = [0.5, 2, 4.5, 8, 12.5];

// Left: the 1D loss curve.
const cx = scaleLinear().domain([-4, 4]).range([28, 172]);
const cy = scaleLinear().domain([0, 16]).range([H - 26, 14]);
const curve = line<number>()
  .x((t) => cx(t))
  .y((t) => cy(L1(t)))(Array.from({ length: 81 }, (_, i) => -4 + i * 0.1))!;

// Right: the 2D contour map, equal scale on both axes.
const px = scaleLinear().domain([-3, 3]).range([196, 352]);
const py = scaleLinear().domain([-2, 2]).range([H - 48, 48]);
const pathLine = line<Vec2>()
  .x((p) => px(p[0]))
  .y((p) => py(p[1]));

const clampTo = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function GradientDescent() {
  const [lr, setLr] = useState(0.1);
  const [steps, setSteps] = useState(0);
  const reduced = useReducedMotion();
  const clip = useId();

  const x = gdPath1D(grad1, X0, lr, steps).at(-1)!;
  const path2 = gdPath2D(grad2, P0, lr, steps);
  const ballX = clampTo(x, -4, 4);
  const ballY = Math.min(L1(ballX), 16);
  const exploding = Math.abs(x) > EXPLODING;
  const motion = reduced ? 'none' : 'transform var(--motion) ease';

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="A ball stepping down a loss curve, and the same steps on a contour map">
        <defs>
          <clipPath id={clip}>
            <rect x={px(-3)} y={py(2)} width={px(3) - px(-3)} height={py(-2) - py(2)} />
          </clipPath>
        </defs>
        <text x={28} y={10} className="viz-note">
          Loss for one setting
        </text>
        <Axis scale={cx} orient="bottom" at={cy(0)} tickValues={[-4, -2, 0, 2, 4]} />
        <path d={curve} fill="none" stroke="var(--viz-train)" strokeWidth={2} />
        <circle
          r={7}
          fill="var(--viz-prediction)"
          style={{ transform: `translate(${cx(ballX)}px, ${cy(ballY) - 7}px)`, transition: motion }}
        />

        <text x={196} y={10} className="viz-note">
          Two settings: a contour map
        </text>
        {LEVELS.map((c) => (
          <ellipse
            key={c}
            cx={px(0)}
            cy={py(0)}
            rx={px(Math.sqrt(c)) - px(0)}
            ry={py(0) - py(Math.sqrt(c) / 2)}
            fill="none"
            stroke="var(--viz-grid)"
            strokeWidth={1.5}
          />
        ))}
        <circle cx={px(0)} cy={py(0)} r={3} fill="var(--viz-axis)" />
        <g clipPath={`url(#${clip})`}>
          <path d={pathLine(path2)!} fill="none" stroke="var(--viz-prediction)" strokeWidth={1.5} />
          {path2.map((p, i) => (
            <circle key={i} cx={px(p[0])} cy={py(p[1])} r={i === path2.length - 1 ? 5 : 2.5} fill="var(--viz-prediction)" />
          ))}
        </g>
      </svg>
      <div className="viz-controls">
        <Slider
          label="Learning rate"
          min={0.01}
          max={1.2}
          step={0.01}
          value={lr}
          format={(v) => v.toFixed(2)}
          onChange={(v) => {
            setLr(v);
            setSteps(0);
          }}
        />
        <StepButton label="Step" onStep={() => setSteps((n) => n + 1)} />
      </div>
      <Readout>{`Step ${steps} · learning rate ${lr.toFixed(2)} · loss ${L1(x).toFixed(2)}${exploding ? ' · exploding' : ''}`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'Too small is slow, too big overshoots or explodes',
  altText:
    'A ball takes gradient descent steps down a curve and across a contour map; small learning rates crawl, large ones bounce and blow up.',
  Component: GradientDescent,
};
export default viz;
