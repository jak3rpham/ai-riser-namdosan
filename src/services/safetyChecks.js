/**
 * TẦNG 2 — Suy luận an toàn chạy nền (doc 30-Knowledge-Base.md mục 1)
 *
 * Bốn nhóm kiểm tra, chạy hoàn toàn cục bộ (không gọi AI) để kết quả
 * tái lập được và test được:
 *   1. Dị ứng      — đối chiếu đơn mới với tiền sử dị ứng đã ghi
 *   2. T15         — trùng hoạt chất giữa đơn mới và thuốc đang có ở nhà
 *   3. Thuốc–thuốc — tương tác giữa các hoạt chất
 *   4. M12         — thuốc kiêng thức ăn
 *
 * Ràng buộc (doc 30 mục 4): không tính liều, không suy ra bệnh, không khuyên
 * ngừng/đổi thuốc. Mọi cảnh báo kết thúc bằng việc đưa người dùng tới bác sĩ
 * hoặc dược sĩ.
 */

import {
  ALLERGY_CLASSES,
  DRUG_DRUG_INTERACTIONS,
  FOOD_INTERACTIONS_BY_GENERIC,
  KNOWLEDGE_STATUS,
  VITAL_THRESHOLDS,
  normalizeText,
  resolveGenerics
} from './medicalKnowledge';

export const SEVERITY_ORDER = { CRITICAL: 0, SEVERE: 1, HIGH: 2, MEDIUM: 3, MODERATE: 3, LOW: 4 };

/* ────────────────────────────────────────────────────────────────
 * 1. Kiểm tra dị ứng
 *
 * Đây là kiểm tra có hậu quả tức thì nhất (sốc phản vệ) và cũng là kiểm tra
 * rẻ nhất — chỉ cần đối chiếu hai danh sách.
 * ──────────────────────────────────────────────────────────────── */
export function checkAllergies(medications = [], allergies = []) {
  const warnings = [];
  if (!allergies.length) return warnings;

  // Ánh xạ tiền sử dị ứng (chữ người dùng tự gõ) → nhóm dị ứng chuẩn
  const matchedClasses = [];
  allergies.forEach(raw => {
    const a = normalizeText(raw);
    if (!a) return;
    const cls = ALLERGY_CLASSES.find(c => c.aliases.some(al => a.includes(normalizeText(al))));
    if (cls) matchedClasses.push({ cls, raw });
    else matchedClasses.push({ cls: null, raw });
  });

  medications.forEach(med => {
    const generics = resolveGenerics(med);
    if (!generics.length) return;

    matchedClasses.forEach(({ cls, raw }) => {
      if (!cls) {
        // Không nhận ra nhóm dị ứng → so trực tiếp tên. Không đoán thêm.
        const a = normalizeText(raw);
        if (generics.some(g => normalizeText(g) === a) || normalizeText(med.name).includes(a)) {
          warnings.push({
            type: 'ALLERGY_MATCH',
            severity: 'CRITICAL',
            title: `⛔ Trùng với dị ứng đã ghi: ${raw}`,
            description: `"${med.name}" trùng với thứ ${raw} mà hồ sơ ghi là bị dị ứng.`,
            action_recommended: 'Chưa cho uống. Gọi lại cho bác sĩ hoặc dược sĩ đã kê đơn để xác nhận.',
            source: 'Đối chiếu trực tiếp với tiền sử dị ứng trong hồ sơ.'
          });
        }
        return;
      }

      // Khớp trực tiếp trong nhóm
      const direct = generics.filter(g => cls.generics.includes(g));
      if (direct.length) {
        warnings.push({
          type: 'ALLERGY_MATCH',
          severity: 'CRITICAL',
          title: `⛔ "${med.name}" thuộc nhóm ${cls.label} — hồ sơ ghi dị ứng`,
          description: `Hoạt chất ${direct.join(', ')} nằm trong nhóm ${cls.label}. Hồ sơ ghi "${raw}" là dị ứng.`,
          action_recommended: 'Chưa cho uống viên nào. Gọi lại bác sĩ hoặc dược sĩ đã kê đơn ngay hôm nay.',
          source: 'Đối chiếu tiền sử dị ứng với bảng nhóm thuốc.'
        });
        return;
      }

      // Dị ứng chéo — mức thấp hơn nhưng vẫn phải nói
      if (cls.cross_reactive) {
        const cross = generics.filter(g => cls.cross_reactive.generics.includes(g));
        if (cross.length) {
          warnings.push({
            type: 'ALLERGY_CROSS',
            severity: 'HIGH',
            title: `⚠️ "${med.name}" có thể dị ứng chéo với ${cls.label}`,
            description: cls.cross_reactive.note,
            action_recommended: 'Hỏi lại dược sĩ hoặc bác sĩ trước liều đầu tiên.',
            source: 'Bảng dị ứng chéo trong kho kiến thức.'
          });
        }
      }
    });
  });

  return warnings;
}

