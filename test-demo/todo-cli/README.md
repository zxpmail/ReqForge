# Todo CLI

Simple command-line todo list for developers with AI categorization.

## Install

```bash
npm install -g todo-cli
```

Or run locally:

```bash
pnpm build
node bin/todo --help
```

## Usage

```bash
# Add a todo (auto-categorized)
todo add "Implement authentication"
# Output: Added todo #1 (category: feature): Implement authentication

# Add with manual category override
todo add "Fix memory leak" --category bug

# List all todos (grouped by category)
todo list

# List only pending
todo list --pending

# Filter by category
todo list --category bug

# Mark as completed
todo complete 1

# Delete a todo
todo delete 1
```

## How it works

- Todos are stored in `./todo.json` in the current working directory
- Per-directory isolation — each project has its own todo list
- AI auto-categorizes todos using keyword matching (extensible to real AI)
- Categories: `feature`, `bug`, `refactor`, `chore`, `docs`, `test`

## License

MIT
