import { test, expect } from '../src/fixtures/apiFixtures';
import { PostListSchema, PostSchema, CreatedPostSchema } from '../src/schemas/post.schema';

test.describe('Posts API', () => {

  test.describe('GET /posts', () => {
    test('@smoke returns 200 with a list of posts matching schema', async ({ postsClient }) => {
      const response = await postsClient.getAll();

      expect(response.status()).toBe(200);

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
      const response = await postsClient.getById(1);

      expect(response.status()).toBe(200);

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

      const response = await postsClient.create(payload);

      expect(response.status()).toBe(201);

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

});
