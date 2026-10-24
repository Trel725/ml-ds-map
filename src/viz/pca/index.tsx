import { scaleLinear } from 'd3-scale';
import { useId, useMemo, useState } from 'react';
import { Axis } from '../Axis';
import { Slider } from '../controls/Slider';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { bestAngle, center, pcaPoints, projectionSpread, totalSpread } from './model';

const W = 360;
const H = 300;
const R = 4;

// Equal scales on both axes, so angles on screen are true angles.
const x = scaleLinear().domain([-2.6, 3.4]).range([44, 344]);
const y = scaleLinear().domain([-2.6, 3.4]).range([H - 30, H - 330]);

function Pca() {
  const [angle, setAngle] = useState(0);
  const clip = useId();
  const { pts, mid, best, total } = useMemo(() => {
    const pts = pcaPoints();
    return { pts, mid: center(pts), best: bestAngle(pts), total: totalSpread(pts) };
  }, []);
  const t = (angle * Math.PI) / 180;
  const u = [Math.cos(t), Math.sin(t)];
  const keep = projectionSpread(pts, angle) / total;
  const bestKeep = projectionSpread(pts, best) / total;
  const foot = (p: [number, number]) => {
    const d = (p[0] - mid[0]) * u[0] + (p[1] - mid[1]) * u[1];
    return [mid[0] + d * u[0], mid[1] + d * u[1]];
  };

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Emails projected onto a line through their center at a chosen angle">
        <defs>
          <clipPath id={clip}>
            <rect x={44} y={0} width={300} height={H - 30} />
          </clipPath>
        </defs>
        <Axis scale={x} orient="bottom" at={H - 30} ticks={5} label="links (standardized)" />
        <Axis scale={y} orient="left" at={44} ticks={5} label="capitals (std.)" />
        <g clipPath={`url(#${clip})`}>
          {pts.map((p, i) => {
            const f = foot(p);
            return <line key={`t${i}`} x1={x(p[0])} y1={y(p[1])} x2={x(f[0])} y2={y(f[1])} stroke="var(--viz-error)" strokeOpacity={0.5} />;
          })}
          <line
            x1={x(mid[0] - R * u[0])}
            y1={y(mid[1] - R * u[1])}
            x2={x(mid[0] + R * u[0])}
            y2={y(mid[1] + R * u[1])}
            stroke="var(--viz-prediction)"
            strokeWidth={2.5}
          />
          {pts.map((p, i) => {
            const f = foot(p);
            return <circle key={`f${i}`} cx={x(f[0])} cy={y(f[1])} r={2} fill="var(--viz-prediction)" />;
          })}
          {pts.map((p, i) => (
            <circle key={i} cx={x(p[0])} cy={y(p[1])} r={3} fill="var(--viz-train)" />
          ))}
        </g>
      </svg>
      <div className="viz-controls">
        <Slider label="Angle" min={0} max={180} step={1} value={angle} onChange={setAngle} format={(a) => `${a}°`} />
      </div>
      <Readout>{`Angle ${angle}° · keeps ${Math.round(keep * 100)}% of the spread · best is ${Math.round(bestKeep * 100)}% at ${Math.round(best)}°`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'The best line keeps the most spread',
  altText:
    'Emails are projected onto a line through their center; turning the line changes how spread out the shadows are, and one angle keeps the most.',
  Component: Pca,
};
export default viz;
