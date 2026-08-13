import { useEffect, useRef, useState } from 'react';
import { INITIAL_FAMILY_MEMBERS, INITIAL_PRESCRIPTIONS } from '../services/mockData';
import {
  createHousehold, joinHousehold, getSavedHouseholdId,
  subscribeSubjects, subscribePrescriptions, subscribeFeed, subscribeAppointments,
  savePrescription, saveAppointment, logDose, sendAlert
} from '../services/householdService';

export function useHousehold(role = 'host') {
  const [householdId, setHouseholdId] = useState(getSavedHouseholdId());
  const [status, setStatus] = useState('connecting'); // connecting | ready | error
  const [error, setError] = useState(null);

  const [subjects, setSubjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [feed, setFeed] = useState([]);

  const presUnsubs = useRef({});
  const appUnsubs = useRef({});

  /* ── Có nhà chưa; chưa thì tạo ── */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (householdId) { setStatus('ready'); return; }

      const res = await createHousehold({
        role,
        subjects: INITIAL_FAMILY_MEMBERS.map(m => ({ ...m }))
      });

      if (cancelled) return;

      if (!res.ok) {
        setError(res.error_message);
        setStatus('error');
        return;
      }

      // Nạp sẵn đơn thuốc mẫu để màn hình không trống trơn lúc mới vào
      for (const p of INITIAL_PRESCRIPTIONS) {
        await savePrescription(res.household_id, p.member_id, p);
      }

      // Nạp sẵn lịch tái khám mẫu
      await saveAppointment(res.household_id, 'm1', {
        id: 'app_1',
        doctor: 'TS.BS Nguyễn Văn An — Chuyên khoa Tim Mạch',
        hospital: 'Bệnh viện Đại học Y Dược TP.HCM',
        date: '18/08/2026',
        time: '08:30 AM',
        dateTimeIso: '2026-08-18T08:30:00+07:00',
        prep_instructions: 'Nhịn ăn sáng trước 07:00 để lấy máu xét nghiệm đường huyết & mỡ máu. Mang theo sổ khám cũ và đơn thuốc hiện tại.',
        status: 'UPCOMING'
      });

      setHouseholdId(res.household_id);
      setStatus('ready');
    })();

    return () => { cancelled = true; };
  }, [householdId, role]);

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
    if (!householdId || !subjects.length) return;

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
    if (!householdId || !subjects.length) return;

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

  /* ── Nghe dòng sự kiện (đã uống thuốc, cảnh báo) ── */
  useEffect(() => {
    if (!householdId || status !== 'ready') return;
    return subscribeFeed(householdId, setFeed, e => setError(e.error_message));
  }, [householdId, status]);

  const selectedMember = subjects.find(s => s.id === selectedId) || subjects[0] || null;

  return {
    householdId,
    status,
    error,

    members: subjects,
    selectedMember,
    setSelectedMember: m => setSelectedId(m?.id || m),
    prescriptions,
    appointments,
    feed,

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
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('../config/firebaseConfig');
        const { id, ...rest } = updated;
        await setDoc(doc(db, 'households', householdId, 'subjects', id), rest, { merge: true });
        return { ok: true };
      } catch (err) {
        return { ok: false, error_message: err.message };
      }
    },

    join: async code => {
      const res = await joinHousehold(code, role);
      if (res.ok) {
        setHouseholdId(res.household_id);
        setStatus('ready');
        setError(null);
      }
      return res;
    }
  };
}
