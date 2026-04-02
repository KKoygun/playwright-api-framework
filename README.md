# playwright-api-framework

REST API test framework built with **Playwright**, **TypeScript**, **Zod schema validation**, and **Allure reporting**.

Demonstrates the same architectural principles applied to API testing that Page Object Model brings to UI testing — typed client classes, fixture-based injection, schema contracts, and CI-ready parallel execution.

---

## Stack

| Tool | Purpose |
|---|---|
| [Playwright](https://playwright.dev/docs/api-testing) | HTTP request execution and assertions |
| TypeScript | Type safety across clients, schemas, and tests |
| [Zod](https://zod.dev) | Runtime schema validation — catches contract breaks immediately |
| Allure | Test reporting with history and categorisation |
| GitHub Actions | CI with parallel smoke/regression jobs |

---

## Project Structure

```
src/
├── api/                  # API client classes (POM equivalent for HTTP layer)
│   ├── BaseApiClient.ts  # Shared GET/POST/PUT/PATCH/DELETE methods
│   ├── PostsClient.ts    # /posts resource
│   └── UsersClient.ts    # /users resource
├── schemas/              # Zod schemas — the API contract definitions
│   ├── post.schema.ts
│   └── user.schema.ts
└── fixtures/
    └── apiFixtures.ts    # Playwright fixture extension — injects clients into tests

tests/
├── posts.spec.ts         # Posts API: GET, POST, PUT, PATCH, DELETE
└── users.spec.ts         # Users API: GET list, GET by id, nested /posts

.github/workflows/
└── ci.yml                # Parallel smoke + regression jobs with Allure report merge
```

---

## Key Design Decisions

**API Client Object pattern** — Each resource (`/posts`, `/users`) has its own typed client class extending `BaseApiClient`. Tests call `postsClient.getById(1)` rather than `request.get('/posts/1')`. This mirrors Page Object Model thinking: if an endpoint changes, one class changes, not every test.

**Fixture injection** — Playwright's `test.extend()` injects pre-built client instances into every test function. Tests never construct clients manually, which keeps them readable and removes setup boilerplate.

**Zod schema validation** — Schemas define the expected response shape as a type contract. `PostSchema.safeParse(body)` catches missing fields, wrong types, or renamed properties at the point of response — not silently downstream. This is lightweight contract testing without a full Pact setup.

**Environment switching** — `ENV=staging npm test` points all clients at the staging base URL. No test changes required. Auth tokens flow in via environment variables.

---

## Quick Start

### Prerequisites
- Node.js 20+

### Setup

```bash
git clone https://github.com/KKoygun/playwright-api-framework

cd playwright-api-framework
npm install
cp .env.example .env
```

### Run tests

```bash
# All tests
npm test

# Smoke only
npm run test:smoke

# Regression only
npm run test:regression

# Against staging
ENV=staging npm test
```

### Generate Allure report

```bash
npm run report
```

---

## CI / CD

GitHub Actions runs smoke and regression suites in parallel on every push to `main` or `develop`. Allure results from both jobs are merged into a single report artifact.

To add an API token for authenticated endpoints:

1. Add `API_TOKEN` to your GitHub repository secrets
2. Uncomment the `Authorization` header in `playwright.config.ts`

---

## Companion Repository

For UI automation, BDD (Cucumber), and AI agents (Healer, Planner, Generator): [Playwright-cucumber-ai-framework](https://github.com/KKoygun/Playwright-cucumber-ai-framework)

---

## Target API

Tests run against [JSONPlaceholder](https://jsonplaceholder.typicode.com) — a free, public REST API. To point the framework at your own API, update the `baseURLMap` in `playwright.config.ts`.
