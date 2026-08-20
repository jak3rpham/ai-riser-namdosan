/**
 * Kho kiến thức dược — TẦNG 1 theo kiến trúc ở doc 30-Knowledge-Base.md
 *
 * ⚠️ TRẠNG THÁI KIỂM CHỨNG
 * Toàn bộ dữ liệu trong file này ở mức `PENDING_PHARMACIST_REVIEW`.
 * Nó được soạn từ thông tin dược phổ biến, chọn hướng THẬN TRỌNG (thà cảnh báo
 * thừa còn hơn bỏ sót), và CHƯA được dược sĩ rà.
 *
 * Quy tắc dùng (doc 30 mục 3):
 *   - Cảnh báo nghiêm trọng chỉ bật khi `verified === true`.
 *   - Dữ liệu `pending` được phép hiển thị nhưng PHẢI kèm nhãn "chưa kiểm chứng".
 *   - Không bao giờ trình bày dữ liệu pending như một khẳng định chắc chắn.
 *
 * File này KHÔNG được dùng để: tính liều, suy ra bệnh của người dùng,
 * khuyên ngừng/đổi thuốc (doc 30 mục 4).
 */

export const KNOWLEDGE_STATUS = {
  version: '0.1.0',
  reviewed_by_pharmacist: false,
  last_updated: '2026-08-12',
  note: 'Dữ liệu seed ban đầu, cần dược sĩ rà trước khi dùng cho cảnh báo nghiêm trọng.'
};

/* ────────────────────────────────────────────────────────────────
 * 1. Ánh xạ biệt dược VN → hoạt chất
 *    Phục vụ T15 (phát hiện trùng hoạt chất) — doc 30 gọi đây là bảng
 *    quan trọng nhất trong kho.
 *
 *    Thuốc PHỐI HỢP liệt kê nhiều hoạt chất. Đây là nguồn trùng lặp hay bị
 *    bỏ sót nhất trong thực tế: người dùng uống Panadol Extra cho đau đầu
 *    rồi uống thêm Alaxan cho đau khớp → dư paracetamol mà không biết.
 * ──────────────────────────────────────────────────────────────── */
