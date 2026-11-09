# To-Do REST API

A simple in-memory To-Do REST API built with Express 5, JavaScript ES Modules, and Zod.

## Features

- CRUD operations for To-Do tasks
- Request body, route parameter, and query parameter validation with Zod
- Centralized error handling
- In-memory storage (no database)
- Automated API tests using Node's built-in test runner

## Requirements

- Node.js 20 or newer
- npm

## Setup

```bash
npm install
```

## Running the API

Start the server:

```bash
npm start
```

Start in watch mode during development:

```bash
npm run dev
```

The API listens on `http://localhost:3000` by default. Set the `PORT` environment variable to change it:

```bash
PORT=4000 npm start
```

## Running Tests

```bash
npm test
```

## Data Model

```json
{
  "id": "3f0d8c1a-7b2e-4f3a-9c1d-2a4b6c8d0e1f",
  "title": "Buy groceries",
  "description": "Milk, eggs, and bread",
  "completed": false,
  "priority": "medium",
  "createdAt": "2026-11-09T10:00:00.000Z",
  "updatedAt": "2026-11-09T10:00:00.000Z"
}
```

- `id` is a generated UUID.
- `priority` is one of `low`, `medium`, or `high`.
- `createdAt` and `updatedAt` are ISO 8601 timestamps.
- Storage is in memory, so all tasks are lost when the server restarts.

## API Endpoints

| Method | Endpoint | Description | Success |
| --- | --- | --- | --- |
| GET | `/todos` | List all tasks | `200 OK` |
| GET | `/todos/:id` | Get a task by ID | `200 OK` |
| POST | `/todos` | Create a task | `201 Created` |
| PATCH | `/todos/:id` | Update a task | `200 OK` |
| DELETE | `/todos/:id` | Delete a task | `204 No Content` |

### List Tasks

```http
GET /todos
```

Optional query parameters:

| Parameter | Values | Description |
| --- | --- | --- |
| `completed` | `true`, `false` | Filter by completion status |
| `priority` | `low`, `medium`, `high` | Filter by priority |

Example:

```http
GET /todos?completed=false&priority=high
```

Response:

```json
{
  "data": [
    {
      "id": "3f0d8c1a-7b2e-4f3a-9c1d-2a4b6c8d0e1f",
      "title": "Buy groceries",
      "description": "Milk, eggs, and bread",
      "completed": false,
      "priority": "high",
      "createdAt": "2026-11-09T10:00:00.000Z",
      "updatedAt": "2026-11-09T10:00:00.000Z"
    }
  ],
  "meta": {
    "count": 1
  }
}
```

### Get a Task

```http
GET /todos/:id
```

Response:

```json
{
  "data": {
    "id": "3f0d8c1a-7b2e-4f3a-9c1d-2a4b6c8d0e1f",
    "title": "Buy groceries",
    "description": "Milk, eggs, and bread",
    "completed": false,
    "priority": "medium",
    "createdAt": "2026-11-09T10:00:00.000Z",
    "updatedAt": "2026-11-09T10:00:00.000Z"
  }
}
```

### Create a Task

```http
POST /todos
Content-Type: application/json

{
  "title": "Buy groceries",
  "description": "Milk, eggs, and bread",
  "completed": false,
  "priority": "medium"
}
```

- `title` is required.
- `description` defaults to `""`.
- `completed` defaults to `false`.
- `priority` defaults to `"medium"`.

Returns `201 Created` with a `Location: /todos/:id` header and the created task.

### Update a Task

```http
PATCH /todos/:id
Content-Type: application/json

{
  "completed": true,
  "priority": "high"
}
```

At least one field must be provided. Only the supplied fields are changed. `updatedAt` is refreshed automatically; `id` and `createdAt` cannot be changed.

### Delete a Task

```http
DELETE /todos/:id
```

Returns `204 No Content` on success.

## Validation Rules

| Field | Rules |
| --- | --- |
| `title` | Required when creating; string; trimmed; 1–200 characters |
| `description` | Optional string; at most 2000 characters |
| `completed` | Optional boolean |
| `priority` | Optional; one of `low`, `medium`, `high` |
| `id` | Must be a valid UUID |

Unknown fields and unknown query parameters are rejected with `400 Bad Request`.

## Error Responses

All errors use a consistent JSON shape:

```json
{
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "path": "title",
        "message": "Title is required"
      }
    ]
  }
}
```

| Status | Meaning |
| --- | --- |
| `400 Bad Request` | Invalid body, query, params, or malformed JSON |
| `404 Not Found` | Task or route does not exist |
| `500 Internal Server Error` | Unexpected server error |

## Project Structure

```text
src/
  app.js                          # Express app setup and middleware wiring
  server.js                       # Server startup
  errors/http-error.js            # HTTP error classes
  middleware/error.middleware.js  # 404 and centralized error handling
  routes/todo.routes.js           # Route handlers
  services/todo.service.js        # In-memory business logic
  validators/todo.validator.js    # Zod schemas
test/
  todo.test.js                    # API tests
```
