/**
 * Bí danh hoá hồ sơ trước khi gửi cho AI — doc 38 mục 10.
 *
 * ⚠️ Hàm này là CỬA DUY NHẤT. Không route nào được dựng prompt từ dữ liệu thô
 * do client gửi lên. Client gửi gì kệ nó, server tự cắt — client không đáng tin.
 *
 * Nguyên tắc: giữ thứ cần cho suy luận lâm sàng, cắt thứ định danh.
 * Hai nhóm đó gần như không giao nhau.
 */

/** Trường tuyệt đối không được lọt sang Gemini */
const FORBIDDEN_FIELDS = [
  'display_name', 'name', 'full_name', 'patient_name',
  'birth_year', 'birth_date', 'dob',
  'doctor_name', 'facility_name', 'hospital',
  'phone', 'email', 'address', 'insurance_id', 'patient_id',
  'photo_url', 'avatar', 'uid', 'member_id', 'id'
];

/** Ngày sinh chính xác là mảnh ghép định danh mạnh; dải tuổi thì không. */
function ageBand(birthYear) {
  if (!birthYear) return null;
  const age = new Date().getFullYear() - Number(birthYear);
  if (!Number.isFinite(age) || age < 0 || age > 120) return null;
  const lo = Math.floor(age / 5) * 5;
  return `${lo}-${lo + 4}`;
}

/**
 * Dựng hồ sơ bí danh từ dữ liệu client gửi lên.
 * @param {object} profile - hồ sơ thô (có thể chứa định danh)
 * @param {Array}  medications - danh sách thuốc
 */
export function buildPseudonymousProfile(profile = {}, medications = []) {
  return {
    subject_ref: profile.subject_ref || 'sbj_unknown',
    age_band: ageBand(profile.birth_year),
    conditions: Array.isArray(profile.conditions) ? profile.conditions.slice(0, 12) : [],
    allergies: Array.isArray(profile.allergies) ? profile.allergies.slice(0, 12) : [],
    medications: (medications || []).slice(0, 30).map(m => ({
      generic: m.generic || null,
      name: m.name || null,          // tên thuốc cần cho lâm sàng, không định danh người
      strength: m.strength || null,
      dosage: m.dosage || null,
      timing: m.timing || null,
      frequency: m.frequency || null,
      days_remaining: Number.isFinite(m.est_remaining) ? m.est_remaining : null,
      special_missed_dose: !!m.special_missed_dose
    })),
    recent_vitals: (profile.recent_vitals || []).slice(0, 10),
    recent_symptoms: (profile.recent_symptoms || []).slice(0, 10)
  };
}

/**
 * Chốt chặn cuối: rà đệ quy xem còn trường định danh nào lọt không.
 * Dùng trong test, và chạy luôn lúc phát triển để bắt lỗi sớm.
 */
export function findIdentifiers(obj, path = '') {
  const found = [];
  if (obj === null || typeof obj !== 'object') return found;

  if (Array.isArray(obj)) {
    obj.forEach((v, i) => found.push(...findIdentifiers(v, `${path}[${i}]`)));
    return found;
  }

  for (const [k, v] of Object.entries(obj)) {
    const here = path ? `${path}.${k}` : k;
    // `name` bên trong medications là tên THUỐC, không phải tên người
    const isMedName = k === 'name' && /medications\[\d+\]$/.test(path);
    if (FORBIDDEN_FIELDS.includes(k) && !isMedName) found.push(here);
    found.push(...findIdentifiers(v, here));
  }
  return found;
}

/** Cắt định danh khỏi kết quả trích xuất đơn thuốc trước khi trả về client */
export function stripExtractionIdentifiers(extraction) {
  if (!extraction || typeof extraction !== 'object') return extraction;
  const { doctor_name, facility_name, patient, patient_name, ...rest } = extraction;
  return {
    ...rest,
    // Giữ cờ báo có đọc được hay không, để UI biết mà nói, nhưng bỏ nội dung
    had_doctor_name: !!doctor_name,
    had_facility_name: !!facility_name
  };
}
