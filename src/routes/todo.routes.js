import { Router } from "express";
import {
  createTodoSchema,
  listTodosQuerySchema,
  todoIdParamsSchema,
  updateTodoSchema,
} from "../validators/todo.validator.js";
import {
  createTodo,
  deleteTodo,
  getTodoById,
  listTodos,
  updateTodo,
} from "../services/todo.service.js";

const router = Router();

router.get("/", (req, res) => {
  const filters = listTodosQuerySchema.parse(req.query);
  const todos = listTodos(filters);

  res.status(200).json({
    data: todos,
    meta: { count: todos.length },
  });
});

router.post("/", (req, res) => {
  const input = createTodoSchema.parse(req.body);
  const todo = createTodo(input);

  res.status(201).location(`/todos/${todo.id}`).json({ data: todo });
});

router.get("/:id", (req, res) => {
  const { id } = todoIdParamsSchema.parse(req.params);
  const todo = getTodoById(id);

  res.status(200).json({ data: todo });
});

router.patch("/:id", (req, res) => {
  const { id } = todoIdParamsSchema.parse(req.params);
  const changes = updateTodoSchema.parse(req.body);
  const todo = updateTodo(id, changes);

  res.status(200).json({ data: todo });
});

router.delete("/:id", (req, res) => {
  const { id } = todoIdParamsSchema.parse(req.params);
  deleteTodo(id);

  res.status(204).send();
});

export default router;
