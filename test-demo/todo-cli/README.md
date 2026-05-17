# Todo CLI

A simple CLI todo list tool with AI-powered automatic categorization.

## Install

```bash
pnpm install
pnpm build
pnpm link --global    # makes `todo` available globally
```

Or use directly:

```bash
node dist/index.js add "my task"
```

## Configure AI (Optional)

Set your OpenAI API key for automatic categorization:

```bash
export AI_API_KEY=sk-your-key-here
```

Without a key, todos default to the `feature` category.

## Usage

```bash
# Add a todo (AI categorizes automatically)
todo add "Refactor authentication module"

# List all todos (grouped by category)
todo list

# Mark a todo as completed
todo complete 1

# Delete a todo
todo delete 1

# Help
todo --help
```

## Categories

Todos are automatically categorized into: `feature`, `bug`, `refactor`, `chore`, `docs`, `test`.
