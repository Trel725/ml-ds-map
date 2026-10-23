/** Splits a label into at most `maxLines` lines of roughly `maxChars` characters, breaking at spaces. */
export function wrapLabel(label: string, maxChars: number, maxLines = 2): string[] {
  const words = label.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > maxChars && line && lines.length < maxLines - 1) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  lines.push(line);
  return lines;
}