export const BRAND_TO_GENERICS = {
  // ── Giảm đau / hạ sốt / kháng viêm ──
  'panadol': ['paracetamol'],
  'panadol extra': ['paracetamol', 'caffeine'],
  'efferalgan': ['paracetamol'],
  'efferalgan codeine': ['paracetamol', 'codeine'],
  'hapacol': ['paracetamol'],
  'tylenol': ['paracetamol'],
  'partamol': ['paracetamol'],
  'panactol': ['paracetamol'],
  'acemol': ['paracetamol'],
  'paracetamol': ['paracetamol'],
  'decolgen': ['paracetamol', 'phenylephrine', 'chlorpheniramine'],
  'tiffy': ['paracetamol', 'phenylephrine', 'chlorpheniramine'],
  'ameflu': ['paracetamol', 'phenylephrine', 'dextromethorphan'],
  'alaxan': ['ibuprofen', 'paracetamol'],
  'ibuprofen': ['ibuprofen'],
  'brufen': ['ibuprofen'],
  'advil': ['ibuprofen'],
  'mofen': ['ibuprofen'],
  'gofen': ['ibuprofen'],
  'diclofenac': ['diclofenac'],
  'voltaren': ['diclofenac'],
  'meloxicam': ['meloxicam'],
  'mobic': ['meloxicam'],
  'naproxen': ['naproxen'],
  'celecoxib': ['celecoxib'],
  'celebrex': ['celecoxib'],
  'aspirin': ['aspirin'],
  'aspegic': ['aspirin'],

  // ── Huyết áp / tim mạch ──
  'amlodipine': ['amlodipine'],
  'amlodipin': ['amlodipine'],
  'amlor': ['amlodipine'],
  'amlogard': ['amlodipine'],
  'normodipine': ['amlodipine'],
  'nifedipin': ['nifedipine'],
  'losartan': ['losartan'],
  'cozaar': ['losartan'],
  'lostad': ['losartan'],
  'telmisartan': ['telmisartan'],
  'micardis': ['telmisartan'],
  'valsartan': ['valsartan'],
  'diovan': ['valsartan'],
  'irbesartan': ['irbesartan'],
  'aprovel': ['irbesartan'],
  'enalapril': ['enalapril'],
  'renitec': ['enalapril'],
  'ednyt': ['enalapril'],
  'perindopril': ['perindopril'],
  'coversyl': ['perindopril'],
  'lisinopril': ['lisinopril'],
  'captopril': ['captopril'],
  'metoprolol': ['metoprolol'],
  'betaloc': ['metoprolol'],
  'bisoprolol': ['bisoprolol'],
  'concor': ['bisoprolol'],
  'atenolol': ['atenolol'],
  'tenormin': ['atenolol'],
  'verapamil': ['verapamil'],
  'diltiazem': ['diltiazem'],
  'furosemide': ['furosemide'],
  'lasix': ['furosemide'],
  'spironolactone': ['spironolactone'],
  'verospiron': ['spironolactone'],
  'digoxin': ['digoxin'],

  // ── Mỡ máu ──
  'atorvastatin': ['atorvastatin'],
  'lipitor': ['atorvastatin'],
  'atorlip': ['atorvastatin'],
  'rosuvastatin': ['rosuvastatin'],
  'crestor': ['rosuvastatin'],
  'simvastatin': ['simvastatin'],
  'zocor': ['simvastatin'],
  'fenofibrate': ['fenofibrate'],
  'lipanthyl': ['fenofibrate'],

  // ── Tiểu đường ──
  'metformin': ['metformin'],
  'glucophage': ['metformin'],
  'panfor': ['metformin'],
  'gliclazide': ['gliclazide'],
  'diamicron': ['gliclazide'],
  'predian': ['gliclazide'],
  'glimepiride': ['glimepiride'],
  'amaryl': ['glimepiride'],
  'januvia': ['sitagliptin'],
  'forxiga': ['dapagliflozin'],
  'insulin': ['insulin'],
  'lantus': ['insulin'],
  'mixtard': ['insulin'],
  'novomix': ['insulin'],

  // ── Dạ dày ──
  'omeprazole': ['omeprazole'],
  'losec': ['omeprazole'],
  'esomeprazole': ['esomeprazole'],
  'nexium': ['esomeprazole'],
  'pantoprazole': ['pantoprazole'],
  'pantoloc': ['pantoprazole'],
  'lansoprazole': ['lansoprazole'],

  // ── Chống đông / chống kết tập tiểu cầu ──
  'warfarin': ['warfarin'],
  'coumadin': ['warfarin'],
  'acenocoumarol': ['acenocoumarol'],
  'sintrom': ['acenocoumarol'],
  'rivaroxaban': ['rivaroxaban'],
  'xarelto': ['rivaroxaban'],
  'apixaban': ['apixaban'],
  'eliquis': ['apixaban'],
  'clopidogrel': ['clopidogrel'],
  'plavix': ['clopidogrel'],

  // ── Kháng sinh ──
  'amoxicillin': ['amoxicillin'],
  'amoxicilin': ['amoxicillin'],
  'amoxil': ['amoxicillin'],
  'augmentin': ['amoxicillin', 'clavulanic acid'],
  'klamentin': ['amoxicillin', 'clavulanic acid'],
  'curam': ['amoxicillin', 'clavulanic acid'],
  'ampicillin': ['ampicillin'],
  'unasyn': ['ampicillin', 'sulbactam'],
  'penicillin': ['penicillin'],
  'cephalexin': ['cephalexin'],
  'cefalexin': ['cephalexin'],
  'keflex': ['cephalexin'],
  'cefuroxime': ['cefuroxime'],
  'zinnat': ['cefuroxime'],
  'cefixime': ['cefixime'],
  'ceftriaxone': ['ceftriaxone'],
  'azithromycin': ['azithromycin'],
  'zitromax': ['azithromycin'],
  'clarithromycin': ['clarithromycin'],
  'klacid': ['clarithromycin'],
  'erythromycin': ['erythromycin'],
  'levofloxacin': ['levofloxacin'],
  'tavanic': ['levofloxacin'],
  'ciprofloxacin': ['ciprofloxacin'],
  'ciprobay': ['ciprofloxacin'],
  'metronidazole': ['metronidazole'],
  'flagyl': ['metronidazole'],
  'co-trimoxazole': ['sulfamethoxazole', 'trimethoprim'],
  'bactrim': ['sulfamethoxazole', 'trimethoprim'],
  'biseptol': ['sulfamethoxazole', 'trimethoprim'],

  // ── Tuyến giáp / thần kinh / hô hấp ──
  'levothyroxine': ['levothyroxine'],
  'levothyrox': ['levothyroxine'],
  'berlthyrox': ['levothyroxine'],
  'thyrozol': ['thiamazole'],
  'phenytoin': ['phenytoin'],
  'carbamazepine': ['carbamazepine'],
  'tegretol': ['carbamazepine'],
  'valproate': ['valproate'],
  'depakine': ['valproate'],
  'levetiracetam': ['levetiracetam'],
  'keppra': ['levetiracetam'],
  'salbutamol': ['salbutamol'],
  'ventolin': ['salbutamol'],
  'prednisolone': ['prednisolone'],
  'prednisolon': ['prednisolone'],
  'medrol': ['methylprednisolone'],
  'methylprednisolone': ['methylprednisolone'],
  'alpha choay': ['chymotrypsin'],
  'eugica': ['eucalyptus']
};

