import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Cấu hình Firebase — lấy hoàn toàn từ biến môi trường.
 *
 * ⚠️ Bản trước có giá trị dự phòng bịa sẵn ("AIzaSyDemoKeyForAIRiserNamDoSan2026")
 * và các trường hardcode. Hậu quả: `.env` sai hoặc thiếu thì app vẫn khởi động
 * bằng cấu hình giả rồi hỏng ở chỗ khác, rất khó lần ra. Giờ thiếu cấu hình là
 * báo lỗi ngay tại đây — cùng nguyên tắc "thất bại thì báo thất bại" ở doc 35.
 *
 * Sáu giá trị này KHÔNG phải bí mật. Chúng là định danh công khai, nằm sẵn
 * trong bundle mà ai cũng đọc được. Thứ bảo vệ dữ liệu là Firestore Rules
 * và Authorized domains (doc 36 mục 10).
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const REQUIRED = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missing = REQUIRED.filter(k => !firebaseConfig[k]);

export const isFirebaseConfigured = missing.length === 0;

if (!isFirebaseConfigured) {
  console.error(
    `[Firebase] Thiếu cấu hình: ${missing.map(k => `VITE_FIREBASE_${k.replace(/[A-Z]/g, c => '_' + c).toUpperCase()}`).join(', ')}.\n` +
    'Kiểm tra file .env ở thư mục gốc, rồi KHỞI ĐỘNG LẠI dev server (sửa .env không tự nạp lại).'
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

/**
 * Analytics KHÔNG được khởi tạo ở đây.
 * Theo doc 38 mục 4, đây là app y tế nên analytics phải nằm sau màn xin đồng ý,
 * mặc định TẮT. Khi làm màn đó thì gọi `getAnalytics(app)` từ chỗ đó,
 * và chỉ gửi các sự kiện đã bỏ định danh trong doc 36 mục 11.
 */
export { app };
export default app;
