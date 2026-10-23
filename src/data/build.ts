import { warningRules } from '../../content/lint.config';
import { VIZ_IDS } from '../viz/ids';
import { crossCheck } from './crossCheck';
import type { ContentIssue } from './issues';
import { lintContent } from './lint';
import type { LintRule } from './lint';
import { loadContent } from './load';
import type { Content } from './schema';

/**
 * Load, cross-check and lint. `ok` is false on any error, or on any issue at all in strict mode.
 * `warningRules` defaults to content/lint.config.ts.
 */
export async function buildContent(
  dir: string,
  opts: { strict: boolean; warningRules?: LintRule[] },
): Promise<{ content: Content; issues: ContentIssue[]; ok: boolean }> {
  const { content, issues: loadIssues } = await loadContent(dir);
  const issues = [...loadIssues, ...crossCheck(content, VIZ_IDS), ...lintContent(content, { warningRules: opts.warningRules ?? warningRules })];
  const ok = opts.strict ? issues.length === 0 : !issues.some((i) => i.severity === 'error');
  return { content, issues, ok };
}
