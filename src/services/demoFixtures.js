/**
 * Dữ liệu bệnh nhân hư cấu. Hai nơi dùng, cả hai đều có nhãn rõ ràng:
 *
 *   1. `/?demo=1`  — chế độ trình diễn hai màn hình, chỉ nằm trong bộ nhớ.
 *   2. `/demo`     — tài khoản cho người chấm bài; `demoSeed.js` ghi số liệu
 *                    này vào Firestore qua đúng rules như người dùng thật.
 *
 * ⚠️ ĐÂY KHÔNG PHẢI "mock data" theo nghĩa bị cấm. Ràng buộc của dự án cấm giả
 * lập TÍCH HỢP — kiểu in danh sách nhà thuốc bịa rồi dán nhãn "Google Maps" mà
 * không gọi API nào. Còn đây là bệnh nhân hư cấu, vì không được đem hồ sơ y tế
 * của người thật ra làm demo.
 *
 * Không có đường nào từ app thật dẫn tới file này. Người dùng thật tự khai hồ
 * sơ và không bao giờ thấy "Ba Mười" hay "Mẹ Lan".
 *
 * Tên bác sĩ dưới đây là bịa, giữ nguyên có chủ ý: đúng cái tên mà backend
 * từng trả về như một đơn thuốc THẬT khi Gemini lỗi (doc 35). Ở đây nó nằm sau
 * nhãn "chế độ trình diễn" — đúng chỗ của nó.
 *
 * Tách khỏi `mockData.js` ngày 16/08 cùng lúc với `i18n.js`: file cũ trộn
 * lẫn chuỗi giao diện THẬT với dữ liệu giả, mà bảy component thật đang import
 * từ đó.
 */


/**
 * Ngày kê đơn, tính LÙI từ hôm nay.
 *
 * ⚠️ Trước đây ghi cứng "2026-08-01". Dữ liệu mẫu thì đứng yên còn ngày thì
 * chạy, nên càng để lâu đơn càng hết hạn: giám khảo mở app ngày 16/08 đã thấy
 * thẻ tủ thuốc ghi "Hết thuốc rồi" cho cả ba loại. Đó không phải app tính sai
 * — nó tính đúng trên một dữ liệu mẫu đã cũ — nhưng người chấm không phân biệt
 * được hai chuyện đó, họ chỉ thấy một app đang báo hỏng.
 */
const daysAgo = n => new Date(Date.now() - n * 86400000).toISOString().split('T')[0];

export const INITIAL_FAMILY_MEMBERS = [
  {
    id: "mem_01",
    display_name: "Ba Mười",
    relation: "Ba",
    birth_year: 1958,
    capability: "C3",
    role: "care_recipient",
    allergies: ["Penicillin"],
    conditions: ["Huyết áp cao", "Mỡ máu cao"],
    avatar_color: "linear-gradient(135deg, #FF6B4B 0%, #FF8E53 100%)"
  },
  {
    id: "mem_02",
    display_name: "Mẹ Lan",
    relation: "Mẹ",
    birth_year: 1961,
    capability: "C2",
    role: "care_recipient",
    allergies: [],
    conditions: ["Đau khớp nhẹ"],
    avatar_color: "linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)"
  }
];

export const INITIAL_PRESCRIPTIONS = [
  {
    id: "doc_101",
    member_id: "mem_01",
    document_title: "Đơn khám tim mạch — Bệnh viện Đại học Y Dược",
    doctor_name: "TS.BS Nguyễn Văn An",
    created_at: daysAgo(12),
    start_date: "2026-08-01",
    duration_days: 30,
    end_date: "2026-08-30",
    status: "ACTIVE", // ACTIVE | EXPIRING_SOON | COMPLETED
    medications: [
      {
        id: "m1",
        name: "Amlodipine 5mg",
        nick_name: "Viên huyết áp trắng tròn",
        generic: "Amlodipine",
        type: "RX",
        strength: "5mg",
        dosage: "Uống 1 viên",
        timing: "Trưa (sau khi ăn)",
        time_slot: "Trưa",
        frequency: "1 lần/ngày",
        duration_days: 30,
        days_elapsed: 12,
        est_remaining: 18,
        photo_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"
      },
      {
        id: "m2",
        name: "Atorvastatin 10mg",
        nick_name: "Viên mỡ máu hình bầu dục",
        generic: "Atorvastatin",
        type: "RX",
        strength: "10mg",
        dosage: "Uống 1 viên",
        timing: "Tối (sau khi ăn)",
        time_slot: "Tối",
        frequency: "1 lần/ngày",
        duration_days: 30,
        days_elapsed: 12,
        est_remaining: 18,
        photo_url: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300"
      },
      {
        id: "m3",
        name: "Panadol Extra",
        nick_name: "Viên giảm đau đỏ trắng",
        generic: "Paracetamol + Caffeine",
        type: "OTC",
        strength: "500mg",
        dosage: "Uống 1 viên khi đau nhức",
        timing: "Khi cần",
        time_slot: "Sáng",
        frequency: "Khi cần",
        duration_days: 10,
        days_elapsed: 5,
        est_remaining: 5,
        photo_url: "https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=300"
      }
    ]
  }
];

