import { APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';

export interface CreatePostPayload {
  title: string;
  body: string;
  userId: number;
}

export interface UpdatePostPayload {
  title?: string;
  body?: string;
  userId?: number;
}

/**
 * PostsClient — API client for the /posts resource.
 *
 * Mirrors the Page Object Model pattern: callers interact with named methods
 * (getAll, getById, create…) rather than raw HTTP calls. Swapping the base
 * URL or auth headers is a single config change — no test changes required.
 */
export class PostsClient extends BaseApiClient {
  private readonly basePath = '/posts';

  getAll(): Promise<APIResponse> {
    return this.get(this.basePath);
  }

  getById(id: number): Promise<APIResponse> {
    return this.get(`${this.basePath}/${id}`);
  }

  getByUser(userId: number): Promise<APIResponse> {
    return this.get(this.basePath, { userId: String(userId) });
  }

  create(payload: CreatePostPayload): Promise<APIResponse> {
    return this.post(this.basePath, payload);
  }

  update(id: number, payload: CreatePostPayload): Promise<APIResponse> {
    return this.put(`${this.basePath}/${id}`, payload);
  }

  partialUpdate(id: number, payload: UpdatePostPayload): Promise<APIResponse> {
    return this.patch(`${this.basePath}/${id}`, payload);
  }

  remove(id: number): Promise<APIResponse> {
    return this.delete(`${this.basePath}/${id}`);
  }
}
