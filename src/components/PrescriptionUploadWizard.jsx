import React, { useState } from 'react';
import { Camera, Upload, CheckCircle2, AlertTriangle, Sparkles, Loader2, Calendar } from 'lucide-react';
import { extractPrescriptionFromImage, generatePlainExplanation } from '../services/geminiService';
import { syncPrescriptionToCalendar, createRefillTask } from '../services/workspaceService';

export default function PrescriptionUploadWizard({ onAddPrescription, selectedMember }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('upload'); // 'upload' | 'confirm' | 'success'
  const [extractedResult, setExtractedResult] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      setPreviewImage(base64);
      setLoading(true);
      
      const result = await extractPrescriptionFromImage(base64);
      setExtractedResult(result);
      setLoading(false);
      setStep('confirm');
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmAndSave = async () => {
    setLoading(true);
    const explanation = await generatePlainExplanation(extractedResult.medications, selectedMember.display_name);

    const newPrescription = {
      id: `doc_${Date.now()}`,
      member_id: selectedMember.id,
      document_title: `${extractedResult.diagnosis || 'Đơn thuốc mới'} — ${extractedResult.facility_name || 'Bệnh viện'}`,
      doctor_name: extractedResult.doctor_name,
      created_at: new Date().toISOString().split('T')[0],
      explanation,
      medications: extractedResult.medications.map((m, idx) => ({
        id: `med_${Date.now()}_${idx}`,
        name: m.name,
        generic: m.generic || m.name,
        strength: m.strength || "Standard",
        dosage: m.dosage || "Uống 1 viên",
        timing: m.timing || "Sau ăn",
        time_slot: m.timing?.includes("Sáng") ? "Sáng" : m.timing?.includes("Trưa") ? "Trưa" : "Tối",
        frequency: m.frequency || "1 lần/ngày",
        duration_days: m.duration_days || 14,
        est_remaining: m.duration_days || 14,
        photo_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"
      }))
    };

    // Auto-sync Workspace (Calendar & Tasks)
    await syncPrescriptionToCalendar(newPrescription, selectedMember.display_name);
    await createRefillTask(newPrescription.medications[0].name, 5, selectedMember.display_name);

    onAddPrescription(newPrescription);
    setLoading(false);
    setStep('success');
  };

  return (
    <div className="liquid-card" style={{ padding: 28, marginBottom: 24 }}>
      {step === 'upload' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'var(--coral-soft)', color: 'var(--coral-main)', fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
              <Sparkles size={14} /> Gemini 1.5 Vision AI
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)' }}>📷 Scan Đơn thuốc / Vỏ thuốc mới</h3>
            <p style={{ fontSize: 14, color: 'var(--text-sub)', marginTop: 4 }}>
              Tải ảnh đơn thuốc hoặc vỏ thuốc của {selectedMember.display_name}. AI sẽ đọc, giải thích bình dân và tự động tạo lịch uống thuốc.
            </p>
          </div>

          <label className="btn-primary" style={{ cursor: 'pointer' }}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
            <span>{loading ? "AI đang đọc..." : "+ Scan / Tải ảnh lên"}</span>
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} hidden />
          </label>
        </div>
      )}

      {step === 'confirm' && extractedResult && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>Xác nhận Trích xuất AI (Human Confirm)</h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-sub)' }}>
                Vui lòng kiểm tra lại danh sách thuốc trích xuất từ đơn của {selectedMember.display_name}.
              </p>
            </div>
            <span style={{ padding: '6px 14px', borderRadius: 99, background: 'var(--emerald-soft)', color: 'var(--emerald-ok)', fontWeight: 800, fontSize: 13 }}>
              ✓ Gemini Vision đọc thành công
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Ảnh đơn gốc:</h4>
              {previewImage && <img src={previewImage} alt="Prescription" style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 18, border: '1px solid var(--glass-border)' }} />}
            </div>

            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Danh sách thuốc phát hiện:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
                {extractedResult.medications.map((med, idx) => (
                  <div key={idx} style={{ padding: 14, borderRadius: 14, background: '#FFF', border: '1px solid var(--glass-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15 }}>
                      <span>{med.name} ({med.strength})</span>
                      <span style={{ fontSize: 12, color: 'var(--coral-main)', background: 'var(--coral-soft)', padding: '2px 8px', borderRadius: 99 }}>{med.timing}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 4 }}>
                      Liều: {med.dosage} · Thời gian: {med.duration_days} ngày
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button className="btn-secondary" onClick={() => setStep('upload')}>Hủy</button>
            <button className="btn-primary" onClick={handleConfirmAndSave} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              <span>Xác nhận & Tự sinh Lịch</span>
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div style={{ textCenter: 'center', padding: '12px 0' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald-ok)', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
            <CheckCircle2 size={32} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)', textAlign: 'center' }}>Đã lưu đơn thuốc & Đồng bộ Google Workspace!</h3>
          <p style={{ fontSize: 14, color: 'var(--text-sub)', textAlign: 'center', marginTop: 4 }}>
            Lịch nhắc uống thuốc đã được đồng bộ vào Google Calendar của bạn & app của {selectedMember.display_name}.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
            <button className="btn-primary" onClick={() => setStep('upload')}>+ Quét thêm đơn khác</button>
          </div>
        </div>
      )}
    </div>
  );
}
