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
export default function EmptyHouseholdView({ onAdd, onLeave }) {
  return (
    <div style={{ maxWidth: 460, margin: '0 auto', textAlign: 'center', padding: '20px 4px' }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--coral-grad)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
        <Heart size={30} color="#FFF" fill="#FFF" />
      </div>

      <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 10 }}>
        Nhà mình còn trống
      </h2>
      <p style={{ fontSize: 15.5, color: 'var(--text-sub)', lineHeight: 1.6, marginBottom: 24 }}>
        Thêm người bạn đang chăm sóc — ba, mẹ, ông, hay bà.
        Sau đó chụp đơn thuốc là app dựng lịch nhắc giúp.
      </p>

      <button
        className="btn-primary"
        onClick={onAdd}
        style={{ width: '100%', padding: '16px', borderRadius: 15, fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}
      >
        <UserPlus size={19} /> Thêm người nhà
      </button>

      <button
        className="btn-secondary"
        onClick={onLeave}
        style={{ marginTop: 14, padding: '11px 18px', borderRadius: 12, fontSize: 13.5 }}
      >
        <LogOut size={15} /> Dùng nhà khác
      </button>
    </div>
  );
}