/** Tên dân dã của hoạt chất — dùng khi nói với người lớn tuổi (doc 30 mục 1) */
export const GENERIC_PLAIN_NAMES = {
  amlodipine: 'thuốc huyết áp',
  losartan: 'thuốc huyết áp',
  telmisartan: 'thuốc huyết áp',
  enalapril: 'thuốc huyết áp',
  perindopril: 'thuốc huyết áp',
  bisoprolol: 'thuốc tim mạch',
  metoprolol: 'thuốc tim mạch',
  atorvastatin: 'thuốc mỡ máu',
  rosuvastatin: 'thuốc mỡ máu',
  simvastatin: 'thuốc mỡ máu',
  metformin: 'thuốc tiểu đường',
  gliclazide: 'thuốc tiểu đường',
  glimepiride: 'thuốc tiểu đường',
  insulin: 'thuốc tiểu đường dạng tiêm',
  paracetamol: 'thuốc giảm đau hạ sốt',
  ibuprofen: 'thuốc giảm đau kháng viêm',
  diclofenac: 'thuốc giảm đau kháng viêm',
  meloxicam: 'thuốc giảm đau kháng viêm',
  omeprazole: 'thuốc dạ dày',
  esomeprazole: 'thuốc dạ dày',
  warfarin: 'thuốc chống đông máu',
  acenocoumarol: 'thuốc chống đông máu',
  clopidogrel: 'thuốc chống đông máu',
  levothyroxine: 'thuốc tuyến giáp',
  amoxicillin: 'thuốc kháng sinh',
  cefuroxime: 'thuốc kháng sinh'
};

/* ────────────────────────────────────────────────────────────────
 * 2. Nhóm dị ứng → các hoạt chất thuộc nhóm đó
 *    Dùng để đối chiếu đơn thuốc mới với tiền sử dị ứng đã ghi.
 *    `cross_reactive` = nhóm có nguy cơ dị ứng chéo, mức cảnh báo thấp hơn
 *    nhưng vẫn phải nói.
 * ──────────────────────────────────────────────────────────────── */
