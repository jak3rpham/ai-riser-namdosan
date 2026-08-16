import React from 'react';
import { X, ShieldAlert, HeartPulse, Pill, CheckCircle, AlertTriangle, UserCheck } from 'lucide-react';
import { I18N_STRINGS } from '../services/i18n';

export default function PharmacyModeModal({ isOpen, onClose, memberProfile, prescriptions = [], language = 'vi' }) {
  if (!isOpen) return null;

  const t = I18N_STRINGS[language] || I18N_STRINGS.vi;
  const activeMeds = prescriptions.flatMap(p => p.medications || []);

  // ⚠️ Bản trước đoán Rx/OTC bằng `name.includes('5mg')` — thuốc 10mg bị xếp
  // thành OTC ngay trên màn đưa cho dược sĩ xem (doc 33 mục 11). Giờ thiếu
  // `type` thì xếp vào nhóm "chưa phân loại" thay vì đoán.
  const rxMeds = activeMeds.filter(m => m.type === 'RX');
  const otcMeds = activeMeds.filter(m => m.type === 'OTC');
  const unclassifiedMeds = activeMeds.filter(m => m.type !== 'RX' && m.type !== 'OTC');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 350, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(20px)', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div className="liquid-card" style={{ width: '100%', maxWidth: 760, maxHeight: '92vh', overflowY: 'auto', background: '#FFFFFF', borderRadius: 32, padding: 32, border: '2px solid var(--coral-main)', boxShadow: '0 30px 90px rgba(0,0,0,0.35)' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '2px dashed #E2E8F0', paddingBottom: 20, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 99, background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              <UserCheck size={16} /> {t.pharmacist_view_title}
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-dark)' }}>
              {memberProfile.display_name} ({2026 - (memberProfile.birth_year || 1958)} tuổi)
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-sub)', marginTop: 4, fontWeight: 600 }}>
              Tiền sử y tế & danh sách thuốc đang sử dụng tại nhà
            </p>
          </div>

          <button onClick={onClose} style={{ border: 'none', background: '#F1F5F9', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--text-dark)' }}>
            <X size={24} />
          </button>
        </div>

        {/* Medical Context (Allergies & Conditions) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {/* Allergies */}
          <div style={{ padding: 18, borderRadius: 20, background: memberProfile.allergies?.length ? '#FEF2F2' : '#F8FAFC', border: memberProfile.allergies?.length ? '1.5px solid #FCA5A5' : '1px solid #E2E8F0' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: memberProfile.allergies?.length ? '#DC2626' : 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={16} /> {t.allergies}
            </span>
            <div style={{ fontSize: 18, fontWeight: 800, color: memberProfile.allergies?.length ? '#991B1B' : 'var(--text-dark)', marginTop: 6 }}>
              {memberProfile.allergies?.length ? memberProfile.allergies.join(", ") : t.no_allergies}
            </div>
          </div>

          {/* Conditions */}
          <div style={{ padding: 18, borderRadius: 20, background: '#F0F9FF', border: '1.5px solid #BAE6FD' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#0284C7', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <HeartPulse size={16} /> {t.conditions}
            </span>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0C4A6E', marginTop: 6 }}>
              {memberProfile.conditions?.length ? memberProfile.conditions.join(", ") : "Bình thường"}
            </div>
          </div>
        </div>

        {/* Categorized Medications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* 1. Rx Medications */}
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Pill color="var(--coral-main)" size={18} /> {t.rx_meds} ({rxMeds.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rxMeds.map((med, idx) => (
                <div key={idx} style={{ padding: 16, borderRadius: 16, background: '#FFF8F6', border: '1px solid var(--coral-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h5 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)' }}>{med.name}</h5>
                    <div style={{ fontSize: 14, color: 'var(--coral-main)', fontWeight: 700 }}>
                      Hoạt chất: {med.generic || med.name} · {med.strength}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-dark)' }}>{med.dosage}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-sub)', fontWeight: 600 }}>Cữ {med.time_slot}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. OTC Medications */}
          {otcMeds.length > 0 && (
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Pill color="var(--sky-blue)" size={18} /> {t.otc_meds} ({otcMeds.length})
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {otcMeds.map((med, idx) => (
                  <div key={idx} style={{ padding: 16, borderRadius: 16, background: '#F0F9FF', border: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h5 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)' }}>{med.name}</h5>
                      <div style={{ fontSize: 14, color: 'var(--sky-blue)', fontWeight: 700 }}>
                        Hoạt chất: {med.generic || med.name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-dark)' }}>{med.dosage}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-sub)', fontWeight: 600 }}>{med.timing}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Chưa phân loại — nói rõ thay vì đoán */}
          {unclassifiedMeds.length > 0 && (
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Pill color="var(--text-muted)" size={18} /> Chưa phân loại Rx/OTC ({unclassifiedMeds.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {unclassifiedMeds.map((med, idx) => (
                  <div key={idx} style={{ padding: 16, borderRadius: 16, background: '#F8FAFC', border: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <h5 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)' }}>{med.name}</h5>
                      <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 700 }}>
                        Hoạt chất: {med.generic || 'chưa ghi nhận'}{med.strength ? ` · ${med.strength}` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-dark)' }}>{med.dosage}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-sub)', fontWeight: 600 }}>{med.timing || med.time_slot}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Pharmacist Note */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, maxWidth: 460, lineHeight: 1.55 }}>
            Danh sách do gia đình nhập và xác nhận từ đơn thuốc. Có thể thiếu thuốc mua lẻ hoặc
            thuốc nam chưa được ghi vào app — mong dược sĩ hỏi lại người nhà.
          </span>
          <button className="btn-primary" onClick={onClose} style={{ padding: '10px 24px', borderRadius: 16 }}>
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
}