/**
 * Đơn thuốc thứ hai — cho Mẹ Lan (mem_02), CHỈ dùng ở nhà mẫu.
 *
 * Trước đây chỉ có đúng một đơn và chỉ cho Ba Mười, nên bấm "Xem thử trước"
 * rồi chuyển sang Mẹ Lan là thấy một nửa app trống trơn.
 *
 * Thuốc chọn có chủ ý: Ibuprofen ở đây tương tác với Warfarin trong bộ kiểm
 * tra an toàn — nhưng Mẹ Lan không dùng Warfarin, nên đây là ca AN TOÀN. Muốn
 * xem app cảnh báo thì thêm thuốc ở màn hình chụp đơn, để cảnh báo là thứ
 * người xem tự tạo ra chứ không phải thứ được dàn dựng sẵn.
 */
export const DEMO_PRESCRIPTION_MOM = {
  id: "doc_201",
  member_id: "mem_02",
  document_title: "Đơn khám cơ xương khớp — Bệnh viện Nhân dân Gia Định",
  doctor_name: "BS.CKI Trần Thị Bình",
  created_at: daysAgo(10),
  start_date: "2026-08-05",
  duration_days: 21,
  end_date: "2026-08-26",
  status: "ACTIVE",
  medications: [
    {
      id: "m21",
      name: "Ibuprofen 400mg",
      nick_name: "Viên giảm đau khớp màu trắng",
      generic: "Ibuprofen",
      type: "RX",
      strength: "400mg",
      dosage: "Uống 1 viên",
      timing: "Sáng (sau khi ăn no)",
      time_slot: "Sáng",
      frequency: "1 lần/ngày",
      duration_days: 21,
      days_elapsed: 10,
      est_remaining: 11
    },
    {
      id: "m22",
      name: "Calcium D3",
      nick_name: "Viên canxi to màu trắng đục",
      generic: "Calcium carbonate",
      type: "OTC",
      strength: "500mg",
      dosage: "Uống 1 viên",
      timing: "Sáng (sau khi ăn)",
      time_slot: "Sáng",
      frequency: "1 lần/ngày",
      duration_days: 21,
      days_elapsed: 10,
      est_remaining: 11
    },
    {
      id: "m23",
      name: "Glucosamine 1500mg",
      nick_name: "Viên khớp màu vàng nhạt",
      generic: "Glucosamine sulfate",
      type: "OTC",
      strength: "1500mg",
      dosage: "Uống 1 viên",
      timing: "Tối (sau khi ăn)",
      time_slot: "Tối",
      frequency: "1 lần/ngày",
      duration_days: 21,
      days_elapsed: 10,
      est_remaining: 11
    }
  ]
};

/**
 * Số đo tại nhà cho nhà mẫu. Cố ý nằm TRONG ngưỡng bình thường và có dao động
 * nhẹ như đo thật, để không biến bản demo thành màn hình đầy cảnh báo đỏ.
 * Việc phân loại cao/thấp do `safetyChecks` tính, không phải do dữ liệu này
 * gán sẵn nhãn.
 */
export const DEMO_READINGS = {
  mem_01: [
    { type: 'BLOOD_PRESSURE', label: 'Huyết áp', sys: 128, dia: 84, pulse: 74, time: 'Hôm nay, 07:20' },
    { type: 'BLOOD_PRESSURE', label: 'Huyết áp', sys: 134, dia: 86, pulse: 78, time: 'Hôm qua, 07:05' },
    { type: 'BLOOD_SUGAR', label: 'Đường huyết', val: 5.6, time: 'Hôm nay, 06:50' },
    { type: 'WEIGHT', label: 'Cân nặng', val: 63.8, time: 'Hôm qua' }
  ],
  mem_02: [
    { type: 'BLOOD_PRESSURE', label: 'Huyết áp', sys: 122, dia: 79, pulse: 71, time: 'Hôm nay, 07:40' },
    { type: 'WEIGHT', label: 'Cân nặng', val: 54.2, time: 'Hôm qua' }
  ]
};