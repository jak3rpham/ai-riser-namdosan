import React, { useEffect, useState } from 'react';
import { Link2, CheckCircle2, AlertTriangle, LogOut, RefreshCw, Loader2, Calendar, ListTodo, MapPin, Sparkles } from 'lucide-react';
import { connectGoogle, disconnectGoogle, isGoogleConnected, subscribeAuthState } from '../services/googleAuth';
import { testCalendarConnection } from '../services/googleCalendar';
import { testTasksConnection } from '../services/googleTasks';
import { apiHealth } from '../services/apiClient';

/**
 * Bảng kết nối tài khoản Google.
 *
 * Đây cũng là chỗ nói THẬT về trạng thái từng dịch vụ — thay cho ba cái nhãn
 * cũ đang nói sai: "Đồng bộ Firestore Live" (thực ra chỉ đọc navigator.onLine),
 * "Đã đồng bộ Google Calendar" (không gọi API nào), "Google Maps Grounding"
 * (danh sách hardcode).
 *
 * Nguyên tắc: nhãn chỉ được xanh khi có bằng chứng — một lời gọi API thật đã
 * trả về 200.
 */

const StatusDot = ({ state }) => {
  const color = { ok: 'var(--emerald-ok)', warn: '#D97706', off: '#94A3B8', error: '#DC2626' }[state] || '#94A3B8';
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />;
};

function ServiceRow({ icon: Icon, name, state, detail, onTest, testing, isVi = true }) {
  const label = {
    ok: isVi ? 'Đã kết nối' : 'Connected',
    warn: isVi ? 'Chưa cấu hình' : 'Not configured',
    off: isVi ? 'Chưa kết nối' : 'Disconnected',
    error: isVi ? 'Lỗi' : 'Error'
  }[state] || (isVi ? 'Chưa rõ' : 'Unknown');

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderRadius: 16, background: '#FFF', border: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <Icon size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <StatusDot state={state} /> {name}
          </div>
          <div style={{ fontSize: 12, color: state === 'error' ? '#DC2626' : 'var(--text-muted)', fontWeight: 600, marginTop: 2, lineHeight: 1.45 }}>
            {detail || label}
          </div>
        </div>
      </div>

      {onTest && (
        <button
          onClick={onTest}
          disabled={testing}
          className="btn-secondary"
          style={{ padding: '6px 12px', borderRadius: 12, fontSize: 12, flexShrink: 0 }}
        >
          {testing ? <Loader2 className="animate-spin" size={13} /> : <RefreshCw size={13} />}
          {isVi ? 'Kiểm tra' : 'Test'}
        </button>
      )}
    </div>
  );
}

