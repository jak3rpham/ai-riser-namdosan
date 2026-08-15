import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import FamilyDashboard from './components/FamilyDashboard';
import ParentHomeView from './components/ParentHomeView';
import LandingView from './components/LandingView';
import GoogleConnectPanel from './components/GoogleConnectPanel';
import GoldenSetBenchmarkModal from './components/GoldenSetBenchmarkModal';
import NotificationCenterModal from './components/NotificationCenterModal';
import UserProfileModal from './components/UserProfileModal';
import HouseholdBar from './components/HouseholdBar';
import OnboardingView from './components/OnboardingView';
import AddSubjectModal from './components/AddSubjectModal';
import EmptyHouseholdView from './components/EmptyHouseholdView';
import { useHousehold } from './hooks/useHousehold';
import { INITIAL_FAMILY_MEMBERS, INITIAL_PRESCRIPTIONS, I18N_STRINGS } from './services/mockData';
import { LayoutGrid, Smartphone, Eye, UserPlus } from 'lucide-react';

/**
 * ⚠️ TÁCH HAI BỀ MẶT (doc 37 mục 1–2)
 *
 * Trước: một trang duy nhất với thanh chuyển "Xem 2 màn hình · Web con gái ·
 * App ba mẹ" — đó là bản trình diễn, không phải sản phẩm. Người dùng thật
 * không bao giờ cần thấy cả hai giao diện cùng lúc.
 *
 * Giờ:
 *   /         → trang chào, chọn vai
 *   /app      → WEB cho con cái (dashboard quản lý)
 *   /parent   → APP cho ba mẹ (toàn màn hình, không khung điện thoại giả)
 *   /?demo=1  → chế độ trình diễn hai màn hình, chỉ để quay video
 *
 * Vai lưu tạm ở máy vì chưa có tài khoản thật. Khi có đăng nhập, vai lấy từ
 * `households/{id}/grants/{uid}` (doc 39 mục 2).
 */

const ROLE_KEY = 'airiser_role';

/** Chỉ dùng cho chế độ trình diễn ?demo=1 — không đụng tới Firestore */
function useDemoState() {
  const [members, setMembers] = useState(INITIAL_FAMILY_MEMBERS);
  const [selectedMember, setSelectedMember] = useState(INITIAL_FAMILY_MEMBERS[0]);
  const [prescriptions, setPrescriptions] = useState(INITIAL_PRESCRIPTIONS);

  return {
    members, selectedMember, setSelectedMember, prescriptions,
    addPrescription: async d => { setPrescriptions(p => [d, ...p]); return { ok: true }; },
    resetDemo: () => {
      setPrescriptions(INITIAL_PRESCRIPTIONS);
      setSelectedMember(INITIAL_FAMILY_MEMBERS[0]);
    },
    updateProfile: updated => {
      setSelectedMember(updated);
      setMembers(ms => ms.map(m => (m.id === updated.id ? updated : m)));
    }
  };
}

/* ── Trang chào ── */
function Landing() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // ?demo=1 → chế độ trình diễn, giữ lại để quay video 2 phút
  if (params.get('demo') === '1') return <DemoSplit />;

  return (
    <LandingView
      onChoose={(role, to) => {
        try { localStorage.setItem(ROLE_KEY, role); } catch { /* chế độ riêng tư */ }
        navigate(to);
      }}
    />
  );
}

