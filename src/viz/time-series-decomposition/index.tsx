import { extent } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { useMemo, useState } from 'react';
import { Axis } from '../Axis';
import { Slider } from '../controls/Slider';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { decompose, makeSeries, seasonalSwing } from './model';

const W = 360;
const N = 48;
const PANEL = 58;
const GAP = 12;

const x = scaleLinear().domain([0, N - 1]).range([44, W - 10]);

interface Layer {
  name: string;
  values: (number | null)[];
  color: string;
  dash?: string;
}

function Panel({ layer, top }: { layer: Layer; top: number }) {
  const defined = layer.values.filter((v): v is number => v !== null);
  const [lo, hi] = extent(defined) as [number, number];
  const pad = Math.max(1, (hi - lo) * 0.1);
  const y = scaleLinear().domain([lo - pad, hi + pad]).range([top + PANEL, top]);
  const d = line<number | null>()
    .defined((v) => v !== null)
    .x((_, t) => x(t))
    .y((v) => y(v!))(layer.values)!;
  return (
    <g>
      <rect x={44} y={top} width={W - 54} height={PANEL} fill="none" stroke="var(--viz-grid)" />
      <text x={48} y={top + 12} className="viz-note">
        {layer.name}
      </text>
      <path d={d} fill="none" stroke={layer.color} strokeWidth={2} strokeDasharray={layer.dash} />
      <Axis scale={y} orient="left" at={44} ticks={2} />
    </g>
  );
}

function TimeSeriesDecomposition() {
  const [trend, setTrend] = useState(0.5);
  const [season, setSeason] = useState(10);
  const { series, parts } = useMemo(() => {
    const series = makeSeries(trend, season, N);
    return { series, parts: decompose(series) };
  }, [trend, season]);
  const layers: Layer[] = [
    { name: 'the series', values: series, color: 'var(--viz-train)' },
    { name: 'trend', values: parts.trend, color: 'var(--viz-prediction)' },
    { name: 'seasonal', values: parts.seasonal, color: 'var(--viz-test)', dash: '5 3' },
    { name: 'what is left', values: parts.residual, color: 'var(--viz-error)', dash: '2 3' },
  ];
  const H = layers.length * (PANEL + GAP) + 26;

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="A monthly series split into stacked panels: trend, seasonal pattern and what is left">
        {layers.map((l, i) => (
          <Panel key={l.name} layer={l} top={4 + i * (PANEL + GAP)} />
        ))}
        <Axis scale={x} orient="bottom" at={H - 26} tickValues={[0, 12, 24, 36, 47]} label="month" />
      </svg>
      <div className="viz-controls">
        <Slider label="Trend" min={-2} max={2} step={0.1} value={trend} onChange={setTrend} format={(v) => `${v.toFixed(1)}/month`} />
        <Slider label="Season" min={0} max={20} step={1} value={season} onChange={setSeason} />
      </div>
      <Readout>{`Trend ${trend.toFixed(1)} per month · seasonal swing ±${Math.round(seasonalSwing(parts.seasonal))}`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'A series is layers you can pull apart',
  altText:
    'Four years of monthly values are split into a smooth trend, a pattern that repeats every year, and leftover noise, each in its own panel.',
  Component: TimeSeriesDecomposition,
};
export default viz;
