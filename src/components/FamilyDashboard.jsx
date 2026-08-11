import React, { useState } from 'react';
import { Users, Calendar, ShieldCheck, Plus, Sparkles, Activity } from 'lucide-react';
import PrescriptionUploadWizard from './PrescriptionUploadWizard';
import SignatureAlertCard from './SignatureAlertCard';
import MedicineCabinet from './MedicineCabinet';
import { checkSafetyWarnings } from '../services/geminiService';

export default function FamilyDashboard({ members = [], selectedMember, onSelectMember, prescriptions = [], onAddPrescription }) {
  const activePrescription = prescriptions.find(p => p.member_id === selectedMember.id) || prescriptions[0];
  const activeMeds = activePrescription ? activePrescription.medications : [];

  // Run safety warning checks (T15 & M12)
  const warnings = checkSafetyWarnings(activeMeds, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Top Bar: Member Selector & Status */}
      <div className="liquid-card" style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)' }}>Hồ sơ Sức khỏe Gia đình</h3>
          <span style={{ fontSize: 13.5, color: 'var(--text-sub)' }}>Đang theo dõi & hỗ trợ chăm sóc người thân</span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {members.map(m => (
            <div
              key={m.id}
              onClick={() => onSelectMember(m)}
              className={`member-chip ${selectedMember.id === m.id ? 'active' : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 99,
                background: selectedMember.id === m.id ? '#FFF' : 'rgba(255,255,255,0.6)',
                border: selectedMember.id === m.id ? '1.5px solid var(--coral-main)' : '1px solid var(--glass-border)',
                fontWeight: 700, fontSize: 14, color: selectedMember.id === m.id ? 'var(--coral-main)' : 'var(--text-sub)',
                cursor: 'pointer', boxShadow: selectedMember.id === m.id ? '0 4px 14px rgba(255,107,75,0.15)' : 'none'
              }}
            >
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: m.avatar_color || 'var(--coral-grad)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 11, fontWeight: 800 }}>
                {m.display_name.charAt(0)}
              </div>
              {m.display_name} ({m.relation})
            </div>
          ))}
        </div>
      </div>

      {/* Prescription Upload & Scanning Wizard */}
      <PrescriptionUploadWizard onAddPrescription={onAddPrescription} selectedMember={selectedMember} />

      {/* Overview Stat Boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        <div className="liquid-card" style={{ padding: 22 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Tỷ lệ tuân thủ</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--emerald-ok)', margin: '6px 0 2px' }}>96%</div>
          <span style={{ fontSize: 13.5, color: 'var(--emerald-ok)', fontWeight: 700 }}>✓ {selectedMember.display_name} uống rất đúng giờ</span>
        </div>

        <div className="liquid-card" style={{ padding: 22 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Thuốc đang uống</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-dark)', margin: '6px 0 2px' }}>{activeMeds.length} loại</div>
          <span style={{ fontSize: 13.5, color: 'var(--text-sub)', fontWeight: 600 }}>Huyết áp · Mỡ máu · Giảm đau</span>
        </div>

        <div className="liquid-card" style={{ padding: 22 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Tủ thuốc nhà</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--amber-warm)', margin: '6px 0 2px' }}>Hết sau 5 ngày</div>
          <span style={{ fontSize: 13.5, color: 'var(--amber-warm)', fontWeight: 700 }}>⚠️ Tự tạo Task nhắc mua thêm</span>
        </div>
      </div>

      {/* Signature Safety Alerts (T15 & M12) */}
      <div>
        <h4 style={{ fontSize: 17, fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck color="var(--amber-warm)" /> Signature AI Safety Checks
        </h4>
        <SignatureAlertCard warnings={warnings} />
      </div>

      {/* Medicine Cabinet */}
      <MedicineCabinet medications={activeMeds} />

    </div>
  );
}
