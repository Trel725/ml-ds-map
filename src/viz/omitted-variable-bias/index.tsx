import { scaleLinear } from 'd3-scale';
import { useMemo, useState } from 'react';
import { Axis } from '../Axis';
import { Toggle } from '../controls/Toggle';
import { fitOLS } from '../ols-fit/model';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { fitSimple, fitWithControl, ovbFlats } from './model';

const W = 360;
const H = 260;

const x = scaleLinear().domain([25, 155]).range([44, W - 10]);
const y = scaleLinear().domain([140, 380]).range([H - 50, 10]);

/** Three distance bands, each with its own color and shape. */
const BANDS = [
  { max: 6, name: 'near', fill: 'var(--viz-prediction)' },
  { max: 11, name: 'middle', fill: 'var(--viz-train)' },
  { max: Infinity, name: 'far', fill: 'var(--viz-test)' },
];
const bandOf = (d: number) => BANDS.findIndex((b) => d < b.max);

function Mark({ band, cx, cy }: { band: number; cx: number; cy: number }) {
  const fill = BANDS[band].fill;
  if (band === 0) return <circle cx={cx} cy={cy} r={3.5} fill={fill} />;
  if (band === 1) return <rect x={cx - 3.5} y={cy - 3.5} width={7} height={7} fill={fill} />;
  return <path d={`M ${cx} ${cy - 4.5} L ${cx + 4.5} ${cy + 3.5} L ${cx - 4.5} ${cy + 3.5} Z`} fill={fill} />;
}

function OmittedVariableBias() {
  const [control, setControl] = useState(false);
  const { flats, simple, line, multi, meanDistance } = useMemo(() => {
    const flats = ovbFlats();
    return {
      flats,
      simple: fitSimple(flats),
      line: fitOLS(flats.map((f) => ({ x: f.size, y: f.price }))),
      multi: fitWithControl(flats),
      meanDistance: flats.reduce((a, f) => a + f.distance, 0) / flats.length,
    };
  }, []);
  const coef = control ? multi.size : simple;
  // With distance held at its average, the size effect is a line of slope multi.size.
  const at = (s: number) => (control ? multi.intercept + multi.size * s + multi.distance * meanDistance : line.intercept + line.slope * s);

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Flat prices against size, with the fitted effect of size with and without distance to the centre">
        <Axis scale={x} orient="bottom" at={H - 50} ticks={4} label="size (m²)" />
        <Axis scale={y} orient="left" at={44} ticks={4} label="price (k)" />
        {flats.map((f, i) =>
          control ? (
            <Mark key={i} band={bandOf(f.distance)} cx={x(f.size)} cy={y(f.price)} />
          ) : (
            <circle key={i} cx={x(f.size)} cy={y(f.price)} r={3.5} fill="var(--viz-axis)" fillOpacity={0.7} />
          ),
        )}
        <line x1={x(30)} x2={x(150)} y1={y(at(30))} y2={y(at(150))} stroke="var(--viz-error)" strokeWidth={2.5} />
        <text x={x(150)} y={y(at(150)) - 6} textAnchor="end" className="viz-label" fill="var(--viz-error)">
          {control ? 'size effect, same distance' : 'size effect'}
        </text>
        {control && (
          <g transform={`translate(44, ${H - 12})`} className="viz-note">
            {BANDS.map((b, k) => (
              <g key={b.name} transform={`translate(${k * 100}, 0)`}>
                <Mark band={k} cx={4} cy={-4} />
                <text x={12}>{`${b.name}${k === 0 ? ' (< 6 km)' : k === 1 ? ' (6–11 km)' : ' (11+ km)'}`}</text>
              </g>
            ))}
          </g>
        )}
      </svg>
      <div className="viz-controls">
        <Toggle label="Include distance to centre" checked={control} onChange={setControl} />
      </div>
      <Readout>{`Size coefficient ${coef.toFixed(2)} (${control ? 'with' : 'without'} distance)`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'Leaving out a cause can flip a coefficient',
  altText:
    'Bigger flats sit farther from the centre, so on its own size seems to lower the price; once distance is included, each extra square meter raises it.',
  Component: OmittedVariableBias,
};
export default viz;
