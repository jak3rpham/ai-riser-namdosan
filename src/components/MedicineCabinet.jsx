import React from 'react';
import { Package, Clock, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';
import { I18N_STRINGS } from '../services/i18n';

export default function MedicineCabinet({ medications = [], language = 'vi' }) {
  const t = I18N_STRINGS[language] || I18N_STRINGS.vi;
  const isVi = language === 'vi';

  return (
    <div className="liquid-card" style={{ padding: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)' }}>
            📦 {t.medicine_cabinet}
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-sub)' }}>
            {isVi
              ? 'Theo dõi tiến trình đợt dùng thuốc & dự đoán thời điểm kết thúc đợt để gia hạn kịp thời.'
              : 'Track medication lifecycle & forecast completion to refill in time.'}
          </p>
        </div>
        <span style={{ padding: '6px 14px', borderRadius: 99, background: 'var(--coral-soft)', color: 'var(--coral-main)', fontWeight: 800, fontSize: 13 }}>
          {isVi ? `${medications.length} loại thuốc` : `${medications.length} medications`}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
        {medications.map((med, idx) => {
          const isLow = med.est_remaining <= 5;
          const totalDays = med.duration_days || 30;
          const elapsedDays = med.days_elapsed || (totalDays - med.est_remaining);
          const percent = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

          return (
            <div key={idx} style={{ padding: 18, borderRadius: 20, background: '#FFF', border: isLow ? '1.5px solid rgba(217,119,6,0.3)' : '1px solid var(--glass-border)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 800 }}>{med.name}</h4>
                  <span style={{ fontSize: 13, color: 'var(--coral-main)', fontWeight: 700 }}>{med.nick_name || med.generic}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: isLow ? 'var(--amber-soft)' : 'var(--emerald-soft)', color: isLow ? 'var(--amber-warm)' : 'var(--emerald-ok)' }}>
                  {isLow ? (isVi ? '⚠️ Sắp hết đợt' : '⚠️ Low supply') : (isVi ? 'Đang dùng' : 'Active')}
                </span>
              </div>

              {/* M18 Lifecycle Progress Bar */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 4 }}>
                  <span>{isVi ? `Tiến trình đợt: ${elapsedDays}/${totalDays} ngày` : `Progress: ${elapsedDays}/${totalDays} days`}</span>
                  <span>{percent}%</span>
                </div>
                <div style={{ width: '100%', height: 6, borderRadius: 99, background: '#E2E8F0', overflow: 'hidden' }}>
                  <div style={{ width: `${percent}%`, height: '100%', borderRadius: 99, background: isLow ? 'var(--amber-warm)' : 'var(--coral-main)', transition: 'width 0.4s' }}></div>
                </div>
              </div>

              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-sub)' }}>
                <span>{isVi ? 'Còn lại:' : 'Remaining:'} <strong style={{ color: isLow ? 'var(--amber-warm)' : 'var(--text-dark)' }}>{med.est_remaining} {isVi ? 'ngày' : 'days'}</strong></span>
                <span>{isVi ? 'Cữ:' : 'Slot:'} <strong>{med.time_slot}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

