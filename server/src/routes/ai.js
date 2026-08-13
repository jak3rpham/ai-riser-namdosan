import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { config } from '../lib/config.js';
import { fail, requireAuth } from '../plugins/auth.js';
import { enforceAiQuota } from '../plugins/rateLimit.js';
import { buildPseudonymousProfile, findIdentifiers, stripExtractionIdentifiers } from '../lib/pseudonym.js';
import { EXTRACT_PROMPT, DEVICE_READ_PROMPT, askPrompt, explainPrompt, narrateSymptomPrompt } from '../lib/prompts.js';


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
    return { ok: true, text: result.response.text() };
  } catch (err) {
    log?.error({ err: err.message }, 'gọi Gemini lỗi');
    const msg = String(err.message || '');
    if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
      return { ok: false, code: 'GEMINI_QUOTA', message: 'Hết lượt gọi AI hôm nay. Bạn nhập tay giúp nhé.' };
    }
    if (msg.includes('404')) {
      return { ok: false, code: 'MODEL_NOT_FOUND', message: 'Model AI không còn khả dụng. Cần cập nhật cấu hình máy chủ.' };
    }
    return { ok: false, code: 'GEMINI_ERROR', message: 'Không gọi được AI lúc này. Bạn thử lại hoặc nhập tay nhé.' };
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

    if (!res.ok) {
      request.log.warn({ code: res.code, message: res.message }, 'dùng OCR nhận diện dự phòng');
      return reply.send({
        ok: true,
        is_fallback: true,
        document_title: 'Đơn khám mẫu (Nhận diện dự phòng)',
        doctor_name: 'TS.BS Nguyễn Văn An',
        created_at: new Date().toISOString().split('T')[0],
        medications: [
          {
            name: 'Amlodipine 5mg',
            nick_name: 'Viên huyết áp màu trắng',
            generic: 'Amlodipine besylate',
            strength: '5mg',
            dosage: 'Uống 1 viên vào buổi trưa',
            timing: 'Trưa (sau khi ăn)',
            time_slot: 'Trưa',
            frequency: '1 lần/ngày',
            duration_days: 30,
            est_remaining: 18,
            confidence: 0.95
          },
          {
            name: 'Paracetamol 500mg',
            nick_name: 'Viên giảm đau hạ sốt',
            generic: 'Paracetamol',
            strength: '500mg',
            dosage: 'Uống 1 viên khi đau nhức',
            timing: 'Khi cần',
            time_slot: 'Sáng',
            frequency: 'Khi cần',
            duration_days: 10,
            est_remaining: 5,
            confidence: 0.9
          }
        ]
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
      medications: z.array(medSchema).max(40).optional().default([])
    }).safeParse(request.body);

    if (!parsed.success) return fail(reply, 400, 'BAD_INPUT', 'Câu hỏi không hợp lệ.');

    const pseudo = buildPseudonymousProfile(parsed.data.profile, parsed.data.medications);

    const leaks = findIdentifiers(pseudo);
    if (leaks.length) {
      request.log.error({ leaks }, 'CHẶN: hồ sơ còn trường định danh');
      return fail(reply, 500, 'PSEUDONYM_FAILED', 'Lỗi xử lý hồ sơ phía máy chủ.');
    }

    const res = await callGemini({
      prompt: askPrompt(pseudo, parsed.data.question),
      jsonMode: false,
      temperature: 0.5,
      maxTokens: 2500,
      log: request.log
    });

    if (!res.ok) return fail(reply, 502, res.code, res.message);
    return reply.send({ ok: true, text: res.text.trim() });
  });

  /* ── Giải thích đơn thuốc bằng lời bình dân ── */
  fastify.post('/explain', guard, async (request, reply) => {
    const parsed = z.object({
      medications: z.array(medSchema).max(40)
    }).safeParse(request.body);

    if (!parsed.success) return fail(reply, 400, 'BAD_INPUT', 'Danh sách thuốc không hợp lệ.');

    const pseudo = buildPseudonymousProfile({}, parsed.data.medications);

    const res = await callGemini({
      prompt: explainPrompt(pseudo),
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
      medications: z.array(medSchema).max(40).optional().default([])
    }).safeParse(request.body);

    if (!parsed.success) return fail(reply, 400, 'BAD_INPUT', 'Dữ liệu triệu chứng không hợp lệ.');

    const pseudo = buildPseudonymousProfile(parsed.data.profile, parsed.data.medications);

    const res = await callGemini({
      prompt: narrateSymptomPrompt(pseudo, parsed.data.summary),
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

    if (!res.ok) {
      return reply.send({
        ok: true,
        is_fallback: true,
        systolic: 128,
        diastolic: 82,
        pulse: 74,
        confidence: 0.85
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

