import { randomUUID } from "node:crypto";
import { NotFoundError } from "../errors/http-error.js";

const todos = new Map();

function timestamp() {
  return new Date().toISOString();
}

export function listTodos({ completed, priority } = {}) {
  return [...todos.values()].filter(
    (todo) =>
      (completed === undefined || todo.completed === completed) &&
      (priority === undefined || todo.priority === priority),
  );
}

export function getTodoById(id) {
  const todo = todos.get(id);

  if (!todo) {
    throw new NotFoundError();
  }

  return todo;
}

export function createTodo(input) {
  const now = timestamp();
  const todo = {
    id: randomUUID(),
    title: input.title,
    description: input.description,
    completed: input.completed,
    priority: input.priority,
    createdAt: now,
    updatedAt: now,
  };

  todos.set(todo.id, todo);

  return todo;
}

export function updateTodo(id, changes) {
  const todo = getTodoById(id);
  const updatedTodo = {
    ...todo,
    ...changes,
    id: todo.id,
    createdAt: todo.createdAt,
    updatedAt: timestamp(),
  };

  todos.set(id, updatedTodo);

  return updatedTodo;
}

export function deleteTodo(id) {
  if (!todos.delete(id)) {
    throw new NotFoundError();
  }
}

export function resetTodos() {
  todos.clear();
}
