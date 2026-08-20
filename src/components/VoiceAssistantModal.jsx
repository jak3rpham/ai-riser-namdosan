import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Send, Loader2, PhoneCall, AlertTriangle } from 'lucide-react';
import { askVoiceAssistant } from '../services/geminiService';
import { speakOut, stopSpeaking } from '../services/speechService';
import { speak } from '../services/honorifics';
import SymptomIntakePanel from './SymptomIntakePanel';
import VoiceCaptureView from './VoiceCaptureView';
import MedicalDisclaimer from './MedicalDisclaimer';

/**
 * Trợ lý "Cháu Bi".
 *
 * ⚠️ Thay đổi so với bản trước (doc 33 mục 2 & 3):
 *
 * 1. Bản cũ khi phát hiện cấp cứu thì nói "Con đã tự động gửi tin nhắn báo động
 *    cho gia đình rồi ạ" — nhưng không có code nào gửi. Người già nghe vậy sẽ
 *    yên tâm và KHÔNG tự gọi ai, đúng lúc mỗi phút đều tính. Giờ app chỉ nói
 *    đúng những gì nó thật sự làm, và nút báo người nhà là hành động rõ ràng
 *    do người dùng bấm.
 *
 * 2. Câu hỏi triệu chứng không còn rơi vào chat tự do. Nó chuyển sang bộ hỏi
 *    cấu trúc (SymptomIntakePanel) rồi qua bảng luật tĩnh.
 *
 * `initialQuestion`: câu bác đã gõ ở ô hỏi nhanh trong tab "Hỏi cháu". Ô đó chỉ
 * in chữ, không có nút 115 / báo người nhà / bộ hỏi, nên khi câu chạm tới sức
 * khỏe thì tab mở modal này kèm nguyên câu để xử lại cho đủ.
 */
/** Lời chào mở đầu — có tên người dùng nên phải dựng lại khi đổi hồ sơ */
const greeting = (profile, language = 'vi') => (language === 'vi'
  ? speak(
      `{{Da}} {{me}} chào ${profile?.display_name || ''}! {{Me}} là "Cháu Bi" đây{{a}}. `
      + '{{You}} muốn hỏi gì về thuốc hay giờ uống thuốc hôm nay không{{a}}?',
      profile
    )
  : `Hello ${profile?.display_name || ''}! I am AI Bi. What questions do you have about your medications or schedule today?`
);

