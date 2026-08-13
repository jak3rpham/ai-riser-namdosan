import {
  collection, doc, setDoc, getDoc, addDoc, deleteDoc,
  onSnapshot, query, orderBy, limit, serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { ensureUser } from './apiClient';

/**
 * Lưu trữ thật bằng Firestore, đồng bộ tức thời giữa web con cái và app ba mẹ.
 *
 * ⚠️ Trước file này, toàn bộ dữ liệu nằm trong `useState` — tải lại trang là
 * mất sạch. Đó là lý do app vẫn là bản trình diễn chứ chưa dùng được thật.
 *
 * Mô hình theo doc 39 mục 2:
 *   households/{hid}
 *     members/{uid}                 ai đang ở trong nhà
 *     subjects/{sid}                người được chăm sóc (ba, mẹ)
 *       prescriptions/{id}          đơn thuốc
 *       doses/{id}                  log đã uống
 *     feed/{id}                     dòng sự kiện, chỉ thêm không sửa
 *
 * Giai đoạn này **id của nhà chính là mã mời**. Firestore sinh id ngẫu nhiên
 * 20 ký tự nên không đoán được; biết id nghĩa là đã được người trong nhà đưa.
 *
 * ⚠️ Mọi hàm ở đây trả về `{ ok, ... }` và KHÔNG BAO GIỜ rơi về dữ liệu mẫu
 * khi lỗi — nguyên tắc đã chốt ở doc 35 mục 5. Lỗi phải nhìn thấy được.
 */

const HOUSEHOLD_KEY = 'airiser_household';

export function getSavedHouseholdId() {
  try { return localStorage.getItem(HOUSEHOLD_KEY); } catch { return null; }
}

function saveHouseholdId(hid) {
  try { localStorage.setItem(HOUSEHOLD_KEY, hid); } catch { /* chế độ riêng tư */ }
}

export function forgetHousehold() {
  try { localStorage.removeItem(HOUSEHOLD_KEY); } catch { /* bỏ qua */ }
}

/** Ghi tên mình vào danh sách thành viên — bước bắt buộc để rules cho phép đọc */
async function joinAsMember(hid, role) {
  const user = await ensureUser();
  if (!user) return { ok: false, error_code: 'NO_SESSION', error_message: 'Chưa tạo được phiên. Bạn tải lại trang nhé.' };

  await setDoc(
    doc(db, 'households', hid, 'members', user.uid),
    { role, joined_at: serverTimestamp(), anonymous: !!user.isAnonymous },
    { merge: true }
  );
  return { ok: true, uid: user.uid };
}

/** Tạo nhà mới. Người tạo là `host` (doc 39: thường là con cái). */
export async function createHousehold({ role = 'host', subjects = [] } = {}) {
  try {
    const user = await ensureUser();
    if (!user) return { ok: false, error_code: 'NO_SESSION', error_message: 'Chưa tạo được phiên làm việc.' };

    const ref = doc(collection(db, 'households'));
    await setDoc(ref, {
      host_uid: user.uid,
      name: 'Nhà mình',
      created_at: serverTimestamp()
    });

    const joined = await joinAsMember(ref.id, role);
    if (!joined.ok) return joined;

    // Tạo sẵn hồ sơ người được chăm sóc
    for (const s of subjects) {
      await setDoc(doc(db, 'households', ref.id, 'subjects', s.id), {
        display_name: s.display_name,
        relation: s.relation || null,
        birth_year: s.birth_year || null,
        capability: s.capability || 'C2',
        conditions: s.conditions || [],
        allergies: s.allergies || [],
        avatar_color: s.avatar_color || null,
        created_at: serverTimestamp()
      });
    }

    saveHouseholdId(ref.id);
    return { ok: true, household_id: ref.id };
  } catch (err) {
    return { ok: false, error_code: err.code || 'FIRESTORE_ERROR', error_message: describe(err) };
  }
}

/** Vào một nhà đã có bằng mã mời */
export async function joinHousehold(hid, role = 'family') {
  try {
    const clean = (hid || '').trim();
    if (!clean) return { ok: false, error_code: 'BAD_CODE', error_message: 'Bạn nhập mã mời giúp nhé.' };

    const joined = await joinAsMember(clean, role);
    if (!joined.ok) return joined;

    const snap = await getDoc(doc(db, 'households', clean));
    if (!snap.exists()) {
      // Dọn lại bản ghi thành viên vừa tạo để không để rác
      try { await deleteDoc(doc(db, 'households', clean, 'members', joined.uid)); } catch { /* bỏ qua */ }
      return { ok: false, error_code: 'NOT_FOUND', error_message: 'Không tìm thấy nhà với mã này. Bạn kiểm tra lại mã nhé.' };
    }

    saveHouseholdId(clean);
    return { ok: true, household_id: clean };
  } catch (err) {
    return { ok: false, error_code: err.code || 'FIRESTORE_ERROR', error_message: describe(err) };
  }
}

/* ── Theo dõi thời gian thực ── */

export function subscribeSubjects(hid, cb, onError) {
  return onSnapshot(
    collection(db, 'households', hid, 'subjects'),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => onError?.({ ok: false, error_code: err.code, error_message: describe(err) })
  );
}

export function subscribePrescriptions(hid, subjectId, cb, onError) {
  return onSnapshot(
    collection(db, 'households', hid, 'subjects', subjectId, 'prescriptions'),
    snap => cb(snap.docs.map(d => ({ id: d.id, member_id: subjectId, ...d.data() }))),
    err => onError?.({ ok: false, error_code: err.code, error_message: describe(err) })
  );
}

export function subscribeFeed(hid, cb, onError) {
  return onSnapshot(
    query(collection(db, 'households', hid, 'feed'), orderBy('at', 'desc'), limit(50)),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => onError?.({ ok: false, error_code: err.code, error_message: describe(err) })
  );
}

export function subscribeAppointments(hid, subjectId, cb, onError) {
  return onSnapshot(
    collection(db, 'households', hid, 'subjects', subjectId, 'appointments'),
    snap => cb(snap.docs.map(d => ({ id: d.id, member_id: subjectId, ...d.data() }))),
    err => onError?.({ ok: false, error_code: err.code, error_message: describe(err) })
  );
}


/* ── Ghi ── */

export async function savePrescription(hid, subjectId, prescription) {
  try {
    const { id, member_id, ...rest } = prescription;
    await setDoc(doc(db, 'households', hid, 'subjects', subjectId, 'prescriptions', id), {
      ...rest,
      saved_at: serverTimestamp()
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error_code: err.code || 'FIRESTORE_ERROR', error_message: describe(err) };
  }
}

export async function saveAppointment(hid, subjectId, appointment) {
  try {
    const appDoc = { ...appointment };
    const appId = appDoc.id || `app_${Date.now()}`;
    delete appDoc.id;
    delete appDoc.member_id;

    await setDoc(doc(db, 'households', hid, 'subjects', subjectId, 'appointments', appId), {
      ...appDoc,
      updated_at: serverTimestamp()
    }, { merge: true });

    return { ok: true, id: appId };
  } catch (err) {
    return { ok: false, error_code: err.code || 'FIRESTORE_ERROR', error_message: describe(err) };
  }
}


export async function logDose(hid, subjectId, medication, memberName) {
  try {
    await addDoc(collection(db, 'households', hid, 'feed'), {
      type: 'DOSE_TAKEN',
      subject_id: subjectId,
      subject_name: memberName || null,
      med_name: medication?.name || null,
      time_slot: medication?.time_slot || medication?.timing || null,
      at: serverTimestamp()
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error_code: err.code || 'FIRESTORE_ERROR', error_message: describe(err) };
  }
}

/**
 * Cảnh báo gửi cho người nhà.
 *
 * ⚠️ Đây là chỗ sửa lỗi C2 trong doc 33: app từng nói "con đã gửi tin báo động
 * cho gia đình rồi ạ" mà **không có code nào gửi**. Giờ nó ghi thật vào
 * Firestore, và web con cái nghe realtime nên hiện ngay.
 */
export async function sendAlert(hid, { type, subjectId, subjectName, title, detail, ruleId }) {
  try {
    await addDoc(collection(db, 'households', hid, 'feed'), {
      type,                       // 'EMERGENCY' | 'SAFETY_CRITICAL' | 'STATUS_OK'
      subject_id: subjectId || null,
      subject_name: subjectName || null,
      title: title || null,
      detail: detail || null,
      rule_id: ruleId || null,
      at: serverTimestamp()
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error_code: err.code || 'FIRESTORE_ERROR', error_message: describe(err) };
  }
}

/** Đổi mã lỗi Firestore thành câu nói rõ phải làm gì */
function describe(err) {
  const code = err?.code || '';
  if (code === 'permission-denied') {
    return 'Không có quyền truy cập dữ liệu nhà này. Bạn kiểm tra lại mã mời nhé.';
  }
  if (code === 'unavailable') {
    return 'Mất kết nối tới máy chủ. Thao tác chưa được lưu lên đám mây.';
  }
  if (code === 'failed-precondition') {
    return 'Cần tạo chỉ mục cho truy vấn này trong Firestore.';
  }
  return err?.message || 'Lỗi khi truy cập dữ liệu.';
}
