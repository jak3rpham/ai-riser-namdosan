/**
 * Bộ phân loại triệu chứng (Mức 3–4 của doc 31-Assistant-Conversations.md)
 *
 * ═══════════════════════════════════════════════════════════════════
 *  NGUYÊN TẮC KIẾN TRÚC: LLM KHÔNG ĐƯỢC RA QUYẾT ĐỊNH AN TOÀN.
 *
 *  Luồng:
 *    [1] Bộ hỏi cấu trúc      — deterministic, không dùng AI
 *    [2] Bảng red-flag tĩnh    — file này, phiên bản hoá, test được
 *    [3] Ba nhánh cố định      — EMERGENCY_115 / SEE_DOCTOR_24H / LOG_AND_NOTIFY
 *    [4] AI chỉ được gọi ở nhánh LOG_AND_NOTIFY, và CHỈ để diễn đạt lại
 *        quyết định đã có — không để nó chọn nhánh.
 *
 *  Lý do: hành vi an toàn phải TÁI LẬP ĐƯỢC và KIỂM THỬ ĐƯỢC. Nếu để mô hình
 *  quyết định, cùng một câu hỏi hôm nay chặn, mai không chặn.
 * ═══════════════════════════════════════════════════════════════════
 *
 * ⚠️ TRẠNG THÁI: bảng luật dưới đây CHƯA ĐƯỢC DƯỢC SĨ/BÁC SĨ RÀ.
 *    Nó được soạn theo hướng thận trọng (thà đẩy lên mức cao hơn còn hơn bỏ
 *    sót), nhưng thận trọng không thay được chuyên môn. Đây là hạng mục bắt
 *    buộc phải có người có chuyên môn duyệt trước khi mời người dùng thật.
 *    Xem doc 33-Medical-Safety-Audit.md mục 1 và doc 31 mục 7.
 */

import { normalizeText, resolveGenerics } from './medicalKnowledge';
import { speak } from './honorifics';

export const TRIAGE_RULES_STATUS = {
  version: '0.1.0',
  reviewed_by_clinician: false,
  last_updated: '2026-08-12'
};

/* ────────────────────────────────────────────────────────────────
 * A. Nhận diện: câu này có phải đang nói về triệu chứng không?
 *
 * Danh sách này KHÔNG dùng để quyết định cấp cứu. Nó chỉ để biết khi nào
 * cần CHUYỂN SANG bộ hỏi cấu trúc thay vì trả lời tự do.
 * Rộng tay ở đây là an toàn: bắt nhầm chỉ tốn thêm vài câu hỏi.
 * ──────────────────────────────────────────────────────────────── */
const SYMPTOM_LEXICON = [
  // đau
  'dau', 'nhuc', 'buot', 'tuc', 'nang nguc', 'quan that', 'am i',
  // hô hấp
  'kho tho', 'hut hoi', 'tho khong ra hoi', 'tho gap', 'tho nhanh', 'nghet tho', 'ho ra mau',
  // thần kinh
  'chong mat', 'xay xam', 'choang', 'ngat', 'bat tinh', 'te', 'yeu tay', 'yeu chan',
  'noi kho', 'noi do', 'meo mieng', 'mo mat', 'lu lan', 'co giat',
  // tiêu hoá
  'buon non', 'non', 'tieu chay', 'tao bon', 'day bung', 'chuong bung', 'phan den',
  // toàn thân
  'sot', 'lanh run', 'met', 'met moi', 'va mo hoi', 'sut can', 'chan an', 'kho ngu',
  // khác
  'chay mau', 'ra mau', 'sung', 'phat ban', 'ngua', 'noi me day', 'kho chiu', 'trong nguoi'
];

/**
 * ⚠️ Đã BỎ khỏi danh sách trên: 'rat' và 'oi'.
 *
 * `normalizeText` bỏ dấu, nên "rất" và "rát" cùng thành `rat`, "ơi"/"rồi"/"tôi"
 * cùng chứa `oi`. Hai token này biến câu tiếng Việt bình thường thành triệu chứng:
 *   "Thuốc này bác uống rất đều"        → NEEDS_INTAKE
 *   "Quên uống thuốc trưa rồi cháu ơi"  → NEEDS_INTAKE
 * Bác đang hỏi giờ uống thuốc thì bị lôi vào bộ hỏi "đau ở chỗ nào".
 *
 * Không vá được bằng ranh giới từ vì sau khi bỏ dấu chúng là CÙNG MỘT TỪ.
 * Phần nghĩa mất đi ("rát", "ói") do lớp phân loại Gemini ở
 * `/ai/classify-symptom` gánh — lớp đó đọc được dấu và đọc được ngữ cảnh.
 */

