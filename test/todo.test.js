import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, beforeEach, describe, it } from "node:test";
import app from "../src/app.js";
import { resetTodos } from "../src/services/todo.service.js";

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

beforeEach(() => {
  resetTodos();
});

async function request(path, { body, ...options } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: body
      ? { "content-type": "application/json", ...options.headers }
      : options.headers,
    body,
  });
  const text = await response.text();

  return {
    response,
    body: text ? JSON.parse(text) : undefined,
  };
}

async function createTask(overrides = {}) {
  const { response, body } = await request("/todos", {
    method: "POST",
    body: JSON.stringify({ title: "Test task", ...overrides }),
  });

  assert.equal(response.status, 201);

  return body.data;
}

describe("POST /todos", () => {
  it("creates a task with defaults and generated metadata", async () => {
    const { response, body } = await request("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "  Write tests  " }),
    });

    assert.equal(response.status, 201);
    assert.match(body.data.id, /^[0-9a-f-]{36}$/);
    assert.equal(response.headers.get("location"), `/todos/${body.data.id}`);
    assert.equal(body.data.title, "Write tests");
    assert.equal(body.data.description, "");
    assert.equal(body.data.completed, false);
    assert.equal(body.data.priority, "medium");
    assert.equal(body.data.createdAt, body.data.updatedAt);
    assert.ok(!Number.isNaN(Date.parse(body.data.createdAt)));
  });

  it("accepts all provided fields", async () => {
    const { response, body } = await request("/todos", {
      method: "POST",
      body: JSON.stringify({
        title: "Ship release",
        description: "Publish version 1.0.0",
        completed: true,
        priority: "high",
      }),
    });

    assert.equal(response.status, 201);
    assert.equal(body.data.description, "Publish version 1.0.0");
    assert.equal(body.data.completed, true);
    assert.equal(body.data.priority, "high");
  });

  it("rejects a missing title", async () => {
    const { response, body } = await request("/todos", {
      method: "POST",
      body: JSON.stringify({ description: "No title" }),
    });

    assert.equal(response.status, 400);
    assert.equal(body.error.message, "Validation failed");
    assert.equal(body.error.details[0].path, "title");
  });

  it("rejects a blank title", async () => {
    const { response } = await request("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "   " }),
    });

    assert.equal(response.status, 400);
  });

  it("rejects an invalid priority", async () => {
    const { response, body } = await request("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "Task", priority: "urgent" }),
    });

    assert.equal(response.status, 400);
    assert.equal(body.error.details[0].path, "priority");
  });

  it("rejects unknown fields", async () => {
    const { response } = await request("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "Task", dueDate: "2026-01-01" }),
    });

    assert.equal(response.status, 400);
  });

  it("rejects malformed JSON", async () => {
    const { response, body } = await request("/todos", {
      method: "POST",
      body: "{ not valid json",
    });

    assert.equal(response.status, 400);
    assert.equal(body.error.message, "Invalid JSON body");
  });

  it("rejects an empty body", async () => {
    const { response } = await request("/todos", { method: "POST" });

    assert.equal(response.status, 400);
  });
});

describe("GET /todos", () => {
  it("returns an empty list when no tasks exist", async () => {
    const { response, body } = await request("/todos");

    assert.equal(response.status, 200);
    assert.deepEqual(body, { data: [], meta: { count: 0 } });
  });

  it("returns all tasks", async () => {
    await createTask({ title: "First" });
    await createTask({ title: "Second" });

    const { response, body } = await request("/todos");

    assert.equal(response.status, 200);
    assert.equal(body.data.length, 2);
    assert.equal(body.meta.count, 2);
  });

  it("filters by completed status", async () => {
    await createTask({ title: "Done", completed: true });
    await createTask({ title: "Pending", completed: false });

    const { response, body } = await request("/todos?completed=true");

    assert.equal(response.status, 200);
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].title, "Done");
  });

  it("filters by priority", async () => {
    await createTask({ title: "High", priority: "high" });
    await createTask({ title: "Low", priority: "low" });

    const { response, body } = await request("/todos?priority=high");

    assert.equal(response.status, 200);
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].title, "High");
  });

  it("combines filters", async () => {
    await createTask({ title: "Match", completed: true, priority: "high" });
    await createTask({ title: "Wrong status", completed: false, priority: "high" });
    await createTask({ title: "Wrong priority", completed: true, priority: "low" });

    const { response, body } = await request(
      "/todos?completed=true&priority=high",
    );

    assert.equal(response.status, 200);
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].title, "Match");
  });

  it("rejects an invalid completed filter", async () => {
    const { response, body } = await request("/todos?completed=yes");

    assert.equal(response.status, 400);
    assert.equal(body.error.message, "Validation failed");
  });

  it("rejects an invalid priority filter", async () => {
    const { response } = await request("/todos?priority=urgent");

    assert.equal(response.status, 400);
  });

  it("rejects unknown query parameters", async () => {
    const { response } = await request("/todos?sort=asc");

    assert.equal(response.status, 400);
  });
});

