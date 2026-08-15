/**
 * Công tắc bật/tắt các bảng điều khiển chỉ dành cho người phát triển.
 *
 * Vì sao cần: bản live từng hiện "Hồ sơ C1–C4", "Golden Set AI Metric",
 * "Giả lập Thông báo", "Reset Demo" cho mọi người dùng. Một bác 70 tuổi mở app
 * ra không hiểu những chữ đó là gì, còn giám khảo thì nghĩ sản phẩm chưa xong.
 *
 * Bật bằng một trong hai cách:
 *   - chạy `npm run dev` (môi trường dev luôn bật)
 *   - thêm `?dev=1` vào URL — dùng khi cần quay video có các bảng này,
 *     hoặc khi cần xem số liệu benchmark trên bản đã deploy
 *
 * Đây KHÔNG phải hàng rào bảo mật. Nó chỉ giấu giao diện. Mọi quyền truy cập
 * dữ liệu vẫn do Firestore rules quyết định, không do cờ này.
 */

function hasDevQueryParam() {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('dev') === '1';
  } catch {
    return false;
  }
}

export const showDevTools = import.meta.env.DEV || hasDevQueryParam();
