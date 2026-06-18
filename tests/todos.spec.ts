import { test, expect } from '../src/fixtures/apiFixtures';
import { TodoListSchema, TodoSchema } from '../src/schemas/todo.schema';

const SLA_MS = 2000;

test.describe('Todos API', () => {

  test.describe('GET /todos', () => {
    test('@smoke returns 200 with a list of todos matching schema', async ({ todosClient }) => {
      const start = Date.now();
      const response = await todosClient.getAll();
      const duration = Date.now() - start;

      expect(response.status()).toBe(200);
      expect(duration, `Response took ${duration}ms — exceeds ${SLA_MS}ms SLA`).toBeLessThan(SLA_MS);

      const body = await response.json();
      const result = TodoListSchema.safeParse(body);
      expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });
  });

  test.describe('GET /todos/:id', () => {
    test('@smoke returns a single todo matching schema', async ({ todosClient }) => {
      const start = Date.now();
      const response = await todosClient.getById(1);
      const duration = Date.now() - start;

      expect(response.status()).toBe(200);
      expect(duration, `Response took ${duration}ms — exceeds ${SLA_MS}ms SLA`).toBeLessThan(SLA_MS);

      const body = await response.json();
      const result = TodoSchema.safeParse(body);
      expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
      expect(body.id).toBe(1);
      expect(typeof body.completed).toBe('boolean');
    });

    test('@regression returns 404 for a non-existent todo', async ({ todosClient }) => {
      const response = await todosClient.getById(99999);
      expect(response.status()).toBe(404);
    });
  });

  test.describe('GET /todos?userId=n', () => {
    test('@regression returns todos belonging to a specific user', async ({ todosClient }) => {
      const userId = 1;
      const response = await todosClient.getByUser(userId);

      expect(response.status()).toBe(200);

      const body = await response.json();
      const result = TodoListSchema.safeParse(body);
      expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
      expect(body.length).toBeGreaterThan(0);

      body.forEach((todo: { userId: number }) => {
        expect(todo.userId).toBe(userId);
      });
    });
  });

  test.describe('GET /todos?completed=true|false', () => {
    test('@smoke completed filter returns only finished todos', async ({ todosClient }) => {
      const response = await todosClient.getByStatus(true);

      expect(response.status()).toBe(200);

      const body = await response.json();
      const result = TodoListSchema.safeParse(body);
      expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
      expect(body.length).toBeGreaterThan(0);

      body.forEach((todo: { completed: boolean }) => {
        expect(todo.completed).toBe(true);
      });
    });

    test('@regression active filter returns only incomplete todos', async ({ todosClient }) => {
      const response = await todosClient.getByStatus(false);

      expect(response.status()).toBe(200);

      const body = await response.json();
      const result = TodoListSchema.safeParse(body);
      expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
      expect(body.length).toBeGreaterThan(0);

      body.forEach((todo: { completed: boolean }) => {
        expect(todo.completed).toBe(false);
      });
    });

    test('@regression completed and active sets are mutually exclusive', async ({ todosClient }) => {
      const [completedRes, activeRes] = await Promise.all([
        todosClient.getByStatus(true),
        todosClient.getByStatus(false),
      ]);

      const completed: Array<{ id: number }> = await completedRes.json();
      const active: Array<{ id: number }> = await activeRes.json();

      const completedIds = new Set(completed.map((t) => t.id));
      const overlap = active.filter((t) => completedIds.has(t.id));

      expect(overlap).toHaveLength(0);
    });
  });

  test.describe('Data-driven: multiple todo IDs', () => {
    [1, 20, 50, 100, 150].forEach((id) => {
      test(`@regression GET /todos/${id} returns valid schema`, async ({ todosClient }) => {
        const start = Date.now();
        const response = await todosClient.getById(id);
        const duration = Date.now() - start;

        expect(response.status()).toBe(200);
        expect(duration, `Response took ${duration}ms — exceeds ${SLA_MS}ms SLA`).toBeLessThan(SLA_MS);

        const body = await response.json();
        const result = TodoSchema.safeParse(body);
        expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
        expect(body.id).toBe(id);
      });
    });
  });

  test.describe('Schema contract validation', () => {
    test('@regression TodoSchema rejects responses with missing or invalid fields', () => {
      const invalidShapes = [
        { id: 1 },                                                          // missing all fields
        { userId: 1, id: 1, title: 'x', completed: 'true' },              // completed is string not boolean
        { userId: 1, id: 1, title: '', completed: false },                 // title violates min(1)
        { userId: '1', id: 1, title: 'x', completed: false },             // userId is string not number
      ];

      for (const shape of invalidShapes) {
        const result = TodoSchema.safeParse(shape);
        expect(
          result.success,
          `Expected TodoSchema to reject: ${JSON.stringify(shape)}`
        ).toBe(false);
      }
    });
  });

});
