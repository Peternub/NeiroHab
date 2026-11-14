import { readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const assets = (await readdir(new URL('../dist/assets/', import.meta.url))).map(file => `./assets/${file}`);
const fingerprint = createHash('sha256').update(assets.join('|')).digest('hex').slice(0, 12);
const files = ['./', './index.html', './icon.svg', './icon-192.png', './icon-512.png', './manifest.webmanifest', ...assets];
const code = `const CACHE = 'neurolab-${fingerprint}';
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('neurolab-')).slice(0, -2).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => {
  if (event.data === 'CACHE_READY') event.ports[0]?.postMessage({ ready: true });
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    if (event.request.mode === 'navigate') {
      try {
        const response = await fetch(event.request);
        if (response.ok) return response;
      } catch {}
      return await cache.match('./index.html');
    }
    const current = await cache.match(event.request);
    if (current) return current;
    const previous = await caches.match(event.request);
    if (previous) return previous;
    try { return await fetch(event.request); }
    catch { return event.request.mode === 'navigate' ? await cache.match('./index.html') : Response.error(); }
  }));
});
`;
await writeFile(new URL('../dist/sw.js', import.meta.url), code);
console.log(`Офлайн-кэш подготовлен: ${files.length} ресурсов.`);