export const ALLERGY_CLASSES = [
  {
    key: 'penicillin',
    // các cách người Việt ghi trong hồ sơ
    aliases: ['penicillin', 'penicilin', 'peniciline', 'pnc', 'beta lactam', 'beta-lactam'],
    label: 'Penicillin (nhóm beta-lactam)',
    generics: ['penicillin', 'amoxicillin', 'ampicillin', 'oxacillin', 'cloxacillin', 'piperacillin'],
    cross_reactive: {
      generics: ['cephalexin', 'cefuroxime', 'cefixime', 'ceftriaxone', 'cefaclor'],
      note: 'Nhóm cephalosporin có nguy cơ dị ứng chéo với penicillin. Không chắc chắn là sẽ dị ứng, nhưng phải nói với bác sĩ/dược sĩ trước khi dùng.'
    },
    severity: 'CRITICAL'
  },
  {
    key: 'sulfa',
    aliases: ['sulfa', 'sulfamid', 'sulfamide', 'sulfonamid', 'bactrim', 'co-trimoxazol'],
    label: 'Sulfa (sulfonamid)',
    generics: ['sulfamethoxazole', 'trimethoprim'],
    cross_reactive: null,
    severity: 'CRITICAL'
  },
  {
    key: 'nsaid',
    aliases: ['nsaid', 'aspirin', 'kháng viêm', 'khang viem', 'giảm đau kháng viêm', 'ibuprofen', 'diclofenac'],
    label: 'Thuốc kháng viêm không steroid (NSAID)',
    generics: ['aspirin', 'ibuprofen', 'diclofenac', 'meloxicam', 'naproxen', 'celecoxib'],
    cross_reactive: null,
    severity: 'CRITICAL'
  },
  {
    key: 'paracetamol',
    aliases: ['paracetamol', 'panadol', 'acetaminophen'],
    label: 'Paracetamol',
    generics: ['paracetamol'],
    cross_reactive: null,
    severity: 'CRITICAL'
  },
  {
    key: 'quinolone',
    aliases: ['quinolon', 'quinolone', 'ciprofloxacin', 'levofloxacin'],
    label: 'Kháng sinh nhóm quinolon',
    generics: ['ciprofloxacin', 'levofloxacin', 'ofloxacin', 'moxifloxacin'],
    cross_reactive: null,
    severity: 'CRITICAL'
  },
  {
    key: 'macrolide',
    aliases: ['macrolid', 'macrolide', 'erythromycin', 'azithromycin'],
    label: 'Kháng sinh nhóm macrolid',
    generics: ['erythromycin', 'azithromycin', 'clarithromycin'],
    cross_reactive: null,
    severity: 'CRITICAL'
  }
];

/* ────────────────────────────────────────────────────────────────
 * 3. Thuốc KHÔNG được tự xử lý quên liều
 *    doc 31 mục 1 Mức 2 + doc 25 mục 0 ràng buộc 5.
 *    Gặp nhóm này, trợ lý phải chuyển sang "gọi nhà thuốc/bác sĩ + báo người nhà",
 *    KHÔNG áp quy tắc quên liều chung.
 * ──────────────────────────────────────────────────────────────── */
export const SPECIAL_MISSED_DOSE_GENERICS = [
  // chống đông — quên hoặc uống bù sai đều nguy hiểm
  'warfarin', 'acenocoumarol', 'rivaroxaban', 'apixaban', 'dabigatran', 'clopidogrel',
  // tiểu đường — nguy cơ hạ đường huyết
  'insulin', 'gliclazide', 'glimepiride', 'glibenclamide',
  // tuyến giáp
  'levothyroxine', 'thiamazole',
  // động kinh
  'phenytoin', 'carbamazepine', 'valproate', 'levetiracetam', 'phenobarbital',
  // tim mạch khoảng trị liệu hẹp
  'digoxin', 'amiodarone',
  // khác
  'lithium', 'theophylline', 'methotrexate',
  // HIV / lao
  'isoniazid', 'rifampicin', 'efavirenz', 'tenofovir', 'lamivudine'
];

/* ────────────────────────────────────────────────────────────────
 * 4. Tương tác thuốc–thuốc
 *    Chỉ giữ những cặp có cơ sở rõ ràng và hay gặp ở người cao tuổi VN.
 *    doc 25 mục 4: không chắc → bỏ qua; TUYỆT ĐỐI không khuyên ngừng/đổi thuốc,
 *    chỉ khuyên đi hỏi bác sĩ/dược sĩ.
 * ──────────────────────────────────────────────────────────────── */
