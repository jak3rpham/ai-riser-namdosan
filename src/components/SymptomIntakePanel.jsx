import React, { useState } from 'react';
import { ChevronRight, PhoneCall, AlertTriangle, CalendarClock, CheckCircle2, Loader2 } from 'lucide-react';
import { INTAKE_STEPS, OUTCOME, describeAnswers } from '../services/symptomTriage';
import { evaluateSymptomAnswers, narrateMildSymptom } from '../services/geminiService';
import MedicalDisclaimer from './MedicalDisclaimer';

/**
 * Bộ hỏi triệu chứng cấu trúc — bước [1] của luồng ở symptomTriage.js.
 *
 * Toàn bộ câu hỏi là CỐ ĐỊNH, không do AI sinh. Sau khi trả lời xong, bảng
 * luật tĩnh quyết định nhánh; AI chỉ được gọi ở nhánh nhẹ nhất và chỉ để
 * diễn đạt lại.
 *
 * Nút chọn để cỡ lớn vì người dùng có thể 70 tuổi và đang khó chịu.
 */
export default function SymptomIntakePanel({ memberProfile, prescriptions, onFinish, onCancel, onAlert }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({ accompanying: [] });
  const [decision, setDecision] = useState(null);
  const [mildText, setMildText] = useState(null);
  const [loading, setLoading] = useState(false);

  const step = INTAKE_STEPS[stepIndex];

  const finish = async (finalAnswers) => {
    const result = evaluateSymptomAnswers(finalAnswers, memberProfile, prescriptions);
    setDecision(result);

    // Nhánh nặng: báo người nhà NGAY, không chờ người dùng bấm gì thêm
    if (onAlert && result.outcome !== OUTCOME.LOG_AND_NOTIFY) {
      onAlert({
        type: result.outcome === OUTCOME.EMERGENCY_115 ? 'EMERGENCY' : 'SAFETY_CRITICAL',
        title: result.outcome === OUTCOME.EMERGENCY_115 ? 'Dấu hiệu cần cấp cứu' : 'Nên đi khám trong hôm nay',
        detail: `${describeAnswers(finalAnswers)} — ${result.reason}`,
        ruleId: result.rule_id
      });
    }

    if (result.outcome === OUTCOME.LOG_AND_NOTIFY) {
      setLoading(true);
      const text = await narrateMildSymptom(describeAnswers(finalAnswers), memberProfile, prescriptions);
      setMildText(text);
      setLoading(false);
    }

    onFinish?.({ answers: finalAnswers, decision: result, summary: describeAnswers(finalAnswers) });
  };

  const pickSingle = (optionId) => {
    const next = { ...answers, [step.key]: optionId };
    setAnswers(next);
    if (stepIndex < INTAKE_STEPS.length - 1) setStepIndex(stepIndex + 1);
    else finish(next);
  };

  const toggleMulti = (optionId) => {
    const current = answers[step.key] || [];
    let updated;
    if (optionId === 'none') updated = ['none'];
    else updated = current.filter(x => x !== 'none').includes(optionId)
      ? current.filter(x => x !== optionId)
      : [...current.filter(x => x !== 'none'), optionId];
    setAnswers({ ...answers, [step.key]: updated });
  };

  const submitMulti = () => {
    const next = { ...answers, [step.key]: answers[step.key] || ['none'] };
    setAnswers(next);
    finish(next);
  };

  /* ── Đã có kết luận ── */
  if (decision) {
    if (decision.outcome === OUTCOME.EMERGENCY_115) {
      return (
        <div style={{ padding: 18, borderRadius: 20, background: '#FEF2F2', border: '2px solid #EF4444' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
            <AlertTriangle size={24} color="#DC2626" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#DC2626', marginBottom: 4 }}>
                Cái này con không dám chờ ạ
              </div>
              <div style={{ fontSize: 14.5, color: '#7F1D1D', fontWeight: 600, lineHeight: 1.5 }}>
                {decision.advice}
              </div>
            </div>
          </div>

          <a href="tel:115" style={{ textDecoration: 'none', display: 'block' }}>
            <button style={{ width: '100%', padding: 18, borderRadius: 16, background: '#DC2626', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <PhoneCall size={22} /> GỌI 115 NGAY
            </button>
          </a>

          <div style={{ marginTop: 10, fontSize: 12, color: '#991B1B', fontWeight: 600 }}>
            Lý do: {decision.reason}
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
            Luật {decision.rule_id} · bảng v{decision.rules_version} · chưa được bác sĩ rà
          </div>
        </div>
      );
    }

    if (decision.outcome === OUTCOME.SEE_DOCTOR_24H) {
      return (
        <div style={{ padding: 18, borderRadius: 20, background: '#FFFBEB', border: '2px solid #F59E0B' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
            <CalendarClock size={22} color="#B45309" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: '#B45309', marginBottom: 4 }}>
                Dạ con ghi lại rồi ạ — cái này nên đi khám hôm nay
              </div>
              <div style={{ fontSize: 14.5, color: '#78350F', fontWeight: 600, lineHeight: 1.5 }}>
                {decision.advice}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href="tel:115" style={{ textDecoration: 'none', flex: 1 }}>
              <button style={{ width: '100%', padding: 12, borderRadius: 12, background: '#FFF', color: '#B45309', border: '1.5px solid #F59E0B', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                Nặng hơn thì gọi 115
              </button>
            </a>
            <button onClick={onCancel} style={{ flex: 1, padding: 12, borderRadius: 12, background: '#B45309', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
              Đã báo người nhà
            </button>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: '#92400E', fontWeight: 600 }}>
            Lý do: {decision.reason}
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
            Luật {decision.rule_id} · bảng v{decision.rules_version} · chưa được bác sĩ rà
          </div>
          <MedicalDisclaimer variant="inline" />
        </div>
      );
    }

    // Nhánh nhẹ — ghi nhận + báo người nhà
    return (
      <div style={{ padding: 18, borderRadius: 20, background: '#F0FDF4', border: '1.5px solid #86EFAC' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <CheckCircle2 size={22} color="var(--emerald-ok)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 14.5, color: '#166534', fontWeight: 600, lineHeight: 1.6 }}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Loader2 className="animate-spin" size={16} /> Cháu Bi đang ghi lại...</span>
              : mildText}
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
          Đã ghi: {describeAnswers(answers)}
        </div>
        <MedicalDisclaimer variant="inline" />
      </div>
    );
  }

  /* ── Đang hỏi ── */
  const selected = answers[step.key];

  return (
    <div style={{ padding: 18, borderRadius: 20, background: 'rgba(241,245,249,0.7)', border: '1px solid var(--glass-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Câu {stepIndex + 1} / {INTAKE_STEPS.length}
        </span>
        <button onClick={onCancel} style={{ border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
          Thôi để lúc khác
        </button>
      </div>

      <h4 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 12, lineHeight: 1.4 }}>
        {step.question}
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
        {step.options.map(opt => {
          const isOn = step.multi ? (selected || []).includes(opt.id) : selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => (step.multi ? toggleMulti(opt.id) : pickSingle(opt.id))}
              style={{
                textAlign: 'left', padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                background: isOn ? 'var(--coral-soft)' : '#FFF',
                border: isOn ? '2px solid var(--coral-main)' : '1px solid var(--glass-border)',
                color: 'var(--text-dark)', fontWeight: 700, fontSize: 15.5,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10
              }}
            >
              <span>
                {opt.label}
                {opt.hint && <span style={{ display: 'block', fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{opt.hint}</span>}
              </span>
              {!step.multi && <ChevronRight size={18} color="var(--text-muted)" />}
              {step.multi && isOn && <CheckCircle2 size={18} color="var(--coral-main)" />}
            </button>
          );
        })}
      </div>

      {step.multi && (
        <button className="btn-primary" onClick={submitMulti} style={{ width: '100%', marginTop: 12, padding: 14, borderRadius: 14, fontSize: 16 }}>
          Xong, con xem giúp bác
        </button>
      )}
    </div>
  );
}
