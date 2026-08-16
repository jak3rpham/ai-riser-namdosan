import React, { useState } from 'react';
import { CheckCircle2, Mic, Heart, Pill, User, UserCheck, ShieldAlert, PhoneCall, Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import VoiceAssistantModal from './VoiceAssistantModal';
import VoiceCaptureView from './VoiceCaptureView';
import PharmacyModeModal from './PharmacyModeModal';
import { I18N_STRINGS } from '../services/mockData';
import { askVoiceAssistant } from '../services/geminiService';
import { speak } from '../services/honorifics';

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

  // Quick ask state inside 'ask' tab
  const [askQuery, setAskQuery] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [askResponse, setAskResponse] = useState(null);
  const [voiceSeed, setVoiceSeed] = useState(null);
  const [isCaptureOpen, setCaptureOpen] = useState(false);

  const t = I18N_STRINGS[language] || I18N_STRINGS.vi;
  // Xưng hô theo người đang dùng máy — xem src/services/honorifics.js
  const say = (s) => speak(s, selectedMember);

  const activeMeds = prescriptions
    .filter(p => !selectedMember?.id || p.member_id === selectedMember.id)
    .flatMap(p => p.medications || []);

  /**
   * Hôm nay đã uống những gì — đọc từ dòng sự kiện THẬT.
   *
   * ⚠️ Bản trước không đọc gì cả. Bốn chấm cữ trong ngày là màu viết cứng
   * trong JSX: cữ Sáng luôn xanh (= đã uống), cữ Trưa luôn cam (= đang tới),
   * Chiều và Tối luôn xám. Bác mở app lúc 8 giờ tối, chưa uống viên nào, vẫn
   * thấy app khẳng định buổi sáng đã uống rồi. Đó là bịa dữ liệu tuân thủ điều
   * trị ngay trên màn hình chính — và bịa theo hướng nguy hiểm hơn, vì nó làm
   * bác tin là mình đã uống.
   *
   * Cùng lý do đó, "đã uống" không còn là một cờ trong useState: tải lại trang
   * là cờ đó về false và bác bấm lần nữa, ghi hai liều vào hồ sơ.
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

  /**
   * Thuốc cần uống bây giờ: ưu tiên thuốc đúng cữ hiện tại mà chưa uống, rồi
   * tới thuốc bất kỳ chưa uống. Bản trước luôn lấy `activeMeds[0]` — bấm "đã
   * uống rồi" xong là màn hình đứng nguyên ở đó cả ngày, thuốc cữ sau không
   * bao giờ được nhắc.
   */
  const notTakenYet = activeMeds.filter(m => {
    const s = slotOf(m);
    return !s || !takenSlotsToday.has(s);
  });
  const currentMed = notTakenYet.find(m => slotOf(m) === nowSlot) || notTakenYet[0] || null;
  const currentSlot = slotOf(currentMed);
  const takenStatus = activeMeds.length > 0 && !currentMed;

  const handleTakePill = async () => {
    setSaveError(null);
    const slot = currentSlot || nowSlot;
    const remember = () => setJustTook(prev => (prev.includes(slot) ? prev : [...prev, slot]));

    if (!onConfirmDose) { remember(); return; }

    const res = await onConfirmDose(currentMed, selectedMember.display_name);
    if (res && res.ok === false) {
      setSaveError(res.error_message || say('Chưa lưu được lên đám mây. {{You}} thử lại giúp {{me}} {{nha}}.'));
      return;
    }

    remember();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const handleSendStatus = async () => {
    if (!onAlert) {
      setStatusMessage('❤️ Đã ghi nhận (chế độ trình diễn)');
      setTimeout(() => setStatusMessage(null), 4000);
      return;
    }
    const res = await onAlert({ type: 'STATUS_OK', title: 'Hôm nay con thấy trong người ổn' });
    setStatusMessage(res?.ok
      ? say('❤️ Đã gửi lời nhắn cho người nhà rồi{{a}}')
      : say('⚠️ Chưa gửi được, {{you}} thử lại giúp {{me}} {{nha}}'));
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleTabAsk = async (text) => {
    if (!text.trim() || askLoading) return;
    setAskLoading(true);
    setAskResponse(null);
    const res = await askVoiceAssistant(text, selectedMember, prescriptions);
    setAskLoading(false);

    // ⚠️ Ô hỏi nhanh ở tab này chỉ in ra chữ. Nó KHÔNG có nút gọi 115, nút báo
    // người nhà, hay bộ hỏi triệu chứng — nên mọi câu chạm tới sức khỏe phải
    // được chuyển sang trợ lý đầy đủ, không được trả lời cụt ở đây.
    // Trước đây bác gõ "bác chóng mặt" thì app hứa "để con hỏi bác vài câu"
    // rồi im luôn; gõ "đau ngực khó thở" thì cảnh báo hiện ra mà không có nút gọi.
    if (res.isEmergency || res.startIntake || res.quickReplies) {
      setVoiceSeed(text);
      setIsVoiceOpen(true);
      setAskQuery('');
      return;
    }

    setAskResponse(res.text);
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
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Giao diện nút to, zero-input dành riêng cho người lớn tuổi</span>
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
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>
                {language === 'vi' ? 'Chào buổi sáng,' : 'Good morning,'}
              </span>
              <h4 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-dark)' }}>{selectedMember.display_name} ❤️</h4>
            </div>

            <button
              onClick={() => setIsPharmacyOpen(true)}
              style={{
                background: 'var(--coral-soft)', color: 'var(--coral-main)', border: '1px solid var(--coral-border)',
                borderRadius: 14, padding: '6px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer',
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
                {SLOTS.map(slot => {
                  const done = takenSlotsToday.has(slot.id);
                  const isNow = !done && slot.id === nowSlot;
                  const hasMed = activeMeds.some(m => slotOf(m) === slot.id);

                  // Cữ không có thuốc nào thì để xám nhạt — không hứa hẹn gì cả
                  const color = done ? 'var(--emerald-ok)'
                    : isNow && hasMed ? 'var(--coral-main)'
                    : 'var(--text-muted)';

                  return (
                    <div key={slot.id} style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: '50%', margin: '0 auto 4px',
                        background: done ? 'var(--emerald-ok)' : isNow && hasMed ? 'var(--coral-main)' : '#E2E8F0',
                        border: done || (isNow && hasMed) ? 'none' : '2px solid #CBD5E1',
                        boxShadow: done ? '0 0 10px rgba(5, 150, 105, 0.3)'
                          : isNow && hasMed ? '0 0 12px var(--coral-glow)' : 'none'
                      }}></div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color }}>{t[slot.key]}</span>
                    </div>
                  );
                })}
              </div>

              {/* Action Card */}
              <div style={{ flex: 1, margin: '0 18px 12px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', border: '1.5px solid rgba(255, 107, 75, 0.3)', borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 12px 30px rgba(31, 38, 135, 0.08)' }}>

                {/* Uống hết rồi KHÁC hẳn chưa có thuốc nào. Bản trước gộp làm
                    một, nên bấm xong hết là app quay ra nói "chưa có thuốc nào
                    trong hồ sơ" — nghe như đơn thuốc vừa bị mất. */}
                {takenStatus ? (
                  <div style={{ margin: 'auto', textAlign: 'center', padding: '0 8px' }}>
                    <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald-ok)', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
                      <CheckCircle2 size={42} />
                    </div>
                    <h3 style={{ fontSize: 18.5, fontWeight: 800, color: 'var(--emerald-ok)', lineHeight: 1.35 }}>
                      {say('Hôm nay {{you}} uống đủ thuốc rồi{{a}}')}
                    </h3>
                    <p style={{ fontSize: 13.5, color: 'var(--text-sub)', fontWeight: 600, marginTop: 8, lineHeight: 1.5 }}>
                      {say('{{Me}} đã báo cho người nhà biết. Tới cữ sau {{me}} nhắc tiếp {{nha}}.')}
                    </p>
                  </div>
                ) : !currentMed ? (
                  <div style={{ margin: 'auto', textAlign: 'center', padding: '0 8px' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>💊</div>
                    <h3 style={{ fontSize: 17.5, fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1.35 }}>
                      Hôm nay chưa có thuốc nào trong hồ sơ của {selectedMember.display_name}
                    </h3>
                    <p style={{ fontSize: 13.5, color: 'var(--text-sub)', fontWeight: 600, marginTop: 8, lineHeight: 1.5 }}>
                      {say('Nhờ người nhà chụp đơn thuốc hoặc vỏ thuốc lên giúp {{you}} {{nha}}.')}
                    </p>
                  </div>
                ) : (
                <>
                <div style={{ background: 'var(--coral-soft)', color: 'var(--coral-main)', fontSize: 12.5, fontWeight: 800, padding: '5px 14px', borderRadius: 99, border: '1px solid var(--coral-border)', marginBottom: 10 }}>
                  ⏰ {currentMed.timing || 'Chưa rõ giờ'}
                </div>

                <div style={{ width: 90, height: 90, borderRadius: 28, background: 'linear-gradient(145deg, #FFFFFF, #F1F5F9)', border: '1px solid var(--glass-border)', display: 'grid', placeItems: 'center', boxShadow: '0 12px 24px rgba(31, 38, 135, 0.08)', marginBottom: 12 }}>
                  <div style={{ width: 48, height: 26, borderRadius: 13, background: 'linear-gradient(90deg, #FF6B4B 50%, #E2E8F0 50%)', transform: 'rotate(-35deg)', boxShadow: '0 6px 14px rgba(0,0,0,0.12)' }}></div>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1.2 }}>{currentMed.name}</h3>
                <span style={{ fontSize: 13, color: 'var(--coral-main)', fontWeight: 700, marginTop: 2 }}>{currentMed.nick_name || currentMed.generic}</span>
                <p style={{ fontSize: 13.5, color: 'var(--text-sub)', fontWeight: 500, marginTop: 4 }}>{currentMed.dosage}</p>

                {saveError && (
                  <div style={{ width: '100%', padding: 10, borderRadius: 12, background: '#FEF2F2', color: '#B91C1C', fontSize: 13, fontWeight: 700, textAlign: 'center', marginTop: 'auto', marginBottom: 8 }}>
                    {saveError}
                  </div>
                )}

                {/* Nhánh này chỉ chạy khi CÒN thuốc chưa uống — trạng thái "đã
                    uống xong" đã xử ở khối trên, theo dữ liệu thật. */}
                <button onClick={handleTakePill} className="btn-parent-action" style={{ padding: 15, fontSize: 16.5, marginTop: 'auto' }}>
                  {t.taken_btn}
                </button>
                </>
                )}
              </div>

              {/* Quick Controls */}
              <div style={{ padding: '0 18px 12px', display: 'flex', gap: 10 }}>
                <button onClick={() => setIsVoiceOpen(true)} className="btn-secondary" style={{ flex: 1, padding: 11, borderRadius: 16, fontSize: 12.5 }}>
                  <Mic size={16} color="var(--coral-main)" /> {t.ask_bi_btn}
                </button>
                <button onClick={handleSendStatus} className="btn-secondary" style={{ flex: 1, padding: 11, borderRadius: 16, fontSize: 12.5 }}>
                  <Heart size={16} color="#EF4444" fill="#EF4444" /> {t.send_status_btn}
                </button>
              </div>
            </>
          )}

          {/* TAB 2: TỦ THUỐC */}
          {activeTab === 'cabinet' && (
            <div style={{ flex: 1, padding: '0 18px 12px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)' }}>📦 Tủ thuốc gia đình</h3>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--coral-main)' }}>{activeMeds.length} loại</span>
              </div>

              {activeMeds.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-sub)' }}>
                  Chưa có thuốc nào trong tủ thuốc.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {activeMeds.map((med, i) => (
                    <div key={i} style={{ padding: 16, borderRadius: 18, background: '#FFF', border: '1px solid var(--glass-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-dark)' }}>{med.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--coral-main)', fontWeight: 700, marginTop: 2 }}>{med.nick_name || med.generic}</div>
                      <div style={{ fontSize: 13.5, color: 'var(--text-sub)', marginTop: 6, fontWeight: 600 }}>Liều: {med.dosage} · {med.timing || med.time_slot}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HỎI CHÁU BI */}
          {activeTab === 'ask' && (
            <div style={{ flex: 1, padding: '0 18px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 10 }}>🎙️ Trợ lý Cháu Bi</h3>

              <div style={{ flex: 1, padding: 16, borderRadius: 20, background: '#FFF', border: '1px solid var(--glass-border)', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 14, color: 'var(--text-dark)', background: '#F8FAFC', padding: 12, borderRadius: 14, fontWeight: 600 }}>
                  {say(`{{Da}} {{me}} chào ${selectedMember.display_name}! {{You}} cần hỏi gì về cách dùng thuốc hay kiêng kỵ gì không{{a}}?`)}
                </div>

                {askResponse && (
                  <div style={{ fontSize: 14.5, color: 'var(--text-dark)', background: 'var(--coral-soft)', padding: 14, borderRadius: 14, fontWeight: 600, border: '1px solid var(--coral-border)' }}>
                    {askResponse}
                  </div>
                )}
              </div>

              <button
                onClick={() => setCaptureOpen(true)}
                style={{
                  width: '100%', padding: '18px 20px', marginBottom: 10, borderRadius: 18,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)', color: '#FFF',
                  fontSize: 18, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 10px 26px rgba(2,132,199,0.32)'
                }}
              >
                <Mic size={24} /> {say('Bấm vào đây rồi nói')}
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Hoặc gõ chữ ở đây..."
                  value={askQuery}
                  onChange={e => setAskQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTabAsk(askQuery)}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 14, border: '1px solid var(--glass-border)', fontSize: 15, fontFamily: 'inherit' }}
                />
                <button className="btn-primary" onClick={() => handleTabAsk(askQuery)} disabled={askLoading} style={{ padding: '0 18px', borderRadius: 14 }}>
                  {askLoading ? '...' : 'Gửi'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: TÔI */}
          {activeTab === 'me' && (
            <div style={{ flex: 1, padding: '0 18px 12px', overflowY: 'auto' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 14 }}>👤 Hồ sơ của tôi</h3>

              <div style={{ padding: 18, borderRadius: 20, background: '#FFF', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Họ tên:</span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)' }}>{selectedMember.display_name}</div>
                </div>

                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Tiền sử Dị ứng:</span>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: selectedMember.allergies?.length ? '#DC2626' : 'var(--emerald-ok)' }}>
                    {selectedMember.allergies?.length ? selectedMember.allergies.join(', ') : 'Không có dị ứng'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Bệnh nền:</span>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-dark)' }}>
                    {selectedMember.conditions?.length ? selectedMember.conditions.join(', ') : 'Bình thường'}
                  </div>
                </div>

                {onOpenHousehold && (
                  <div style={{ paddingTop: 12, borderTop: '1px dashed var(--glass-border)' }}>
                    <button
                      className="btn-secondary"
                      onClick={onOpenHousehold}
                      style={{ width: '100%', padding: 13, borderRadius: 13, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
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

          {/* BOTTOM TAB BAR (P1 Spec) */}
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
      />
      <VoiceAssistantModal isOpen={isVoiceOpen} onClose={closeVoice} memberProfile={selectedMember} prescriptions={prescriptions} onAlert={onAlert} initialQuestion={voiceSeed} />
      <PharmacyModeModal isOpen={isPharmacyOpen} onClose={() => setIsPharmacyOpen(false)} memberProfile={selectedMember} prescriptions={prescriptions} language={language} />
    </div>
  );
}
