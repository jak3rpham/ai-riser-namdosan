import React from 'react';
import { UserPlus, LogOut, Heart } from 'lucide-react';

/**
 * Nhà đã tạo nhưng chưa khai báo ai.
 *
 * Trước đây trạng thái này trả về đúng một dòng chữ "Chưa có hồ sơ nào trong
 * nhà." rồi hết — không có nút nào, không có lối đi tiếp. Người dùng đứng
 * trước một câu thông báo và không biết làm gì.
 *
 * Ở đây chỉ có một việc để làm, nên chỉ có một nút to.
 */
export default function EmptyHouseholdView({ onAdd, onLeave, variant = 'manager', language = 'vi' }) {
  const isVi = language === 'vi';
  const parent = variant === 'parent';
  const copy = parent
    ? {
        title: isVi ? 'Chưa có hồ sơ nào' : 'No profile found',
        body: isVi
          ? 'Bác khai giúp con vài dòng về bác — tên, năm sinh, thuốc đang uống. Xong rồi chụp đơn thuốc là con dựng lịch nhắc cho bác.'
          : 'Please create your profile — name, birth year, current conditions. Then scan your prescription to set reminders.',
        cta: isVi ? 'Khai hồ sơ của bác' : 'Create My Profile'
      }
    : {
        title: isVi ? 'Nhà mình còn trống' : 'Household is empty',
        body: isVi
          ? 'Thêm người bạn đang chăm sóc — ba, mẹ, ông, hay bà. Sau đó chụp đơn thuốc là app dựng lịch nhắc giúp.'
          : 'Add a family member you are caring for — parents, grandparents. Then scan prescriptions to automate schedule.',
        cta: isVi ? 'Thêm người nhà' : 'Add Family Member'
      };

  return (
    <div style={{ maxWidth: 460, margin: '0 auto', textAlign: 'center', padding: '20px 4px' }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--coral-grad)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
        <Heart size={30} color="#FFF" fill="#FFF" />
      </div>

      <h2 style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 10 }}>
        {copy.title}
      </h2>
      <p style={{ fontSize: 16, color: 'var(--text-sub)', lineHeight: 1.6, marginBottom: 24 }}>
        {copy.body}
      </p>

      <button
        className="btn-primary"
        onClick={onAdd}
        style={{ width: '100%', padding: '16px', borderRadius: 16, fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}
      >
        <UserPlus size={19} /> {copy.cta}
      </button>

      <button
        className="btn-secondary"
        onClick={onLeave}
        style={{ marginTop: 14, padding: '11px 18px', borderRadius: 12, fontSize: 14 }}
      >
        <LogOut size={15} /> {isVi ? 'Dùng nhà khác' : 'Switch Household'}
      </button>
    </div>
  );
}