export default function VoiceAssistantModal({ isOpen, onClose, memberProfile, prescriptions = [], onAlert, initialQuestion = null, language = 'vi' }) {
  const isVi = language === 'vi';
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [emergency, setEmergency] = useState(null);
  const [intakeOpen, setIntakeOpen] = useState(false);
  // Khung Gemini đã điền sẵn từ câu bác vừa nói — bộ hỏi dùng để bỏ bớt câu
  // đã rõ. KHÔNG dùng để chạy thẳng bảng luật.
  const [intakePrefill, setIntakePrefill] = useState(null);
  const [quickReplies, setQuickReplies] = useState(null);
  const [familyNotified, setFamilyNotified] = useState(false);
  const [messages, setMessages] = useState(() => [
    { sender: 'assistant', text: greeting(memberProfile, language) }
  ]);

  // Giọng Gemini trước, giọng trình duyệt làm lưới đỡ. Chi tiết vì sao phải
  // có lưới đỡ: src/services/speechService.js
  const speakText = (text) => { speakOut(text, memberProfile, language); };

  // Nói giờ có màn hình riêng che kín (VoiceCaptureView). Nút micro nhỏ cạnh ô
  // nhập với cái viền đổi màu là không đủ thấy — xem ghi chú trong file đó.
  const startVoiceInput = () => setVoiceOpen(true);

  useEffect(() => {
    if (isOpen) return;
    setEmergency(null);
    setIntakeOpen(false);
    setIntakePrefill(null);
    setQuickReplies(null);
    setFamilyNotified(false);
    setQuery('');
    setLoading(false);
    setMessages([{ sender: 'assistant', text: greeting(memberProfile, language) }]);
  }, [isOpen, memberProfile?.id, language]);

  // Câu chuyển từ ô hỏi nhanh sang — chạy đúng một lần cho mỗi câu.
  const sentSeed = useRef(null);
  useEffect(() => {
    if (!isOpen) { sentSeed.current = null; return; }
    if (!initialQuestion || sentSeed.current === initialQuestion) return;
    sentSeed.current = initialQuestion;
    handleSend(initialQuestion);
  }, [isOpen, initialQuestion]);

  if (!isOpen) return null;

  const handleSend = async (textToSend) => {
    const text = textToSend || query;
    if (!text.trim() || loading) return;

    const nextMsgs = [...messages, { sender: 'user', text }];
    setMessages(nextMsgs);
    setQuery('');
    setLoading(true);
    setEmergency(null);
    setQuickReplies(null);

    const res = await askVoiceAssistant(text, memberProfile, prescriptions, language, messages);

    setMessages([...nextMsgs, { sender: 'assistant', text: res.text, source: res.source }]);
    setLoading(false);

    if (res.isEmergency) setEmergency(res);
    if (res.startIntake) { setIntakePrefill(res.prefill || null); setIntakeOpen(true); }
    if (res.quickReplies) setQuickReplies(res.quickReplies);

    speakText(res.text);
  };

  const handleQuickReply = async (reply) => {
    setQuickReplies(null);
    setMessages(m => [...m, { sender: 'user', text: reply.label }]);
    if (reply.action === 'NOTIFY_FAMILY') {
      if (onAlert) {
        await onAlert({
          type: 'FAMILY_NOTIFY',
          title: isVi ? `Bác ${memberProfile?.display_name || ''} cần hỗ trợ` : `${memberProfile?.display_name || 'Member'} requested assistance`,
          message: isVi ? `Bác vừa báo Cháu Bi cần người nhà liên hệ hỗ trợ.` : `Requested family check-in via AI Bi.`
        });
      }
      setFamilyNotified(true);
      const replyMsg = isVi
        ? speak('{{Da}} con đã gửi lời nhắn cho người nhà liền rồi ạ. Người nhà sẽ liên hệ lại với {{you}} sớm {{nha}}!', memberProfile)
        : 'I have notified your family. Someone will reach out to you shortly!';
      setMessages(m => [...m, { sender: 'assistant', text: replyMsg }]);
      speakText(replyMsg);
    } else if (reply.action === 'START_INTAKE') {
      setIntakeOpen(true);
    } else {
      const dismissMsg = isVi
        ? speak('{{Da}} vậy thì {{me}} yên tâm{{a}}. {{You}} có gì cứ gọi {{me}} {{nha}}.', memberProfile)
        : 'Glad to hear that. Feel free to ask me anytime!';
      setMessages(m => [...m, { sender: 'assistant', text: dismissMsg }]);
      speakText(dismissMsg);
    }
  };

  // Gợi ý dựng từ thuốc CÓ THẬT trong hồ sơ, không phải danh sách cố định.
  //
  // Bản trước có ba câu cứng giống hệt nhau cho mọi người, trong đó một câu là
  // "Bác đau bụng trên, buồn nôn quá cháu ơi" — bấm vào là app tin bác đang đau
  // bụng và buồn nôn thật, rồi chạy bộ hỏi triệu chứng cho một triệu chứng bác
  // không hề có. Gợi ý giờ chỉ hỏi về thuốc; triệu chứng để bác tự nói.
  const myMeds = prescriptions
    .filter(p => !memberProfile?.id || p.member_id === memberProfile.id)
    .flatMap(p => p.medications || [])
    .filter(m => m?.name);

  const sampleQuestions = myMeds.slice(0, 2)
    .map(m => isVi ? speak(`${m.name} uống trước hay sau ăn{{a}}?`, memberProfile) : `Should I take ${m.name} before or after meals?`);
  if (myMeds.length) sampleQuestions.push(isVi ? 'Quên uống thuốc trưa rồi thì giờ làm sao?' : 'What should I do if I missed my noon dose?');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(16px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="liquid-card" style={{ width: '100%', maxWidth: 540, maxHeight: '92vh', overflowY: 'auto', padding: 28, background: '#FFF', borderRadius: 32, boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)', display: 'grid', placeItems: 'center', color: '#FFF' }}>
              <Mic size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>{isVi ? 'Trợ lý "Cháu Bi" 🎙️' : 'AI Assistant "Bi" 🎙️'}</h3>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                {isVi ? `Trả lời theo đúng hồ sơ thuốc của ${memberProfile.display_name}` : `Answers based on ${memberProfile.display_name}'s medication record`}
              </span>
            </div>
          </div>
          <button onClick={() => { stopSpeaking(); onClose(); }} style={{ border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <X size={20} />
          </button>
        </div>

        {/* Cấp cứu — chỉ nói đúng những gì app thật sự làm */}
        {emergency && (
          <div style={{ padding: 16, borderRadius: 16, background: '#FEF2F2', border: '2px solid #EF4444', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#DC2626', display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.5 }}>
              <AlertTriangle size={20} style={{ flexShrink: 0 }} /> {emergency.text}
            </div>

            <a href="tel:115" style={{ textDecoration: 'none' }}>
              <button style={{ width: '100%', padding: 16, borderRadius: 16, background: '#DC2626', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <PhoneCall size={20} /> {isVi ? 'GỌI 115 NGAY' : 'CALL 115 NOW'}
              </button>
            </a>

            <button
              onClick={async () => {
                if (!onAlert) { setFamilyNotified(true); return; }
                const r = await onAlert({
                  type: 'EMERGENCY',
                  title: isVi ? 'Dấu hiệu cần cấp cứu' : 'Emergency Alert',
                  detail: emergency.reason,
                  ruleId: emergency.rule_id
                });
                setFamilyNotified(!!r?.ok);
                if (!r?.ok) alert(isVi ? 'Chưa gửi được cho người nhà. Bác gọi điện trực tiếp giúp con nha!' : 'Failed to send alert to family. Please call directly!');
              }}
              disabled={familyNotified}
              style={{ width: '100%', padding: 12, borderRadius: 12, background: familyNotified ? 'var(--emerald-soft)' : '#FFF', color: familyNotified ? 'var(--emerald-ok)' : '#DC2626', border: `1.5px solid ${familyNotified ? 'var(--emerald-ok)' : '#DC2626'}`, fontWeight: 800, fontSize: 14, cursor: familyNotified ? 'default' : 'pointer' }}
            >
              {familyNotified ? (isVi ? '✓ Đã gửi báo cho người nhà' : '✓ Family Notified') : (isVi ? 'Báo cho người nhà' : 'Notify Family')}
            </button>

            {emergency.reason && (
              <div style={{ fontSize: 12, color: '#991B1B', fontWeight: 600 }}>
                {isVi ? `Lý do: ${emergency.reason} (luật ${emergency.rule_id})` : `Reason: ${emergency.reason} (rule ${emergency.rule_id})`}
              </div>
            )}
          </div>
        )}

        {/* Bộ hỏi triệu chứng cấu trúc */}
        {intakeOpen && (
          <div style={{ marginBottom: 16 }}>
            <SymptomIntakePanel
              memberProfile={memberProfile}
              prescriptions={prescriptions}
              onCancel={() => setIntakeOpen(false)}
              onAlert={onAlert}
              prefill={intakePrefill}
              language={language}
              onFinish={({ summary, decision }) => {
                setMessages(m => [...m, {
                  sender: 'assistant',
                  text: isVi ? speak(`{{Me}} ghi lại rồi{{a}}: ${summary}`, memberProfile) : `Logged: ${summary}`,
                  source: `TRIAGE:${decision.rule_id || 'NO_RULE'}`
                }]);
              }}
            />
          </div>
        )}

        {/* Lịch sử chat */}
        {!intakeOpen && (
          <div style={{ minHeight: 200, maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4, marginBottom: 16 }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{ padding: '12px 16px', borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px', background: msg.sender === 'user' ? 'var(--coral-grad)' : 'rgba(241,245,249,0.9)', color: msg.sender === 'user' ? '#FFF' : 'var(--text-dark)', fontWeight: 600, fontSize: 14, lineHeight: 1.55 }}>
                  {msg.text}
                </div>
                {msg.source && msg.source !== 'AI' && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 3, paddingLeft: 4 }}>
                    {isVi ? `câu trả lời cố định · ${msg.source}` : `static rule · ${msg.source}`}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: 'flex-start', padding: '12px 16px', borderRadius: '20px 20px 20px 4px', background: 'rgba(241,245,249,0.9)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-sub)' }}>
                <Loader2 className="animate-spin" size={16} /> {isVi ? 'Cháu Bi đang suy nghĩ...' : 'AI Bi is thinking...'}
              </div>
            )}

            {quickReplies && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
                {quickReplies.map((r, i) => (
                  <button key={i} onClick={() => handleQuickReply(r)} style={{ padding: '10px 16px', borderRadius: 99, border: '1.5px solid var(--coral-main)', background: 'var(--coral-soft)', color: 'var(--coral-main)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!intakeOpen && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: sampleQuestions.length ? 16 : 0 }}>
              {sampleQuestions.map((q, i) => (
                <button key={i} onClick={() => handleSend(q)} style={{ border: '1px solid var(--glass-border)', background: 'var(--coral-soft)', color: 'var(--coral-main)', fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 99, cursor: 'pointer', textAlign: 'left' }}>
                  💬 "{q}"
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={startVoiceInput} className="btn-secondary" style={{ padding: '0 16px', borderRadius: 16, background: 'rgba(255,255,255,0.8)', border: '1px solid var(--glass-border)', color: 'var(--coral-main)' }} title={isVi ? "Nói với Cháu Bi" : "Speak with AI Bi"}>
                <Mic size={20} />
              </button>
              <input
                type="text"
                placeholder={isVi ? "Hỏi Cháu Bi..." : "Ask AI Bi..."}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                style={{ flex: 1, padding: '14px 18px', borderRadius: 16, border: '1px solid var(--glass-border)', fontSize: 16, fontFamily: 'inherit', outline: 'none', background: '#F8FAFC' }}
              />
              <button className="btn-primary" onClick={() => handleSend()} style={{ padding: '0 20px', borderRadius: 16 }}>
                <Send size={18} />
              </button>
            </div>
          </>
        )}

        <MedicalDisclaimer variant="inline" language={language} />
      </div>

      <VoiceCaptureView
        isOpen={voiceOpen}
        memberProfile={memberProfile}
        language={language}
        onClose={() => setVoiceOpen(false)}
        onTypeInstead={() => setVoiceOpen(false)}
        onResult={text => { setVoiceOpen(false); handleSend(text); }}
      />
    </div>
  );
}
