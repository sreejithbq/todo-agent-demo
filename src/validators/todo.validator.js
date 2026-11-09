import { z } from "zod";

export const PRIORITIES = ["low", "medium", "high"];

const prioritySchema = z.enum(PRIORITIES);

export const createTodoSchema = z
  .object({
    title: z
      .string({ error: "Title must be a string" })
      .trim()
      .min(1, "Title is required")
      .max(200, "Title must be at most 200 characters"),
    description: z
      .string({ error: "Description must be a string" })
      .max(2000, "Description must be at most 2000 characters")
      .optional()
      .default(""),
    completed: z
      .boolean({ error: "Completed must be a boolean" })
      .optional()
      .default(false),
    priority: prioritySchema.optional().default("medium"),
  })
  .strict();

export const updateTodoSchema = z
  .object({
    title: z
      .string({ error: "Title must be a string" })
      .trim()
      .min(1, "Title is required")
      .max(200, "Title must be at most 200 characters")
      .optional(),
    description: z
      .string({ error: "Description must be a string" })
      .max(2000, "Description must be at most 2000 characters")
      .optional(),
    completed: z.boolean({ error: "Completed must be a boolean" }).optional(),
    priority: prioritySchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const listTodosQuerySchema = z
  .object({
    completed: z
      .enum(["true", "false"], {
        error: "Completed filter must be 'true' or 'false'",
      })
      .transform((value) => value === "true")
      .optional(),
    priority: prioritySchema.optional(),
  })
  .strict();

export const todoIdParamsSchema = z
  .object({
    id: z.string().uuid("Task ID must be a valid UUID"),
  })
  .strict();
