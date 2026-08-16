import React, { useEffect, useRef } from 'react';
import { LayoutGrid, Pill, Activity, CalendarClock, Utensils, Users } from 'lucide-react';

/**
 * Thanh điều hướng của app Con.
 *
 * ═══════════════════════════════════════════════════════════════════
 *  VÌ SAO CẦN
 *
 *  App Con trước đây là MỘT trang cuộn dài: thanh tiêu đề, trạng thái nhà,
 *  panel Google, rồi một cột dọc gồm chọn người → quét đơn → ba ô thống kê →
 *  cảnh báo an toàn → dòng sự kiện → kiêng ăn → tái khám → chỉ số → tủ thuốc.
 *
 *  Ba hậu quả:
 *   1. Không có chỗ nào cho biết "mình đang ở đâu" và "app này có gì".
 *   2. Vài việc chỉ vào được bằng cách cuộn xuống đúng chỗ — nhập chỉ số huyết
 *      áp nằm dưới sáu khối khác.
 *   3. Giám khảo xem 90 giây thì thấy một trang dài, không thấy phạm vi sản
 *      phẩm. Danh sách mục là thứ kể được câu chuyện đó ngay trong một hình.
 *
 *  Chọn thanh bên chứ không phải tab ngang: sáu mục thì tab ngang trên laptop
 *  đã chật, mà tên mục viết tắt lại thì mất luôn tác dụng "app này có gì".
 * ═══════════════════════════════════════════════════════════════════
 *
 * Người đang xem để NGAY TRÊN ĐẦU thanh, không nằm trong một mục nào — mọi
 * con số ở mọi mục đều là của người đó, nên nó là ngữ cảnh chứ không phải một
 * trang. Trước đây nó nằm lẫn trong thẻ đầu tiên của phần nội dung, cuộn xuống
 * là mất, và không còn gì nhắc đang xem hồ sơ của ai.
 */

export const MANAGER_SECTIONS = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutGrid, hint: 'Tuân thủ và cảnh báo' },
  { id: 'prescriptions', label: 'Đơn thuốc', icon: Pill, hint: 'Quét đơn, tủ thuốc' },
  { id: 'vitals', label: 'Chỉ số sức khoẻ', icon: Activity, hint: 'Huyết áp, đường huyết' },
  { id: 'appointments', label: 'Lịch tái khám', icon: CalendarClock, hint: 'Hẹn khám, xét nghiệm' },
  { id: 'food', label: 'Kiêng ăn', icon: Utensils, hint: 'Món cần tránh theo đơn' },
  { id: 'household', label: 'Nhà mình', icon: Users, hint: 'Người nhà, mã mời, Google' }
];

export default function ManagerSidebar({
  section,
  onSelect,
  members = [],
  selectedMember,
  onSelectMember,
  badges = {}
}) {
  /**
   * Kéo mục đang mở vào tầm nhìn.
   *
   * Chỉ có tác dụng ở khổ hẹp, nơi danh sách mục xẹp thành dải cuộn ngang: mục
   * thứ tư trở đi nằm ngoài màn hình, nên bấm vào "Chỉ số sức khoẻ" xong là
   * tiêu đề đổi mà cái chip đang sáng thì không nhìn thấy — mất luôn dấu hiệu
   * "mình đang ở đâu", đúng thứ thanh này sinh ra để giải quyết.
   */
  const listRef = useRef(null);
  useEffect(() => {
    const list = listRef.current;
    if (!list || list.scrollWidth <= list.clientWidth) return;   // khổ rộng: thanh dọc, không cuộn

    const el = list.querySelector('.manager-nav-item.active');
    if (!el) return;

    // Tự tính thay vì dùng scrollIntoView: hàm đó chọn phần tử cuộn gần nhất
    // theo cách riêng của nó, và ở đây nó bỏ qua dải chip để đi cuộn cả trang —
    // scrollLeft của dải vẫn nằm im ở 0.
    //
    // Tìm nút bằng querySelector chứ không giữ ref trên chính nút: ref gắn theo
    // điều kiện (`ref={active ? r : null}`) đọc ra null ngay trong effect, vì
    // React gỡ ref khỏi nút cũ và gắn vào nút mới trong cùng một lần commit.
    //
    // Cuộn tức thì, KHÔNG `behavior: 'smooth'`. Cuộn mượt ở đây bị huỷ giữa
    // chừng — component render lại thêm mấy lần ngay sau khi đổi mục, và
    // scrollLeft nằm im ở 0. Mà nội dung bên phải cũng đổi tức thì, nên chạy
    // animation cho riêng cái chip cũng chẳng khớp với gì.
    const left = el.offsetLeft - list.offsetLeft - (list.clientWidth - el.offsetWidth) / 2;
    list.scrollLeft = Math.max(0, left);
  }, [section]);

  return (
    <nav className="manager-nav" aria-label="Điều hướng chính">
      {/* ── Đang xem hồ sơ của ai ── */}
      <div className="manager-nav-people">
        <span className="manager-nav-eyebrow">Đang xem hồ sơ</span>
        <div className="manager-nav-chips">
          {members.map(m => {
            const active = selectedMember?.id === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectMember(m)}
                aria-current={active ? 'true' : undefined}
                className={`manager-person ${active ? 'active' : ''}`}
              >
                <span
                  className="manager-person-avatar"
                  style={{ background: m.avatar_color || 'var(--coral-grad)' }}
                >
                  {(m.display_name || '?').trim().charAt(0).toUpperCase()}
                </span>
                <span className="manager-person-name">
                  {m.display_name}
                  {m.relation && <span className="manager-person-rel">{m.relation}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Các mục ── */}
      <ul className="manager-nav-list" ref={listRef}>
        {MANAGER_SECTIONS.map(({ id, label, icon: Icon, hint }) => {
          const active = section === id;
          const badge = badges[id];
          return (
            <li key={id}>
              <button
                onClick={() => onSelect(id)}
                aria-current={active ? 'page' : undefined}
                className={`manager-nav-item ${active ? 'active' : ''}`}
              >
                <Icon size={18} className="manager-nav-icon" />
                <span className="manager-nav-text">
                  <span className="manager-nav-label">{label}</span>
                  <span className="manager-nav-hint">{hint}</span>
                </span>
                {badge > 0 && <span className="manager-nav-badge">{badge}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
