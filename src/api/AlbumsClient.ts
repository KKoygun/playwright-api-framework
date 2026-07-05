import { APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';

/**
 * AlbumsClient — API client for the /albums resource and its nested /photos.
 *
 * The nested route GET /albums/:id/photos demonstrates a parent-child resource
 * pattern — verifying that photos returned all belong to the requested album
 * is a different assertion from the flat resource checks in PostsClient.
 */
export class AlbumsClient extends BaseApiClient {
  private readonly basePath = '/albums';

  /** GET /albums — full list. */
  getAll(): Promise<APIResponse> {
    return this.get(this.basePath);
  }

  /** GET /albums/:id — single album by id. */
  getById(id: number): Promise<APIResponse> {
    return this.get(`${this.basePath}/${id}`);
  }

  /** GET /albums?userId=n — albums belonging to a specific user. */
  getByUser(userId: number): Promise<APIResponse> {
    return this.get(this.basePath, { userId: String(userId) });
  }

  /** GET /albums/:id/photos — all photos nested under an album. */
  getPhotos(albumId: number): Promise<APIResponse> {
    return this.get(`${this.basePath}/${albumId}/photos`);
  }

  /** GET /albums/99999 — non-existent album for 404 coverage. */
  getNonExistent(): Promise<APIResponse> {
    return this.get(`${this.basePath}/99999`);
  }
}
