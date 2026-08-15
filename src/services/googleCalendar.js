/**
 * Google Calendar API — thật, không mock.
 *
 * Thay cho `workspaceService.js` bản cũ vốn chỉ `console.log` rồi trả về
 * `{success: true}` giả trong khi giao diện tuyên bố "đã đồng bộ Google
 * Calendar" (doc 33 → phát hiện lại ở doc 36 mục 1).
 *
 * Vì sao Calendar quan trọng hơn nó có vẻ: web trên iOS không gửi được thông
 * báo đẩy khi app đóng ([34](../AI-Riser-Prep/34-Testing-On-iPhone.md) mục 4).
 * Nên lời nhắc uống thuốc thật sự đến tay ba mẹ là nhờ Calendar, không phải
 * nhờ app. Mock chỗ này nghĩa là app không nhắc được gì cả.
 *
 * ⚠️ RIÊNG TƯ: sự kiện tạo ra nằm trong lịch cá nhân của người bấm kết nối —
 * thường là con cái, còn dữ liệu lại là của ba mẹ. Đó là dữ liệu sức khỏe của
 * người thứ ba. Vì vậy mặc định tiêu đề sự kiện KHÔNG ghi tên thuốc; muốn ghi
 * thì phải bật `includeMedName` (doc 23 mục 4).
 */

import { googleApiFetch } from './googleAuth';

const CAL_BASE = 'https://www.googleapis.com/calendar/v3';
const TIME_ZONE = 'Asia/Ho_Chi_Minh';

/** Cữ uống → giờ trong ngày. Đổi được ở màn hồ sơ sau này. */
export const TIME_SLOT_HOURS = {
  'Sáng': { hour: 7, minute: 0 },
  'Trưa': { hour: 11, minute: 30 },
  'Chiều': { hour: 15, minute: 0 },
  'Tối': { hour: 19, minute: 30 }
};

function slotFromTiming(timing = '') {
  const found = Object.keys(TIME_SLOT_HOURS).find(slot => timing.includes(slot));
  return found || null;
}

/** Ghép ngày + giờ thành chuỗi RFC3339 kèm offset Việt Nam (+07:00) */
function toRfc3339(date, hour, minute) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
         `T${pad(hour)}:${pad(minute)}:00+07:00`;
}

/**
 * Tạo một sự kiện lặp hằng ngày cho một loại thuốc.
 *
 * Dùng RRULE thay vì tạo N sự kiện rời: sửa hoặc xoá đợt thuốc chỉ cần một
 * thao tác, và không làm ngập lịch của người dùng.
 */
