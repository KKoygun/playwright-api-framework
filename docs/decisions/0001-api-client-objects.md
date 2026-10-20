# 1. One client class per API resource

**Status:** accepted

## Context

Tests that call `request.get('/posts/1')` directly repeat paths, query building and headers in every file. When an endpoint moves, every test that touches it changes.

## Decision

Each resource gets a client class (`PostsClient`, `UsersClient`, …) that extends `BaseApiClient` and exposes named methods such as `getById(id)`. `BaseApiClient` owns the HTTP calls and the request log. Clients are injected into tests through Playwright fixtures, so a test never builds one itself.

This is the Page Object Model applied to HTTP.

## Consequences

- An endpoint change is a one-line change in one class.
- Tests read as intent (`postsClient.create(payload)`), not as HTTP plumbing.
- Clients return the raw `APIResponse`, so tests still assert status codes and bodies themselves. That is deliberate: negative tests (404s) need the response, not an exception.
- The same clients are reused by the Pact consumer test, so the contract describes what the real code sends.
