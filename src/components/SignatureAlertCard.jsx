import React from 'react';
import { AlertTriangle, ShieldAlert, Utensils, CheckCircle2 } from 'lucide-react';

export default function SignatureAlertCard({ warnings = [] }) {
  if (!warnings || warnings.length === 0) {
    return (
      <div className="liquid-card" style={{ padding: 22, display: 'flex', alignItems: 'center', gap: 16, background: 'linear-gradient(135deg, rgba(236,253,245,0.7) 0%, rgba(255,255,255,0.85) 100%)', border: '1px solid rgba(5,150,105,0.25)' }}>
        <div style={{ width: 42, height: 42, borderRadius: 14, background: 'var(--emerald-grad)', display: 'grid', placeItems: 'center', color: '#FFF', flexShrink: 0 }}>
          <CheckCircle2 size={22} />
        </div>
        <div>
          <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--emerald-ok)' }}>An toàn 100% — Không phát hiện trùng hoạt chất & kiêng ăn</h4>
          <p style={{ fontSize: 13.5, color: 'var(--text-sub)', marginTop: 2 }}>
            Tất cả đơn thuốc đang uống đều được kiểm tra đối chiếu qua Gemini AI & Kho kiến thức Dược VN.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {warnings.map((warn, idx) => (
        <div key={idx} className="liquid-card" style={{ padding: 24, background: warn.type === 'DUPLICATE_ACTIVE_INGREDIENT' ? 'linear-gradient(135deg, rgba(254,242,242,0.8) 0%, rgba(255,255,255,0.9) 100%)' : 'linear-gradient(135deg, rgba(254,243,199,0.8) 0%, rgba(255,255,255,0.9) 100%)', border: warn.type === 'DUPLICATE_ACTIVE_INGREDIENT' ? '1.5px solid rgba(220,38,38,0.3)' : '1.5px solid rgba(217,119,6,0.3)' }}>
          
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
            <div style={{ width: 44, height: 44, borderRadius: 16, background: warn.type === 'DUPLICATE_ACTIVE_INGREDIENT' ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : 'var(--amber-grad)', display: 'grid', placeItems: 'center', color: '#FFF', flexShrink: 0, boxShadow: '0 6px 16px rgba(0,0,0,0.1)' }}>
              {warn.type === 'DUPLICATE_ACTIVE_INGREDIENT' ? <ShieldAlert size={24} /> : <Utensils size={24} />}
            </div>

            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: 17, fontWeight: 800, color: warn.type === 'DUPLICATE_ACTIVE_INGREDIENT' ? '#B91C1C' : '#B45309' }}>
                {warn.title}
              </h4>
              <p style={{ fontSize: 14, color: 'var(--text-sub)', marginTop: 4, lineHeight: 1.55, fontWeight: 500 }}>
                {warn.description}
              </p>

              {warn.action_recommended && (
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: '#B91C1C', background: 'rgba(239,68,68,0.1)', padding: '6px 12px', borderRadius: 8, display: 'inline-block' }}>
                  Khuyên dùng: {warn.action_recommended}
                </div>
              )}

              {warn.alternative && (
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: '#B45309', background: 'rgba(217,119,6,0.1)', padding: '6px 12px', borderRadius: 8, display: 'inline-block' }}>
                  Gợi ý thay thế: {warn.alternative}
                </div>
              )}

              <div style={{ display: 'inline-block', marginTop: 10, padding: '3px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.08)', fontSize: 11.5, fontWeight: 800, color: 'var(--text-muted)' }}>
                Verified by AI & National Pharmacopeia Base
              </div>
            </div>
          </div>

        </div>
      ))}
    </div>
  );
}
