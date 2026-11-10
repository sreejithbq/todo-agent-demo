---
description: API request validation standards using Zod.
globs:
  - "src/routes/**/*.js"
  - "src/services/**/*.js"
alwaysApply: false
---

# API Validation Rules

- Use Zod to validate incoming request data.
- Validate request bodies and query parameters.
- Return appropriate HTTP 400 responses for invalid input.
- Do not duplicate validation logic across routes.
- Keep validation consistent with existing API conventions.