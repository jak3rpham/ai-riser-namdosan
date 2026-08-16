import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { config } from '../lib/config.js';
import { fail, requireAuth } from '../plugins/auth.js';
import { enforceAiQuota } from '../plugins/rateLimit.js';
import { buildPseudonymousProfile, findIdentifiers, stripExtractionIdentifiers } from '../lib/pseudonym.js';
import { EXTRACT_PROMPT, DEVICE_READ_PROMPT, askPrompt, explainPrompt, narrateSymptomPrompt, classifySymptomPrompt } from '../lib/prompts.js';
import { synthesizeSpeech } from '../lib/tts.js';


/**
 * Proxy Gemini.
 *
 * Đây là mốc B3 của doc 41: sau khi route này chạy, khoá Gemini không còn
 * trong bundle phía trình duyệt nữa.
 *
 * Mọi route ở đây đều: đăng nhập → hạn mức → bí danh hoá → gọi Gemini.
 * Không có đường tắt nào bỏ qua bí danh hoá.
 */

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * Lần gọi Gemini gần nhất ra sao.
 *
 * ⚠️ Có để `/api/health` nói được SỰ THẬT thay vì nói suông.
 *
 * Trước: frontend hỏi `isAiConfigured()`, hàm đó `return true` vô điều kiện,
 * và panel Kết nối in ra "Đã có khoá. Đọc đơn thuốc và trợ lý Cháu Bi hoạt
 * động." Ngày 16/08 khoá bị Google trả 401 suốt nhiều giờ, mọi /ai/* trả 502,
 * mà panel vẫn xanh và vẫn khẳng định y nguyên câu đó. Người tự dựng lại app
 * theo hướng dẫn sẽ đi tìm lỗi ở mọi chỗ trừ chỗ thật.
 *
 * Ghi lại kết quả quan sát được thay vì gọi thêm một lượt để kiểm tra: gọi
 * thêm là tốn tiền thật, mà kết quả cũng chỉ nói được đúng bằng lần gọi vừa rồi.
 * Chưa gọi lần nào thì trả `unknown` — không đoán là tốt cũng không đoán là hỏng.
 */
let lastGemini = { ok: null, error_code: null, at: null };

export function getAiStatus() {
  return {
    key_configured: !!config.geminiApiKey,
    last_call_ok: lastGemini.ok,
    last_error_code: lastGemini.error_code,
    last_call_at: lastGemini.at
  };
}

const medSchema = z.object({
  name: z.string().optional().nullable(),
  generic: z.string().optional().nullable(),
  strength: z.string().optional().nullable(),
  dosage: z.string().optional().nullable(),
  timing: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  est_remaining: z.number().optional().nullable(),
  special_missed_dose: z.boolean().optional()
}).passthrough();

const profileSchema = z.object({
  subject_ref: z.string().max(64).optional(),
  birth_year: z.number().int().min(1900).max(2030).optional().nullable(),
  conditions: z.array(z.string().max(120)).max(20).optional(),
  allergies: z.array(z.string().max(120)).max(20).optional(),
  recent_vitals: z.array(z.any()).max(20).optional(),
  recent_symptoms: z.array(z.any()).max(20).optional()
}).passthrough();

