/**
 * Đọc thành tiếng — giọng Cháu Bi.
 *
 * ═══════════════════════════════════════════════════════════════════
 *  VÌ SAO KHÔNG DÙNG GIỌNG CỦA TRÌNH DUYỆT NỮA
 *
 *  Bản trước gọi `speechSynthesis` ngay trên máy người dùng. Nó miễn phí và
 *  chạy offline, nhưng giọng do MÁY NGƯỜI DÙNG quyết định — app không chỉnh
 *  được gì ngoài tốc độ đọc. Trên phần lớn máy Việt Nam, giọng vi-VN mặc định
 *  đọc đều một nhịp, không ngắt câu, không nhấn.
 *
 *  Cả sản phẩm này bán một cảm giác: có đứa cháu ngồi cạnh nói chuyện với bác.
 *  Giọng máy đọc phá đúng cái đó, ngay giây đầu tiên.
 *
 *  ⚠️ ĐÂY LÀ LỚP TĂNG CƯỜNG, KHÔNG PHẢI LỚP BẮT BUỘC.
 *  Hỏng, hết quota, hay model không có → frontend TỰ ĐỘNG quay lại
 *  speechSynthesis. Không bao giờ để câu cảnh báo cấp cứu bị câm chỉ vì
 *  TTS lỗi. Xem `speakText` trong VoiceAssistantModal.jsx.
 * ═══════════════════════════════════════════════════════════════════
 */

import { config } from './config.js';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Bộ nhớ đệm trong tiến trình.
 *
 * Câu cố định (chào hỏi, câu chặn đổi liều, lời khuyên té ngã) lặp lại rất
 * nhiều lần với đúng một nội dung. Không đệm thì mỗi lần mở app là một lần
 * đốt quota — mà từ 15/08 đã bật Blaze nên vượt quota là mất tiền thật.
 *
 * Cloud Run có thể chạy nhiều instance nên đệm này không dùng chung được;
 * chấp nhận, vì nó chỉ để giảm chi phí chứ không để đảm bảo đúng đắn.
 */
const cache = new Map();
const CACHE_MAX = 120;

function cacheGet(key) {
  if (!cache.has(key)) return null;
  const v = cache.get(key);
  cache.delete(key);       // đưa lên đầu, LRU thủ công
  cache.set(key, v);
  return v;
}

function cacheSet(key, value) {
  cache.set(key, value);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
}

/**
 * Gemini TTS trả PCM 16-bit thô, không có header. Thẻ <audio> của trình duyệt
 * không phát được dữ liệu trần — phải bọc header WAV 44 byte.
 */
function pcmToWav(pcm, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
  const blockAlign = channels * bitsPerSample / 8;
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);           // độ dài khối fmt
  header.writeUInt16LE(1, 20);            // 1 = PCM không nén
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

/** Đọc sample rate từ chuỗi mimeType kiểu `audio/L16;codec=pcm;rate=24000` */
function rateFromMime(mime) {
  const m = /rate=(\d+)/.exec(mime || '');
  return m ? Number(m[1]) : 24000;
}

/**
 * Chỉ dẫn diễn đạt. Gemini TTS nhận hướng dẫn bằng lời ngay trong prompt —
 * đây là chỗ biến "máy đọc" thành "người nói".
 */
function styleFor(register) {
  const who = register === 'peer'
    ? 'một người bạn cùng tuổi, thân mật và gần gũi'
    : 'một đứa cháu đang ngồi cạnh nói chuyện với ông bà mình';

  return `Đọc đoạn dưới đây bằng giọng Việt Nam tự nhiên, như ${who}.
Nói chậm rãi, rõ từng chữ, ngắt nghỉ đúng chỗ có dấu phẩy và dấu chấm.
Giọng ấm, quan tâm thật lòng — không phải giọng đọc bản tin, không phải tổng đài.
Nếu nội dung là lời dặn khẩn cấp thì nói rõ ràng và dứt khoát, nhưng KHÔNG hoảng hốt:
người nghe đang lo rồi, giọng hoảng làm họ luống cuống thêm.

Đọc đúng nội dung sau, không thêm bớt chữ nào:`;
}

/**
 * @returns {{ok:true, audio:string, mime:string, cached:boolean}}
 *        | {ok:false, code:string, message:string}
 */
export async function synthesizeSpeech({ text, register = 'elder', voice, log }) {
  const clean = String(text || '').trim();
  if (!clean) return { ok: false, code: 'EMPTY_TEXT', message: 'Không có nội dung để đọc.' };

  const voiceName = voice || config.ttsVoice;
  const key = `${config.ttsModel}|${voiceName}|${register}|${clean}`;

  const hit = cacheGet(key);
  if (hit) return { ok: true, audio: hit, mime: 'audio/wav', cached: true };

  const body = {
    contents: [{ parts: [{ text: `${styleFor(register)}\n\n${clean}` }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName } }
      }
    }
  };

  let res;
  try {
    res = await fetch(`${ENDPOINT}/${config.ttsModel}:generateContent`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': config.geminiApiKey
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000)
    });
  } catch (err) {
    log?.warn({ err: String(err?.message || err) }, 'TTS: không gọi được');
    return { ok: false, code: 'TTS_UNREACHABLE', message: 'Không gọi được dịch vụ đọc.' };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    // 404 = model TTS không có trên khoá này. Đây là trạng thái BÌNH THƯỜNG
    // và phải nói ra rõ ràng, để frontend biết đường quay về giọng trình duyệt
    // thay vì im lặng.
    const code = res.status === 404 ? 'TTS_MODEL_UNAVAILABLE'
      : res.status === 429 ? 'TTS_QUOTA'
      : 'TTS_ERROR';
    log?.warn({ status: res.status, detail: detail.slice(0, 300) }, 'TTS: máy chủ từ chối');
    return { ok: false, code, message: 'Chưa đọc được bằng giọng này.' };
  }

  const data = await res.json().catch(() => null);
  const part = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);

  if (!part) {
    log?.warn({ data: JSON.stringify(data).slice(0, 300) }, 'TTS: phản hồi không có audio');
    return { ok: false, code: 'TTS_NO_AUDIO', message: 'Dịch vụ đọc không trả về âm thanh.' };
  }

  const pcm = Buffer.from(part.inlineData.data, 'base64');
  const wav = pcmToWav(pcm, rateFromMime(part.inlineData.mimeType)).toString('base64');

  cacheSet(key, wav);
  return { ok: true, audio: wav, mime: 'audio/wav', cached: false };
}
