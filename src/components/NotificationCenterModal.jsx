import React, { useState } from 'react';
import { X, Bell, AlertTriangle, Send, CheckCircle2, ShieldAlert, Clock } from 'lucide-react';
import { I18N_STRINGS } from '../services/i18n';

export default function NotificationCenterModal({ isOpen, onClose, selectedMember, feed = [], language = 'vi' }) {
  const [localNotifs, setLocalNotifs] = useState([]);
  const [sentMessage, setSentMessage] = useState(null);

  if (!isOpen) return null;

  const t = I18N_STRINGS[language] || I18N_STRINGS.vi;

  const formatFeedTime = (at) => {
    if (!at) return 'Vừa xong';
    if (at.seconds) return new Date(at.seconds * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    if (at instanceof Date) return at.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return 'Vừa xong';
  };

  const feedNotifs = feed.map(item => {
    let title = '📢 Thông báo hệ thống';
    let type = item.type;
    let content = item.detail || item.title || 'Có cập nhật mới từ gia đình.';

    if (item.type === 'DOSE_TAKEN') {
      title = `💊 ${item.subject_name || 'Người thân'} đã uống ${item.med_name || 'thuốc'}`;
      content = `Đã xác nhận cữ ${item.time_slot || ''} vào lúc ${formatFeedTime(item.at)}.`;
    } else if (item.type === 'EMERGENCY') {
      title = `🚨 BÁO ĐỘNG CẤP CỨU: ${item.subject_name || ''}`;
      content = item.title || item.detail || 'Cảnh báo nguy hiểm khẩn cấp!';
    } else if (item.type === 'SAFETY_CRITICAL') {
      title = `⚠️ CẢNH BÁO AN TOÀN: ${item.title || ''}`;
      content = item.detail || 'Phát hiện rủi ro y tế nghiêm trọng.';
    }

    return {
      id: item.id || `feed_${Date.now()}`,
      type,
      title,
      recipient: item.subject_name || selectedMember?.display_name || 'Gia đình',
      content,
      time: formatFeedTime(item.at),
      status: 'REALTIME'
    };
  });

  const allNotifications = [...localNotifs, ...feedNotifs];

  const handleTestNotification = (type) => {
    const newNotif = {
      id: `n_${Date.now()}`,
      type,
      title: type === 'N1_REMINDER' ? '⏰ Test Nhắc thuốc 0 token' : '⚠️ Escalation Tier: Gợi ý gọi hỏi thăm',
      recipient: selectedMember?.display_name || 'Ba Mười',
      content: type === 'N1_REMINDER' ? 'Bác ơi, tới cữ thuốc chiều rồi ạ!' : 'Ba chưa bấm xác nhận cữ 18:00. Bạn có muốn gọi Zalo hỏi thăm nhẹ không?',
      time: 'Vừa xong',
      status: 'TEST'
    };

    setLocalNotifs([newNotif, ...localNotifs]);
    setSentMessage("✓ Đã bắn thông báo thử nghiệm thành công!");
    setTimeout(() => setSentMessage(null), 3000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(20px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="liquid-card" style={{ width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', background: '#FFF', borderRadius: 32, padding: 32, boxShadow: '0 25px 80px rgba(0,0,0,0.25)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'var(--coral-soft)', color: 'var(--coral-main)', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
              <Bell size={14} /> Trung tâm Thông báo Live
            </div>
            <h3 style={{ fontSize: 23, fontWeight: 800, color: 'var(--text-dark)' }}>🔔 Nhật ký & Giả lập Thông báo</h3>
            <p style={{ fontSize: 14, color: 'var(--text-sub)' }}>
              Theo dõi dòng thông báo thời gian thực từ Firestore và kiểm thử các kịch bản nhắc nhở.
            </p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#F1F5F9', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <X size={22} />
          </button>
        </div>

        {/* Quick Test Triggers */}
        <div style={{ padding: 16, borderRadius: 20, background: '#F8FAFC', border: '1px solid var(--glass-border)', marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => handleTestNotification('N1_REMINDER')} style={{ padding: '8px 16px', fontSize: 13, borderRadius: 12 }}>
            <Send size={15} /> Bắn thử N1 (Nhắc thuốc)
          </button>
          <button className="btn-secondary" onClick={() => handleTestNotification('ESCALATION')} style={{ padding: '8px 16px', fontSize: 13, borderRadius: 12, border: '1px solid rgba(217,119,6,0.3)', color: 'var(--amber-warm)' }}>
            <AlertTriangle size={15} /> Bắn thử Escalation (Nhắc con)
          </button>
        </div>

        {sentMessage && (
          <div style={{ padding: 12, borderRadius: 16, background: 'var(--emerald-soft)', color: 'var(--emerald-ok)', fontWeight: 800, fontSize: 13, marginBottom: 16 }}>
            {sentMessage}
          </div>
        )}

        {/* Notifications List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {allNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-sub)', fontSize: 14 }}>
              Chưa có thông báo nào. Các sự kiện uống thuốc hoặc báo động từ ba mẹ sẽ tự động xuất hiện ở đây.
            </div>
          ) : (
            allNotifications.map(n => (
              <div key={n.id} style={{
                padding: 16, borderRadius: 16, background: n.type === 'EMERGENCY' ? '#FEF2F2' : '#FFF',
                border: n.type === 'EMERGENCY' ? '1.5px solid #FCA5A5' : '1px solid var(--glass-border)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14
              }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: n.type === 'EMERGENCY' ? '#991B1B' : 'var(--text-dark)' }}>{n.title}</div>
                  <div style={{ fontSize: 14, color: n.type === 'EMERGENCY' ? '#B91C1C' : 'var(--text-sub)', marginTop: 4, fontWeight: 500 }}>{n.content}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, fontWeight: 600 }}>
                    Đối tượng: <strong>{n.recipient}</strong> · Lúc: {n.time}
                  </div>
                </div>

                <span style={{
                  fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                  background: n.type === 'EMERGENCY' ? '#FEE2E2' : 'var(--emerald-soft)',
                  color: n.type === 'EMERGENCY' ? '#DC2626' : 'var(--emerald-ok)',
                  whitespace: 'nowrap'
                }}>
                  {n.status === 'REALTIME' ? '🔴 Live' : `✓ ${n.status}`}
                </span>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
