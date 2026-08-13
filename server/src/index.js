import Fastify from 'fastify';
import { config, assertConfig } from './lib/config.js';
import './plugins/auth.js'; // khởi tạo Firebase Admin sớm
import aiRoutes from './routes/ai.js';
import placesRoutes from './routes/places.js';

assertConfig();

const app = Fastify({
  logger: {
    level: config.isProduction ? 'info' : 'debug',
    // Không bao giờ log nội dung y tế hay khoá
    redact: ['req.headers.authorization', 'req.body.image', 'req.body.question', 'req.body.profile']
  },
  // Ảnh đơn thuốc base64 khá nặng
  bodyLimit: 12 * 1024 * 1024
});

/* ── CORS: hẹp nhất có thể ──
 * Chạy sau Hosting rewrite thì cùng origin nên không cần CORS. Danh sách này
 * chỉ để phục vụ dev ở máy. */
app.addHook('onRequest', async (request, reply) => {
  const origin = request.headers.origin;
  if (origin && config.allowedOrigins.includes(origin)) {
    reply.header('Access-Control-Allow-Origin', origin);
    reply.header('Vary', 'Origin');
    reply.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    reply.header('Access-Control-Max-Age', '3600');
  }
  if (request.method === 'OPTIONS') {
    return reply.code(204).send();
  }
});

app.get('/api/health', async () => ({
  ok: true,
  service: 'airiser-api',
  model: config.geminiModel,
  time: new Date().toISOString()
}));

await app.register(aiRoutes, { prefix: '/api/ai' });
await app.register(placesRoutes, { prefix: '/api/places' });


/* Bắt mọi lỗi chưa xử lý về đúng hợp đồng lỗi — không rò chi tiết nội bộ */
app.setErrorHandler((err, request, reply) => {
  request.log.error({ err }, 'lỗi chưa xử lý');
  reply.code(err.statusCode && err.statusCode < 500 ? err.statusCode : 500).send({
    ok: false,
    error_code: 'INTERNAL',
    error_message: 'Máy chủ gặp sự cố. Bạn thử lại sau nhé.'
  });
});

app.setNotFoundHandler((request, reply) => {
  reply.code(404).send({
    ok: false,
    error_code: 'NOT_FOUND',
    error_message: 'Không có đường dẫn này.'
  });
});

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
  app.log.info(`airiser-api chạy ở cổng ${config.port}, model ${config.geminiModel}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
