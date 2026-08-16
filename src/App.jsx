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
import IdentityPickerView from './components/IdentityPickerView';
import HouseholdManageModal from './components/HouseholdManageModal';
import DemoLoginView from './components/DemoLoginView';
import ManagerSidebar from './components/ManagerSidebar';
import { runAllSafetyChecks } from './services/safetyChecks';
import { useHousehold } from './hooks/useHousehold';
import { INITIAL_FAMILY_MEMBERS, INITIAL_PRESCRIPTIONS } from './services/demoFixtures';
import { I18N_STRINGS } from './services/i18n';
import { LayoutGrid, Smartphone, Eye, UserPlus, Users } from 'lucide-react';

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
  const navigate = useNavigate();
  const [isBenchmarkOpen, setBenchmark] = useState(false);
  const [isNotifsOpen, setNotifs] = useState(false);
  const [isProfileOpen, setProfile] = useState(false);
  const [isAddSubjectOpen, setAddSubject] = useState(false);
  const [isManageOpen, setManage] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [section, setSection] = useState('overview');

  /**
   * Chốt luôn người đang xem, thay vì chỉ mượn `members[0]` lúc render.
   *
   * ⚠️ Đây là lỗi im lặng chứ không phải dọn dẹp. Hook nghe số đo và ghi số đo
   * đều bám vào hồ sơ ĐANG CHỌN. Chưa bấm chọn ai thì id đó là null, trong khi
   * màn hình vẫn hiện đầy đủ người đầu danh sách. Hậu quả: mở app Con lên là
   * thấy "Chưa có số đo nào" cho một người đã đo cả tuần, và bấm Lưu một chỉ số
   * mới thì ra lỗi "Chưa chọn được người để ghi số đo" — trong khi tên người đó
   * đang nằm ngay trên đầu thẻ.
   *
   * Chỉ làm ở app Con. App Ba Mẹ vẫn phải hỏi "bác là ai", vì ở đó đoán sai
   * nghĩa là ghi liều thuốc vào hồ sơ người khác.
   */
  useEffect(() => {
    if (state.status !== 'ready') return;
    if (state.selectedMember || !state.members.length) return;
    state.setSelectedMember(state.members[0]);
  }, [state.status, state.selectedMember, state.members]);

  // Chưa thuộc nhà nào → hỏi muốn làm gì, thay vì tự dựng nhà rồi nhồi hồ sơ mẫu
  if (state.status === 'onboarding') {
    return (
      <OnboardingView
        onCreate={state.createOwn}
        onJoin={state.join}
        busy={state.busy}
        error={state.error}
      />
    );
  }

  // Chưa xong kết nối, hoặc danh sách hồ sơ chưa về. Chưa về mà kết luận "nhà
  // này chưa có ai" là mời người dùng khai lại hồ sơ đã có sẵn.
  if (state.status !== 'ready' || !state.membersLoaded) {
    return (
      <div className="app-container" style={{ paddingTop: 40 }}>
        <HouseholdBar householdId={state.householdId} status={state.status === 'ready' ? 'connecting' : state.status} error={state.error} onJoin={state.join} />
      </div>
    );
  }

  // Nhà mới tạo thì chưa có ai. Mời khai báo, không hiện dashboard trống hoác.
  //
  // Xét theo `members.length` chứ KHÔNG theo `selectedMember`: con cái quản lý
  // cả nhà nên có thể chưa nhận hồ sơ nào là mình, mà vẫn phải thấy dashboard.
  // Chỉ app Ba Mẹ mới bắt buộc phải biết "tôi là ai".
  if (!state.members.length) {
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

  const viewMember = state.selectedMember || state.members[0];

  /**
   * Số đỏ trên thanh điều hướng.
   *
   * Chỉ đếm thứ CẦN NGƯỜI XEM LÀM GÌ ĐÓ: cảnh báo an toàn mức nghiêm trọng, và
   * cấp cứu / cần đi khám mà ba mẹ vừa báo. Đếm cả những thứ chỉ để đọc thì
   * chấm đỏ lúc nào cũng sáng, và sáng mãi thì không còn nghĩa gì.
   */
  const viewMeds = state.prescriptions
    .filter(p => p.member_id === viewMember.id)
    .flatMap(p => p.medications || []);

  const badges = {
    overview:
      runAllSafetyChecks({ newMedications: [], existingMedications: viewMeds, memberProfile: viewMember })
        .warnings.filter(w => w.severity === 'CRITICAL').length
      + state.feed.filter(f => f.type === 'EMERGENCY' || f.type === 'SAFETY_CRITICAL').length
  };

  return (
    <div className="app-container">
      <Navbar
        language={language}
        onToggleLanguage={setLanguage}
        onResetDemo={() => {}}
        onOpenBenchmark={() => setBenchmark(true)}
        onOpenNotifs={() => setNotifs(true)}
        onOpenProfile={() => setProfile(true)}
        onGoHome={() => navigate('/')}
        onGoParent={() => navigate('/parent')}
        onLeaveHousehold={state.leave}
      />

      <div className="manager-layout">
        <ManagerSidebar
          section={section}
          onSelect={setSection}
          members={state.members}
          selectedMember={viewMember}
          onSelectMember={state.setSelectedMember}
          badges={badges}
        />

        <main style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
          {/* ── Mục "Nhà mình" ──
              Ba thứ này trước đây nằm chồng lên đầu trang, trên mọi màn hình,
              chiếm gần hết khung hình đầu tiên bằng những việc chỉ làm một lần:
              nối Google, mời người nhà. Giờ chúng có chỗ riêng. */}
          {section === 'household' && (
            <>
              <div className="manager-section-head">
                <div>
                  <h3 className="manager-section-title">Nhà mình</h3>
                  <div className="manager-section-sub">Người nhà, mã mời, và kết nối Google</div>
                </div>
              </div>
              <HouseholdBar householdId={state.householdId} status={state.status} error={state.error} onJoin={state.join} variant="manager" />
              <GoogleConnectPanel />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn-secondary" onClick={() => setManage(true)} style={{ padding: '11px 18px', borderRadius: 12, fontSize: 14 }}>
                  <Users size={15} /> Quản lý nhà
                </button>
                <button className="btn-secondary" onClick={() => setAddSubject(true)} style={{ padding: '11px 18px', borderRadius: 12, fontSize: 14 }}>
                  <UserPlus size={15} /> Thêm người nhà
                </button>
              </div>
            </>
          )}

          {section !== 'household' && (
            <FamilyDashboard
              section={section}
              members={state.members}
              selectedMember={viewMember}
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
          )}
        </main>
      </div>


      <AddSubjectModal
        isOpen={isAddSubjectOpen}
        onClose={() => setAddSubject(false)}
        onSave={state.addSubject}
        existingCount={state.members.length}
      />

      <GoldenSetBenchmarkModal isOpen={isBenchmarkOpen} onClose={() => setBenchmark(false)} />
      <NotificationCenterModal isOpen={isNotifsOpen} onClose={() => setNotifs(false)} selectedMember={viewMember} feed={state.feed} language={language} />

      <UserProfileModal
        isOpen={isProfileOpen || !!editingSubject}
        onClose={() => { setProfile(false); setEditingSubject(null); }}
        memberProfile={editingSubject || viewMember}
        onUpdateProfile={state.updateProfile}
        language={language}
      />

      <HouseholdManageModal
        isOpen={isManageOpen}
        onClose={() => setManage(false)}
        subjects={state.members}
        accounts={state.accounts}
        identityId={state.identity?.id || null}
        onAddSubject={() => { setManage(false); setAddSubject(true); }}
        onEditSubject={sub => { setManage(false); setEditingSubject(sub); }}
        onReclaimIdentity={async () => { setManage(false); await state.claimIdentity(null); }}
        onSignOut={state.signOutFully}
      />
    </div>
  );
}

