import { isSpecialMissedDose, plainNameFor, resolveGenerics } from './medicalKnowledge';
import {
  activeGenericsFrom,
  buildTriageResponse,
  classifyUtterance,
  traumaResponse,
  OUTCOME,
  runTriage,
  KIND_RANK
} from './symptomTriage';
import { apiPost } from './apiClient';
import { registerBrief, speak } from './honorifics';

/**
 * Tầng AI phía trình duyệt — giờ chỉ là client gọi backend.
 *
 * ═══════════════════════════════════════════════════════════════════
 * THAY ĐỔI LỚN (mốc B3, doc 41): khoá Gemini đã rời khỏi trình duyệt.
 *
 * Trước:  trình duyệt giữ VITE_GEMINI_API_KEY, tự dựng prompt, gọi thẳng Google
 * Sau:    trình duyệt gọi /api/ai/*, backend giữ khoá và dựng prompt
 *
 * Vì sao prompt cũng chuyển sang server: nếu client dựng prompt rồi gửi lên
 * proxy thì ai cũng sửa được rào an toàn trước khi gửi — proxy lúc đó chỉ giấu
 * được khoá chứ không bảo vệ được gì.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Phần Ở LẠI trình duyệt, có chủ ý:
 *   · phân loại câu nói và bảng luật triệu chứng — chạy tức thì, offline vẫn được
 *   · chặn xin đổi liều — câu trả lời cố định, không cần mạng
 * Đây là các quyết định an toàn tất định, không phụ thuộc AI (doc 39 mục 3).
 */

/**
 * ⚠️ Đã BỎ `isAiConfigured()`.
 *
 * Nó `return true` vô điều kiện, với lý do "có backend là có AI". Lý do đó sai
 * ở đúng chỗ quan trọng: có backend không có nghĩa là backend gọi được Gemini.
 * Ngày 16/08 khoá bị Google trả 401 hàng giờ, và panel Kết nối — chỗ duy nhất
 * trong app nói về tình trạng AI — vẫn xanh, vẫn ghi "trợ lý Cháu Bi hoạt động".
 *
 * Thay bằng `/api/health` → trường `ai`, lấy từ kết quả lần gọi Gemini gần nhất
 * mà máy chủ quan sát được. Xem `getAiStatus()` trong server/src/routes/ai.js.
 */

/* ════════════════════════════════════════════════════════════════
 * 1. Trích xuất đơn thuốc từ ảnh
 * ════════════════════════════════════════════════════════════════ */
export async function extractPrescriptionFromImage(base64Image) {
  const res = await apiPost('/ai/extract-prescription', { image: base64Image });

  if (!res.ok) {
    return {
      ok: false,
      error_code: res.error_code || 'UNKNOWN',
      error_message: res.error_message || 'Không đọc được ảnh. Bạn nhập tay giúp nhé.',
      unreadable_parts: res.unreadable_parts || []
    };
  }

  return res;
}

export async function readDeviceImage(base64Image) {
  const res = await apiPost('/ai/read-device', { image: base64Image });

  if (!res.ok) {
    return {
      ok: false,
      error_code: res.error_code || 'UNKNOWN',
      error_message: res.error_message || 'Không đọc được màn hình máy đo. Bạn nhập tay giúp nhé.'
    };
  }

  return res;
}


/* ════════════════════════════════════════════════════════════════
 * 2. Giải thích đơn thuốc bằng lời bình dân
 * ════════════════════════════════════════════════════════════════ */
export async function generatePlainExplanation(medications = [], patientName = 'Bác', memberProfile = {}) {
  const names = medications.map(m => plainNameFor(m)).filter(Boolean);
  const fallback = speak(names.length
    ? `${patientName} ơi, đợt này {{you}} uống ${[...new Set(names)].slice(0, 3).join(', ')}. {{You}} uống đúng giờ theo lịch {{me}} đặt sẵn {{nha}}.`
    : `${patientName} ơi, {{me}} đã lưu đơn thuốc rồi{{a}}. {{You}} uống theo đúng lịch {{me}} đặt {{nha}}.`, memberProfile);

  const res = await apiPost('/ai/explain', {
    medications: medications.map(toWireMed),
    register: registerBrief(memberProfile)
  });

  return res.ok ? applyName(res.text, patientName) : fallback;
}

