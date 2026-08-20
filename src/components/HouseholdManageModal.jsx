import React, { useState } from 'react';
import { X, Users, Smartphone, UserPlus, Pencil, RefreshCw, LogOut, Check, AlertTriangle } from 'lucide-react';

/**
 * Quản lý nhà: ai có hồ sơ, máy nào đang dùng chung, và tôi là ai.
 *
 * ═══════════════════════════════════════════════════════════════════
 *  Trước màn này, app không có chỗ nào nhìn ra "nhà mình gồm những ai".
 *  Tạo mã mời xong, người nhà nhập mã xong — bên tạo mã không thấy gì thay
 *  đổi cả. Không biết mã đã được dùng chưa, ai dùng, họ là ai trong nhà.
 *  Tính năng mời người nhà mà không có bảng này thì chỉ hoàn thành một nửa.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Hai danh sách CỐ Ý tách riêng, vì chúng là hai thứ khác nhau:
 *
 *   Hồ sơ  (subjects) — người có dữ liệu sức khoẻ. Con cái khai hộ được, nên
 *                       một hồ sơ có thể chưa gắn với máy nào.
 *   Máy    (members)  — tài khoản đã nhập mã mời. Vừa vào thì chưa nhận hồ sơ
 *                       nào, hiện là "chưa chọn là ai".
 */