/**
 * Sau "đau đầu", những từ này biến nó thành bộ phận khác — "đầu gối",
 * "đầu ngón tay". Không phải đau đầu.
 */
const HEAD_FALSE_FRIENDS = ['goi', 'ngon', 'chan', 'tay', 'vai', 'mui', 'luoi'];

/**
 * Đưa câu về dạng ` tu tu tu ` để so khớp theo TỪ, không theo chuỗi con.
 *
 * Trước đây dùng `t.includes(phrase)` thẳng. Hậu quả nặng nhất không phải
 * mấy câu bắt nhầm ở trên, mà là: "đau đầu gối" chứa chuỗi "đau đầu", nên
 * ca té ngã đau GỐI bị đọc thành té ĐẬP ĐẦU và đẩy thẳng lên 115.
 */
function padded(t) {
  return ' ' + String(t).replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
}

const hasPhrase = (p, phrase) => p.includes(' ' + phrase + ' ');
const findPhrase = (p, list) => list.find(x => hasPhrase(p, x)) || null;

/** "đau đầu" thật sự, không phải "đau đầu gối" */
function hasHeadPain(p) {
  const re = new RegExp(` dau dau (?!(${HEAD_FALSE_FRIENDS.join('|')}) )`);
  return re.test(p) || / dau dau $/.test(p);
}

/** Dấu hiệu câu đang nói về QUÁ KHỨ hoặc PHỦ ĐỊNH → không tự động báo động */
const NEGATION_PAST_MARKERS = [
  'khong con', 'khong bi', 'khong dau', 'het roi', 'da het', 'do roi', 'da do',
  'hoi truoc', 'hoi do', 'nam ngoai', 'thang truoc', 'tuan truoc', 'truoc day',
  'chu gio', 'gio thi', 'may nam truoc', 'tung bi', 'da khoi', 'khoi roi'
];

/** Cụm nói rõ ràng đến mức chặn ngay, không cần hỏi thêm */
const IMMEDIATE_EMERGENCY_PHRASES = [
  'bat tinh', 'ngat xiu', 'ngat di', 'khong tho duoc', 'tho khong duoc',
  'non ra mau', 'oi ra mau', 'ho ra mau', 'di cau ra mau', 'phan den',
  'meo mieng', 'liet nua nguoi', 'te nua nguoi', 'yeu nua nguoi',
  'co giat', 'dau nguc du doi', 'chay mau khong cam duoc', 'cap cuu'
];

/**
 * Chấn thương — té, ngã, va đập.
 *
 * ⚠️ Tách riêng khỏi bộ hỏi triệu chứng thông thường vì bản trước xử lý sai
 * nguy hiểm: bác nói "mới bị té, đau đầu gối", app bỏ qua chữ "té", chạy bộ
 * hỏi đau khớp, rồi kết luận đau khớp là "tác dụng phụ thường gặp của thuốc
 * mỡ máu" và khuyên chườm ấm. Một cái gối vừa bị té có thể đang nứt xương.
 *
 * Té ở người lớn tuổi là dấu hiệu cần người xem, không phải chuyện tự xử lý
 * tại nhà. Và nguyên nhân đã rõ là chấn thương — không được đi tìm nguyên
 * nhân khác, càng không được gán cho thuốc.
 */
const TRAUMA_PHRASES = [
  'te nga', 'bi te', 'moi te', 'vua te', 'te xuong', 'truot te', 'vap te',
  'bi nga', 'moi nga', 'vua nga', 'nga xuong', 'truot nga', 'vap nga',
  'nga cau thang', 'te cau thang', 'va dap', 'dung dau', 'dap dau', 'dap mat'
];

/**
 * Chấn thương kèm những thứ này thì không chờ được.
 * 'dau dau' xét riêng qua hasHeadPain() vì "đau đầu gối" không phải đau đầu.
 */
