import { test, expect } from '../src/fixtures/apiFixtures';
import { PostListSchema, PostSchema, CreatedPostSchema } from '../src/schemas/post.schema';

const SLA_MS = 2000;

test.describe('Posts API', () => {

  test.describe('GET /posts', () => {
    test('@smoke returns 200 with a list of posts matching schema', async ({ postsClient }) => {
      const start = Date.now();
      const response = await postsClient.getAll();
      const duration = Date.now() - start;

      expect(response.status()).toBe(200);
      expect(duration, `Response took ${duration}ms — exceeds ${SLA_MS}ms SLA`).toBeLessThan(SLA_MS);

      const body = await response.json();
      const result = PostListSchema.safeParse(body);
      expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });

    test('@regression filters posts by userId', async ({ postsClient }) => {
      const userId = 1;
      const response = await postsClient.getByUser(userId);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.length).toBeGreaterThan(0);
      body.forEach((post: { userId: number }) => {
        expect(post.userId).toBe(userId);
      });
    });
  });

  test.describe('GET /posts/:id', () => {
    test('@smoke returns a single post matching schema', async ({ postsClient }) => {
      const start = Date.now();
      const response = await postsClient.getById(1);
      const duration = Date.now() - start;

      expect(response.status()).toBe(200);
      expect(duration, `Response took ${duration}ms — exceeds ${SLA_MS}ms SLA`).toBeLessThan(SLA_MS);

      const body = await response.json();
      const result = PostSchema.safeParse(body);
      expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
      expect(body.id).toBe(1);
    });

    test('@regression returns 404 for non-existent post', async ({ postsClient }) => {
      const response = await postsClient.getById(99999);
      expect(response.status()).toBe(404);
    });
  });

  test.describe('POST /posts', () => {
    test('@smoke creates a post and returns 201 with the created resource', async ({ postsClient }) => {
      const payload = { title: 'Test Post', body: 'Test body content', userId: 1 };

      const start = Date.now();
      const response = await postsClient.create(payload);
      const duration = Date.now() - start;

      expect(response.status()).toBe(201);
      expect(duration, `Response took ${duration}ms — exceeds ${SLA_MS}ms SLA`).toBeLessThan(SLA_MS);

      const body = await response.json();
      const result = CreatedPostSchema.safeParse(body);
      expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
      expect(body.title).toBe(payload.title);
      expect(body.userId).toBe(payload.userId);
    });
  });

  test.describe('PUT /posts/:id', () => {
    test('@regression replaces a post and returns updated resource', async ({ postsClient }) => {
      const payload = { title: 'Updated Title', body: 'Updated body', userId: 1 };

      const response = await postsClient.update(1, payload);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.title).toBe(payload.title);
      expect(body.body).toBe(payload.body);
    });
  });

  test.describe('PATCH /posts/:id', () => {
    test('@regression partially updates a post title', async ({ postsClient }) => {
      const response = await postsClient.partialUpdate(1, { title: 'Patched Title' });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.title).toBe('Patched Title');
    });
  });

  test.describe('DELETE /posts/:id', () => {
    test('@regression deletes a post and returns 200', async ({ postsClient }) => {
      const response = await postsClient.remove(1);
      expect(response.status()).toBe(200);
    });
  });

  test.describe('Data-driven: multiple post IDs', () => {
    // Parameterised sweep across a spread of IDs — catches contract breaks that
    // only surface on specific records and demonstrates data-driven test patterns.
    [1, 10, 25, 50, 100].forEach((id) => {
      test(`@regression GET /posts/${id} returns valid schema and correct id`, async ({ postsClient }) => {
        const start = Date.now();
        const response = await postsClient.getById(id);
        const duration = Date.now() - start;

        expect(response.status()).toBe(200);
        expect(duration, `Response took ${duration}ms — exceeds ${SLA_MS}ms SLA`).toBeLessThan(SLA_MS);

        const body = await response.json();
        const result = PostSchema.safeParse(body);
        expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
        expect(body.id).toBe(id);
      });
    });
  });

  test.describe('Schema contract validation', () => {
    test('@regression PostSchema rejects responses with missing or invalid fields', () => {
      // Verifies the Zod schemas actively enforce constraints rather than just
      // describing shape — a silently-broken schema would never catch regressions.
      const invalidShapes = [
        { id: 1 },                                                   // missing userId, title, body
        { id: '1', userId: 1, title: 'x', body: 'y' },             // id is string not number
        { id: 1, userId: 1, title: '', body: 'y' },                 // title violates min(1)
        { id: 1, userId: 1, title: 'x', body: '' },                 // body violates min(1)
      ];

      for (const shape of invalidShapes) {
        const result = PostSchema.safeParse(shape);
        expect(
          result.success,
          `Expected PostSchema to reject: ${JSON.stringify(shape)}`
        ).toBe(false);
      }
    });

    test('@regression CreatedPostSchema requires a positive id', () => {
      // CreatedPostSchema extends PostSchema with id: z.number().positive()
      // so a server returning id=0 or a negative id would be caught here.
      const result = CreatedPostSchema.safeParse({ id: -1, userId: 1, title: 'x', body: 'y' });
      expect(result.success).toBe(false);
    });
  });

});
