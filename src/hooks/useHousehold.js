import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createHousehold, joinHousehold, getSavedHouseholdId, forgetHousehold,
  checkMembership, saveSubject, claimIdentity, subscribeMembers,
  subscribeSubjects, subscribePrescriptions, subscribeFeed, subscribeAppointments,
  subscribeReadings, saveReading,
  savePrescription, saveAppointment, logDose, sendAlert
} from '../services/householdService';
import { loginDemo, resetPassword } from '../services/demoAuth';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

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
 * `onboarding` và để người dùng chọn — tạo nhà hoặc nhập mã mời.
 *
 * Lối thứ ba "xem thử nhà mẫu" đã BỎ HẲN ngày 16/08 cùng file `demoSeed.js`.
 * Không màn hình nào gọi tới nó, nên nó là code chết — mà là code chết ghi hồ
 * sơ y tế hư cấu ("Ba Mười", "Mẹ Lan", bác sĩ "TS.BS Nguyễn Văn An") vào
 * Firestore production. Dữ liệu hư cấu giờ chỉ còn ở `demoFixtures.js`, nằm
 * trong bộ nhớ, chỉ cho `/?demo=1`, không chạm tới máy chủ.
 *
 * ─────────────────────────────────────────────────────────────────
 * "TÔI LÀ AI" TÁCH KHỎI "ĐANG XEM AI"
 *
 * `members/{uid}` là TÀI KHOẢN vào được nhà. `subjects/{sid}` là NGƯỜI có hồ
 * sơ sức khoẻ. Trước đây không có gì nối hai thứ, nên app Ba Mẹ đoán bằng
 * `subjects[0]`:
 *
 *   const selectedMember = subjects.find(...) || subjects[0] || null;
 *
 * Nhà tạo trên máy tính có sẵn hồ sơ "Thanh" → điện thoại nhập mã mời xong là
 * lập tức TRỞ THÀNH Thanh. Không hỏi, không chọn, không có đường khai hồ sơ
 * riêng, và mọi liều thuốc bấm "đã uống" đều ghi vào hồ sơ Thanh.
 *
 * Giờ có hai khái niệm tách bạch:
 *   `identity`       hồ sơ mà TÀI KHOẢN NÀY đã nhận là mình (members.subject_id)
 *   `selectedMember` hồ sơ đang xem trên màn hình (app Con đổi qua lại được)
 *
 * Chưa nhận hồ sơ nào → `needsIdentity`, app Ba Mẹ hỏi trước khi cho vào.
 * ─────────────────────────────────────────────────────────────────
 *
 * Các trạng thái: connecting → onboarding | ready | error
 */
