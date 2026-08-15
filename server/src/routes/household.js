import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { requireAuth, fail } from '../plugins/auth.js';

/**
 * Tạo nhà, mời người nhà, vào nhà.
 *
 * ─────────────────────────────────────────────────────────────────
 * VÌ SAO CHUYỂN LÊN SERVER
 *
 * Bản trước: **mã mời chính là id của nhà**, và Firestore rules cho phép bất
 * kỳ ai đã đăng nhập tự thêm mình vào `households/{hid}/members/{uid}`.
 * Đăng nhập ẩn danh cũng tính, mà ai mở trang cũng có phiên ẩn danh.
 *
 * Nghĩa là biết id nhà = có toàn quyền đọc và GHI hồ sơ y tế của nhà đó,
 * vĩnh viễn, không thu hồi được. Mà id đó hiện thẳng trên màn hình dưới dạng
 * "mã mời người nhà" — chỉ cần lọt vào một khung hình video demo là xong.
 *
 * Giờ mã mời là một vật riêng, có vòng đời riêng:
 *   - hết hạn sau 7 ngày
 *   - giới hạn số lần dùng
 *   - thu hồi được bất cứ lúc nào, không ảnh hưởng người đã vào
 *   - đổi mã mới không cần đụng tới id nhà
 *
 * Việc kiểm tra phải nằm ở server vì Firestore rules không đếm được số lần
 * dùng một cách an toàn — hai người bấm cùng lúc là rules cho qua cả hai.
 * Ở đây dùng transaction nên đếm đúng.
 *
 * Kèm theo: rules chuyển `members` sang chỉ đọc với client. Admin SDK bỏ qua
 * rules nên chỉ đường này ghi được thành viên.
 */

const db = getFirestore();

/**
 * Bảng chữ cái cho mã mời: bỏ 0/O/1/I/L để bác đọc qua điện thoại không nhầm.
 * 8 ký tự trên bảng 31 chữ ≈ 2^39 tổ hợp. Cộng với hạn 7 ngày, giới hạn số
 * lần dùng, và chặn đoán mò bên dưới thì đủ an toàn cho một mã dùng một lần.
 */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 8;
const INVITE_TTL_DAYS = 7;
const DEFAULT_MAX_USES = 5;

/** Số lần nhập sai tối đa trong một giờ, tính theo từng người dùng. */
const MAX_FAILED_JOINS_PER_HOUR = 10;

function generateCode() {
  const bytes = new Uint8Array(CODE_LENGTH);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join('');
}

/** Chuẩn hoá đầu vào: bỏ dấu gạch, khoảng trắng, và chữ thường. */
function normalizeCode(raw) {
  return String(raw || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
}

async function isMember(householdId, uid) {
  const snap = await db.doc(`households/${householdId}/members/${uid}`).get();
  return snap.exists;
}

/**
 * Chặn đoán mò mã mời. Không có bước này thì 2^39 tổ hợp vẫn bị quét dần
 * bằng script — mà phần thưởng là hồ sơ y tế của một gia đình.
 */
async function tooManyFailedAttempts(uid) {
  const ref = db.doc(`join_attempts/${uid}`);
  const snap = await ref.get();
  if (!snap.exists) return false;

  const { failed_count = 0, window_start } = snap.data();
  const startedAt = window_start?.toMillis?.() ?? 0;

  if (Date.now() - startedAt > 60 * 60 * 1000) return false;
  return failed_count >= MAX_FAILED_JOINS_PER_HOUR;
}

async function recordFailedAttempt(uid) {
  const ref = db.doc(`join_attempts/${uid}`);
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const startedAt = snap.exists ? (snap.data().window_start?.toMillis?.() ?? 0) : 0;

    if (!snap.exists || now - startedAt > 60 * 60 * 1000) {
      tx.set(ref, { failed_count: 1, window_start: FieldValue.serverTimestamp() });
    } else {
      tx.update(ref, { failed_count: FieldValue.increment(1) });
    }
  });
}

