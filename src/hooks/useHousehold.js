import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createHousehold, joinHousehold, getSavedHouseholdId, forgetHousehold,
  checkMembership, saveSubject,
  subscribeSubjects, subscribePrescriptions, subscribeFeed, subscribeAppointments,
  subscribeReadings, saveReading,
  savePrescription, saveAppointment, logDose, sendAlert
} from '../services/householdService';
import { createDemoHousehold } from '../services/demoSeed';

/**
 * Trạng thái dữ liệu của một nhà.
 *
 * ─────────────────────────────────────────────────────────────────
 * BỎ VIỆC TỰ TẠO NHÀ KHI VÀO LẦN ĐẦU
 *
 * Bản trước: ai mở app mà chưa có nhà thì hook tự tạo một nhà rồi nạp sẵn hai
 * hồ sơ mẫu và mấy đơn thuốc. Hai hậu quả:
 *
 *   1. Người dùng thật không bao giờ đi qua khâu khai báo. Họ mở app ra thấy
 *      "Ba Mười" và "Mẹ Lan" — người lạ — rồi phải tự hiểu là phải sửa đè lên.
 *   2. Đổi tài khoản Google trên cùng máy là kẹt cứng: id nhà cũ còn trong
 *      localStorage, uid mới không phải thành viên, rules từ chối, màn hình
 *      đỏ, không có lối ra.
 *
 * Giờ: kiểm tra tư cách thành viên trước. Không thuộc nhà nào thì vào
 * `onboarding` và để người dùng chọn — tạo nhà, nhập mã mời, hay xem thử nhà
 * mẫu. Dữ liệu mẫu chỉ xuất hiện khi có người chủ động bấm xin nó.
 *
 * Các trạng thái: connecting → onboarding | ready | error
 */
