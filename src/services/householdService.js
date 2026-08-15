import {
  collection, doc, setDoc, getDoc, addDoc,
  onSnapshot, query, orderBy, limit, serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { apiPost, ensureUser } from './apiClient';

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
 * Tạo nhà, mời, và vào nhà đều đi qua backend (`/api/household/*`).
 * Trước đây id của nhà CHÍNH LÀ mã mời và client tự ghi mình vào `members`,
 * nghĩa là ai biết id — kể cả khi nó lọt vào một khung hình video — đều có
 * toàn quyền đọc và ghi hồ sơ y tế của nhà đó, vĩnh viễn. Giờ mã mời là vật
 * riêng, có hạn dùng, giới hạn lượt, thu hồi được. Firestore rules đã chặn
 * client ghi `members`, nên không còn đường tắt nào.
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

/**
 * Tạo nhà mới. Người tạo thành chủ nhà.
 *
 * `subjects` là những người được chăm sóc cần tạo sẵn hồ sơ. Backend chỉ dựng
 * nhà và thành viên; hồ sơ người được chăm sóc ghi từ client vì lúc đó đã là
 * thành viên nên rules cho phép.
 */
export async function createHousehold({ name, displayName, subjects = [] } = {}) {
  const res = await apiPost('/household/create', { name, display_name: displayName });
  if (!res.ok) return res;

  const hid = res.household_id;

  for (const s of subjects) {
    await setDoc(doc(db, 'households', hid, 'subjects', s.id), {
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

  saveHouseholdId(hid);
  return { ok: true, household_id: hid };
}

/** Tạo mã mời mới. Chỉ người đã ở trong nhà mới gọi được. */
export async function createInvite(hid, { maxUses } = {}) {
  return apiPost('/household/invite', { household_id: hid, max_uses: maxUses });
}

/** Thu hồi mã mời. Người đã vào nhà bằng mã này vẫn ở lại. */
export async function revokeInvite(code) {
  return apiPost('/household/invite/revoke', { code });
}

/**
 * Dùng mã mời để vào nhà.
 *
 * Backend kiểm tra hạn dùng, số lượt còn lại, và trạng thái thu hồi trong một
 * transaction — rules không làm được việc đếm lượt một cách an toàn.
 */
export async function joinHousehold(code, displayName) {
  const clean = (code || '').trim();
  if (!clean) {
    return { ok: false, error_code: 'BAD_CODE', error_message: 'Bạn nhập mã mời giúp nhé.' };
  }

  const res = await apiPost('/household/join', { code: clean, display_name: displayName });
  if (!res.ok) return res;

  saveHouseholdId(res.household_id);
  return { ok: true, household_id: res.household_id };
}

/**
 * Còn ở trong nhà này không?
 *
 * Cần thiết vì id nhà lưu ở máy, mà tài khoản thì đổi được: đăng nhập Google
 * bằng mail khác trên cùng điện thoại là uid mới, không còn là thành viên.
 * Bản trước không kiểm tra nên rơi thẳng vào màn hình lỗi đỏ và kẹt ở đó.
 */
export async function checkMembership(hid) {
  try {
    const user = await ensureUser();
    if (!user) return { ok: false, member: false, error_code: 'NO_SESSION' };

    const snap = await getDoc(doc(db, 'households', hid, 'members', user.uid));
    return { ok: true, member: snap.exists() };
  } catch (err) {
    // permission-denied cũng nghĩa là không phải thành viên — rules chặn đọc
    if (err.code === 'permission-denied') return { ok: true, member: false };
    return { ok: false, member: false, error_code: err.code, error_message: describe(err) };
  }
}

/** Thêm hoặc sửa hồ sơ một người được chăm sóc (ba, mẹ, ông, bà). */
export async function saveSubject(hid, subject) {
  try {
    const id = subject.id || `sub_${Date.now().toString(36)}`;
    await setDoc(
      doc(db, 'households', hid, 'subjects', id),
      {
        display_name: subject.display_name,
        relation: subject.relation || null,
        birth_year: subject.birth_year || null,
        capability: subject.capability || 'C2',
        conditions: subject.conditions || [],
        allergies: subject.allergies || [],
        avatar_color: subject.avatar_color || null,
        updated_at: serverTimestamp()
      },
      { merge: true }
    );
    return { ok: true, subject_id: id };
  } catch (err) {
    return { ok: false, error_code: err.code || 'FIRESTORE_ERROR', error_message: describe(err) };
  }
}

/**
 * Ghi một lần đo tại nhà (huyết áp, đường huyết, cân nặng).
 *
 * ⚠️ Trước đây HealthTrackerCard giữ chỉ số trong useState, tải lại trang là
 * mất — và tệ hơn, nó khởi tạo sẵn ba chỉ số BỊA CỨNG trong code (125/82,
 * đường huyết 5.8, cân nặng 64.5) hiện cho mọi người được chăm sóc. Khai báo
 * mẹ mình vào app là thấy ngay "huyết áp của mẹ" mà không ai từng đo.
 *
 * App KHÔNG diễn giải chỉ số ở đây. Việc phân loại cao/thấp do `safetyChecks`
 * làm bằng ngưỡng cứng, không do model ngôn ngữ.
 */
export async function saveReading(hid, subjectId, reading) {
  try {
    await addDoc(collection(db, 'households', hid, 'subjects', subjectId, 'readings'), {
      ...reading,
      at: serverTimestamp()
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error_code: err.code || 'FIRESTORE_ERROR', error_message: describe(err) };
  }
}

export function subscribeReadings(hid, subjectId, cb, onError) {
  return onSnapshot(
    query(
      collection(db, 'households', hid, 'subjects', subjectId, 'readings'),
      orderBy('at', 'desc'),
      limit(30)
    ),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => onError?.({ ok: false, error_code: err.code, error_message: describe(err) })
  );
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
