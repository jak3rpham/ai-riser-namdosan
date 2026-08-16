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
  onSignOut
}) {
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  if (!isOpen) return null;

  const nameOf = sid => subjects.find(s => s.id === sid)?.display_name || null;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)' }}>Nhà mình</h3>
          <button onClick={onClose} className="btn-secondary" style={{ padding: 8, borderRadius: 10 }}>
            <X size={18} />
          </button>
        </div>

        {/* ── Hồ sơ sức khoẻ ── */}
        <SectionTitle icon={Users} text={`Hồ sơ trong nhà (${subjects.length})`} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {subjects.map(s => (
            <div key={s.id} style={row}>
              <div style={{ ...avatar, background: s.avatar_color || 'var(--coral-grad)' }}>
                {(s.display_name || '?').trim().charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {s.display_name}
                  {s.id === identityId && (
                    <span style={badge}><Check size={11} /> là tôi</span>
                  )}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {[s.relation, s.birth_year ? `sinh ${s.birth_year}` : null].filter(Boolean).join(' · ') || 'Chưa ghi quan hệ'}
                </div>
              </div>
              {onEditSubject && (
                <button onClick={() => onEditSubject(s)} className="btn-secondary" style={{ padding: '7px 11px', borderRadius: 10, fontSize: 12 }}>
                  <Pencil size={13} /> Sửa
                </button>
              )}
            </div>
          ))}

          {subjects.length === 0 && <Empty text="Chưa có hồ sơ nào trong nhà." />}
        </div>

        {onAddSubject && (
          <button className="btn-primary" onClick={onAddSubject} style={{ width: '100%', padding: 13, borderRadius: 13, fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
            <UserPlus size={17} /> Thêm hồ sơ
          </button>
        )}

        {/* ── Máy đang dùng chung ── */}
        <SectionTitle icon={Smartphone} text={`Máy đang dùng chung (${accounts.length})`} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 6 }}>
          {accounts.map(a => {
            const claimed = nameOf(a.subject_id);
            return (
              <div key={a.uid} style={row}>
                <div style={{ ...avatar, background: 'rgba(148,163,184,0.35)', color: 'var(--text-sub)' }}>
                  <Smartphone size={18} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-dark)' }}>
                    {claimed || a.display_name || 'Máy chưa đặt tên'}
                    {a.role === 'host' && <span style={{ ...badge, marginLeft: 6 }}>người tạo nhà</span>}
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: claimed ? 'var(--text-muted)' : '#B45309' }}>
                    {claimed
                      ? 'Đang dùng hồ sơ này'
                      : 'Chưa chọn là ai trong nhà'}
                  </div>
                </div>
              </div>
            );
          })}

          {accounts.length === 0 && <Empty text="Chưa có máy nào khác tham gia." />}
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.55, marginBottom: 20 }}>
          Một hồ sơ có thể chưa gắn với máy nào — người nhà khai hộ thì vẫn vậy.
          Máy mới vào bằng mã mời sẽ hiện ở đây trước khi họ chọn mình là ai.
        </div>

        {/* ── Tôi ── */}
        <SectionTitle icon={RefreshCw} text="Tài khoản này" />

        <button className="btn-secondary" onClick={onReclaimIdentity} style={{ width: '100%', padding: 13, borderRadius: 13, fontSize: 14.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 9 }}>
          <RefreshCw size={16} /> Tôi không phải người này — chọn lại
        </button>

        {!confirmSignOut ? (
          <button
            onClick={() => setConfirmSignOut(true)}
            style={{ width: '100%', padding: 13, borderRadius: 13, fontSize: 14.5, fontWeight: 700, background: 'transparent', border: '1px solid #FCA5A5', color: '#B91C1C', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <LogOut size={16} /> Đăng xuất khỏi nhà này
          </button>
        ) : (
          <div style={{ padding: 14, borderRadius: 13, background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
              <AlertTriangle size={17} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, color: '#7F1D1D', fontWeight: 600, lineHeight: 1.55 }}>
                Máy này sẽ thoát khỏi nhà. Hồ sơ, đơn thuốc và lịch sử vẫn còn
                nguyên trên máy chủ — người nhà vẫn thấy đủ. Muốn vào lại thì
                xin mã mời mới.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmSignOut(false)} className="btn-secondary" style={{ flex: 1, padding: 11, borderRadius: 11, fontSize: 13.5 }}>
                Thôi
              </button>
              <button
                onClick={onSignOut}
                style={{ flex: 1, padding: 11, borderRadius: 11, fontSize: 13.5, fontWeight: 800, background: '#DC2626', color: '#FFF', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Đăng xuất
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
      <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {text}
      </span>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ padding: 13, borderRadius: 12, background: 'rgba(241,245,249,0.8)', fontSize: 13.5, color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>
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
  background: '#FFF', borderRadius: 22, padding: '22px 20px',
  boxShadow: '0 24px 60px rgba(15,23,42,0.18)'
};

const row = {
  display: 'flex', alignItems: 'center', gap: 11,
  padding: '11px 13px', borderRadius: 13,
  background: 'rgba(255,255,255,0.9)', border: '1px solid var(--glass-border)'
};

const avatar = {
  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
  display: 'grid', placeItems: 'center', color: '#FFF', fontWeight: 800, fontSize: 15
};

const badge = {
  display: 'inline-flex', alignItems: 'center', gap: 3,
  fontSize: 10.5, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
  background: 'var(--coral-soft)', color: 'var(--coral-main)'
};
