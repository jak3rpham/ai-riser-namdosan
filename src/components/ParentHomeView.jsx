import React, { useState } from 'react';
import { CheckCircle2, Mic, Heart, Pill, User, UserCheck, ShieldAlert, PhoneCall } from 'lucide-react';
import confetti from 'canvas-confetti';
import VoiceAssistantModal from './VoiceAssistantModal';
import PharmacyModeModal from './PharmacyModeModal';
import { I18N_STRINGS } from '../services/mockData';
import { askVoiceAssistant } from '../services/geminiService';

export default function ParentHomeView({ selectedMember, prescriptions = [], onConfirmDose, onAlert, language = 'vi', demo = false }) {
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'cabinet' | 'ask' | 'me'
  const [takenStatus, setTakenStatus] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isPharmacyOpen, setIsPharmacyOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // Quick ask state inside 'ask' tab
  const [askQuery, setAskQuery] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [askResponse, setAskResponse] = useState(null);
  const [voiceSeed, setVoiceSeed] = useState(null);

  const t = I18N_STRINGS[language] || I18N_STRINGS.vi;

  const activeMeds = prescriptions
    .filter(p => !selectedMember?.id || p.member_id === selectedMember.id)
    .flatMap(p => p.medications || []);

  const currentMed = activeMeds[0] || null;

  const handleTakePill = async () => {
    setSaveError(null);
    if (!onConfirmDose) { setTakenStatus(true); return; }

    const res = await onConfirmDose(currentMed, selectedMember.display_name);
    if (res && res.ok === false) {
      setSaveError(res.error_message || 'Chưa lưu được lên đám mây. Bác thử lại giúp con nha.');
      return;
    }

    setTakenStatus(true);
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
      ? '❤️ Đã gửi lời nhắn cho con cái rồi ạ'
      : '⚠️ Chưa gửi được, bác thử lại giúp con nha');
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
              {/* 4 Progress Dots */}
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 18px 12px', padding: '10px 12px', background: 'rgba(255, 255, 255, 0.7)', border: '1px solid var(--glass-border)', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', margin: '0 auto 4px', background: 'var(--emerald-ok)', borderColor: 'var(--emerald-ok)', boxShadow: '0 0 10px rgba(5, 150, 105, 0.3)' }}></div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--emerald-ok)' }}>{t.morning}</span>
                </div>

                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', margin: '0 auto 4px', background: takenStatus ? 'var(--emerald-ok)' : 'var(--coral-main)', boxShadow: '0 0 12px var(--coral-glow)' }}></div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--coral-main)' }}>{t.noon}</span>
                </div>

                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', margin: '0 auto 4px', background: '#E2E8F0', border: '2px solid #CBD5E1' }}></div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)' }}>{t.afternoon}</span>
                </div>

                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', margin: '0 auto 4px', background: '#E2E8F0', border: '2px solid #CBD5E1' }}></div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)' }}>{t.evening}</span>
                </div>
              </div>

              {/* Action Card */}
              <div style={{ flex: 1, margin: '0 18px 12px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', border: '1.5px solid rgba(255, 107, 75, 0.3)', borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 12px 30px rgba(31, 38, 135, 0.08)' }}>

                {!currentMed ? (
                  <div style={{ margin: 'auto', textAlign: 'center', padding: '0 8px' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>💊</div>
                    <h3 style={{ fontSize: 17.5, fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1.35 }}>
                      Hôm nay chưa có thuốc nào trong hồ sơ của {selectedMember.display_name}
                    </h3>
                    <p style={{ fontSize: 13.5, color: 'var(--text-sub)', fontWeight: 600, marginTop: 8, lineHeight: 1.5 }}>
                      Nhờ con cái chụp đơn thuốc hoặc vỏ thuốc lên giúp bác nha.
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

                {takenStatus ? (
                  <div style={{ width: '100%', padding: 14, marginTop: 'auto', borderRadius: 18, background: 'var(--emerald-soft)', color: 'var(--emerald-ok)', fontWeight: 800, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <CheckCircle2 size={22} /> {t.taken_done}
                  </div>
                ) : (
                  <button onClick={handleTakePill} className="btn-parent-action" style={{ padding: 15, fontSize: 16.5, marginTop: 'auto' }}>
                    {t.taken_btn}
                  </button>
                )}
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
                  Dạ con chào bác {selectedMember.display_name}! Bác cần hỏi gì về cách dùng thuốc hay kiêng kỵ gì không ạ?
                </div>

                {askResponse && (
                  <div style={{ fontSize: 14.5, color: 'var(--text-dark)', background: 'var(--coral-soft)', padding: 14, borderRadius: 14, fontWeight: 600, border: '1px solid var(--coral-border)' }}>
                    {askResponse}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Hỏi Cháu Bi..."
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

      <VoiceAssistantModal isOpen={isVoiceOpen} onClose={closeVoice} memberProfile={selectedMember} prescriptions={prescriptions} onAlert={onAlert} initialQuestion={voiceSeed} />
      <PharmacyModeModal isOpen={isPharmacyOpen} onClose={() => setIsPharmacyOpen(false)} memberProfile={selectedMember} prescriptions={prescriptions} language={language} />
    </div>
  );
}
