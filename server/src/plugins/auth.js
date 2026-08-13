import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { config } from '../lib/config.js';

/**
 * Xác thực Firebase ID token.
 *
 * ⚠️ KHÔNG dùng file JSON service account. Cloud Run gắn service account trực
 * tiếp vào container, Admin SDK tự lấy qua Application Default Credentials.
 * File JSON là thứ hay bị commit nhầm lên GitHub nhất và nó bỏ qua được toàn
 * bộ Firestore Rules — không tạo ra thì không làm lộ được (doc 38 mục 11).
 */

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    projectId: config.projectId
  });
}

export const adminAuth = getAuth();

/** Lỗi trả về theo đúng hợp đồng đã thống nhất với frontend (doc 41 mục 5) */
export function fail(reply, status, code, message, detail) {
  return reply.code(status).send({
    ok: false,
    error_code: code,
    error_message: message,
    ...(detail && !config.isProduction ? { detail } : {})
  });
}

/**
 * Gắn `request.user` nếu token hợp lệ.
 * Route nào bắt buộc đăng nhập thì gọi `requireAuth` ở `preHandler`.
 */
export async function verifyIdToken(request) {
  const header = request.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;

  const token = header.slice(7).trim();
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email || null,
      emailVerified: decoded.email_verified || false,
      isAnonymous: decoded.firebase?.sign_in_provider === 'anonymous'
    };
  } catch {
    return null;
  }
}

export async function requireAuth(request, reply) {
  const user = await verifyIdToken(request);
  if (!user) {
    return fail(
      reply,
      401,
      'NOT_AUTHENTICATED',
      'Bạn cần đăng nhập để dùng tính năng này.'
    );
  }
  request.user = user;
}