/* ────────────────────────────────────────────────────────────────
 * 2. T15 — trùng hoạt chất
 *
 * So đơn MỚI với thuốc ĐANG CÓ ở nhà. Đây là kịch bản thật: bác đi khám
 * bệnh viện khác, được kê thêm thuốc cùng hoạt chất với thuốc đang uống.
 * ──────────────────────────────────────────────────────────────── */
export function checkDuplicateIngredients(newMedications = [], existingMedications = []) {
  const warnings = [];
  const seen = new Map(); // generic → bản ghi thuốc đầu tiên chứa nó

  const register = (med, origin) => {
    resolveGenerics(med).forEach(g => {
      if (seen.has(g)) {
        const prev = seen.get(g);
        if (prev.med.name === med.name && prev.origin === origin) return; // cùng một viên
        warnings.push({
          type: 'DUPLICATE_ACTIVE_INGREDIENT',
          severity: 'HIGH',
          title: `Trùng hoạt chất: ${g.toUpperCase()}`,
          description: `"${med.name}" (${origin}) và "${prev.med.name}" (${prev.origin}) cùng chứa ${g}. Uống cả hai trong ngày là dư liều mà không nhận ra.`,
          action_recommended: 'Mang cả hai vỉ thuốc cho dược sĩ xem để biết giữ loại nào. Chưa có xác nhận thì đừng uống cả hai cùng ngày.',
          source: 'Bảng ánh xạ biệt dược → hoạt chất.'
        });
      } else {
        seen.set(g, { med, origin });
      }
    });
  };

  existingMedications.forEach(m => register(m, 'đang uống ở nhà'));
  newMedications.forEach(m => register(m, 'đơn mới'));

  return warnings;
}

/* ────────────────────────────────────────────────────────────────
 * 3. Tương tác thuốc–thuốc
 * ──────────────────────────────────────────────────────────────── */
export function checkDrugInteractions(medications = []) {
  const warnings = [];

  // hoạt chất → tên thuốc chứa nó (để nói cho người dùng bằng tên họ thấy)
  const genericToNames = new Map();
  medications.forEach(med => {
    resolveGenerics(med).forEach(g => {
      if (!genericToNames.has(g)) genericToNames.set(g, new Set());
      genericToNames.get(g).add(med.name);
    });
  });

  const present = [...genericToNames.keys()];

  DRUG_DRUG_INTERACTIONS.forEach(rule => {
    const [groupA, groupB] = rule.pair;
    const hitsA = present.filter(g => groupA.includes(g));
    const hitsB = present.filter(g => groupB.includes(g));
    if (!hitsA.length || !hitsB.length) return;

    // Luật "cùng nhóm" (vd hai NSAID) cần hai hoạt chất KHÁC NHAU
    const a = hitsA[0];
    const b = hitsB.find(g => g !== a);
    if (rule.same_class_only && !b) return;
    const second = b || hitsB[0];
    if (a === second) return;

    const nameA = [...genericToNames.get(a)][0];
    const nameB = [...genericToNames.get(second)][0];

    warnings.push({
      type: 'DRUG_INTERACTION',
      severity: rule.severity,
      title: `Tương tác thuốc: ${nameA} ↔ ${nameB}`,
      description: rule.plain,
      action_recommended: rule.action,
      source: 'Bảng tương tác trong kho kiến thức (chưa được dược sĩ rà).'
    });
  });

  return warnings;
}