export const DRUG_DRUG_INTERACTIONS = [
  {
    pair: [['warfarin', 'acenocoumarol'], ['aspirin', 'ibuprofen', 'diclofenac', 'meloxicam', 'naproxen']],
    severity: 'SEVERE',
    plain: 'Uống chung thuốc chống đông với thuốc giảm đau kháng viêm làm tăng mạnh nguy cơ chảy máu, nhất là chảy máu dạ dày.',
    action: 'Bác đừng tự uống thêm thuốc giảm đau khi đang dùng thuốc chống đông. Nhà mình hỏi bác sĩ hoặc dược sĩ trước nha.'
  },
  {
    pair: [['warfarin', 'acenocoumarol', 'rivaroxaban', 'apixaban'], ['clopidogrel', 'aspirin']],
    severity: 'SEVERE',
    plain: 'Hai thuốc cùng làm loãng máu dùng chung sẽ tăng nguy cơ chảy máu.',
    action: 'Nếu bác sĩ không dặn dùng cả hai thì nhà mình hỏi lại bác sĩ ạ.'
  },
  {
    pair: [['atorvastatin', 'simvastatin'], ['clarithromycin', 'erythromycin']],
    severity: 'SEVERE',
    plain: 'Kháng sinh nhóm này làm thuốc mỡ máu tích tụ trong cơ thể, tăng nguy cơ tổn thương cơ.',
    action: 'Bác báo bác sĩ là mình đang uống thuốc mỡ máu trước khi dùng kháng sinh này nha.'
  },
  {
    pair: [['enalapril', 'perindopril', 'lisinopril', 'captopril'], ['losartan', 'telmisartan', 'valsartan', 'irbesartan']],
    severity: 'HIGH',
    plain: 'Hai nhóm thuốc huyết áp này thường không dùng chung vì tăng nguy cơ ảnh hưởng thận và tụt huyết áp.',
    action: 'Nhà mình mang cả hai vỉ thuốc cho bác sĩ xem để bác sĩ xác nhận lại ạ.'
  },
  {
    pair: [['enalapril', 'perindopril', 'lisinopril', 'captopril', 'losartan', 'telmisartan', 'valsartan'], ['ibuprofen', 'diclofenac', 'meloxicam', 'naproxen']],
    severity: 'HIGH',
    plain: 'Thuốc giảm đau kháng viêm làm giảm tác dụng của thuốc huyết áp và có thể ảnh hưởng thận khi dùng dài ngày.',
    action: 'Cần giảm đau thì bác ưu tiên paracetamol nha, và hỏi dược sĩ nếu phải dùng nhiều ngày.'
  },
  {
    pair: [['ibuprofen', 'diclofenac', 'meloxicam', 'naproxen', 'aspirin'], ['ibuprofen', 'diclofenac', 'meloxicam', 'naproxen', 'celecoxib']],
    severity: 'HIGH',
    same_class_only: true,
    plain: 'Hai thuốc giảm đau kháng viêm dùng cùng lúc không tăng hiệu quả nhưng tăng rõ nguy cơ đau/chảy máu dạ dày.',
    action: 'Bác chỉ dùng một loại thôi ạ. Nhà mình hỏi dược sĩ xem giữ loại nào.'
  },
  {
    pair: [['bisoprolol', 'metoprolol', 'atenolol'], ['verapamil', 'diltiazem']],
    severity: 'HIGH',
    plain: 'Dùng chung có thể làm tim đập quá chậm và tụt huyết áp.',
    action: 'Nhà mình xác nhận lại với bác sĩ tim mạch ạ.'
  },
  {
    pair: [['clopidogrel'], ['omeprazole', 'esomeprazole']],
    severity: 'MODERATE',
    plain: 'Thuốc dạ dày nhóm này có thể làm giảm tác dụng chống đông của clopidogrel.',
    action: 'Bác hỏi dược sĩ xem có loại thuốc dạ dày khác phù hợp hơn không nha.'
  },
  {
    pair: [['levothyroxine'], ['omeprazole', 'esomeprazole', 'pantoprazole']],
    severity: 'MODERATE',
    plain: 'Thuốc dạ dày làm giảm hấp thu thuốc tuyến giáp nếu uống gần nhau.',
    action: 'Bác uống thuốc tuyến giáp lúc bụng đói buổi sáng, cách thuốc dạ dày ít nhất 4 tiếng nha.'
  },
  {
    pair: [['gliclazide', 'glimepiride', 'insulin'], ['bisoprolol', 'metoprolol', 'atenolol']],
    severity: 'MODERATE',
    plain: 'Thuốc tim mạch có thể làm mờ dấu hiệu hạ đường huyết (run tay, hồi hộp), khiến khó nhận ra kịp.',
    action: 'Bác đo đường huyết đều hơn và nhớ mang theo kẹo ngọt khi ra ngoài nha.'
  }
];

/* ────────────────────────────────────────────────────────────────
 * 5. Tương tác thuốc–thức ăn (M12) — theo hoạt chất, không theo biệt dược
 * ──────────────────────────────────────────────────────────────── */
