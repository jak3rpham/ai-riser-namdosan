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
    open: !process.env.CI
  },
  preview: {
    port: 4173,
    host: true
  }
});
