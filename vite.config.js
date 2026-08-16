import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

/**
 * Chạy `npm run dev`      → http://<IP-LAN>:3000  (đủ để xem giao diện trên iPhone)
 * Chạy `npm run dev:https`→ https://<IP-LAN>:3000 (cần cho mic / nhận diện giọng nói)
 *
 * Vì sao cần HTTPS: Safari chỉ cho dùng micro và Web Speech API trong
 * "secure context". Mở bằng http://192.168.x.x thì nút mic của Cháu Bi sẽ
 * không hoạt động, còn nhập chữ thì vẫn bình thường. Xem doc 34.
 */
const useHttps = process.env.VITE_HTTPS === 'true';

export default defineConfig({
  plugins: [react(), ...(useHttps ? [basicSsl()] : [])],
  server: {
    port: 3000,
    // host: true → lắng nghe trên mọi card mạng, để iPhone cùng Wi-Fi vào được
    host: true,
    open: !process.env.CI,

    /**
     * Chuyển tiếp /api sang backend đã deploy.
     *
     * Không có khối này thì `npm run dev` KHÔNG gọi được backend: apiClient
     * gọi đường dẫn tương đối `/api/*`, mà máy chủ dev chỉ phục vụ file tĩnh
     * nên mọi lời gọi trả về trang index rồi vỡ ở bước đọc JSON. Hậu quả là
     * không thể bấm thử tại máy các luồng cần backend — tạo nhà, mã mời, quét
     * đơn, giọng đọc — đúng những luồng doc 48 mục 5 ghi là chưa ai thử.
     *
     * Trỏ vào Hosting chứ không trỏ thẳng Cloud Run: route mount dưới `/api/*`
     * qua rewrite của Hosting, gọi thẳng Cloud Run ra 404 (doc 48 mục 7).
     *
     * Đặt VITE_API_BASE nếu muốn trỏ đi chỗ khác — biến đó thắng khối này.
     */
    proxy: {
      '/api': {
        target: 'https://ai-riser-namdosan-fa737.web.app',
        changeOrigin: true,
        secure: true
      }
    }
  },
  preview: {
    port: 4173,
    host: true
  }
});
