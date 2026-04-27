import { test as base } from '@playwright/test';
import { PostsClient } from '../api/PostsClient';
import { UsersClient } from '../api/UsersClient';
import { CommentsClient } from '../api/CommentsClient';

/**
 * Extended Playwright fixtures that inject typed API clients into every test.
 *
 * Tests declare what they need:
 *   test('...', async ({ postsClient, commentsClient }) => { ... })
 *
 * This is the API-layer equivalent of using a Page Object in a UI test — the
 * test never constructs a client manually or touches the request context directly.
 */
type ApiFixtures = {
  postsClient: PostsClient;
  usersClient: UsersClient;
  commentsClient: CommentsClient;
};

export const test = base.extend<ApiFixtures>({
  postsClient: async ({ request }, use) => {
    await use(new PostsClient(request));
  },
  usersClient: async ({ request }, use) => {
    await use(new UsersClient(request));
  },
  commentsClient: async ({ request }, use) => {
    await use(new CommentsClient(request));
  },
});

export { expect } from '@playwright/test';
