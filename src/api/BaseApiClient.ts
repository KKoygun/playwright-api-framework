import { APIRequestContext, APIResponse } from '@playwright/test';

/**
 * BaseApiClient — the API equivalent of a Page Object.
 *
 * Every resource client (PostsClient, UsersClient, etc.) extends this class.
 * It centralises request execution, logging, and error handling so individual
 * clients only define their endpoints — not how to call them.
 *
 * Every call is logged with method, path, HTTP status, and duration so failures
 * are immediately visible in the console and Allure output without having to
 * dig through network traces.
 */
export abstract class BaseApiClient {
  constructor(protected readonly request: APIRequestContext) {}

  protected async get(path: string, params?: Record<string, string>): Promise<APIResponse> {
    const url = params ? `${path}?${new URLSearchParams(params)}` : path;
    return this.send('GET', url, () => this.request.get(url));
  }

  protected async post(path: string, body: unknown): Promise<APIResponse> {
    return this.send('POST', path, () => this.request.post(path, { data: body }));
  }

  protected async put(path: string, body: unknown): Promise<APIResponse> {
    return this.send('PUT', path, () => this.request.put(path, { data: body }));
  }

  protected async patch(path: string, body: unknown): Promise<APIResponse> {
    return this.send('PATCH', path, () => this.request.patch(path, { data: body }));
  }

  protected async delete(path: string): Promise<APIResponse> {
    return this.send('DELETE', path, () => this.request.delete(path));
  }

  // ── Private ─────────────────────────────────────────────────────────────

  private async send(
    method: string,
    path: string,
    call: () => Promise<APIResponse>
  ): Promise<APIResponse> {
    const start = Date.now();
    const response = await call();
    const ms = Date.now() - start;
    const status = response.status();
    const icon = status < 300 ? '✓' : status < 500 ? '!' : '✗';
    console.log(`  [API] ${icon} ${method} ${path} → ${status} (${ms}ms)`);
    return response;
  }
}
