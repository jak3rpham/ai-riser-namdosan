import React from 'react';
import { Info } from 'lucide-react';

/**
 * Disclaimer y tế thường trực — doc 27-Risk-Register.md R10 & E1.
 * Trước đây toàn app không có một dòng disclaimer nào (doc 33 mục 11).
 *
 * variant:
 *   'bar'    — thanh cố định cuối màn hình
 *   'inline' — chèn dưới một khối cảnh báo cụ thể
 *   'compact'— một dòng nhỏ trong modal
 */
export default function MedicalDisclaimer({ variant = 'inline', language = 'vi' }) {
  const text = language === 'en'
    ? 'This app helps organise and understand medication information. It does not diagnose, does not prescribe, and does not replace your doctor or pharmacist. In an emergency, call 115.'
    : 'App giúp sắp xếp và hiểu thông tin thuốc. App không chẩn đoán bệnh, không kê đơn, và không thay thế bác sĩ hay dược sĩ. Trường hợp khẩn cấp, gọi 115.';

  if (variant === 'compact') {
    return (
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.5, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        <Info size={13} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>{text}</span>
      </div>
    );
  }

  if (variant === 'bar') {
    return (
      <div style={{ marginTop: 32, padding: '14px 20px', borderRadius: 16, background: 'rgba(241,245,249,0.85)', border: '1px solid var(--glass-border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Info size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 13, color: 'var(--text-sub)', fontWeight: 600, lineHeight: 1.6 }}>{text}</span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.7)', border: '1px solid var(--glass-border)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <Info size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.55 }}>{text}</span>
    </div>
  );
}
