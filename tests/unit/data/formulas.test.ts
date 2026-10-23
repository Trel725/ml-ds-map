import katex from 'katex';
import { expect, test } from 'vitest';
import { realContent } from '../helpers/real';

test('every formula and symbol in the content parses in KaTeX', async () => {
  const failures: string[] = [];
  for (const n of (await realContent()).nodes) {
    if (!n.formula) continue;
    for (const [tex, display] of [[n.formula.tex, true], ...n.formula.symbols.map((s) => [s.symbol, false] as const)] as const) {
      try {
        katex.renderToString(tex, { displayMode: display, throwOnError: true });
      } catch (e) {
        failures.push(`${n.id}: ${tex} (${e instanceof Error ? e.message : String(e)})`);
      }
    }
  }
  expect(failures).toEqual([]);
});
