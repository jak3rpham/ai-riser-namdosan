/**
 * Chụp giao diện thật, làm ảnh tham chiếu cho AI sinh ảnh.
 *
 * Tự dựng một nhà mới ngay trong phiên chụp thay vì mượn nhà có sẵn: mỗi hồ sơ
 * trình duyệt mới là một uid ẩn danh mới, mà tư cách thành viên gắn theo uid —
 * đặt sẵn id nhà vào localStorage là vô ích, app sẽ hỏi lại từ đầu.
 *
 * Không dùng tài khoản demo vì mật khẩu vừa được đổi, và tôi không giữ mật khẩu.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const LOCAL = 'http://localhost:3000';
const LIVE = 'https://ai-riser-namdosan-fa737.web.app';
const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const snap = async (name) => {
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('✓', name);
};
const phone = () => page.setViewportSize({ width: 390, height: 844 });
const desk = () => page.setViewportSize({ width: 1440, height: 900 });
const go = (u) => page.goto(u, { waitUntil: u.startsWith(LOCAL) ? 'domcontentloaded' : 'networkidle' });

try {
  await go(LIVE + '/');
  await snap('01-trang-chao');

  // ── Dựng nhà ──
  await go(LOCAL + '/app');
  await page.waitForSelector('text=Tạo nhà mới', { timeout: 60000 });
  await page.click('button:has-text("Tạo nhà mới")');
  await page.waitForSelector('input', { timeout: 20000 });
  await page.fill('input', 'Nhà mình');
  await page.click('button:has-text("Tạo nhà")');

  // ── Khai hồ sơ ──
  await page.waitForSelector('text=Thêm người nhà', { timeout: 60000 });
  await page.click('button:has-text("Thêm người nhà")');
  await page.waitForSelector('input[placeholder*="Ba Mười"]', { timeout: 20000 });
  await page.fill('input[placeholder*="Ba Mười"]', 'Ba Mười');
  await page.fill('input[placeholder="1958"]', '1958');
  await page.fill('input[placeholder*="Huyết áp cao"]', 'Huyết áp cao, Mỡ máu cao');
  await page.fill('input[placeholder="Penicillin"]', 'Penicillin');
  await page.click('button:has-text("Ba")');
  await page.click('button:has-text("Lưu")');
  await page.waitForSelector('.manager-nav-item', { timeout: 60000 });
  await page.waitForTimeout(2500);

  // ── Nhập một đơn thuốc để màn hình có nội dung thật ──
  await page.click('.manager-nav-item:has-text("Đơn thuốc")');
  await page.waitForSelector('button:has-text("Nhập tay")', { timeout: 30000 });
  await page.click('button:has-text("Nhập tay")');
  await page.waitForSelector('input[placeholder="Tên thuốc *"]', { timeout: 20000 });
  await page.fill('input[placeholder="Tên thuốc *"]', 'Amlodipine 5mg');
  await page.fill('input[placeholder="Hàm lượng"]', '5mg');
  await page.fill('input[placeholder*="Liều mỗi lần"]', 'Uống 1 viên');
  await page.fill('input[placeholder="Số lần/ngày"]', '1 lần/ngày');
  await page.selectOption('select', 'Sáng (sau ăn)');
  await page.fill('input[placeholder="Số ngày *"]', '30');
  await page.click('button:has-text("Xác nhận")');
  await page.waitForSelector('text=Đã lưu đơn thuốc', { timeout: 60000 });
  await page.waitForTimeout(2000);

  // ── App Con ──
  await page.click('.manager-nav-item:has-text("Tổng quan")');
  await snap('02-app-con-tong-quan');

  await page.click('.manager-nav-item:has-text("Đơn thuốc")');
  await page.waitForTimeout(1800);
  await snap('03-app-con-don-thuoc');

  await page.click('.manager-nav-item:has-text("Chỉ số")');
  await page.waitForTimeout(1800);
  await snap('04-app-con-chi-so');

  await page.click('.manager-nav-item:has-text("Kiêng ăn")');
  await page.waitForTimeout(1800);
  await snap('05-app-con-kieng-an');

  // ── App Ba Mẹ ──
  await phone();
  await go(LOCAL + '/parent');
  // App Ba Mẹ hỏi "trong nhà mình bác là ai" trước khi cho vào — chờ MÀN ĐÓ,
  // không chờ thẳng màn Hôm nay.
  await page.waitForSelector('text=bác là ai', { timeout: 60000 });
  await page.waitForTimeout(2000);
  await snap('06-app-bame-toi-la-ai');

  await page.click('button:has-text("Ba Mười")');
  await page.waitForSelector('text=Hôm nay', { timeout: 60000 });
  await page.waitForTimeout(4000);
  await snap('07-app-bame-hom-nay');

  await page.click('button:has-text("Tủ thuốc")');
  await snap('08-app-bame-tu-thuoc');

  await page.click('button:has-text("Hỏi cháu")');
  await snap('09-app-bame-chau-bi');

  await page.click('button:has-text("Tôi")');
  await snap('10-app-bame-ho-so');

  await page.click('button:has-text("Hỏi cháu")');
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Bấm vào đây rồi nói")');
  await page.waitForTimeout(2500);
  await snap('11-app-bame-man-nghe');

  // ── Hai màn hình cạnh nhau ──
  await desk();
  await go(LIVE + '/?demo=1');
  await page.waitForTimeout(4500);
  await snap('12-hai-man-hinh');
} catch (err) {
  console.error('LỖI:', err.message.split('\n')[0]);
  await page.screenshot({ path: `${OUT}/_loi.png` });
}

await browser.close();
console.log('Xong →', OUT);
