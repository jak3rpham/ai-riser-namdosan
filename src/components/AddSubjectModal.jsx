import React, { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { registerFor } from '../services/honorifics';

/**
 * Khai báo một người được chăm sóc (ba, mẹ, ông, bà).
 *
 * Bước này trước đây không tồn tại: app tự nạp sẵn hai hồ sơ mẫu nên không ai
 * phải khai báo bao giờ. Nhà mới tạo thì trống, phải có đường thêm người vào.
 *
 * ⚠️ Dị ứng và bệnh nền là dữ liệu AN TOÀN, không phải dữ liệu trang trí:
 * `safetyChecks` dùng chúng để cảnh báo tương tác thuốc. Nhưng KHÔNG bắt buộc
 * nhập — bắt buộc thì người dùng sẽ điền bừa cho qua, mà điền bừa vào chỗ này
 * còn nguy hiểm hơn bỏ trống. Bỏ trống thì app biết là chưa biết.
 */

const RELATIONS_VI = ['Ba', 'Mẹ', 'Ông', 'Bà', 'Vợ/Chồng', 'Anh/Chị/Em', 'Chính tôi', 'Người thân'];
const RELATIONS_EN = ['Father', 'Mother', 'Grandfather', 'Grandmother', 'Spouse', 'Sibling', 'Myself', 'Other Relative'];

const ADDRESS_STYLES = (isVi) => [
  { value: 'elder', label: isVi ? 'Con – Bác' : 'Respectful (Elder)', hint: isVi ? 'Cháu Bi xưng "con", gọi "bác". Cho ông bà, ba mẹ.' : 'AI assistant uses polite elder honorifics.' },
  { value: 'peer', label: isVi ? 'Mình – Bạn' : 'Friendly (Peer)', hint: isVi ? 'Xưng "mình", gọi "bạn". Cho người trẻ trong nhà.' : 'AI assistant uses casual peer honorifics.' }
];

const CAPABILITIES = (isVi) => [
  { value: 'C1', label: isVi ? 'Tự dùng điện thoại tốt' : 'Tech-savvy / Independent' },
  { value: 'C2', label: isVi ? 'Dùng được, cần nhắc' : 'Can use with reminders' },
  { value: 'C3', label: isVi ? 'Cần người nhà hỗ trợ' : 'Needs caregiver assistance' },
  { value: 'C4', label: isVi ? 'Phụ thuộc hoàn toàn' : 'Fully dependent' }
];

const AVATAR_COLORS = [
  'linear-gradient(135deg, #FF6B4B 0%, #FF8E53 100%)',
  'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
  'linear-gradient(135deg, #059669 0%, #34D399 100%)',
  'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)'
];

export default function AddSubjectModal({ isOpen, onClose, onSave, existingCount = 0, variant = 'manager', language = 'vi' }) {
  const isVi = language === 'vi';
  const relations = isVi ? RELATIONS_VI : RELATIONS_EN;
  const addressStyles = ADDRESS_STYLES(isVi);
  const capabilities = CAPABILITIES(isVi);

  const [name, setName] = useState('');
  const [relation, setRelation] = useState(variant === 'parent' ? (isVi ? 'Chính tôi' : 'Myself') : (isVi ? 'Ba' : 'Father'));
  const [birthYear, setBirthYear] = useState('');
  const [addressStyle, setAddressStyle] = useState(null);
  const [capability, setCapability] = useState('C2');
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const splitList = raw =>
    raw.split(',').map(s => s.trim()).filter(Boolean);

  const guessedStyle = (() => {
    const y = Number(birthYear);
    if (Number.isInteger(y) && y > 1900) return registerFor({ birth_year: y }).id;
    return 'elder';
  })();
  const effectiveStyle = addressStyle || guessedStyle;

  const submit = async () => {
    if (!name.trim()) {
      setError(isVi ? 'Bạn nhập tên giúp nhé.' : 'Please enter a name.');
      return;
    }

    const year = Number(birthYear);
    if (birthYear && (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear())) {
      setError(isVi ? 'Năm sinh chưa hợp lệ.' : 'Invalid birth year.');
      return;
    }

    setSaving(true);
    setError(null);

    const res = await onSave({
      display_name: name.trim(),
      relation,
      birth_year: year || null,
      address_style: effectiveStyle,
      capability,
      conditions: splitList(conditions),
      allergies: splitList(allergies),
      avatar_color: AVATAR_COLORS[existingCount % AVATAR_COLORS.length]
    });

    setSaving(false);

    if (res.ok) {
      setName(''); setBirthYear(''); setConditions(''); setAllergies(''); setAddressStyle(null);
      onClose();
    } else {
      setError(res.error_message || (isVi ? 'Chưa lưu được. Bạn thử lại nhé.' : 'Failed to save. Please retry.'));
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={sheetStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)' }}>
            {variant === 'parent'
              ? (isVi ? 'Hồ sơ của bác' : 'My Profile')
              : (isVi ? 'Thêm người nhà' : 'Add Family Member')}
          </h3>
          <button onClick={onClose} className="btn-secondary" style={{ padding: 8, borderRadius: 12 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <Field label={isVi ? "Gọi là gì" : "Full Name / Nickname"}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={isVi ? "Ví dụ: Ba Mười" : "e.g. Dad John"} maxLength={40} style={inputStyle} />
          </Field>

          <Field label={isVi ? "Quan hệ" : "Relationship"}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {relations.map(r => (
                <Chip key={r} active={relation === r} onClick={() => setRelation(r)}>{r}</Chip>
              ))}
            </div>
          </Field>

          <Field label={isVi ? "Năm sinh (không bắt buộc)" : "Birth Year (optional)"}>
            <input
              value={birthYear}
              onChange={e => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1958"
              inputMode="numeric"
              style={inputStyle}
            />
          </Field>

          <Field label={isVi ? "Cháu Bi xưng hô thế nào" : "AI Honorific Style"}>
            <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
              {addressStyles.map(a => (
                <Chip key={a.value} active={effectiveStyle === a.value} onClick={() => setAddressStyle(a.value)} block>
                  <span style={{ fontWeight: 800 }}>{a.label}</span>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 600, opacity: 0.75, marginTop: 2 }}>
                    {a.hint}
                  </span>
                </Chip>
              ))}
            </div>
          </Field>

          <Field label={isVi ? "Dùng điện thoại thế nào" : "Smartphone Capability"}>
            <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
              {capabilities.map(c => (
                <Chip key={c.value} active={capability === c.value} onClick={() => setCapability(c.value)} block>
                  {c.label}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label={isVi ? "Bệnh nền (không bắt buộc, cách nhau bởi dấu phẩy)" : "Underlying Conditions (comma separated)"}>
            <input value={conditions} onChange={e => setConditions(e.target.value)} placeholder={isVi ? "Huyết áp cao, Mỡ máu cao" : "Hypertension, High Cholesterol"} style={inputStyle} />
          </Field>

          <Field label={isVi ? "Dị ứng thuốc (không bắt buộc)" : "Drug Allergies (optional)"}>
            <input value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="Penicillin" style={inputStyle} />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
              {isVi
                ? 'Khai báo dị ứng giúp app cảnh báo khi thêm thuốc. Không nhớ rõ thì cứ để trống, đừng đoán.'
                : 'Allergy logs allow the app to screen interactions. Leave blank if unsure.'}
            </div>
          </Field>
        </div>

        {error && (
          <div style={{ marginTop: 14, fontSize: 14, color: '#B91C1C', fontWeight: 700 }}>{error}</div>
        )}

        <button className="btn-primary" onClick={submit} disabled={saving} style={{ marginTop: 20, width: '100%', padding: '15px', borderRadius: 16, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {saving ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />} {isVi ? 'Lưu' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)', display: 'block' }}>
      {label}
      {children}
    </label>
  );
}

function Chip({ active, onClick, children, block }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '10px 16px',
        borderRadius: 12,
        border: active ? '1px solid var(--coral-main)' : '1px solid var(--glass-border)',
        background: active ? 'var(--coral-soft)' : 'rgba(255,255,255,0.85)',
        color: active ? 'var(--coral-main)' : 'var(--text-sub)',
        fontWeight: 700,
        fontSize: 14,
        fontFamily: 'inherit',
        cursor: 'pointer',
        textAlign: block ? 'left' : 'center',
        width: block ? '100%' : 'auto'
      }}
    >
      {children}
    </button>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 200,
  background: 'rgba(15,23,42,0.35)',
  display: 'grid', placeItems: 'center', padding: 16
};

const sheetStyle = {
  width: '100%', maxWidth: 460, maxHeight: '90dvh', overflowY: 'auto',
  background: '#FFF', borderRadius: 20, padding: '22px 20px',
  boxShadow: '0 24px 60px rgba(15,23,42,0.18)'
};

const inputStyle = {
  display: 'block', width: '100%', marginTop: 8,
  padding: '13px 15px', borderRadius: 12,
  border: '1px solid var(--glass-border)',
  fontSize: 16, fontFamily: 'inherit', outline: 'none'
};
