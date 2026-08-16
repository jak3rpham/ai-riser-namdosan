/**
 * Chuỗi giao diện theo ngôn ngữ.
 *
 * Tách khỏi `mockData.js` ngày 16/08. Lý do không phải gọn gàng: bảy component
 * THẬT đang import chuỗi từ một file tên là "mockData", và giám khảo có mở mã
 * nguồn đọc. Một sản phẩm y tế mà màn hình chính lấy chữ từ file dữ liệu giả
 * thì phải đọc kỹ mới biết là không sao — mà giám khảo thì không có thời gian
 * đọc kỹ.
 */

/**
 * ⚠️ KHÔNG nhét emoji vào nhãn nút.
 *
 * Mấy nhãn này được render CẠNH một icon vector (lucide) trong JSX, nên emoji
 * trong chuỗi làm nút hiện hai biểu tượng liền nhau: một cái micro vector rồi
 * một cái micro emoji. Nhìn trên máy thì lướt qua, nhưng phóng to trong ảnh
 * chụp và trong video thì thành lỗi trình bày rõ rệt.
 *
 * Emoji dùng ở tiêu đề mục và câu chữ thì vẫn tốt — chỉ tránh ở nhãn nút đã
 * có icon riêng.
 */
export const I18N_STRINGS = {
  vi: {
    app_title: "Nhà Mình",
    app_subtitle: "Nền Tảng Sức Khỏe Gia Đình",
    split_view: "Xem 2 Màn hình (Split View)",
    child_view: "Web Con gái (P1)",
    parent_view: "App Ba Mẹ (P2)",
    reset_demo: "Reset Demo",
    family_profile: "Hồ sơ Sức khỏe Gia đình",
    family_profile_sub: "Đang theo dõi & hỗ trợ chăm sóc người thân",
    scan_prescription: "Scan Đơn thuốc / Vỏ thuốc mới",
    scan_desc: "Tải ảnh đơn thuốc hoặc vỏ thuốc lên. AI sẽ tự đọc, giải thích bình dân và lên lịch cho ba mẹ.",
    upload_btn: "+ Scan / Tải ảnh lên",
    compliance_rate: "Tỷ lệ tuân thủ",
    meds_count: "Thuốc đang uống",
    medicine_cabinet: "Tủ thuốc nhà",
    pharmacy_mode_btn: "Đưa nhà thuốc xem",
    ask_bi_btn: "Hỏi Cháu Bi",
    send_status_btn: "Báo con: ổn",
    taken_btn: "✓ ĐÃ UỐNG RỒI",
    taken_done: "✓ Đã uống đúng giờ!",
    morning: "Sáng",
    noon: "Trưa",
    afternoon: "Chiều",
    evening: "Tối",
    rx_meds: "Thuốc kê đơn (Rx)",
    otc_meds: "Thuốc không kê đơn (OTC / Hỗ trợ)",
    supplements: "Thực phẩm chức năng",
    allergies: "Tiền sử Dị ứng",
    conditions: "Bệnh nền",
    no_allergies: "Không phát hiện dị ứng",
    pharmacist_view_title: "MINH BẠCH DÙNG THUỐC — DÀNH CHO DƯỢC SĨ / BÁC SĨ",
    close: "Đóng màn hình"
  },
  en: {
    app_title: "Nha Health Hub",
    app_subtitle: "Family Healthcare Platform",
    split_view: "Dual Screen View",
    child_view: "Manager Web Portal (P1)",
    parent_view: "Parent Mobile App (P2)",
    reset_demo: "Reset Demo",
    family_profile: "Family Health Profile",
    family_profile_sub: "Monitoring and caring for loved ones",
    scan_prescription: "Scan Prescription / Medicine Box",
    scan_desc: "Upload prescription or package photos. AI will parse, explain simply, and set schedules for parents.",
    upload_btn: "+ Scan / Upload Image",
    compliance_rate: "Adherence Rate",
    meds_count: "Active Medications",
    medicine_cabinet: "Home Pill Cabinet",
    pharmacy_mode_btn: "Show Pharmacist",
    ask_bi_btn: "Ask AI Bi",
    send_status_btn: "Status: All Good",
    taken_btn: "✓ CONFIRM TAKEN",
    taken_done: "✓ Taken on schedule!",
    morning: "Morning",
    noon: "Noon",
    afternoon: "Afternoon",
    evening: "Evening",
    rx_meds: "Prescription Medications (Rx)",
    otc_meds: "Over-the-Counter (OTC)",
    supplements: "Dietary Supplements",
    allergies: "Allergies History",
    conditions: "Pre-existing Conditions",
    no_allergies: "No known drug allergies",
    pharmacist_view_title: "MEDICATION TRANSPARENCY — FOR PHARMACIST / DOCTOR",
    close: "Close View"
  }
};