export function useHousehold() {
  const [householdId, setHouseholdId] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [subjects, setSubjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [feed, setFeed] = useState([]);
  const [readings, setReadings] = useState([]);

  const presUnsubs = useRef([]);
  const appUnsubs = useRef([]);

  /* ── Có thuộc nhà nào không? ── */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const saved = getSavedHouseholdId();

      if (!saved) {
        if (!cancelled) setStatus('onboarding');
        return;
      }

      const res = await checkMembership(saved);
      if (cancelled) return;

      if (!res.ok) {
        setError(res.error_message || 'Chưa kết nối được dữ liệu.');
        setStatus('error');
        return;
      }

      if (!res.member) {
        // Id cũ của một tài khoản khác. Quên đi rồi hỏi lại từ đầu — đây chính
        // là chỗ bản trước kẹt lại ở màn hình lỗi đỏ.
        forgetHousehold();
        setStatus('onboarding');
        return;
      }

      setHouseholdId(saved);
      setStatus('ready');
    })();

    return () => { cancelled = true; };
  }, []);

  /* ── Nghe danh sách người được chăm sóc ── */
  useEffect(() => {
    if (!householdId || status !== 'ready') return;

    return subscribeSubjects(
      householdId,
      list => {
        setSubjects(list);
        setSelectedId(cur => (cur && list.some(s => s.id === cur) ? cur : list[0]?.id || null));
      },
      e => { setError(e.error_message); setStatus('error'); }
    );
  }, [householdId, status]);

  /* ── Nghe đơn thuốc của TỪNG người, gom lại ── */
  useEffect(() => {
    if (!householdId || !subjects.length) { setPrescriptions([]); return; }

    const byId = {};
    const unsubs = subjects.map(s =>
      subscribePrescriptions(householdId, s.id, list => {
        byId[s.id] = list;
        setPrescriptions(Object.values(byId).flat());
      }, e => setError(e.error_message))
    );

    presUnsubs.current = unsubs;
    return () => unsubs.forEach(u => u && u());
  }, [householdId, subjects.map(s => s.id).join(',')]);

  /* ── Nghe lịch tái khám của TỪNG người, gom lại ── */
  useEffect(() => {
    if (!householdId || !subjects.length) { setAppointments([]); return; }

    const byId = {};
    const unsubs = subjects.map(s =>
      subscribeAppointments(householdId, s.id, list => {
        byId[s.id] = list;
        setAppointments(Object.values(byId).flat());
      }, e => setError(e.error_message))
    );

    appUnsubs.current = unsubs;
    return () => unsubs.forEach(u => u && u());
  }, [householdId, subjects.map(s => s.id).join(',')]);

  /* ── Nghe số đo tại nhà của người đang xem ── */
  useEffect(() => {
    if (!householdId || !selectedId) { setReadings([]); return; }
    return subscribeReadings(householdId, selectedId, setReadings, e => setError(e.error_message));
  }, [householdId, selectedId]);

  /* ── Nghe dòng sự kiện (đã uống thuốc, cảnh báo) ── */
  useEffect(() => {
    if (!householdId || status !== 'ready') return;
    return subscribeFeed(householdId, setFeed, e => setError(e.error_message));
  }, [householdId, status]);

  /** Dùng chung cho ba lối vào: tạo nhà, nhập mã, xem thử nhà mẫu */
  const enter = useCallback(async run => {
    setBusy(true);
    setError(null);
    const res = await run();
    setBusy(false);

    if (res.ok) {
      setHouseholdId(res.household_id);
      setStatus('ready');
    }
    return res;
  }, []);

  const selectedMember = subjects.find(s => s.id === selectedId) || subjects[0] || null;

  return {
    householdId,
    status,
    error,
    busy,

    members: subjects,
    selectedMember,
    setSelectedMember: m => setSelectedId(m?.id || m),
    prescriptions,
    appointments,
    feed,
    readings,

    /* ── Ba lối vào ở màn onboarding ── */

    createOwn: ({ name, displayName } = {}) =>
      enter(() => createHousehold({ name, displayName })),

    join: code => enter(() => joinHousehold(code)),

    tryDemo: () => enter(() => createDemoHousehold()),

    /** Rời nhà trên máy này. Dữ liệu trên máy chủ giữ nguyên. */
    leave: () => {
      forgetHousehold();
      setHouseholdId(null);
      setSubjects([]);
      setPrescriptions([]);
      setAppointments([]);
      setFeed([]);
      setError(null);
      setStatus('onboarding');
    },

    /* ── Ghi dữ liệu ── */

    addReading: async reading => {
      if (!householdId || !selectedMember) {
        return { ok: false, error_message: 'Chưa chọn được người để ghi số đo.' };
      }
      return saveReading(householdId, selectedMember.id, reading);
    },

    addSubject: async subject => {
      if (!householdId) return { ok: false, error_message: 'Chưa kết nối được nhà.' };
      return saveSubject(householdId, subject);
    },

    /** Lưu đơn thuốc — trả về kết quả THẬT, UI phải hiển thị nếu hỏng */
    addPrescription: async doc => {
      if (!householdId) return { ok: false, error_message: 'Chưa kết nối được nhà.' };
      return savePrescription(householdId, doc.member_id, doc);
    },

    addAppointment: async (subjectId, doc) => {
      if (!householdId) return { ok: false, error_message: 'Chưa kết nối được nhà.' };
      return saveAppointment(householdId, subjectId || selectedMember?.id, doc);
    },

    confirmDose: async (medication, memberName) => {
      if (!householdId || !selectedMember) return { ok: false };
      return logDose(householdId, selectedMember.id, medication, memberName || selectedMember.display_name);
    },

    alert: async payload => {
      if (!householdId) return { ok: false };
      return sendAlert(householdId, {
        subjectId: selectedMember?.id,
        subjectName: selectedMember?.display_name,
        ...payload
      });
    },

    updateProfile: async updated => {
      if (!householdId || !updated?.id) return { ok: false };
      return saveSubject(householdId, updated);
    }
  };
}
