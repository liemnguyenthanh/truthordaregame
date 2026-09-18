const CACHE = 'tod-673b469a9223';
const OFFLINE = '/offline.html';
self.addEventListener('install', (event) =>
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE))),
);
self.addEventListener('activate', (event) =>
  event.waitUntil(
    (async () => {
      const old = (await caches.keys()).filter((key) => key.startsWith('tod-') && key !== CACHE);
      // Keep the previous build so an already open game can finish with its old chunks.
      await Promise.all(old.slice(0, -1).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  ),
);
async function matchCached(request) {
  const current = await caches.open(CACHE);
  return (await current.match(request)) || (await caches.match(request));
}
async function cachePage(cache, route) {
  const response = await fetch(route, { cache: 'reload', headers: { Accept: 'text/html' } });
  if (!response.ok) throw new Error('Page unavailable');
  const html = await response.clone().text();
  const dependencies = [...html.matchAll(/(?:src|href)="([^"<>]+)"/g)]
    .map((match) => match[1].replaceAll('&amp;', '&'))
    .filter((url) => url.startsWith('/_next/static/'));
  await Promise.all(
    [...new Set(dependencies)].map(async (url) => {
      const asset = await fetch(url);
      if (!asset.ok) throw new Error('Asset unavailable');
      if (url.split('?')[0].endsWith('.css')) {
        const css = await asset.clone().text();
        const fonts = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)]
          .map((match) => new URL(match[1], new URL(url, self.location.origin)))
          .filter(
            (font) =>
              font.origin === self.location.origin && font.pathname.startsWith('/_next/static/'),
          );
        await Promise.all(
          [...new Set(fonts.map((font) => font.href))].map(async (font) => {
            const response = await fetch(font);
            if (!response.ok) throw new Error('Font unavailable');
            await cache.put(font, response);
          }),
        );
      }
      await cache.put(url, asset);
    }),
  );
  await cache.put(route, response);
}
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (event.data?.type === 'CACHE_AI_SHELL')
    event.waitUntil(
      (async () => {
        try {
          const cache = await caches.open(CACHE);
          await cachePage(cache, '/vi/bo-ai');
          await cachePage(cache, '/vi/tao-bo-ai');
          await cachePage(cache, '/vi');
          event.ports[0]?.postMessage({ success: true });
        } catch {
          event.ports[0]?.postMessage({ success: false });
        }
      })(),
    );
  if (event.data?.type === 'CACHE_PACK')
    event.waitUntil(
      (async () => {
        try {
          const pack = event.data.pack;
          if (
            !/^\/(?:vi\/questions\/[a-zA-Z0-9._-]+\.json|content\/questions\/[a-z0-9-]+\/[a-zA-Z0-9-]+)$/.test(
              pack.file,
            ) ||
            !/^[a-z0-9-]+$/.test(pack.slug)
          )
            throw new Error('Invalid pack');
          const cache = await caches.open(CACHE);
          for (const route of ['/vi', `/vi/choi/${pack.slug}`]) await cachePage(cache, route);
          const data = await fetch(pack.file);
          if (!data.ok) throw new Error('Pack unavailable');
          await cache.put(pack.file, data);
          event.ports[0]?.postMessage({ success: true });
        } catch {
          event.ports[0]?.postMessage({ success: false });
        }
      })(),
    );
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (
    req.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin') ||
    url.pathname === '/sw.js' ||
    url.pathname.startsWith('/vi/thanh-toan') ||
    url.pathname.startsWith('/vi/khoi-phuc')
  )
    return;
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(req);
          if (response.ok) {
            const cache = await caches.open(CACHE);
            await cache.put(url.pathname, response.clone());
          }
          return response;
        } catch {
          return (await matchCached(url.pathname)) || (await matchCached(OFFLINE));
        }
      })(),
    );
    return;
  }
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/vi/questions/') ||
    url.pathname.startsWith('/content/questions/')
  ) {
    event.respondWith(
      (async () => {
        const cached = await matchCached(req);
        if (cached) return cached;
        const response = await fetch(req);
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(req, response.clone());
        }
        return response;
      })(),
    );
  }
});