describe("GET /todos/:id", () => {
  it("returns a task by ID", async () => {
    const task = await createTask({ title: "Find me" });
    const { response, body } = await request(`/todos/${task.id}`);

    assert.equal(response.status, 200);
    assert.deepEqual(body.data, task);
  });

  it("returns 404 for an unknown task", async () => {
    const { response, body } = await request(`/todos/${randomUUID()}`);

    assert.equal(response.status, 404);
    assert.equal(body.error.message, "Task not found");
  });

  it("returns 400 for a malformed ID", async () => {
    const { response, body } = await request("/todos/not-a-uuid");

    assert.equal(response.status, 400);
    assert.equal(body.error.message, "Validation failed");
  });
});

describe("PATCH /todos/:id", () => {
  it("updates provided fields and refreshes updatedAt", async () => {
    const task = await createTask({ title: "Old title", priority: "low" });
    const { response, body } = await request(`/todos/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: "New title",
        completed: true,
        priority: "high",
      }),
    });

    assert.equal(response.status, 200);
    assert.equal(body.data.id, task.id);
    assert.equal(body.data.title, "New title");
    assert.equal(body.data.completed, true);
    assert.equal(body.data.priority, "high");
    assert.equal(body.data.createdAt, task.createdAt);
    assert.ok(Date.parse(body.data.updatedAt) >= Date.parse(task.updatedAt));
  });

  it("allows updating only the description", async () => {
    const task = await createTask();
    const { response, body } = await request(`/todos/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ description: "Updated description" }),
    });

    assert.equal(response.status, 200);
    assert.equal(body.data.description, "Updated description");
    assert.equal(body.data.title, task.title);
  });

  it("rejects an empty update body", async () => {
    const task = await createTask();
    const { response } = await request(`/todos/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 400);
  });

  it("rejects invalid field values", async () => {
    const task = await createTask();
    const { response } = await request(`/todos/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: "yes" }),
    });

    assert.equal(response.status, 400);
  });

  it("rejects unknown fields", async () => {
    const task = await createTask();
    const { response } = await request(`/todos/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ dueDate: "2026-01-01" }),
    });

    assert.equal(response.status, 400);
  });

  it("returns 404 for an unknown task", async () => {
    const { response } = await request(`/todos/${randomUUID()}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: true }),
    });

    assert.equal(response.status, 404);
  });

  it("returns 400 for a malformed ID", async () => {
    const { response } = await request("/todos/not-a-uuid", {
      method: "PATCH",
      body: JSON.stringify({ completed: true }),
    });

    assert.equal(response.status, 400);
  });
});

describe("DELETE /todos/:id", () => {
  it("deletes a task and returns 204", async () => {
    const task = await createTask();

    const { response, body } = await request(`/todos/${task.id}`, {
      method: "DELETE",
    });

    assert.equal(response.status, 204);
    assert.equal(body, undefined);

    const { response: getResponse } = await request(`/todos/${task.id}`);
    assert.equal(getResponse.status, 404);
  });

  it("returns 404 when deleting an unknown task", async () => {
    const { response } = await request(`/todos/${randomUUID()}`, {
      method: "DELETE",
    });

    assert.equal(response.status, 404);
  });

  it("returns 400 for a malformed ID", async () => {
    const { response } = await request("/todos/not-a-uuid", {
      method: "DELETE",
    });

    assert.equal(response.status, 400);
  });
});

describe("error handling", () => {
  it("returns 404 for unknown routes", async () => {
    const { response, body } = await request("/unknown");

    assert.equal(response.status, 404);
    assert.equal(body.error.message, "Route not found: GET /unknown");
  });

  it("returns JSON errors", async () => {
    const { response } = await request("/todos/not-a-uuid");

    assert.match(response.headers.get("content-type"), /application\/json/);
  });
});
