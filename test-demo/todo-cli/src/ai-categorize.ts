import { TodoCategory } from './types';

const API_ENDPOINT = process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
const VALID_CATEGORIES = ['feature', 'bug', 'refactor', 'chore', 'docs', 'test'];

function parseCategory(raw: string): TodoCategory | null {
  const trimmed = raw.trim().toLowerCase();
  if (VALID_CATEGORIES.includes(trimmed)) {
    return trimmed as TodoCategory;
  }
  return null;
}

export async function categorizeTodo(description: string, apiKey?: string): Promise<TodoCategory> {
  const key = apiKey || process.env.AI_API_KEY || '';
  if (!key) {
    console.warn('AI_API_KEY not set. Defaulting to "feature" category.');
    return 'feature';
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: `You categorize todo items. Respond with exactly one word: ${VALID_CATEGORIES.join(', ')}.`,
          },
          { role: 'user', content: description },
        ],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      console.warn(`AI API returned ${response.status}. Defaulting to "feature".`);
      return 'feature';
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content as string | undefined;
    if (!content) {
      console.warn('AI API returned empty response. Defaulting to "feature".');
      return 'feature';
    }

    return parseCategory(content) || 'feature';
  } catch (err: any) {
    console.warn(`AI API call failed: ${err instanceof Error ? err.message : 'unknown error'}. Defaulting to "feature".`);
    return 'feature';
  }
}