export async function createMedicationEvent({
  medication,
  memberName,
  startDate = new Date(),
  calendarId = 'primary',
  includeMedName = false
}) {
  const slot = slotFromTiming(medication.timing || medication.time_slot || '');

  if (!slot) {
    return {
      ok: false,
      error_code: 'UNKNOWN_TIME_SLOT',
      error_message: `Chưa xác định được cữ uống của "${medication.name}" nên không đặt lịch được. Bạn chọn lại cữ (Sáng/Trưa/Chiều/Tối) giúp nhé.`
    };
  }

  const days = parseInt(medication.duration_days, 10);
  if (!Number.isFinite(days) || days < 1) {
    return {
      ok: false,
      error_code: 'UNKNOWN_DURATION',
      error_message: `Chưa biết uống bao nhiêu ngày cho "${medication.name}" nên không đặt lịch được.`
    };
  }

  const { hour, minute } = TIME_SLOT_HOURS[slot];
  const start = toRfc3339(startDate, hour, minute);
  // Sự kiện dài 15 phút — đủ để hiện trên lịch mà không chiếm cả buổi
  const endMinute = minute + 15;
  const end = toRfc3339(startDate, hour + Math.floor(endMinute / 60), endMinute % 60);

  const label = includeMedName
    ? `${medication.name}${medication.strength ? ` ${medication.strength}` : ''}`
    : 'thuốc';

  const event = {
    summary: `💊 ${memberName} uống ${label} — cữ ${slot}`,
    description: [
      includeMedName ? `Thuốc: ${medication.name}` : 'Chi tiết thuốc xem trong app Nhà Mình.',
      medication.dosage ? `Liều: ${medication.dosage}` : null,
      medication.timing ? `Thời điểm: ${medication.timing}` : null,
      '',
      'Sự kiện do app Nhà Mình tạo. Xoá đợt thuốc trong app sẽ xoá luôn lịch này.'
    ].filter(Boolean).join('\n'),
    start: { dateTime: start, timeZone: TIME_ZONE },
    end: { dateTime: end, timeZone: TIME_ZONE },
    recurrence: [`RRULE:FREQ=DAILY;COUNT=${days}`],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 0 },
        { method: 'popup', minutes: 10 } // nhắc trước 10 phút để kịp chuẩn bị
      ]
    },
    // Đánh dấu nguồn để tìm lại và dọn dẹp sau này
    extendedProperties: {
      private: {
        airiser_source: 'medication',
        airiser_med_id: medication.id || '',
        airiser_member: memberName
      }
    }
  };

  const res = await googleApiFetch(`${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    body: JSON.stringify(event)
  });

  if (!res.ok) return res;

  return {
    ok: true,
    event_id: res.data.id,
    html_link: res.data.htmlLink,
    summary: res.data.summary,
    slot,
    occurrences: days
  };
}

/**
 * Đồng bộ cả một đơn thuốc.
 *
 * Trả về kết quả TỪNG THUỐC. Không gộp thành một chữ "thành công" duy nhất —
 * 3 thuốc mà chỉ 2 lên được lịch thì người dùng phải biết thuốc nào trượt.
 */
export async function syncPrescriptionToCalendar(prescription, memberName, options = {}) {
  const meds = prescription.medications || [];
  const results = [];

  for (const med of meds) {
    const res = await createMedicationEvent({
      medication: med,
      memberName,
      startDate: prescription.start_date ? new Date(prescription.start_date) : new Date(),
      ...options
    });
    results.push({ medication: med.name, ...res });
  }

  const succeeded = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);

  return {
    ok: failed.length === 0,
    partial: succeeded.length > 0 && failed.length > 0,
    created: succeeded.length,
    total: meds.length,
    results,
    failed
  };
}

/** Sự kiện tái khám (một lần, không lặp) */
export async function createAppointmentEvent({
  title,
  facility,
  dateTimeIso,
  notes = '',
  calendarId = 'primary'
}) {
  if (!dateTimeIso) {
    return { ok: false, error_code: 'NO_DATE', error_message: 'Chưa có ngày giờ tái khám.' };
  }

  const start = new Date(dateTimeIso);
  if (Number.isNaN(start.getTime())) {
    return { ok: false, error_code: 'BAD_DATE', error_message: 'Ngày giờ tái khám không hợp lệ.' };
  }
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const res = await googleApiFetch(`${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    body: JSON.stringify({
      summary: `🏥 ${title}`,
      location: facility || undefined,
      description: [notes, '', 'Tạo bởi app Nhà Mình.'].filter(Boolean).join('\n'),
      start: { dateTime: start.toISOString(), timeZone: TIME_ZONE },
      end: { dateTime: end.toISOString(), timeZone: TIME_ZONE },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 24 * 60 },  // nhắc trước 1 ngày
          { method: 'popup', minutes: 60 }
        ]
      },
      extendedProperties: { private: { airiser_source: 'appointment' } }
    })
  });

  if (!res.ok) return res;
  return { ok: true, event_id: res.data.id, html_link: res.data.htmlLink };
}

/** Liệt kê các sự kiện do app này tạo — để kiểm chứng và để dọn dẹp */
export async function listAiriserEvents({ calendarId = 'primary', maxResults = 50 } = {}) {
  const params = new URLSearchParams({
    privateExtendedProperty: 'airiser_source=medication',
    maxResults: String(maxResults),
    singleEvents: 'false',
    orderBy: 'updated'
  });

  const res = await googleApiFetch(`${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
  if (!res.ok) return res;

  return {
    ok: true,
    events: (res.data.items || []).map(e => ({
      id: e.id,
      summary: e.summary,
      recurrence: e.recurrence,
      html_link: e.htmlLink,
      med_id: e.extendedProperties?.private?.airiser_med_id
    }))
  };
}

export async function deleteEvent(eventId, calendarId = 'primary') {
  return googleApiFetch(
    `${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: 'DELETE' }
  );
}

/** Kiểm tra kết nối bằng một lệnh đọc nhẹ — dùng cho nút "Kiểm tra kết nối" */
export async function testCalendarConnection() {
  const res = await googleApiFetch(`${CAL_BASE}/users/me/calendarList?maxResults=1`);
  if (!res.ok) return res;
  return {
    ok: true,
    calendar_count: (res.data.items || []).length,
    primary: res.data.items?.[0]?.summary || null
  };
}