/* ════════════════════════════════════════════════════════════════
 * 3. Trợ lý "Cháu Bi"
 *
 * Thứ tự xử lý — quyết định an toàn luôn nằm TRƯỚC lời gọi AI:
 *   Mức 4a  chặn xin đổi liều           → câu cố định, ngay tại máy
 *   Mức 4b  câu rõ ràng là cấp cứu      → câu cố định + nút 115
 *   Mức 3   có nhắc tới triệu chứng     → chuyển sang bộ hỏi cấu trúc
 *   Mức 1–2 còn lại                     → gọi backend
 * ════════════════════════════════════════════════════════════════ */

const DOSE_CHANGE_PATTERNS = [
  'uong 2 vien', 'uong hai vien', 'tang lieu', 'gap doi', 'uong them vien',
  'uong bu', 'uong don', 'nhieu hon cho nhanh khoi', 'uong gop'
];

const OTHERS_MEDS_PATTERNS = ['thuoc cua ba', 'thuoc cua ong', 'thuoc cua me', 'thuoc cua bo', 'uong thuoc cua'];

function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
}

/** Thay {{XUNG_HO}} bằng tên thật — ngay trên máy, tên không rời thiết bị */
function applyName(text, displayName) {
  return (text || '').replace(/\{\{\s*XUNG_HO\s*\}\}/g, displayName || 'bác');
}

/** Chỉ gửi trường cần cho lâm sàng. Backend còn cắt thêm lần nữa. */
function toWireMed(m) {
  return {
    name: m.name || null,
    generic: resolveGenerics(m).join(' + ') || m.generic || null,
    strength: m.strength || null,
    dosage: m.dosage || null,
    timing: m.timing || null,
    frequency: m.frequency || null,
    est_remaining: Number.isFinite(m.est_remaining) ? m.est_remaining : null,
    special_missed_dose: isSpecialMissedDose(resolveGenerics(m))
  };
}

/** Hồ sơ gửi lên: KHÔNG kèm tên, ngày sinh chính xác, hay ảnh đại diện */
function toWireProfile(memberProfile = {}) {
  return {
    birth_year: memberProfile.birth_year || null,
    conditions: memberProfile.conditions || [],
    allergies: memberProfile.allergies || []
  };
}

function medsOf(memberProfile, prescriptions) {
  return prescriptions
    .filter(p => !memberProfile.id || p.member_id === memberProfile.id)
    .flatMap(p => p.medications || []);
}

