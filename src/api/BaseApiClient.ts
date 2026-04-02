import { APIRequestContext, APIResponse } from '@playwright/test';

/**
 * BaseApiClient — the API equivalent of a Page Object.
 *
 * Every resource client (PostsClient, UsersClient, etc.) extends this class.
 * It centralises request execution, logging, and error handling so individual
 * clients only define their endpoints — not how to call them.
 */
export abstract class BaseApiClient {
  constructor(protected readonly request: APIRequestContext) {}

  protected async get(path: string, params?: Record<string, string>): Promise<APIResponse> {
    const url = params ? `${path}?${new URLSearchParams(params)}` : path;
    return this.request.get(url);
  }

  protected async post(path: string, body: unknown): Promise<APIResponse> {
    return this.request.post(path, { data: body });
  }

  protected async put(path: string, body: unknown): Promise<APIResponse> {
    return this.request.put(path, { data: body });
  }

  protected async patch(path: string, body: unknown): Promise<APIResponse> {
    return this.request.patch(path, { data: body });
  }

  protected async delete(path: string): Promise<APIResponse> {
    return this.request.delete(path);
  }
}
