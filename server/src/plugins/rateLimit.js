import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { config } from '../lib/config.js';
import { fail } from './auth.js';

/**
 * Hạn mức gọi AI theo từng người dùng.
 *
 * Mối đe doạ T10 ở doc 38: nếu không có cái này thì backend trở thành cổng gọi
 * Gemini miễn phí cho bất kỳ ai đăng nhập được — tức là ta chỉ chuyển vấn đề
 * lộ khoá thành vấn đề bị lạm dụng, chứ không giải quyết được gì.
 *
 * Đếm trong Firestore để nhiều instance Cloud Run dùng chung một con số.
 * Bộ đếm phút cho nhanh, bộ đếm ngày cho trần chi phí.
 */

const db = getFirestore();

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD theo UTC
}

function minuteKey() {
  return new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
}

export async function enforceAiQuota(request, reply) {
  const uid = request.user?.uid;
  if (!uid) return; // requireAuth đã chặn trước đó

  const ref = db.collection('usage_counters').doc(uid);

  try {
    const result = await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      const data = snap.exists ? snap.data() : {};

      const dKey = todayKey();
      const mKey = minuteKey();
      const day = data.day === dKey ? (data.dayCount || 0) : 0;
      const minute = data.minute === mKey ? (data.minuteCount || 0) : 0;

      if (day >= config.limits.aiCallsPerUserPerDay) {
        return { blocked: 'DAY', day, minute };
      }
      if (minute >= config.limits.aiCallsPerUserPerMinute) {
        return { blocked: 'MINUTE', day, minute };
      }

      tx.set(ref, {
        day: dKey,
        dayCount: day + 1,
        minute: mKey,
        minuteCount: minute + 1,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      return { blocked: null, day: day + 1, minute: minute + 1 };
    });

    if (result.blocked === 'DAY') {
      return fail(reply, 429, 'DAILY_LIMIT',
        `Hôm nay đã dùng hết ${config.limits.aiCallsPerUserPerDay} lượt AI. Mai dùng tiếp nhé, hoặc nhập tay.`);
    }
    if (result.blocked === 'MINUTE') {
      return fail(reply, 429, 'RATE_LIMIT',
        'Bạn thao tác hơi nhanh. Chờ một chút rồi thử lại nhé.');
    }

    request.aiUsage = result;
  } catch (err) {
    // Không đếm được thì CHO QUA, nhưng ghi log.
    // Chặn người dùng chỉ vì bộ đếm hỏng là đánh đổi sai — trần chi phí
    // thật sự nằm ở budget cap phía Google Cloud.
    request.log.error({ err }, 'không cập nhật được bộ đếm hạn mức');
  }
}
