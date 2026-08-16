import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, CalendarClock, Heart, NotebookPen } from 'lucide-react';

/**
 * Dòng sự kiện thời gian thực từ phía ba mẹ.
 *
 * Đây là chỗ cả hệ thống "khép vòng": ba mẹ bấm "ĐÃ UỐNG RỒI" trên điện thoại
 * → ghi vào Firestore → web con cái hiện lên trong vài giây, không cần tải lại.
 *
 * Cũng là nơi cảnh báo cấp cứu thật sự tới tay con cái — sửa lỗi C2 ở doc 33,
 * chỗ app từng nói "đã báo cho gia đình" mà không báo gì.
 */

/** `chipFg` tách riêng vì nhãn nào nền nhạt thì chữ trắng đọc không ra */
const STYLES = {
  EMERGENCY: { icon: AlertTriangle, bg: '#FEF2F2', border: '#DC2626', fg: '#991B1B', chipFg: '#FFF', label: 'CẤP CỨU' },
  SAFETY_CRITICAL: { icon: CalendarClock, bg: '#FFFBEB', border: '#F59E0B', fg: '#B45309', chipFg: '#FFF', label: 'CẦN ĐI KHÁM' },
  DOSE_TAKEN: { icon: CheckCircle2, bg: '#F0FDF4', border: '#86EFAC', fg: '#166534', chipFg: '#166534', label: 'ĐÃ UỐNG' },
  STATUS_OK: { icon: Heart, bg: '#FFF1F2', border: '#FECDD3', fg: '#BE123C', chipFg: '#BE123C', label: 'BÁO TIN' },
  // Triệu chứng chưa khớp dấu hiệu nguy hiểm nào. Vẫn phải hiện — app đã nói
  // với ba mẹ là "đã báo người nhà" — nhưng để màu trung tính, không tô đỏ.
  // Đỏ hoá mọi thứ thì vài lần là con cái tắt thông báo, và lần cần thì không
  // ai nhìn.
  SYMPTOM_LOG: { icon: NotebookPen, bg: 'rgba(241,245,249,0.9)', border: '#CBD5E1', fg: '#475569', chipFg: '#334155', label: 'GHI NHẬN' }
};

function when(ts) {
  if (!ts) return 'vừa xong';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  if (mins < 1440) return `${Math.floor(mins / 60)} giờ trước`;
  return d.toLocaleDateString('vi-VN');
}

export default function FamilyFeedCard({ feed = [] }) {
  const urgent = feed.filter(f => f.type === 'EMERGENCY' || f.type === 'SAFETY_CRITICAL');

  return (
    <div className="liquid-card" style={{ padding: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity color="var(--coral-main)" /> Ba mẹ đang thế nào
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-sub)' }}>
            Cập nhật ngay khi ba mẹ thao tác trên điện thoại — không cần tải lại trang.
          </p>
        </div>
        {urgent.length > 0 && (
          <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 99, background: '#DC2626', color: '#FFF' }}>
            {urgent.length} cảnh báo cần xem
          </span>
        )}
      </div>

      {feed.length === 0 ? (
        <div style={{ padding: 18, borderRadius: 16, background: 'rgba(241,245,249,0.7)', fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>
          Chưa có hoạt động nào. Khi ba mẹ bấm "đã uống thuốc" hoặc báo triệu chứng, nó sẽ hiện ở đây ngay.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto' }}>
          {feed.map(item => {
            const s = STYLES[item.type] || STYLES.DOSE_TAKEN;
            const Icon = s.icon;
            return (
              <div key={item.id} style={{ padding: 14, borderRadius: 16, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Icon size={18} color={s.fg} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: s.border, color: s.chipFg || '#FFF' }}>
                      {s.label}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-dark)' }}>
                      {item.subject_name || 'Ba mẹ'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{when(item.at)}</span>
                  </div>

                  <div style={{ fontSize: 14, color: s.fg, fontWeight: 600, marginTop: 3, lineHeight: 1.5 }}>
                    {item.type === 'DOSE_TAKEN'
                      ? `Đã uống ${item.med_name || 'thuốc'}${item.time_slot ? ` — cữ ${item.time_slot}` : ''}`
                      : item.title}
                  </div>

                  {item.detail && (
                    <div style={{ fontSize: 13, color: 'var(--text-sub)', fontWeight: 500, marginTop: 3, lineHeight: 1.5 }}>
                      {item.detail}
                    </div>
                  )}

                  {item.rule_id && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 3 }}>
                      Luật {item.rule_id}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