export const FOOD_INTERACTIONS_BY_GENERIC = {
  amlodipine: [{
    food: 'Bưởi và nước ép bưởi',
    severity: 'HIGH',
    plain: 'Bưởi làm thuốc huyết áp ngấm mạnh hơn mức cần thiết, có thể gây tụt huyết áp và chóng mặt.',
    alternative: 'Cam, quýt, hoặc nước lọc.',
    meal_context: 'bất kỳ'
  }],
  atorvastatin: [{
    food: 'Bưởi và nước ép bưởi',
    severity: 'HIGH',
    plain: 'Bưởi làm thuốc mỡ máu tích tụ lại, tăng nguy cơ đau nhức và tổn thương cơ.',
    alternative: 'Cam, quýt, táo.',
    meal_context: 'bất kỳ'
  }],
  simvastatin: [{
    food: 'Bưởi và nước ép bưởi',
    severity: 'HIGH',
    plain: 'Bưởi làm thuốc mỡ máu tích tụ lại, tăng nguy cơ đau nhức và tổn thương cơ.',
    alternative: 'Cam, quýt, táo.',
    meal_context: 'bất kỳ'
  }],
  paracetamol: [{
    food: 'Rượu, bia',
    severity: 'HIGH',
    plain: 'Rượu bia đi cùng paracetamol làm tăng gánh nặng cho gan.',
    alternative: 'Nước ấm, nước lọc.',
    meal_context: 'bất kỳ'
  }],
  metformin: [{
    food: 'Rượu, bia',
    severity: 'HIGH',
    plain: 'Rượu bia khi đang uống metformin làm tăng nguy cơ nhiễm toan lactic — một biến chứng nặng.',
    alternative: 'Nước lọc, trà loãng.',
    meal_context: 'bất kỳ'
  }],
  warfarin: [{
    food: 'Rau lá xanh đậm ăn thất thường (cải bó xôi, cải xoăn, bông cải xanh, rau ngót)',
    severity: 'HIGH',
    plain: 'Các rau này nhiều vitamin K, ăn lúc nhiều lúc ít làm thuốc chống đông lúc mạnh lúc yếu.',
    alternative: 'Không cần kiêng hẳn — quan trọng là ăn ĐỀU mỗi tuần, đừng lúc nhiều lúc ít.',
    meal_context: 'bất kỳ'
  }, {
    food: 'Rượu, bia',
    severity: 'HIGH',
    plain: 'Rượu bia làm thay đổi tác dụng của thuốc chống đông, tăng nguy cơ chảy máu.',
    alternative: 'Nước lọc.',
    meal_context: 'bất kỳ'
  }],
  levothyroxine: [{
    food: 'Sữa, sữa đậu nành, canxi, viên sắt',
    severity: 'MEDIUM',
    plain: 'Canxi và sắt làm thuốc tuyến giáp không hấp thu được nếu uống gần nhau.',
    alternative: 'Uống thuốc lúc đói buổi sáng, cách sữa và viên bổ sung ít nhất 4 tiếng.',
    meal_context: 'sáng'
  }],
  ciprofloxacin: [{
    food: 'Sữa, sữa chua, phô mai, viên canxi',
    severity: 'MEDIUM',
    plain: 'Canxi trong sữa làm kháng sinh này không hấp thu được, uống như không uống.',
    alternative: 'Cách bữa sữa ít nhất 2 tiếng.',
    meal_context: 'bất kỳ'
  }],
  levofloxacin: [{
    food: 'Sữa, sữa chua, viên canxi',
    severity: 'MEDIUM',
    plain: 'Canxi làm giảm hấp thu kháng sinh này.',
    alternative: 'Cách bữa sữa ít nhất 2 tiếng.',
    meal_context: 'bất kỳ'
  }],
  metronidazole: [{
    food: 'Rượu, bia',
    severity: 'HIGH',
    plain: 'Uống rượu khi dùng metronidazole gây nôn ói, đỏ bừng mặt, tim đập nhanh rất khó chịu.',
    alternative: 'Kiêng rượu bia trong suốt đợt thuốc và 2 ngày sau khi ngưng.',
    meal_context: 'bất kỳ'
  }],
  spironolactone: [{
    food: 'Chuối, cam, khoai tây, muối thay thế (muối kali)',
    severity: 'MEDIUM',
    plain: 'Thuốc này giữ kali lại trong máu, ăn quá nhiều đồ giàu kali có thể làm kali lên cao.',
    alternative: 'Ăn bình thường, đừng ăn dồn nhiều một lúc.',
    meal_context: 'bất kỳ'
  }]
};