/* ── WEB cho con cái ── */
function ManagerWeb({ language, setLanguage }) {
  const state = useHousehold();
  const [isBenchmarkOpen, setBenchmark] = useState(false);
  const [isNotifsOpen, setNotifs] = useState(false);
  const [isProfileOpen, setProfile] = useState(false);
  const [isAddSubjectOpen, setAddSubject] = useState(false);

  // Chưa thuộc nhà nào → hỏi muốn làm gì, thay vì tự dựng nhà rồi nhồi hồ sơ mẫu
  if (state.status === 'onboarding') {
    return (
      <OnboardingView
        onCreate={state.createOwn}
        onJoin={state.join}
        onTryDemo={state.tryDemo}
        busy={state.busy}
        error={state.error}
      />
    );
  }

  if (state.status !== 'ready') {
    return (
      <div className="app-container" style={{ paddingTop: 40 }}>
        <HouseholdBar householdId={state.householdId} status={state.status} error={state.error} onJoin={state.join} />
      </div>
    );
  }

  // Nhà mới tạo thì chưa có ai. Mời khai báo, không hiện dashboard trống hoác.
  if (!state.selectedMember) {
    return (
      <div className="app-container" style={{ paddingTop: 40 }}>
        <EmptyHouseholdView onAdd={() => setAddSubject(true)} onLeave={state.leave} />
        <AddSubjectModal
          isOpen={isAddSubjectOpen}
          onClose={() => setAddSubject(false)}
          onSave={state.addSubject}
          existingCount={state.members.length}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar
        language={language}
        onToggleLanguage={setLanguage}
        onResetDemo={() => {}}
        onOpenBenchmark={() => setBenchmark(true)}
        onOpenNotifs={() => setNotifs(true)}
        onOpenProfile={() => setProfile(true)}
      />

      <div style={{ marginBottom: 16 }}>
        <HouseholdBar householdId={state.householdId} status={state.status} error={state.error} onJoin={state.join} variant="manager" />
      </div>

      <div style={{ marginBottom: 24 }}>
        <GoogleConnectPanel />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="btn-secondary" onClick={() => setAddSubject(true)} style={{ padding: '9px 16px', borderRadius: 12, fontSize: 13.5 }}>
          <UserPlus size={15} /> Thêm người nhà
        </button>
      </div>

      <FamilyDashboard
        members={state.members}
        selectedMember={state.selectedMember}
        onSelectMember={state.setSelectedMember}
        readings={state.readings}
        onSaveReading={state.addReading}
        prescriptions={state.prescriptions}
        onAddPrescription={state.addPrescription}
        appointments={state.appointments}
        onAddAppointment={state.addAppointment}
        feed={state.feed}
        language={language}
      />


      <AddSubjectModal
        isOpen={isAddSubjectOpen}
        onClose={() => setAddSubject(false)}
        onSave={state.addSubject}
        existingCount={state.members.length}
      />

      <GoldenSetBenchmarkModal isOpen={isBenchmarkOpen} onClose={() => setBenchmark(false)} />
      <NotificationCenterModal isOpen={isNotifsOpen} onClose={() => setNotifs(false)} selectedMember={state.selectedMember} feed={state.feed} language={language} />

      <UserProfileModal isOpen={isProfileOpen} onClose={() => setProfile(false)} memberProfile={state.selectedMember} onUpdateProfile={state.updateProfile} language={language} />
    </div>
  );
}

/* ── APP cho ba mẹ — toàn màn hình, không khung giả ── */
function ParentApp({ language }) {
  const state = useHousehold();

  if (state.status === 'onboarding') {
    return (
      <OnboardingView
        onCreate={state.createOwn}
        onJoin={state.join}
        onTryDemo={state.tryDemo}
        busy={state.busy}
        error={state.error}
      />
    );
  }

  if (state.status !== 'ready' || !state.selectedMember) {
    return (
      <div style={{ padding: 20, minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          <HouseholdBar householdId={state.householdId} status={state.status} error={state.error} onJoin={state.join} variant="parent" />
        </div>
      </div>
    );
  }

  return (
    <>
      <ParentHomeView
        selectedMember={state.selectedMember}
        prescriptions={state.prescriptions}
        language={language}
        demo={false}
        onConfirmDose={state.confirmDose}
        onAlert={state.alert}
      />
      <div style={{ padding: '12px 16px 24px', maxWidth: 480, margin: '0 auto' }}>
        <HouseholdBar householdId={state.householdId} status={state.status} error={state.error} onJoin={state.join} variant="parent" />
      </div>
    </>
  );
}

/* ── Chế độ trình diễn: giữ nguyên hai màn cạnh nhau, CHỈ để quay video ── */
function DemoSplit() {
  const state = useDemoState();
  const [language, setLanguage] = useState('vi');
  const [view, setView] = useState('split');
  const t = I18N_STRINGS[language] || I18N_STRINGS.vi;

  return (
    <div className="app-container">
      <Navbar
        language={language}
        onToggleLanguage={setLanguage}
        onResetDemo={state.resetDemo}
        onOpenBenchmark={() => {}}
        onOpenNotifs={() => {}}
        onOpenProfile={() => {}}
      />

      <div style={{ padding: '8px 16px', borderRadius: 12, background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.25)', color: '#B45309', fontSize: 12.5, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>
        Chế độ trình diễn — hai giao diện cạnh nhau để quay video. Người dùng thật chỉ thấy một bên.
        {' '}<a href="/" style={{ color: '#B45309' }}>Về trang chính</a>
      </div>

      <div className="role-bar">
        <div className="role-toggle">
          <button className={`role-btn ${view === 'split' ? 'active' : ''}`} onClick={() => setView('split')}>
            <Eye size={16} /> {t.split_view}
          </button>
          <button className={`role-btn ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
            <LayoutGrid size={16} /> {t.child_view}
          </button>
          <button className={`role-btn ${view === 'parent' ? 'active' : ''}`} onClick={() => setView('parent')}>
            <Smartphone size={16} /> {t.parent_view}
          </button>
        </div>
      </div>

      {view === 'split' && (
        <div className="split-view">
          <ParentHomeView selectedMember={state.selectedMember} prescriptions={state.prescriptions} language={language} demo />
          <FamilyDashboard
            members={state.members}
            selectedMember={state.selectedMember}
            onSelectMember={state.setSelectedMember}
            prescriptions={state.prescriptions}
            onAddPrescription={state.addPrescription}
            language={language}
          />
        </div>
      )}

      {view === 'dashboard' && (
        <FamilyDashboard
          members={state.members}
          selectedMember={state.selectedMember}
          onSelectMember={state.setSelectedMember}
          prescriptions={state.prescriptions}
          onAddPrescription={state.addPrescription}
          language={language}
        />
      )}

      {view === 'parent' && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ParentHomeView selectedMember={state.selectedMember} prescriptions={state.prescriptions} language={language} demo />
        </div>
      )}
    </div>
  );
}

function Shell() {
  const [language, setLanguage] = useState('vi');

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<ManagerWeb language={language} setLanguage={setLanguage} />} />
      <Route path="/parent" element={<ParentApp language={language} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  // Người đã chọn vai lần trước thì vào thẳng, không hỏi lại
  useEffect(() => {
    if (window.location.pathname !== '/') return;
    if (new URLSearchParams(window.location.search).get('demo') === '1') return;
    try {
      const role = localStorage.getItem(ROLE_KEY);
      if (role === 'manager') window.history.replaceState({}, '', '/app');
      else if (role === 'parent') window.history.replaceState({}, '', '/parent');
    } catch { /* bỏ qua */ }
  }, []);

  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
