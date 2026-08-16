/**
 * Dựng plate 16:9 cho video từ ảnh chụp app.
 *
 * Vì sao cần: ảnh chụp app Con là 16:10, app Ba Mẹ là dọc 390×844. Ghép thẳng
 * vào khung video 1920×1080 thì hoặc bị cắt mất nội dung, hoặc lòi hai dải đen
 * hai bên. Plate ở đây đặt ảnh app lên đúng nền của chính app — nền `#F5F7FB`
 * với ba khối mờ hồng đào / xanh / vàng — nên ghép vào là liền mạch.
 *
 *   node scripts/dung-plate-video.mjs <thư-mục-ảnh-nguồn> <thư-mục-ra>
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

const SRC = process.argv[2];
const OUT = process.argv[3];
mkdirSync(OUT, { recursive: true });

const b64 = f => readFileSync(`${SRC}/${f}`).toString('base64');

/** Nền của app, dựng lại bằng CSS đúng như `src/index.css` */
const BG = `
  background: #F5F7FB;
  position: relative; overflow: hidden;
`;
const BLOBS = `
  <div style="position:absolute;top:-15%;right:8%;width:55vw;height:55vw;
    background:radial-gradient(circle,rgba(255,183,161,0.45) 0%,rgba(245,247,251,0) 70%);
    filter:blur(70px)"></div>
  <div style="position:absolute;top:25%;left:-12%;width:50vw;height:50vw;
    background:radial-gradient(circle,rgba(186,230,253,0.40) 0%,rgba(245,247,251,0) 70%);
    filter:blur(80px)"></div>
  <div style="position:absolute;bottom:-12%;right:22%;width:45vw;height:45vw;
    background:radial-gradient(circle,rgba(253,230,138,0.40) 0%,rgba(245,247,251,0) 70%);
    filter:blur(75px)"></div>
`;

/** Một điện thoại ở giữa khung ngang — dùng cho các cảnh app Ba Mẹ */
const onePhone = (img, caption) => `
<div style="${BG}width:1920px;height:1080px;display:grid;place-items:center;
  font-family:'Be Vietnam Pro',-apple-system,sans-serif">
  ${BLOBS}
  <div style="position:relative;display:flex;align-items:center;gap:90px">
    <img src="data:image/png;base64,${img}"
      style="height:900px;border-radius:44px;
      box-shadow:0 40px 90px rgba(31,38,135,0.22), 0 0 0 10px #fff">
    ${caption ? `<div style="max-width:620px">
      <div style="font-size:56px;font-weight:800;color:#0F172A;line-height:1.2">${caption.title}</div>
      <div style="font-size:30px;font-weight:600;color:#475569;margin-top:20px;line-height:1.5">${caption.sub}</div>
    </div>` : ''}
  </div>
</div>`;

/** Hai điện thoại — cảnh "hai máy nối nhau" ở 0:50 */
const twoPhones = (a, b) => `
<div style="${BG}width:1920px;height:1080px;display:grid;place-items:center">
  ${BLOBS}
  <div style="position:relative;display:flex;align-items:center;gap:120px">
    <img src="data:image/png;base64,${a}" style="height:840px;border-radius:42px;
      box-shadow:0 40px 90px rgba(31,38,135,0.22), 0 0 0 10px #fff">
    <img src="data:image/png;base64,${b}" style="height:840px;border-radius:42px;
      box-shadow:0 40px 90px rgba(31,38,135,0.22), 0 0 0 10px #fff">
  </div>
</div>`;

/** Ảnh ngang (app Con) đặt gọn trong khung 16:9 */
const wide = (img) => `
<div style="${BG}width:1920px;height:1080px;display:grid;place-items:center">
  ${BLOBS}
  <img src="data:image/png;base64,${img}"
    style="position:relative;width:1660px;border-radius:20px;
    box-shadow:0 40px 90px rgba(31,38,135,0.20)">
</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

const plate = async (name, html) => {
  await page.setContent(
    `<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@600;800&display=swap" rel="stylesheet">
     <style>*{margin:0;padding:0;box-sizing:border-box}</style>${html}`,
    { waitUntil: 'networkidle' }
  );
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('✓', name);
};

await plate('plate-01-hom-nay', onePhone(b64('07-app-bame-hom-nay.png'), {
  title: 'Tới giờ uống thuốc',
  sub: 'Một nút. Chữ to. Ba mẹ bấm được mà không cần ai chỉ.'
}));

await plate('plate-02-man-nghe', onePhone(b64('11-app-bame-man-nghe.png'), {
  title: 'Không gõ được thì cứ nói',
  sub: 'Cháu Bi nghe tiếng Việt, trả lời theo đúng hồ sơ thuốc.'
}));

await plate('plate-03-hai-may', twoPhones(
  b64('07-app-bame-hom-nay.png'),
  b64('09-app-bame-chau-bi.png')
));

await plate('plate-04-app-con', wide(b64('02-app-con-tong-quan.png')));
await plate('plate-05-kieng-an', wide(b64('05-app-con-kieng-an.png')));

await browser.close();
console.log('Xong →', OUT);
