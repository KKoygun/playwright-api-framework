import { APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';

/**
 * TodosClient — API client for the /todos resource.
 *
 * /todos is read-only on JSONPlaceholder but the `completed` boolean makes it
 * ideal for filter-by-status tests — a pattern not covered by Posts or Users.
 */
export class TodosClient extends BaseApiClient {
  private readonly basePath = '/todos';

  /** GET /todos — full list (200 items on JSONPlaceholder). */
  getAll(): Promise<APIResponse> {
    return this.get(this.basePath);
  }

  /** GET /todos/:id — single todo by id. */
  getById(id: number): Promise<APIResponse> {
    return this.get(`${this.basePath}/${id}`);
  }

  /** GET /todos?userId=n — todos belonging to a specific user. */
  getByUser(userId: number): Promise<APIResponse> {
    return this.get(this.basePath, { userId: String(userId) });
  }

  /** GET /todos?completed=true|false — filter by completion status. */
  getByStatus(completed: boolean): Promise<APIResponse> {
    return this.get(this.basePath, { completed: String(completed) });
  }
}
