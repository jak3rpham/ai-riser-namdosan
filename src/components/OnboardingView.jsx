import React, { useState, useEffect } from 'react';
import { Home, LogIn, Loader2, ArrowLeft, Users, KeyRound, Phone, ShieldCheck, HelpCircle } from 'lucide-react';
import { listDemoAccounts } from '../services/demoAuth';

/**
 * Màn hình khởi đầu & Đăng nhập của Nhà Mình.
 *
 * Ba lựa chọn:
 *   1. Đăng nhập tài khoản      → dùng username & mật khẩu (có tính năng Quên mật khẩu qua SĐT)
 *   2. Tạo nhà mới & Đăng ký   → khai báo Tên nhà, Tên quản lý, Username, Mật khẩu, Số điện thoại khẩn cấp
 *   3. Nhập mã mời             → dành cho người thân gia nhập bằng mã 8 ký tự
 */
export default function OnboardingView({ onCreate, onJoin, onDemoLogin, onResetPassword, busy, error, language = 'vi' }) {
  const isVi = language === 'vi';
  const [mode, setMode] = useState(null); // null | 'login' | 'create' | 'join' | 'forgot'
  const [householdName, setHouseholdName] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [code, setCode] = useState('');

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');

  const [demoAccounts, setDemoAccounts] = useState(['giamkhao1', 'giamkhao2', 'giamkhao3', 'giamkhao4', 'giamkhao5', 'dungthu']);
  const [localError, setLocalError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    listDemoAccounts().then(res => {
      if (res.ok && res.usernames?.length) {
        setDemoAccounts(res.usernames);
      }
    }).catch(() => {});
  }, []);

  const validatePhone = (p) => {
    const clean = p.replace(/\D/g, '');
    return /^(03|05|07|08|09)\d{8}$/.test(clean);
  };

  const submitCreate = async () => {
    setLocalError(null);
    setSuccessMessage(null);

    if (!householdName.trim()) {
      setLocalError(isVi ? 'Vui lòng nhập Tên nhà.' : 'Please enter Household Name.');
      return;
    }

    if (regPhone.trim() && !validatePhone(regPhone)) {
      setLocalError(isVi ? 'Số điện thoại không đúng định dạng (cần 10 số, bắt đầu bằng 03, 05, 07, 08, 09).' : 'Invalid phone number (must be 10 digits starting with 03, 05, 07, 08, 09).');
      return;
    }

    if (regPassword && regPassword.length < 4) {
      setLocalError(isVi ? 'Mật khẩu cần ít nhất 4 ký tự.' : 'Password must be at least 4 characters.');
      return;
    }

    if (regPassword && regPassword !== regConfirmPassword) {
      setLocalError(isVi ? 'Mật khẩu và xác nhận mật khẩu chưa trùng khớp.' : 'Passwords do not match.');
      return;
    }

    const res = await onCreate({
      name: householdName.trim(),
      displayName: regDisplayName.trim() || undefined,
      username: regUsername.trim() || undefined,
      password: regPassword.trim() || undefined,
      phone: regPhone.trim() || undefined
    });
    if (res && !res.ok) setLocalError(res.error_message);
  };

  const submitJoin = async () => {
    setLocalError(null);
    setSuccessMessage(null);
    const res = await onJoin(code.trim());
    if (res && !res.ok) setLocalError(res.error_message);
  };

  const submitLogin = async () => {
    if (!onDemoLogin) return;
    setLocalError(null);
    setSuccessMessage(null);
    if (!loginUsername.trim()) {
      setLocalError(isVi ? 'Vui lòng nhập tên đăng nhập.' : 'Please enter username.');
      return;
    }
    if (!loginPassword.trim()) {
      setLocalError(isVi ? 'Vui lòng nhập mật khẩu.' : 'Please enter password.');
      return;
    }
    const res = await onDemoLogin(loginUsername.trim(), loginPassword.trim());
    if (res && !res.ok) setLocalError(res.error_message);
  };

  const submitForgot = async () => {
    if (!onResetPassword) return;
    setLocalError(null);
    setSuccessMessage(null);

    if (!forgotUsername.trim()) {
      setLocalError(isVi ? 'Vui lòng nhập tên đăng nhập.' : 'Please enter username.');
      return;
    }
    if (!forgotPhone.trim() || !validatePhone(forgotPhone)) {
      setLocalError(isVi ? 'Vui lòng nhập đúng số điện thoại 10 số đã đăng ký.' : 'Please enter registered 10-digit phone number.');
      return;
    }
    if (forgotNewPass.length < 4) {
      setLocalError(isVi ? 'Mật khẩu mới cần ít nhất 4 ký tự.' : 'New password must be at least 4 characters.');
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setLocalError(isVi ? 'Mật khẩu mới và xác nhận mật khẩu không trùng khớp.' : 'New password confirmation does not match.');
      return;
    }

    const res = await onResetPassword(forgotUsername.trim(), forgotPhone.trim(), forgotNewPass.trim());
    if (res && !res.ok) {
      setLocalError(res.error_message);
    } else {
      setSuccessMessage(isVi ? 'Đặt lại mật khẩu thành công! Đang kết nối vào nhà...' : 'Password reset successful! Connecting...');
    }
  };

  const shownError = localError || error;

  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: '24px 18px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 32, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 8 }}>
            {mode === 'login' && (isVi ? 'Đăng nhập tài khoản' : 'Account Login')}
            {mode === 'forgot' && (isVi ? 'Khôi phục mật khẩu' : 'Password Recovery')}
            {mode === 'create' && (isVi ? 'Tạo nhà cho gia đình' : 'Create Household')}
            {mode === 'join' && (isVi ? 'Vào nhà bằng mã mời' : 'Join with Invite Code')}
            {!mode && (isVi ? 'Bắt đầu với Home Health Hub' : 'Get Started with Home Health Hub')}
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-sub)', lineHeight: 1.5 }}>
            {mode === 'login' && (isVi ? 'Nhập tên đăng nhập & mật khẩu của gia đình hoặc tài khoản giám khảo.' : 'Enter your household username & password or evaluator account.')}
            {mode === 'forgot' && (isVi ? 'Xác minh số điện thoại đã đăng ký để đặt lại mật khẩu mới.' : 'Verify registered phone number to set a new password.')}
            {mode === 'create' && (isVi ? 'Khai báo thông tin tài khoản và hotline liên hệ của gia đình.' : 'Register household account info and emergency contact.')}
            {mode === 'join' && (isVi ? 'Nhập mã mời 8 ký tự người nhà đã chia sẻ cho bạn.' : 'Enter the 8-character invite code shared by your family.')}
            {!mode && (isVi ? 'Chọn cách bạn muốn đăng nhập hoặc tạo nhà cho gia đình nhé.' : 'Choose how you would like to sign in or create a household.')}
          </p>
        </div>

        {!mode && (
          <div style={{ display: 'grid', gap: 14 }}>
            <ChoiceCard
              icon={KeyRound}
              title={isVi ? "Đăng nhập bằng tài khoản" : "Sign In with Account"}
              detail={isVi ? "Dành cho gia đình đã có tài khoản hoặc tài khoản giám khảo. Đăng nhập để vào lại nhà từ mọi thiết bị." : "For existing households or evaluator accounts. Access from any device."}
              onClick={() => { setMode('login'); setLocalError(null); }}
              primary
            />
            <ChoiceCard
              icon={Home}
              title={isVi ? "Tạo nhà mới & Đăng ký" : "Create Household & Register"}
              detail={isVi ? "Cài đặt lần đầu. Đặt tên nhà, tên đăng nhập, mật khẩu và số điện thoại khẩn cấp của người quản lý." : "Initial setup. Set household name, username, password and manager emergency phone."}
              onClick={() => { setMode('create'); setLocalError(null); }}
            />
            <ChoiceCard
              icon={LogIn}
              title={isVi ? "Tôi có mã mời" : "I Have an Invite Code"}
              detail={isVi ? "Người nhà đã tạo nhà rồi và đưa bạn mã 8 ký tự để cùng kết nối chăm sóc ba mẹ." : "Family member already created a household and provided an 8-character code."}
              onClick={() => { setMode('join'); setLocalError(null); }}
            />
          </div>
        )}

        {/* ── MODE: LOGIN ── */}
        {mode === 'login' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>
              {isVi ? 'Tên đăng nhập' : 'Username'}
              <input
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                placeholder={isVi ? "Ví dụ: nhabamoi hoặc giamkhao1" : "e.g. nhabamoi or giamkhao1"}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                style={inputStyle}
              />
            </label>

            {/* Gợi ý chọn nhanh tài khoản test/giám khảo */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{isVi ? 'Tài khoản mẫu:' : 'Sample Accounts:'}</span>
              {demoAccounts.map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => {
                    setLoginUsername(u);
                    setLocalError(null);
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 8,
                    border: '1px solid rgba(226,232,240,0.9)',
                    background: loginUsername === u ? 'var(--coral-soft)' : '#F8FAFC',
                    color: loginUsername === u ? 'var(--coral-500)' : 'var(--text-sub)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {u}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>{isVi ? 'Mật khẩu' : 'Password'}</label>
              <button
                type="button"
                onClick={() => { setMode('forgot'); setLocalError(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--coral-500)', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                {isVi ? 'Quên mật khẩu?' : 'Forgot Password?'}
              </button>
            </div>

            <input
              type="password"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitLogin()}
              placeholder={isVi ? "Nhập mật khẩu tài khoản" : "Enter password"}
              style={{ ...inputStyle, marginTop: 0 }}
            />

            <button className="btn-primary" onClick={submitLogin} disabled={busy} style={bigButtonStyle}>
              {busy ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />} {isVi ? 'Đăng nhập vào nhà' : 'Sign In to Household'}
            </button>
          </div>
        )}

        {/* ── MODE: FORGOT PASSWORD ── */}
        {mode === 'forgot' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>
              {isVi ? 'Tên đăng nhập đã đăng ký' : 'Registered Username'} <span style={{ color: '#EF4444' }}>*</span>
              <input
                value={forgotUsername}
                onChange={e => setForgotUsername(e.target.value)}
                placeholder="Ví dụ: nhabamoi"
                autoCapitalize="none"
                style={inputStyle}
              />
            </label>

            <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>
              {isVi ? 'Số điện thoại người quản lý đã đăng ký' : 'Registered Manager Phone'} <span style={{ color: '#EF4444' }}>*</span>
              <input
                value={forgotPhone}
                onChange={e => setForgotPhone(e.target.value)}
                placeholder="0912345678"
                maxLength={10}
                style={inputStyle}
              />
            </label>

            <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>
              {isVi ? 'Mật khẩu mới' : 'New Password'} <span style={{ color: '#EF4444' }}>*</span>
              <input
                type="password"
                value={forgotNewPass}
                onChange={e => setForgotNewPass(e.target.value)}
                placeholder={isVi ? "Ít nhất 4 ký tự" : "At least 4 characters"}
                style={inputStyle}
              />
            </label>

            <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>
              {isVi ? 'Xác nhận mật khẩu mới' : 'Confirm New Password'} <span style={{ color: '#EF4444' }}>*</span>
              <input
                type="password"
                value={forgotConfirmPass}
                onChange={e => setForgotConfirmPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitForgot()}
                placeholder={isVi ? "Nhập lại mật khẩu mới" : "Re-enter new password"}
                style={inputStyle}
              />
            </label>

            <button className="btn-primary" onClick={submitForgot} disabled={busy} style={bigButtonStyle}>
              {busy ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />} {isVi ? 'Đặt lại mật khẩu & Đăng nhập' : 'Reset Password & Sign In'}
            </button>
          </div>
        )}

        {/* ── MODE: CREATE ── */}
        {mode === 'create' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>
              {isVi ? 'Tên nhà' : 'Household Name'} <span style={{ color: '#EF4444' }}>*</span>
              <input
                value={householdName}
                onChange={e => setHouseholdName(e.target.value)}
                placeholder={isVi ? "Ví dụ: Nhà Ba Mười" : "e.g. Smith Family"}
                maxLength={60}
                style={inputStyle}
              />
            </label>

            <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>
              {isVi ? 'Tên người quản lý gia đình' : 'Caregiver Name'}
              <input
                value={regDisplayName}
                onChange={e => setRegDisplayName(e.target.value)}
                placeholder={isVi ? "Ví dụ: Tuấn Nam (Con trai)" : "e.g. Alex (Son)"}
                maxLength={60}
                style={inputStyle}
              />
            </label>

            <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>
              {isVi ? 'Tên đăng nhập' : 'Username'}
              <input
                value={regUsername}
                onChange={e => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="Ví dụ: nhabamoi, giadinhnam..."
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={30}
                style={inputStyle}
              />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginTop: 4, display: 'block' }}>
                {isVi ? 'Dùng tên này để đăng nhập lại sau khi xóa dữ liệu trình duyệt hoặc mở trên máy khác.' : 'Use this username to log in across multiple devices.'}
              </span>
            </label>

            <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>
              {isVi ? 'Số điện thoại khẩn cấp (Người quản lý)' : 'Emergency Phone Number'}
              <input
                value={regPhone}
                onChange={e => setRegPhone(e.target.value)}
                placeholder={isVi ? "Ví dụ: 0912345678 (Dùng khi khẩn cấp & khôi phục mật khẩu)" : "e.g. 0912345678 (Used for alerts & recovery)"}
                maxLength={10}
                style={inputStyle}
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>
                {isVi ? 'Mật khẩu' : 'Password'}
                <input
                  type="password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder={isVi ? "Mật khẩu" : "Password"}
                  style={inputStyle}
                />
              </label>

              <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>
                {isVi ? 'Xác nhận mật khẩu' : 'Confirm Password'}
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={e => setRegConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitCreate()}
                  placeholder={isVi ? "Nhập lại" : "Re-enter"}
                  style={inputStyle}
                />
              </label>
            </div>

            <button className="btn-primary" onClick={submitCreate} disabled={busy} style={bigButtonStyle}>
              {busy ? <Loader2 className="animate-spin" size={18} /> : <Users size={18} />} {isVi ? 'Tạo nhà & Đăng ký tài khoản' : 'Create Household & Register'}
            </button>
          </div>
        )}

        {/* ── MODE: JOIN ── */}
        {mode === 'join' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>
              {isVi ? 'Mã mời' : 'Invite Code'}
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="K7M2PQXR"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                maxLength={12}
                style={{ ...inputStyle, fontSize: 26, letterSpacing: 4, textAlign: 'center', fontWeight: 800 }}
              />
            </label>
            <button className="btn-primary" onClick={submitJoin} disabled={busy} style={bigButtonStyle}>
              {busy ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />} {isVi ? 'Vào nhà' : 'Join Household'}
            </button>
          </div>
        )}

        {shownError && (
          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', fontSize: 14, color: '#B91C1C', fontWeight: 700 }}>
            {shownError}
          </div>
        )}

        {successMessage && (
          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: '#ECFDF5', border: '1px solid #6EE7B7', fontSize: 14, color: '#047857', fontWeight: 700 }}>
            {successMessage}
          </div>
        )}

        {mode && (
          <button
            onClick={() => { setMode(null); setLocalError(null); setSuccessMessage(null); }}
            className="btn-secondary"
            style={{ marginTop: 18, padding: '10px 16px', borderRadius: 12, fontSize: 14 }}
          >
            <ArrowLeft size={15} /> {isVi ? 'Quay lại' : 'Back'}
          </button>
        )}

        <p style={{ marginTop: 26, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
          {isVi
            ? 'App giúp sắp xếp và hiểu thông tin thuốc. App không chẩn đoán bệnh, không kê đơn, và không thay thế bác sĩ hay dược sĩ.'
            : 'Home Health Hub helps organize medication information and is not a substitute for professional medical advice.'}
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
        borderRadius: 20,
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
      <div style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center', background: primary ? 'var(--coral-grad)' : 'rgba(241,245,249,0.9)' }}>
        <Icon size={21} color={primary ? '#FFF' : 'var(--text-sub)'} />
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.5 }}>{detail}</div>
      </div>
    </button>
  );
}

const inputStyle = {
  display: 'block',
  width: '100%',
  marginTop: 8,
  padding: '14px 16px',
  borderRadius: 16,
  border: '1px solid var(--glass-border)',
  fontSize: 18,
  fontFamily: 'inherit',
  outline: 'none'
};

const bigButtonStyle = {
  padding: '15px 22px',
  borderRadius: 16,
  fontSize: 16,
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8
};
