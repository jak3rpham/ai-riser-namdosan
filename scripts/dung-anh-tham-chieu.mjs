import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

const shot = async (name, html) => {
  await page.setContent(
    `<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@600;700;800&display=swap" rel="stylesheet">
     <style>*{margin:0;padding:0;box-sizing:border-box;font-family:'Be Vietnam Pro',sans-serif}</style>${html}`,
    { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('✓', name);
};

const sw = (hex, ten, vai) => `
  <div style="display:flex;flex-direction:column;gap:14px">
    <div style="width:210px;height:210px;border-radius:26px;background:${hex};
      box-shadow:0 18px 40px rgba(31,38,135,0.12)"></div>
    <div>
      <div style="font-size:26px;font-weight:800;color:#0F172A">${ten}</div>
      <div style="font-size:21px;font-weight:600;color:#475569">${hex}</div>
      <div style="font-size:19px;font-weight:600;color:#64748B;margin-top:2px">${vai}</div>
    </div>
  </div>`;

await shot('bang-mau', `
<div style="width:1920px;height:1080px;background:#F5F7FB;padding:80px 90px">
  <div style="font-size:52px;font-weight:800;color:#0F172A">Nhà Mình — bảng màu & chất liệu</div>
  <div style="font-size:26px;font-weight:600;color:#475569;margin-top:10px">
    Mọi asset phải nằm trong bảng này. Lệch màu là ghép vào thấy ngay.
  </div>

  <div style="display:flex;gap:44px;margin-top:56px">
    ${sw('linear-gradient(135deg,#FF6B4B 0%,#FF8E53 100%)', 'Cam chủ đạo', 'hành động, quan tâm')}
    ${sw('#F5F7FB', 'Nền', 'nền toàn app')}
    ${sw('#0F172A', 'Chữ đậm', 'tiêu đề')}
    ${sw('#059669', 'Xanh lá', 'an toàn, đã xong')}
    ${sw('#D97706', 'Vàng', 'cảnh báo')}
    ${sw('#DC2626', 'Đỏ', 'cấp cứu, 115')}
  </div>

  <div style="display:flex;gap:44px;margin-top:64px;align-items:center">
    <div style="width:420px;height:200px;border-radius:26px;
      background:rgba(255,255,255,0.65);backdrop-filter:blur(24px);
      border:1px solid rgba(255,255,255,0.85);
      box-shadow:0 12px 32px rgba(31,38,135,0.07);display:grid;place-items:center;
      font-size:24px;font-weight:700;color:#475569">thẻ kính mờ · bo góc 26</div>
    <div style="font-size:24px;font-weight:600;color:#475569;line-height:1.7">
      Chất liệu: kính mờ, viền trắng 85%, bóng đổ mềm.<br>
      Nền có ba khối mờ hồng đào / xanh da trời / vàng nhạt, blur 70–80px.<br>
      Bo góc: 12 · 16 · 20 · 26 px. Nút tròn: 99px.<br>
      Chữ: Be Vietnam Pro (tiêu đề) · Plus Jakarta Sans (thân bài).
    </div>
  </div>
</div>`);

await shot('icon-app', `
<div style="width:1920px;height:1080px;background:#F5F7FB;display:grid;place-items:center">
  <div style="text-align:center">
    <div style="width:340px;height:340px;border-radius:112px;margin:0 auto;
      background:linear-gradient(135deg,#FF6B4B 0%,#FF8E53 100%);
      display:grid;place-items:center;
      box-shadow:0 40px 90px rgba(255,107,75,0.35)">
      <svg width="180" height="180" viewBox="0 0 24 24" fill="#fff">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </div>
    <div style="font-size:88px;font-weight:800;color:#0F172A;margin-top:48px;letter-spacing:-2px">Nhà Mình</div>
    <div style="font-size:32px;font-weight:600;color:#475569;margin-top:12px">
      Để cả nhà uống thuốc đúng giờ, đúng liều
    </div>
  </div>
</div>`);

await browser.close();
