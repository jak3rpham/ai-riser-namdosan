import React from 'react';
import { Heart, Sparkles, Shield, RefreshCw } from 'lucide-react';

export default function Navbar({ activeRole, onToggleRole, onResetDemo }) {
  return (
    <header style={{ position: 'sticky', top: '12px', zIndex: 100, marginBottom: '28px' }}>
      <div className="liquid-card" style={{ padding: '12px 24px', borderRadius: '99px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 14, background: 'var(--coral-grad)', display: 'grid', placeItems: 'center', color: '#FFF', fontWeight: 800, fontSize: 20, boxShadow: '0 6px 16px var(--coral-glow)' }}>
            <Heart size={22} fill="#FFF" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-dark)' }}>
              Sức Khỏe Nhà
            </h1>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>AI Riser Vietnam 2026</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,107,75,0.08)', border: '1px solid rgba(255,107,75,0.2)', padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, color: 'var(--coral-main)' }}>
            <Sparkles size={16} />
            Apple Liquid Glass Edition
          </div>

          <button onClick={onResetDemo} title="Khôi phục dữ liệu mẫu" className="btn-secondary" style={{ padding: '8px 14px', borderRadius: '99px', fontSize: 13 }}>
            <RefreshCw size={14} /> Khôi phục
          </button>
        </div>

      </div>
    </header>
  );
}
