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

function ServiceRow({ icon: Icon, name, state, detail, onTest, testing }) {
  const label = {
    ok: 'Đã kết nối',
    warn: 'Chưa cấu hình',
    off: 'Chưa kết nối',
    error: 'Lỗi'
  }[state] || 'Chưa rõ';

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
          Kiểm tra
        </button>
      )}
    </div>
  );
}

export default function GoogleConnectPanel({ onConnected }) {
  const [connected, setConnected] = useState(isGoogleConnected());
  const [user, setUser] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [testing, setTesting] = useState(null);
  const [calendarState, setCalendarState] = useState({ state: 'off', detail: null });
  const [tasksState, setTasksState] = useState({ state: 'off', detail: null });

  /**
   * Trạng thái tầng AI, hỏi thẳng máy chủ.
   *
   * ⚠️ Trước đây dòng này hỏi `isAiConfigured()` — một hàm `return true` vô
   * điều kiện — rồi in "Đã có khoá. Đọc đơn thuốc và trợ lý Cháu Bi hoạt động."
   * Ngày 16/08 khoá bị Google trả 401 hàng giờ, mọi /ai/* trả 502, mà dòng này
   * vẫn xanh và vẫn khẳng định y nguyên. Đúng thứ mà chính file này, ở đầu
   * trang, đặt ra để chống: nhãn xanh phải có bằng chứng.
   */
  const [aiState, setAiState] = useState({ state: 'off', detail: 'Đang hỏi máy chủ...' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await apiHealth();
      if (cancelled) return;

      if (!res.ok) {
        setAiState({ state: 'error', detail: 'Không hỏi được máy chủ. Kiểm tra mạng hoặc backend.' });
        return;
      }

      // Backend cũ chưa có trường này. Nói thẳng là chưa biết, đừng suy ra
      // "chưa cấu hình khoá" — thứ tự deploy là backend trước, nhưng khoảng
      // giữa hai lần deploy vẫn có thật.
      if (!res.ai) {
        setAiState({ state: 'off', detail: 'Máy chủ chưa báo tình trạng AI — bản backend cũ hơn bản web.' });
        return;
      }

      const ai = res.ai;
      if (!ai.key_configured) {
        setAiState({ state: 'warn', detail: 'Máy chủ chưa được cấu hình khoá Gemini.' });
      } else if (ai.last_call_ok === false) {
        setAiState({
          state: 'error',
          detail: `Khoá có nhưng lần gọi gần nhất thất bại (${ai.last_error_code}). Đọc đơn thuốc và trợ lý đang không dùng được.`
        });
      } else if (ai.last_call_ok === true) {
        setAiState({ state: 'ok', detail: `Đã gọi được. Model ${res.model}.` });
      } else {
        // Máy chủ vừa khởi động lại, chưa gọi lần nào — chưa có bằng chứng nào
        // để nói xanh, mà cũng chưa có gì để nói hỏng.
        setAiState({ state: 'off', detail: `Có khoá, chưa gọi lần nào từ lúc máy chủ khởi động. Model ${res.model}.` });
      }
    })();
    return () => { cancelled = true; };
  }, []);

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

    // Kiểm chứng ngay bằng lời gọi thật, không chỉ dựa vào việc có token
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
        ? { state: 'ok', detail: 'Đọc và tạo được sự kiện trên lịch của bác' }
        : { state: 'error', detail: r.error_message });
      if (!r.ok && r.error_code === 'TOKEN_EXPIRED') setConnected(false);
    } else {
      const r = await testTasksConnection();
      setTasksState(r.ok
        ? { state: 'ok', detail: `Danh sách việc: "${r.list_title}"` }
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
            <Link2 color="var(--coral-main)" size={20} /> Kết nối tài khoản Google
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-sub)', marginTop: 4, maxWidth: 520, lineHeight: 1.55 }}>
            Cho phép app tạo lịch nhắc uống thuốc trong Google Calendar và việc mua thêm thuốc
            trong Google Tasks. App chỉ tạo và sửa những mục do chính nó tạo ra.
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
              <LogOut size={14} /> Ngắt
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={handleConnect} disabled={connecting} style={{ padding: '12px 20px', borderRadius: 16 }}>
            {connecting ? <Loader2 className="animate-spin" size={17} /> : <Link2 size={17} />}
            {connecting ? 'Đang mở Google...' : 'Kết nối Google'}
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
          detail={connected ? (calendarState.detail || 'Đã có quyền — bấm Kiểm tra để xác nhận bằng một lời gọi thật') : 'Cần kết nối tài khoản'}
          onTest={connected ? () => runTest('calendar') : null}
          testing={testing === 'calendar'}
        />

        <ServiceRow
          icon={ListTodo}
          name="Google Tasks"
          state={connected ? tasksState.state === 'off' ? 'warn' : tasksState.state : 'off'}
          detail={connected ? (tasksState.detail || 'Đã có quyền — bấm Kiểm tra để xác nhận') : 'Cần kết nối tài khoản'}
          onTest={connected ? () => runTest('tasks') : null}
          testing={testing === 'tasks'}
        />

        <ServiceRow
          icon={MapPin}
          name="Tìm nhà thuốc gần đây"
          state="ok"
          detail="Dùng dữ liệu OpenStreetMap. Không cần khoá, không cần đăng nhập — Google Maps Platform không cấp cho tài khoản Việt Nam."
        />

        <ServiceRow
          icon={Sparkles}
          name="Gemini API"
          state={aiState.state}
          detail={aiState.detail}
        />
      </div>

      <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, background: 'rgba(241,245,249,0.8)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.6 }}>
        Phiên kết nối Google hết hạn sau khoảng 1 tiếng và khi đóng tab. Hết hạn thì app sẽ báo và
        mời kết nối lại — không âm thầm bỏ qua việc đồng bộ.
      </div>
    </div>
  );
}
