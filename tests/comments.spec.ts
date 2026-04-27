import { test, expect } from '../src/fixtures/apiFixtures';
import { CommentListSchema, CommentSchema } from '../src/schemas/comment.schema';

const SLA_MS = 2000;

test.describe('Comments API', () => {

  test.describe('GET /comments', () => {
    test('@smoke returns 200 with a list of comments matching schema', async ({ commentsClient }) => {
      const start = Date.now();
      const response = await commentsClient.getAll();
      const duration = Date.now() - start;

      expect(response.status()).toBe(200);
      expect(duration, `Response took ${duration}ms — exceeds ${SLA_MS}ms SLA`).toBeLessThan(SLA_MS);

      const body = await response.json();
      const result = CommentListSchema.safeParse(body);
      expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });
  });

  test.describe('GET /comments/:id', () => {
    test('@smoke returns a single comment matching schema', async ({ commentsClient }) => {
      const start = Date.now();
      const response = await commentsClient.getById(1);
      const duration = Date.now() - start;

      expect(response.status()).toBe(200);
      expect(duration, `Response took ${duration}ms — exceeds ${SLA_MS}ms SLA`).toBeLessThan(SLA_MS);

      const body = await response.json();
      const result = CommentSchema.safeParse(body);
      expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
      expect(body.id).toBe(1);

      // email field validated as a real email address by Zod schema
      expect(body.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    test('@regression returns 404 for non-existent comment', async ({ commentsClient }) => {
      const response = await commentsClient.getById(99999);
      expect(response.status()).toBe(404);
    });
  });

  test.describe('GET /comments?postId=n', () => {
    test('@regression filters comments by postId query param', async ({ commentsClient }) => {
      const postId = 1;
      const response = await commentsClient.getByPost(postId);

      expect(response.status()).toBe(200);

      const body = await response.json();
      const result = CommentListSchema.safeParse(body);
      expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
      expect(body.length).toBeGreaterThan(0);

      // Every returned comment must belong to the requested post
      body.forEach((comment: { postId: number }) => {
        expect(comment.postId).toBe(postId);
      });
    });
  });

  test.describe('GET /posts/:id/comments (nested route)', () => {
    test('@regression nested route returns same data as query-param route', async ({ commentsClient }) => {
      const postId = 1;

      const [queryResponse, nestedResponse] = await Promise.all([
        commentsClient.getByPost(postId),
        commentsClient.getByPostNested(postId),
      ]);

      expect(queryResponse.status()).toBe(200);
      expect(nestedResponse.status()).toBe(200);

      const queryBody  = await queryResponse.json();
      const nestedBody = await nestedResponse.json();

      // Both routes must return the same number of comments for the same post
      expect(nestedBody.length).toBe(queryBody.length);

      // Both responses must pass schema validation
      expect(CommentListSchema.safeParse(nestedBody).success).toBe(true);

      // All comments belong to the requested post
      nestedBody.forEach((comment: { postId: number }) => {
        expect(comment.postId).toBe(postId);
      });
    });
  });

  test.describe('Data-driven: multiple comment IDs', () => {
    // Fetch several known comment IDs and verify schema + ID integrity for each
    [1, 10, 50, 100, 250].forEach((id) => {
      test(`@regression GET /comments/${id} returns valid schema and correct id`, async ({ commentsClient }) => {
        const start = Date.now();
        const response = await commentsClient.getById(id);
        const duration = Date.now() - start;

        expect(response.status()).toBe(200);
        expect(duration, `Response took ${duration}ms — exceeds ${SLA_MS}ms SLA`).toBeLessThan(SLA_MS);

        const body = await response.json();
        const result = CommentSchema.safeParse(body);
        expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
        expect(body.id).toBe(id);
      });
    });
  });

  test.describe('Schema contract validation', () => {
    test('@regression CommentSchema rejects responses with missing or invalid fields', () => {
      const invalidShapes = [
        { id: 1 },                                               // missing all required fields
        { postId: 1, id: 1, name: '', email: 'x@x.com', body: 'y' }, // empty name (min(1))
        { postId: 1, id: 1, name: 'x', email: 'not-an-email', body: 'y' }, // invalid email
        { postId: '1', id: 1, name: 'x', email: 'x@x.com', body: 'y' }, // postId string not number
      ];

      for (const shape of invalidShapes) {
        const result = CommentSchema.safeParse(shape);
        expect(
          result.success,
          `Expected schema to reject: ${JSON.stringify(shape)}`
        ).toBe(false);
      }
    });
  });

});
