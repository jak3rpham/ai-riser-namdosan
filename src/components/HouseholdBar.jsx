import React, { useState } from 'react';
import { Users, Copy, Check, LogIn, Loader2, AlertTriangle, Cloud } from 'lucide-react';

/**
 * Mã mời + trạng thái đồng bộ.
 *
 * Đây là thứ làm cho hai bề mặt trở thành MỘT sản phẩm: con cái lấy mã ở web,
 * ba mẹ nhập mã ở app, rồi hai bên thấy chung một dữ liệu theo thời gian thực.
 *
 * Giai đoạn này mã mời chính là id của nhà (20 ký tự ngẫu nhiên do Firestore
 * sinh). Luồng mời đầy đủ có hạn dùng và bước duyệt nằm ở doc 39 mục 7.
 */
export default function HouseholdBar({ householdId, status, error, onJoin, variant = 'manager' }) {
  const [copied, setCopied] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(householdId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setJoinError('Trình duyệt không cho copy tự động. Bạn chọn và copy tay giúp nhé.');
    }
  };

  const submitJoin = async () => {
    setJoining(true);
    setJoinError(null);
    const res = await onJoin(code);
    setJoining(false);
    if (!res.ok) setJoinError(res.error_message);
    else { setShowJoin(false); setCode(''); }
  };

  if (status === 'connecting') {
    return (
      <div style={{ padding: '10px 16px', borderRadius: 14, background: 'rgba(241,245,249,0.9)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-sub)', fontWeight: 600 }}>
        <Loader2 className="animate-spin" size={15} /> Đang kết nối dữ liệu nhà mình...
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ padding: '12px 16px', borderRadius: 14, background: '#FEF2F2', border: '1px solid #FCA5A5', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#991B1B' }}>Chưa kết nối được dữ liệu</div>
          <div style={{ fontSize: 12.5, color: '#B91C1C', fontWeight: 600, marginTop: 2 }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.75)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <Cloud size={17} color="var(--emerald-ok)" style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-dark)' }}>
            {variant === 'manager' ? 'Mã mời người nhà' : 'Đang dùng chung dữ liệu với gia đình'}
          </div>
          <code style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, wordBreak: 'break-all' }}>
            {householdId}
          </code>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={copy} className="btn-secondary" style={{ padding: '8px 14px', borderRadius: 12, fontSize: 12.5 }}>
          {copied ? <><Check size={14} color="var(--emerald-ok)" /> Đã copy</> : <><Copy size={14} /> Copy mã</>}
        </button>
        <button onClick={() => setShowJoin(v => !v)} className="btn-secondary" style={{ padding: '8px 14px', borderRadius: 12, fontSize: 12.5 }}>
          <LogIn size={14} /> Nhập mã khác
        </button>
      </div>

      {showJoin && (
        <div style={{ width: '100%', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', paddingTop: 4 }}>
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Dán mã mời của người nhà vào đây"
            style={{ flex: 1, minWidth: 220, padding: '11px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontSize: 15, fontFamily: 'inherit', outline: 'none' }}
          />
          <button className="btn-primary" onClick={submitJoin} disabled={joining} style={{ padding: '11px 20px', borderRadius: 12 }}>
            {joining ? <Loader2 className="animate-spin" size={16} /> : <Users size={16} />} Vào nhà này
          </button>
        </div>
      )}

      {joinError && (
        <div style={{ width: '100%', fontSize: 12.5, color: '#B91C1C', fontWeight: 700 }}>{joinError}</div>
      )}
    </div>
  );
}
