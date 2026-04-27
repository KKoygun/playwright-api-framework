import { APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';

/**
 * CommentsClient — API client for the /comments resource.
 *
 * Covers both the top-level /comments endpoint and the nested
 * /posts/:id/comments route so tests can verify both return
 * consistent data for the same post.
 */
export class CommentsClient extends BaseApiClient {
  private readonly basePath = '/comments';

  /** GET /comments — all comments (500 on JSONPlaceholder). */
  getAll(): Promise<APIResponse> {
    return this.get(this.basePath);
  }

  /** GET /comments/:id — single comment by id. */
  getById(id: number): Promise<APIResponse> {
    return this.get(`${this.basePath}/${id}`);
  }

  /** GET /comments?postId=n — comments filtered by post via query param. */
  getByPost(postId: number): Promise<APIResponse> {
    return this.get(this.basePath, { postId: String(postId) });
  }

  /**
   * GET /posts/:postId/comments — nested route equivalent of getByPost.
   *
   * Both routes return the same data on JSONPlaceholder; testing both confirms
   * the framework correctly handles nested resource paths.
   */
  getByPostNested(postId: number): Promise<APIResponse> {
    return this.get(`/posts/${postId}/comments`);
  }
}
