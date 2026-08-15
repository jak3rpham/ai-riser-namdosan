/**
 * Định vị người dùng phía trình duyệt.
 *
 * ─────────────────────────────────────────────────────────────────
 * TẠI SAO FILE NÀY KHÔNG CÒN GỌI GOOGLE PLACES
 *
 * Bản trước gọi thẳng `places.googleapis.com` từ trình duyệt bằng
 * `VITE_GOOGLE_MAPS_API_KEY`. Hai vấn đề:
 *
 *   1. Khoá nằm trong bundle → ai mở F12 cũng đọc được và gọi bằng tiền của
 *      chủ project. Không có trần chi phí nào chặn được.
 *   2. Không dùng được ở Việt Nam. Google Maps Platform chặn billing account
 *      đăng ký bằng thẻ/giấy tờ VN, nên Places API không bao giờ bật lên được
 *      từ một project VN — kể cả khi đã bật thanh toán.
 *
 * Việc tìm cơ sở y tế giờ nằm hoàn toàn ở backend
 * (`server/src/routes/places.js`), dùng OpenStreetMap qua Overpass API:
 * miễn phí, không cần khoá, không bị chặn ở VN. Frontend gọi
 * `apiPost('/places/nearby', …)`.
 *
 * File này chỉ còn giữ một việc mà trình duyệt bắt buộc phải làm: lấy toạ độ.
 */

/**
 * Lấy vị trí hiện tại của người dùng.
 *
 * ⚠️ `navigator.geolocation` chỉ chạy trong secure context. Mở app bằng
 * http://192.168.x.x trên iPhone sẽ KHÔNG lấy được vị trí — phải dùng
 * `npm run dev:https` hoặc bản đã deploy (doc 34 mục 1–2).
 */
export function getCurrentPosition({ timeout = 10000 } = {}) {
  return new Promise(resolve => {
    if (!('geolocation' in navigator)) {
      resolve({
        ok: false,
        error_code: 'NO_GEOLOCATION',
        error_message: 'Máy này không hỗ trợ định vị nên chưa tìm được nhà thuốc gần bác.'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        ok: true,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      }),
      err => {
        const map = {
          1: 'Bác chưa cho phép xem vị trí. Bật lại trong cài đặt rồi thử lại nhé.',
          2: 'Chưa xác định được chỗ bác đang đứng. Bác kiểm tra GPS hoặc mạng giúp con.',
          3: 'Tìm vị trí hơi lâu. Bác thử lại giúp con nhé.'
        };
        resolve({
          ok: false,
          error_code: `GEOLOCATION_${err.code}`,
          error_message: map[err.code] || 'Chưa lấy được vị trí của bác.',
          // Nguyên nhân hay gặp nhất mà thông báo của trình duyệt không nói rõ
          hint: window.location.protocol === 'http:' && window.location.hostname !== 'localhost'
            ? 'Trang đang chạy qua http nên trình duyệt chặn định vị. Dùng https giúp nhé.'
            : null
        });
      },
      { enableHighAccuracy: true, timeout, maximumAge: 60000 }
    );
  });
}
