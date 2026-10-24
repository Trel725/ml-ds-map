/** TeX commands that are notation, not quantities a student needs explained. */
const STRUCTURE = new Set([
  'frac', 'tfrac', 'sum', 'prod', 'left', 'right', 'cdot', 'quad', 'qquad', 'text', 'mid', 'le', 'ge', 'ne', 'to',
  'lim', 'log', 'exp', 'max', 'min', 'hat', 'bar', 'sqrt', 'partial', 'ldots', 'approx', 'propto', 'in', 'cap',
  'top', 'lVert', 'rVert', 'leftarrow', 'pm', 'times', 'begin', 'end', 'cases', 'operatorname', 'mathbb', 'mathcal',
  'arg', 'nabla', 'pi', 'infty',
]);
/** Letters that are fixed constants or function words, not symbols to explain. */
const CONSTANTS = new Set(['e', 'd']);

/**
 * The symbols a formula uses that none of its symbol rows mentions: Greek letters, \mathcal letters,
 * \arg-style operators and single Latin letters. A rough check: subscripts and text are ignored.
 */
export function unexplainedSymbols(formula: { tex: string; symbols: { symbol: string }[] }): string[] {
  const explained = formula.symbols.map((s) => s.symbol).join(' ');
  const tex = formula.tex
    .replace(/\\text\{[^}]*\}/g, ' ')
    .replace(/\\operatorname\{[^}]*\}/g, ' ')
    .replace(/[_^](\{[^}]*\}|\\[A-Za-z]+|[A-Za-z0-9])/g, ' ')
    .replace(/\\begin\{[a-z]+\}|\\end\{[a-z]+\}/g, ' ');
  const found = new Set<string>();
  for (const m of tex.matchAll(/\\mathcal\{([A-Za-z])\}|\\([A-Za-z]+)|([A-Za-z])/g)) {
    if (m[1]) found.add(`\\mathcal{${m[1]}}`);
    else if (m[2] && !STRUCTURE.has(m[2])) found.add(`\\${m[2]}`);
    else if (m[3] && !CONSTANTS.has(m[3])) found.add(m[3]);
  }
  const mentions = (sym: string) =>
    sym.startsWith('\\') ? explained.includes(sym) : new RegExp(`(^|[^A-Za-z\\\\])${sym}($|[^A-Za-z])`).test(explained);
  return [...found].filter((s) => !mentions(s));
}
