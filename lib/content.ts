import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Category, Pack, QuestionSet } from './types';

function readPublicJson<T>(file: string): T {
  const root = path.resolve(process.cwd(), 'public');
  const target = path.resolve(root, file.replace(/^\//, ''));
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error('Invalid content path');
  return JSON.parse(readFileSync(target, 'utf8')) as T;
}

export function getPacks(): Pack[] {
  return readPublicJson<{ packs: Pack[] }>('/vi/packs.json').packs.filter((pack) => pack.published);
}
export function getCategories(): Category[] {
  return readPublicJson<{ categories: Category[] }>('/vi/categories.json').categories.sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}
export function getPack(slug: string): Pack | undefined {
  return getPacks().find((pack) => pack.slug === slug);
}
export function getCategory(slug: string): Category | undefined {
  return getCategories().find((category) => category.slug === slug);
}
export function getQuestionSet(pack: Pack): QuestionSet {
  return readPublicJson<QuestionSet>(pack.questionFile);
}