const TRAUMA_EMERGENCY_MARKERS = [
  'dung dau', 'dap dau', 'chay mau', 'khong dung day duoc',
  'khong di duoc', 'khong dung len duoc', 'bat tinh', 'ngat', 'non', 'lu lan'
];

/**
 * Phân loại nhanh một câu nói tự do.
 * Trả về: 'EMERGENCY' | 'TRAUMA' | 'NEEDS_INTAKE' | 'PAST_TENSE_CHECK' | 'NOT_SYMPTOM'
 *
 * Lưu ý: KHÔNG kết luận cấp cứu chỉ từ một từ khoá đơn lẻ như "đau ngực".
 * Từ khoá đơn lẻ → chuyển sang bộ hỏi để làm rõ, vì "đau ngực" có thể là
 * nhồi máu cơ tim mà cũng có thể là đau cơ thành ngực do ho nhiều.
 */
export function classifyUtterance(text) {
  const p = padded(normalizeText(text));
  if (p.trim() === '') return { kind: 'NOT_SYMPTOM' };

  const pastMarker = findPhrase(p, NEGATION_PAST_MARKERS);

  // Chấn thương xét TRƯỚC từ điển triệu chứng: "mới bị té" có thể không chứa
  // từ đau nào, mà vẫn là việc phải xử lý.
  const trauma = findPhrase(p, TRAUMA_PHRASES);
  if (trauma && !pastMarker) {
    const severe = findPhrase(p, TRAUMA_EMERGENCY_MARKERS) || (hasHeadPain(p) ? 'dau dau' : null);
    return { kind: 'TRAUMA', matched: trauma, severe };
  }

  const hasSymptomWord = SYMPTOM_LEXICON.some(w => hasPhrase(p, w));
  if (!hasSymptomWord) return { kind: 'NOT_SYMPTOM' };
  const immediate = findPhrase(p, IMMEDIATE_EMERGENCY_PHRASES);

  // Câu nói về quá khứ / phủ định: KHÔNG bắn báo động (tránh alarm fatigue),
  // hỏi lại một câu cho chắc.
  if (pastMarker) {
    return { kind: 'PAST_TENSE_CHECK', matched: pastMarker, immediate: !!immediate };
  }

  if (immediate) return { kind: 'EMERGENCY', matched: immediate };

  return { kind: 'NEEDS_INTAKE' };
}

/**
 * Thứ hạng mức độ — dùng để trộn kết quả từ điển tại máy với kết quả Gemini.
 * Gemini được phép ĐẨY LÊN, chỉ được hạ ở đúng một nấc (xem geminiService).
 */
export const KIND_RANK = {
  NOT_SYMPTOM: 0,
  PAST_TENSE_CHECK: 1,
  NEEDS_INTAKE: 2,
  TRAUMA: 3,
  EMERGENCY: 4
};

/* ────────────────────────────────────────────────────────────────
 * B. Bộ hỏi cấu trúc — cố định, không do AI sinh
 * ──────────────────────────────────────────────────────────────── */

export const BODY_REGIONS = [
  { id: 'chest', label: 'Ngực', hint: 'vùng giữa ngực, sau xương ức' },
  { id: 'epigastric', label: 'Bụng trên (vùng ức)', hint: 'ngay dưới xương ức, trên rốn' },
  { id: 'ruq', label: 'Bụng trên bên phải', hint: 'dưới sườn phải' },
  { id: 'periumbilical', label: 'Quanh rốn', hint: '' },
  { id: 'rlq', label: 'Bụng dưới bên phải', hint: '' },
  { id: 'llq', label: 'Bụng dưới bên trái', hint: '' },
  { id: 'suprapubic', label: 'Bụng dưới giữa', hint: 'trên vùng kín' },
  { id: 'back', label: 'Lưng / thắt lưng', hint: '' },
  { id: 'head', label: 'Đầu', hint: '' },
  { id: 'leg', label: 'Chân / bắp chân', hint: '' },
  { id: 'joint', label: 'Khớp (gối, vai, tay)', hint: '' },
  { id: 'whole', label: 'Toàn thân / khó nói rõ chỗ nào', hint: '' }
];

