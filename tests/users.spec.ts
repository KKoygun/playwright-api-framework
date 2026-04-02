import { test, expect } from '../src/fixtures/apiFixtures';
import { UserListSchema, UserSchema } from '../src/schemas/user.schema';
import { PostListSchema } from '../src/schemas/post.schema';

test.describe('Users API', () => {

  test.describe('GET /users', () => {
    test('@smoke returns 200 with a list of users matching schema', async ({ usersClient }) => {
      const response = await usersClient.getAll();

      expect(response.status()).toBe(200);

      const body = await response.json();
      const result = UserListSchema.safeParse(body);
      expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });
  });

  test.describe('GET /users/:id', () => {
    test('@smoke returns a single user with valid email format', async ({ usersClient }) => {
      const response = await usersClient.getById(1);

      expect(response.status()).toBe(200);

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

});
