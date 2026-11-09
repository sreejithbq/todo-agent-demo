import express from "express";
import todoRouter from "./routes/todo.routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());

app.use("/todos", todoRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
