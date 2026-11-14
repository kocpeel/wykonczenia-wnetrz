// Minimal static server for the built site, used for local preview and the browser test.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

export function startServer({ root, port = 0 } = {}) {
  const base = resolve(root);
  const server = createServer(async (request, response) => {
    const { pathname } = new URL(request.url, 'http://localhost');
    let file = resolve(join(base, decodeURIComponent(pathname)));
    if (file !== base && !file.startsWith(base + sep)) {
      response.writeHead(403).end();
      return;
    }
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      const body = await readFile(file);
      response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      response.end(body);
    } catch {
      const body = await readFile(join(base, '404.html')).catch(() => 'Nie znaleziono');
      response.writeHead(404, { 'content-type': TYPES['.html'] });
      response.end(body);
    }
  });
  return new Promise((done) => server.listen(port, '127.0.0.1', () => done(server)));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
  const server = await startServer({ root, port: Number(process.env.PORT ?? 4173) });
  console.log(`Strona działa pod http://localhost:${server.address().port}`);
}
