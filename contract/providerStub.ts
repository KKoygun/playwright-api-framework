import * as http from 'http';
import { AddressInfo } from 'net';

interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

/**
 * A tiny stand-in for the /posts and /users endpoints. JSONPlaceholder itself
 * cannot run Pact provider states, so the contract is verified against this.
 * Data starts empty; the verifier's state handlers fill it per interaction.
 */
export function createProviderStub() {
  const posts = new Map<number, Post>();
  const users = new Map<number, Record<string, unknown>>();

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const [, resource, id] = url.pathname.split('/');

    const send = (status: number, body: unknown) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(body));
    };

    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      if (resource === 'posts' && req.method === 'GET' && !id) {
        const userId = url.searchParams.get('userId');
        return send(200, [...posts.values()].filter((p) => !userId || p.userId === Number(userId)));
      }
      if (resource === 'posts' && req.method === 'GET') {
        const found = posts.get(Number(id));
        return found ? send(200, found) : send(404, {});
      }
      if (resource === 'posts' && req.method === 'POST') {
        // JSONPlaceholder answers every create with id 101
        return send(201, { ...JSON.parse(raw || '{}'), id: 101 });
      }
      if (resource === 'users' && req.method === 'GET' && id) {
        const found = users.get(Number(id));
        return found ? send(200, found) : send(404, {});
      }
      send(404, {});
    });
  });

  return {
    posts,
    users,
    async start(): Promise<string> {
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    },
    stop: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
