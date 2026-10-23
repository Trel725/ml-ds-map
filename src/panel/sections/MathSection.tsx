import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import type { Node } from '../../data/schema';
import type { renderTex } from '../katex';

type Render = typeof renderTex;
type Loader = () => Promise<{ renderTex: Render }>;
type Status = { kind: 'idle' } | { kind: 'loading' } | { kind: 'ready'; render: Render } | { kind: 'failed' };

const loadKatex: Loader = () => import('../katex');

/** One piece of TeX: KaTeX output when it renders, else the raw TeX as code. */
function Tex({ tex, display, render }: { tex: string; display: boolean; render: Render | null }) {
  if (render) {
    try {
      // KaTeX output is the only HTML injected anywhere in the panel.
      return <span className={display ? 'math-display' : 'math-inline'} dangerouslySetInnerHTML={{ __html: render(tex, display) }} />;
    } catch {
      // fall through to the raw TeX
    }
  }
  return <code data-testid="math-raw">{tex}</code>;
}

/** Section 8: collapsed; KaTeX loads the first time it is opened. */
export function MathSection({ formula, load = loadKatex }: { formula: NonNullable<Node['formula']>; load?: Loader }) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const onToggle = (e: SyntheticEvent<HTMLDetailsElement>) => {
    if (!e.currentTarget.open || status.kind !== 'idle') return;
    setStatus({ kind: 'loading' });
    load().then(
      (m) => setStatus({ kind: 'ready', render: m.renderTex }),
      () => setStatus({ kind: 'failed' }),
    );
  };

  const render = status.kind === 'ready' ? status.render : null;
  return (
    <details className="panel-section math" data-testid="math" onToggle={onToggle}>
      <summary>The math, one level deeper</summary>
      {status.kind === 'loading' ? (
        <p className="math-loading">Loading…</p>
      ) : status.kind === 'idle' ? null : (
        <>
          <div className="math-formula">
            <Tex tex={formula.tex} display render={render} />
          </div>
          <dl className="math-symbols">
            {formula.symbols.map((s) => (
              <div key={s.symbol} className="math-symbol">
                <dt>
                  <Tex tex={s.symbol} display={false} render={render} />
                </dt>
                <dd>{s.meaning}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </details>
  );
}
