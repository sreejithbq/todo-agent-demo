---
name: add-api-endpoint
description: Implement or modify Express REST API endpoints following this repository's architecture, validation, error handling, and testing conventions. Use when adding or modifying API endpoints.
---

# Add API Endpoint

Follow this workflow when implementing a new REST API endpoint.

## 1. Inspect the Existing Implementation

- Read `AGENTS.md` and the applicable project rules.
- Inspect existing route files and service implementations.
- Understand the existing API response and error-handling conventions.
- Inspect existing tests and test utilities.
- Reuse existing patterns instead of introducing new architecture.

## 2. Implement the Endpoint

- Add the endpoint to the appropriate route file.
- Keep HTTP handling inside the route layer.
- Keep business logic inside the service layer.
- Use Zod to validate incoming request data.
- Follow REST API conventions.
- Use appropriate HTTP status codes.
- Avoid unnecessary dependencies.

## 3. Implement Error Handling

- Follow the existing centralized error-handling approach.
- Handle invalid input appropriately.
- Return consistent JSON responses.
- Do not expose internal implementation details.

## 4. Write Tests

- Add tests for successful requests.
- Add tests for invalid input.
- Add tests for relevant error scenarios.
- Follow the existing Node.js built-in test runner conventions.
- Do not modify unrelated tests.

## 5. Verify the Implementation

- Run `npm test`.
- Fix any test failures introduced by the changes.
- Review the Git diff.
- Check that the implementation follows the project rules.

## 6. Report the Results

Summarize:

- Endpoint implemented.
- HTTP method and route.
- Files created or modified.
- Validation and error handling implemented.
- Tests executed and their results.