/* ════════════════════════════════════════════════════════════════
 * 3b. Trộn phân loại tại máy với phân loại Gemini
 *
 * ⚠️ ĐÂY LÀ RANH GIỚI. Đọc kỹ trước khi sửa.
 *
 * Gemini vào luồng triệu chứng để làm ĐÚNG MỘT VIỆC: hiểu câu nói. Nó đọc
 * được chính tả sai, tiếng lóng, câu nói vòng, và văn bản voice nhận sai —
 * những thứ từ điển bỏ dấu tại máy không bao giờ đọc được.
 *
 * Nó KHÔNG được ra quyết định. Quyết định 115 / khám 24h vẫn thuộc bảng luật
 * tĩnh. Lý do ở doc 47 mục 6, và bằng chứng là ca té ngã: model biết đúng
 * statin gây đau cơ, nhưng gán kiến thức đúng đó vào một ca chấn thương rồi
 * khuyên chườm ấm. Knowledge base mạnh hơn không sửa được lỗi suy luận — nó
 * chỉ làm câu sai nghe thuyết phục hơn.
 *
 * BA LUẬT CHẶN:
 *
 * 1. Gemini được ĐẨY LÊN tự do. Nó nói nặng hơn từ điển thì nghe nó.
 *
 * 2. Gemini chỉ được HẠ XUỐNG ở đúng một nấc: NEEDS_INTAKE → NOT_SYMPTOM,
 *    và phải chắc chắn (confidence ≥ 0.8). Đây là nấc mà từ điển tự nhận là
 *    "rộng tay" — nơi "Quên uống thuốc trưa rồi" bị bắt nhầm. Hạ sai ở nấc
 *    này thì câu rơi về luồng hỏi thuốc thường, vốn đã có rào an toàn riêng.
 *    Mọi nấc nặng hơn: KHÔNG hạ, bất kể Gemini nói gì.
 *
 * 3. Từ điển bắt được cụm cấp cứu rõ ràng hoặc cụm chấn thương → KHOÁ CỨNG,
 *    không hạ, không bàn.
 *
 * Mạng hỏng / hết quota / Gemini trả rác → giữ nguyên kết quả từ điển. Luồng
 * an toàn không bao giờ phụ thuộc vào việc gọi được mạng.
 * ════════════════════════════════════════════════════════════════ */

const DOWNGRADE_MIN_CONFIDENCE = 0.8;

/**
 * Đệm theo câu chữ, sống trong một phiên.
 *
 * Cần vì luồng escalate hỏi lại đúng một câu hai lần: bác gõ ở ô hỏi nhanh
 * trong tab "Hỏi cháu" → phân loại lần 1 → tab thấy có triệu chứng nên mở
 * modal kèm nguyên câu → modal gọi askVoiceAssistant → phân loại lần 2.
 *
 * Hạn mức là 60 lượt gọi AI mỗi người mỗi ngày. Không đệm thì một câu hỏi
 * ăn tới 3 lượt (2 phân loại + 1 trả lời) và bác hết lượt sau 20 câu.
 */
const classifyCache = new Map();
const CLASSIFY_CACHE_MAX = 50;

export async function classifyUtteranceSmart(text, memberProfile = {}) {
  const local = classifyUtterance(text);

  const cacheKey = `${registerBrief(memberProfile)}|${String(text).trim()}`;
  if (classifyCache.has(cacheKey)) return classifyCache.get(cacheKey);

  const res = await apiPost('/ai/classify-symptom', {
    text,
    register: registerBrief(memberProfile)
  });

  if (!res.ok) {
    // KHÔNG đệm kết quả hỏng: lần sau mạng có thể đã lên lại, và đây là
    // luồng an toàn nên đáng thử lại.
    return { ...local, source: 'LOCAL_ONLY', ai_error: res.error_code };
  }

  const localRank = KIND_RANK[local.kind] ?? 0;
  const aiRank = KIND_RANK[res.kind] ?? 0;

  // Luật 3 — từ điển đã bắt cụm rõ ràng thì khoá cứng
  const lockedByLexicon = local.kind === 'EMERGENCY' || local.kind === 'TRAUMA';

  let kind = local.kind;
  if (aiRank > localRank) {
    kind = res.kind;                                  // luật 1
  } else if (
    !lockedByLexicon &&                               // luật 3
    aiRank < localRank &&
    local.kind === 'NEEDS_INTAKE' &&
    res.kind === 'NOT_SYMPTOM' &&
    res.confidence >= DOWNGRADE_MIN_CONFIDENCE
  ) {
    kind = 'NOT_SYMPTOM';                             // luật 2
  }

  // Nếu kết luận cuối là chấn thương, mức nặng lấy theo bên nào nói nặng hơn.
  const severe = kind === 'TRAUMA'
    ? (local.severe || (res.trauma_severe ? 'AI' : null))
    : null;

  const merged = {
    kind,
    matched: local.matched,
    severe,
    source: kind === local.kind ? 'LOCAL+AI' : (aiRank > localRank ? 'AI_ESCALATED' : 'AI_CLEARED'),
    // Khung đã điền sẵn — dùng để bỏ bớt câu hỏi trong bộ hỏi cấu trúc.
    // KHÔNG dùng để chạy thẳng bảng luật: xem prefill trong SymptomIntakePanel.
    prefill: {
      region: res.region,
      onset: res.onset,
      severity: res.severity,
      accompanying: res.accompanying || []
    },
    confidence: res.confidence
  };

  classifyCache.set(cacheKey, merged);
  if (classifyCache.size > CLASSIFY_CACHE_MAX) {
    classifyCache.delete(classifyCache.keys().next().value);
  }
  return merged;
}

