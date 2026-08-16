import React, { useState } from 'react';
import { Camera, CheckCircle2, AlertTriangle, Sparkles, Loader2, Pencil, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { extractPrescriptionFromImage, generatePlainExplanation } from '../services/geminiService';
import { runAllSafetyChecks } from '../services/safetyChecks';
import { syncPrescriptionToWorkspace, describeSyncResult } from '../services/workspaceService';
import { I18N_STRINGS } from '../services/mockData';
import SignatureAlertCard from './SignatureAlertCard';
import MedicalDisclaimer from './MedicalDisclaimer';

/**
 * Luồng scan đơn thuốc.
 *
 * ⚠️ Ba thay đổi so với bản trước (doc 33 mục 4 & 9):
 *
 * 1. AI lỗi KHÔNG còn trả về đơn thuốc bịa. Bản cũ khi lỗi trả về một đơn
 *    Amlodipine + Atorvastatin dựng sẵn kèm tên bác sĩ không có thật, mà UI
 *    vẫn hiện badge xanh "Gemini Vision đọc thành công", rồi đồng bộ thẳng vào
 *    Google Calendar. Giờ lỗi → màn nhập tay.
 *
 * 2. Màn xác nhận giờ SỬA ĐƯỢC. Bản cũ tên là "Human Confirm" nhưng chỉ render
 *    text, không có một ô input nào — người dùng thấy AI đọc sai liều thì
 *    không làm gì được. doc 27 R1 chọn chính màn này làm phương án dự phòng
 *    cho đơn viết tay.
 *
 * 3. Không còn default bịa (`dosage: "Uống 1 viên"`, `duration_days: 14`,
 *    mọi thuốc không parse được giờ đều thành cữ Tối). Trường thiếu để trống
 *    và BẮT người dùng điền.
 */

const EMPTY_MED = () => ({
  name: '', generic: '', strength: '', dosage: '', timing: '',
  frequency: '', duration_days: '', confidence: 1.0, _manual: true
});

const TIME_SLOTS = ['Sáng', 'Trưa', 'Chiều', 'Tối', 'Khi cần'];

/** Ngưỡng theo doc 25 mục 1: dưới mức này phải tô vàng để người dùng kiểm lại */
const LOW_CONFIDENCE = 0.85;

export default function PrescriptionUploadWizard({
  onAddPrescription, selectedMember, prescriptions = [], language = 'vi'
}) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('upload'); // upload | confirm | error | success
  const [meds, setMeds] = useState([]);
  const [meta, setMeta] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [extractionError, setExtractionError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [syncResult, setSyncResult] = useState(null);

  const t = I18N_STRINGS[language] || I18N_STRINGS.vi;

  const existingMeds = prescriptions
    .filter(p => p.member_id === selectedMember?.id)
    .flatMap(p => p.medications || []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      setPreviewImage(base64);
      setLoading(true);
      setValidationError(null);

      const result = await extractPrescriptionFromImage(base64);
      setLoading(false);

      if (!result.ok) {
        setExtractionError(result);
        setStep('error');
        return;
      }

      setMeta({
        doctor_name: result.doctor_name || '',
        facility_name: result.facility_name || '',
        diagnosis: result.diagnosis || ''
      });
      setMeds(result.medications.map(m => ({
        name: m.name || '',
        generic: m.generic || '',
        strength: m.strength || '',
        dosage: m.dosage || '',
        timing: m.timing || '',
        frequency: m.frequency || '',
        duration_days: m.duration_days ?? '',
        confidence: m.confidence ?? 0.5,
        _manual: false
      })));
      setStep('confirm');
    };
    reader.readAsDataURL(file);
  };

  const startManualEntry = () => {
    setMeds([EMPTY_MED()]);
    setMeta({ doctor_name: '', facility_name: '', diagnosis: '' });
    setExtractionError(null);
    setValidationError(null);
    setStep('confirm');
  };

  const updateMed = (idx, field, value) => {
    setMeds(meds.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
    setValidationError(null);
  };

  const removeMed = (idx) => setMeds(meds.filter((_, i) => i !== idx));

  /** Không cho lưu khi còn trường bắt buộc trống — thay cho việc tự điền bừa */
  const validate = () => {
    if (!meds.length) return 'Cần ít nhất một thuốc.';
    for (const [i, m] of meds.entries()) {
      if (!m.name.trim()) return `Thuốc thứ ${i + 1}: chưa có tên thuốc.`;
      if (!m.dosage.trim()) return `"${m.name}": chưa ghi liều (vd "uống 1 viên"). Bạn xem lại đơn giúp nhé.`;
      if (!m.timing.trim()) return `"${m.name}": chưa chọn cữ uống.`;
      if (!String(m.duration_days).trim()) return `"${m.name}": chưa ghi số ngày uống.`;
    }
    return null;
  };

  const handleConfirmAndSave = async () => {
    const err = validate();
    if (err) return setValidationError(err);

    setLoading(true);

    const medications = meds.map((m, idx) => ({
      id: `med_${Date.now()}_${idx}`,
      name: m.name.trim(),
      generic: m.generic.trim() || null,
      strength: m.strength.trim() || null,
      dosage: m.dosage.trim(),
      timing: m.timing.trim(),
      time_slot: TIME_SLOTS.find(s => m.timing.includes(s)) || m.timing.trim(),
      frequency: m.frequency.trim() || null,
      duration_days: parseInt(m.duration_days, 10),
      days_elapsed: 0,
      est_remaining: parseInt(m.duration_days, 10),
      confirmed_by_human: true,
      source: m._manual ? 'MANUAL' : 'AI_EXTRACTED_HUMAN_CONFIRMED'
    }));

    const explanation = await generatePlainExplanation(
      medications,
      selectedMember.display_name,
      selectedMember   // để xưng hô theo đúng người, không mặc định "bác"
    );

    const newPrescription = {
      id: `doc_${Date.now()}`,
      member_id: selectedMember.id,
      document_title: `${meta.diagnosis || 'Đơn thuốc mới'}${meta.facility_name ? ` — ${meta.facility_name}` : ''}`,
      doctor_name: meta.doctor_name || null,
      created_at: new Date().toISOString().split('T')[0],
      explanation,
      medications
    };

    /**
     * ⚠️ Lưu TRƯỚC, và phải đọc kết quả lưu.
     *
     * Bản trước gọi `onAddPrescription(...)` rồi vứt giá trị trả về, và luôn
     * nhảy sang màn "Đã lưu đơn thuốc". Mà hàm đó trả `{ ok: false }` thật khi
     * Firestore từ chối — mất mạng, hết quyền, rules chặn. Nghĩa là: người nhà
     * ngồi nhập tay xong cả đơn thuốc, app báo đã lưu, đóng máy — và trong hồ
     * sơ không có gì cả. Ba mẹ không được nhắc uống thuốc, mà không ai biết.
     *
     * Đây đúng loại lỗi doc 33 mục C2: app nói nó đã làm một việc nó không làm.
     *
     * Thứ tự cũng đổi: đồng bộ Google chỉ chạy SAU khi đơn đã nằm trong hồ sơ.
     * Không thì lịch nhắc mọc lên trên Calendar cho một đơn thuốc không tồn tại.
     */
    const saved = await onAddPrescription(newPrescription);

    if (saved && saved.ok === false) {
      setLoading(false);
      setValidationError(
        `Chưa lưu được đơn thuốc: ${saved.error_message || 'lỗi kết nối'}. `
        + 'Bạn kiểm tra mạng rồi bấm "Xác nhận" lại nhé — nội dung vừa nhập vẫn còn nguyên ở đây.'
      );
      return;
    }

    // Đồng bộ Google là việc PHỤ — thất bại không được làm mất đơn thuốc.
    // Kết quả thật được giữ lại để màn cuối nói đúng chuyện đã xảy ra, thay vì
    // luôn khẳng định "đã đồng bộ" như bản trước.
    const sync = await syncPrescriptionToWorkspace(newPrescription, selectedMember.display_name);
    setSyncResult(describeSyncResult(sync));

    setLoading(false);
    setStep('success');
  };

  // Kiểm tra an toàn chạy ngay trên màn xác nhận, TRƯỚC khi lưu
  const safety = step === 'confirm'
    ? runAllSafetyChecks({
        newMedications: meds.filter(m => m.name.trim()),
        existingMedications: existingMeds,
        memberProfile: selectedMember || {}
      })
    : null;

  const criticalCount = safety?.warnings.filter(w => w.severity === 'CRITICAL').length || 0;

  return (
    <div className="liquid-card" style={{ padding: 28, marginBottom: 24 }}>

      {/* ── Bước 1: tải ảnh ── */}
      {step === 'upload' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'var(--coral-soft)', color: 'var(--coral-main)', fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
              <Sparkles size={14} /> Gemini Vision
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)' }}>📷 {t.scan_prescription}</h3>
            <p style={{ fontSize: 14, color: 'var(--text-sub)', marginTop: 4, maxWidth: 460, lineHeight: 1.55 }}>
              AI đọc đơn rồi bạn kiểm lại từng dòng trước khi lưu. AI đề xuất — người xác nhận.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={startManualEntry} style={{ padding: '12px 20px', borderRadius: 14 }}>
              <Pencil size={16} /> Nhập tay
            </button>
            <label className="btn-primary" style={{ cursor: 'pointer' }}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
              <span>{loading ? 'AI đang đọc...' : t.upload_btn}</span>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} hidden />
            </label>
          </div>
        </div>
      )}

      {/* ── Bước lỗi: KHÔNG bịa dữ liệu ── */}
      {step === 'error' && (
        <div>
          <div style={{ padding: 20, borderRadius: 18, background: '#FFFBEB', border: '1.5px solid #FDE68A', display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 18 }}>
            <AlertTriangle size={24} color="#B45309" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ fontSize: 16.5, fontWeight: 800, color: '#B45309' }}>Chưa đọc được đơn này</h4>
              <p style={{ fontSize: 14, color: '#78350F', fontWeight: 600, marginTop: 4, lineHeight: 1.55 }}>
                {extractionError?.error_message}
              </p>
              {extractionError?.unreadable_parts?.length > 0 && (
                <p style={{ fontSize: 13, color: '#92400E', marginTop: 6, fontWeight: 600 }}>
                  Phần không đọc được: {extractionError.unreadable_parts.join('; ')}
                </p>
              )}
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 8, fontWeight: 600 }}>
                Mã lỗi: {extractionError?.error_code}. App không tự đoán nội dung đơn thuốc — nhập tay sẽ chắc chắn hơn.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => { setStep('upload'); setExtractionError(null); }}>
              <ArrowLeft size={16} /> Chụp lại
            </button>
            <button className="btn-primary" onClick={startManualEntry}>
              <Pencil size={16} /> Nhập tay
            </button>
          </div>
        </div>
      )}

      {/* ── Bước 2: xác nhận, sửa được ── */}
      {step === 'confirm' && (
        <div>
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800 }}>Kiểm lại trước khi lưu</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-sub)', marginTop: 2 }}>
              Sửa trực tiếp vào ô bên dưới. Ô <span style={{ background: '#FEF3C7', padding: '1px 6px', borderRadius: 6, fontWeight: 700 }}>viền vàng</span> là chỗ AI đọc không chắc — kiểm kỹ giúp nhé.
            </p>
          </div>

          {/* Cảnh báo an toàn chạy ngay tại đây */}
          {safety && safety.warnings.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <SignatureAlertCard warnings={safety.warnings} coverage={safety.coverage} />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: previewImage ? '260px 1fr' : '1fr', gap: 20 }}>
            {previewImage && (
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Ảnh gốc</h4>
                <img src={previewImage} alt="Đơn thuốc" style={{ width: '100%', borderRadius: 16, border: '1px solid var(--glass-border)' }} />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {meds.map((med, idx) => {
                const lowConf = !med._manual && med.confidence < LOW_CONFIDENCE;
                const inputStyle = (filled) => ({
                  padding: '9px 12px', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', width: '100%',
                  border: filled ? '1px solid var(--glass-border)' : '1.5px solid #FCA5A5',
                  background: filled ? '#FFF' : '#FFF5F5', outline: 'none'
                });

                return (
                  <div key={idx} style={{ padding: 16, borderRadius: 16, background: lowConf ? '#FFFBEB' : '#FFF', border: lowConf ? '1.5px solid #FBBF24' : '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>
                        THUỐC {idx + 1}
                        {!med._manual && (
                          <span style={{ marginLeft: 8, color: lowConf ? '#B45309' : 'var(--emerald-ok)' }}>
                            · AI đọc {Math.round(med.confidence * 100)}% chắc chắn
                          </span>
                        )}
                        {med._manual && <span style={{ marginLeft: 8, color: 'var(--sky-blue)' }}>· nhập tay</span>}
                      </span>
                      <button onClick={() => removeMed(idx)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#DC2626', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 700 }}>
                        <Trash2 size={14} /> Xoá
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginBottom: 8 }}>
                      <input placeholder="Tên thuốc *" value={med.name} onChange={e => updateMed(idx, 'name', e.target.value)} style={inputStyle(med.name.trim())} />
                      <input placeholder="Hàm lượng" value={med.strength} onChange={e => updateMed(idx, 'strength', e.target.value)} style={inputStyle(true)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <input placeholder="Liều mỗi lần * (vd: uống 1 viên)" value={med.dosage} onChange={e => updateMed(idx, 'dosage', e.target.value)} style={inputStyle(med.dosage.trim())} />
                      <input placeholder="Số lần/ngày" value={med.frequency} onChange={e => updateMed(idx, 'frequency', e.target.value)} style={inputStyle(true)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
                      <select value={med.timing} onChange={e => updateMed(idx, 'timing', e.target.value)} style={inputStyle(med.timing.trim())}>
                        <option value="">— Chọn cữ uống * —</option>
                        {TIME_SLOTS.flatMap(slot =>
                          slot === 'Khi cần'
                            ? [<option key={slot} value={slot}>{slot}</option>]
                            : [
                                <option key={`${slot}-sau`} value={`${slot} (sau ăn)`}>{slot} (sau ăn)</option>,
                                <option key={`${slot}-truoc`} value={`${slot} (trước ăn)`}>{slot} (trước ăn)</option>
                              ]
                        )}
                      </select>
                      <input type="number" inputMode="numeric" placeholder="Số ngày *" value={med.duration_days} onChange={e => updateMed(idx, 'duration_days', e.target.value)} style={inputStyle(String(med.duration_days).trim())} />
                    </div>
                  </div>
                );
              })}

              <button className="btn-secondary" onClick={() => setMeds([...meds, EMPTY_MED()])} style={{ padding: '10px 16px', borderRadius: 12, alignSelf: 'flex-start' }}>
                <Plus size={16} /> Thêm thuốc
              </button>
            </div>
          </div>

          {validationError && (
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, background: '#FEF2F2', color: '#B91C1C', fontSize: 13.5, fontWeight: 700 }}>
              {validationError}
            </div>
          )}

          {criticalCount > 0 && (
            <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 12, background: '#FEF2F2', border: '1.5px solid #DC2626', color: '#991B1B', fontSize: 13.5, fontWeight: 700 }}>
              Có {criticalCount} cảnh báo nghiêm trọng ở trên. Bạn xác nhận lại với dược sĩ trước khi cho uống nhé — app vẫn cho lưu để bạn có sổ mang đi hỏi.
            </div>
          )}

          <MedicalDisclaimer variant="inline" />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <button className="btn-secondary" onClick={() => { setStep('upload'); setMeds([]); setPreviewImage(null); }}>Huỷ</button>
            <button className="btn-primary" onClick={handleConfirmAndSave} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              <span>Xác nhận & Tạo lịch nhắc</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Bước 3: xong ── */}
      {step === 'success' && (
        <div style={{ padding: '12px 0' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald-ok)', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
            <CheckCircle2 size={32} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)', textAlign: 'center' }}>Đã lưu đơn thuốc</h3>
          <p style={{ fontSize: 14, color: 'var(--text-sub)', textAlign: 'center', marginTop: 4 }}>
            Đơn đã lưu vào app của {selectedMember.display_name}.
          </p>

          {/* Trạng thái đồng bộ Google — nói đúng kết quả thật, kể cả khi trượt */}
          {syncResult && (
            <div style={{
              margin: '14px auto 0', maxWidth: 520, padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 700, lineHeight: 1.55, textAlign: 'center',
              background: { success: '#F0FDF4', warning: '#FFFBEB', error: '#FEF2F2', info: 'rgba(241,245,249,0.9)' }[syncResult.tone],
              color: { success: '#166534', warning: '#B45309', error: '#991B1B', info: 'var(--text-muted)' }[syncResult.tone],
              border: `1px solid ${{ success: '#86EFAC', warning: '#FDE68A', error: '#FCA5A5', info: 'var(--glass-border)' }[syncResult.tone]}`
            }}>
              {syncResult.text}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
            <button className="btn-primary" onClick={() => { setStep('upload'); setMeds([]); setPreviewImage(null); }}>+ Quét đơn khác</button>
          </div>
        </div>
      )}
    </div>
  );
}
