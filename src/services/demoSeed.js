import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { createHousehold, savePrescription, saveAppointment } from './householdService';
import { INITIAL_FAMILY_MEMBERS, INITIAL_PRESCRIPTIONS } from './mockData';

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

export async function createDemoHousehold() {
  const res = await createHousehold({
    name: 'Nhà mẫu',
    subjects: INITIAL_FAMILY_MEMBERS.map(m => ({ ...m }))
  });

  if (!res.ok) return res;

  const hid = res.household_id;

  // Đánh dấu để giao diện nói thẳng "đây là dữ liệu mẫu", không để người dùng
  // tưởng là hồ sơ thật của nhà mình rồi nhập thuốc thật vào đây.
  await setDoc(
    doc(db, 'households', hid),
    { [DEMO_HOUSEHOLD_FLAG]: true, seeded_at: serverTimestamp() },
    { merge: true }
  );

  for (const p of INITIAL_PRESCRIPTIONS) {
    await savePrescription(hid, p.member_id, p);
  }

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

  return { ok: true, household_id: hid };
}
