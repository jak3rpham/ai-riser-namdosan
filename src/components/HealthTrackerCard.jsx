import React, { useState, useRef } from 'react';
import { Activity, Plus, CheckCircle2, AlertTriangle, TrendingUp, Info, X, Camera, Loader2 } from 'lucide-react';
import { evaluateVital } from '../services/safetyChecks';
import { VITAL_THRESHOLDS } from '../services/medicalKnowledge';
import { readDeviceImage } from '../services/geminiService';
import MedicalDisclaimer from './MedicalDisclaimer';

const TONE_STYLE = {
  critical: { bg: '#FEF2F2', fg: '#DC2626', chipBg: '#DC2626', chipFg: '#FFF' },
  warn: { bg: '#FFFBEB', fg: '#B45309', chipBg: '#F59E0B', chipFg: '#FFF' },
  caution: { bg: '#FFFBEB', fg: '#B45309', chipBg: '#FDE68A', chipFg: '#78350F' },
  ok: { bg: '#FFF', fg: 'var(--text-dark)', chipBg: 'var(--emerald-soft)', chipFg: 'var(--emerald-ok)' },
  neutral: { bg: '#FFF', fg: 'var(--text-dark)', chipBg: '#F1F5F9', chipFg: 'var(--text-muted)' }
};

