import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

function worker() {
  const handlers: Record<string, (event: any) => void> = {};
  const requests: string[] = [];
  const writes: string[] = [];
  const cache = {
    addAll: async (urls: string[]) => {
      writes.push(...urls);
    },
    put: async (url: string) => {
      writes.push(url);
    },
    match: async (url: string) =>
      url === '/offline-en.html' ? new Response('English offline') : undefined,
  };
  runInNewContext(readFileSync('scripts/sw-template.js', 'utf8'), {
    self: {
      location: { origin: 'https://game.example' },
      addEventListener: (name: string, handler: (event: any) => void) => {
        handlers[name] = handler;
      },
    },
    URL,
    caches: { open: async () => cache, match: async () => undefined },
    fetch: async (url: string) => {
      requests.push(url);
      return new Response('<html><body>Game</body></html>');
    },
  });
  return { handlers, requests, writes };
}

test('offline pack caching uses English routes and retains content locale query', async () => {
  const { handlers, requests, writes } = worker();
  let pending: Promise<void> | undefined;
  let success = false;
  handlers.message({
    data: {
      type: 'CACHE_PACK',
      pack: { slug: 'friends', locale: 'en', file: '/content/questions/friends/abc?locale=en' },
    },
    ports: [
      {
        postMessage: (message: { success: boolean }) => {
          success = message.success;
        },
      },
    ],
    waitUntil: (work: Promise<void>) => {
      pending = work;
    },
  });
  await pending;
  assert.equal(success, true);
  assert.deepEqual(requests, [
    '/en',
    '/en/play/friends',
    '/content/questions/friends/abc?locale=en',
  ]);
  assert.ok(writes.includes('/content/questions/friends/abc?locale=en'));
});

test('service worker rejects mismatched language content and external URLs', async () => {
  for (const file of [
    '/vi/questions/example.json',
    '/content/questions/friends/abc',
    'https://other.example/en/questions/a.json',
  ]) {
    const { handlers, requests } = worker();
    let pending: Promise<void> | undefined;
    let success = true;
    handlers.message({
      data: { type: 'CACHE_PACK', pack: { slug: 'friends', locale: 'en', file } },
      ports: [
        {
          postMessage: (message: { success: boolean }) => {
            success = message.success;
          },
        },
      ],
      waitUntil: (work: Promise<void>) => {
        pending = work;
      },
    });
    await pending;
    assert.equal(success, false);
    assert.equal(requests.length, 0);
  }
});

test('service worker never intercepts checkout, restore, API or admin in either language', () => {
  const { handlers } = worker();
  for (const path of [
    '/en/checkout',
    '/en/restore',
    '/en/thanh-toan',
    '/en/khoi-phuc',
    '/vi/thanh-toan',
    '/vi/khoi-phuc',
    '/api/catalog',
    '/admin',
  ]) {
    let intercepted = false;
    handlers.fetch({
      request: { method: 'GET', url: `https://game.example${path}`, mode: 'navigate' },
      respondWith: () => {
        intercepted = true;
      },
    });
    assert.equal(intercepted, false, path);
  }
});