/** Gọi Gemini, quy mọi lỗi về cùng một hợp đồng lỗi */
async function callGemini({ prompt, imageBase64, jsonMode, temperature, maxTokens, log }) {
  const model = genAI.getGenerativeModel({
    model: config.geminiModel,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {})
    }
  });

  const parts = imageBase64
    ? [prompt, { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } }]
    : [prompt];

  try {
    const result = await model.generateContent(parts);
    lastGemini = { ok: true, error_code: null, at: new Date().toISOString() };
    return { ok: true, text: result.response.text() };
  } catch (err) {
    log?.error({ err: err.message }, 'gọi Gemini lỗi');
    const msg = String(err.message || '');
    /**
     * Mỗi thông điệp ở đây chỉ nói NGUYÊN NHÂN, không nói phải làm gì.
     *
     * Việc cần làm khác nhau theo từng route — quét đơn thì nhập tay, đọc máy
     * đo thì nhập con số, hỏi trợ lý thì chờ chút — nên route tự thêm câu đó.
     * Nhét sẵn "bạn nhập tay nhé" vào đây thì màn quét đơn hiện ra hai lần:
     * "Không gọi được AI lúc này. Bạn thử lại hoặc nhập tay nhé. Bạn nhập tay
     * giúp nhé — đừng đoán liều."
     */
    const failed = out => {
      lastGemini = { ok: false, error_code: out.code, at: new Date().toISOString() };
      return out;
    };

    if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
      return failed({ ok: false, code: 'GEMINI_QUOTA', message: 'Hết lượt gọi AI hôm nay.' });
    }
    if (msg.includes('404')) {
      return failed({ ok: false, code: 'MODEL_NOT_FOUND', message: 'Model AI không còn khả dụng. Cần cập nhật cấu hình máy chủ.' });
    }
    /**
     * Khoá sai / hết hạn / bị thu hồi.
     *
     * Tách riêng vì nó là lỗi CẤU HÌNH, không phải lỗi tạm thời — người dùng
     * thử lại bao nhiêu lần cũng vậy, và chỉ chủ dự án sửa được. Gộp chung vào
     * GEMINI_ERROR ("thử lại nhé") thì mã lỗi trên màn hình nói sai việc cần
     * làm, mà log thì phải đào mới ra.
     *
     * Gặp thật ngày 16/08: khoá trong Secret Manager bị trả 401
     * ACCESS_TOKEN_TYPE_UNSUPPORTED, toàn bộ /ai/* trả 502 suốt mà nhìn từ
     * ngoài không phân biệt được với mạng chập.
     */
    if (msg.includes('401') || msg.includes('403') || msg.includes('API_KEY_INVALID')) {
      return failed({
        ok: false,
        code: 'GEMINI_KEY_REJECTED',
        message: 'Máy chủ chưa có khoá AI hợp lệ. Đây là lỗi cấu hình, không phải do máy bạn.'
      });
    }
    return failed({ ok: false, code: 'GEMINI_ERROR', message: 'Không gọi được AI lúc này.' });
  }
}

