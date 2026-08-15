import React, { useEffect, useState } from 'react';
import { LogIn, Loader2, Info, ArrowLeft } from 'lucide-react';
import { listDemoAccounts, loginDemo } from '../services/demoAuth';

/**
 * Đăng nhập tài khoản dùng thử — đường riêng `/demo`.
 *
 * Không có lối vào nào từ app chính. Người dùng thật đi qua màn onboarding
 * bình thường (tạo nhà / nhập mã mời) và không bao giờ thấy màn hình này.
 * Đường link này chỉ đưa cho người chấm bài và người thử nghiệm.
 *
 * Mỗi tên đăng nhập có một nhà riêng đã nạp sẵn hồ sơ hư cấu, nên hai người
 * chấm cùng lúc không đụng vào dữ liệu của nhau.
 */
export default function DemoLoginView({ onSuccess, onBack }) {
  const [usernames, setUsernames] = useState([]);
  const [enabled, setEnabled] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    listDemoAccounts().then(res => {
      if (res.ok) {
        setUsernames(res.usernames || []);
        setEnabled(res.enabled !== false);
        setUsername(u => u || res.usernames?.[0] || '');
      }
    });
  }, []);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await loginDemo(username.trim(), password);
    setBusy(false);

    if (res.ok) onSuccess(res.household_id);
    else setError(res.error_message);
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: '24px 18px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 8 }}>
            Tài khoản dùng thử
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-sub)', lineHeight: 1.55 }}>
            Đăng nhập để xem app với dữ liệu mẫu, không cần tài khoản Google.
          </p>
        </div>

        {!enabled && (
          <div style={{ padding: '14px 16px', borderRadius: 14, background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: 14, color: '#92400E', fontWeight: 700, marginBottom: 18 }}>
            Chế độ dùng thử đang tắt trên máy chủ.
          </div>
        )}

        <div style={{ display: 'grid', gap: 14 }}>
          <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>
            Tên đăng nhập
            {usernames.length > 0 ? (
              <select value={username} onChange={e => setUsername(e.target.value)} style={inputStyle}>
                {usernames.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            ) : (
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="giamkhao1" style={inputStyle} />
            )}
          </label>

          <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Mật khẩu ghi trong form nộp bài"
              style={inputStyle}
            />
          </label>

          <button className="btn-primary" onClick={submit} disabled={busy || !enabled} style={{ padding: '15px', borderRadius: 14, fontSize: 16.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {busy ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />} Vào xem app
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', fontSize: 14, color: '#B91C1C', fontWeight: 700 }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 22, padding: '13px 15px', borderRadius: 13, background: 'rgba(241,245,249,0.8)', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
          <Info size={16} color="var(--text-sub)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 12.5, color: 'var(--text-sub)', lineHeight: 1.55 }}>
            Hồ sơ bệnh nhân trong tài khoản này là <strong>hư cấu</strong>, dựng riêng để xem thử.
            Đồng bộ Google Calendar và Google Tasks cần tài khoản Google thật nên
            không dùng được ở đây — phần đó xem trong video demo.
          </div>
        </div>

        {onBack && (
          <button onClick={onBack} className="btn-secondary" style={{ marginTop: 16, padding: '10px 16px', borderRadius: 12, fontSize: 14 }}>
            <ArrowLeft size={15} /> Về trang chính
          </button>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  display: 'block',
  width: '100%',
  marginTop: 8,
  padding: '14px 16px',
  borderRadius: 14,
  border: '1px solid var(--glass-border)',
  fontSize: 16.5,
  fontFamily: 'inherit',
  background: '#FFF',
  outline: 'none'
};
