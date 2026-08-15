import { createHash, timingSafeEqual } from 'node:crypto';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { adminAuth, fail } from '../plugins/auth.js';
import { config } from '../lib/config.js';

/**
 * Tài khoản demo dạng tên đăng nhập — dành cho giám khảo và người thử app.
 *
 * ─────────────────────────────────────────────────────────────────
 * VÌ SAO KHÔNG PHÁT TÀI KHOẢN GMAIL
 *
 * Đưa giám khảo một email + mật khẩu Gmail sẽ hỏng trong thực tế: họ đang
 * đăng nhập vào GOOGLE chứ không phải vào app này. Google thấy thiết bị lạ,
 * IP lạ → đòi mã xác minh gửi về điện thoại của chủ tài khoản. Giám khảo ngồi
 * trước màn hình "Xác minh đó là bạn" rồi bỏ cuộc. Chia sẻ tài khoản Google
 * cũng vi phạm ToS.
 *
 * Ở đây tài khoản demo là của RIÊNG app: một tên đăng nhập, một mật khẩu,
 * không dính gì tới Google. Backend kiểm tra rồi cấp Firebase custom token.
 *
 * ─────────────────────────────────────────────────────────────────
 * MỖI TÀI KHOẢN MỘT NHÀ RIÊNG
 *
 * `giamkhao1` và `giamkhao2` không dùng chung dữ liệu. Nếu dùng chung thì
 * người này xoá thuốc, người kia mở ra thấy app hỏng — đúng lúc đang chấm.
 *
 * ─────────────────────────────────────────────────────────────────
 * GIỚI HẠN CÓ CHỦ Ý
 *
 * Tài khoản demo KHÔNG kết nối được Google Calendar/Tasks, vì hai thứ đó cần
 * tài khoản Google thật của chính người dùng. Phần đó thuộc về video demo.
 *
 * Mật khẩu nằm ở biến môi trường `DEMO_PASSWORD` của Cloud Run, không nằm
 * trong repo. Đổi mật khẩu = đổi biến môi trường rồi deploy lại.
 */

const db = getFirestore();

/** Tên đăng nhập được phép. Cố định để không ai tự tạo tài khoản demo. */
const DEMO_USERNAMES = ['giamkhao1', 'giamkhao2', 'giamkhao3', 'giamkhao4', 'giamkhao5', 'dungthu'];

/** So sánh chuỗi theo thời gian hằng định, tránh dò mật khẩu qua thời gian phản hồi. */
function safeEquals(a, b) {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

export default async function demoRoutes(app) {
  /** Danh sách tài khoản demo, để giao diện đăng nhập gợi ý sẵn. KHÔNG kèm mật khẩu. */
  app.get('/accounts', async () => ({
    ok: true,
    usernames: DEMO_USERNAMES,
    enabled: !!config.demoPassword
  }));

  app.post('/login', async (request, reply) => {
    const username = String(request.body?.username || '').trim().toLowerCase();
    const password = String(request.body?.password || '');

    if (!config.demoPassword) {
      return fail(
        reply, 503, 'DEMO_DISABLED',
        'Chế độ dùng thử đang tắt. Bạn tạo nhà mới để bắt đầu nhé.'
      );
    }

    // Cùng một thông báo cho tên sai và mật khẩu sai — tách ra thì người dò
    // biết được tên nào có thật.
    const badCredentials = () => fail(
      reply, 401, 'BAD_CREDENTIALS',
      'Tên đăng nhập hoặc mật khẩu chưa đúng. Bạn kiểm tra lại nhé.'
    );

    if (!DEMO_USERNAMES.includes(username)) return badCredentials();
    if (!safeEquals(password, config.demoPassword)) return badCredentials();

    const uid = `demo_${username}`;

    // Dựng sẵn nhà cho tài khoản này nếu chưa có. Dữ liệu bệnh nhân hư cấu do
    // client nạp sau khi đăng nhập, đi qua đúng Firestore rules như người dùng
    // thật — không có đường ghi tắt nào cho bản demo.
    const existing = await db.collection('households')
      .where('demo_owner', '==', uid)
      .limit(1)
      .get();

    let householdId;

    if (existing.empty) {
      const ref = db.collection('households').doc();
      const batch = db.batch();
      batch.set(ref, {
        name: `Nhà thử nghiệm — ${username}`,
        host_uid: uid,
        demo_owner: uid,
        is_demo: true,
        created_at: FieldValue.serverTimestamp()
      });
      batch.set(ref.collection('members').doc(uid), {
        role: 'host',
        display_name: 'Người dùng thử',
        anonymous: false,
        joined_at: FieldValue.serverTimestamp()
      });
      await batch.commit();
      householdId = ref.id;
    } else {
      householdId = existing.docs[0].id;
    }

    const token = await adminAuth.createCustomToken(uid, { demo: true });

    request.log.info({ username }, 'đăng nhập tài khoản demo');
    return { ok: true, token, household_id: householdId, username };
  });
}