export default function HouseholdManageModal({
  isOpen,
  onClose,
  subjects = [],
  accounts = [],
  identityId = null,
  onAddSubject,
  onEditSubject,
  onReclaimIdentity,
  onSignOut,
  language = 'vi'
}) {
  const isVi = language === 'vi';
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  if (!isOpen) return null;

  const nameOf = sid => subjects.find(s => s.id === sid)?.display_name || null;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)' }}>{isVi ? 'Nhà mình' : 'Household Management'}</h3>
          <button onClick={onClose} className="btn-secondary" style={{ padding: 8, borderRadius: 12 }}>
            <X size={18} />
          </button>
        </div>

        {/* ── Hồ sơ sức khoẻ ── */}
        <SectionTitle icon={Users} text={isVi ? `Hồ sơ trong nhà (${subjects.length})` : `Family Profiles (${subjects.length})`} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {subjects.map(s => (
            <div key={s.id} style={row}>
              <div style={{ ...avatar, background: s.avatar_color || 'var(--coral-grad)' }}>
                {(s.display_name || '?').trim().charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {s.display_name}
                  {s.id === identityId && (
                    <span style={badge}><Check size={11} /> {isVi ? 'là tôi' : 'me'}</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {[s.relation, s.birth_year ? (isVi ? `sinh ${s.birth_year}` : `b. ${s.birth_year}`) : null].filter(Boolean).join(' · ') || (isVi ? 'Chưa ghi quan hệ' : 'No relation specified')}
                </div>
              </div>
              {onEditSubject && (
                <button onClick={() => onEditSubject(s)} className="btn-secondary" style={{ padding: '7px 11px', borderRadius: 12, fontSize: 12 }}>
                  <Pencil size={13} /> {isVi ? 'Sửa' : 'Edit'}
                </button>
              )}
            </div>
          ))}

          {subjects.length === 0 && <Empty text={isVi ? "Chưa có hồ sơ nào trong nhà." : "No profiles in this household."} />}
        </div>

        {onAddSubject && (
          <button className="btn-primary" onClick={onAddSubject} style={{ width: '100%', padding: 13, borderRadius: 12, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
            <UserPlus size={17} /> {isVi ? 'Thêm hồ sơ' : 'Add Profile'}
          </button>
        )}

        {/* ── Máy đang dùng chung ── */}
        <SectionTitle icon={Smartphone} text={isVi ? `Máy đang dùng chung (${accounts.length})` : `Connected Devices (${accounts.length})`} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 6 }}>
          {accounts.map(a => {
            const claimed = nameOf(a.subject_id);
            return (
              <div key={a.uid} style={row}>
                <div style={{ ...avatar, background: 'rgba(148,163,184,0.35)', color: 'var(--text-sub)' }}>
                  <Smartphone size={18} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-dark)' }}>
                    {claimed || a.display_name || (isVi ? 'Máy chưa đặt tên' : 'Unnamed Device')}
                    {a.role === 'host' && <span style={{ ...badge, marginLeft: 6 }}>{isVi ? 'người tạo nhà' : 'host'}</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: claimed ? 'var(--text-muted)' : '#B45309' }}>
                    {claimed
                      ? (isVi ? 'Đang dùng hồ sơ này' : 'Using this profile')
                      : (isVi ? 'Chưa chọn là ai trong nhà' : 'No profile selected')}
                  </div>
                </div>
              </div>
            );
          })}

          {accounts.length === 0 && <Empty text={isVi ? "Chưa có máy nào khác tham gia." : "No other devices connected."} />}
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.55, marginBottom: 20 }}>
          {isVi
            ? 'Một hồ sơ có thể chưa gắn với máy nào — người nhà khai hộ thì vẫn vậy. Máy mới vào bằng mã mời sẽ hiện ở đây trước khi họ chọn mình là ai.'
            : 'Profiles can exist without a device. Newly joined devices appear here before selecting a profile.'}
        </div>

        {/* ── Tôi ── */}
        <SectionTitle icon={RefreshCw} text={isVi ? "Tài khoản này" : "Current Account"} />

        <button className="btn-secondary" onClick={onReclaimIdentity} style={{ width: '100%', padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 9 }}>
          <RefreshCw size={16} /> {isVi ? 'Tôi không phải người này — chọn lại' : 'Not me — reselect profile'}
        </button>

        {!confirmSignOut ? (
          <button
            onClick={() => setConfirmSignOut(true)}
            style={{ width: '100%', padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 700, background: 'transparent', border: '1px solid #FCA5A5', color: '#B91C1C', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <LogOut size={16} /> {isVi ? 'Đăng xuất khỏi nhà này' : 'Leave this household'}
          </button>
        ) : (
          <div style={{ padding: 14, borderRadius: 12, background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
              <AlertTriangle size={17} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, color: '#7F1D1D', fontWeight: 600, lineHeight: 1.55 }}>
                {isVi
                  ? 'Máy này sẽ thoát khỏi nhà. Hồ sơ, đơn thuốc và lịch sử vẫn còn nguyên trên máy chủ — người nhà vẫn thấy đủ. Muốn vào lại thì xin mã mời mới.'
                  : 'This device will disconnect from the household. All data remains safe on the server. You will need a new invite code to reconnect.'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmSignOut(false)} className="btn-secondary" style={{ flex: 1, padding: 11, borderRadius: 12, fontSize: 14 }}>
                {isVi ? 'Thôi' : 'Cancel'}
              </button>
              <button
                onClick={onSignOut}
                style={{ flex: 1, padding: 11, borderRadius: 12, fontSize: 14, fontWeight: 800, background: '#DC2626', color: '#FFF', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {isVi ? 'Đăng xuất' : 'Sign Out'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
      <Icon size={14} color="var(--text-muted)" />
      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {text}
      </span>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ padding: 13, borderRadius: 12, background: 'rgba(241,245,249,0.8)', fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>
      {text}
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, zIndex: 300,
  background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(10px)',
  display: 'grid', placeItems: 'center', padding: 16
};

const sheet = {
  width: '100%', maxWidth: 480, maxHeight: '90dvh', overflowY: 'auto',
  background: '#FFF', borderRadius: 20, padding: '22px 20px',
  boxShadow: '0 24px 60px rgba(15,23,42,0.18)'
};

const row = {
  display: 'flex', alignItems: 'center', gap: 11,
  padding: '11px 13px', borderRadius: 12,
  background: 'rgba(255,255,255,0.9)', border: '1px solid var(--glass-border)'
};

const avatar = {
  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
  display: 'grid', placeItems: 'center', color: '#FFF', fontWeight: 800, fontSize: 16
};

const badge = {
  display: 'inline-flex', alignItems: 'center', gap: 3,
  fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
  background: 'var(--coral-soft)', color: 'var(--coral-main)'
};
