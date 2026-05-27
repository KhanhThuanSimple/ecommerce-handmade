const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Proxy /api -> Spring Boot (tránh lỗi CORS khi dev).
 * Chạy: backend port 8080, frontend port 3000.
 */
module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080',
      changeOrigin: true,
    })
  );
};
