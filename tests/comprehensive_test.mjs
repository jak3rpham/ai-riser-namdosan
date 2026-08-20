import { runTriage, classifyUtterance, traumaResponse, buildTriageResponse, OUTCOME, KIND_RANK } from '../src/services/symptomTriage.js';
import { speak, registerFor, REGISTERS } from '../src/services/honorifics.js';
import { resolveGenerics, isSpecialMissedDose, VITAL_THRESHOLDS } from '../src/services/medicalKnowledge.js';
import { checkAllergies, checkDuplicateIngredients, checkDrugInteractions, checkFoodInteractions, runAllSafetyChecks, evaluateVital } from '../src/services/safetyChecks.js';
import { INITIAL_FAMILY_MEMBERS, INITIAL_PRESCRIPTIONS, DEMO_PRESCRIPTION_MOM, DEMO_READINGS } from '../src/services/demoFixtures.js';
import { I18N_STRINGS } from '../src/services/i18n.js';
import { buildPseudonymousProfile, findIdentifiers, stripExtractionIdentifiers } from '../server/src/lib/pseudonym.js';

let pass = 0;
let fail = 0;

function assert(condition, name, details) {
  if (condition) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.error(`  ✗ FAIL: ${name}`);
    if (details) console.error(`     Details: ${JSON.stringify(details)}`);
  }
}

console.log('====================================================');
console.log('🧪 CHẠY KIỂM THỬ TOÀN DIỆN HỆ THỐNG "NHÀ MÌNH"');
console.log('====================================================\n');

// 1. Kiểm tra Dữ liệu mẫu (Demo Fixtures)
console.log('── 1. KIỂM TRA DỮ LIỆU MẪU (DEMO FIXTURES) ──');
assert(INITIAL_FAMILY_MEMBERS.length === 2, 'Có đúng 2 thành viên mẫu (Ba Mười, Mẹ Lan)', { len: INITIAL_FAMILY_MEMBERS.length });
assert(INITIAL_FAMILY_MEMBERS[0].id === 'mem_01' && INITIAL_FAMILY_MEMBERS[0].display_name === 'Ba Mười', 'Thành viên 1 là Ba Mười');
assert(INITIAL_FAMILY_MEMBERS[1].id === 'mem_02' && INITIAL_FAMILY_MEMBERS[1].display_name === 'Mẹ Lan', 'Thành viên 2 là Mẹ Lan');

assert(INITIAL_PRESCRIPTIONS.length > 0, 'Có danh sách đơn thuốc ban đầu');
const baMuoiMeds = INITIAL_PRESCRIPTIONS[0].medications;
assert(baMuoiMeds.length === 3, 'Ba Mười có 3 loại thuốc (Amlodipine, Atorvastatin, Panadol)', { count: baMuoiMeds.length });

assert(DEMO_PRESCRIPTION_MOM.member_id === 'mem_02', 'Đơn của Mẹ Lan gắn đúng member_id mem_02');
assert(DEMO_PRESCRIPTION_MOM.medications.length === 3, 'Mẹ Lan có 3 loại thuốc (Ibuprofen, Calcium D3, Glucosamine)');

assert(DEMO_READINGS.mem_01 && DEMO_READINGS.mem_01.length > 0, 'Ba Mười có số đo sinh hiệu mẫu');
assert(DEMO_READINGS.mem_02 && DEMO_READINGS.mem_02.length > 0, 'Mẹ Lan có số đo sinh hiệu mẫu');

// 2. Kiểm tra Hệ thống Đa ngôn ngữ (i18n)
console.log('\n── 2. KIỂM TRA NGÔN NGỮ (i18n) ──');
assert(!!I18N_STRINGS.vi && !!I18N_STRINGS.en, 'Có đủ từ điển tiếng Việt (vi) và tiếng Anh (en)');
const viKeys = Object.keys(I18N_STRINGS.vi);
const enKeys = Object.keys(I18N_STRINGS.en);
const missingInEn = viKeys.filter(k => !(k in I18N_STRINGS.en));
const missingInVi = enKeys.filter(k => !(k in I18N_STRINGS.vi));
assert(missingInEn.length === 0, 'Từ điển tiếng Anh đầy đủ key như tiếng Việt', { missingInEn });
assert(missingInVi.length === 0, 'Từ điển tiếng Việt đầy đủ key như tiếng Anh', { missingInVi });

// 3. Kiểm tra Tương tác Thức ăn (Food Interaction)
console.log('\n── 3. KIỂM TRA TƯƠNG TÁC THUỐC - THỨC ĂN (M12) ──');
const foodWarnsAmlodipine = checkFoodInteractions([{ name: 'Amlodipine 5mg', generic: 'amlodipine' }]);
assert(foodWarnsAmlodipine.some(w => w.title.toLowerCase().includes('bưởi') || w.generic === 'amlodipine'), 'Amlodipine có cảnh báo kiêng bưởi / bưởi chùm');

const foodWarnsAtorvastatin = checkFoodInteractions([{ name: 'Atorvastatin 10mg', generic: 'atorvastatin' }]);
assert(foodWarnsAtorvastatin.some(w => w.generic === 'atorvastatin'), 'Atorvastatin có cảnh báo thức ăn tương tác');