export const ACCOMPANYING_SYMPTOMS = [
  // "Không có gì" để ĐẦU, không để cuối. Đây là câu trả lời hay gặp nhất, mà
  // trước đây nó nằm dưới 13 lựa chọn khác — người 70 tuổi phải đọc hết danh
  // sách triệu chứng đáng sợ rồi mới tới ô "tôi không sao".
  { id: 'none', label: 'Không có gì kèm theo' },
  { id: 'sweating', label: 'Vã mồ hôi lạnh' },
  { id: 'dyspnea', label: 'Khó thở, hụt hơi' },
  { id: 'radiating', label: 'Đau lan ra tay, hàm, hoặc sau lưng' },
  { id: 'nausea', label: 'Buồn nôn, nôn' },
  { id: 'vomit_blood', label: 'Nôn ra máu' },
  { id: 'black_stool', label: 'Đi cầu phân đen hoặc ra máu' },
  { id: 'fever', label: 'Sốt' },
  { id: 'faint', label: 'Ngất, xây xẩm muốn té' },
  { id: 'weakness_one_side', label: 'Yếu hoặc tê một bên người' },
  { id: 'speech', label: 'Nói khó, méo miệng' },
  { id: 'dark_urine', label: 'Nước tiểu sẫm màu như nước trà' },
  { id: 'swelling', label: 'Sưng, đỏ, nóng chỗ đau' },
  { id: 'rash', label: 'Nổi mẩn, phát ban, ngứa' }
];

export const ONSET_OPTIONS = [
  { id: 'sudden', label: 'Đột ngột, mới trong vòng 1 tiếng' },
  { id: 'today', label: 'Hôm nay' },
  { id: 'few_days', label: 'Vài ngày nay' },
  { id: 'over_week', label: 'Hơn một tuần rồi' }
];

export const SEVERITY_OPTIONS = [
  { id: 'mild', label: 'Nhẹ, vẫn sinh hoạt bình thường' },
  { id: 'moderate', label: 'Khó chịu, làm gì cũng thấy vướng' },
  { id: 'severe', label: 'Dữ dội, không chịu nổi' }
];

/** Thứ tự các bước hỏi. UI chỉ việc render theo mảng này. */
export const INTAKE_STEPS = [
  { key: 'region', question: '{{You}} chỉ giúp {{me}} đau ở chỗ nào{{a}}?', options: BODY_REGIONS, multi: false },
  { key: 'onset', question: '{{You}} thấy vậy từ khi nào{{a}}?', options: ONSET_OPTIONS, multi: false },
  { key: 'severity', question: '{{You}} thấy khó chịu tới mức nào{{a}}?', options: SEVERITY_OPTIONS, multi: false },
  { key: 'accompanying', question: '{{You}} có thấy thêm cái nào dưới đây không{{a}}? (chọn được nhiều)', options: ACCOMPANYING_SYMPTOMS, multi: true }
];

/* ────────────────────────────────────────────────────────────────
 * C. Bảng red-flag tĩnh
 *
 * Mỗi luật: { id, when(answers, ctx), outcome, reason, advice }
 * Xét theo thứ tự, DỪNG ở luật đầu tiên khớp → luật nặng phải đặt trước.
 *
 * ctx = { generics: [...hoạt chất đang uống], age }
 * ──────────────────────────────────────────────────────────────── */

export const OUTCOME = {
  EMERGENCY_115: 'EMERGENCY_115',
  SEE_DOCTOR_24H: 'SEE_DOCTOR_24H',
  LOG_AND_NOTIFY: 'LOG_AND_NOTIFY'
};

/**
 * Câu trả lời CỐ ĐỊNH cho chấn thương. Không đưa qua model.
 *
 * Không có "việc làm được ngay để dễ chịu hơn" ở đây — chườm, xoa, nghỉ đều
 * là can thiệp, mà chưa ai xem chỗ đau thì không được khuyên can thiệp.
 */
