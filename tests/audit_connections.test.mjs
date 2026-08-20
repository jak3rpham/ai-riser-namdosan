import { runAllSafetyChecks, evaluateVital, checkAllergies, checkDuplicateIngredients, checkDrugInteractions, checkFoodInteractions } from '../src/services/safetyChecks.js';
import { runTriage, classifyUtterance, traumaResponse, buildTriageResponse, OUTCOME } from '../src/services/symptomTriage.js';
import { resolveGenerics, isSpecialMissedDose, VITAL_THRESHOLDS, normalizeText } from '../src/services/medicalKnowledge.js';
import { speak, registerFor, REGISTERS, registerBrief } from '../src/services/honorifics.js';
import { buildPseudonymousProfile, findIdentifiers, stripExtractionIdentifiers } from '../server/src/lib/pseudonym.js';
import { INITIAL_FAMILY_MEMBERS, INITIAL_PRESCRIPTIONS } from '../src/services/demoFixtures.js';
import { I18N_STRINGS } from '../src/services/i18n.js';

let auditPass = 0;
let auditFail = 0;

function audit(name, fn) {
  try {
    const result = fn();
    if (result !== false) {
      auditPass++;
      console.log(`  ✅ [PASS] ${name}`);
    } else {
      auditFail++;
      console.error(`  ❌ [FAIL] ${name}`);
    }
  } catch (err) {
    auditFail++;
    console.error(`  ❌ [ERROR] ${name}:`, err.message);
  }
}

console.log('═══════════════════════════════════════════════════════════');
console.log('🔍 AUDIT TOÀN DIỆN HỆ THỐNG: FUNCTIONS, CONNECTIONS & SAFETY');
console.log('═══════════════════════════════════════════════════════════\n');

// ── 1. AUDIT KHẢ NĂNG CHỐNG LỖI VỚI DỮ LIỆU BẤT THƯỜNG (EDGE CASES) ──
console.log('1. AUDIT KHẢ NĂNG CHỐNG CRASH / RESILIENCE VỚI DỮ LIỆU BẤT THƯỜNG:');

audit('runAllSafetyChecks với tham số rỗng/null/undefined không bị crash', () => {
  const r1 = runAllSafetyChecks();
  const r2 = runAllSafetyChecks({});
  const r3 = runAllSafetyChecks({ newMedications: null, existingMedications: undefined, memberProfile: null });
  return r1.warnings.length === 0 && r2.warnings.length === 0 && r3.warnings.length === 0;
});

audit('resolveGenerics với thuốc rỗng, thuốc không có tên, thuốc null', () => {
  const r1 = resolveGenerics(null);
  const r2 = resolveGenerics({});
  const r3 = resolveGenerics({ name: '' });
  const r4 = resolveGenerics({ name: 'Thuốc Chưa Biết Tên 123' });
  return Array.isArray(r1) && r1.length === 0 &&
         Array.isArray(r2) && r2.length === 0 &&
         Array.isArray(r3) && r3.length === 0 &&
         Array.isArray(r4) && r4.length === 0;
});

audit('evaluateVital với các chỉ số sinh hiệu dị thường (âm, số cực lớn, kiểu dữ liệu lạ)', () => {
  const v1 = evaluateVital({});
  const v2 = evaluateVital({ type: 'UNKNOWN_TYPE' });
  const v3 = evaluateVital({ type: 'BLOOD_PRESSURE', sys: 300, dia: 180, pulse: 190 });
  const v4 = evaluateVital({ type: 'BLOOD_SUGAR', val: 0.1 });
  const v5 = evaluateVital({ type: 'BLOOD_SUGAR', val: 45 });
  return v1.key === 'UNKNOWN' && v2.key === 'UNKNOWN' &&
         v3.tone === 'critical' && v4.tone === 'critical' && v5.tone === 'critical';
});

audit('symptomTriage với đầu vào rỗng hoặc câu nói không có nghĩa', () => {
  const c1 = classifyUtterance('');
  const c2 = classifyUtterance('123456 abcxyz ?!?');
  const t1 = runTriage({}, {});
  return c1.kind === 'NOT_SYMPTOM' && c2.kind === 'NOT_SYMPTOM' && t1.outcome === OUTCOME.LOG_AND_NOTIFY;
});

// ── 2. AUDIT CƠ CHẾ BẢO VỆ RIÊNG TƯ & AN TOÀN Y TẾ ──
console.log('\n2. AUDIT CƠ CHẾ BẢO VỆ RIÊNG TƯ & AN TOÀN Y TẾ:');