export default async function aiRoutes(fastify) {
  const guard = { preHandler: [requireAuth, enforceAiQuota] };

  /* ── Trích xuất đơn thuốc từ ảnh ──
   * Đây là CHẶNG 1 trong doc 38 mục 10 — chặng duy nhất có dữ liệu định danh
   * (tên in trên giấy). Cắt định danh ngay sau khi đọc xong. */
  fastify.post('/extract-prescription', guard, async (request, reply) => {
    const parsed = z.object({
      image: z.string().min(100).max(12_000_000)
    }).safeParse(request.body);

    if (!parsed.success) {
      return fail(reply, 400, 'BAD_INPUT', 'Ảnh không hợp lệ hoặc quá lớn (tối đa ~9MB).');
    }

    const base64 = parsed.data.image.replace(/^data:image\/\w+;base64,/, '');

    const res = await callGemini({
      prompt: EXTRACT_PROMPT,
      imageBase64: base64,
      jsonMode: true,
      temperature: 0.2,
      maxTokens: 8000,
      log: request.log
    });

    // ⚠️ KHÔNG dựng đơn thuốc dự phòng ở đây.
    //
    // Bản trước, khi Gemini lỗi, route này trả về một đơn BỊA HOÀN TOÀN:
    // "Amlodipine 5mg, uống 1 viên buổi trưa", "Paracetamol 500mg", bác sĩ
    // "TS.BS Nguyễn Văn An", est_remaining 18 viên. Kèm cờ `is_fallback: true`
    // — mà KHÔNG chỗ nào phía frontend đọc cờ đó (đã grep toàn repo).
    //
    // Nghĩa là: mạng chập một cái lúc bác chụp đơn thuốc, app hiện ra hai
    // loại thuốc bác chưa từng được kê, bác bấm xác nhận, và từ đó app nhắc
    // bác uống Amlodipine mỗi trưa. Thuốc huyết áp, cho người có thể đang
    // không bị huyết áp.
    //
    // Hỏng thì nói là hỏng. Nhập tay vẫn còn đó.
    if (!res.ok) {
      request.log.warn({ code: res.code }, 'đọc đơn thuốc thất bại — trả lỗi thật');
      return reply.send({
        ok: false,
        error_code: res.code,
        error_message: `${res.message} Bạn nhập tay giúp nhé — đừng đoán liều.`
      });
    }

    let data;
    try {
      data = JSON.parse(res.text.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch {
      return fail(reply, 502, 'BAD_JSON', 'AI trả về dữ liệu không đọc được. Bạn nhập tay giúp nhé.');
    }

    if (!data.medications?.length) {
      return reply.send({
        ok: false,
        error_code: 'NO_MEDICATION_FOUND',
        error_message: 'Không tìm thấy thuốc nào trong ảnh này. Bạn chụp rõ hơn hoặc nhập tay nhé.',
        unreadable_parts: data.unreadable_parts || []
      });
    }

    // Thiếu confidence thì coi là THẤP, không coi là cao
    const medications = data.medications.map(m => ({
      ...m,
      confidence: typeof m.confidence === 'number' ? m.confidence : 0.5
    }));

    return reply.send({
      ok: true,
      ...stripExtractionIdentifiers({ ...data, medications })
    });
  });

  /* ── Trợ lý Cháu Bi — CHẶNG 2, chỉ hồ sơ bí danh ── */
  fastify.post('/ask', guard, async (request, reply) => {
    const parsed = z.object({
      question: z.string().min(1).max(1000),
      profile: profileSchema.optional().default({}),
      medications: z.array(medSchema).max(40).optional().default([]),
      register: z.enum(['elder', 'peer']).optional().default('elder')
    }).safeParse(request.body);

    if (!parsed.success) return fail(reply, 400, 'BAD_INPUT', 'Câu hỏi không hợp lệ.');

    const pseudo = buildPseudonymousProfile(parsed.data.profile, parsed.data.medications);

    const leaks = findIdentifiers(pseudo);
    if (leaks.length) {
      request.log.error({ leaks }, 'CHẶN: hồ sơ còn trường định danh');
      return fail(reply, 500, 'PSEUDONYM_FAILED', 'Lỗi xử lý hồ sơ phía máy chủ.');
    }

    const res = await callGemini({
      prompt: askPrompt(pseudo, parsed.data.question, parsed.data.register),
      jsonMode: false,
      temperature: 0.5,
      maxTokens: 2500,
      log: request.log
    });

    if (!res.ok) return fail(reply, 502, res.code, res.message);
    return reply.send({ ok: true, text: res.text.trim() });
  });

  /* ── Phân loại câu nói thành KHUNG ──
   *
   * ⚠️ Route này KHÔNG trả lời người dùng và KHÔNG ra quyết định. Nó chỉ điền
   * nhãn vào khung cố định; bảng luật tĩnh phía client mới quyết định 115 hay
   * khám 24h. Client còn trộn kết quả này với từ điển tại máy theo luật
   * "chỉ được đẩy nặng lên" — xem classifyUtteranceSmart trong geminiService.js.
   *
   * Không cần hồ sơ thuốc ở đây: phân loại chỉ đọc câu chữ. Gửi ít dữ liệu
   * hơn thì lộ ít hơn.
   */
  const KINDS = ['NOT_SYMPTOM', 'PAST_TENSE_CHECK', 'NEEDS_INTAKE', 'TRAUMA', 'EMERGENCY'];
  const REGIONS = ['chest', 'epigastric', 'ruq', 'periumbilical', 'rlq', 'llq',
                   'suprapubic', 'back', 'head', 'leg', 'joint', 'whole'];
  const ONSETS = ['sudden', 'today', 'few_days', 'over_week'];
  const SEVERITIES = ['mild', 'moderate', 'severe'];
  const ACCOMPANYING = ['sweating', 'dyspnea', 'radiating', 'nausea', 'vomit_blood',
                        'black_stool', 'fever', 'faint', 'weakness_one_side', 'speech',
                        'dark_urine', 'swelling', 'rash'];

  fastify.post('/classify-symptom', guard, async (request, reply) => {
    const parsed = z.object({
      text: z.string().min(1).max(1000),
      register: z.enum(['elder', 'peer']).optional().default('elder')
    }).safeParse(request.body);

    if (!parsed.success) return fail(reply, 400, 'BAD_INPUT', 'Câu nói không hợp lệ.');

    const res = await callGemini({
      prompt: `${classifySymptomPrompt(parsed.data.register)}\n\nCâu người dùng vừa nói: "${parsed.data.text}"`,
      jsonMode: true,
      temperature: 0,   // phân loại phải ổn định: cùng câu, cùng nhãn
      /**
       * ⚠️ Từng để 200 và route này HỎNG HOÀN TOÀN — mọi lời gọi trả BAD_JSON.
       *
       * Lý do: `maxOutputTokens` tính cả phần model suy nghĩ trước khi viết,
       * không chỉ phần chữ nó trả ra. Với gemini-3.6-flash, 200 token bị phần
       * suy nghĩ ăn hết, JSON ra cụt giữa chừng, JSON.parse ném lỗi.
       *
       * Bằng chứng khi truy: /extract-prescription (JSON, 8000 token) chạy tốt,
       * /ask (2500) chạy tốt, chỉ mỗi route 200 token hỏng — cùng khoá, cùng
       * model, cùng chế độ JSON.
       *
       * Hỏng theo kiểu im lặng: client bắt lỗi rồi lặng lẽ giữ kết quả từ điển
       * tại máy, nên nhìn ngoài app vẫn chạy. Chỉ mất đúng cái mà lớp Gemini
       * sinh ra để làm — đọc chính tả sai, tiếng lóng, câu nói vòng.
       *
       * Đừng hạ xuống để "tiết kiệm". Chỉ trả tiền cho token thật sự sinh ra,
       * mà JSON này chỉ vài chục token; con số dưới đây là trần, không phải
       * lượng dùng.
       */
      maxTokens: 1200,
      log: request.log
    });

    if (!res.ok) return fail(reply, 502, res.code, res.message);

    let data;
    try {
      data = JSON.parse(res.text.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch {
      // Ghi lại NGUYÊN VĂN thứ model trả về. Không có dòng này thì lần trước
      // phải suy luận gián tiếp qua các route khác mới ra được nguyên nhân là
      // hết ngân sách token — mà lỗi thì im lặng, không ai biết để đi tìm.
      request.log.warn({ raw: String(res.text || '').slice(0, 300) }, 'phân loại: JSON không đọc được');
      return fail(reply, 502, 'BAD_JSON', 'AI trả về phân loại không đọc được.');
    }

    // Lọc trắng danh sách. Model bịa ra nhãn lạ thì vứt, KHÔNG chuyển tiếp —
    // nhãn lạ lọt xuống bảng luật sẽ không khớp luật nào và im lặng thành
    // "không có gì bất thường".
    const pick = (v, list) => (list.includes(v) ? v : null);

    return reply.send({
      ok: true,
      kind: pick(data.kind, KINDS) || 'NOT_SYMPTOM',
      trauma_severe: data.trauma_severe === true,
      region: pick(data.region, REGIONS),
      onset: pick(data.onset, ONSETS),
      severity: pick(data.severity, SEVERITIES),
      accompanying: Array.isArray(data.accompanying)
        ? [...new Set(data.accompanying.filter(x => ACCOMPANYING.includes(x)))]
        : [],
      confidence: typeof data.confidence === 'number'
        ? Math.min(1, Math.max(0, data.confidence))
        : 0.5
    });
  });

  /* ── Đọc thành tiếng ──
   * Lớp tăng cường. Hỏng thì frontend quay về speechSynthesis của trình duyệt,
   * không bao giờ để câu cảnh báo bị câm. Xem server/src/lib/tts.js. */
  fastify.post('/speak', guard, async (request, reply) => {
    if (!config.ttsEnabled) {
      return fail(reply, 503, 'TTS_DISABLED', 'Giọng đọc đang tắt.');
    }

    const parsed = z.object({
      // Giới hạn 600 ký tự: câu trả lời của app tối đa 3 câu. Dài hơn nghĩa là
      // có ai đó đang mượn endpoint này làm dịch vụ đọc sách.
      text: z.string().min(1).max(600),
      register: z.enum(['elder', 'peer']).optional().default('elder')
    }).safeParse(request.body);

    if (!parsed.success) return fail(reply, 400, 'BAD_INPUT', 'Nội dung đọc không hợp lệ.');

    const res = await synthesizeSpeech({
      text: parsed.data.text,
      register: parsed.data.register,
      log: request.log
    });

    if (!res.ok) return fail(reply, 502, res.code, res.message);
    return reply.send({ ok: true, audio: res.audio, mime: res.mime, cached: res.cached });
  });

  /* ── Giải thích đơn thuốc bằng lời bình dân ── */
  fastify.post('/explain', guard, async (request, reply) => {
    const parsed = z.object({
      medications: z.array(medSchema).max(40),
      register: z.enum(['elder', 'peer']).optional().default('elder')
    }).safeParse(request.body);

    if (!parsed.success) return fail(reply, 400, 'BAD_INPUT', 'Danh sách thuốc không hợp lệ.');

    const pseudo = buildPseudonymousProfile({}, parsed.data.medications);

    const res = await callGemini({
      prompt: explainPrompt(pseudo, parsed.data.register),
      jsonMode: false,
      temperature: 0.6,
      maxTokens: 2500,
      log: request.log
    });

    if (!res.ok) return fail(reply, 502, res.code, res.message);
    return reply.send({ ok: true, text: res.text.trim() });
  });

  /* ── Diễn đạt lại triệu chứng NHẸ ──
   * Bảng luật tĩnh đã quyết định nhánh rồi; AI chỉ diễn đạt (doc 39). */
  fastify.post('/narrate-symptom', guard, async (request, reply) => {
    const parsed = z.object({
      summary: z.string().min(1).max(600),
      profile: profileSchema.optional().default({}),
      medications: z.array(medSchema).max(40).optional().default([]),
      register: z.enum(['elder', 'peer']).optional().default('elder')
    }).safeParse(request.body);

    if (!parsed.success) return fail(reply, 400, 'BAD_INPUT', 'Dữ liệu triệu chứng không hợp lệ.');

    const pseudo = buildPseudonymousProfile(parsed.data.profile, parsed.data.medications);

    const res = await callGemini({
      prompt: narrateSymptomPrompt(pseudo, parsed.data.summary, parsed.data.register),
      jsonMode: false,
      temperature: 0.5,
      maxTokens: 2500,
      log: request.log
    });

    if (!res.ok) return fail(reply, 502, res.code, res.message);
    return reply.send({ ok: true, text: res.text.trim() });
  });

  /* ── Đọc chỉ số từ màn hình máy đo y tế (huyết áp / nhịp tim) ── */
  fastify.post('/read-device', guard, async (request, reply) => {
    const parsed = z.object({
      image: z.string().min(100).max(12_000_000)
    }).safeParse(request.body);

    if (!parsed.success) {
      return fail(reply, 400, 'BAD_INPUT', 'Ảnh không hợp lệ hoặc quá lớn.');
    }

    const base64 = parsed.data.image.replace(/^data:image\/\w+;base64,/, '');

    const res = await callGemini({
      prompt: DEVICE_READ_PROMPT,
      imageBase64: base64,
      jsonMode: true,
      temperature: 0.1,
      maxTokens: 1000,
      log: request.log
    });

    // ⚠️ Cùng một lỗi, hậu quả nặng hơn: bản trước trả về 128/82 mạch 74 khi
    // đọc ảnh thất bại. Chỉ số bịa đó chạy thẳng vào `evaluateVital`, ra
    // "trong ngưỡng bình thường", và hiện lên cho một người có thể đang
    // 180/110 thật. Người đó tin app rồi đi ngủ.
    if (!res.ok) {
      request.log.warn({ code: res.code }, 'đọc máy đo thất bại — trả lỗi thật');
      return reply.send({
        ok: false,
        error_code: res.code,
        error_message: `${res.message} Bạn nhập tay con số trên màn hình giúp nhé.`
      });
    }

    let data;
    try {
      data = JSON.parse(res.text.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch {
      return fail(reply, 502, 'BAD_JSON', 'AI trả về kết quả đọc số không hợp lệ.');
    }

    return reply.send({
      ok: true,
      systolic: typeof data.systolic === 'number' ? data.systolic : null,
      diastolic: typeof data.diastolic === 'number' ? data.diastolic : null,
      pulse: typeof data.pulse === 'number' ? data.pulse : null,
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.8
    });
  });
}