const nowLabel = () => {
  const d = new Date();
  return `Hôm nay, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function HealthTrackerCard({ selectedMember, readings = [], onSaveReading, language = 'vi' }) {
  /**
   * ⚠️ Bản trước khởi tạo sẵn ba chỉ số BỊA CỨNG (125/82, đường huyết 5.8,
   * cân nặng 64.5) và hiện chúng cho MỌI người được chăm sóc. Khai báo mẹ
   * mình vào app là thấy ngay "huyết áp của mẹ" mà không ai từng đo — vi phạm
   * ranh giới y tế số 5. Ngoài ra chỉ số nằm trong useState nên tải lại trang
   * là mất.
   *
   * Giờ đọc từ Firestore. Chưa đo lần nào thì hiện trống, không đoán hộ.
   * Dữ liệu hư cấu chỉ nằm ở nhà mẫu (`demoSeed.js`), không nằm trong code
   * của component.
   */
  const metrics = readings;
  const [saveError, setSaveError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('BLOOD_PRESSURE');
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [pulse, setPulse] = useState('');
  const [val, setVal] = useState('');
  const [formError, setFormError] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setSys(''); setDia(''); setPulse(''); setVal(''); setFormError(null);
  };

  const handleDeviceImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setFormError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      const res = await readDeviceImage(base64);

      setOcrLoading(false);

      if (!res.ok) {
        setFormError(res.error_message);
        return;
      }

      if (res.systolic != null) setSys(String(res.systolic));
      if (res.diastolic != null) setDia(String(res.diastolic));
      if (res.pulse != null) setPulse(String(res.pulse));
      setFormType('BLOOD_PRESSURE');
      setShowForm(true);
    };

    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setFormError(null);
    setSaveError(null);

    if (formType === 'BLOOD_PRESSURE') {
      const s = parseInt(sys, 10);
      const d = parseInt(dia, 10);
      const p = pulse ? parseInt(pulse, 10) : null;

      if (!Number.isFinite(s) || !Number.isFinite(d)) return setFormError('Bạn nhập cả hai số huyết áp giúp mình nhé.');
      if (s < 50 || s > 300 || d < 30 || d > 200) return setFormError('Số này nằm ngoài khoảng máy đo thường cho ra. Bạn kiểm tra lại giúp nhé.');
      if (d >= s) return setFormError('Số dưới phải nhỏ hơn số trên. Bạn xem lại giúp nhé.');

      const res = await onSaveReading?.({ type: 'BLOOD_PRESSURE', label: 'Huyết áp', sys: s, dia: d, pulse: p, time: nowLabel() });
      if (res && !res.ok) return setSaveError(res.error_message || 'Chưa lưu được số đo. Bạn thử lại nhé.');
    } else {
      const v = parseFloat(val);
      if (!Number.isFinite(v)) return setFormError('Bạn nhập số đo giúp mình nhé.');
      if (formType === 'BLOOD_SUGAR' && (v < 1 || v > 40)) return setFormError('Số đường huyết nằm ngoài khoảng thường gặp (mmol/L). Bạn kiểm tra lại đơn vị giúp nhé.');
      if (formType === 'TEMPERATURE' && (v < 30 || v > 45)) return setFormError('Nhiệt độ nằm ngoài khoảng máy đo thường cho ra.');
      if (formType === 'WEIGHT' && (v < 20 || v > 250)) return setFormError('Cân nặng nằm ngoài khoảng thường gặp.');

      const labels = { BLOOD_SUGAR: 'Đường huyết', TEMPERATURE: 'Nhiệt độ', WEIGHT: 'Cân nặng' };
      const res = await onSaveReading?.({ type: formType, label: labels[formType], val: v, time: nowLabel() });
      if (res && !res.ok) return setSaveError(res.error_message || 'Chưa lưu được số đo. Bạn thử lại nhé.');
    }

    resetForm();
    setShowForm(false);
  };

  const alerts = metrics
    .slice(0, 3)
    .map(m => ({ metric: m, evalResult: evaluateVital(m) }))
    .filter(x => x.evalResult.tone === 'critical' || x.evalResult.tone === 'warn');

  return (
    <div className="liquid-card" style={{ padding: 26 }}>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleDeviceImageUpload}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity color="var(--coral-main)" /> Nhật Ký Chỉ Số Sức Khỏe (M17)
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-sub)' }}>
            Ghi lại chỉ số từ máy đo tại nhà (nhập tay hoặc chụp ảnh màn hình máy đo). App đối chiếu với ngưỡng tham chiếu y tế cố định.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={ocrLoading}
            style={{ padding: '8px 16px', borderRadius: 99, fontSize: 13, cursor: 'pointer', border: '1px solid var(--sky-blue)', color: 'var(--sky-blue)' }}
          >
            {ocrLoading ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
            {ocrLoading ? 'Đang đọc số từ ảnh...' : '📷 Quét ảnh máy đo'}
          </button>

          <button
            className="btn-secondary"
            onClick={() => { setShowForm(!showForm); resetForm(); }}
            style={{ padding: '8px 16px', borderRadius: 99, fontSize: 13, cursor: 'pointer', border: '1px solid var(--coral-border)', color: 'var(--coral-main)', background: 'var(--coral-soft)' }}
          >
            {showForm ? <><X size={16} /> Đóng</> : <><Plus size={16} /> Nhập chỉ số mới</>}
          </button>
        </div>
      </div>

      {/* Form nhập tay & kết quả OCR */}
      {showForm && (
        <div style={{ padding: 18, borderRadius: 18, background: 'rgba(241,245,249,0.7)', border: '1px solid var(--glass-border)', marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {[
              ['BLOOD_PRESSURE', 'Huyết áp'],
              ['BLOOD_SUGAR', 'Đường huyết'],
              ['TEMPERATURE', 'Nhiệt độ'],
              ['WEIGHT', 'Cân nặng']
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setFormType(key); resetForm(); }}
                style={{
                  padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  background: formType === key ? 'var(--coral-main)' : '#FFF',
                  color: formType === key ? '#FFF' : 'var(--text-sub)',
                  border: formType === key ? 'none' : '1px solid var(--glass-border)'
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {formType === 'BLOOD_PRESSURE' ? (
              <>
                <input type="number" inputMode="numeric" placeholder="Số trên (Tâm thu)" value={sys} onChange={e => setSys(e.target.value)}
                  style={{ width: 140, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontSize: 16, fontFamily: 'inherit' }} />
                <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>/</span>
                <input type="number" inputMode="numeric" placeholder="Số dưới (Tâm trương)" value={dia} onChange={e => setDia(e.target.value)}
                  style={{ width: 160, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontSize: 16, fontFamily: 'inherit' }} />
                <input type="number" inputMode="numeric" placeholder="Mạch (BPM)" value={pulse} onChange={e => setPulse(e.target.value)}
                  style={{ width: 150, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontSize: 16, fontFamily: 'inherit' }} />
              </>
            ) : (
              <input type="number" inputMode="decimal" step="0.1"
                placeholder={`Số đo (${VITAL_THRESHOLDS[formType]?.unit || ''})`}
                value={val} onChange={e => setVal(e.target.value)}
                style={{ width: 200, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontSize: 16, fontFamily: 'inherit' }} />
            )}

            <button className="btn-primary" onClick={handleSave} style={{ padding: '12px 22px', borderRadius: 12 }}>Lưu</button>
          </div>

          {VITAL_THRESHOLDS[formType]?.note && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <Info size={13} style={{ flexShrink: 0, marginTop: 2 }} /> {VITAL_THRESHOLDS[formType].note}
            </div>
          )}

          {formError && (
            <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: '#FEF2F2', color: '#B91C1C', fontSize: 13, fontWeight: 700 }}>
              {formError}
            </div>
          )}
        </div>
      )}

      {saveError && (
        <div style={{ padding: '11px 14px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', marginBottom: 12, fontSize: 13.5, color: '#B91C1C', fontWeight: 700 }}>
          {saveError}
        </div>
      )}

      {/* Chưa đo lần nào — nói thẳng là chưa có, không đoán hộ một con số nào */}
      {metrics.length === 0 && !showForm && (
        <div style={{ padding: '18px 16px', borderRadius: 14, background: 'rgba(241,245,249,0.7)', textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 4 }}>
            Chưa có số đo nào
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.5 }}>
            Đo huyết áp hay đường huyết ở nhà xong, bấm "Ghi số đo" để lưu lại.
            Chụp luôn mặt máy đo cũng được.
          </div>
        </div>
      )}

      {/* Cảnh báo ngưỡng */}
      {alerts.map((a, idx) => {
        const tone = TONE_STYLE[a.evalResult.tone];
        return (
          <div key={idx} style={{ padding: 14, borderRadius: 14, background: tone.bg, border: `1.5px solid ${tone.chipBg}`, marginBottom: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertTriangle size={18} color={tone.fg} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: tone.fg }}>
                {a.metric.label}: {a.evalResult.label}
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-sub)', fontWeight: 600, marginTop: 2, lineHeight: 1.5 }}>
                {a.evalResult.message}
              </div>
              {a.evalResult.pulse_flag && (
                <div style={{ fontSize: 13, color: tone.fg, fontWeight: 700, marginTop: 4 }}>
                  Kèm theo: {a.evalResult.pulse_flag.label} ({a.metric.pulse} lần/phút)
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Danh sách chỉ số */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16 }}>
        {metrics.slice(0, 6).map((item, idx) => {
          const ev = evaluateVital(item);
          const tone = TONE_STYLE[ev.tone] || TONE_STYLE.neutral;

          return (
            <div key={idx} style={{ padding: 18, borderRadius: 20, background: tone.bg, border: `1px solid ${ev.tone === 'ok' || ev.tone === 'neutral' ? 'var(--glass-border)' : tone.chipBg}`, boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.label}</span>
                <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: tone.chipBg, color: tone.chipFg, whiteSpace: 'nowrap' }}>
                  {ev.label}
                </span>
              </div>

              <div style={{ margin: '10px 0 4px' }}>
                {item.type === 'BLOOD_PRESSURE' ? (
                  <div style={{ fontSize: 26, fontWeight: 800, color: tone.fg }}>
                    {item.sys}/{item.dia} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>mmHg</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 26, fontWeight: 800, color: tone.fg }}>
                    {item.val} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>{ev.unit}</span>
                  </div>
                )}
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-sub)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingUp size={13} color="var(--text-muted)" /> {item.time}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        <Info size={13} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          Nhãn cao/thấp lấy từ ngưỡng tham chiếu chung cố định trong app, không phải chẩn đoán AI.
        </span>
      </div>

      <MedicalDisclaimer variant="inline" language={language} />
    </div>
  );
}
