// Loaded on demand by MathSection, so KaTeX and its stylesheet stay out of the entry chunk.
import katex from 'katex';
import 'katex/dist/katex.min.css';

/** KaTeX HTML for `tex`; throws on TeX that KaTeX cannot parse. */
export function renderTex(tex: string, display: boolean): string {
  return katex.renderToString(tex, { displayMode: display, throwOnError: true });
}
