import { test, expect } from '../src/fixtures/apiFixtures';
import {
  AlbumListSchema,
  AlbumSchema,
  PhotoListSchema,
  PhotoSchema,
} from '../src/schemas/album.schema';

const SLA_MS = 2000;

test.describe('Albums API', () => {

  test.describe('GET /albums', () => {
    test('@smoke returns 200 with a list of albums matching schema', async ({ albumsClient }) => {
      const start = Date.now();
      const response = await albumsClient.getAll();
      const duration = Date.now() - start;

      expect(response.status()).toBe(200);
      expect(duration, `Response took ${duration}ms — exceeds ${SLA_MS}ms SLA`).toBeLessThan(SLA_MS);

      const body = await response.json();
      const result = AlbumListSchema.safeParse(body);
      expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });
  });

  test.describe('GET /albums/:id', () => {
    test('@smoke returns a single album matching schema', async ({ albumsClient }) => {
      const start = Date.now();
      const response = await albumsClient.getById(1);
      const duration = Date.now() - start;

      expect(response.status()).toBe(200);
      expect(duration, `Response took ${duration}ms — exceeds ${SLA_MS}ms SLA`).toBeLessThan(SLA_MS);

      const body = await response.json();
      const result = AlbumSchema.safeParse(body);
      expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
      expect(body.id).toBe(1);
    });

    test('@regression returns 404 for a non-existent album', async ({ albumsClient }) => {
      const response = await albumsClient.getNonExistent();
      expect(response.status()).toBe(404);
    });
  });

  test.describe('GET /albums?userId=n', () => {
    test('@regression returns albums belonging to a specific user', async ({ albumsClient }) => {
      const userId = 1;
      const response = await albumsClient.getByUser(userId);

      expect(response.status()).toBe(200);

      const body = await response.json();
      const result = AlbumListSchema.safeParse(body);
      expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
      expect(body.length).toBeGreaterThan(0);

      body.forEach((album: { userId: number }) => {
        expect(album.userId).toBe(userId);
      });
    });
  });

  test.describe('GET /albums/:id/photos (nested resource)', () => {
    test('@smoke returns photos belonging to an album with valid URLs', async ({ albumsClient }) => {
      const albumId = 1;
      const start = Date.now();
      const response = await albumsClient.getPhotos(albumId);
      const duration = Date.now() - start;

      expect(response.status()).toBe(200);
      expect(duration, `Response took ${duration}ms — exceeds ${SLA_MS}ms SLA`).toBeLessThan(SLA_MS);

      const body = await response.json();
      const result = PhotoListSchema.safeParse(body);
      expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
      expect(body.length).toBeGreaterThan(0);

      // Every photo must belong to the requested album
      body.forEach((photo: { albumId: number }) => {
        expect(photo.albumId).toBe(albumId);
      });
    });

    test('@regression photos from different albums do not overlap', async ({ albumsClient }) => {
      const [res1, res2] = await Promise.all([
        albumsClient.getPhotos(1),
        albumsClient.getPhotos(2),
      ]);

      const photos1: Array<{ id: number }> = await res1.json();
      const photos2: Array<{ id: number }> = await res2.json();

      const ids1 = new Set(photos1.map((p) => p.id));
      const overlap = photos2.filter((p) => ids1.has(p.id));

      expect(overlap).toHaveLength(0);
    });
  });

  test.describe('Data-driven: multiple album IDs', () => {
    [1, 5, 10, 50, 100].forEach((id) => {
      test(`@regression GET /albums/${id} returns valid schema`, async ({ albumsClient }) => {
        const start = Date.now();
        const response = await albumsClient.getById(id);
        const duration = Date.now() - start;

        expect(response.status()).toBe(200);
        expect(duration, `Response took ${duration}ms — exceeds ${SLA_MS}ms SLA`).toBeLessThan(SLA_MS);

        const body = await response.json();
        const result = AlbumSchema.safeParse(body);
        expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
        expect(body.id).toBe(id);
      });
    });
  });

  test.describe('Schema contract validation', () => {
    test('@regression AlbumSchema rejects responses with missing or invalid fields', () => {
      const invalidShapes = [
        { id: 1 },                                        // missing userId, title
        { userId: 1, id: 1, title: '' },                 // title violates min(1)
        { userId: '1', id: 1, title: 'x' },              // userId is string not number
      ];

      for (const shape of invalidShapes) {
        const result = AlbumSchema.safeParse(shape);
        expect(result.success, `Expected AlbumSchema to reject: ${JSON.stringify(shape)}`).toBe(false);
      }
    });

    test('@regression PhotoSchema validates url and thumbnailUrl as proper URLs', () => {
      const validPhoto = {
        albumId: 1, id: 1, title: 'x',
        url: 'https://via.placeholder.com/600/92c952',
        thumbnailUrl: 'https://via.placeholder.com/150/92c952',
      };
      expect(PhotoSchema.safeParse(validPhoto).success).toBe(true);

      const invalidShapes = [
        { ...validPhoto, url: 'not-a-url' },             // url fails z.string().url()
        { ...validPhoto, thumbnailUrl: 'not-a-url' },    // thumbnailUrl fails z.string().url()
        { ...validPhoto, url: '' },                       // empty string is not a URL
      ];

      for (const shape of invalidShapes) {
        const result = PhotoSchema.safeParse(shape);
        expect(result.success, `Expected PhotoSchema to reject: ${JSON.stringify(shape)}`).toBe(false);
      }
    });
  });

});