// 4. Kiểm tra Toàn diện An Toàn (runAllSafetyChecks)
console.log('\n── 4. KIỂM TRA TỔNG HỢP AN TOÀN (runAllSafetyChecks) ──');
const safetyResultClean = runAllSafetyChecks({
  newMedications: DEMO_PRESCRIPTION_MOM.medications,
  existingMedications: [],
  memberProfile: INITIAL_FAMILY_MEMBERS[1]
});
assert(safetyResultClean.warnings.length === 0 || safetyResultClean.warnings.every(w => w.severity !== 'CRITICAL'), 'Đơn mẫu Mẹ Lan không có lỗi CRITICAL');
assert(safetyResultClean.coverage.total_meds === 3, 'Coverage tính đúng tổng số thuốc', { coverage: safetyResultClean.coverage });

// Kiểm tra phát hiện xung đột nguy hiểm
const safetyConflict = runAllSafetyChecks({
  newMedications: [{ name: 'Warfarin 2mg', generic: 'warfarin' }],
  existingMedications: [{ name: 'Ibuprofen 400mg', generic: 'ibuprofen' }],
  memberProfile: { allergies: ['Penicillin'] }
});
assert(safetyConflict.warnings.some(w => w.type === 'DRUG_INTERACTION' && w.severity === 'SEVERE'), 'Bắt được tương tác nặng Warfarin + Ibuprofen');

// 5. Kiểm tra Sinh hiệu (evaluateVital)
console.log('\n── 5. KIỂM TRA ĐÁNH GIÁ CHỈ SỐ SINH HIỆU ──');
const normalBP = evaluateVital({ type: 'BLOOD_PRESSURE', sys: 120, dia: 80, pulse: 72 });
assert(normalBP.tone === 'ok', 'Huyết áp 120/80 là bình thường (tone: ok)', normalBP);

const highBP = evaluateVital({ type: 'BLOOD_PRESSURE', sys: 165, dia: 105, pulse: 80 });
assert(highBP.tone === 'warn' && highBP.key === 'HIGH', 'Huyết áp 165/105 là mức cao (HIGH/warn)', highBP);

const lowSugar = evaluateVital({ type: 'BLOOD_SUGAR', val: 3.2 });
assert(lowSugar.tone === 'warn' && lowSugar.key === 'LOW', 'Đường huyết 3.2 mmol/L báo động hạ đường huyết (LOW/warn)', lowSugar);

const highSugar = evaluateVital({ type: 'BLOOD_SUGAR', val: 14.5 });
assert(highSugar.tone === 'critical' && highSugar.key === 'CRITICAL_HIGH', 'Đường huyết 14.5 mmol/L báo động tăng đường huyết (CRITICAL_HIGH/critical)', highSugar);

// 6. Kiểm tra Xưng hô & Giọng điệu (Honorifics)
console.log('\n── 6. KIỂM TRA XƯNG HÔ THEO ĐỘ TUỔI (HONORIFICS) ──');
const regElder = registerFor({ birth_year: 1958 });
assert(regElder.you === 'bác' && regElder.me === 'con', 'Người sinh năm 1958 (68t): xưng con - gọi bác');

const regPeer = registerFor({ birth_year: 1996 });
assert(regPeer.you === 'bạn' && regPeer.me === 'mình', 'Người sinh năm 1996 (30t): xưng mình - gọi bạn');

const promptElder = speak('{{Da}} {{you}} ơi, {{me}} đã chuẩn bị thuốc cho {{you}} rồi{{a}}.', regElder);
assert(promptElder.includes('bác') && promptElder.includes('con') && promptElder.includes('ạ') && promptElder.startsWith('Dạ'), 'Câu xưng hô người cao tuổi chuẩn xác');

const promptPeer = speak('{{Da}} {{you}} ơi, {{me}} đã chuẩn bị thuốc cho {{you}} rồi{{a}}.', regPeer);
assert(!promptPeer.toLowerCase().includes('bác') && !promptPeer.includes(' ạ') && !promptPeer.endsWith('ạ.') && promptPeer.toLowerCase().includes('bạn') && promptPeer.includes('mình'), 'Câu xưng hô người trẻ tuổi không bị lẫn "bác" hay "ạ"');

// 7. Kiểm tra Backend Pseudonymization (Bảo vệ thông tin PII)
console.log('\n── 7. KIỂM TRA BÍ DANH HÓA BACKEND (PSEUDONYMIZATION) ──');
const rawUserData = {
  id: 'usr_99',
  display_name: 'Nguyễn Văn Test',
  birth_year: 1955,
  phone: '0987654321',
  email: 'test@example.com',
  conditions: ['Tiểu đường type 2'],
  allergies: ['Aspirin']
};
const rawMeds = [{
  id: 'm99',
  name: 'Glucophage 500mg',
  generic: 'metformin',
  doctor_name: 'BS Lê Văn B'
}];

const pseudo = buildPseudonymousProfile(rawUserData, rawMeds);
assert(pseudo.display_name === undefined, 'Đã xoá display_name');
assert(pseudo.phone === undefined, 'Đã xoá phone');
assert(pseudo.email === undefined, 'Đã xoá email');
assert(pseudo.age_band === '70-74', 'Đã chuyển birth_year sang age_band 70-74', { band: pseudo.age_band });
assert(pseudo.medications[0].doctor_name === undefined, 'Đã xoá doctor_name khỏi thuốc');
assert(findIdentifiers(pseudo).length === 0, 'Rà soát đệ quy không phát hiện PII còn sót');

console.log(`\n════════════════════════════════════════════════════════`);
console.log(`  KẾT QUẢ: ${pass} KIỂM THỬ ĐẠT · ${fail} THẤT BẠI`);
console.log(`════════════════════════════════════════════════════════\n`);

if (fail > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