/* ────────────────────────────────────────────────────────────────
 * 6. Ngưỡng chỉ số sinh hiệu — TĨNH, do app quyết định, KHÔNG để AI phán
 *    doc 25 mục 6: "diễn giải cao/thấp chỉ hiển thị bằng ngưỡng tĩnh có sẵn
 *    trong app + luôn kèm hỏi bác sĩ".
 *
 *    ⚠️ Đây là ngưỡng THAM CHIẾU để tô màu và nhắc đi khám. Nó KHÔNG phải
 *    chẩn đoán, và không thay ngưỡng riêng mà bác sĩ đặt cho từng người.
 * ──────────────────────────────────────────────────────────────── */
export const VITAL_THRESHOLDS = {
  BLOOD_PRESSURE: {
    unit: 'mmHg',
    // xét theo thứ tự, dừng ở mức đầu tiên khớp
    levels: [
      {
        key: 'CRITICAL_HIGH',
        test: (v) => v.sys >= 180 || v.dia >= 120,
        label: 'Rất cao',
        tone: 'critical',
        message: 'Huyết áp ở mức rất cao. Bác ngồi nghỉ, đo lại sau 5 phút. Nếu vẫn cao như vậy thì nhà mình đưa bác đi khám ngay hôm nay ạ.',
        notify_family: true
      },
      {
        key: 'LOW',
        test: (v) => v.sys < 90 || v.dia < 60,
        label: 'Thấp',
        tone: 'warn',
        message: 'Huyết áp hơi thấp. Bác đứng dậy từ từ và uống đủ nước nha. Nếu bác thấy chóng mặt hoặc xây xẩm thì báo cho con biết ạ.',
        notify_family: true
      },
      {
        key: 'HIGH',
        test: (v) => v.sys >= 140 || v.dia >= 90,
        label: 'Cao',
        tone: 'warn',
        message: 'Chỉ số cao hơn mức mong muốn. Con ghi lại rồi ạ. Nếu mấy ngày liền đều cao như vậy, nhà mình mang sổ đo cho bác sĩ xem nha.',
        notify_family: true
      },
      {
        key: 'ELEVATED',
        test: (v) => v.sys >= 130 || v.dia >= 85,
        label: 'Hơi cao',
        tone: 'caution',
        message: 'Nhỉnh hơn bình thường một chút thôi ạ. Con ghi lại để theo dõi.',
        notify_family: false
      },
      {
        key: 'NORMAL',
        test: () => true,
        label: 'Trong ngưỡng tham chiếu',
        tone: 'ok',
        message: 'Chỉ số nằm trong ngưỡng tham chiếu thông thường ạ.',
        notify_family: false
      }
    ],
    pulse: [
      { key: 'PULSE_LOW', test: (v) => v.pulse != null && v.pulse < 50, label: 'Mạch chậm', tone: 'warn' },
      { key: 'PULSE_HIGH', test: (v) => v.pulse != null && v.pulse > 120, label: 'Mạch nhanh', tone: 'warn' }
    ]
  },

  BLOOD_SUGAR: {
    unit: 'mmol/L',
    note: 'Ngưỡng tham chiếu cho đo lúc đói. Đo sau ăn sẽ khác — bác sĩ có thể đặt ngưỡng riêng cho từng người.',
    levels: [
      {
        key: 'CRITICAL_LOW',
        test: (v) => v.val < 3.0,
        label: 'Hạ đường huyết',
        tone: 'critical',
        message: 'Đường huyết xuống thấp. Bác ăn ngay một viên kẹo ngọt hoặc uống nước đường, rồi đo lại sau 15 phút. Con báo người nhà ngay ạ.',
        notify_family: true
      },
      {
        key: 'LOW',
        test: (v) => v.val < 3.9,
        label: 'Hơi thấp',
        tone: 'warn',
        message: 'Đường huyết hơi thấp. Bác ăn nhẹ gì đó rồi đo lại nha.',
        notify_family: true
      },
      {
        key: 'CRITICAL_HIGH',
        test: (v) => v.val >= 13.9,
        label: 'Rất cao',
        tone: 'critical',
        message: 'Đường huyết ở mức rất cao. Nhà mình liên hệ bác sĩ trong hôm nay ạ.',
        notify_family: true
      },
      {
        key: 'HIGH',
        test: (v) => v.val >= 7.0,
        label: 'Cao',
        tone: 'warn',
        message: 'Cao hơn ngưỡng tham chiếu lúc đói. Con ghi lại để bác sĩ xem trong lần khám tới ạ.',
        notify_family: false
      },
      {
        key: 'ELEVATED',
        test: (v) => v.val >= 5.6,
        label: 'Hơi cao',
        tone: 'caution',
        message: 'Nhỉnh hơn ngưỡng bình thường một chút ạ.',
        notify_family: false
      },
      {
        key: 'NORMAL',
        test: () => true,
        label: 'Trong ngưỡng tham chiếu',
        tone: 'ok',
        message: 'Chỉ số nằm trong ngưỡng tham chiếu thông thường ạ.',
        notify_family: false
      }
    ]
  },

  TEMPERATURE: {
    unit: '°C',
    levels: [
      { key: 'CRITICAL_HIGH', test: (v) => v.val >= 39.5, label: 'Sốt cao', tone: 'critical', message: 'Sốt cao. Nhà mình cho bác đi khám hôm nay ạ.', notify_family: true },
      { key: 'HIGH', test: (v) => v.val >= 38.0, label: 'Sốt', tone: 'warn', message: 'Bác đang sốt. Uống nhiều nước, lau mát. Sốt quá 2 ngày thì mình đi khám nha.', notify_family: true },
      { key: 'LOW', test: (v) => v.val < 35.5, label: 'Thân nhiệt thấp', tone: 'warn', message: 'Thân nhiệt thấp hơn bình thường, bác giữ ấm và đo lại nha.', notify_family: true },
      { key: 'NORMAL', test: () => true, label: 'Bình thường', tone: 'ok', message: 'Thân nhiệt bình thường ạ.', notify_family: false }
    ]
  },

  WEIGHT: {
    unit: 'kg',
    levels: [{ key: 'NORMAL', test: () => true, label: 'Đã ghi nhận', tone: 'neutral', message: 'Con ghi lại cân nặng rồi ạ.', notify_family: false }]
  }
};

