import { APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';

/**
 * UsersClient — API client for the /users resource.
 */
export class UsersClient extends BaseApiClient {
  private readonly basePath = '/users';

  getAll(): Promise<APIResponse> {
    return this.get(this.basePath);
  }

  getById(id: number): Promise<APIResponse> {
    return this.get(`${this.basePath}/${id}`);
  }

  getPostsByUser(userId: number): Promise<APIResponse> {
    return this.get(`${this.basePath}/${userId}/posts`);
  }
}
