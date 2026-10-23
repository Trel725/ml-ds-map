import type { LintRule } from '../src/data/lint';

/** Rules reported as warnings while content is being drafted. CI runs strict, so warnings still fail there. */
export const warningRules: LintRule[] = [];
