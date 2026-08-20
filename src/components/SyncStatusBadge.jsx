import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Link2, Link2Off } from 'lucide-react';
import { isGoogleConnected } from '../services/googleAuth';

/**
 * ⚠️ Bản trước hiển thị "Đồng bộ Firestore Live" nhưng thực ra chỉ đọc
 * `navigator.onLine` — tức là "máy có mạng hay không", không liên quan gì tới
 * Firestore, và lúc đó Firestore còn chưa được nối vào app.
 *
 * Giờ badge nói đúng hai thứ nó thật sự biết: có mạng không, và đã kết nối
 * tài khoản Google chưa.
 */
export default function SyncStatusBadge({ language = 'vi' }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [googleOn, setGoogleOn] = useState(isGoogleConnected());
  const isVi = language === 'vi';

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);

    // Token hết hạn trong lúc đang mở tab → badge phải đổi theo
    const timer = setInterval(() => setGoogleOn(isGoogleConnected()), 30000);

    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      clearInterval(timer);
    };
  }, []);

  const pill = (bg, border, color, icon, text, title) => (
    <div
      title={title}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: bg, border: `1px solid ${border}`, fontSize: 12, fontWeight: 800, color }}
    >
      {icon} <span>{text}</span>
    </div>
  );

  return (
    <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
      {isOnline
        ? pill('var(--emerald-soft)', 'rgba(5,150,105,0.2)', 'var(--emerald-ok)', <Wifi size={13} />, isVi ? 'Có mạng' : 'Online', isVi ? 'Thiết bị đang có kết nối internet' : 'Device is connected to internet')
        : pill('#FEF2F2', '#FCA5A5', '#DC2626', <WifiOff size={13} />, isVi ? 'Mất mạng' : 'Offline', isVi ? 'Thao tác sẽ được lưu tại máy và đồng bộ khi có mạng lại' : 'Changes will sync once connection is restored')}

      {googleOn
        ? pill('var(--sky-soft)', 'rgba(2,132,199,0.2)', 'var(--sky-blue)', <Link2 size={13} />, isVi ? 'Google đã kết nối' : 'Google Connected', isVi ? 'Lịch nhắc sẽ được tạo trong Google Calendar' : 'Reminders sync to Google Calendar')
        : pill('rgba(241,245,249,0.9)', 'var(--glass-border)', 'var(--text-muted)', <Link2Off size={13} />, isVi ? 'Chưa nối Google' : 'Google Offline', isVi ? 'Chưa tạo được lịch nhắc trong Google Calendar' : 'Not linked to Google Calendar yet')}
    </div>
  );
}
