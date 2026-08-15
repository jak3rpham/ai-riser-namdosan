import React, { useState } from 'react';
import { Home, LogIn, Eye, Loader2, ArrowLeft, Users } from 'lucide-react';

/**
 * Màn hình đầu tiên khi máy chưa thuộc nhà nào.
 *
 * Thay cho hành vi cũ: tự tạo một nhà rồi nạp sẵn hồ sơ "Ba Mười", "Mẹ Lan" —
 * người dùng thật mở app ra thấy hai người lạ và không hiểu chuyện gì.
 *
 * Ba lối vào, tách theo đúng ba tình huống có thật:
 *   - Con cái cài lần đầu           → tạo nhà
 *   - Ba mẹ được con đưa mã          → nhập mã
 *   - Người tò mò / giám khảo chấm   → xem thử nhà mẫu
 *
 * Chữ to, mỗi lựa chọn một khối, không có bước nào bắt nhập trước khi hiểu
 * mình đang chọn gì.
 */
export default function OnboardingView({ onCreate, onJoin, onTryDemo, busy, error }) {
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [householdName, setHouseholdName] = useState('');
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState(null);

  const submitCreate = async () => {
    setLocalError(null);
    const res = await onCreate({ name: householdName.trim() || 'Nhà mình' });
    if (!res.ok) setLocalError(res.error_message);
  };

  const submitJoin = async () => {
    setLocalError(null);
    const res = await onJoin(code.trim());
    if (!res.ok) setLocalError(res.error_message);
  };

  const shownError = localError || error;

  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: '24px 18px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 8 }}>
            {mode ? 'Sắp xong rồi' : 'Bắt đầu với Nhà Mình'}
          </h1>
          <p style={{ fontSize: 15.5, color: 'var(--text-sub)', lineHeight: 1.5 }}>
            {mode === 'create' && 'Đặt tên cho nhà mình, xong là dùng được ngay.'}
            {mode === 'join' && 'Nhập mã người nhà đã đưa cho bạn.'}
            {!mode && 'Bạn chọn một trong ba cách dưới đây nhé.'}
          </p>
        </div>

        {!mode && (
          <div style={{ display: 'grid', gap: 14 }}>
            <ChoiceCard
              icon={Home}
              title="Tạo nhà mới"
              detail="Dành cho người cài app đầu tiên. Sau đó mời ba mẹ vào bằng một mã ngắn."
              onClick={() => setMode('create')}
              primary
            />
            <ChoiceCard
              icon={LogIn}
              title="Tôi có mã mời"
              detail="Người nhà đã tạo nhà rồi và đưa bạn một mã 8 ký tự."
              onClick={() => setMode('join')}
            />
            <ChoiceCard
              icon={Eye}
              title="Xem thử trước"
              detail="Dựng một nhà mẫu với hồ sơ hư cấu, để xem app hoạt động thế nào. Không ảnh hưởng gì tới dữ liệu thật."
              onClick={onTryDemo}
              disabled={busy}
            />
          </div>
        )}

        {mode === 'create' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>
              Tên nhà
              <input
                value={householdName}
                onChange={e => setHouseholdName(e.target.value)}
                placeholder="Ví dụ: Nhà mình"
                maxLength={60}
                style={inputStyle}
              />
            </label>
            <button className="btn-primary" onClick={submitCreate} disabled={busy} style={bigButtonStyle}>
              {busy ? <Loader2 className="animate-spin" size={18} /> : <Users size={18} />} Tạo nhà
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>
              Mã mời
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="K7M2PQXR"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                maxLength={12}
                style={{ ...inputStyle, fontSize: 24, letterSpacing: 4, textAlign: 'center', fontWeight: 800 }}
              />
            </label>
            <button className="btn-primary" onClick={submitJoin} disabled={busy} style={bigButtonStyle}>
              {busy ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />} Vào nhà
            </button>
          </div>
        )}

        {shownError && (
          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', fontSize: 14, color: '#B91C1C', fontWeight: 700 }}>
            {shownError}
          </div>
        )}

        {mode && (
          <button
            onClick={() => { setMode(null); setLocalError(null); }}
            className="btn-secondary"
            style={{ marginTop: 18, padding: '10px 16px', borderRadius: 12, fontSize: 14 }}
          >
            <ArrowLeft size={15} /> Quay lại
          </button>
        )}

        <p style={{ marginTop: 26, fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
          App giúp sắp xếp và hiểu thông tin thuốc. App không chẩn đoán bệnh,
          không kê đơn, và không thay thế bác sĩ hay dược sĩ.
        </p>
      </div>
    </div>
  );
}

function ChoiceCard({ icon: Icon, title, detail, onClick, primary, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        textAlign: 'left',
        padding: '18px 20px',
        borderRadius: 18,
        border: primary ? '1px solid var(--coral-border)' : '1px solid var(--glass-border)',
        background: primary ? 'var(--coral-soft)' : 'rgba(255,255,255,0.8)',
        cursor: disabled ? 'wait' : 'pointer',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        fontFamily: 'inherit',
        opacity: disabled ? 0.6 : 1
      }}
    >
      <div style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 13, display: 'grid', placeItems: 'center', background: primary ? 'var(--coral-grad)' : 'rgba(241,245,249,0.9)' }}>
        <Icon size={21} color={primary ? '#FFF' : 'var(--text-sub)'} />
      </div>
      <div>
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-sub)', lineHeight: 1.5 }}>{detail}</div>
      </div>
    </button>
  );
}

const inputStyle = {
  display: 'block',
  width: '100%',
  marginTop: 8,
  padding: '14px 16px',
  borderRadius: 14,
  border: '1px solid var(--glass-border)',
  fontSize: 17,
  fontFamily: 'inherit',
  outline: 'none'
};

const bigButtonStyle = {
  padding: '15px 22px',
  borderRadius: 14,
  fontSize: 16.5,
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8
};
