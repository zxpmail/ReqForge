# Todo CLI

A lightweight CLI todo list tool for developers. Per-project task tracking in the terminal with AI-powered automatic categorization.

## Features

- **`todo add <description>`** — Add a task. AI auto-categorizes as feature/bug/refactor/chore/docs/test
- **`todo list`** — View all todos grouped by category with color-coded output
- **`todo complete <id>`** — Mark a task done
- **`todo delete <id>`** — Remove a task from the list

## Install

```bash
pnpm install
pnpm build
# then link globally or run via node:
node dist/index.js --help
```

## Usage

```bash
# Add a todo (AI will categorize it automatically)
todo add "Refactor authentication module"

# List all todos grouped by category
todo list

# Mark a todo as completed
todo complete 1

# Delete a todo
todo delete 1
```

### AI Categorization

By default, todos are categorized via OpenAI-compatible API. Set your API key:

```bash
export AI_API_KEY=sk-...
# or pass inline
todo add "Fix login timeout" --ai-key sk-...
```

Custom API endpoint (defaults to OpenAI):

```bash
export AI_API_ENDPOINT=https://api.openai.com/v1/chat/completions
```

If no API key is configured, all todos default to the **feature** category.

### Data Storage

Todos are stored in `todo.json` in the **current working directory**. Each directory has its own isolated task list.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22.x |
| Language | TypeScript 5.9 |
| CLI Framework | Commander.js 14.0 |
| Package Manager | pnpm |

## License

MIT
