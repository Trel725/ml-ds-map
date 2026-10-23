import { useState } from 'react';
import { Slider } from '../controls/Slider';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { bayesCounts, posterior } from './model';

const COLS = 40;
const ROWS = 25;
const GAP = 8.6;
const W = COLS * GAP + 4;
const GRID_H = ROWS * GAP + 4;
const H = GRID_H + 46;
const MIN_POWER = -3; // 0.1%
const MAX_POWER = Math.log10(0.5); // 50%

type Kind = 'tp' | 'fn' | 'fp' | 'tn';

function BayesRule() {
  const [power, setPower] = useState(-2); // base rate = 10^power, 1% to start
  const base = 10 ** power;
  const c = bayesCounts(base);
  const kinds: Kind[] = [
    ...Array<Kind>(c.tp).fill('tp'),
    ...Array<Kind>(c.fn).fill('fn'),
    ...Array<Kind>(c.fp).fill('fp'),
    ...Array<Kind>(c.tn).fill('tn'),
  ];
  const pct = (v: number, dp: number) => (v * 100).toFixed(dp);

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="1000 people as dots, grouped by condition and test result">
        {kinds.map((k, i) => {
          const sick = k === 'tp' || k === 'fn';
          const positive = k === 'tp' || k === 'fp';
          return (
            <circle
              key={i}
              cx={2 + (i % COLS) * GAP + GAP / 2}
              cy={2 + Math.floor(i / COLS) * GAP + GAP / 2}
              r={positive ? 3.2 : 2.8}
              fill={sick ? 'var(--viz-error)' : 'var(--viz-grid)'}
              stroke={positive ? 'var(--viz-prediction)' : 'none'}
              strokeWidth={1.6}
            />
          );
        })}
        <g transform={`translate(4, ${GRID_H + 16})`} className="viz-note">
          <circle cx={4} cy={-4} r={3.2} fill="var(--viz-error)" />
          <text x={12}>has the condition</text>
          <circle cx={134} cy={-4} r={3.2} fill="var(--viz-grid)" stroke="var(--viz-prediction)" strokeWidth={1.6} />
          <text x={142}>outlined: tested positive</text>
        </g>
        <text x={4} y={GRID_H + 38} className="viz-note">
          {`${c.tp + c.fp} positive tests: ${c.tp} have the condition, ${c.fp} do not`}
        </text>
      </svg>
      <div className="viz-controls">
        <Slider
          label="Base rate"
          min={MIN_POWER}
          max={MAX_POWER}
          step={0.01}
          value={power}
          onChange={setPower}
          format={(v) => `${pct(10 ** v, 1)}%`}
        />
      </div>
      <Readout>
        {`Base rate ${pct(base, 1)}% · ${c.tp} true positives, ${c.fp} false positives · chance of the condition after a positive test ${pct(posterior(base), 0)}%`}
      </Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'A positive test can still mean "probably not"',
  altText:
    'Out of 1000 people, a rare condition gives far more false positives than true ones, so a positive test usually means probably not; as the condition gets common this flips.',
  Component: BayesRule,
};
export default viz;