export function traumaResponse({ severe } = {}) {
  if (severe) {
    return {
      outcome: OUTCOME.EMERGENCY_115,
      reason: 'Té kèm chấn thương đầu, chảy máu, hoặc không đứng dậy được.',
      advice: '{{You}} nằm yên, đừng cố đứng dậy, và gọi 115 ngay{{a}}. {{Me}} báo người nhà cùng lúc.'
    };
  }
  return {
    outcome: OUTCOME.SEE_DOCTOR_24H,
    reason: 'Người lớn tuổi bị té cần được khám, kể cả khi lúc đầu thấy đau ít.',
    advice: '{{Me}} báo người nhà ngay rồi{{a}}. {{You}} ngồi nghỉ, đừng tự xoa bóp hay chườm chỗ đau, '
          + 'và nhờ người nhà đưa đi khám trong hôm nay giúp {{me}} {{nha}}.'
  };
}

const has = (arr, id) => Array.isArray(arr) && arr.includes(id);
const takes = (ctx, ...gs) => gs.some(g => (ctx.generics || []).includes(g));

export const RED_FLAG_RULES = [
  // ══ Đột quỵ — bất kể vùng nào ══
  {
    id: 'RF-STROKE',
    when: (a) => has(a.accompanying, 'weakness_one_side') || has(a.accompanying, 'speech'),
    outcome: OUTCOME.EMERGENCY_115,
    reason: 'Yếu/tê một bên người hoặc nói khó, méo miệng là dấu hiệu cần loại trừ đột quỵ.',
    advice: '{{You}} gọi 115 ngay, đừng chờ xem có đỡ không{{a}}. {{You}} đừng tự đi xe.'
  },

  // ══ Ngất / mất ý thức ══
  {
    id: 'RF-SYNCOPE',
    when: (a) => has(a.accompanying, 'faint'),
    outcome: OUTCOME.EMERGENCY_115,
    reason: 'Ngất hoặc gần ngất ở người lớn tuổi cần được khám ngay.',
    advice: '{{You}} nằm nghỉ chỗ thoáng và gọi 115 hoặc gọi người nhà tới ngay{{a}}.'
  },

  // ══ Xuất huyết tiêu hoá ══
  {
    id: 'RF-GI-BLEED',
    when: (a) => has(a.accompanying, 'vomit_blood') || has(a.accompanying, 'black_stool'),
    outcome: OUTCOME.EMERGENCY_115,
    reason: 'Nôn ra máu hoặc đi cầu phân đen là dấu hiệu chảy máu trong đường tiêu hoá.',
    advice: '{{You}} không ăn uống gì thêm và gọi 115 ngay{{a}}.'
  },

  // ══ Hội chứng vành cấp — điển hình ══
  {
    id: 'RF-ACS-TYPICAL',
    when: (a) => a.region === 'chest' && (
      has(a.accompanying, 'sweating') ||
      has(a.accompanying, 'dyspnea') ||
      has(a.accompanying, 'radiating') ||
      a.severity === 'severe' ||
      a.onset === 'sudden'
    ),
    outcome: OUTCOME.EMERGENCY_115,
    reason: 'Đau ngực kèm vã mồ hôi, khó thở, đau lan, hoặc khởi phát đột ngột — cần loại trừ nhồi máu cơ tim.',
    advice: '{{You}} ngồi nghỉ, đừng gắng sức, và gọi 115 ngay{{a}}. {{Me}} báo người nhà cùng lúc.'
  },

  // ══ Hội chứng vành cấp — thể KHÔNG điển hình ══
  // Đây chính là ca mà bộ keyword cũ bỏ sót: đau thượng vị + vã mồ hôi/buồn nôn
  // ở người lớn tuổi có bệnh tim mạch có thể là nhồi máu cơ tim thành dưới,
  // KHÔNG hề có đau ngực.
  {
    id: 'RF-ACS-ATYPICAL',
    when: (a, ctx) => a.region === 'epigastric' && (
      has(a.accompanying, 'sweating') ||
      has(a.accompanying, 'dyspnea') ||
      has(a.accompanying, 'radiating') ||
      (has(a.accompanying, 'nausea') && (
        (ctx.age || 0) >= 60 ||
        takes(ctx, 'amlodipine', 'losartan', 'telmisartan', 'valsartan', 'enalapril',
                   'perindopril', 'bisoprolol', 'metoprolol', 'atenolol',
                   'atorvastatin', 'rosuvastatin', 'simvastatin', 'clopidogrel', 'aspirin')
      ))
    ),
    outcome: OUTCOME.EMERGENCY_115,
    reason: 'Đau vùng trên rốn kèm vã mồ hôi/khó thở/buồn nôn ở người lớn tuổi có yếu tố tim mạch có thể là biểu hiện không điển hình của nhồi máu cơ tim.',
    advice: 'Cái này {{me}} không dám chờ{{a}}. {{You}} ngồi nghỉ và gọi 115 ngay giúp {{me}}.'
  },

  // ══ Khó thở nặng ══
  {
    id: 'RF-SEVERE-DYSPNEA',
    when: (a) => has(a.accompanying, 'dyspnea') && (a.severity === 'severe' || a.onset === 'sudden'),
    outcome: OUTCOME.EMERGENCY_115,
    reason: 'Khó thở dữ dội hoặc khởi phát đột ngột cần cấp cứu.',
    advice: '{{You}} ngồi thẳng cho dễ thở và gọi 115 ngay{{a}}.'
  },

  // ══ Nhiễm toan lactic do metformin ══
  {
    id: 'RF-METFORMIN-LACTIC',
    when: (a, ctx) => takes(ctx, 'metformin') &&
      has(a.accompanying, 'dyspnea') &&
      (a.region === 'whole' || has(a.accompanying, 'nausea')),
    outcome: OUTCOME.EMERGENCY_115,
    reason: 'Mệt lả kèm thở nhanh/khó thở ở người đang uống metformin cần loại trừ nhiễm toan lactic.',
    advice: '{{You}} ngưng chưa uống liều tiếp theo và gọi 115 hoặc tới bệnh viện ngay{{a}}. {{Me}} báo người nhà rồi.'
  },

  // ══ Sốc phản vệ ══
  {
    id: 'RF-ANAPHYLAXIS',
    when: (a) => has(a.accompanying, 'rash') && has(a.accompanying, 'dyspnea'),
    outcome: OUTCOME.EMERGENCY_115,
    reason: 'Nổi mẩn kèm khó thở là dấu hiệu phản ứng dị ứng nặng.',
    advice: '{{You}} ngưng thuốc vừa uống và gọi 115 ngay{{a}}.'
  },

  // ══ Đau bụng dữ dội ══
  {
    id: 'RF-ACUTE-ABDOMEN',
    when: (a) => ['epigastric', 'ruq', 'rlq', 'llq', 'periumbilical', 'suprapubic'].includes(a.region) &&
      a.severity === 'severe' && a.onset === 'sudden',
    outcome: OUTCOME.EMERGENCY_115,
    reason: 'Đau bụng dữ dội khởi phát đột ngột cần loại trừ bụng ngoại khoa cấp.',
    advice: '{{You}} đừng ăn uống gì và đi cấp cứu ngay{{a}}.'
  },

  // ── Từ đây xuống: khám trong 24h ──

  // ══ Viêm ruột thừa ══
  {
    id: 'RF-APPENDIX',
    when: (a) => (a.region === 'rlq' || a.region === 'periumbilical') &&
      (has(a.accompanying, 'fever') || has(a.accompanying, 'nausea')),
    outcome: OUTCOME.SEE_DOCTOR_24H,
    reason: 'Đau bụng dưới bên phải kèm sốt hoặc buồn nôn cần loại trừ viêm ruột thừa.',
    advice: 'Nhà mình đưa {{you}} đi khám trong hôm nay{{a}}, đừng để qua đêm. {{You}} đừng uống thuốc giảm đau vì sẽ làm khó chẩn đoán.'
  },

  // ══ Viêm tuỵ / bệnh lý mật ══
  {
    id: 'RF-PANCREAS-BILIARY',
    when: (a) => (a.region === 'epigastric' || a.region === 'ruq') &&
      (has(a.accompanying, 'radiating') || has(a.accompanying, 'fever') || a.severity === 'severe'),
    outcome: OUTCOME.SEE_DOCTOR_24H,
    reason: 'Đau vùng trên rốn hoặc dưới sườn phải lan ra sau lưng, kèm sốt, cần khám sớm.',
    advice: 'Nhà mình sắp xếp cho {{you}} đi khám trong hôm nay{{a}}.'
  },

  // ══ Tiêu cơ vân do statin ══
  {
    id: 'RF-STATIN-RHABDO',
    when: (a, ctx) => takes(ctx, 'atorvastatin', 'rosuvastatin', 'simvastatin') &&
      (a.region === 'leg' || a.region === 'joint' || a.region === 'whole') &&
      (has(a.accompanying, 'dark_urine') || a.severity === 'severe'),
    outcome: OUTCOME.SEE_DOCTOR_24H,
    reason: 'Đau cơ kèm nước tiểu sẫm màu ở người đang uống thuốc mỡ máu cần loại trừ tổn thương cơ.',
    advice: '{{You}} đi khám trong hôm nay và nhớ mang theo vỉ thuốc mỡ máu cho bác sĩ xem{{a}}. {{You}} đừng tự ngưng thuốc khi chưa hỏi bác sĩ.'
  },

  // ══ Huyết khối tĩnh mạch sâu ══
  {
    id: 'RF-DVT',
    when: (a) => a.region === 'leg' && has(a.accompanying, 'swelling'),
    outcome: OUTCOME.SEE_DOCTOR_24H,
    reason: 'Một bên chân sưng đau cần loại trừ cục máu đông tĩnh mạch sâu.',
    advice: '{{You}} hạn chế xoa bóp chỗ sưng và đi khám trong hôm nay{{a}}.'
  },

  // ══ Đau đầu dữ dội đột ngột ══
  {
    id: 'RF-HEADACHE-SUDDEN',
    when: (a) => a.region === 'head' && a.severity === 'severe' && a.onset === 'sudden',
    outcome: OUTCOME.EMERGENCY_115,
    reason: 'Đau đầu dữ dội khởi phát đột ngột cần loại trừ xuất huyết não.',
    advice: '{{You}} gọi 115 ngay{{a}}, đừng chờ.'
  },
  {
    id: 'RF-HEADACHE',
    when: (a) => a.region === 'head' && (a.severity === 'severe' || has(a.accompanying, 'fever')),
    outcome: OUTCOME.SEE_DOCTOR_24H,
    reason: 'Đau đầu dữ dội hoặc kèm sốt cần được khám.',
    advice: 'Nhà mình cho {{you}} đi khám trong hôm nay{{a}}.'
  },

  // ══ Sốt kéo dài ══
  {
    id: 'RF-FEVER-PROLONGED',
    when: (a) => has(a.accompanying, 'fever') && (a.onset === 'few_days' || a.onset === 'over_week'),
    outcome: OUTCOME.SEE_DOCTOR_24H,
    reason: 'Sốt kéo dài nhiều ngày ở người lớn tuổi cần được khám tìm nguyên nhân.',
    advice: 'Sốt mấy ngày rồi thì nhà mình đi khám {{nha}}, đừng tự uống hạ sốt tiếp{{a}}.'
  },

  // ══ Dị ứng thuốc ══
  {
    id: 'RF-DRUG-RASH',
    when: (a) => has(a.accompanying, 'rash'),
    outcome: OUTCOME.SEE_DOCTOR_24H,
    reason: 'Nổi mẩn có thể là phản ứng dị ứng với thuốc đang dùng.',
    advice: '{{You}} chụp giúp {{me}} chỗ nổi mẩn và mang theo hết vỏ thuốc khi đi khám {{nha}}. Nếu thấy khó thở thì gọi 115 ngay{{a}}.'
  },

  // ══ Triệu chứng kéo dài ══
  {
    id: 'RF-PERSISTENT',
    when: (a) => a.onset === 'over_week' && a.severity !== 'mild',
    outcome: OUTCOME.SEE_DOCTOR_24H,
    reason: 'Triệu chứng kéo dài hơn một tuần và không nhẹ.',
    advice: 'Kéo dài vậy thì mình đi khám cho yên tâm {{nha}}. {{Me}} đặt lịch nhắc giúp {{you}}{{a}}.'
  },

  // ══ Đau dữ dội bất kỳ vùng nào ══
  {
    id: 'RF-SEVERE-ANY',
    when: (a) => a.severity === 'severe',
    outcome: OUTCOME.SEE_DOCTOR_24H,
    reason: 'Đau ở mức dữ dội cần được bác sĩ xem.',
    advice: 'Đau tới mức đó thì mình đi khám hôm nay {{nha}}.'
  }
];

