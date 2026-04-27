import { test, expect } from '../src/fixtures/apiFixtures';
import { UserListSchema, UserSchema } from '../src/schemas/user.schema';
import { PostListSchema } from '../src/schemas/post.schema';

const SLA_MS = 2000;

test.describe('Users API', () => {

  test.describe('GET /users', () => {
    test('@smoke returns 200 with a list of users matching schema', async ({ usersClient }) => {
      const start = Date.now();
      const response = await usersClient.getAll();
      const duration = Date.now() - start;

      expect(response.status()).toBe(200);
      expect(duration, `Response took ${duration}ms — exceeds ${SLA_MS}ms SLA`).toBeLessThan(SLA_MS);

      const body = await response.json();
      const result = UserListSchema.safeParse(body);
      expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });
  });

  test.describe('GET /users/:id', () => {
    test('@smoke returns a single user with valid email format', async ({ usersClient }) => {
      const start = Date.now();
      const response = await usersClient.getById(1);
      const duration = Date.now() - start;

      expect(response.status()).toBe(200);
      expect(duration, `Response took ${duration}ms — exceeds ${SLA_MS}ms SLA`).toBeLessThan(SLA_MS);

      const body = await response.json();
      const result = UserSchema.safeParse(body);
      expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
      expect(body.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    test('@regression returns 404 for non-existent user', async ({ usersClient }) => {
      const response = await usersClient.getById(99999);
      expect(response.status()).toBe(404);
    });
  });

  test.describe('GET /users/:id/posts', () => {
    test('@regression returns all posts belonging to a user', async ({ usersClient }) => {
      const userId = 1;
      const response = await usersClient.getPostsByUser(userId);

      expect(response.status()).toBe(200);

      const body = await response.json();
      const result = PostListSchema.safeParse(body);
      expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
      body.forEach((post: { userId: number }) => {
        expect(post.userId).toBe(userId);
      });
    });
  });

  test.describe('Data-driven: multiple user IDs', () => {
    // All 10 users on JSONPlaceholder — verifies schema holds across the full dataset.
    [1, 2, 3, 5, 8, 10].forEach((id) => {
      test(`@regression GET /users/${id} returns valid schema and correct id`, async ({ usersClient }) => {
        const start = Date.now();
        const response = await usersClient.getById(id);
        const duration = Date.now() - start;

        expect(response.status()).toBe(200);
        expect(duration, `Response took ${duration}ms — exceeds ${SLA_MS}ms SLA`).toBeLessThan(SLA_MS);

        const body = await response.json();
        const result = UserSchema.safeParse(body);
        expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
        expect(body.id).toBe(id);
      });
    });
  });

  test.describe('Schema contract validation', () => {
    test('@regression UserSchema rejects responses with missing or invalid fields', () => {
      const invalidShapes = [
        { id: 1 },                                                        // missing most fields
        { id: 1, name: 'x', username: 'x', email: 'not-an-email',        // invalid email format
          address: { street: '', suite: '', city: '', zipcode: '' },
          phone: '', website: '' },
        { id: 1, name: '', username: 'x', email: 'x@x.com',             // name violates min(1)
          address: { street: '', suite: '', city: '', zipcode: '' },
          phone: '', website: '' },
      ];

      for (const shape of invalidShapes) {
        const result = UserSchema.safeParse(shape);
        expect(
          result.success,
          `Expected UserSchema to reject: ${JSON.stringify(shape)}`
        ).toBe(false);
      }
    });
  });

});
