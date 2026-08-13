/**
 * Golden Set — bộ đo độ chính xác trích xuất đơn thuốc (doc 25 mục 7)
 *
 * ⚠️ THAY ĐỔI QUAN TRỌNG (doc 33 mục 5)
 * Bản trước KHÔNG chạy gì cả: `runGoldenSetBenchmark` chỉ `setTimeout(400)` rồi
 * trả về các con số `expected_field_accuracy` (98.2 / 97.8 / 96.5 / 92.4 / 94.1)
 * viết sẵn ở đầu file, và gán `status: "PASSED"` cho mọi case. Không có ảnh,
 * không có đáp án đúng, không gọi Gemini. Comment ghi "15 real test cases"
 * trong khi file chỉ có 5.
 *
 * Đưa con số kiểu đó vào bài nộp là số liệu sai trong hồ sơ dự thi — rủi ro lớn
 * hơn nhiều so với việc không có số nào.
 *
 * File này giờ là BỘ CHẠY THẬT. Nó cần dataset thật (ảnh + đáp án tự ghi tay).
 * Chưa có dataset thì nó báo "chưa đo", không sinh số.
 */

import { extractPrescriptionFromImage } from './geminiService';
import { normalizeText } from './medicalKnowledge';

/**
 * Dataset thật cần nạp vào đây. Mỗi case:
 * {
 *   id, title, type, difficulty,
 *   image_base64: 'data:image/jpeg;base64,...',   // ảnh đơn thật
 *   ground_truth: {                                // đáp án TỰ GHI TAY
 *     medications: [{ name, strength, dosage, frequency, duration_days }]
 *   }
 * }
 *
 * 🔲 VIỆC PHẢI LÀM: thu 15–20 ảnh đơn thật (đơn in bệnh viện, đơn viết tay
 *    phòng khám tư, túi thuốc nhà thuốc, vỏ vỉ mờ), tự ghi đáp án, nạp vào đây.
 *    Đây là việc tốn công nhất nhưng cũng là bằng chứng an toàn mạnh nhất
 *    của bài nộp.
 */
export const GOLDEN_SET_CASES = [];

/** Các trường được chấm, và trọng số bằng nhau */
const SCORED_FIELDS = ['name', 'strength', 'dosage', 'frequency', 'duration_days'];

export const BENCHMARK_STATUS = {
  has_dataset: GOLDEN_SET_CASES.length > 0,
  case_count: GOLDEN_SET_CASES.length,
  last_run: null,
  note: GOLDEN_SET_CASES.length === 0
    ? 'Chưa có dataset. Chưa đo được độ chính xác — không có số nào để báo cáo.'
    : null
};

/** So hai giá trị của cùng một trường. Trả về true nếu coi là khớp. */
function fieldMatches(field, expected, actual) {
  if (expected == null && actual == null) return true;
  if (expected == null || actual == null) return false;

  if (field === 'duration_days') {
    return parseInt(expected, 10) === parseInt(actual, 10);
  }

  const e = normalizeText(String(expected));
  const a = normalizeText(String(actual));
  if (!e || !a) return false;

  // khớp mềm: một bên chứa bên kia (vd "amlodipin" vs "amlodipine 5mg")
  return e === a || e.includes(a) || a.includes(e);
}

/**
 * Ghép thuốc trong đáp án với thuốc AI đọc được, theo tên gần nhất.
 * Trả về { matched: [[expected, actual]], missed: [expected], extra: [actual] }
 */
function alignMedications(expectedList, actualList) {
  const remaining = [...actualList];
  const matched = [];
  const missed = [];

  expectedList.forEach(exp => {
    const idx = remaining.findIndex(act => fieldMatches('name', exp.name, act.name));
    if (idx >= 0) {
      matched.push([exp, remaining[idx]]);
      remaining.splice(idx, 1);
    } else {
      missed.push(exp);
    }
  });

  return { matched, missed, extra: remaining };
}