/**
 * Chạy bảng luật. Trả về quyết định + luật đã khớp (để log và để test).
 *
 * @param {object} answers - { region, onset, severity, accompanying: [] }
 * @param {object} context - { generics: [], age }
 */
export function runTriage(answers, context = {}) {
  const ctx = { generics: context.generics || [], age: context.age };

  for (const rule of RED_FLAG_RULES) {
    let matched = false;
    try {
      matched = rule.when(answers, ctx);
    } catch {
      matched = false; // luật lỗi thì bỏ qua, không được làm sập luồng an toàn
    }
    if (matched) {
      return {
        outcome: rule.outcome,
        rule_id: rule.id,
        reason: rule.reason,
        advice: rule.advice,
        rules_version: TRIAGE_RULES_STATUS.version
      };
    }
  }

  return {
    outcome: OUTCOME.LOG_AND_NOTIFY,
    rule_id: null,
    reason: 'Không khớp dấu hiệu cảnh báo nào trong bảng hiện tại.',
    advice: null,
    rules_version: TRIAGE_RULES_STATUS.version
  };
}

/**
 * Câu trả lời CỐ ĐỊNH cho hai nhánh nặng. Không để AI ứng biến ở đây
 * (doc 31 mục 7: "soạn câu trả lời cố định cho Mức 4").
 */
