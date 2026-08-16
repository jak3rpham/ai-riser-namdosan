import React, { useState } from 'react';
import { Users, Copy, Check, LogIn, Loader2, AlertTriangle, Cloud, KeyRound, Clock } from 'lucide-react';
import { createInvite } from '../services/householdService';

/**
 * Mời người nhà + trạng thái đồng bộ.
 *
 * Đây là thứ làm cho hai bề mặt trở thành MỘT sản phẩm: con cái tạo mã ở web,
 * ba mẹ nhập mã ở app, rồi hai bên thấy chung một dữ liệu theo thời gian thực.
 *
 * ⚠️ Trước đây chỗ này hiện thẳng id của nhà và gọi nó là "mã mời" — id đó
 * dùng được vĩnh viễn, ai đọc được là vào được hồ sơ y tế. Một khung hình
 * video demo là đủ để mất. Giờ mã chỉ sinh ra KHI người dùng bấm nút, hết hạn
 * sau 7 ngày, và giới hạn số lượt. Không hiện gì cho tới lúc thực sự cần mời.
 */
export default function HouseholdBar({ householdId, status, error, onJoin, variant = 'manager' }) {
  const [copied, setCopied] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);

  const [invite, setInvite] = useState(null);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [inviteError, setInviteError] = useState(null);

  const makeInvite = async () => {
    setCreatingInvite(true);
    setInviteError(null);
    const res = await createInvite(householdId);
    setCreatingInvite(false);
    if (res.ok) setInvite(res);
    else setInviteError(res.error_message);
  };

  const copy = async () => {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setInviteError('Trình duyệt không cho copy tự động. Bạn đọc mã cho người nhà giúp nhé.');
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
            {variant === 'manager' ? 'Dữ liệu nhà mình đã kết nối' : 'Đang dùng chung dữ liệu với gia đình'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            {/* Chỉ dẫn phải khớp với nút THẬT SỰ hiện ra. Bản trước luôn bảo
                bấm "Tạo mã mời" kể cả ở app Ba Mẹ — nơi nút đó không tồn tại. */}
            {invite
              ? 'Đọc mã dưới đây cho người nhà nhập vào máy của họ'
              : variant === 'manager'
                ? 'Muốn thêm người nhà thì bấm "Tạo mã mời"'
                : 'Người nhà cho mã thì bấm "Nhập mã mời" để dùng chung dữ liệu'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {variant === 'manager' && (
          <button onClick={makeInvite} disabled={creatingInvite} className="btn-secondary" style={{ padding: '8px 14px', borderRadius: 12, fontSize: 12.5 }}>
            {creatingInvite ? <Loader2 className="animate-spin" size={14} /> : <KeyRound size={14} />} Tạo mã mời
          </button>
        )}
        <button onClick={() => setShowJoin(v => !v)} className="btn-secondary" style={{ padding: '8px 14px', borderRadius: 12, fontSize: 12.5 }}>
          <LogIn size={14} /> Nhập mã mời
        </button>
      </div>

      {invite && (
        <div style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'var(--coral-soft)', border: '1px solid var(--coral-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            {/* Chữ to, giãn ký tự: bác cầm điện thoại đọc cho con qua điện thoại */}
            <code style={{ fontSize: 26, fontWeight: 800, letterSpacing: 3, color: 'var(--coral-main)', fontFamily: 'Outfit, monospace' }}>
              {invite.code}
            </code>
            <div style={{ fontSize: 12, color: 'var(--text-sub)', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={12} />
              Dùng được {invite.max_uses} lần, trong 7 ngày
            </div>
          </div>
          <button onClick={copy} className="btn-secondary" style={{ padding: '8px 14px', borderRadius: 12, fontSize: 12.5 }}>
            {copied ? <><Check size={14} color="var(--emerald-ok)" /> Đã copy</> : <><Copy size={14} /> Copy mã</>}
          </button>
        </div>
      )}

      {inviteError && (
        <div style={{ width: '100%', fontSize: 12.5, color: '#B91C1C', fontWeight: 700 }}>{inviteError}</div>
      )}

      {showJoin && (
        <div style={{ width: '100%', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', paddingTop: 4 }}>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="Nhập mã mời, ví dụ K7M2PQXR"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={12}
            style={{ flex: 1, minWidth: 200, padding: '11px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontSize: 18, fontWeight: 700, letterSpacing: 2, fontFamily: 'inherit', outline: 'none' }}
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