/* ────────────────────────────────────────────────────────────────
 * 4. M12 — thuốc kiêng thức ăn, suy từ hoạt chất thật đang uống
 * ──────────────────────────────────────────────────────────────── */
export function checkFoodInteractions(medications = []) {
  const warnings = [];
  const emitted = new Set();

  medications.forEach(med => {
    resolveGenerics(med).forEach(g => {
      (FOOD_INTERACTIONS_BY_GENERIC[g] || []).forEach(fi => {
        const key = `${g}|${fi.food}`;
        if (emitted.has(key)) return;
        emitted.add(key);

        warnings.push({
          type: 'FOOD_INTERACTION',
          severity: fi.severity,
          title: `${med.name} — nên tránh ${fi.food}`,
          description: fi.plain,
          alternative: fi.alternative,
          meal_context: fi.meal_context,
          med_name: med.name,
          generic: g,
          source: 'Bảng tương tác thuốc–thức ăn trong kho kiến thức.'
        });
      });
    });
  });

  return warnings;
}

/* ────────────────────────────────────────────────────────────────
 * Điểm vào chung
 * ──────────────────────────────────────────────────────────────── */
export function runAllSafetyChecks({ newMedications = [], existingMedications = [], memberProfile = {} } = {}) {
  const all = [...existingMedications, ...newMedications];

  const warnings = [
    ...checkAllergies(newMedications.length ? newMedications : all, memberProfile.allergies || []),
    ...checkDuplicateIngredients(newMedications, existingMedications),
    ...checkDrugInteractions(all),
    ...checkFoodInteractions(all)
  ];

  warnings.sort((x, y) => (SEVERITY_ORDER[x.severity] ?? 9) - (SEVERITY_ORDER[y.severity] ?? 9));

  // Thống kê phạm vi đã kiểm — dùng để hiển thị TRUNG THỰC là app đã kiểm
  // được tới đâu, thay cho câu "An toàn 100%" trước đây.
  const recognized = all.filter(m => resolveGenerics(m).length > 0);
  const unrecognized = all.filter(m => resolveGenerics(m).length === 0);

  return {
    warnings,
    coverage: {
      total_meds: all.length,
      recognized: recognized.length,
      unrecognized: unrecognized.map(m => m.name),
      allergies_on_file: (memberProfile.allergies || []).length,
      knowledge_version: KNOWLEDGE_STATUS.version,
      reviewed_by_pharmacist: KNOWLEDGE_STATUS.reviewed_by_pharmacist
    }
  };
}

/* ────────────────────────────────────────────────────────────────
 * 5. Diễn giải chỉ số sinh hiệu bằng ngưỡng TĨNH
 *    doc 25 mục 6 — không để AI phán cao/thấp.
 * ──────────────────────────────────────────────────────────────── */
export function evaluateVital(metric) {
  const spec = VITAL_THRESHOLDS[metric.type];
  if (!spec) {
    return { key: 'UNKNOWN', label: 'Đã ghi nhận', tone: 'neutral', message: '', notify_family: false };
  }

  const level = spec.levels.find(l => l.test(metric)) || spec.levels[spec.levels.length - 1];
  const result = {
    key: level.key,
    label: level.label,
    tone: level.tone,
    message: level.message,
    notify_family: level.notify_family,
    unit: spec.unit,
    note: spec.note || null
  };

  // Cảnh báo mạch riêng cho huyết áp
  if (spec.pulse) {
    const pulseHit = spec.pulse.find(p => p.test(metric));
    if (pulseHit) {
      result.pulse_flag = pulseHit;
      if (result.tone === 'ok') result.tone = 'caution';
    }
  }

  return result;
}
