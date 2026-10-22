import * as path from 'path';
import { afterAll, beforeAll, it } from 'vitest';
import { Verifier } from '@pact-foundation/pact';
import { createProviderStub } from './providerStub';

/**
 * Provider side: replays every interaction in the pact file against the stub and
 * fails if any response breaks what the consumer expects. Run the consumer test first.
 */
const stub = createProviderStub();
let baseUrl = '';

beforeAll(async () => {
  baseUrl = await stub.start();
});

afterAll(async () => {
  await stub.stop();
});

it('the provider honours the consumer contract', async () => {
  await new Verifier({
    provider: 'jsonplaceholder',
    providerBaseUrl: baseUrl,
    pactUrls: [path.resolve('pacts', 'playwright-api-framework-jsonplaceholder.json')],
    logLevel: 'warn',
    stateHandlers: {
      'post 1 exists': async () => {
        stub.posts.set(1, { id: 1, userId: 1, title: 'sunt aut facere', body: 'quia et suscipit' });
      },
      'user 1 has posts': async () => {
        stub.posts.set(1, { id: 1, userId: 1, title: 'sunt aut facere', body: 'quia et suscipit' });
        stub.posts.set(2, { id: 2, userId: 1, title: 'qui est esse', body: 'est rerum tempore' });
      },
      'post 99999 does not exist': async () => {
        stub.posts.delete(99999);
      },
      'no posts exist': async () => {
        stub.posts.clear();
      },
      'user 1 exists': async () => {
        stub.users.set(1, {
          id: 1,
          name: 'Leanne Graham',
          username: 'Bret',
          email: 'Sincere@april.biz',
          address: { street: 'Kulas Light', suite: 'Apt. 556', city: 'Gwenborough', zipcode: '92998-3874' },
          phone: '1-770-736-8031 x56442',
          website: 'hildegard.org',
        });
      },
    },
  }).verifyProvider();
});
