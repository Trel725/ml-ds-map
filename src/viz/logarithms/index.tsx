import { scaleLinear, scaleLog } from 'd3-scale';
import { useMemo, useState } from 'react';
import { Axis } from '../Axis';
import { Slider } from '../controls/Slider';
import { Toggle } from '../controls/Toggle';
import { flatPrices } from '../datasets';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { histogram, powerOfTen } from './model';

const W = 360;
const H = 260;
const L = 40;
const R = W - 16;
const BINS = 12;

const short = (v: number) => (v >= 1e6 ? `${v / 1e6}M` : v >= 1e3 ? `${v / 1e3}k` : String(v));
const grouped = (v: number) => Math.round(v).toLocaleString('en-US');

/** Flat prices pushed through a power of ten, so the histogram has a long right tail. */
const skewedPrices = () => flatPrices().map((p) => 1000 * 10 ** (p.price / 100));

function Logarithms() {
  const [power, setPower] = useState(3); // slider position: x = 10^power
  const [logScale, setLogScale] = useState(false);
  const x = 10 ** power;

  const values = useMemo(skewedPrices, []);
  const bins = useMemo(() => histogram(values, BINS, logScale), [values, logScale]);

  const lin = scaleLinear().domain([0, 1e6]).range([L, R]);
  const log = scaleLog().domain([1, 1e6]).range([L, R]);
  const hx = scaleLinear()
    .domain([bins[0].x0, bins.at(-1)!.x1])
    .range([L, R]);
  const hy = scaleLinear()
    .domain([0, Math.max(...bins.map((b) => b.count))])
    .range([H - 30, 130]);

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Number line, log line and price histogram">
        <text x={L} y={14} className="viz-note">
          Plain line
        </text>
        <Axis scale={lin} orient="bottom" at={30} tickValues={[0, 250000, 500000, 750000, 1e6]} format={short} />
        <circle cx={lin(x)} cy={30} r={6} fill="var(--viz-prediction)" />
        <text x={L} y={68} className="viz-note">
          Log line: each step multiplies by ten
        </text>
        <Axis scale={log} orient="bottom" at={84} tickValues={[1, 10, 100, 1e3, 1e4, 1e5, 1e6]} format={short} />
        <circle cx={log(x)} cy={84} r={6} fill="var(--viz-prediction)" />

        <text x={L} y={124} className="viz-note">
          Flat prices {logScale ? '(log scale)' : '(plain scale)'}
        </text>
        {bins.map((b, i) => (
          <rect
            key={i}
            x={hx(b.x0) + 1}
            y={hy(b.count)}
            width={Math.max(0, hx(b.x1) - hx(b.x0) - 2)}
            height={hy(0) - hy(b.count)}
            fill="var(--viz-train)"
            className="viz-bar"
          />
        ))}
        <Axis
          scale={hx}
          orient="bottom"
          at={H - 30}
          ticks={4}
          format={(v) => (logScale ? short(10 ** v) : short(Math.round(v / 1e5) * 1e5))}
        />
      </svg>
      <div className="viz-controls">
        <Slider label="x" min={0} max={6} step={0.1} value={power} onChange={setPower} format={() => grouped(x)} />
        <Toggle label="Log scale" checked={logScale} onChange={setLogScale} />
      </div>
      <Readout>{`${grouped(x)} is 10 to the power ${powerOfTen(x).toFixed(1)} · log scale ${logScale ? 'on' : 'off'}`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'Logs turn multiplying into adding and tame huge numbers',
  altText: 'A number on a plain line and on a log line, and a skewed price histogram that becomes balanced on a log scale.',
  Component: Logarithms,
};
export default viz;
