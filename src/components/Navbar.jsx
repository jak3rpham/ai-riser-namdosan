import React, { useState } from 'react';
import { Heart, Sparkles, Shield, RefreshCw, Globe, Award, Bell, Settings, Home, Smartphone, LogOut, X } from 'lucide-react';
import { I18N_STRINGS } from '../services/i18n';
import SyncStatusBadge from './SyncStatusBadge';
import { showDevTools } from '../services/featureFlags';

export default function Navbar({ activeRole, onToggleRole, onResetDemo, language = 'vi', onToggleLanguage, onOpenBenchmark, onOpenNotifs, onOpenProfile, onGoHome, onGoParent, onLeaveHousehold }) {
  const t = I18N_STRINGS[language] || I18N_STRINGS.vi;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header style={{ position: 'sticky', top: '12px', zIndex: 100, marginBottom: '28px' }}>
      <div className="liquid-card app-header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 16, background: 'var(--coral-grad)', display: 'grid', placeItems: 'center', color: '#FFF', fontWeight: 800, fontSize: 20, boxShadow: '0 6px 16px var(--coral-glow)' }}>
            <Heart size={22} fill="#FFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-dark)', whiteSpace: 'nowrap' }}>
                {t.app_title}
              </h1>
              <SyncStatusBadge language={language} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>AI Riser Vietnam 2026</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {showDevTools && (
            <>
            {/* User Profile & Capability Trigger */}
            <button onClick={onOpenProfile} className="btn-secondary" style={{ padding: '6px 14px', borderRadius: 99, fontSize: 13, color: 'var(--text-dark)' }}>
              👤 {language === 'vi' ? 'Hồ sơ C1–C4' : 'Profile C1–C4'}
            </button>

            {/* Golden Set Benchmark Trigger */}
            <button onClick={onOpenBenchmark} className="btn-secondary" style={{ padding: '6px 14px', borderRadius: 99, fontSize: 13, color: 'var(--coral-main)', border: '1px solid var(--coral-border)', background: 'var(--coral-soft)' }}>
              <Award size={15} /> {language === 'vi' ? 'Đánh giá chuẩn AI' : 'Golden Set Benchmark'}
            </button>

            {/* Notification Simulator Trigger */}
            <button onClick={onOpenNotifs} className="btn-secondary" style={{ padding: '6px 14px', borderRadius: 99, fontSize: 13, color: 'var(--text-dark)' }}>
              <Bell size={15} /> {language === 'vi' ? 'Thử thông báo' : 'Test Notification'}
            </button>
            </>
          )}

          {/* Language Switcher */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.8)', padding: 3, borderRadius: 99, border: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => onToggleLanguage && onToggleLanguage('vi')}
              style={{
                border: 'none', padding: '4px 12px', borderRadius: 99, fontSize: 13, fontWeight: 800,
                background: language === 'vi' ? 'var(--coral-main)' : 'transparent',
                color: language === 'vi' ? '#FFF' : 'var(--text-sub)', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              🇻🇳 VI
            </button>
            <button
              onClick={() => onToggleLanguage && onToggleLanguage('en')}
              style={{
                border: 'none', padding: '4px 12px', borderRadius: 99, fontSize: 13, fontWeight: 800,
                background: language === 'en' ? 'var(--coral-main)' : 'transparent',
                color: language === 'en' ? '#FFF' : 'var(--text-sub)', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              🇺🇸 EN
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(true)}
            className="btn-secondary"
            aria-label={language === 'vi' ? 'Cài đặt' : 'Settings'}
            style={{ padding: '8px 14px', borderRadius: 12, fontSize: 13 }}
          >
            <Settings size={15} /> {language === 'vi' ? 'Cài đặt' : 'Settings'}
          </button>

          {showDevTools && (
            <button onClick={onResetDemo} title={language === 'vi' ? 'Khôi phục dữ liệu mẫu' : 'Reset Demo Data'} className="btn-secondary" style={{ padding: '8px 14px', borderRadius: '99px', fontSize: 13 }}>
              <RefreshCw size={14} /> {t.reset_demo}
            </button>
          )}
        </div>

      </div>

      {menuOpen && (
        <SettingsSheet
          language={language}
          onClose={() => setMenuOpen(false)}
          onGoHome={onGoHome}
          onGoParent={onGoParent}
          onLeaveHousehold={onLeaveHousehold}
        />
      )}
    </header>
  );
}

/**
 * Bảng cài đặt.
 */
function SettingsSheet({ language = 'vi', onClose, onGoHome, onGoParent, onLeaveHousehold }) {
  const isVi = language === 'vi';
  const items = [
    {
      icon: Home,
      label: isVi ? 'Về trang chính' : 'Back to Home',
      hint: isVi ? 'Chọn lại vai con cái hay ba mẹ' : 'Choose caregiver or parent role',
      onClick: onGoHome
    },
    {
      icon: Smartphone,
      label: isVi ? 'Xem giao diện Ba Mẹ' : 'Switch to Parent View',
      hint: isVi ? 'Màn hình nút to dành cho người lớn tuổi' : 'Senior-friendly view with big buttons',
      onClick: onGoParent
    },
    {
      icon: LogOut,
      label: isVi ? 'Đổi nhà khác' : 'Switch Household',
      hint: isVi ? 'Rời nhà này trên máy này. Dữ liệu trên máy chủ giữ nguyên.' : 'Leave household on this device. Cloud data remains intact.',
      onClick: onLeaveHousehold,
      danger: true
    }
  ].filter(i => i.onClick);

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,23,42,0.35)', display: 'grid', placeItems: 'center', padding: 16 }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: '#FFF', borderRadius: 20, padding: '20px 18px', boxShadow: '0 24px 60px rgba(15,23,42,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)' }}>
            {isVi ? 'Cài đặt' : 'Settings'}
          </h3>
          <button onClick={onClose} className="btn-secondary" style={{ padding: 8, borderRadius: 12 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {items.map(({ icon: Icon, label, hint, onClick, danger }) => (
            <button
              key={label}
              onClick={() => { onClose(); onClick(); }}
              style={{
                display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'left',
                padding: '14px 16px', borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
                border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.85)'
              }}
            >
              <Icon size={19} color={danger ? '#B91C1C' : 'var(--text-sub)'} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: danger ? '#B91C1C' : 'var(--text-dark)' }}>{label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 2, lineHeight: 1.45 }}>{hint}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


