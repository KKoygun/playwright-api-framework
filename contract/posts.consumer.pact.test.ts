import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { APIRequestContext, request } from '@playwright/test';
import { MatchersV3, PactV4 } from '@pact-foundation/pact';
import { PostsClient } from '../src/api/PostsClient';
import { UsersClient } from '../src/api/UsersClient';
import { CreatedPostSchema, PostListSchema, PostSchema } from '../src/schemas/post.schema';
import { UserSchema } from '../src/schemas/user.schema';

const { like, eachLike, integer, string } = MatchersV3;

/**
 * Consumer side: records what PostsClient and UsersClient actually send and
 * which response fields the tests rely on. Running this writes
 * pacts/playwright-api-framework-jsonplaceholder.json for the provider to verify.
 */
const pact = new PactV4({
  consumer: 'playwright-api-framework',
  provider: 'jsonplaceholder',
  dir: path.resolve('pacts'),
  logLevel: 'warn',
});

const post = { id: integer(1), userId: integer(1), title: string('sunt aut facere'), body: string('quia et suscipit') };

let context: APIRequestContext | undefined;

// The real clients talk to the Pact mock server through a Playwright request context
async function clientsFor(baseURL: string) {
  context = await request.newContext({ baseURL, extraHTTPHeaders: { Accept: 'application/json' } });
  return { posts: new PostsClient(context), users: new UsersClient(context) };
}

afterEach(async () => {
  await context?.dispose();
});

describe('PostsClient contract', () => {
  it('gets a post by id', async () => {
    await pact
      .addInteraction()
      .given('post 1 exists')
      .uponReceiving('a request for post 1')
      .withRequest('GET', '/posts/1')
      .willRespondWith(200, (builder) => builder.jsonBody(like(post)))
      .executeTest(async (mockServer) => {
        const { posts } = await clientsFor(mockServer.url);
        const response = await posts.getById(1);

        expect(response.status()).toBe(200);
        expect(PostSchema.safeParse(await response.json()).success).toBe(true);
      });
  });

  it('lists the posts of a user', async () => {
    await pact
      .addInteraction()
      .given('user 1 has posts')
      .uponReceiving('a request for the posts of user 1')
      .withRequest('GET', '/posts', (builder) => builder.query({ userId: '1' }))
      .willRespondWith(200, (builder) => builder.jsonBody(eachLike(post)))
      .executeTest(async (mockServer) => {
        const { posts } = await clientsFor(mockServer.url);
        const response = await posts.getByUser(1);

        expect(response.status()).toBe(200);
        expect(PostListSchema.safeParse(await response.json()).success).toBe(true);
      });
  });

  it('gets 404 for a post that does not exist', async () => {
    await pact
      .addInteraction()
      .given('post 99999 does not exist')
      .uponReceiving('a request for a missing post')
      .withRequest('GET', '/posts/99999')
      .willRespondWith(404)
      .executeTest(async (mockServer) => {
        const { posts } = await clientsFor(mockServer.url);
        expect((await posts.getById(99999)).status()).toBe(404);
      });
  });

  it('creates a post', async () => {
    const payload = { title: 'Contract test', body: 'Created by the consumer test', userId: 1 };

    await pact
      .addInteraction()
      .uponReceiving('a request to create a post')
      .withRequest('POST', '/posts', (builder) => builder.jsonBody(like(payload)))
      .willRespondWith(201, (builder) => builder.jsonBody(like({ ...payload, id: integer(101) })))
      .executeTest(async (mockServer) => {
        const { posts } = await clientsFor(mockServer.url);
        const response = await posts.create(payload);

        expect(response.status()).toBe(201);
        expect(CreatedPostSchema.safeParse(await response.json()).success).toBe(true);
      });
  });
});

describe('UsersClient contract', () => {
  it('gets a user by id', async () => {
    await pact
      .addInteraction()
      .given('user 1 exists')
      .uponReceiving('a request for user 1')
      .withRequest('GET', '/users/1')
      .willRespondWith(200, (builder) =>
        builder.jsonBody(
          like({
            id: integer(1),
            name: string('Leanne Graham'),
            username: string('Bret'),
            email: string('Sincere@april.biz'),
            address: { street: string('Kulas Light'), suite: string('Apt. 556'), city: string('Gwenborough'), zipcode: string('92998-3874') },
            phone: string('1-770-736-8031 x56442'),
            website: string('hildegard.org'),
          })
        )
      )
      .executeTest(async (mockServer) => {
        const { users } = await clientsFor(mockServer.url);
        const response = await users.getById(1);

        expect(response.status()).toBe(200);
        expect(UserSchema.safeParse(await response.json()).success).toBe(true);
      });
  });
});
