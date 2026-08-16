import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { savePrescription, saveAppointment, saveReading, logDose } from './householdService';
import {
  INITIAL_FAMILY_MEMBERS, INITIAL_PRESCRIPTIONS,
  DEMO_PRESCRIPTION_MOM, DEMO_READINGS
} from './demoFixtures';

/**
 * "Xem thử với nhà mẫu" — dựng một nhà RIÊNG cho người đang bấm, có sẵn hai
 * hồ sơ hư cấu và vài đơn thuốc, để nhìn thấy app hoạt động ngay.
 *
 * ─────────────────────────────────────────────────────────────────
 * VÌ SAO KHÔNG DÙNG MỘT NHÀ MẪU CHUNG
 *
 * Cách hiển nhiên là dựng sẵn một nhà demo rồi ai cũng vào xem. Nhưng như vậy
 * phải phát mã của nhà đó cho người lạ, mà vào được thì SỬA được — người này
 * xoá thuốc, người kia đổi liều, và bản demo hỏng đúng lúc giám khảo mở.
 *
 * Mỗi người một nhà riêng thì không ai đụng vào ai, và không có mã dùng chung
 * nào để rò rỉ.
 *
 * ─────────────────────────────────────────────────────────────────
 * ĐÂY KHÔNG PHẢI "MOCK DATA" THEO NGHĨA BỊ CẤM
 *
 * Ràng buộc của dự án cấm giả lập TÍCH HỢP — kiểu hiện danh sách nhà thuốc
 * bịa rồi gắn nhãn "Google Maps", trong khi không gọi API nào.
 *
 * Còn đây là dữ liệu bệnh nhân hư cấu, ghi thật vào Firestore, đọc lại qua
 * đúng rules, hiển thị qua đúng đường như dữ liệu thật. Không có đường tắt nào.
 * Bệnh nhân là hư cấu vì không được lấy hồ sơ y tế của người thật ra làm demo.
 */

/** Nhãn gắn vào nhà mẫu, để sau này lọc/dọn và để UI nói rõ với người dùng. */
export const DEMO_HOUSEHOLD_FLAG = 'is_demo';

/**
 * Nạp dữ liệu hư cấu vào một nhà ĐÃ tồn tại.
 *
 * Tách riêng vì tài khoản demo (`/api/demo/login`) được backend dựng nhà sẵn
 * lúc đăng nhập lần đầu; client chỉ cần nạp nội dung vào. Mọi thao tác ghi
 * vẫn đi qua Firestore rules như người dùng thật.
 */
export async function seedDemoData(hid) {
  for (const s of INITIAL_FAMILY_MEMBERS) {
    await setDoc(doc(db, 'households', hid, 'subjects', s.id), {
      display_name: s.display_name,
      relation: s.relation || null,
      birth_year: s.birth_year || null,
      capability: s.capability || 'C2',
      conditions: s.conditions || [],
      allergies: s.allergies || [],
      avatar_color: s.avatar_color || null,
      created_at: serverTimestamp()
    }, { merge: true });
  }

  // Đánh dấu để giao diện nói thẳng "đây là dữ liệu mẫu", không để người dùng
  // tưởng là hồ sơ thật của nhà mình rồi nhập thuốc thật vào đây.
  await setDoc(
    doc(db, 'households', hid),
    { [DEMO_HOUSEHOLD_FLAG]: true, seeded_at: serverTimestamp() },
    { merge: true }
  );

  for (const p of [...INITIAL_PRESCRIPTIONS, DEMO_PRESCRIPTION_MOM]) {
    await savePrescription(hid, p.member_id, p);
  }

  // Số đo tại nhà — để màn hình sức khoẻ không trống khi vừa mở nhà mẫu
  for (const [subjectId, list] of Object.entries(DEMO_READINGS)) {
    for (const r of list) {
      await saveReading(hid, subjectId, r);
    }
  }

  // Lịch sử uống thuốc, để dòng sự kiện gia đình có nội dung. Ghi qua đúng
  // hàm logDose như khi bác bấm nút thật, không viết thẳng vào feed.
  const [ba, me] = INITIAL_FAMILY_MEMBERS;
  const firstDoc = INITIAL_PRESCRIPTIONS[0];

  for (const med of (firstDoc?.medications || []).slice(0, 2)) {
    await logDose(hid, ba.id, med, ba.display_name);
  }
  await logDose(hid, me.id, DEMO_PRESCRIPTION_MOM.medications[0], me.display_name);

  await saveAppointment(hid, INITIAL_FAMILY_MEMBERS[0].id, {
    id: 'app_demo_1',
    doctor: 'TS.BS Nguyễn Văn An — Chuyên khoa Tim Mạch',
    hospital: 'Bệnh viện Đại học Y Dược TP.HCM',
    date: '18/08/2026',
    time: '08:30 AM',
    dateTimeIso: '2026-08-18T08:30:00+07:00',
    prep_instructions: 'Nhịn ăn sáng trước 07:00 để lấy máu xét nghiệm đường huyết và mỡ máu. Mang theo sổ khám cũ và đơn thuốc hiện tại.',
    status: 'UPCOMING'
  });

  return { ok: true };
}
