import assert from 'node:assert/strict';
import {
  askPrompt,
  explainPrompt,
  narrateSymptomPrompt,
  classifySymptomPrompt,
  contextBlock,
  honorificBlock,
  safetyRailsBlock
} from '../src/lib/prompts.js';

console.log('\n── Kiểm tra Prompts Đa Ngôn Ngữ (VI / EN) ──');

// 1. Safety Rails
const viRails = safetyRailsBlock('vi');
assert(viRails.includes('RANH GIỚI TUYỆT ĐỐI'), 'viRails must contain Vietnamese header');
assert(viRails.includes('KHÔNG chẩn đoán'), 'viRails must contain no diagnosis rule');

const enRails = safetyRailsBlock('en');
assert(enRails.includes('ABSOLUTE CLINICAL BOUNDARIES'), 'enRails must contain English header');
assert(enRails.includes('DO NOT diagnose'), 'enRails must contain English no diagnosis rule');
console.log('  ✓ Safety rails hỗ trợ chuẩn cả tiếng Việt và tiếng Anh');

// 2. Honorific Block
const viElder = honorificBlock('elder', 'vi');
assert(viElder.includes('bác') && viElder.includes('con'), 'viElder must use con/bác');

const viPeer = honorificBlock('peer', 'vi');
assert(viPeer.includes('bạn') && viPeer.includes('mình'), 'viPeer must use mình/bạn');

const enTone = honorificBlock('elder', 'en');
assert(enTone.includes('AI Bi') && enTone.includes('English'), 'enTone must use AI Bi English tone');
console.log('  ✓ Honorific block hỗ trợ đúng theo vai vế và ngôn ngữ');

// 3. Context Block
const mockProfile = {
  age_band: '70-74',
  conditions: ['Tăng huyết áp', 'Đái tháo đường'],
  allergies: ['Penicillin'],
  medications: [
    { name: 'Amlodipine 5mg', generic: 'Amlodipine', dosage: '1 viên', timing: 'Sáng', special_missed_dose: false, days_remaining: 12 },
    { name: 'Warfarin 2mg', generic: 'Warfarin', dosage: '1 viên', timing: 'Tối', special_missed_dose: true, days_remaining: 5 }
  ]
};

const viContext = contextBlock(mockProfile, 'vi');
assert(viContext.includes('Tuổi:') && viContext.includes('Bệnh nền:'), 'viContext must have Vietnamese fields');
assert(viContext.includes('ĐẶC BIỆT: không tự xử lý quên liều'), 'viContext must mark special missed dose in VI');

const enContext = contextBlock(mockProfile, 'en');
assert(enContext.includes('Age:') && enContext.includes('Conditions:'), 'enContext must have English fields');
assert(enContext.includes('SPECIAL: do not self-manage'), 'enContext must mark special missed dose in EN');
console.log('  ✓ Context block render chính xác cho cả VI và EN');

// 4. Ask Prompt
const viAsk = askPrompt(mockProfile, 'Uống thuốc này trước hay sau ăn?', 'elder', [], 'vi');
assert(viAsk.includes('Bạn là "Cháu Bi"'), 'viAsk must identify as Cháu Bi');
assert(viAsk.includes('[GỢI Ý]:'), 'viAsk must instruct Vietnamese suggestions format');

const enAsk = askPrompt(mockProfile, 'Should I take this medicine before or after meals?', 'elder', [], 'en');
assert(enAsk.includes('You are "AI Bi"'), 'enAsk must identify as AI Bi');
assert(enAsk.includes('[SUGGESTIONS]:'), 'enAsk must instruct English suggestions format');
assert(enAsk.includes('Answer in fluent, natural English'), 'enAsk must instruct pure English');
console.log('  ✓ askPrompt hỗ trợ song ngữ Cháu Bi (VI) & AI Bi (EN)');

// 5. Explain Prompt
const viExplain = explainPrompt(mockProfile, 'elder', 'vi');
assert(viExplain.includes('Giải thích ngắn gọn đơn thuốc'), 'viExplain must be in VI');

const enExplain = explainPrompt(mockProfile, 'elder', 'en');
assert(enExplain.includes('Briefly explain the following prescription'), 'enExplain must be in EN');
assert(enExplain.includes('Answer in fluent, natural English'), 'enExplain must enforce English');
console.log('  ✓ explainPrompt hỗ trợ giải thích đơn thuốc song ngữ');

// 6. Narrate Symptom Prompt
const viNarrate = narrateSymptomPrompt(mockProfile, 'Đau bụng âm ỉ vùng thượng vị', 'elder', 'vi');
assert(viNarrate.includes('Bạn là "Cháu Bi"'), 'viNarrate must be in VI');

const enNarrate = narrateSymptomPrompt(mockProfile, 'Dull upper stomach pain', 'elder', 'en');
assert(enNarrate.includes('You are "AI Bi"'), 'enNarrate must be in EN');
console.log('  ✓ narrateSymptomPrompt hỗ trợ diễn đạt triệu chứng song ngữ');

// 7. Classify Symptom Prompt
const classifyP = classifySymptomPrompt('elder', 'en');
assert(classifyP.includes('tiếng Việt và tiếng Anh'), 'classify prompt must support both VI and EN input');
console.log('  ✓ classifySymptomPrompt phân loại chuẩn xác văn bản và giọng nói');

console.log('\n══════════════════════════════════════════════');
console.log('  7 KIỂM THỬ PROMPTS ĐA NGÔN NGỮ ĐẠT 100%');
console.log('══════════════════════════════════════════════\n');
