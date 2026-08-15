import { runTriage, classifyUtterance, traumaResponse, OUTCOME } from '../src/services/symptomTriage.js';
import { resolveGenerics, isSpecialMissedDose } from '../src/services/medicalKnowledge.js';
import { checkAllergies, checkDuplicateIngredients, checkDrugInteractions, evaluateVital } from '../src/services/safetyChecks.js';

let pass = 0, fail = 0;
const t = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}\n      mong đợi: ${JSON.stringify(expected)}\n      thực tế:  ${JSON.stringify(actual)}`); }
};

const cardiacCtx = { generics: ['amlodipine', 'atorvastatin'], age: 68 };

/** Bỏ dấu để kiểm tra nội dung lời khuyên không phụ thuộc cách gõ dấu */
function normalize(t) {
  return String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
}

console.log('\n── A. Ca mà bộ keyword cũ BỎ SÓT ──');

// Ba Mười 68t, uống Amlodipine+Atorvastatin: "đau bụng trên, buồn nôn, vã mồ hôi"
t('Đau thượng vị + vã mồ hôi (NMCT thành dưới) → 115',
  runTriage({ region: 'epigastric', onset: 'today', severity: 'moderate', accompanying: ['sweating', 'nausea'] }, cardiacCtx).outcome,
  OUTCOME.EMERGENCY_115);

t('Đau thượng vị + buồn nôn, người 68t có bệnh tim mạch → 115',
  runTriage({ region: 'epigastric', onset: 'today', severity: 'moderate', accompanying: ['nausea'] }, cardiacCtx).outcome,
  OUTCOME.EMERGENCY_115);

t('Bụng dưới phải + sốt (ruột thừa) → khám 24h',
  runTriage({ region: 'rlq', onset: 'today', severity: 'moderate', accompanying: ['fever'] }, cardiacCtx).outcome,
  OUTCOME.SEE_DOCTOR_24H);

t('Đau bắp chân + nước tiểu sẫm khi uống statin (tiêu cơ vân) → khám 24h',
  runTriage({ region: 'leg', onset: 'few_days', severity: 'moderate', accompanying: ['dark_urine'] }, cardiacCtx).outcome,
  OUTCOME.SEE_DOCTOR_24H);

t('Mệt toàn thân + khó thở khi uống metformin (toan lactic) → 115',
  runTriage({ region: 'whole', onset: 'today', severity: 'moderate', accompanying: ['dyspnea'] }, { generics: ['metformin'], age: 65 }).outcome,
  OUTCOME.EMERGENCY_115);

t('Yếu nửa người (đột quỵ) → 115',
  runTriage({ region: 'head', onset: 'sudden', severity: 'mild', accompanying: ['weakness_one_side'] }, cardiacCtx).outcome,
  OUTCOME.EMERGENCY_115);

t('Đi cầu phân đen → 115',
  runTriage({ region: 'epigastric', onset: 'few_days', severity: 'mild', accompanying: ['black_stool'] }, cardiacCtx).outcome,
  OUTCOME.EMERGENCY_115);

console.log('\n── B. Không báo động thừa ──');

t('Đau khớp gối nhẹ vài ngày → chỉ ghi nhận',
  runTriage({ region: 'joint', onset: 'few_days', severity: 'mild', accompanying: ['none'] }, cardiacCtx).outcome,
  OUTCOME.LOG_AND_NOTIFY);

t('Đau đầu nhẹ hôm nay → chỉ ghi nhận',
  runTriage({ region: 'head', onset: 'today', severity: 'mild', accompanying: ['none'] }, cardiacCtx).outcome,
  OUTCOME.LOG_AND_NOTIFY);

t('Đau bụng dưới nhẹ, không kèm gì → chỉ ghi nhận',
  runTriage({ region: 'llq', onset: 'today', severity: 'mild', accompanying: ['none'] }, cardiacCtx).outcome,
  OUTCOME.LOG_AND_NOTIFY);

console.log('\n── C. Nhận diện câu nói tự do ──');

t('"bác đau ngực quá" → hỏi thêm, KHÔNG kết luận ngay',
  classifyUtterance('Bác bị đau ngực quá cháu ơi').kind, 'NEEDS_INTAKE');

t('"bác bất tỉnh" → cấp cứu ngay',
  classifyUtterance('bà nhà tôi bất tỉnh rồi').kind, 'EMERGENCY');

t('"hồi năm ngoái bác bị đau ngực chứ giờ hết rồi" → KHÔNG báo động',
  classifyUtterance('Hồi năm ngoái bác bị đau ngực chứ giờ hết rồi con').kind, 'PAST_TENSE_CHECK');

t('"thuốc này uống trước hay sau ăn" → không phải triệu chứng',
  classifyUtterance('Thuốc huyết áp này uống trước hay sau ăn?').kind, 'NOT_SYMPTOM');

t('"tức ngực, hụt hơi" (cách nói người già) → bắt được',
  classifyUtterance('Bác thấy tức ngực với hụt hơi').kind, 'NEEDS_INTAKE');

console.log('\n── C2. Té ngã: không đi qua bộ hỏi triệu chứng thường ──');
// Ca thật gặp khi thử trên máy: bác nói "mới bị té, đau đầu gối quá".
// Bản trước bỏ qua chữ "té", chạy bộ hỏi đau khớp, rồi kết luận đau khớp là
// "tác dụng phụ thường gặp của thuốc mỡ máu" và khuyên chườm ấm — trong khi
// cái gối vừa bị té có thể đang nứt xương.
t('"Bác mới bị té, đau đầu gối quá" → TRAUMA, không phải NEEDS_INTAKE',
  classifyUtterance('Bác mới bị té, đau đầu gối quá').kind, 'TRAUMA');

t('"vừa bị ngã trong nhà tắm" → TRAUMA',
  classifyUtterance('bác vừa bị ngã trong nhà tắm').kind, 'TRAUMA');

t('Té thường → phải đi khám trong 24h, không phải chỉ ghi nhận',
  traumaResponse({ severe: null }).outcome, OUTCOME.SEE_DOCTOR_24H);

t('Té kèm đập đầu → cấp cứu 115',
  traumaResponse({ severe: 'dap dau' }).outcome, OUTCOME.EMERGENCY_115);

// Không kiểm tra sự có mặt của từ "chườm" — lời khuyên CÓ chứa từ đó, ở dạng
// cấm ("đừng tự xoa bóp hay chườm"). Điều cần khẳng định là lời cấm tồn tại.
t('Lời khuyên khi té phải DẶN KHÔNG tự xoa bóp hay chườm',
  /dung tu xoa bop hay chuom/.test(normalize(traumaResponse({}).advice)), true);

t('Lời khuyên khi té KHÔNG được gợi ý uống thêm thứ gì',
  /(uong them|uong thuoc giam dau|uong nuoc am)/.test(normalize(traumaResponse({}).advice)), false);

t('Té hồi xưa → không kích hoạt nhánh chấn thương',
  classifyUtterance('hồi năm ngoái bác bị té chứ giờ hết rồi').kind !== 'TRAUMA', true);

console.log('\n── D. Ánh xạ biệt dược → hoạt chất ──');

t('Panadol Extra', resolveGenerics({ name: 'Panadol Extra' }), ['paracetamol', 'caffeine']);
t('Alaxan (thuốc phối hợp)', resolveGenerics({ name: 'Alaxan' }), ['ibuprofen', 'paracetamol']);
t('Augmentin 625mg', resolveGenerics({ name: 'Augmentin 625mg' }), ['amoxicillin', 'clavulanic acid']);
t('Thuốc lạ không nhận ra → [] (không đoán)', resolveGenerics({ name: 'Thuốc gia truyền ông Ba' }), []);
t('Warfarin là nhóm đặc biệt', isSpecialMissedDose(['warfarin']), true);
t('Amlodipine không phải nhóm đặc biệt', isSpecialMissedDose(['amlodipine']), false);

console.log('\n── E. Kiểm tra dị ứng ──');

const augmentin = [{ name: 'Augmentin 1g' }];
t('Dị ứng Penicillin + đơn có Augmentin → cảnh báo CRITICAL',
  checkAllergies(augmentin, ['Penicillin']).map(w => w.severity), ['CRITICAL']);

t('Dị ứng Penicillin + đơn có Cefuroxime → cảnh báo dị ứng chéo',
  checkAllergies([{ name: 'Zinnat 500mg' }], ['Penicillin']).map(w => w.type), ['ALLERGY_CROSS']);

t('Không dị ứng → không cảnh báo',
  checkAllergies(augmentin, []).length, 0);

console.log('\n── F. Trùng hoạt chất & tương tác ──');

t('Panadol Extra + Alaxan → trùng paracetamol',
  checkDuplicateIngredients([{ name: 'Alaxan' }], [{ name: 'Panadol Extra' }]).length, 1);

t('Warfarin + Ibuprofen → tương tác SEVERE',
  checkDrugInteractions([{ name: 'Coumadin' }, { name: 'Brufen 400' }]).map(w => w.severity), ['SEVERE']);

t('Amlodipine + Atorvastatin → không có tương tác',
  checkDrugInteractions([{ name: 'Amlodipine 5mg' }, { name: 'Atorvastatin 10mg' }]).length, 0);

console.log('\n── G. Ngưỡng chỉ số (lỗi "✓ An toàn" cũ) ──');

t('180/110 KHÔNG còn là "An toàn"',
  evaluateVital({ type: 'BLOOD_PRESSURE', sys: 180, dia: 110 }).key, 'CRITICAL_HIGH');
t('150/95 → cao',
  evaluateVital({ type: 'BLOOD_PRESSURE', sys: 150, dia: 95 }).key, 'HIGH');
t('125/82 → trong ngưỡng',
  evaluateVital({ type: 'BLOOD_PRESSURE', sys: 125, dia: 82 }).key, 'NORMAL');
t('85/55 → thấp',
  evaluateVital({ type: 'BLOOD_PRESSURE', sys: 85, dia: 55 }).key, 'LOW');
t('Đường huyết 2.5 → hạ đường huyết',
  evaluateVital({ type: 'BLOOD_SUGAR', val: 2.5 }).key, 'CRITICAL_LOW');
t('Đường huyết 15 → rất cao',
  evaluateVital({ type: 'BLOOD_SUGAR', val: 15 }).key, 'CRITICAL_HIGH');

console.log(`\n${'═'.repeat(50)}\n  ${pass} đạt · ${fail} không đạt\n${'═'.repeat(50)}\n`);
process.exit(fail > 0 ? 1 : 0);