/* ────────────────────────────────────────────────────────────────
 * Hàm tra cứu
 * ──────────────────────────────────────────────────────────────── */

/** Bỏ dấu tiếng Việt + hạ chữ thường, để so khớp bền hơn */
export function normalizeText(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

/**
 * Suy ra danh sách hoạt chất từ một bản ghi thuốc.
 * Ưu tiên trường `generic` do người dùng xác nhận; nếu không có thì tra bảng
 * biệt dược. Trả về [] khi không nhận ra — KHÔNG đoán.
 */
export function resolveGenerics(med) {
  if (!med || typeof med !== 'object') return [];
  const found = new Set();

  // 1. trường generic đã có (có thể ghi "Paracetamol + Caffeine")
  const genericField = normalizeText(med.generic);
  if (genericField) {
    genericField.split(/[+,/&]| va /).forEach(part => {
      const p = part.trim();
      if (!p) return;
      // đối chiếu lại với bảng để chuẩn hoá chính tả
      const mapped = BRAND_TO_GENERICS[p];
      if (mapped) mapped.forEach(g => found.add(g));
      else if (Object.values(BRAND_TO_GENERICS).flat().includes(p)) found.add(p);
    });
  }

  // 2. tra theo tên thương mại — khớp chuỗi dài trước để "panadol extra"
  //    thắng "panadol"
  const nameField = normalizeText(med.name);
  if (nameField) {
    const brands = Object.keys(BRAND_TO_GENERICS).sort((a, b) => b.length - a.length);
    for (const brand of brands) {
      if (nameField.includes(normalizeText(brand))) {
        BRAND_TO_GENERICS[brand].forEach(g => found.add(g));
        break;
      }
    }
  }

  return [...found];
}

/** Thuốc này có thuộc nhóm không được tự xử lý quên liều không? */
export function isSpecialMissedDose(generics = []) {
  return generics.some(g => SPECIAL_MISSED_DOSE_GENERICS.includes(g));
}

/** Tên dân dã để nói với người lớn tuổi; fallback về tên thương mại */
export function plainNameFor(med) {
  const generics = resolveGenerics(med);
  for (const g of generics) {
    if (GENERIC_PLAIN_NAMES[g]) return GENERIC_PLAIN_NAMES[g];
  }
  return med.nick_name || med.name;
}