export function buildTriageResponse(decision, memberProfile = {}) {
  // Nhận cả chuỗi tên (cách gọi cũ) lẫn nguyên hồ sơ. Có hồ sơ mới biết
  // xưng "con–bác" hay "mình–bạn".
  const profile = typeof memberProfile === 'string'
    ? { display_name: memberProfile }
    : (memberProfile || {});
  const name = profile.display_name || '{{you}}';
  const say = (s) => speak(s, profile);

  if (decision.outcome === OUTCOME.EMERGENCY_115) {
    return {
      tier: 4,
      isEmergency: true,
      showCallButton: true,
      text: say(`⚠️ ${name} ơi, cái này {{me}} không tự xử được{{a}}. ${decision.advice}`),
      advice: say(decision.advice),
      reason: decision.reason,
      rule_id: decision.rule_id
    };
  }

  if (decision.outcome === OUTCOME.SEE_DOCTOR_24H) {
    return {
      tier: 3,
      isEmergency: false,
      showCallButton: false,
      needsAppointment: true,
      text: say(`{{Da}} {{me}} ghi lại rồi{{a}}. ${decision.advice}`),
      advice: say(decision.advice),
      reason: decision.reason,
      rule_id: decision.rule_id
    };
  }

  return null; // nhánh nhẹ → để tầng gọi tiếp tục bằng AI (chỉ diễn đạt)
}