export function useHousehold() {
  const [householdId, setHouseholdId] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [subjects, setSubjects] = useState([]);
  // Đã nhận được lần đầu chưa. Khác `subjects.length === 0` ở chỗ: nhà rỗng
  // thật cũng cho mảng rỗng, mà lúc CHƯA tải xong thì chưa được kết luận gì.
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [identityId, setIdentityId] = useState(null);
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
      setIdentityId(res.subjectId || null);
      setStatus('ready');
    })();

    return () => { cancelled = true; };
  }, []);

  /* ── Nghe danh sách người được chăm sóc ── */
  useEffect(() => {
    if (!householdId || status !== 'ready') return;

    setSubjectsLoaded(false);
    return subscribeSubjects(
      householdId,
      list => {
        setSubjects(list);
        setSubjectsLoaded(true);
        // ⚠️ KHÔNG rơi về list[0]. Chính dòng đó làm điện thoại vừa nhập mã
        // mời xong là biến thành người đầu tiên trong danh sách. Giữ lựa chọn
        // hiện tại nếu còn hợp lệ, không thì để hồ sơ của chính mình quyết.
        setSelectedId(cur => (cur && list.some(s => s.id === cur) ? cur : null));
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

  /* ── Nghe danh sách tài khoản trong nhà ──
   * Để người dùng thấy được "nhà mình có mấy máy đang dùng chung" — trước đây
   * không có chỗ nào nhìn ra điều đó. */
  useEffect(() => {
    if (!householdId || status !== 'ready') return;
    return subscribeMembers(householdId, setAccounts, () => { /* không chặn luồng chính */ });
  }, [householdId, status]);

  /* ── Nghe dòng sự kiện (đã uống thuốc, cảnh báo) ── */
  useEffect(() => {
    if (!householdId || status !== 'ready') return;
    return subscribeFeed(householdId, setFeed, e => setError(e.error_message));
  }, [householdId, status]);

  /** Dùng chung cho hai lối vào ở màn onboarding: tạo nhà và nhập mã mời */
  const enter = useCallback(async run => {
    setBusy(true);
    setError(null);
    const res = await run();
    setBusy(false);

    if (res.ok) {
      // ⚠️ Phải dọn sạch dữ liệu nhà CŨ trước khi treo biển nhà mới.
      //
      // Nút "Nhập mã mời" có mặt cả khi đang ở trong một nhà rồi. Không dọn thì
      // `identityId` của nhà cũ còn nguyên, mà id đó không có trong danh sách hồ
      // sơ của nhà mới → `identity` ra null trong khi `identityId` vẫn có giá
      // trị → app Ba Mẹ tưởng đã biết "tôi là ai" nên không hỏi, rồi render một
      // `selectedMember` bằng null và văng ngay ở dòng `selectedMember.display_name`.
      setSubjects([]);
      setSubjectsLoaded(false);
      setAccounts([]);
      setIdentityId(null);
      setSelectedId(null);
      setPrescriptions([]);
      setAppointments([]);
      setFeed([]);
      setReadings([]);

      setHouseholdId(res.household_id);
      setStatus('ready');
    }
    return res;
  }, []);

  /** Hồ sơ tài khoản này đã nhận là mình. null = chưa chọn, hoặc hồ sơ đã bị xoá. */
  const identity = subjects.find(s => s.id === identityId) || null;

  /**
   * Hồ sơ đang xem.
   *
   * KHÔNG còn rơi về `subjects[0]`. Ưu tiên: hồ sơ đang chọn tay → hồ sơ của
   * chính mình. Không có cả hai thì null, và tầng trên phải hỏi, không được
   * đoán bừa.
   */
  const selectedMember = subjects.find(s => s.id === selectedId) || identity || null;

  /**
   * Đã vào nhà nhưng chưa nhận hồ sơ nào là mình.
   * App Ba Mẹ phải hỏi trước khi cho vào; app Con thì không bắt buộc vì con
   * cái quản lý cả nhà, bản thân họ có thể không có hồ sơ sức khoẻ nào.
   *
   * ⚠️ Xét theo `identity` (hồ sơ đã tra ra được), KHÔNG theo `identityId` thô.
   * Hai thứ đó lệch nhau ở một ca có thật: hồ sơ được nhận là mình bị xoá từ
   * máy khác. Lúc đó `identityId` vẫn còn, `identity` thành null, và nếu tin
   * `identityId` thì app đi thẳng vào màn hình chính với `selectedMember` bằng
   * null rồi văng. Hỏi lại "bác là ai" là cách xử đúng.
   *
   * Chỉ kết luận sau khi danh sách hồ sơ đã về — trước đó chưa biết gì để tra.
   */
  const needsIdentity = status === 'ready' && subjectsLoaded && !identity;

  return {
    householdId,
    status,
    error,
    busy,

    members: subjects,
    // Danh sách hồ sơ đã về chưa. Tầng trên cần biết để khỏi kết luận "nhà này
    // chưa có ai" trong lúc còn đang tải — câu đó dẫn thẳng tới màn hình mời
    // khai hồ sơ mới, cho một nhà đã có đủ người.
    membersLoaded: subjectsLoaded,
    accounts,
    identity,
    needsIdentity,
    selectedMember,
    setSelectedMember: m => setSelectedId(m?.id || m),
    prescriptions,
    appointments,
    feed,
    readings,

    /* ── Lối vào ở màn onboarding ── */

    createOwn: ({ name, displayName, username, password, phone } = {}) =>
      enter(() => createHousehold({ name, displayName, username, password, phone })),

    join: code => enter(() => joinHousehold(code)),

    login: (username, password) => enter(() => loginDemo(username, password)),

    loginDemo: (username, password) => enter(() => loginDemo(username, password)),

    resetPassword: (username, phone, newPassword) => enter(() => resetPassword(username, phone, newPassword)),

    /** Nhận một hồ sơ là mình, hoặc truyền null để chọn lại từ đầu. */
    claimIdentity: async subjectId => {
      if (!householdId) return { ok: false, error_message: 'Chưa kết nối được nhà.' };
      const res = await claimIdentity(householdId, subjectId);
      if (res.ok) {
        setIdentityId(res.subject_id || null);
        setSelectedId(res.subject_id || null);
      }
      return res;
    },

    /** Rời nhà trên máy này. Dữ liệu trên máy chủ giữ nguyên. */
    leave: () => {
      forgetHousehold();
      setHouseholdId(null);
      setSubjects([]);
      setSubjectsLoaded(false);
      setAccounts([]);
      setIdentityId(null);
      setSelectedId(null);
      setPrescriptions([]);
      setAppointments([]);
      setFeed([]);
      setReadings([]);
      setError(null);
      setStatus('onboarding');
    },

    /**
     * Đăng xuất hẳn: rời nhà VÀ bỏ luôn phiên đăng nhập.
     *
     * Khác `leave` ở chỗ nó đổi cả uid. Cần vì `leave` giữ nguyên tài khoản ẩn
     * danh, nên nhập lại mã mời là vào lại đúng chỗ cũ với đúng hồ sơ cũ —
     * không thử lại được luồng người mới. Trước khi có nút này, cách duy nhất
     * để thử lại là xoá app khỏi màn hình chính rồi cài lại.
     */
    signOutFully: async () => {
      forgetHousehold();
      try { await signOut(auth); } catch { /* chưa đăng nhập thì thôi */ }
      // Nạp lại để mọi listener Firestore và phiên ẩn danh dựng lại từ đầu.
      window.location.replace('/');
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
