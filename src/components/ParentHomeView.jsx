import React, { useState } from 'react';
import { CheckCircle2, Mic, Heart, Clock, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import VoiceAssistantModal from './VoiceAssistantModal';

export default function ParentHomeView({ selectedMember, prescriptions = [], onConfirmDose }) {
  const [takenStatus, setTakenStatus] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const activeMeds = prescriptions.flatMap(p => p.medications);
  const currentMed = activeMeds[0] || {
    name: "Amlodipine 5mg",
    nick_name: "Viên huyết áp trắng tròn",
    dosage: "Uống 1 viên sau khi ăn trưa",
    timing: "11:30 Trưa",
    time_slot: "Trưa"
  };

  const handleTakePill = () => {
    setTakenStatus(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    if (onConfirmDose) {
      onConfirmDose(currentMed);
    }
  };

  const handleSendStatus = () => {
    setStatusMessage("❤️ Đã gửi lời nhắn: Ba/Mẹ vẫn khỏe tới con gái!");
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <div style={{ textCenter: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)' }}>App Android — {selectedMember.display_name} (P2)</h3>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Giao diện nút to, zero-input dành riêng cho người lớn tuổi</span>
      </div>

      <div style={{ width: 340, height: 680, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(30px)', border: '4px solid rgba(255, 255, 255, 0.9)', borderRadius: 48, padding: 10, boxShadow: '0 30px 70px rgba(31, 38, 135, 0.15)', position: 'relative' }}>
        
        {/* Notch */}
        <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', width: 96, height: 22, background: '#0F172A', borderRadius: 20, zIndex: 50 }}></div>

        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2F6 100%)', borderRadius: 38, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          {/* Header */}
          <div style={{ padding: '38px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>Chào buổi sáng,</span>
              <h4 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-dark)' }}>{selectedMember.display_name} ❤️</h4>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 13, background: 'var(--coral-grad)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 15, color: '#FFF', boxShadow: '0 4px 12px var(--coral-glow)' }}>
              {selectedMember.display_name.charAt(0)}
            </div>
          </div>

          {/* 4 Progress Dots */}
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 18px 14px', padding: '10px 12px', background: 'rgba(255, 255, 255, 0.7)', border: '1px solid var(--glass-border)', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', margin: '0 auto 4px', background: 'var(--emerald-ok)', borderColor: 'var(--emerald-ok)', boxShadow: '0 0 10px rgba(5, 150, 105, 0.3)' }}></div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--emerald-ok)' }}>Sáng</span>
            </div>

            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', margin: '0 auto 4px', background: takenStatus ? 'var(--emerald-ok)' : 'var(--coral-main)', boxShadow: '0 0 12px var(--coral-glow)' }}></div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--coral-main)' }}>Trưa</span>
            </div>

            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', margin: '0 auto 4px', background: '#E2E8F0', border: '2px solid #CBD5E1' }}></div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)' }}>Chiều</span>
            </div>

            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', margin: '0 auto 4px', background: '#E2E8F0', border: '2px solid #CBD5E1' }}></div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)' }}>Tối</span>
            </div>
          </div>

          {/* Action Card */}
          <div style={{ flex: 1, margin: '0 18px 14px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', border: '1.5px solid rgba(255, 107, 75, 0.3)', borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', textCenter: 'center', boxShadow: '0 12px 30px rgba(31, 38, 135, 0.08)' }}>
            
            <div style={{ background: 'var(--coral-soft)', color: 'var(--coral-main)', fontSize: 12.5, fontWeight: 800, padding: '5px 14px', borderRadius: 99, border: '1px solid var(--coral-border)', marginBottom: 12 }}>
              ⏰ Uống lúc {currentMed.timing || '11:30 Trưa'}
            </div>

            <div style={{ width: 100, height: 100, borderRadius: 30, background: 'linear-gradient(145deg, #FFFFFF, #F1F5F9)', border: '1px solid var(--glass-border)', display: 'grid', placeItems: 'center', boxShadow: '0 12px 24px rgba(31, 38, 135, 0.08)', marginBottom: 14 }}>
              <div style={{ width: 52, height: 28, borderRadius: 14, background: 'linear-gradient(90deg, #FF6B4B 50%, #E2E8F0 50%)', transform: 'rotate(-35deg)', boxShadow: '0 6px 14px rgba(0,0,0,0.12)' }}></div>
            </div>

            <h3 style={{ fontSize: 21, fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1.2 }}>{currentMed.name}</h3>
            <span style={{ fontSize: 13.5, color: 'var(--coral-main)', fontWeight: 700, marginTop: 2 }}>{currentMed.nick_name || currentMed.generic}</span>
            <p style={{ fontSize: 14, color: 'var(--text-sub)', fontWeight: 500, marginTop: 6 }}>{currentMed.dosage}</p>

            {takenStatus ? (
              <div style={{ width: '100%', padding: 16, marginTop: 'auto', borderRadius: 20, background: 'var(--emerald-soft)', color: 'var(--emerald-ok)', fontWeight: 800, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <CheckCircle2 size={24} /> Đã uống đúng giờ!
              </div>
            ) : (
              <button onClick={handleTakePill} className="btn-parent-action">
                ✓ ĐÃ UỐNG RỒI
              </button>
            )}
          </div>

          {/* Quick Voice & Heart Controls */}
          <div style={{ padding: '0 18px 18px', display: 'flex', gap: 10 }}>
            <button onClick={() => setIsVoiceOpen(true)} className="btn-secondary" style={{ flex: 1, padding: 12, borderRadius: 16, fontSize: 13 }}>
              <Mic size={18} color="var(--coral-main)" /> Hỏi "Cháu Bi"
            </button>
            <button onClick={handleSendStatus} className="btn-secondary" style={{ flex: 1, padding: 12, borderRadius: 16, fontSize: 13 }}>
              <Heart size={18} color="#EF4444" fill="#EF4444" /> Báo con: ổn
            </button>
          </div>

          {statusMessage && (
            <div style={{ position: 'absolute', bottom: 10, left: 20, right: 20, padding: 10, borderRadius: 12, background: 'var(--emerald-soft)', color: 'var(--emerald-ok)', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
              {statusMessage}
            </div>
          )}

        </div>
      </div>

      <VoiceAssistantModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} memberProfile={selectedMember} />
    </div>
  );
}
