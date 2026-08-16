/**
 * Xưng hô — Cháu Bi nói với ai thì đổi cách xưng theo người đó.
 *
 * ═══════════════════════════════════════════════════════════════════
 *  VÌ SAO CẦN FILE NÀY
 *
 *  App phục vụ CẢ NHÀ, không riêng ba mẹ. Con cái 30 tuổi cũng hỏi triệu
 *  chứng, cũng quét đơn thuốc của mình. Mà toàn bộ câu chữ trong app đang
 *  xưng "con" gọi "bác" — 30 tuổi bị gọi "bác" là hỏng tone ngay câu đầu,
 *  và hỏng luôn cảm giác app này làm cho mình.
 *
 *  Cách làm: câu chữ viết bằng THẺ, không viết cứng đại từ. Lúc hiện lên
 *  màn hình mới thay thẻ theo hồ sơ người đang nghe.
 *
 *  ⚠️ Cái KHÔNG đổi: tên "Cháu Bi" và giọng ấm áp kiểu người nhà. Đó là
 *  bản sắc sản phẩm (CLAUDE.md rule 7), không phải đại từ. "Bi" vẫn là
 *  tên gọi, dù đang nói với bác 70 hay bạn 25.
 * ═══════════════════════════════════════════════════════════════════
 *
 * THẺ DÙNG ĐƯỢC:
 *   {{Me}} / {{me}}    Cháu Bi tự xưng          con / mình
 *   {{You}} / {{you}}  gọi người nghe           bác / bạn
 *   {{a}}              tiểu từ lễ phép cuối câu  ạ / (bỏ)
 *   {{nha}}            tiểu từ thân mật cuối câu nha / nhé
 *   {{Da}}             mở đầu câu                Dạ / (bỏ)
 *   {{XUNG_HO}}        tên thật — thay ở nơi khác, file này không đụng tới
 */

/** Tuổi từ đây trở lên thì xưng con–bác. Dưới thì xưng mình–bạn. */
const ELDER_AGE = 60;

/**
 * ⚠️ `a` mang sẵn khoảng trắng đầu ("&nbsp;ạ"), `Da` không.
 *
 * Lý do: câu mẫu viết {{a}} DÍNH vào chữ trước — "ngay{{a}}." — để register
 * `peer` (bỏ trống) không để lại khoảng trắng thừa trước dấu chấm. Nếu elder
 * trả về "ạ" trần thì ra "ngayạ.". Khoảng trắng nằm trong giá trị, `tidy()`
 * dồn lại sau.
 */
export const REGISTERS = {
  /** Ba mẹ, ông bà — giọng gốc của app */
  elder: { id: 'elder', Me: 'Con', me: 'con', You: 'Bác', you: 'bác', a: ' ạ', nha: 'nha', Da: 'Dạ' },

  /**
   * Con cái, người trẻ. Dùng "bạn" chứ không "anh/chị" vì "anh/chị" đoán sai
   * giới tính là xúc phạm, mà hồ sơ không bắt buộc khai giới tính.
   * Bỏ hẳn "ạ": người ngang hàng nghe "ạ" thấy khách sáo, xa cách.
   */
  peer: { id: 'peer', Me: 'Mình', me: 'mình', You: 'Bạn', you: 'bạn', a: '', nha: 'nhé', Da: '' }
};

/**
 * Chọn cách xưng hô cho một hồ sơ.
 *
 * Thứ tự: khai báo tay > suy từ năm sinh > mặc định elder.
 * Mặc định là elder có chủ ý: gọi một người trẻ là "bác" thì buồn cười,
 * nhưng gọi một người già là "bạn" thì mất lịch sự — sai về phía lễ phép
 * là sai nhẹ hơn.
 */
export function registerFor(profile = {}) {
  if (profile?.address_style && REGISTERS[profile.address_style]) {
    return REGISTERS[profile.address_style];
  }
  const year = Number(profile?.birth_year);
  if (Number.isFinite(year) && year > 1900) {
    const age = new Date().getFullYear() - year;
    return age >= ELDER_AGE ? REGISTERS.elder : REGISTERS.peer;
  }
  return REGISTERS.elder;
}

const TOKEN = /\{\{\s*(Me|me|You|you|a|nha|Da)\s*\}\}/g;

/**
 * Thay thẻ trong một câu.
 *
 * Nhận cả hồ sơ lẫn register để chỗ gọi khỏi phải nhớ gọi registerFor trước.
 */
export function speak(text, profileOrRegister = {}) {
  if (!text) return text;

  const r = profileOrRegister?.id && REGISTERS[profileOrRegister.id]
    ? profileOrRegister
    : registerFor(profileOrRegister);

  const out = String(text).replace(TOKEN, (_, key) => r[key] ?? '');
  return tidy(out);
}

/**
 * Dọn vết thẻ rỗng.
 *
 * Register `peer` bỏ trống {{Da}} và {{a}}, nên "{{Da}} {{me}} ghi lại rồi{{a}}."
 * ra thành " mình ghi lại rồi." — thừa khoảng trắng đầu câu và chữ thường.
 * Không dọn thì lỗi này rơi thẳng vào câu cảnh báo cấp cứu.
 */
function tidy(s) {
  let out = s
    .replace(/[ \t]+/g, ' ')          // khoảng trắng dồn
    .replace(/[ \t]+([,.!?;:])/g, '$1') // khoảng trắng trước dấu câu
    .replace(/^[ \t]+/gm, '')
    .trim();

  // Viết hoa chữ cái đầu — cần khi {{Da}} bị bỏ trống
  out = out.replace(/^([^\p{L}]*)(\p{L})/u, (_, lead, ch) => lead + ch.toUpperCase());
  return out;
}

/**
 * Mô tả cách xưng hô cho prompt phía server.
 * Server không import file này (khác package), nên frontend gửi kèm lên.
 */
export function registerBrief(profileOrRegister = {}) {
  const r = profileOrRegister?.id && REGISTERS[profileOrRegister.id]
    ? profileOrRegister
    : registerFor(profileOrRegister);
  return r.id;
}
