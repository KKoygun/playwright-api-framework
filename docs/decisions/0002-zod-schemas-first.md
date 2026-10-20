# 2. Validate every response with Zod first

**Status:** accepted

## Context

Field-by-field assertions only cover the fields a test happens to check. A renamed or retyped field elsewhere in the response passes silently until something downstream breaks.

## Decision

Every resource has a Zod schema in `src/schemas/`, and tests run `Schema.safeParse(body)` before any field assertion. Schemas also produce the TypeScript types (`z.infer`), so types and runtime checks cannot drift apart. A "schema contract" test per resource feeds invalid shapes to the schema to prove it actually rejects them.

Zod came before Pact because it needs no provider cooperation: it works against any API we can call, including public ones we do not control.

## Consequences

- Shape changes fail at the response, with a message naming the field.
- One schema serves as type, runtime check and documentation.
- Zod only proves what *this* client received in *this* run. It cannot stop a provider team from shipping a change that breaks us — that is what [Pact](0003-pact-contract-test.md) adds.