/** Đưa câu trả lời đã chọn về dạng chữ để log và để hiển thị lại cho con cái */
export function describeAnswers(answers) {
  const region = BODY_REGIONS.find(r => r.id === answers.region);
  const onset = ONSET_OPTIONS.find(o => o.id === answers.onset);
  const severity = SEVERITY_OPTIONS.find(s => s.id === answers.severity);
  const accompanying = (answers.accompanying || [])
    .filter(id => id !== 'none')
    .map(id => ACCOMPANYING_SYMPTOMS.find(s => s.id === id)?.label)
    .filter(Boolean);

  const parts = [];
  if (region) parts.push(`Vị trí: ${region.label}`);
  if (onset) parts.push(`Bắt đầu: ${onset.label}`);
  if (severity) parts.push(`Mức độ: ${severity.label}`);
  parts.push(`Kèm theo: ${accompanying.length ? accompanying.join(', ') : 'không có'}`);
  return parts.join(' · ');
}

/** Rút hoạt chất đang dùng từ danh sách đơn thuốc, để làm ngữ cảnh cho luật */
export function activeGenericsFrom(prescriptions = [], memberId = null) {
  const generics = new Set();
  prescriptions
    .filter(p => !memberId || p.member_id === memberId)
    .forEach(p => (p.medications || []).forEach(m => {
      resolveGenerics(m).forEach(g => generics.add(g));
    }));
  return [...generics];
}
