import React from 'react';
import { Heart, LayoutGrid, Smartphone, ArrowRight } from 'lucide-react';
import MedicalDisclaimer from './MedicalDisclaimer';

/**
 * Trang chào — chọn vai.
 *
 * Thay cho thanh chuyển "Xem 2 màn hình · Web con gái · App ba mẹ" cũ. Cái đó
 * là công cụ trình diễn, không phải sản phẩm: người dùng thật không bao giờ
 * cần thấy cả hai giao diện cùng lúc (doc 37 mục 1).
 *
 * Chưa có tài khoản thật nên vai lưu tạm ở máy. Khi có đăng nhập thì vai lấy
 * từ `households/{id}/grants/{uid}` (doc 39 mục 2).
 */
export default function LandingView({ onChoose }) {
  const cards = [
    {
      role: 'manager',
      to: '/app',
      icon: LayoutGrid,
      title: 'Tôi chăm sóc ba mẹ',
      subtitle: 'Bản web cho con cái',
      lines: [
        'Chụp đơn thuốc, kiểm tra an toàn, đặt lịch nhắc',
        'Theo dõi ba mẹ đã uống thuốc chưa',
        'Kết nối Google Calendar'
      ],
      accent: 'var(--coral-main)',
      soft: 'var(--coral-soft)',
      border: 'var(--coral-border)'
    },
    {
      role: 'parent',
      to: '/parent',
      icon: Smartphone,
      title: 'Tôi tự dùng thuốc',
      subtitle: 'Bản dành cho ba mẹ',
      lines: [
        'Nút to, chữ lớn, ít bước',
        'Nhắc tới giờ uống thuốc',
        'Hỏi "Cháu Bi" bất cứ lúc nào'
      ],
      accent: 'var(--sky-blue)',
      soft: 'var(--sky-soft)',
      border: 'rgba(2,132,199,0.25)'
    }
  ];

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 60, height: 60, borderRadius: 20, background: 'var(--coral-grad)', display: 'grid', placeItems: 'center', color: '#FFF', margin: '0 auto 14px', boxShadow: '0 10px 26px var(--coral-glow)' }}>
          <Heart size={30} fill="#FFF" />
        </div>
        <h1 style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 32, fontWeight: 800, letterSpacing: '-0.6px', color: 'var(--text-dark)' }}>
          Nhà Mình
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-sub)', marginTop: 6, maxWidth: 460, lineHeight: 1.6 }}>
          Giúp cả nhà uống thuốc đúng giờ, đúng liều — và biết khi nào cần đi khám.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, width: '100%', maxWidth: 760 }}>
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <button
              key={c.role}
              onClick={() => onChoose(c.role, c.to)}
              className="liquid-card"
              style={{
                padding: 26, textAlign: 'left', cursor: 'pointer', border: `1.5px solid ${c.border}`,
                background: 'rgba(255,255,255,0.75)', display: 'flex', flexDirection: 'column', gap: 12,
                fontFamily: 'inherit'
              }}
            >
              <div style={{ width: 46, height: 46, borderRadius: 16, background: c.soft, color: c.accent, display: 'grid', placeItems: 'center' }}>
                <Icon size={24} />
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: c.accent, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {c.subtitle}
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)', marginTop: 2 }}>{c.title}</h2>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7, margin: 0, padding: 0 }}>
                {c.lines.map((l, i) => (
                  <li key={i} style={{ fontSize: 14, color: 'var(--text-sub)', fontWeight: 600, display: 'flex', gap: 8, lineHeight: 1.5 }}>
                    <span style={{ color: c.accent }}>·</span> {l}
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', alignItems: 'center', gap: 6, color: c.accent, fontWeight: 800, fontSize: 14 }}>
                Vào đây <ArrowRight size={17} />
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 26, maxWidth: 620 }}>
        <MedicalDisclaimer variant="bar" />
      </div>

      <a
        href="/?demo=1"
        style={{ marginTop: 18, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textDecoration: 'none' }}
      >
        Chế độ xem 2 màn hình →
      </a>
    </div>
  );
}
