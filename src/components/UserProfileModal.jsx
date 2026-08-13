import React, { useState } from 'react';
import { X, User, Heart, Shield, Phone, Sparkles, Check, Settings, Save } from 'lucide-react';
import { I18N_STRINGS } from '../services/mockData';

export default function UserProfileModal({ isOpen, onClose, memberProfile, onUpdateProfile, language = 'vi' }) {
  const [displayName, setDisplayName] = useState(memberProfile?.display_name || '');
  const [relation, setRelation] = useState(memberProfile?.relation || 'Ba');
  const [capability, setCapability] = useState(memberProfile?.capability || 'C3');
  const [allergiesText, setAllergiesText] = useState((memberProfile?.allergies || []).join(', '));
  const [conditionsText, setConditionsText] = useState((memberProfile?.conditions || []).join(', '));
  const [phone, setPhone] = useState('0908 123 456');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const t = I18N_STRINGS[language] || I18N_STRINGS.vi;

  const handleSave = () => {
    const updated = {
      ...memberProfile,
      display_name: displayName,
      relation,
      capability,
      allergies: allergiesText.split(',').map(s => s.trim()).filter(Boolean),
      conditions: conditionsText.split(',').map(s => s.trim()).filter(Boolean),
      emergency_phone: phone
    };

    onUpdateProfile(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const capabilitiesList = [
    { code: 'C1', label: 'C1 — Thành thạo smartphone', desc: 'Đọc tốt, quen thuộc với mọi thao tác UI' },
    { code: 'C2', label: 'C2 — Thao tác cơ bản', desc: 'Đọc chữ vừa, dùng các nút lớn cơ bản' },
    { code: 'C3', label: 'C3 — Người cao tuổi (Nút to + Zero Input)', desc: 'Chữ siêu to, chỉ nhận thông báo và bấm 1 nút' },
    { code: 'C4', label: 'C4 — Hỗ trợ giọng nói & Hình ảnh', desc: 'Mắt kém/không đọc chữ, tương tác 100% bằng giọng nói' }
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 350, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(20px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="liquid-card" style={{ width: '100%', maxWidth: 660, maxHeight: '90vh', overflowY: 'auto', background: '#FFF', borderRadius: 32, padding: 32, boxShadow: '0 25px 80px rgba(0,0,0,0.25)' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'var(--coral-soft)', color: 'var(--coral-main)', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
              <User size={14} /> Profile & Accessibility Settings
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-dark)' }}>👤 Hồ sơ Người thân & Cấu hình Khả năng (C1–C4)</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-sub)' }}>
              Tùy chỉnh giao diện theo khả năng tương tác công nghệ của {memberProfile?.display_name}.
            </p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#F1F5F9', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <X size={22} />
          </button>
        </div>

        {saved && (
          <div style={{ padding: 12, borderRadius: 14, background: 'var(--emerald-soft)', color: 'var(--emerald-ok)', fontWeight: 800, fontSize: 13.5, marginBottom: 16 }}>
            ✓ Đã lưu hồ sơ & tự động tối ưu giao diện app!
          </div>
        )}

        {/* Input Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)', display: 'block', marginBottom: 6 }}>Tên hiển thị:</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 14, border: '1px solid var(--glass-border)', fontSize: 14, fontFamily: 'inherit', background: '#F8FAFC' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)', display: 'block', marginBottom: 6 }}>Xưng hô / Vai trò:</label>
              <input
                type="text"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 14, border: '1px solid var(--glass-border)', fontSize: 14, fontFamily: 'inherit', background: '#F8FAFC' }}
              />
            </div>
          </div>

          {/* Capability Level C1-C4 */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)', display: 'block', marginBottom: 8 }}>Cấp độ Khả năng Sử dụng App (Capability Level):</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {capabilitiesList.map(cap => (
                <div
                  key={cap.code}
                  onClick={() => setCapability(cap.code)}
                  style={{
                    padding: 14, borderRadius: 16, border: capability === cap.code ? '1.5px solid var(--coral-main)' : '1px solid var(--glass-border)',
                    background: capability === cap.code ? 'rgba(255,241,237,0.7)' : '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <h5 style={{ fontSize: 14.5, fontWeight: 800, color: capability === cap.code ? 'var(--coral-main)' : 'var(--text-dark)' }}>{cap.label}</h5>
                    <span style={{ fontSize: 12.5, color: 'var(--text-sub)' }}>{cap.desc}</span>
                  </div>
                  {capability === cap.code && <Check size={18} color="var(--coral-main)" />}
                </div>
              ))}
            </div>
          </div>

          {/* Allergies & Conditions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)', display: 'block', marginBottom: 6 }}>Dị ứng (cách nhau bởi dấu phẩy):</label>
              <input
                type="text"
                value={allergiesText}
                onChange={(e) => setAllergiesText(e.target.value)}
                placeholder="Penicillin, Aspirin..."
                style={{ width: '100%', padding: '12px 16px', borderRadius: 14, border: '1px solid var(--glass-border)', fontSize: 14, fontFamily: 'inherit', background: '#F8FAFC' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)', display: 'block', marginBottom: 6 }}>SĐT Người thân khẩn cấp:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 14, border: '1px solid var(--glass-border)', fontSize: 14, fontFamily: 'inherit', background: '#F8FAFC' }}
              />
            </div>
          </div>

        </div>

        {/* Action Button */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn-primary" onClick={handleSave} style={{ padding: '12px 24px', borderRadius: 14 }}>
            <Save size={16} /> Lưu Thay Đổi
          </button>
        </div>

      </div>
    </div>
  );
}
