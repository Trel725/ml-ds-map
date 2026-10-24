import { scaleLinear } from 'd3-scale';
import { useMemo, useState } from 'react';
import { Axis } from '../Axis';
import { StepButton } from '../controls/StepButton';
import { flatPrices } from '../datasets';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { fitWithout, foldErrors, foldOf } from './model';

const W = 360;
const H = 270;
const K = 5;
const SEED = 1;
const STRIP_Y = 18;

const x = scaleLinear().domain([25, 155]).range([44, W - 10]);
const y = scaleLinear().domain([50, 420]).range([H - 30, 64]);

function CrossValidation() {
  const [fold, setFold] = useState(0);
  const { points, folds, errors } = useMemo(() => {
    const points = flatPrices().map((p) => ({ x: p.size, y: p.price }));
    return { points, folds: foldOf(points.length, K, SEED), errors: foldErrors(points, K, SEED) };
  }, []);
  const line = fitWithout(points, folds, fold);
  const soFar = errors.slice(0, fold + 1);
  const average = soFar.reduce((a, b) => a + b, 0) / soFar.length;
  const cell = (W - 54) / points.length;
  const at = (v: number) => y(line.intercept + line.slope * v);

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Forty flats split into five folds; one fold is held out as test data">
        <text x={44} y={10} className="viz-note">
          each cell is one flat, numbered by its fold
        </text>
        {points.map((_, i) => {
          const test = folds[i] === fold;
          return (
            <g key={i} transform={`translate(${44 + i * cell}, ${STRIP_Y})`}>
              <rect
                x={0.5}
                y={0}
                width={cell - 1}
                height={18}
                fill={test ? 'var(--viz-test)' : 'var(--viz-train)'}
                fillOpacity={test ? 0.9 : 0.25}
                stroke={test ? 'var(--viz-test)' : 'none'}
              />
              <text x={cell / 2} y={13} textAnchor="middle" fontSize={8} fill={test ? 'var(--surface)' : 'var(--fg)'}>
                {folds[i] + 1}
              </text>
            </g>
          );
        })}
        <Axis scale={x} orient="bottom" at={H - 30} ticks={4} label="size (m²)" />
        <Axis scale={y} orient="left" at={44} ticks={3} label="price (k)" />
        <line x1={x(30)} x2={x(150)} y1={at(30)} y2={at(150)} stroke="var(--viz-prediction)" strokeWidth={2} />
        {points.map((p, i) =>
          folds[i] === fold ? (
            <rect key={i} x={x(p.x) - 4} y={y(p.y) - 4} width={8} height={8} fill="none" stroke="var(--viz-test)" strokeWidth={2} />
          ) : (
            <circle key={i} cx={x(p.x)} cy={y(p.y)} r={3.5} fill="var(--viz-train)" />
          ),
        )}
        <g transform="translate(52, 54)" className="viz-note">
          <circle cx={0} cy={-4} r={3.5} fill="var(--viz-train)" />
          <text x={8}>trains the line</text>
          <rect x={104} y={-8} width={8} height={8} fill="none" stroke="var(--viz-test)" strokeWidth={2} />
          <text x={116}>{`tests it (fold ${fold + 1})`}</text>
        </g>
      </svg>
      <div className="viz-controls">
        <StepButton label="Next fold" onStep={() => setFold((f) => (f + 1) % K)} />
      </div>
      <Readout>{`Fold ${fold + 1} of ${K} · test error ${Math.round(errors[fold])} · average so far ${Math.round(average)}`}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'Every point gets a turn as test data',
  altText: 'Forty flats are dealt into five folds; each step trains a line on four folds and tests it on the fifth, until every flat has been test data once.',
  Component: CrossValidation,
};
export default viz;