/**
 * Đường riêng cho người chấm bài: /demo
 *
 * Không có liên kết nào từ app chính trỏ tới đây. Người dùng thật đi qua màn
 * onboarding bình thường và không bao giờ thấy khái niệm "tài khoản dùng thử".
 */
function DemoEntry() {
  const navigate = useNavigate();
  return (
    <DemoLoginView
      onSuccess={() => navigate('/app')}
      onBack={() => navigate('/')}
    />
  );
}

/* ── APP cho ba mẹ — toàn màn hình, không khung giả ── */
function ParentApp({ language }) {
  const state = useHousehold();
  const [isAddSubjectOpen, setAddSubject] = useState(false);
  const [isManageOpen, setManage] = useState(false);

  // Sau khi khai hồ sơ mới ở app Ba Mẹ thì nhận luôn hồ sơ đó là mình — người
  // vừa tự khai chính là người đang cầm máy, không cần hỏi lại một lần nữa.
  const addAndClaim = async subject => {
    const res = await state.addSubject(subject);
    if (res.ok && res.subject_id) await state.claimIdentity(res.subject_id);
    return res;
  };

  if (state.status === 'onboarding') {
    return (
      <OnboardingView
        onCreate={state.createOwn}
        onJoin={state.join}
        busy={state.busy}
        error={state.error}
      />
    );
  }

  // Đang kết nối / lỗi kết nối / danh sách hồ sơ chưa về — chưa biết trong nhà có ai
  if (state.status !== 'ready' || !state.membersLoaded) {
    return (
      <div style={{ padding: 20, minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          <HouseholdBar householdId={state.householdId} status={state.status === 'ready' ? 'connecting' : state.status} error={state.error} onJoin={state.join} variant="parent" />
        </div>
      </div>
    );
  }

  // Nhà đã tạo xong nhưng chưa khai ai.
  //
  // ⚠️ Trước đây nhánh này gộp chung với nhánh trên, nên bác bấm "tạo nhà mới"
  // xong là rơi vào một màn hình chỉ có mỗi thanh trạng thái: không nút thêm
  // người, không lối đi tiếp, mà dòng chữ lại bảo bấm "Tạo mã mời" — nút đó
  // chỉ có ở app Con. Ngõ cụt hoàn toàn, phải xoá app cài lại mới thoát.
  //
  // App Con đã xử đúng ca này từ đầu (EmptyHouseholdView). App Ba Mẹ thì không.
  if (!state.members.length) {
    return (
      <div style={{ padding: 20, minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          <EmptyHouseholdView
            variant="parent"
            onAdd={() => setAddSubject(true)}
            onLeave={state.leave}
          />
          <div style={{ marginTop: 18 }}>
            <HouseholdBar householdId={state.householdId} status={state.status} error={state.error} onJoin={state.join} variant="parent" />
          </div>
        </div>
        <AddSubjectModal
          isOpen={isAddSubjectOpen}
          onClose={() => setAddSubject(false)}
          onSave={addAndClaim}
          existingCount={state.members.length}
          variant="parent"
        />
      </div>
    );
  }

  // Nhà đã có hồ sơ nhưng máy này chưa nhận mình là ai.
  //
  // ⚠️ Đây là chỗ bản trước lặng lẽ chọn `subjects[0]`: nhập mã mời xong là
  // biến thành người đầu tiên trong nhà, không hỏi câu nào. Giờ phải hỏi.
  if (state.needsIdentity) {
    return (
      <div style={{ padding: 20, minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          <IdentityPickerView
            subjects={state.members}
            currentId={state.identity?.id || null}
            onPick={state.claimIdentity}
            onCreateNew={() => setAddSubject(true)}
            onLeave={state.leave}
          />
        </div>
        <AddSubjectModal
          isOpen={isAddSubjectOpen}
          onClose={() => setAddSubject(false)}
          onSave={addAndClaim}
          existingCount={state.members.length}
          variant="parent"
        />
      </div>
    );
  }

  return (
    <>
      <ParentHomeView
        selectedMember={state.selectedMember}
        prescriptions={state.prescriptions}
        feed={state.feed}
        language={language}
        demo={false}
        onConfirmDose={state.confirmDose}
        onAlert={state.alert}
        onOpenHousehold={() => setManage(true)}
      />
      <HouseholdManageModal
        isOpen={isManageOpen}
        onClose={() => setManage(false)}
        subjects={state.members}
        accounts={state.accounts}
        identityId={state.identity?.id || null}
        onAddSubject={() => { setManage(false); setAddSubject(true); }}
        onReclaimIdentity={async () => { setManage(false); await state.claimIdentity(null); }}
        onSignOut={state.signOutFully}
      />
      <AddSubjectModal
        isOpen={isAddSubjectOpen}
        onClose={() => setAddSubject(false)}
        onSave={state.addSubject}
        existingCount={state.members.length}
        variant="parent"
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

      <div style={{ padding: '8px 16px', borderRadius: 12, background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.25)', color: '#B45309', fontSize: 13, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>
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
      <Route path="/demo" element={<DemoEntry />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * Vai đã chọn lần trước → vào thẳng, không hỏi lại.
 *
 * ⚠️ Phải chạy TRƯỚC khi BrowserRouter đọc địa chỉ, nên nó là hàm thường chứ
 * không phải useEffect. Bản trước gọi `history.replaceState` trong useEffect:
 * effect chạy SAU khi router đã mount và đã render trang chào, mà
 * `replaceState` không bắn sự kiện `popstate` nên router không hề biết địa chỉ
 * vừa đổi. Kết quả là thanh địa chỉ ghi `/app` còn màn hình vẫn là trang chào
 * — và bấm nút quay lại của trình duyệt thì lạc hẳn.
 */
function restoredPath() {
  if (window.location.pathname !== '/') return null;
  if (new URLSearchParams(window.location.search).get('demo') === '1') return null;
  try {
    const role = localStorage.getItem(ROLE_KEY);
    if (role === 'manager') return '/app';
    if (role === 'parent') return '/parent';
  } catch { /* chế độ riêng tư */ }
  return null;
}

export default function App() {
  // Dùng đúng MỘT lần, ở lần tải trang đầu. Không dọn đi thì mỗi lần người dùng
  // bấm "Về trang chính" là bị đá ngược lại, không bao giờ ra được trang chào.
  const [pending, setPending] = useState(restoredPath);
  useEffect(() => { if (pending) setPending(null); }, [pending]);

  return (
    <BrowserRouter>
      {pending && <Navigate to={pending} replace />}
      <Shell />
    </BrowserRouter>
  );
}
