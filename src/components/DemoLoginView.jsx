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
export default function DemoLoginView({ onSuccess, onBack, language = 'vi' }) {
  const isVi = language === 'vi';
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
          <h1 style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 8 }}>
            {isVi ? 'Tài khoản dùng thử' : 'Demo Evaluation Account'}
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-sub)', lineHeight: 1.55 }}>
            {isVi ? 'Đăng nhập để xem app với dữ liệu mẫu, không cần tài khoản Google.' : 'Log in to evaluate the application with pre-loaded mock data.'}
          </p>
        </div>

        {!enabled && (
          <div style={{ padding: '14px 16px', borderRadius: 16, background: '#FEF3F7', border: '1px solid #FCD34D', fontSize: 14, color: '#92400E', fontWeight: 700, marginBottom: 18 }}>
            {isVi ? 'Chế độ dùng thử đang tắt trên máy chủ.' : 'Demo mode is currently disabled.'}
          </div>
        )}

        <div style={{ display: 'grid', gap: 14 }}>
          <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>
            {isVi ? 'Tên đăng nhập' : 'Username'}
            {usernames.length > 0 ? (
              <select value={username} onChange={e => setUsername(e.target.value)} style={inputStyle}>
                {usernames.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            ) : (
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="giamkhao1" style={inputStyle} />
            )}
          </label>

          <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>
            {isVi ? 'Mật khẩu' : 'Password'}
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder={isVi ? "Mật khẩu ghi trong form nộp bài" : "Enter password"}
              style={inputStyle}
            />
          </label>

          <button className="btn-primary" onClick={submit} disabled={busy || !enabled} style={{ padding: '15px', borderRadius: 16, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {busy ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />} {isVi ? 'Vào xem app' : 'Enter Application'}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', fontSize: 14, color: '#B91C1C', fontWeight: 700 }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 22, padding: '13px 15px', borderRadius: 12, background: 'rgba(241,245,249,0.8)', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
          <Info size={16} color="var(--text-sub)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.55 }}>
            {isVi
              ? <>Hồ sơ bệnh nhân trong tài khoản này là <strong>hư cấu</strong>, dựng riêng để xem thử.</>
              : <>Patient profiles in this account are <strong>synthetic mock data</strong> for evaluation.</>}
          </div>
        </div>

        {onBack && (
          <button onClick={onBack} className="btn-secondary" style={{ marginTop: 16, padding: '10px 16px', borderRadius: 12, fontSize: 14 }}>
            <ArrowLeft size={15} /> {isVi ? 'Về trang chính' : 'Back to Main'}
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
  borderRadius: 16,
  border: '1px solid var(--glass-border)',
  fontSize: 16,
  fontFamily: 'inherit',
  background: '#FFF',
  outline: 'none'
};
