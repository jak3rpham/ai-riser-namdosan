/**
 * Lớp điều phối đồng bộ sang Google Workspace.
 *
 * ⚠️ File này TRƯỚC ĐÂY là mock hoàn toàn: `console.log` rồi `return {success:
 * true, events_created: n}` mà không gọi API nào, trong khi giao diện báo
 * "Lịch nhắc đã đồng bộ vào Google Calendar". Giờ nó gọi API thật và
 * **trả về đúng chuyện đã xảy ra**, kể cả khi thất bại một phần.
 */

import { isGoogleConnected } from './googleAuth';
import { syncPrescriptionToCalendar as calendarSync } from './googleCalendar';
import { createRefillTask as tasksCreateRefill } from './googleTasks';

/**
 * Đồng bộ đơn thuốc sang Calendar + tạo việc mua thêm thuốc trong Tasks.
 *
 * Trả về `{ skipped: true }` khi chưa kết nối Google — đây KHÔNG phải lỗi,
 * app vẫn dùng được ngoại tuyến, chỉ là không có lời nhắc từ Google.
 */
export async function syncPrescriptionToWorkspace(prescription, memberName, options = {}) {
  if (!isGoogleConnected()) {
    return {
      skipped: true,
      reason: 'NOT_CONNECTED',
      message: 'Chưa kết nối tài khoản Google nên chưa tạo được lịch nhắc. Đơn thuốc vẫn được lưu trong app.'
    };
  }

  const calendar = await calendarSync(prescription, memberName, options);

  // Việc mua thêm thuốc: chỉ tạo cho thuốc sắp hết nhất trong đơn
  let tasks = null;
  const meds = prescription.medications || [];
  if (meds.length) {
    const soonest = meds.reduce((min, m) => {
      const r = Number.isFinite(m.est_remaining) ? m.est_remaining : m.duration_days;
      const minR = Number.isFinite(min.est_remaining) ? min.est_remaining : min.duration_days;
      return (r ?? 999) < (minR ?? 999) ? m : min;
    }, meds[0]);

    const remaining = Number.isFinite(soonest.est_remaining)
      ? soonest.est_remaining
      : parseInt(soonest.duration_days, 10);

    tasks = await tasksCreateRefill({
      medicationName: soonest.name,
      // Nhắc trước 3 ngày để kịp ra hiệu thuốc
      remainingDays: Math.max(1, (Number.isFinite(remaining) ? remaining : 7) - 3),
      memberName,
      includeMedName: options.includeMedName
    });
  }

  return {
    skipped: false,
    calendar,
    tasks,
    ok: calendar.ok && (tasks === null || tasks.ok)
  };
}

/** Dựng câu thông báo cho người dùng từ kết quả đồng bộ — nói đúng chuyện đã xảy ra */
export function describeSyncResult(result) {
  if (!result) return null;

  if (result.skipped) {
    return { tone: 'info', text: result.message };
  }

  const { calendar, tasks } = result;

  if (calendar.ok && (!tasks || tasks.ok)) {
    return {
      tone: 'success',
      text: `Đã tạo ${calendar.created} lịch nhắc trong Google Calendar${tasks?.ok ? ' và 1 việc mua thêm thuốc trong Google Tasks' : ''}.`
    };
  }

  if (calendar.partial) {
    const names = calendar.failed.map(f => f.medication).join(', ');
    return {
      tone: 'warning',
      text: `Tạo được ${calendar.created}/${calendar.total} lịch nhắc. Chưa đặt được cho: ${names}. Lý do: ${calendar.failed[0]?.error_message}`
    };
  }

  return {
    tone: 'error',
    text: `Chưa tạo được lịch nhắc. ${calendar.failed?.[0]?.error_message || calendar.error_message || ''}`
  };
}
