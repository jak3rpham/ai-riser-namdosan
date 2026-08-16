import React, { useState } from 'react';
import { UserPlus, Check, Loader2, LogOut, Users } from 'lucide-react';

/**
 * "Trong nhà mình, bác là ai?"
 *
 * ═══════════════════════════════════════════════════════════════════
 *  Màn hình này lấp một lỗ hổng của cả mô hình dữ liệu, không phải trang trí.
 *
 *  Trước đây `members/{uid}` (tài khoản) và `subjects/{sid}` (người có hồ sơ
 *  sức khoẻ) không nối với nhau bằng gì. App Ba Mẹ đoán bằng `subjects[0]`.
 *
 *  Gặp thật khi thử: nhà tạo trên máy tính có sẵn hồ sơ "Thanh". Điện thoại
 *  nhập mã mời xong là lập tức TRỞ THÀNH Thanh — không hỏi, không chọn. Người
 *  thứ hai trong nhà không tồn tại được, và mọi liều thuốc họ xác nhận đã uống
 *  đều ghi vào hồ sơ Thanh. Đó là dữ liệu y tế sai, không phải phiền phức UI.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Chọn sai vẫn đổi được sau, ở tab "Tôi" → "Tôi không phải người này".
 */
export default function IdentityPickerView({
  subjects = [],
  onPick,
  onCreateNew,
  onLeave,
  currentId = null
}) {
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState(null);

  const pick = async (subject) => {
    setSaving(subject.id);
    setError(null);
    const res = await onPick(subject.id);
    setSaving(null);
    if (!res?.ok) setError(res?.error_message || 'Chưa lưu được lựa chọn. Bác thử lại giúp con nha.');
  };

  return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '20px 4px' }}>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{ width: 60, height: 60, borderRadius: 20, background: 'var(--coral-grad)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
          <Users size={28} color="#FFF" />
        </div>
        <h2 style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 23, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 8 }}>
          Trong nhà mình, bác là ai ạ?
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text-sub)', lineHeight: 1.6 }}>
          Con cần biết để nhắc đúng thuốc của bác, và ghi đúng vào hồ sơ của bác.
          Chọn nhầm thì đổi lại được.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {subjects.map(s => {
          const isMine = s.id === currentId;
          return (
            <button
              key={s.id}
              onClick={() => pick(s)}
              disabled={saving !== null}
              style={{
                display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left',
                padding: '15px 16px', borderRadius: 16, cursor: 'pointer',
                background: isMine ? 'var(--coral-soft)' : '#FFF',
                border: isMine ? '2px solid var(--coral-main)' : '1px solid var(--glass-border)',
                fontFamily: 'inherit', width: '100%'
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: s.avatar_color || 'var(--coral-grad)',
                display: 'grid', placeItems: 'center', color: '#FFF',
                fontWeight: 800, fontSize: 18
              }}>
                {(s.display_name || '?').trim().charAt(0).toUpperCase()}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)' }}>
                  {s.display_name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {[s.relation, s.birth_year ? `sinh ${s.birth_year}` : null].filter(Boolean).join(' · ') || 'Chưa ghi quan hệ'}
                </div>
              </div>

              {saving === s.id
                ? <Loader2 className="animate-spin" size={19} color="var(--coral-main)" />
                : isMine && <Check size={19} color="var(--coral-main)" />}
            </button>
          );
        })}

        {subjects.length === 0 && (
          <div style={{ padding: 16, borderRadius: 16, background: 'rgba(241,245,249,0.8)', fontSize: 14, color: 'var(--text-sub)', fontWeight: 600, textAlign: 'center', lineHeight: 1.6 }}>
            Nhà này chưa có hồ sơ nào. Bác khai hồ sơ của bác trước nha.
          </div>
        )}
      </div>

      {error && (
        <div style={{ fontSize: 14, color: '#B91C1C', fontWeight: 700, marginBottom: 12 }}>{error}</div>
      )}

      <button
        className="btn-primary"
        onClick={onCreateNew}
        style={{ width: '100%', padding: 15, borderRadius: 16, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}
      >
        <UserPlus size={18} /> Chưa có tôi — khai hồ sơ mới
      </button>

      <button
        className="btn-secondary"
        onClick={onLeave}
        style={{ width: '100%', marginTop: 12, padding: '11px 18px', borderRadius: 12, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
      >
        <LogOut size={15} /> Vào nhà khác
      </button>
    </div>
  );
}
