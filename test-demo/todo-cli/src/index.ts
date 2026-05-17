#!/usr/bin/env node

import { Command } from 'commander';
import { addTodo, getAllTodos, completeTodo, deleteTodo } from './storage';

const program = new Command();

program
  .name('todo')
  .description('A simple CLI todo list tool')
  .version('1.0.0');

program
  .command('add <description>')
  .description('Add a new todo')
  .action((description: string) => {
    const todo = addTodo(description, 'feature');
    console.log(`Added todo #${todo.id} (category: ${todo.category}): ${todo.description}`);
  });

program
  .command('list')
  .description('List all todos')
  .action(() => {
    const todos = getAllTodos();
    if (todos.length === 0) {
      console.log('No todos found.');
      return;
    }
    for (const todo of todos) {
      const status = todo.completed ? '✓' : '○';
      console.log(`  ${status} #${todo.id} ${todo.description}`);
    }
  });

program
  .command('complete <id>')
  .description('Mark a todo as completed')
  .action((id: string) => {
    const todoId = parseInt(id, 10);
    if (isNaN(todoId)) {
      console.error('Invalid ID. Please provide a numeric ID.');
      return;
    }
    const todo = completeTodo(todoId);
    if (!todo) {
      console.error(`Todo #${todoId} not found.`);
      return;
    }
    console.log(`Marked todo #${todoId} as completed`);
  });

program
  .command('delete <id>')
  .description('Delete a todo')
  .action((id: string) => {
    const todoId = parseInt(id, 10);
    if (isNaN(todoId)) {
      console.error('Invalid ID. Please provide a numeric ID.');
      return;
    }
    const deleted = deleteTodo(todoId);
    if (!deleted) {
      console.error(`Todo #${todoId} not found.`);
      return;
    }
    console.log(`Deleted todo #${todoId}`);
  });

program.parse(process.argv);