audit('Bí danh hóa triệt để khi profile chứa nested PII đa tầng', () => {
  const dirtyProfile = {
    id: 'user_123',
    display_name: 'Trần Văn Demo',
    birth_year: 1950,
    phone: '0912345678',
    email: 'demo@gmail.com',
    emergency_contact: 'Con gái: 0987654321',
    address: '123 Đường Lê Lợi, Q1, TP.HCM',
    conditions: ['Huyết áp cao', 'Tiểu đường'],
    allergies: ['Penicillin']
  };
  const dirtyMeds = [
    { id: 'm1', name: 'Amlodipine 5mg', generic: 'amlodipine', doctor_name: 'BS Lê Văn B', facility: 'BV Chợ Rẫy' },
    { id: 'm2', name: 'Panadol Extra', generic: 'paracetamol + caffeine', pharmacy: 'Long Châu' }
  ];
  const cleaned = buildPseudonymousProfile(dirtyProfile, dirtyMeds);
  const remainingPII = findIdentifiers(cleaned);
  return remainingPII.length === 0 &&
         cleaned.display_name === undefined &&
         cleaned.phone === undefined &&
         cleaned.email === undefined &&
         cleaned.address === undefined &&
         cleaned.age_band === '75-79' &&
         cleaned.medications[0].doctor_name === undefined &&
         cleaned.medications[0].facility === undefined;
});

audit('Rà soát chẩn đoán và trích xuất không rò rỉ tên bác sĩ hay bệnh viện', () => {
  const ocrData = {
    doctor_name: 'PGS.TS Nguyễn Văn Giỏi',
    facility_name: 'Bệnh viện Bạch Mai - Khoa Tim Mạch',
    diagnosis: 'Thiếu máu cơ tim cục bộ',
    medications: [{ name: 'Concor 5mg', generic: 'bisoprolol' }]
  };
  const stripped = stripExtractionIdentifiers(ocrData);
  return stripped.doctor_name === undefined &&
         stripped.facility_name === undefined &&
         stripped.diagnosis === 'Thiếu máu cơ tim cục bộ' &&
         stripped.had_doctor_name === true &&
         stripped.had_facility_name === true;
});

// ── 3. AUDIT KẾT NỐI TƯƠNG TÁC THUỐC ĐA THUỐC PHỨC TẠP ──
console.log('\n3. AUDIT LOGIC PHÁT HIỆN TƯƠNG TÁC ĐA THUỐC PHỨC TẠP:');

audit('Phát hiện đồng thời nhiều cặp tương tác thuốc trong 1 đơn', () => {
  const complexMeds = [
    { name: 'Warfarin 2mg', generic: 'warfarin' },
    { name: 'Ibuprofen 400mg', generic: 'ibuprofen' },
    { name: 'Aspirin 81mg', generic: 'aspirin' },
    { name: 'Augmentin 625mg', generic: 'amoxicillin + clavulanate' }
  ];
  const profile = { allergies: ['Penicillin'] };
  const check = runAllSafetyChecks({ newMedications: complexMeds, memberProfile: profile });
  
  const hasAllergy = check.warnings.some(w => w.type === 'ALLERGY_MATCH' && w.severity === 'CRITICAL');
  const hasWarfarinIbu = check.warnings.some(w => w.type === 'DRUG_INTERACTION' && w.severity === 'SEVERE');
  const hasWarfarinAsp = check.warnings.some(w => w.type === 'DRUG_INTERACTION');
  
  return hasAllergy && hasWarfarinIbu && hasWarfarinAsp;
});

// ── 4. AUDIT HỆ THỐNG XƯNG HÔ THEO ĐỘ TUỔI & NGỮ CẢNH ──
console.log('\n4. AUDIT HỆ THỐNG XƯNG HÔ THEO ĐỘ TUỔI & NGỮ CẢNH:');

audit('registerBrief trả về đúng id cho server prompt', () => {
  const rElder = registerBrief({ birth_year: 1950 });
  const rPeer = registerBrief({ birth_year: 1998 });
  const rManual = registerBrief({ address_style: 'peer' });
  return rElder === 'elder' && rPeer === 'peer' && rManual === 'peer';
});

audit('speak() xử lý sạch thẻ mở đầu và thẻ kết thúc câu', () => {
  const template = '{{Da}} {{you}} kiểm tra lại giúp {{me}}{{a}}.';
  const outElder = speak(template, { birth_year: 1955 });
  const outPeer = speak(template, { birth_year: 1995 });
  
  const elderOk = outElder.startsWith('Dạ') && outElder.includes('bác') && outElder.includes('con') && outElder.endsWith(' ạ.');
  const peerOk = !outPeer.startsWith('Dạ') && outPeer.toLowerCase().includes('bạn') && outPeer.includes('mình') && !outPeer.includes(' ạ') && outPeer.endsWith('.');
  return elderOk && peerOk;
});

// ── 5. AUDIT TÍNH TOÀN VẸN CỦA DỮ LIỆU ĐA NGÔN NGỮ (I18N) ──
console.log('\n5. AUDIT TOÀN VẸN ĐA NGÔN NGỮ (I18N):');

audit('Mọi key trong I18N_STRINGS.vi đều có bản dịch không rỗng trong I18N_STRINGS.en', () => {
  const viKeys = Object.keys(I18N_STRINGS.vi);
  return viKeys.every(k => typeof I18N_STRINGS.en[k] === 'string' && I18N_STRINGS.en[k].trim().length > 0);
});

console.log('\n═══════════════════════════════════════════════════════════');
console.log(`📊 TỔNG KẾT AUDIT: ${auditPass} KIỂM TRA ĐẠT · ${auditFail} LỖI`);
console.log('═══════════════════════════════════════════════════════════\n');

if (auditFail > 0) process.exit(1);
process.exit(0);
