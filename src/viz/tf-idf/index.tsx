import { scaleLinear } from 'd3-scale';
import { useId, useState } from 'react';
import { Readout } from '../Readout';
import type { VizModule } from '../types';
import { tfidf, tokenize } from './model';

const DEFAULTS = ['Win a free prize now', 'Your invoice for the meeting is attached', 'Claim your free gift and the prize'];
const W = 360;
const ROW = 15;
const MAX_WEIGHT = 0.7;

const bar = scaleLinear().domain([0, MAX_WEIGHT]).range([0, 220]).clamp(true);

function Sentence({ n, value, onChange }: { n: number; value: string; onChange(v: string): void }) {
  const id = useId();
  return (
    <div className="viz-text-input">
      <label htmlFor={id}>{`Sentence ${n}`}</label>
      <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TfIdf() {
  const [sentences, setSentences] = useState(DEFAULTS);
  const weights = tfidf(sentences.map(tokenize));
  const sorted = weights.map((w) => [...w].sort((a, b) => b[1] - a[1]));

  // Ties keep the first word met, reading sentence by sentence.
  const all = sorted.flatMap((ws, i) => ws.map(([word, v]) => ({ word, i, v })));
  const h = all.reduce<(typeof all)[number] | null>((m, e) => (!m || e.v > m.v ? e : m), null);
  const l = all.reduce<(typeof all)[number] | null>((m, e) => (!m || e.v < m.v ? e : m), null);

  const set = (k: number) => (v: string) => setSentences((s) => s.map((old, j) => (j === k ? v : old)));
  return (
    <>
      <div className="viz-controls" role="group" aria-label="Sentences">
        {sentences.map((s, k) => (
          <Sentence key={k} n={k + 1} value={s} onChange={set(k)} />
        ))}
      </div>
      {sorted.map((ws, k) => (
        <svg key={k} viewBox={`0 0 ${W} ${Math.max(1, ws.length) * ROW + 18}`} role="img" aria-label={`Word weights for sentence ${k + 1}`}>
          <text x={0} y={12} className="viz-note">
            {`Sentence ${k + 1}${ws.length === 0 ? ': no words' : ''}`}
          </text>
          {ws.map(([word, v], r) => (
            <g key={word} transform={`translate(0, ${18 + r * ROW})`}>
              <text x={96} y={10} textAnchor="end" className="viz-note">
                {word}
              </text>
              <rect x={102} y={1} width={bar(v)} height={ROW - 4} fill="var(--viz-prediction)" />
              <text x={106 + bar(v)} y={10} className="viz-note">
                {v.toFixed(2)}
              </text>
            </g>
          ))}
        </svg>
      ))}
      <Readout>{h && l ? `Highest weight: "${h.word}" in sentence ${h.i + 1} · lowest: "${l.word}"` : 'Type a sentence to see word weights'}</Readout>
    </>
  );
}

const viz: VizModule = {
  takeaway: 'Common words count for little',
  altText:
    'Each word in three short sentences gets a weight: words that appear in many sentences, like "the", get small weights, and rare words get large ones.',
  Component: TfIdf,
};
export default viz;