export default async function householdRoutes(app) {
  /* ── Tạo nhà mới. Người tạo thành chủ nhà. ── */
  app.post('/create', { preHandler: requireAuth }, async (request, reply) => {
    const { name, display_name } = request.body || {};
    const uid = request.user.uid;

    const householdRef = db.collection('households').doc();

    const batch = db.batch();
    batch.set(householdRef, {
      name: String(name || 'Nhà mình').slice(0, 60),
      host_uid: uid,
      created_at: FieldValue.serverTimestamp()
    });
    batch.set(householdRef.collection('members').doc(uid), {
      role: 'host',
      display_name: String(display_name || '').slice(0, 60) || null,
      anonymous: request.user.isAnonymous,
      joined_at: FieldValue.serverTimestamp()
    });
    await batch.commit();

    request.log.info({ household: householdRef.id }, 'đã tạo nhà mới');
    return { ok: true, household_id: householdRef.id };
  });

  /* ── Tạo mã mời. Chỉ người đã ở trong nhà mới mời được. ── */
  app.post('/invite', { preHandler: requireAuth }, async (request, reply) => {
    const { household_id, max_uses } = request.body || {};
    const uid = request.user.uid;

    if (!household_id) {
      return fail(reply, 400, 'MISSING_HOUSEHOLD', 'Thiếu mã nhà.');
    }
    if (!(await isMember(household_id, uid))) {
      // Cùng một câu trả lời cho "nhà không tồn tại" và "bạn không ở trong nhà"
      // — nếu tách ra thì người ngoài dò được nhà nào có thật.
      return fail(reply, 403, 'NOT_A_MEMBER', 'Bạn không có quyền mời người vào nhà này.');
    }

    const uses = Math.min(Math.max(Number(max_uses) || DEFAULT_MAX_USES, 1), 20);
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    // Trùng mã gần như không xảy ra, nhưng nếu trùng thì phải là lỗi rõ ràng
    // chứ không phải lặng lẽ ghi đè lên lời mời của nhà khác.
    let code;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateCode();
      const created = await db.runTransaction(async tx => {
        const ref = db.doc(`invites/${candidate}`);
        const snap = await tx.get(ref);
        if (snap.exists) return false;
        tx.set(ref, {
          household_id,
          created_by: uid,
          created_at: FieldValue.serverTimestamp(),
          expires_at: Timestamp.fromDate(expiresAt),
          max_uses: uses,
          used_count: 0,
          revoked: false
        });
        return true;
      });
      if (created) { code = candidate; break; }
    }

    if (!code) {
      return fail(reply, 503, 'CODE_GENERATION_FAILED', 'Chưa tạo được mã mời. Bạn thử lại nhé.');
    }

    return {
      ok: true,
      code,
      expires_at: expiresAt.toISOString(),
      max_uses: uses
    };
  });

  /* ── Thu hồi mã. Người đã vào nhà bằng mã này vẫn ở lại. ── */
  app.post('/invite/revoke', { preHandler: requireAuth }, async (request, reply) => {
    const code = normalizeCode(request.body?.code);
    const uid = request.user.uid;

    if (!code) return fail(reply, 400, 'MISSING_CODE', 'Thiếu mã mời.');

    const ref = db.doc(`invites/${code}`);
    const snap = await ref.get();
    if (!snap.exists) return fail(reply, 404, 'INVITE_NOT_FOUND', 'Không tìm thấy mã này.');

    if (!(await isMember(snap.data().household_id, uid))) {
      return fail(reply, 403, 'NOT_A_MEMBER', 'Bạn không có quyền thu hồi mã này.');
    }

    await ref.update({ revoked: true, revoked_at: FieldValue.serverTimestamp() });
    return { ok: true };
  });

  /* ── Dùng mã để vào nhà ── */
  app.post('/join', { preHandler: requireAuth }, async (request, reply) => {
    const code = normalizeCode(request.body?.code);
    const displayName = String(request.body?.display_name || '').slice(0, 60);
    const uid = request.user.uid;

    if (!code) {
      return fail(reply, 400, 'MISSING_CODE', 'Bạn nhập mã mời giúp nhé.');
    }

    if (await tooManyFailedAttempts(uid)) {
      return fail(
        reply, 429, 'TOO_MANY_ATTEMPTS',
        'Bạn nhập sai nhiều lần rồi. Thử lại sau một giờ nữa nhé.'
      );
    }

    // Toàn bộ kiểm tra + tăng bộ đếm nằm trong một transaction, để hai người
    // bấm cùng lúc không cùng vượt qua giới hạn số lần dùng.
    const result = await db.runTransaction(async tx => {
      const inviteRef = db.doc(`invites/${code}`);
      const snap = await tx.get(inviteRef);

      if (!snap.exists) return { error: 'INVALID' };

      const invite = snap.data();
      if (invite.revoked) return { error: 'REVOKED' };
      if (invite.expires_at?.toMillis?.() < Date.now()) return { error: 'EXPIRED' };
      if ((invite.used_count || 0) >= invite.max_uses) return { error: 'USED_UP' };

      const memberRef = db.doc(`households/${invite.household_id}/members/${uid}`);
      const already = await tx.get(memberRef);

      // Vào lại nhà mình thì không tiêu thêm một lượt của mã
      if (!already.exists) {
        tx.update(inviteRef, { used_count: FieldValue.increment(1) });
      }

      tx.set(memberRef, {
        role: 'member',
        display_name: displayName || null,
        anonymous: request.user.isAnonymous,
        joined_at: FieldValue.serverTimestamp(),
        joined_via: code
      }, { merge: true });

      return { household_id: invite.household_id };
    });

    if (result.error) {
      await recordFailedAttempt(uid);

      // Nói rõ lý do khi mã CÓ thật nhưng không dùng được — người nhà cần biết
      // để đi xin mã mới. Còn mã sai thì chỉ nói chung chung, không xác nhận
      // giúp người dò là mã nào tồn tại.
      const messages = {
        INVALID: 'Mã này không đúng. Bạn kiểm tra lại giúp nhé.',
        REVOKED: 'Mã này đã bị thu hồi. Bạn xin người nhà mã mới nhé.',
        EXPIRED: 'Mã này đã hết hạn. Bạn xin người nhà mã mới nhé.',
        USED_UP: 'Mã này đã dùng hết lượt. Bạn xin người nhà mã mới nhé.'
      };
      return fail(reply, 403, `INVITE_${result.error}`, messages[result.error]);
    }

    request.log.info({ household: result.household_id }, 'đã vào nhà bằng mã mời');
    return { ok: true, household_id: result.household_id };
  });
}
