import { TodoCategory } from './types';

const API_ENDPOINT = process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
const API_KEY = process.env.AI_API_KEY || '';

const VALID_CATEGORIES: TodoCategory[] = ['feature', 'bug', 'refactor', 'chore', 'docs', 'test'];

function parseCategory(raw: string): TodoCategory | null {
  const trimmed = raw.trim().toLowerCase();
  if (VALID_CATEGORIES.includes(trimmed as TodoCategory)) {
    return trimmed as TodoCategory;
  }
  return null;
}

export async function categorizeTodo(description: string): Promise<TodoCategory> {
  if (!API_KEY) {
    console.warn('AI_API_KEY not set. Defaulting to "feature" category.');
    return 'feature';
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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

    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.warn('AI API returned empty response. Defaulting to "feature".');
      return 'feature';
    }

    return parseCategory(content) || 'feature';
  } catch (err) {
    console.warn(`AI API call failed: ${err instanceof Error ? err.message : 'unknown error'}. Defaulting to "feature".`);
    return 'feature';
  }
}
