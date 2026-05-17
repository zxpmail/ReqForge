import { Category, DEFAULT_CATEGORIES } from './types';

/**
 * Simple keyword-based categorization when no AI API is available.
 * If user has an AI API key configured, they can use real AI classification.
 * This fallback uses simple keyword matching.
 */
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  feature: ['add', 'new', 'feature', 'implement', 'support', 'enable'],
  bug: ['fix', 'bug', 'issue', 'problem', 'error', 'crash', 'broken'],
  refactor: ['refactor', 'clean', 'improve', 'optimize', 'restructure'],
  chore: ['update', 'upgrade', 'dependency', 'config', 'setup', 'remove', 'clean'],
  docs: ['doc', 'readme', 'comment', 'document', 'explain'],
  test: ['test', 'jest', 'unit', 'integration', 'spec'],
};

export function categorizeTodo(description: string): Category {
  const lower = description.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category as Category;
      }
    }
  }

  return 'chore';
}