export async function askVoiceAssistant(question, memberProfile = {}, prescriptions = [], language = 'vi') {
  const q = normalize(question);
  const name = memberProfile.display_name || '{{you}}';
  const say = (s) => speak(s, memberProfile);

  // ── Mức 4a: xin đổi liều ──
  if (DOSE_CHANGE_PATTERNS.some(p => q.includes(p))) {
    return {
      tier: 4, isEmergency: false, source: 'RULE:DOSE_CHANGE',
      text: language === 'vi'
        ? say('{{Da}} không nên {{you}} ơi. Liều bác sĩ đã tính riêng theo cân nặng và sức khỏe gan thận của {{you}} rồi{{a}}. {{You}} uống đúng như toa {{nha}}, {{me}} nhắc giờ cho {{you}}.')
        : 'Please do not change your dose on your own — it was calculated specifically for you.'
    };
  }

  // ── Mức 4b: xin uống thuốc của người khác ──
  if (OTHERS_MEDS_PATTERNS.some(p => q.includes(p))) {
    return {
      tier: 4, isEmergency: false, source: 'RULE:OTHERS_MEDS',
      text: say('{{Da}} không được đâu {{you}} ơi. Đơn của {{you}} khác đơn của người khác, cùng tên bệnh nhưng liều vẫn khác nhau{{a}}.')
    };
  }

  // ── Mức 3–4: có nhắc tới triệu chứng ──
  // Từ điển tại máy + Gemini, trộn theo ba luật chặn ở classifyUtteranceSmart.
  const classification = await classifyUtteranceSmart(question, memberProfile);

  if (classification.kind === 'EMERGENCY') {
    const decision = {
      outcome: OUTCOME.EMERGENCY_115,
      rule_id: classification.source === 'AI_ESCALATED'
        ? 'AI_ESCALATED'
        : 'LEXICON:' + classification.matched,
      reason: 'Người dùng mô tả rõ một dấu hiệu cấp cứu.',
      advice: '{{You}} gọi 115 ngay, hoặc gọi người nhà tới liền giúp {{me}}{{a}}.'
    };
    return { ...buildTriageResponse(decision, memberProfile), source: 'TRIAGE:' + classification.source };
  }

  // ── Chấn thương: trả lời cố định, KHÔNG qua bộ hỏi, KHÔNG qua model ──
  // Nguyên nhân đã rõ là té ngã. Chạy bộ hỏi triệu chứng ở đây sẽ dẫn tới
  // việc đi tìm một nguyên nhân khác — bản trước đã gán đau gối sau khi té
  // cho "tác dụng phụ của thuốc mỡ máu" rồi khuyên chườm ấm.
  if (classification.kind === 'TRAUMA') {
    const decision = {
      ...traumaResponse({ severe: classification.severe }),
      rule_id: 'TRAUMA:' + (classification.matched || classification.source)
    };
    return { ...buildTriageResponse(decision, memberProfile), source: 'TRIAGE:TRAUMA' };
  }

  if (classification.kind === 'PAST_TENSE_CHECK') {
    return {
      tier: 3, isEmergency: false, source: 'TRIAGE:PAST_TENSE',
      text: say('{{Da}} {{me}} nghe rồi{{a}}. Cho {{me}} hỏi lại cho chắc: bây giờ {{you}} còn thấy vậy nữa không{{a}}?'),
      quickReplies: [
        { label: 'Giờ vẫn còn', action: 'START_INTAKE' },
        { label: 'Hết rồi, chuyện cũ thôi', action: 'DISMISS' }
      ]
    };
  }

  if (classification.kind === 'NEEDS_INTAKE') {
    return {
      tier: 3, isEmergency: false, source: 'TRIAGE:NEEDS_INTAKE', startIntake: true,
      // Khung Gemini điền sẵn — bộ hỏi dùng để bỏ bớt câu đã rõ, KHÔNG dùng
      // để chạy thẳng bảng luật.
      prefill: classification.prefill,
      text: say('{{Da}} {{me}} ghi lại rồi{{a}}. Để {{me}} hỏi {{you}} vài câu ngắn cho rõ, rồi {{me}} biết nên làm gì {{nha}}.')
    };
  }

  // ── Mức 1–2: câu hỏi về thuốc → backend ──
  const meds = medsOf(memberProfile, prescriptions);

  const res = await apiPost('/ai/ask', {
    question,
    profile: toWireProfile(memberProfile),
    medications: meds.map(toWireMed),
    register: registerBrief(memberProfile)
  });

  if (res.ok) {
    return { tier: 1, isEmergency: false, source: 'AI', text: applyName(res.text, name) };
  }

  // Backend hỏng → trả lời bằng dữ liệu có sẵn tại máy, và nói thật là đang hạn chế
  const next = meds[0];
  return {
    tier: 1,
    isEmergency: false,
    source: `FALLBACK:${res.error_code}`,
    text: next
      ? say(`{{Da}} ${name}, hôm nay {{you}} có ${next.name} — ${next.dosage || ''} ${next.timing || ''}{{a}}. {{Me}} đang không hỏi được trợ lý (${res.error_message}), {{you}} hỏi kỹ hơn thì nhắn con cái giúp {{me}} {{nha}}.`)
      : say(`{{Da}} {{me}} đang không kết nối được{{a}}. ${res.error_message}`)
  };
}

