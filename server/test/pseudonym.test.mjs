import { buildPseudonymousProfile, findIdentifiers, stripExtractionIdentifiers }
  from '../src/lib/pseudonym.js';

let pass=0, fail=0;
const t=(n,a,e)=>{const ok=JSON.stringify(a)===JSON.stringify(e);
  ok?(pass++,console.log('  ✓',n)):(fail++,console.log('  ✗',n,'\n     mong:',JSON.stringify(e),'\n     thực:',JSON.stringify(a)));};

// hồ sơ thô đầy định danh, đúng như client có thể gửi lên
const raw = {
  id:'mem_01', display_name:'Ba Mười', birth_year:1958, phone:'0901234567',
  email:'bamuoi@gmail.com', photo_url:'http://x/y.jpg',
  conditions:['Huyết áp cao'], allergies:['Penicillin']
};
const meds = [{ id:'m1', name:'Amlodipine 5mg', generic:'amlodipine', dosage:'1 viên',
                timing:'Trưa', est_remaining:18, doctor_name:'BS Nguyễn Văn A' }];

const p = buildPseudonymousProfile(raw, meds);

console.log('\n── Bí danh hoá ──');
t('không còn display_name', p.display_name, undefined);
t('không còn birth_year',   p.birth_year, undefined);
t('không còn phone',        p.phone, undefined);
t('không còn email',        p.email, undefined);
t('đổi tuổi thành dải',     p.age_band, '65-69');
t('giữ bệnh nền',           p.conditions, ['Huyết áp cao']);
t('giữ dị ứng',             p.allergies, ['Penicillin']);
t('giữ tên thuốc',          p.medications[0].name, 'Amlodipine 5mg');
t('giữ hoạt chất',          p.medications[0].generic, 'amlodipine');
t('cắt tên bác sĩ khỏi thuốc', p.medications[0].doctor_name, undefined);
t('RÀ ĐỆ QUY: không còn định danh nào', findIdentifiers(p), []);

console.log('\n── Cắt định danh khỏi kết quả đọc đơn ──');
const ex = stripExtractionIdentifiers({
  doctor_name:'TS.BS Trần Thị X', facility_name:'BV Chợ Rẫy',
  diagnosis:'Tăng huyết áp', medications:[{name:'Amlodipin'}]
});
t('bỏ tên bác sĩ',    ex.doctor_name, undefined);
t('bỏ tên bệnh viện', ex.facility_name, undefined);
t('giữ chẩn đoán',    ex.diagnosis, 'Tăng huyết áp');
t('giữ thuốc',        ex.medications.length, 1);
t('có cờ báo đã đọc được tên bác sĩ', ex.had_doctor_name, true);

console.log(`\n${'═'.repeat(46)}\n  ${pass} đạt · ${fail} không đạt\n${'═'.repeat(46)}`);
process.exit(fail?1:0);
