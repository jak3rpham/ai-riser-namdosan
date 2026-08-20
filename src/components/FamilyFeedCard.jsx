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
  EMERGENCY: { icon: AlertTriangle, bg: '#FEF2F2', border: '#DC2626', fg: '#991B1B', chipFg: '#FFF', vi: 'CẤP CỨU', en: 'EMERGENCY' },
  SAFETY_CRITICAL: { icon: CalendarClock, bg: '#FFFBEB', border: '#F59E0B', fg: '#B45309', chipFg: '#FFF', vi: 'CẦN ĐI KHÁM', en: 'SEE DOCTOR' },
  DOSE_TAKEN: { icon: CheckCircle2, bg: '#F0FDF4', border: '#86EFAC', fg: '#166534', chipFg: '#166534', vi: 'ĐÃ UỐNG', en: 'TAKEN' },
  STATUS_OK: { icon: Heart, bg: '#FFF1F2', border: '#FECDD3', fg: '#BE123C', chipFg: '#BE123C', vi: 'BÁO TIN', en: 'STATUS' },
  SYMPTOM_LOG: { icon: NotebookPen, bg: 'rgba(241,245,249,0.9)', border: '#CBD5E1', fg: '#475569', chipFg: '#334155', vi: 'GHI NHẬN', en: 'LOGGED' }
};

function when(ts, isVi = true) {
  if (!ts) return isVi ? 'vừa xong' : 'just now';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return isVi ? 'vừa xong' : 'just now';
  if (mins < 60) return isVi ? `${mins} phút trước` : `${mins}m ago`;
  if (mins < 1440) return isVi ? `${Math.floor(mins / 60)} giờ trước` : `${Math.floor(mins / 60)}h ago`;
  return d.toLocaleDateString(isVi ? 'vi-VN' : 'en-US');
}

export default function FamilyFeedCard({ feed = [], language = 'vi' }) {
  const isVi = language === 'vi';
  const urgent = feed.filter(f => f.type === 'EMERGENCY' || f.type === 'SAFETY_CRITICAL');

  return (
    <div className="liquid-card" style={{ padding: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity color="var(--coral-main)" /> {isVi ? 'Ba mẹ đang thế nào' : 'Family Activity Feed'}
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-sub)' }}>
            {isVi ? 'Cập nhật ngay khi ba mẹ thao tác trên điện thoại — không cần tải lại trang.' : 'Real-time updates from parent mobile device — no reload needed.'}
          </p>
        </div>
        {urgent.length > 0 && (
          <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 99, background: '#DC2626', color: '#FFF' }}>
            {isVi ? `${urgent.length} cảnh báo cần xem` : `${urgent.length} alerts require attention`}
          </span>
        )}
      </div>

      {feed.length === 0 ? (
        <div style={{ padding: 18, borderRadius: 16, background: 'rgba(241,245,249,0.7)', fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>
          {isVi ? 'Chưa có hoạt động nào. Khi ba mẹ bấm "đã uống thuốc" hoặc báo triệu chứng, nó sẽ hiện ở đây ngay.' : 'No activity yet. Logs will appear here in real-time.'}
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
                      {isVi ? s.vi : s.en}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-dark)' }}>
                      {item.subject_name || (isVi ? 'Ba mẹ' : 'Parent')}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{when(item.at, isVi)}</span>
                  </div>

                  <div style={{ fontSize: 14, color: s.fg, fontWeight: 600, marginTop: 3, lineHeight: 1.5 }}>
                    {item.type === 'DOSE_TAKEN'
                      ? (isVi
                          ? `Đã uống ${item.med_name || 'thuốc'}${item.time_slot ? ` — cữ ${item.time_slot}` : ''}`
                          : `Took ${item.med_name || 'medication'}${item.time_slot ? ` — ${item.time_slot} slot` : ''}`)
                      : item.title}
                  </div>

                  {item.detail && (
                    <div style={{ fontSize: 13, color: 'var(--text-sub)', fontWeight: 500, marginTop: 3, lineHeight: 1.5 }}>
                      {item.detail}
                    </div>
                  )}

                  {item.rule_id && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 3 }}>
                      {isVi ? `Luật ${item.rule_id}` : `Rule ${item.rule_id}`}
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