/* ════════════════════════════════════════════════════════════════
 * 4. Diễn đạt lại triệu chứng ở nhánh NHẸ
 * AI chỉ được gọi SAU khi bảng luật tĩnh đã kết luận là nhánh nhẹ.
 * ════════════════════════════════════════════════════════════════ */
export async function narrateMildSymptom(answersDescription, memberProfile = {}, prescriptions = []) {
  const name = memberProfile.display_name || '{{you}}';
  const fallback = speak('{{Da}} {{me}} ghi lại rồi{{a}} và {{me}} nhắn cho người nhà luôn. {{You}} nghỉ ngơi, uống đủ nước {{nha}}. Nếu qua 3 ngày không đỡ, hoặc {{you}} thấy nặng hơn, thì mình đi khám{{a}}.', memberProfile);

  const res = await apiPost('/ai/narrate-symptom', {
    summary: answersDescription,
    profile: toWireProfile(memberProfile),
    medications: medsOf(memberProfile, prescriptions).map(toWireMed),
    register: registerBrief(memberProfile)
  });

  return res.ok ? applyName(res.text, name) : fallback;
}

/* ════════════════════════════════════════════════════════════════
 * 5. Phân loại triệu chứng — chạy hoàn toàn tại máy, không gọi mạng
 * ════════════════════════════════════════════════════════════════ */
export function evaluateSymptomAnswers(answers, memberProfile = {}, prescriptions = []) {
  const age = memberProfile.birth_year ? new Date().getFullYear() - memberProfile.birth_year : null;
  const generics = activeGenericsFrom(prescriptions, memberProfile.id);
  return runTriage(answers, { generics, age });
}