/**
 * Chạy benchmark THẬT: gọi Gemini trên từng ảnh, so với đáp án tự ghi.
 *
 * Không có dataset → trả về trạng thái NOT_MEASURED. Hàm này KHÔNG BAO GIỜ
 * sinh ra con số khi chưa thật sự đo.
 */
export async function runGoldenSetBenchmark(onProgress) {
  if (GOLDEN_SET_CASES.length === 0) {
    return {
      status: 'NOT_MEASURED',
      timestamp: new Date().toISOString(),
      total_cases: 0,
      message: 'Chưa nạp dataset đơn thuốc thật nên chưa đo được. Xem hướng dẫn trong benchmarkService.js.',
      results: []
    };
  }

  const results = [];
  let totalFields = 0;
  let correctFields = 0;
  let totalLatency = 0;

  for (let i = 0; i < GOLDEN_SET_CASES.length; i++) {
    const testCase = GOLDEN_SET_CASES[i];
    const started = performance.now();

    const extraction = await extractPrescriptionFromImage(testCase.image_base64);
    const latency = Math.round(performance.now() - started);
    totalLatency += latency;

    if (!extraction.ok) {
      results.push({
        ...testCase,
        image_base64: undefined,
        status: 'EXTRACTION_FAILED',
        error_code: extraction.error_code,
        field_accuracy: 0,
        latency_ms: latency
      });
      totalFields += (testCase.ground_truth.medications.length || 0) * SCORED_FIELDS.length;
      onProgress?.(i + 1, GOLDEN_SET_CASES.length, results[results.length - 1]);
      continue;
    }

    const { matched, missed, extra } = alignMedications(
      testCase.ground_truth.medications,
      extraction.medications
    );

    let caseTotal = 0;
    let caseCorrect = 0;
    const fieldErrors = [];

    matched.forEach(([exp, act]) => {
      SCORED_FIELDS.forEach(f => {
        caseTotal++;
        if (fieldMatches(f, exp[f], act[f])) caseCorrect++;
        else fieldErrors.push({ med: exp.name, field: f, expected: exp[f], got: act[f] });
      });
    });

    // Thuốc bị bỏ sót tính là sai TOÀN BỘ trường — bỏ sót một thuốc nguy hiểm
    // hơn đọc sai một trường, không được giấu nó trong trung bình.
    missed.forEach(exp => {
      caseTotal += SCORED_FIELDS.length;
      fieldErrors.push({ med: exp.name, field: '*', expected: 'có trong đơn', got: 'KHÔNG ĐỌC RA' });
    });

    totalFields += caseTotal;
    correctFields += caseCorrect;

    const accuracy = caseTotal > 0 ? (caseCorrect / caseTotal) * 100 : 0;

    const caseResult = {
      ...testCase,
      image_base64: undefined,
      status: missed.length === 0 && accuracy === 100 ? 'PASSED' : 'PARTIAL',
      field_accuracy: parseFloat(accuracy.toFixed(1)),
      meds_expected: testCase.ground_truth.medications.length,
      meds_found: matched.length,
      meds_missed: missed.length,
      meds_hallucinated: extra.length,
      field_errors: fieldErrors,
      latency_ms: latency
    };

    results.push(caseResult);
    onProgress?.(i + 1, GOLDEN_SET_CASES.length, caseResult);
  }

  return {
    status: 'MEASURED',
    timestamp: new Date().toISOString(),
    total_cases: GOLDEN_SET_CASES.length,
    overall_accuracy: totalFields > 0 ? parseFloat(((correctFields / totalFields) * 100).toFixed(1)) : 0,
    total_missed_meds: results.reduce((s, r) => s + (r.meds_missed || 0), 0),
    total_hallucinated_meds: results.reduce((s, r) => s + (r.meds_hallucinated || 0), 0),
    avg_latency_ms: Math.round(totalLatency / GOLDEN_SET_CASES.length),
    results
  };
}
