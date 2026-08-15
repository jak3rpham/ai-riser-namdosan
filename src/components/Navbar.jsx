import React from 'react';
import { Heart, Sparkles, Shield, RefreshCw, Globe, Award, Bell } from 'lucide-react';
import { I18N_STRINGS } from '../services/mockData';
import SyncStatusBadge from './SyncStatusBadge';
import { showDevTools } from '../services/featureFlags';

export default function Navbar({ activeRole, onToggleRole, onResetDemo, language = 'vi', onToggleLanguage, onOpenBenchmark, onOpenNotifs, onOpenProfile }) {
  const t = I18N_STRINGS[language] || I18N_STRINGS.vi;

  return (
    <header style={{ position: 'sticky', top: '12px', zIndex: 100, marginBottom: '28px' }}>
      <div className="liquid-card app-header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 14, background: 'var(--coral-grad)', display: 'grid', placeItems: 'center', color: '#FFF', fontWeight: 800, fontSize: 20, boxShadow: '0 6px 16px var(--coral-glow)' }}>
            <Heart size={22} fill="#FFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-dark)', whiteSpace: 'nowrap' }}>
                {t.app_title}
              </h1>
              <SyncStatusBadge />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>AI Riser Vietnam 2026</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {showDevTools && (
            <>
            {/* User Profile & Capability Trigger */}
            <button onClick={onOpenProfile} className="btn-secondary" style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12.5, color: 'var(--text-dark)' }}>
              👤 Hồ sơ C1–C4
            </button>

            {/* Golden Set Benchmark Trigger */}
            <button onClick={onOpenBenchmark} className="btn-secondary" style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12.5, color: 'var(--coral-main)', border: '1px solid var(--coral-border)', background: 'var(--coral-soft)' }}>
              <Award size={15} /> Golden Set AI Metric
            </button>

            {/* Notification Simulator Trigger */}
            <button onClick={onOpenNotifs} className="btn-secondary" style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12.5, color: 'var(--text-dark)' }}>
              <Bell size={15} /> Giả lập Thông báo
            </button>
            </>
          )}

          {/* Language Switcher */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.8)', padding: 3, borderRadius: 99, border: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => onToggleLanguage && onToggleLanguage('vi')}
              style={{
                border: 'none', padding: '4px 12px', borderRadius: 99, fontSize: 12.5, fontWeight: 800,
                background: language === 'vi' ? 'var(--coral-main)' : 'transparent',
                color: language === 'vi' ? '#FFF' : 'var(--text-sub)', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              🇻🇳 VI
            </button>
            <button
              onClick={() => onToggleLanguage && onToggleLanguage('en')}
              style={{
                border: 'none', padding: '4px 12px', borderRadius: 99, fontSize: 12.5, fontWeight: 800,
                background: language === 'en' ? 'var(--coral-main)' : 'transparent',
                color: language === 'en' ? '#FFF' : 'var(--text-sub)', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              🇺🇸 EN
            </button>
          </div>

          {showDevTools && (
            <button onClick={onResetDemo} title="Khôi phục dữ liệu mẫu" className="btn-secondary" style={{ padding: '8px 14px', borderRadius: '99px', fontSize: 13 }}>
              <RefreshCw size={14} /> {t.reset_demo}
            </button>
          )}
        </div>

      </div>
    </header>
  );
}


