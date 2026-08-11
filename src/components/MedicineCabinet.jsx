import React from 'react';
import { Package, Clock, AlertCircle, Calendar } from 'lucide-react';

export default function MedicineCabinet({ medications = [] }) {
  return (
    <div className="liquid-card" style={{ padding: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-dark)' }}>📦 Tủ Thuốc Nhà (Tự Động Đếm Viên & Hạn Dùng)</h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-sub)' }}>Theo dõi thời gian dùng & dự đoán ngày hết thuốc để mua bổ sung kịp thời.</p>
        </div>
        <span style={{ padding: '6px 14px', borderRadius: 99, background: 'var(--coral-soft)', color: 'var(--coral-main)', fontWeight: 800, fontSize: 13 }}>
          {medications.length} loại thuốc
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {medications.map((med, idx) => {
          const isLow = med.est_remaining <= 5;
          return (
            <div key={idx} style={{ padding: 18, borderRadius: 18, background: '#FFF', border: isLow ? '1.5px solid rgba(217,119,6,0.3)' : '1px solid var(--glass-border)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 800 }}>{med.name}</h4>
                  <span style={{ fontSize: 12.5, color: 'var(--coral-main)', fontWeight: 700 }}>{med.nick_name || med.generic}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: isLow ? 'var(--amber-soft)' : 'var(--emerald-soft)', color: isLow ? 'var(--amber-warm)' : 'var(--emerald-ok)' }}>
                  {isLow ? '⚠️ Cần mua thêm' : 'Còn đủ dùng'}
                </span>
              </div>

              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-sub)' }}>
                <span>Ước tính còn: <strong style={{ color: isLow ? 'var(--amber-warm)' : 'var(--text-dark)' }}>{med.est_remaining} ngày</strong></span>
                <span>Cữ: <strong>{med.time_slot}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
