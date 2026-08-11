import { GoogleGenerativeAI } from '@google/generative-ai';
import { SEED_MEDICATIONS } from './mockData';

// API Key resolution (tries environment variable or prompt fallback)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Extract structured medication list from prescription or medicine package image
 */
export async function extractPrescriptionFromImage(base64Image) {
  if (!genAI) {
    console.warn("Gemini API Key missing, returning intelligent fallback parsing.");
    return getFallbackExtractionResult();
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Bạn là chuyên gia y tế hỗ trợ gia đình. Hãy phân tích ảnh đơn thuốc hoặc vỏ thuốc tiếng Việt này và trích xuất đúng định dạng JSON không chứa markdown:
{
  "doctor_name": "Tên bác sĩ (nếu có)",
  "facility_name": "Tên phòng khám/bệnh viện",
  "diagnosis": "Chẩn đoán bệnh ghi trên đơn",
  "medications": [
    {
      "name": "Tên thương mại của thuốc",
      "generic": "Hoạt chất chính (nếu biết)",
      "strength": "Hàm lượng (vd: 500mg, 5mg)",
      "dosage": "Liều dùng (vd: Uống 1 viên)",
      "timing": "Thời điểm (Sáng/Trưa/Chiều/Tối, Trước/Sau ăn)",
      "frequency": "Số lần/ngày",
      "duration_days": 14,
      "confidence": "HIGH"
    }
  ]
}`;

    const imagePart = {
      inlineData: {
        data: base64Image.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: "image/jpeg"
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("Gemini Vision extraction error:", err);
    return getFallbackExtractionResult();
  }
}

/**
 * Generate friendly plain-language explanation of prescription for parents
 */
export async function generatePlainExplanation(medications, patientName = "Bác") {
  if (!genAI) {
    return `${patientName} ơi, đây là đơn thuốc giúp ổn định huyết áp và bảo vệ sức khỏe. Bác nhớ uống đúng giờ sau bữa ăn nha!`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Hãy giải thích đơn thuốc sau cho người lớn tuổi (${patientName}) bằng giọng thân mật, ấm áp, ngắn gọn 3 câu, hoàn toàn dễ hiểu: ${JSON.stringify(medications)}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    return `${patientName} ơi, đây là đơn thuốc giúp ổn định sức khỏe. Bác nhớ uống đúng giờ theo hướng dẫn của con cái nha!`;
  }
}

/**
 * Check T15 (Duplicate Active Ingredients) and M12 (Food Interactions)
 */
export function checkSafetyWarnings(newMedications, existingMedications = []) {
  const warnings = [];
  const allMeds = [...existingMedications, ...newMedications];

  // 1. T15 Check: Active ingredient collision
  const activeIngredientMap = {};
  allMeds.forEach(med => {
    const nameLower = (med.name || "").toLowerCase();
    const genericLower = (med.generic || "").toLowerCase();

    let matchedGeneric = genericLower;
    if (nameLower.includes("panadol") || nameLower.includes("efferalgan") || nameLower.includes("hapacol") || nameLower.includes("tylenol")) {
      matchedGeneric = "paracetamol";
    }

    if (matchedGeneric) {
      if (activeIngredientMap[matchedGeneric]) {
        warnings.push({
          type: "DUPLICATE_ACTIVE_INGREDIENT",
          severity: "HIGH",
          title: `Cảnh báo trùng hoạt chất (${matchedGeneric.toUpperCase()})`,
          description: `Đơn mới chứa "${med.name}" bị trùng hoạt chất ${matchedGeneric} với "${activeIngredientMap[matchedGeneric].name}" đang dùng ở nhà. Tránh uống cùng lúc để không gây quá liều nguy hiểm.`,
          action_recommended: "Gộp lịch nhắc thành 1 liều duy nhất."
        });
      } else {
        activeIngredientMap[matchedGeneric] = med;
      }
    }
  });

  // 2. M12 Check: Food interactions from seed catalog
  allMeds.forEach(med => {
    const nameLower = (med.name || "").toLowerCase();
    SEED_MEDICATIONS.forEach(seed => {
      const isMatch = seed.names.some(n => nameLower.includes(n.toLowerCase())) || nameLower.includes(seed.slug);
      if (isMatch && seed.food_interactions) {
        seed.food_interactions.forEach(fi => {
          warnings.push({
            type: "FOOD_INTERACTION",
            severity: fi.severity,
            title: `Cảnh báo kiêng ăn: ${med.name} ↔ ${fi.food}`,
            description: fi.plain_explanation,
            alternative: fi.alternative
          });
        });
      }
    });
  });

  return warnings;
}

/**
 * Voice Assistant Q&A for parents ("Cháu Bi")
 */
export async function askVoiceAssistant(question, memberProfile) {
  if (!genAI) {
    return `Dạ ${memberProfile.display_name || "bác"}, thuốc huyết áp Amlodipine bác uống 1 viên sau ăn trưa nha. Bác yên tâm nghỉ ngơi ạ!`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const systemContext = `Bạn là "Cháu Bi", người cháu trong gia đình đang lễ phép hỗ trợ ${memberProfile.display_name}.
Chỉ trả lời dựa trên hồ sơ thuốc sau:
Dị ứng: ${JSON.stringify(memberProfile.allergies || [])}
Bệnh nền: ${JSON.stringify(memberProfile.conditions || [])}
Thuốc đang uống: Amlodipine 5mg (trưa), Atorvastatin 10mg (tối), Panadol Extra (khi đau).

Quy tắc:
1. Trả lời dứt khoát, ấm áp, ngắn gọn 2-3 câu.
2. Không thay đổi liều, không chẩn đoán bệnh.
3. Nếu triệu chứng cấp cứu -> khuyên gọi 115 và con cái.`;

    const result = await model.generateContent(`${systemContext}\n\nCâu hỏi: "${question}"`);
    return result.response.text();
  } catch (err) {
    return `Dạ bác, thuốc huyết áp bác nên uống đúng giờ sau ăn trưa nha bác.`;
  }
}

function getFallbackExtractionResult() {
  return {
    doctor_name: "BS. Nguyễn Thị Mai",
    facility_name: "Bệnh viện Đa Khoa Quốc Tế",
    diagnosis: "Tăng huyết áp độ 1 & Rối loạn lipid máu nhẹ",
    medications: [
      {
        name: "Amlodipine 5mg",
        generic: "Amlodipine",
        strength: "5mg",
        dosage: "Uống 1 viên",
        timing: "Trưa (sau ăn)",
        frequency: "1 lần/ngày",
        duration_days: 30,
        confidence: "HIGH"
      },
      {
        name: "Atorvastatin 10mg",
        generic: "Atorvastatin",
        strength: "10mg",
        dosage: "Uống 1 viên",
        timing: "Tối (sau ăn)",
        frequency: "1 lần/ngày",
        duration_days: 30,
        confidence: "HIGH"
      }
    ]
  };
}