export default function GoogleConnectPanel({ onConnected, language = 'vi' }) {
  const isVi = language === 'vi';
  const [connected, setConnected] = useState(isGoogleConnected());
  const [user, setUser] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [testing, setTesting] = useState(null);
  const [calendarState, setCalendarState] = useState({ state: 'off', detail: null });
  const [tasksState, setTasksState] = useState({ state: 'off', detail: null });
  const [aiState, setAiState] = useState({ state: 'off', detail: isVi ? 'Đang hỏi máy chủ...' : 'Checking server...' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await apiHealth();
      if (cancelled) return;

      if (!res.ok) {
        setAiState({ state: 'error', detail: isVi ? 'Không hỏi được máy chủ. Kiểm tra mạng hoặc backend.' : 'Cannot reach server. Check connection.' });
        return;
      }

      if (!res.ai) {
        setAiState({ state: 'off', detail: isVi ? 'Máy chủ chưa báo tình trạng AI — bản backend cũ hơn bản web.' : 'Server AI status unknown.' });
        return;
      }

      const ai = res.ai;
      if (!ai.key_configured) {
        setAiState({ state: 'warn', detail: isVi ? 'Máy chủ chưa được cấu hình khoá Gemini.' : 'Gemini API key not configured on server.' });
      } else if (ai.last_call_ok === false) {
        setAiState({
          state: 'error',
          detail: isVi
            ? `Khoá có nhưng lần gọi gần nhất thất bại (${ai.last_error_code}). Đọc đơn thuốc và trợ lý đang không dùng được.`
            : `API key present but last call failed (${ai.last_error_code}).`
        });
      } else if (ai.last_call_ok === true) {
        setAiState({ state: 'ok', detail: isVi ? `Đã gọi được. Model ${res.model}.` : `Operational. Model ${res.model}.` });
      } else {
        setAiState({ state: 'off', detail: isVi ? `Có khoá, chưa gọi lần nào từ lúc máy chủ khởi động. Model ${res.model}.` : `Key ready. Model ${res.model}.` });
      }
    })();
    return () => { cancelled = true; };
  }, [isVi]);

  useEffect(() => subscribeAuthState(u => {
    if (u && !u.isAnonymous) {
      setUser({ displayName: u.displayName, email: u.email, photoURL: u.photoURL });
    } else {
      setUser(null);
    }
    setConnected(isGoogleConnected());
  }), []);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);

    const res = await connectGoogle();
    setConnecting(false);

    if (!res.ok) {
      setError(res.error_message);
      setConnected(false);
      return;
    }

    setUser(res.user);
    setConnected(true);
    onConnected?.(res.user);

    runTest('calendar');
    runTest('tasks');
  };

  const handleDisconnect = async () => {
    await disconnectGoogle();
    setConnected(false);
    setUser(null);
    setCalendarState({ state: 'off', detail: null });
    setTasksState({ state: 'off', detail: null });
  };

  const runTest = async (which) => {
    setTesting(which);
    if (which === 'calendar') {
      const r = await testCalendarConnection();
      setCalendarState(r.ok
        ? { state: 'ok', detail: isVi ? 'Đọc và tạo được sự kiện trên lịch của bác' : 'Can read & create calendar events' }
        : { state: 'error', detail: r.error_message });
      if (!r.ok && r.error_code === 'TOKEN_EXPIRED') setConnected(false);
    } else {
      const r = await testTasksConnection();
      setTasksState(r.ok
        ? { state: 'ok', detail: isVi ? `Danh sách việc: "${r.list_title}"` : `Task list: "${r.list_title}"` }
        : { state: 'error', detail: r.error_message });
      if (!r.ok && r.error_code === 'TOKEN_EXPIRED') setConnected(false);
    }
    setTesting(null);
  };

  return (
    <div className="liquid-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link2 color="var(--coral-main)" size={20} /> {isVi ? 'Kết nối tài khoản Google' : 'Google Account Integration'}
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-sub)', marginTop: 4, maxWidth: 520, lineHeight: 1.55 }}>
            {isVi
              ? 'Cho phép app tạo lịch nhắc uống thuốc trong Google Calendar và việc mua thêm thuốc trong Google Tasks. App chỉ tạo và sửa những mục do chính nó tạo ra.'
              : 'Allows app to create medication reminders in Google Calendar and refill tasks in Google Tasks.'}
          </p>
        </div>

        {connected && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user.photoURL && (
              <img src={user.photoURL} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-dark)' }}>{user.displayName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{user.email}</div>
            </div>
            <button onClick={handleDisconnect} className="btn-secondary" style={{ padding: '8px 12px', borderRadius: 12, fontSize: 13 }}>
              <LogOut size={14} /> {isVi ? 'Ngắt' : 'Disconnect'}
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={handleConnect} disabled={connecting} style={{ padding: '12px 20px', borderRadius: 16 }}>
            {connecting ? <Loader2 className="animate-spin" size={17} /> : <Link2 size={17} />}
            {connecting ? (isVi ? 'Đang mở Google...' : 'Connecting...') : (isVi ? 'Kết nối Google' : 'Connect Google')}
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px 14px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, color: '#991B1B', fontWeight: 700, lineHeight: 1.5 }}>{error}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ServiceRow
          icon={Calendar}
          name="Google Calendar"
          state={connected ? calendarState.state === 'off' ? 'warn' : calendarState.state : 'off'}
          detail={connected ? (calendarState.detail || (isVi ? 'Đã có quyền — bấm Kiểm tra để xác nhận' : 'Authorized — click Test to verify')) : (isVi ? 'Cần kết nối tài khoản' : 'Account required')}
          onTest={connected ? () => runTest('calendar') : null}
          testing={testing === 'calendar'}
          isVi={isVi}
        />

        <ServiceRow
          icon={ListTodo}
          name="Google Tasks"
          state={connected ? tasksState.state === 'off' ? 'warn' : tasksState.state : 'off'}
          detail={connected ? (tasksState.detail || (isVi ? 'Đã có quyền — bấm Kiểm tra để xác nhận' : 'Authorized — click Test to verify')) : (isVi ? 'Cần kết nối tài khoản' : 'Account required')}
          onTest={connected ? () => runTest('tasks') : null}
          testing={testing === 'tasks'}
          isVi={isVi}
        />

        <ServiceRow
          icon={MapPin}
          name={isVi ? "Tìm nhà thuốc gần đây" : "Nearby Pharmacies"}
          state="ok"
          detail={isVi ? "Dùng dữ liệu OpenStreetMap. Không cần khoá, không cần đăng nhập." : "Powered by OpenStreetMap. No API key or login required."}
          isVi={isVi}
        />

        <ServiceRow
          icon={Sparkles}
          name="Gemini API"
          state={aiState.state}
          detail={aiState.detail}
          isVi={isVi}
        />
      </div>

      <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, background: 'rgba(241,245,249,0.8)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.6 }}>
        {isVi
          ? 'Phiên kết nối Google hết hạn sau khoảng 1 tiếng và khi đóng tab. Hết hạn thì app sẽ báo và mời kết nối lại.'
          : 'Google connection session expires after ~1 hour or tab close. Reconnect anytime.'}
      </div>
    </div>
  );
}
