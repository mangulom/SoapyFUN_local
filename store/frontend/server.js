const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const port = Number(process.env.PORT || 4201);
const publicDir = path.resolve(__dirname, 'dist', 'browser');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    return response.end('Método no permitido');
  }

  const urlPath = new URL(request.url, `http://${request.headers.host}`).pathname;
  const requested = urlPath === '/' ? '/index.html' : urlPath;
  let filePath = path.resolve(publicDir, `.${requested}`);

  if (!filePath.startsWith(publicDir + path.sep) && filePath !== path.join(publicDir, 'index.html')) {
    response.writeHead(403);
    return response.end('Acceso denegado');
  }

  fs.readFile(filePath, (error, data) => {
    if (error && error.code === 'ENOENT' && !path.extname(requested)) {
      filePath = path.join(publicDir, 'index.html');
      return fs.readFile(filePath, (fallbackError, fallbackData) => {
        if (fallbackError) {
          response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          return response.end('Primero ejecuta npm run build para generar el frontend.');
        }
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
        if (request.method === 'HEAD') return response.end();
        response.end(fallbackData);
      });
    }
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
      return response.end(error.code === 'ENOENT' ? 'No encontrado' : 'Error interno');
    }
    response.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    if (request.method === 'HEAD') return response.end();
    response.end(data);
  });
});

server.listen(port, () => {
  console.log(`Tienda Lúmina disponible en http://localhost:${port}`);
});
