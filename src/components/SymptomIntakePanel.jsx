import React, { useState } from 'react';
import { ChevronRight, PhoneCall, AlertTriangle, CalendarClock, CheckCircle2, Loader2 } from 'lucide-react';
import { INTAKE_STEPS, OUTCOME, describeAnswers } from '../services/symptomTriage';
import { speak } from '../services/honorifics';
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
export default function SymptomIntakePanel({ memberProfile, prescriptions, onFinish, onCancel, onAlert, prefill = null, language = 'vi' }) {
  const isVi = language === 'vi';
  /**
   * `prefill` = khung Gemini đã điền từ câu người dùng vừa nói.
   *
   * ⚠️ Nó CHỈ được dùng làm ĐÁP ÁN CHỌN SẴN, không được dùng để bỏ qua câu hỏi.
   * Người dùng vẫn nhìn thấy từng câu và vẫn phải bấm xác nhận.
   *
   * Vì sao không bỏ qua cho nhanh: nếu Gemini đọc "đau âm ỉ mấy hôm nay" thành
   * severity 'mild' mà thật ra người ta đang đau dữ dội, thì bảng luật chạy
   * trên một câu trả lời KHÔNG AI XÁC NHẬN. Bấm một nút to là rẻ; kết luận sai
   * mức độ đau thì không.
   */
  const initialAnswers = {
    accompanying: prefill?.accompanying?.length ? prefill.accompanying : [],
    ...(prefill?.region ? { region: prefill.region } : {}),
    ...(prefill?.onset ? { onset: prefill.onset } : {}),
    ...(prefill?.severity ? { severity: prefill.severity } : {})
  };

  /**
   * Chỉ hỏi những gì CHƯA biết.
   *
   * ⚠️ Bộ hỏi này giữ nguyên vai trò: bảng luật tĩnh vẫn quyết định 115 hay
   * khám 24h, và người dùng vẫn phải tự chọn chứ AI không chọn hộ. Cái bỏ đi
   * chỉ là những màn hình hỏi lại điều bác VỪA NÓI RA MIỆNG.
   *
   * Ca thật: bác nói "bác mệt" → app hỏi tiếp bốn màn, mỗi màn tới 14 lựa
   * chọn. Với người 70 tuổi, đọc bằng mắt kém, đó không phải bộ hỏi — đó là
   * bài kiểm tra. Gemini đã rút được vùng/thời điểm từ câu nói thì đừng bắt
   * bác chọn lại lần nữa.
   *
   * Cái KHÔNG bao giờ bỏ qua: bước "kèm theo". Đó là bước chứa gần hết red
   * flag (yếu nửa người, nôn ra máu, vã mồ hôi...). Gemini không nhắc tới
   * không có nghĩa là không có — bác chỉ chưa được hỏi.
   */
  const NEVER_SKIP = ['accompanying'];
  const firstUnanswered = INTAKE_STEPS.findIndex(
    st => NEVER_SKIP.includes(st.key) || initialAnswers[st.key] == null
  );

  const [stepIndex, setStepIndex] = useState(firstUnanswered < 0 ? 0 : firstUnanswered);
  const [answers, setAnswers] = useState(initialAnswers);
  const [showAuto, setShowAuto] = useState(false);

  /** Những gì đã điền sẵn, để bác xem lại và sửa nếu con hiểu sai */
  const autoFilled = INTAKE_STEPS
    .filter(st => !NEVER_SKIP.includes(st.key) && initialAnswers[st.key] != null)
    .map(st => ({
      key: st.key,
      label: st.options.find(o => o.id === initialAnswers[st.key])?.label
    }))
    .filter(x => x.label);
  const [decision, setDecision] = useState(null);
  const [mildText, setMildText] = useState(null);
  const [loading, setLoading] = useState(false);

  const step = INTAKE_STEPS[stepIndex];

  const finish = async (finalAnswers) => {
    const result = evaluateSymptomAnswers(finalAnswers, memberProfile, prescriptions);
    setDecision(result);

    /**
     * Báo người nhà cho CẢ BA nhánh, không riêng hai nhánh nặng.
     *
     * ⚠️ Bản trước bỏ qua nhánh nhẹ. Nhưng câu trả lời ở nhánh nhẹ — cả câu dự
     * phòng tại máy lẫn prompt `narrateSymptomPrompt` ở server (câu 1: "Ghi nhận
     * đã lưu lại và đã báo cho người nhà") — đều nói thẳng với bác rằng người
     * nhà đã được báo. Không có dòng nào ghi vào Firestore, nên con cái không
     * thấy gì hết.
     *
     * Đó lại đúng lỗi C2 của doc 33: bác yên tâm vì tưởng có người biết, trong
     * khi không ai biết. Nhánh nhẹ không phải nhánh "không có gì" — nó là nhánh
     * "chưa khớp dấu hiệu nguy hiểm nào trong bảng hiện tại", mà bảng thì chưa
     * được bác sĩ rà. Con cái càng nên thấy.
     *
     * Ghi bằng loại riêng `SYMPTOM_LOG` để không lẫn với báo động đỏ — nhánh
     * nhẹ mà tô đỏ thì vài lần là người nhà tắt thông báo, và lần thật sự cần
     * thì không ai nhìn.
     */
    if (onAlert) {
      const byOutcome = {
        [OUTCOME.EMERGENCY_115]: { type: 'EMERGENCY', title: 'Dấu hiệu cần cấp cứu' },
        [OUTCOME.SEE_DOCTOR_24H]: { type: 'SAFETY_CRITICAL', title: 'Nên đi khám trong hôm nay' },
        [OUTCOME.LOG_AND_NOTIFY]: { type: 'SYMPTOM_LOG', title: 'Có kể một triệu chứng' }
      };
      const meta = byOutcome[result.outcome] || byOutcome[OUTCOME.LOG_AND_NOTIFY];

      onAlert({
        type: meta.type,
        title: meta.title,
        detail: `${describeAnswers(finalAnswers)} — ${result.reason}`,
        ruleId: result.rule_id
      });
    }

    if (result.outcome === OUTCOME.LOG_AND_NOTIFY) {
      setLoading(true);
      const text = await narrateMildSymptom(describeAnswers(finalAnswers), memberProfile, prescriptions, language);
      setMildText(text);
      setLoading(false);
    }

    onFinish?.({ answers: finalAnswers, decision: result, summary: describeAnswers(finalAnswers) });
  };

  const pickSingle = (optionId) => {
    const next = { ...answers, [step.key]: optionId };
    setAnswers(next);

    // Nhảy tới bước CHƯA có câu trả lời, không đi tuần tự — nếu không thì
    // việc điền sẵn chẳng tiết kiệm được màn hình nào.
    //
    // ⚠️ Trừ khi bác đã bấm "con hiểu sai thì bấm vào đây để sửa". Lúc đó phải
    // đi HẾT các bước. Bản trước vẫn nhảy cóc kể cả sau khi bấm sửa, nên bác
    // chỉ sửa được đúng bước đầu rồi bị đẩy thẳng tới "kèm theo" — hai bước
    // Gemini điền sai ở giữa thì không có đường nào chạm tới. Nút đó hứa một
    // việc mà màn hình không cho làm.
    const nextIdx = INTAKE_STEPS.findIndex(
      (st, i) => i > stepIndex && (showAuto || NEVER_SKIP.includes(st.key) || next[st.key] == null)
    );
    if (nextIdx >= 0) setStepIndex(nextIdx);
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
                {isVi ? speak('Cái này {{me}} không dám chờ{{a}}', memberProfile) : 'This symptom requires immediate emergency attention'}
              </div>
              <div style={{ fontSize: 14, color: '#7F1D1D', fontWeight: 600, lineHeight: 1.5 }}>
                {isVi ? speak(decision.advice, memberProfile) : decision.advice}
              </div>
            </div>
          </div>

          <a href="tel:115" style={{ textDecoration: 'none', display: 'block' }}>
            <button style={{ width: '100%', padding: 18, borderRadius: 16, background: '#DC2626', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <PhoneCall size={22} /> {isVi ? 'GỌI 115 NGAY' : 'CALL 115 NOW'}
            </button>
          </a>

          <div style={{ marginTop: 10, fontSize: 12, color: '#991B1B', fontWeight: 600 }}>
            {isVi ? `Lý do: ${decision.reason}` : `Reason: ${decision.reason}`}
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
            {isVi ? `Luật ${decision.rule_id} · bảng v${decision.rules_version} · chưa được bác sĩ rà` : `Rule ${decision.rule_id} · v${decision.rules_version} · preliminary triage`}
          </div>
          <MedicalDisclaimer variant="inline" language={language} />
        </div>
      );
    }

    if (decision.outcome === OUTCOME.SEE_DOCTOR_24H) {
      return (
        <div style={{ padding: 18, borderRadius: 20, background: '#FFFBEB', border: '2px solid #F59E0B' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
            <CalendarClock size={22} color="#B45309" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#B45309', marginBottom: 4 }}>
                {isVi ? speak('{{Da}} {{me}} ghi lại rồi{{a}} — cái này nên đi khám hôm nay', memberProfile) : 'Recorded — recommend consulting a doctor within 24 hours'}
              </div>
              <div style={{ fontSize: 14, color: '#78350F', fontWeight: 600, lineHeight: 1.5 }}>
                {isVi ? speak(decision.advice, memberProfile) : decision.advice}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href="tel:115" style={{ textDecoration: 'none', flex: 1 }}>
              <button style={{ width: '100%', padding: 12, borderRadius: 12, background: '#FFF', color: '#B45309', border: '1.5px solid #F59E0B', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                {isVi ? 'Nặng hơn thì gọi 115' : 'If worsening, call 115'}
              </button>
            </a>
            <button onClick={onCancel} style={{ flex: 1, padding: 12, borderRadius: 12, background: '#B45309', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
              {isVi ? 'Đã báo người nhà' : 'Family Notified'}
            </button>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: '#92400E', fontWeight: 600 }}>
            {isVi ? `Lý do: ${decision.reason}` : `Reason: ${decision.reason}`}
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
            {isVi ? `Luật ${decision.rule_id} · bảng v${decision.rules_version} · chưa được bác sĩ rà` : `Rule ${decision.rule_id} · v${decision.rules_version} · preliminary triage`}
          </div>
          <MedicalDisclaimer variant="inline" language={language} />
        </div>
      );
    }

    // Nhánh nhẹ — ghi nhận + báo người nhà
    return (
      <div style={{ padding: 18, borderRadius: 20, background: '#F0FDF4', border: '1.5px solid #86EFAC' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <CheckCircle2 size={22} color="var(--emerald-ok)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 14, color: '#166534', fontWeight: 600, lineHeight: 1.6 }}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Loader2 className="animate-spin" size={16} /> {isVi ? 'Cháu Bi đang ghi lại...' : 'AI Bi is logging...'}</span>
              : mildText}
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
          {isVi ? `Đã ghi: ${describeAnswers(answers)}` : `Logged: ${describeAnswers(answers)}`}
        </div>
        <MedicalDisclaimer variant="inline" language={language} />
      </div>
    );
  }

  /* ── Đang hỏi ── */
  const selected = answers[step.key];

  return (
    <div style={{ padding: 18, borderRadius: 20, background: 'rgba(241,245,249,0.7)', border: '1px solid var(--glass-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          {isVi ? 'Câu' : 'Question'} {INTAKE_STEPS.slice(0, stepIndex + 1).filter(st => NEVER_SKIP.includes(st.key) || initialAnswers[st.key] == null || showAuto).length} / {INTAKE_STEPS.filter(st => NEVER_SKIP.includes(st.key) || initialAnswers[st.key] == null || showAuto).length}
        </span>
        <button onClick={onCancel} style={{ border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          {isVi ? 'Thôi để lúc khác' : 'Cancel'}
        </button>
      </div>

      <h4 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 12, lineHeight: 1.4 }}>
        {isVi ? speak(step.question, memberProfile) : (step.question_en || step.question)}
      </h4>

      {autoFilled.length > 0 && !showAuto && (
        <button
          onClick={() => { setShowAuto(true); setStepIndex(0); }}
          style={{ width: '100%', textAlign: 'left', marginBottom: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.75)', border: '1px dashed var(--glass-border)', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700 }}>
            {isVi ? `Con hiểu từ lời ${speak('{{you}}', memberProfile)} vừa nói: ${autoFilled.map(a => a.label).join(' · ')}` : `Detected from speech: ${autoFilled.map(a => a.label).join(' · ')}`}
          </span>
          <span style={{ display: 'block', fontSize: 12, color: 'var(--coral-main)', fontWeight: 800, marginTop: 3 }}>
            {isVi ? 'Con hiểu sai thì bấm vào đây để sửa' : 'Tap here to edit if misunderstood'}
          </span>
        </button>
      )}

      {selected != null && (Array.isArray(selected) ? selected.length > 0 : true) && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8 }}>
          {isVi ? `Con chọn sẵn theo lời ${speak('{{you}}', memberProfile)} vừa nói — không đúng thì bấm chọn lại` : 'Pre-selected based on what you said — tap to change'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
        {step.options.map(opt => {
          const isOn = step.multi ? (selected || []).includes(opt.id) : selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => (step.multi ? toggleMulti(opt.id) : pickSingle(opt.id))}
              style={{
                textAlign: 'left', padding: '14px 16px', borderRadius: 16, cursor: 'pointer',
                background: isOn ? 'var(--coral-soft)' : '#FFF',
                border: isOn ? '2px solid var(--coral-main)' : '1px solid var(--glass-border)',
                color: 'var(--text-dark)', fontWeight: 700, fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10
              }}
            >
              <span>
                {opt.label}
                {opt.hint && <span style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{opt.hint}</span>}
              </span>
              {!step.multi && <ChevronRight size={18} color="var(--text-muted)" />}
              {step.multi && isOn && <CheckCircle2 size={18} color="var(--coral-main)" />}
            </button>
          );
        })}
      </div>

      {step.multi && (
        <button className="btn-primary" onClick={submitMulti} style={{ width: '100%', marginTop: 12, padding: 14, borderRadius: 16, fontSize: 16 }}>
          {isVi ? speak('Xong, {{me}} xem giúp {{you}}', memberProfile) : 'Submit & Review'}
        </button>
      )}
    </div>
  );
}
