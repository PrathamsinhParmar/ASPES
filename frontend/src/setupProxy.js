const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Webpack Dev Server Proxy Configuration for ASPES
 * 
 * Proxies API requests, static uploads, docs, and WebSockets directly to the
 * FastAPI backend running on port 8000. This enables seamless access through
 * Cloudflare Tunnels (trycloudflare.com), mobile devices, and local dev without
 * Mixed Content or cross-origin restrictions.
 */
module.exports = function (app) {
  app.use(
    createProxyMiddleware(
      ['/api', '/uploads', '/docs', '/redoc', '/openapi.json'],
      {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        ws: true,
        logLevel: 'warn',
        onError: (err, req, res) => {
          if (res && typeof res.writeHead === 'function') {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                detail:
                  'Backend server is not reachable on port 8000. Please verify the backend is running via start_aspes.bat.',
              })
            );
          }
        },
      }
    )
  );
};
