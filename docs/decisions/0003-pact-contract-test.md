# 3. Add a Pact contract for PostsClient

**Status:** accepted

## Context

Zod catches a breaking change when our tests run against the provider — after the provider has shipped it. Consumer-driven contracts move that check to the provider's own pipeline, before release.

JSONPlaceholder is a public fake API: it cannot run Pact provider states or a verification step.

## Decision

- One consumer test (`contract/posts.consumer.pact.test.ts`) drives the real `PostsClient` and `UsersClient` against the Pact mock server and writes a pact file.
- Provider verification runs that pact against a small local stub of `/posts` and `/users` (`contract/providerStub.ts`), with state handlers for "post 1 exists" and similar.
- The contract tests run on Vitest. Pact JS is runner-agnostic, and keeping it off the Playwright runner keeps the API suites unchanged. The Playwright request context is still used inside the consumer test, so the client code under contract is the production code.

## Consequences

- The repo shows the full consumer → pact file → provider verification loop, and the CI job fails if either side breaks.
- The stub is not the real provider. With a real service, the verification test would point `providerBaseUrl` at it (or its CI build) and the pact would be shared through a Pact Broker instead of a local file.
- Only a few interactions are covered on purpose; the Playwright suites still cover behaviour.
