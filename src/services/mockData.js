// Seed catalog of common Vietnamese medications and interaction rules

export const SEED_MEDICATIONS = [
  {
    slug: "amlodipine",
    names: ["Amlodipine 5mg", "Amlor", "Amlogard"],
    generic: "Amlodipine besylate",
    category: "Huyết áp",
    common_uses_plain: "Hạ huyết áp và ngăn ngừa các cơn đau thắt ngực.",
    cautions_plain: "Nên uống cố định một giờ trong ngày, tránh đứng lên quá đột ngột.",
    food_interactions: [
      {
        food: "Nước ép Bưởi tươi",
        severity: "HIGH",
        plain_explanation: "Nước ép bưởi làm tăng nồng độ thuốc huyết áp trong máu, có thể gây hạ huyết áp quá mức.",
        alternative: "Dùng nước lọc hoặc nước cam chanh nhẹ."
      }
    ],
    missed_dose_rule: "Nếu nhớ ra trước liều tiếp theo 6 tiếng thì uống ngay; nếu sát liều tiếp thì bỏ liều đã quên.",
    verified: true
  },
  {
    slug: "paracetamol",
    names: ["Panadol Extra", "Efferalgan 500mg", "Hapacol", "Paracetamol 500mg", "Tylenol"],
    generic: "Paracetamol",
    category: "Giảm đau hạ sốt",
    common_uses_plain: "Giảm đau nhức đầu, đau răng, đau khớp nhẹ và hạ sốt.",
    cautions_plain: "Không uống quá 4000mg (8 viên) một ngày. Tuyệt đối không dùng chung với rượu bia.",
    food_interactions: [
      {
        food: "Rượu / Bia",
        severity: "HIGH",
        plain_explanation: "Rượu kết hợp với Paracetamol làm tăng độc tính nguy hiểm cho gan.",
        alternative: "Uống nước ấm."
      }
    ],
    missed_dose_rule: "Chỉ uống khi đau hoặc sốt. Mỗi lần uống cách nhau ít nhất 4 đến 6 tiếng.",
    verified: true
  },
  {
    slug: "atorvastatin",
    names: ["Atorvastatin 10mg", "Lipitor", "Atorlip"],
    generic: "Atorvastatin calcium",
    category: "Mỡ máu",
    common_uses_plain: "Giảm cholesterol xấu trong máu và bảo vệ tim mạch.",
    cautions_plain: "Nên uống vào buổi tối trước khi đi ngủ.",
    food_interactions: [
      {
        food: "Bưởi tươi / Nước bưởi",
        severity: "HIGH",
        plain_explanation: "Bưởi chứa chất làm giảm phân hủy thuốc mỡ máu, gây nguy cơ tiêu cơ vân và ảnh hưởng thận.",
        alternative: "Tránh ăn bưởi trong suốt quá trình dùng thuốc."
      }
    ],
    missed_dose_rule: "Bỏ qua liều đã quên nếu đã quá 12 tiếng, uống liều tiếp theo đúng giờ.",
    verified: true
  },
  {
    slug: "metformin",
    names: ["Metformin 500mg", "Glucophage", "Panfor"],
    generic: "Metformin hydrochloride",
    category: "Tiểu đường",
    common_uses_plain: "Hạ đường huyết cho người bệnh tiểu đường tuýp 2.",
    cautions_plain: "Nên uống ngay trong hoặc ngay sau bữa ăn để giảm đầy bụng.",
    food_interactions: [
      {
        food: "Đồ uống có cồn",
        severity: "HIGH",
        plain_explanation: "Rượu bia làm tăng nguy cơ nhiễm axit lactic nguy hiểm khi đang uống Metformin.",
        alternative: "Tránh thức uống có cồn."
      }
    ],
    missed_dose_rule: "Uống ngay trong bữa ăn tiếp theo.",
    verified: true
  }
];

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
    created_at: "2026-08-01",
    medications: [
      {
        id: "m1",
        name: "Amlodipine 5mg",
        nick_name: "Viên huyết áp trắng tròn",
        generic: "Amlodipine",
        strength: "5mg",
        dosage: "Uống 1 viên",
        timing: "Trưa (sau khi ăn)",
        time_slot: "Trưa",
        frequency: "1 lần/ngày",
        duration_days: 30,
        est_remaining: 18,
        photo_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"
      },
      {
        id: "m2",
        name: "Atorvastatin 10mg",
        nick_name: "Viên mỡ máu hình bầu dục",
        generic: "Atorvastatin",
        strength: "10mg",
        dosage: "Uống 1 viên",
        timing: "Tối (sau khi ăn)",
        time_slot: "Tối",
        frequency: "1 lần/ngày",
        duration_days: 30,
        est_remaining: 18,
        photo_url: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300"
      },
      {
        id: "m3",
        name: "Panadol Extra",
        nick_name: "Viên giảm đau đỏ trắng",
        generic: "Paracetamol + Caffeine",
        strength: "500mg",
        dosage: "Uống 1 viên khi đau nhức",
        timing: "Khi cần",
        time_slot: "Sáng",
        frequency: "Khi cần",
        duration_days: 10,
        est_remaining: 5,
        photo_url: "https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=300"
      }
    ]
  }
];
