export type Severity = 'error' | 'warning';

export interface ContentIssue {
  severity: Severity;
  rule: string;
  file: string;
  id?: string;
  message: string;
}

export function formatIssue(i: ContentIssue): string {
  return `${i.file}${i.id ? ` [${i.id}]` : ''} ${i.rule}: ${i.message}`;
}
