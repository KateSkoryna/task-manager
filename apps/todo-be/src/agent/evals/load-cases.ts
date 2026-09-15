import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { EvalCase, evalCaseSchema } from './types';

const CASES_DIR = join(__dirname, 'cases');

/** Loads and validates every `*.json` fixture in `cases/`, sorted by filename. */
export function loadCases(): EvalCase[] {
  const files = readdirSync(CASES_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort();

  return files.map((file) => {
    const raw = JSON.parse(readFileSync(join(CASES_DIR, file), 'utf-8'));
    const parsed = evalCaseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Invalid eval case in ${file}: ${parsed.error.message}`);
    }
    return parsed.data;
  });
}
