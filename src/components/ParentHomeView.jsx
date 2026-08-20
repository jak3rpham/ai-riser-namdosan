import React, { useRef, useState, useEffect } from 'react';
import { CheckCircle2, Mic, Heart, Pill, User, UserCheck, ShieldAlert, PhoneCall, Users, Loader2, Volume2, Send, AlertTriangle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import VoiceAssistantModal from './VoiceAssistantModal';
import VoiceCaptureView from './VoiceCaptureView';
import PharmacyModeModal from './PharmacyModeModal';
import { I18N_STRINGS } from '../services/i18n';
import { askVoiceAssistant } from '../services/geminiService';
import { speak } from '../services/honorifics';
import { speakOut, stopSpeaking } from '../services/speechService';

/** Bốn cữ trong ngày, kèm giờ bắt đầu — dùng để biết bây giờ đang ở cữ nào. */
const SLOTS = [
  { id: 'Sáng', key: 'morning', from: 4 },
  { id: 'Trưa', key: 'noon', from: 10 },
  { id: 'Chiều', key: 'afternoon', from: 14 },
  { id: 'Tối', key: 'evening', from: 18 }
];

/** Cữ ứng với thời điểm hiện tại. Trước 4h sáng thì vẫn tính là cữ Tối. */
function currentSlotId(now = new Date()) {
  const h = now.getHours();
  if (h < SLOTS[0].from) return 'Tối';
  return [...SLOTS].reverse().find(s => h >= s.from).id;
}

function isToday(ts) {
  if (!ts) return true;   // vừa ghi, máy chủ chưa đóng dấu giờ → coi là hôm nay
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

/** Cữ của một loại thuốc: "Sáng (sau ăn)" → "Sáng" */
function slotOf(med) {
  const raw = String(med?.time_slot || med?.timing || '');
  return SLOTS.find(s => raw.includes(s.id))?.id || null;
}

export default function ParentHomeView({ selectedMember, prescriptions = [], feed = [], onConfirmDose, onAlert, language = 'vi', demo = false, onOpenHousehold = null }) {
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'cabinet' | 'ask' | 'me'
  // Cữ vừa bấm xong nhưng Firestore chưa vọng về. Phải là MẢNG chứ không phải
  // một giá trị: bấm cữ thứ hai mà ghi đè cữ thứ nhất thì cữ thứ nhất hiện lại
  // như chưa uống, và bác uống lần nữa. Trạng thái THẬT vẫn lấy từ `feed`.
  const [justTook, setJustTook] = useState([]);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isPharmacyOpen, setIsPharmacyOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // Chat stream in 'ask' tab — lưu riêng từng hồ sơ để không bao giờ bị overlap
  const [askQuery, setAskQuery] = useState('');
  const [askLoading, setAskLoading] = useState(false);

  const isVi = language === 'vi';

  const defaultGreetingFor = (profile) => ({
    id: `msg_0_${profile?.id || 'default'}`,
    sender: 'assistant',
    text: isVi
      ? speak(`{{Da}} {{me}} chào ${profile?.display_name || ''}! {{Me}} là Cháu Bi đây{{a}}. {{You}} cần hỏi gì về thuốc, giờ uống hay trong người thấy thế nào cứ nói với {{me}} {{nha}}!`, profile)
      : `Hello ${profile?.display_name || ''}! I am AI Bi. Ask me any question about your medications, schedules, or health symptoms!`,
    quickReplies: isVi ? [
      { label: 'Hôm nay uống thuốc gì?', query: 'Hôm nay bác cần uống những thuốc gì con?' },
      { label: 'Thuốc này uống lúc nào?', query: 'Thuốc của bác uống trước ăn hay sau ăn con?' },
      { label: 'Trong người hơi mệt', query: 'Hôm nay trong người bác thấy hơi mệt' }
    ] : [
      { label: 'Today medications?', query: 'What medications do I need to take today?' },
      { label: 'When to take this?', query: 'Should I take my medicines before or after meals?' },
      { label: 'Feeling unwell', query: 'I am feeling a bit unwell today' }
    ]
  });

  const [chatByMember, setChatByMember] = useState({});
  const chatBottomRef = useRef(null);

  const memberId = selectedMember?.id || 'default';
  const chatMessages = chatByMember[memberId] || [defaultGreetingFor(selectedMember)];

  useEffect(() => {
    if (activeTab === 'ask') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab, askLoading]);

  const [voiceSeed, setVoiceSeed] = useState(null);
  const [isCaptureOpen, setCaptureOpen] = useState(false);

  const t = I18N_STRINGS[language] || I18N_STRINGS.vi;
  // Xưng hô theo người đang dùng máy — xem src/services/honorifics.js
  const say = (s) => (isVi ? speak(s, selectedMember) : s);

  const activeMeds = prescriptions
    .filter(p => !selectedMember?.id || p.member_id === selectedMember.id)
    .flatMap(p => p.medications || []);

  /**
   * Hôm nay đã uống những gì — đọc từ dòng sự kiện THẬT.
   */
  const takenSlotsToday = new Set(
    feed
      .filter(f => f.type === 'DOSE_TAKEN'
        && (!selectedMember?.id || f.subject_id === selectedMember.id)
        && isToday(f.at))
      .map(f => SLOTS.find(s => String(f.time_slot || '').includes(s.id))?.id)
      .filter(Boolean)
  );
  justTook.forEach(s => takenSlotsToday.add(s));

  const nowSlot = currentSlotId();

  const notTakenYet = activeMeds.filter(m => {
    const s = slotOf(m);
    return !s || !takenSlotsToday.has(s);
  });
  const currentMed = notTakenYet.find(m => slotOf(m) === nowSlot) || notTakenYet[0] || null;
  const currentSlot = slotOf(currentMed);
  const takenStatus = activeMeds.length > 0 && !currentMed;

  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);

  const handleTakePill = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaveError(null);
    const slot = currentSlot || nowSlot;
    const remember = () => setJustTook(prev => (prev.includes(slot) ? prev : [...prev, slot]));

    if (!onConfirmDose) { remember(); savingRef.current = false; return; }

    setSaving(true);
    const res = await onConfirmDose(currentMed, selectedMember.display_name);
    setSaving(false);
    savingRef.current = false;

    if (res && res.ok === false) {
      setSaveError(res.error_message || (isVi ? say('Chưa lưu được lên đám mây. {{You}} thử lại giúp {{me}} {{nha}}.') : 'Failed to sync. Please retry.'));
      return;
    }

    remember();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const sendingRef = useRef(false);
  const [sendingStatus, setSendingStatus] = useState(false);

  const handleSendStatus = async () => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    if (!onAlert) {
      sendingRef.current = false;
      setStatusMessage(isVi ? '❤️ Đã ghi nhận (chế độ trình diễn)' : '❤️ Logged (demo mode)');
      setTimeout(() => setStatusMessage(null), 4000);
      return;
    }
    setSendingStatus(true);
    const res = await onAlert({ type: 'STATUS_OK', title: isVi ? 'Hôm nay con thấy trong người ổn' : 'Feeling well today' });
    setSendingStatus(false);
    sendingRef.current = false;
    setStatusMessage(res?.ok
      ? (isVi ? say('❤️ Đã gửi lời nhắn cho người nhà rồi{{a}}') : '❤️ Status sent to family')
      : (isVi ? say('⚠️ Chưa gửi được, {{you}} thử lại giúp {{me}} {{nha}}') : '⚠️ Send failed, please retry'));
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleTabAsk = async (textToSend) => {
    const text = (textToSend || askQuery || '').trim();
    if (!text || askLoading) return;

    const userMsg = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text
    };

    const currentHistory = chatByMember[memberId] || [defaultGreetingFor(selectedMember)];
    const updatedHistory = [...currentHistory, userMsg];

    setChatByMember(prev => ({
      ...prev,
      [memberId]: updatedHistory
    }));
    setAskQuery('');
    setAskLoading(true);

    const res = await askVoiceAssistant(text, selectedMember, prescriptions, language, updatedHistory);
    setAskLoading(false);

    const biMsg = {
      id: 'bi_' + Date.now(),
      sender: 'assistant',
      text: res.text,
      isEmergency: res.isEmergency,
      quickReplies: res.quickReplies || null,
      source: res.source
    };

    setChatByMember(prev => ({
      ...prev,
      [memberId]: [...(prev[memberId] || updatedHistory), biMsg]
    }));

    // Tự động phát âm thanh giọng Cháu Bi
    speakOut(res.text, selectedMember, language);
  };

  const handleChatQuickReply = async (reply) => {
    if (reply.action === 'NOTIFY_FAMILY') {
      if (onAlert) {
        await onAlert({
          type: 'FAMILY_NOTIFY',
          title: `Bác ${selectedMember?.display_name || ''} cần hỗ trợ`,
          message: `Bác vừa trao đổi với Cháu Bi và cần người nhà liên hệ hỗ trợ.`
        });
      }
      const confMsg = {
        id: 'bi_' + Date.now(),
        sender: 'assistant',
        text: isVi ? say('{{Da}} con đã gửi thông báo đến máy con cái liền rồi ạ! Bác có muốn bấm gọi trực tiếp cho người nhà luôn không ạ?') : 'Notification sent to your family! Would you like to call them directly?',
        quickReplies: isVi ? [
          { label: '📞 Bấm gọi người nhà', action: 'CALL_FAMILY' },
          { label: 'Đã đỡ hơn rồi', query: 'Bác thấy đỡ hơn rồi, con đừng lo nhé' }
        ] : [
          { label: '📞 Call Family Member', action: 'CALL_FAMILY' },
          { label: 'Feeling better now', query: 'I am feeling better now' }
        ]
      };
      setChatByMember(prev => ({
        ...prev,
        [memberId]: [...(prev[memberId] || []), confMsg]
      }));
      speakOut(confMsg.text, selectedMember, language);
      return;
    }

    if (reply.action === 'CALL_FAMILY') {
      const callMsg = {
        id: 'bi_' + Date.now(),
        sender: 'assistant',
        text: isVi ? say('{{Da}} con đang mở cuộc gọi đến số người nhà giúp {{you}} đây ạ.') : 'Connecting call to your family contact...'
      };
      setChatByMember(prev => ({
        ...prev,
        [memberId]: [...(prev[memberId] || []), callMsg]
      }));
      window.location.href = 'tel:0901234567';
      return;
    }

    if (reply.action === 'START_INTAKE') {
      setIsVoiceOpen(true);
      return;
    }

    if (reply.query) {
      handleTabAsk(reply.query);
      return;
    }

    if (reply.label) {
      handleTabAsk(reply.label);
    }
  };

  const closeVoice = () => {
    setIsVoiceOpen(false);
    setVoiceSeed(null);
  };

  const frameStyle = demo
    ? { background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(30px)', border: '4px solid rgba(255,255,255,0.9)', borderRadius: 48, padding: 10, boxShadow: '0 30px 70px rgba(31,38,135,0.15)', position: 'relative' }
    : { width: '100%', maxWidth: 480, minHeight: '100dvh', background: 'transparent', border: 'none', padding: 0, position: 'relative' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

      {demo && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)' }}>{t.parent_view} — {selectedMember.display_name}</h3>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{isVi ? 'Giao diện nút to, zero-input dành riêng cho người lớn tuổi' : 'High-contrast, zero-input interface designed for seniors'}</span>
        </div>
      )}

      <div className={demo ? 'phone-frame' : ''} style={frameStyle}>

        {demo && (
          <div className="notch" style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', width: 96, height: 22, background: '#0F172A', borderRadius: 20, zIndex: 50 }}></div>
        )}

        <div style={{ width: '100%', height: '100%', minHeight: demo ? undefined : '100dvh', background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2F6 100%)', borderRadius: demo ? 38 : 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          {/* Header */}
          <div style={{ padding: '38px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                {isVi ? 'Chào buổi sáng,' : 'Good morning,'}
              </span>
              <h4 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)' }}>{selectedMember.display_name} ❤️</h4>
            </div>

            <button
              onClick={() => setIsPharmacyOpen(true)}
              style={{
                background: 'var(--coral-soft)', color: 'var(--coral-main)', border: '1px solid var(--coral-border)',
                borderRadius: 16, padding: '6px 10px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              <UserCheck size={14} /> {t.pharmacy_mode_btn}
            </button>
          </div>

          {/* TAB 1: HÔM NAY */}
          {activeTab === 'today' && (
            <>
              {/* 4 chấm cữ trong ngày — trạng thái lấy từ dòng sự kiện thật */}
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 18px 12px', padding: '10px 12px', background: 'rgba(255, 255, 255, 0.7)', border: '1px solid var(--glass-border)', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                {SLOTS.map((slot, i) => {
                  const done = takenSlotsToday.has(slot.id);
                  const hasMed = activeMeds.some(m => slotOf(m) === slot.id);

                  /**
                   * Cam = có thuốc cữ này mà chưa uống, VÀ cữ đó đã tới giờ.
                   *
                   * ⚠️ Trước đây chỉ tô cam đúng cữ hiện tại. Nên lúc 5 giờ
                   * chiều, thuốc cữ Sáng chưa uống thì chấm Sáng vẫn xám như
                   * không có gì — trong khi cái thẻ ngay dưới nó đang bảo uống
                   * đúng viên thuốc cữ Sáng đó. Hai chỗ trên cùng một màn hình
                   * nói hai chuyện khác nhau.
                   *
                   * Cữ chưa tới giờ thì để xám: chưa tới thì chưa nợ.
                   */
                  const nowIndex = SLOTS.findIndex(s => s.id === nowSlot);
                  const due = hasMed && !done && i <= nowIndex;

                  const color = done ? 'var(--emerald-ok)'
                    : due ? 'var(--coral-main)'
                    : 'var(--text-muted)';

                  return (
                    <div key={slot.id} style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: '50%', margin: '0 auto 4px',
                        background: done ? 'var(--emerald-ok)' : due ? 'var(--coral-main)' : '#E2E8F0',
                        border: done || due ? 'none' : '2px solid #CBD5E1',
                        boxShadow: done ? '0 0 10px rgba(5, 150, 105, 0.3)'
                          : due ? '0 0 12px var(--coral-glow)' : 'none'
                      }}></div>
                      <span style={{ fontSize: 11, fontWeight: 700, color }}>{t[slot.key]}</span>
                    </div>
                  );
                })}
              </div>

              {/* Action Card */}
              <div style={{ flex: 1, margin: '0 18px 12px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', border: '1.5px solid rgba(255, 107, 75, 0.3)', borderRadius: 20, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 12px 30px rgba(31, 38, 135, 0.08)' }}>

                {/* Uống hết rồi KHÁC hẳn chưa có thuốc nào. Bản trước gộp làm
                    một, nên bấm xong hết là app quay ra nói "chưa có thuốc nào
                    trong hồ sơ" — nghe như đơn thuốc vừa bị mất. */}
                {takenStatus ? (
                  <div style={{ margin: 'auto', textAlign: 'center', padding: '0 8px' }}>
                    <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald-ok)', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
                      <CheckCircle2 size={42} />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--emerald-ok)', lineHeight: 1.35 }}>
                      {isVi ? say('Hôm nay {{you}} uống đủ thuốc rồi{{a}}') : 'You have taken all your medications today!'}
                    </h3>
                    <p style={{ fontSize: 16, color: 'var(--text-sub)', fontWeight: 600, marginTop: 8, lineHeight: 1.5 }}>
                      {isVi ? say('{{Me}} đã báo cho người nhà biết. Tới cữ sau {{me}} nhắc tiếp {{nha}}.') : 'Your family has been updated. Next reminder will sound on schedule.'}
                    </p>
                  </div>
                ) : !currentMed ? (
                  <div style={{ margin: 'auto', textAlign: 'center', padding: '0 8px' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>💊</div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1.35 }}>
                      {isVi ? `Hôm nay chưa có thuốc nào trong hồ sơ của ${selectedMember.display_name}` : `No medications scheduled today for ${selectedMember.display_name}`}
                    </h3>
                    <p style={{ fontSize: 16, color: 'var(--text-sub)', fontWeight: 600, marginTop: 8, lineHeight: 1.5 }}>
                      {isVi ? say('Nhờ người nhà chụp đơn thuốc hoặc vỏ thuốc lên giúp {{you}} {{nha}}.') : 'Ask your caregiver to scan prescription or pill box.'}
                    </p>
                  </div>
                ) : (
                <>
                <div style={{ background: 'var(--coral-soft)', color: 'var(--coral-main)', fontSize: 16, fontWeight: 800, padding: '5px 14px', borderRadius: 99, border: '1px solid var(--coral-border)', marginBottom: 10 }}>
                  ⏰ {currentMed.timing || (isVi ? 'Chưa rõ giờ' : 'Flexible time')}
                </div>

                <div style={{ width: 90, height: 90, borderRadius: 26, background: 'linear-gradient(145deg, #FFFFFF, #F1F5F9)', border: '1px solid var(--glass-border)', display: 'grid', placeItems: 'center', boxShadow: '0 12px 24px rgba(31, 38, 135, 0.08)', marginBottom: 12 }}>
                  <div style={{ width: 48, height: 26, borderRadius: 12, background: 'linear-gradient(90deg, #FF6B4B 50%, #E2E8F0 50%)', transform: 'rotate(-35deg)', boxShadow: '0 6px 14px rgba(0,0,0,0.12)' }}></div>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1.2 }}>{currentMed.name}</h3>
                <span style={{ fontSize: 16, color: 'var(--coral-main)', fontWeight: 700, marginTop: 2 }}>{currentMed.nick_name || currentMed.generic}</span>
                <p style={{ fontSize: 16, color: 'var(--text-sub)', fontWeight: 500, marginTop: 4 }}>{currentMed.dosage}</p>

                {saveError && (
                  <div style={{ width: '100%', padding: 10, borderRadius: 12, background: '#FEF2F2', color: '#B91C1C', fontSize: 16, fontWeight: 700, textAlign: 'center', marginTop: 'auto', marginBottom: 8 }}>
                    {saveError}
                  </div>
                )}

                {/* Nhánh này chỉ chạy khi CÒN thuốc chưa uống — trạng thái "đã
                    uống xong" đã xử ở khối trên, theo dữ liệu thật. */}
                <button
                  onClick={handleTakePill}
                  disabled={saving}
                  className="btn-parent-action"
                  style={{ padding: 15, fontSize: 16, marginTop: 'auto', opacity: saving ? 0.75 : 1 }}
                >
                  {saving
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Loader2 className="animate-spin" size={20} /> {isVi ? say('{{Me}} đang ghi lại...') : 'Saving...'}
                      </span>
                    : t.taken_btn}
                </button>
                </>
                )}
              </div>

              {/* Quick Controls */}
              <div style={{ padding: '0 18px 12px', display: 'flex', gap: 10 }}>
                <button onClick={() => setIsVoiceOpen(true)} className="btn-secondary" style={{ flex: 1, padding: 11, borderRadius: 16, fontSize: 13 }}>
                  <Mic size={16} color="var(--coral-main)" /> {t.ask_bi_btn}
                </button>
                <button onClick={handleSendStatus} disabled={sendingStatus} className="btn-secondary" style={{ flex: 1, padding: 11, borderRadius: 16, fontSize: 13, opacity: sendingStatus ? 0.7 : 1 }}>
                  {sendingStatus
                    ? <><Loader2 className="animate-spin" size={16} /> {isVi ? 'Đang gửi...' : 'Sending...'}</>
                    : <><Heart size={16} color="#EF4444" fill="#EF4444" /> {t.send_status_btn}</>}
                </button>
              </div>
            </>
          )}

          {/* TAB 2: TỦ THUỐC */}
          {activeTab === 'cabinet' && (
            <div style={{ flex: 1, padding: '0 18px 12px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)' }}>📦 {t.medicine_cabinet}</h3>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--coral-main)' }}>{isVi ? `${activeMeds.length} loại` : `${activeMeds.length} items`}</span>
              </div>

              {activeMeds.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-sub)' }}>
                  {isVi ? 'Chưa có thuốc nào trong tủ thuốc.' : 'No medications in the cabinet.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {activeMeds.map((med, i) => (
                    <div key={i} style={{ padding: 16, borderRadius: 20, background: '#FFF', border: '1px solid var(--glass-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)' }}>{med.name}</div>
                      <div style={{ fontSize: 16, color: 'var(--coral-main)', fontWeight: 700, marginTop: 2 }}>{med.nick_name || med.generic}</div>
                      <div style={{ fontSize: 16, color: 'var(--text-sub)', marginTop: 6, fontWeight: 600 }}>{isVi ? 'Liều:' : 'Dose:'} {med.dosage} · {med.timing || med.time_slot}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HỎI CHÁU BI */}
          {activeTab === 'ask' && (
            <div style={{ flex: 1, padding: '0 16px 12px', overflowY: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🎙️ Trợ lý Cháu Bi
                </h3>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--emerald-ok)', background: '#ECFDF5', padding: '3px 10px', borderRadius: 12 }}>
                  {isVi ? 'Sẵn sàng trò chuyện' : 'Ready to chat'}
                </span>
              </div>

              {/* Chat stream container */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '12px 6px', display: 'flex', flexDirection: 'column', gap: 14,
                marginBottom: 10, borderRadius: 20, background: 'rgba(248, 250, 252, 0.8)', border: '1px solid var(--glass-border)'
              }}>
                {chatMessages.map(msg => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className="chat-bubble-enter"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isUser ? 'flex-end' : 'flex-start',
                        width: '100%'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, maxWidth: '90%', flexDirection: isUser ? 'row-reverse' : 'row' }}>
                        {/* Avatar */}
                        {!isUser && (
                          <div style={{
                            width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B4B 0%, #EA580C 100%)',
                            display: 'grid', placeItems: 'center', color: '#FFF', fontSize: 15, fontWeight: 800, flexShrink: 0,
                            boxShadow: '0 4px 10px rgba(234, 88, 12, 0.25)'
                          }}>
                            Bi
                          </div>
                        )}

                        {/* Bubble Body */}
                        <div style={{
                          padding: '13px 16px',
                          borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                          background: isUser ? 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)' : msg.isEmergency ? '#FEF2F2' : '#FFFFFF',
                          color: isUser ? '#FFFFFF' : 'var(--text-dark)',
                          fontSize: 16,
                          lineHeight: 1.55,
                          fontWeight: 600,
                          border: msg.isEmergency ? '2px solid #EF4444' : '1px solid var(--glass-border)',
                          boxShadow: isUser ? '0 6px 16px rgba(2, 132, 199, 0.22)' : '0 4px 14px rgba(0,0,0,0.04)'
                        }}>
                          {msg.isEmergency && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#DC2626', fontWeight: 800, marginBottom: 8, fontSize: 15 }}>
                              <AlertTriangle size={18} /> {isVi ? 'CẢNH BÁO KHẨN CẤP' : 'EMERGENCY ALERT'}
                            </div>
                          )}

                          <div>{msg.text}</div>

                          {/* Emergency 115 Action button */}
                          {msg.isEmergency && (
                            <div style={{ marginTop: 12 }}>
                              <a
                                href="tel:115"
                                style={{
                                  padding: '12px 16px', background: '#DC2626', color: '#FFF', borderRadius: 14,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                  fontWeight: 800, textDecoration: 'none', fontSize: 16, boxShadow: '0 4px 12px rgba(220,38,38,0.3)'
                                }}
                              >
                                <PhoneCall size={20} /> {isVi ? 'Gọi 115 ngay' : 'Call 115 Now'}
                              </a>
                            </div>
                          )}

                          {/* Speaker button on Bi's message */}
                          {!isUser && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                              <button
                                onClick={() => speakOut(msg.text, selectedMember, language)}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: 2
                                }}
                                title={isVi ? "Nghe lại lời Cháu Bi" : "Listen to AI Bi"}
                              >
                                <Volume2 size={15} /> {isVi ? 'Nghe lại' : 'Listen'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick replies chips */}
                      {msg.quickReplies && msg.quickReplies.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, paddingLeft: isUser ? 0 : 46, maxWidth: '100%' }}>
                          {msg.quickReplies.map((qr, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleChatQuickReply(qr)}
                              style={{
                                padding: '8px 14px', borderRadius: 16, background: '#FFFFFF', border: '1px solid var(--coral-border)',
                                color: 'var(--coral-main)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(255,107,75,0.1)', fontFamily: 'inherit',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {qr.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Loading animation when Bi is thinking */}
                {askLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: '85%' }} className="chat-bubble-enter">
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B4B 0%, #EA580C 100%)',
                      display: 'grid', placeItems: 'center', color: '#FFF', fontSize: 15, fontWeight: 800, flexShrink: 0
                    }}>
                      Bi
                    </div>
                    <div style={{
                      padding: '14px 18px', borderRadius: '20px 20px 20px 4px', background: '#FFFFFF',
                      border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      <span className="thinking-dot" />
                      <span className="thinking-dot" />
                      <span className="thinking-dot" />
                      <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, marginLeft: 4 }}>{isVi ? 'Cháu Bi đang trả lời...' : 'AI Bi is thinking...'}</span>
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Big Mic Button with Active Waveform */}
              <button
                onClick={() => setCaptureOpen(true)}
                style={{
                  width: '100%', padding: '16px 20px', marginBottom: 10, borderRadius: 20,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: 'linear-gradient(135deg, #FF6B4B 0%, #EA580C 100%)', color: '#FFF',
                  fontSize: 18, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 10px 26px rgba(234,88,12,0.32)'
                }}
              >
                <Mic size={24} /> {isVi ? say('Bấm vào đây để nói chuyện với Bi') : 'Tap to speak with AI Bi'}
              </button>

              {/* Text input fallback */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder={isVi ? "Hoặc gõ câu hỏi ở đây..." : "Or type your question here..."}
                  value={askQuery}
                  onChange={e => setAskQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTabAsk(askQuery)}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 16, border: '1px solid var(--glass-border)', fontSize: 16, fontFamily: 'inherit' }}
                />
                <button className="btn-primary" onClick={() => handleTabAsk(askQuery)} disabled={askLoading} style={{ padding: '0 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {askLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: TÔI */}
          {activeTab === 'me' && (
            <div style={{ flex: 1, padding: '0 18px 12px', overflowY: 'auto' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 14 }}>👤 {isVi ? 'Hồ sơ của tôi' : 'My Profile'}</h3>

              <div style={{ padding: 18, borderRadius: 20, background: '#FFF', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>{isVi ? 'Họ tên:' : 'Full Name:'}</span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)' }}>{selectedMember.display_name}</div>
                </div>

                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>{isVi ? 'Tiền sử Dị ứng:' : 'Allergies:'}</span>
                  <div style={{ fontSize: 16, fontWeight: 700, color: selectedMember.allergies?.length ? '#DC2626' : 'var(--emerald-ok)' }}>
                    {selectedMember.allergies?.length ? selectedMember.allergies.join(', ') : (isVi ? 'Không có dị ứng' : 'No known allergies')}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>{isVi ? 'Bệnh nền:' : 'Underlying Conditions:'}</span>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)' }}>
                    {selectedMember.conditions?.length ? selectedMember.conditions.join(', ') : (isVi ? 'Bình thường' : 'None')}
                  </div>
                </div>

                {onOpenHousehold && (
                  <div style={{ paddingTop: 12, borderTop: '1px dashed var(--glass-border)' }}>
                    <button
                      className="btn-secondary"
                      onClick={onOpenHousehold}
                      style={{ width: '100%', padding: 13, borderRadius: 12, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      <Users size={17} /> Nhà mình có những ai
                    </button>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 7, lineHeight: 1.5, textAlign: 'center' }}>
                      Xem người trong nhà, sửa hồ sơ, hoặc đăng xuất khỏi máy này
                    </div>
                  </div>
                )}

                {/* Khối "Mã nhà (Mời con cái vào xem)" đã bỏ: nó in ra
                    `selectedMember.id` — một id nội bộ, KHÔNG phải mã mời. Từ khi
                    kết nạp thành viên đi qua `invites/{code}` ở backend, id này
                    không mời được ai, nhưng vẫn nằm trên màn hình và lọt vào
                    khung hình khi quay video. Mã mời thật ở HouseholdBar (app Con):
                    hết hạn 7 ngày, giới hạn lượt, thu hồi được. */}
              </div>
            </div>
          )}

          {statusMessage && (
            <div style={{ position: 'absolute', bottom: 65, left: 20, right: 20, padding: 10, borderRadius: 12, background: 'var(--emerald-soft)', color: 'var(--emerald-ok)', fontSize: 12, fontWeight: 700, textAlign: 'center', zIndex: 60 }}>
              {statusMessage}
            </div>
          )}

          {/* Thanh tab dưới đáy */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-around',
            background: '#FFFFFF', borderTop: '1px solid var(--glass-border)',
            padding: '10px 0 14px', zIndex: 50
          }}>
            {[
              { id: 'today', icon: CheckCircle2, label: 'Hôm nay' },
              { id: 'cabinet', icon: Pill, label: 'Tủ thuốc' },
              { id: 'ask', icon: Mic, label: 'Hỏi cháu' },
              { id: 'me', icon: User, label: 'Tôi' }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    // flex: 1 để mỗi tab chiếm đúng một phần tư bề ngang.
                    // Không có nó thì nút co theo độ dài chữ: tab "Tôi" rộng
                    // đúng 22px — bằng nửa mức tối thiểu 44px — trong khi
                    // khoảng trống hai bên nó thì không bấm được.
                    flex: 1,
                    border: 'none', background: 'none', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 3, cursor: 'pointer',
                    color: isActive ? 'var(--coral-main)' : 'var(--text-muted)',
                    fontWeight: isActive ? 800 : 600, fontSize: 11
                  }}
                >
                  <Icon size={22} color={isActive ? 'var(--coral-main)' : 'var(--text-muted)'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      <VoiceCaptureView
        isOpen={isCaptureOpen}
        memberProfile={selectedMember}
        onClose={() => setCaptureOpen(false)}
        onTypeInstead={() => setCaptureOpen(false)}
        onResult={text => { setCaptureOpen(false); handleTabAsk(text); }}
        language={language}
      />
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={closeVoice}
        memberProfile={selectedMember}
        prescriptions={prescriptions}
        onAlert={onAlert}
        initialQuestion={voiceSeed}
        language={language}
      />
      <PharmacyModeModal
        isOpen={isPharmacyOpen}
        onClose={() => setIsPharmacyOpen(false)}
        memberProfile={selectedMember}
        prescriptions={prescriptions}
        language={language}
      />
    </div>
  );
}
