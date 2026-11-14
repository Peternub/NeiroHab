import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.NEUROLAB_PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json; charset=utf-8' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url || '/', `http://127.0.0.1:${port}`).pathname);
    const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep)) { res.writeHead(403); res.end('Доступ запрещён'); return; }
    if (!(await stat(path)).isFile()) throw new Error('Нет файла');
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(await readFile(path));
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Файл не найден. Откройте главную страницу лаборатории.'); }
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `Порт ${port} уже занят. Если лаборатория запущена, откройте http://127.0.0.1:${port}/` : `Не удалось запустить лабораторию: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`НЕЙРОЛАБ: http://127.0.0.1:${port}/\nОставьте окно открытым. Для остановки нажмите Ctrl+C.`));
