import React, { useState } from 'react';
import { Mic, X, Volume2, Sparkles, Send, Loader2 } from 'lucide-react';
import { askVoiceAssistant } from '../services/geminiService';

export default function VoiceAssistantModal({ isOpen, onClose, memberProfile }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `Dạ con chào ${memberProfile.display_name}! Con là "Cháu Bi" trợ lý sức khỏe đây ạ. Bác muốn hỏi gì về thuốc hay giờ uống thuốc hôm nay không ạ?`
    }
  ]);

  if (!isOpen) return null;

  const handleSend = async (textToSend) => {
    const text = textToSend || query;
    if (!text.trim() || loading) return;

    const newMsgs = [...messages, { sender: 'user', text }];
    setMessages(newMsgs);
    setQuery('');
    setLoading(true);

    const answer = await askVoiceAssistant(text, memberProfile);
    setMessages([...newMsgs, { sender: 'assistant', text: answer }]);
    setLoading(false);
  };

  const sampleQuestions = [
    "Thuốc huyết áp này uống trước hay sau ăn bác sĩ ơi?",
    "Chiều nay bác cần uống những thuốc gì?",
    "Ăn bưởi khi đang uống thuốc mỡ máu có sao không?"
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(16px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="liquid-card" style={{ width: '100%', maxWidth: 520, padding: 28, background: '#FFF', borderRadius: 32, boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)', display: 'grid', placeItems: 'center', color: '#FFF', boxShadow: '0 6px 16px rgba(2,132,199,0.3)' }}>
              <Mic size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: 19, fontWeight: 800 }}>Trợ lý "Cháu Bi" 🎙️</h3>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>Trả lời từ đúng hồ sơ đơn thuốc của bác</span>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <X size={20} />
          </button>
        </div>

        {/* Chat History */}
        <div style={{ height: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4, marginBottom: 16 }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '12px 16px', borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px', background: msg.sender === 'user' ? 'var(--coral-grad)' : 'rgba(241,245,249,0.9)', color: msg.sender === 'user' ? '#FFF' : 'var(--text-dark)', fontWeight: 600, fontSize: 14.5, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              {msg.text}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', padding: '12px 16px', borderRadius: '20px 20px 20px 4px', background: 'rgba(241,245,249,0.9)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-sub)' }}>
              <Loader2 className="animate-spin" size={16} /> Cháu Bi đang suy nghĩ...
            </div>
          )}
        </div>

        {/* Sample Voice Prompts */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {sampleQuestions.map((q, i) => (
            <button key={i} onClick={() => handleSend(q)} style={{ border: '1px solid var(--glass-border)', background: 'var(--coral-soft)', color: 'var(--coral-main)', fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 99, cursor: 'pointer', textAlign: 'left' }}>
              💬 "{q}"
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Hỏi Cháu Bi bằng giọng nói hoặc nhập chữ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            style={{ flex: 1, padding: '14px 18px', borderRadius: 16, border: '1px solid var(--glass-border)', fontSize: 14.5, fontFamily: 'inherit', outline: 'none', background: '#F8FAFC' }}
          />
          <button className="btn-primary" onClick={() => handleSend()} style={{ padding: '0 20px', borderRadius: 16 }}>
            <Send size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}
