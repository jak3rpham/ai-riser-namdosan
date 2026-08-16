import React, { useEffect, useRef, useState } from 'react';
import { Mic, X, Keyboard, Loader2 } from 'lucide-react';
import { speak } from '../services/honorifics';

/**
 * Màn hình chỉ để nói — che kín, một việc duy nhất.
 *
 * ═══════════════════════════════════════════════════════════════════
 *  Bản trước: nút micro nhỏ nằm cạnh ô nhập, và trạng thái "đang nghe" chỉ
 *  là cái viền đổi màu cộng dòng chữ placeholder trong ô input. Bác 70 tuổi
 *  cầm điện thoại, mắt kém, vừa bấm micro xong không biết máy đã nghe chưa,
 *  nên hoặc nói vào khoảng không, hoặc bấm lại làm hỏng lần thu.
 *
 *  Nói là việc cần TOÀN BỘ màn hình: một vòng tròn to đang đập, một dòng chữ
 *  to nói rõ đang ở bước nào, và chữ hiện dần theo lời nói để bác biết máy
 *  nghe đúng. Không có gì khác trên màn hình để bấm nhầm.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Vẫn để đường thoát sang gõ chữ: nhận diện giọng nói tiếng Việt sai thường
 * xuyên, và Safari trên iOS nhiều bản không có API này.
 */
export default function VoiceCaptureView({ isOpen, onClose, onResult, onTypeInstead, memberProfile = {} }) {
  const [phase, setPhase] = useState('idle');   // idle | listening | thinking | error
  const [transcript, setTranscript] = useState('');
  const [message, setMessage] = useState(null);
  const recRef = useRef(null);
  const say = s => speak(s, memberProfile);

  const stop = () => {
    try { recRef.current?.stop(); } catch { /* đã dừng rồi */ }
    recRef.current = null;
  };

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setPhase('error');
      setMessage(say('Máy này chưa nghe được giọng nói. {{You}} gõ chữ giúp {{me}} {{nha}}.'));
      return;
    }

    const rec = new SR();
    rec.lang = 'vi-VN';
    // Hiện chữ ngay khi đang nói, đừng đợi nói xong mới hiện — không có phản
    // hồi tức thì thì bác tưởng máy chưa nghe rồi nói lại từ đầu.
    rec.interimResults = true;
    rec.continuous = false;

    rec.onstart = () => { setPhase('listening'); setTranscript(''); setMessage(null); };

    rec.onresult = e => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setTranscript(text);

      const last = e.results[e.results.length - 1];
      if (last.isFinal && text.trim()) {
        setPhase('thinking');
        stop();
        onResult(text.trim());
      }
    };

    rec.onerror = ev => {
      setPhase('error');
      setMessage(ev.error === 'not-allowed'
        ? say('Máy chưa cho phép dùng micro. {{You}} vào phần cài đặt bật giúp {{me}}, hoặc gõ chữ cũng được {{nha}}.')
        : say('{{Me}} chưa nghe rõ. {{You}} thử nói lại, hoặc gõ chữ {{nha}}.'));
    };

    rec.onend = () => {
      // Hết tiếng mà chưa ra chữ nào → nói thẳng là chưa nghe được, đừng để
      // màn hình đứng im ở trạng thái "đang nghe" mãi.
      setPhase(p => {
        if (p !== 'listening') return p;
        setMessage(say('{{Me}} chưa nghe thấy gì{{a}}. {{You}} bấm rồi nói lại giúp {{me}} {{nha}}.'));
        return 'error';
      });
    };

    recRef.current = rec;
    try { rec.start(); } catch { /* đang chạy rồi */ }
  };

  useEffect(() => {
    if (isOpen) start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const listening = phase === 'listening';
  const thinking = phase === 'thinking';

  const headline = listening ? say('{{Me}} đang nghe{{a}}...')
    : thinking ? say('{{Me}} đang nghĩ{{a}}...')
    : say('{{You}} bấm vòng tròn rồi nói{{a}}');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 28, textAlign: 'center'
    }}>
      <button
        onClick={() => { stop(); onClose(); }}
        aria-label="Đóng"
        style={{ position: 'absolute', top: 'max(18px, env(safe-area-inset-top))', right: 18, width: 46, height: 46, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.14)', color: '#FFF', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
      >
        <X size={24} />
      </button>

      {/* Vòng tròn to — dấu hiệu duy nhất cần nhìn thấy từ xa */}
      <button
        onClick={() => (listening ? stop() : start())}
        disabled={thinking}
        aria-label={listening ? 'Dừng nghe' : 'Bắt đầu nói'}
        style={{
          width: 176, height: 176, borderRadius: '50%', border: 'none', cursor: thinking ? 'default' : 'pointer',
          background: listening
            ? 'linear-gradient(135deg, #FF6B4B 0%, #EF4444 100%)'
            : 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
          display: 'grid', placeItems: 'center', color: '#FFF',
          boxShadow: listening ? '0 0 0 18px rgba(239,68,68,0.18), 0 0 0 36px rgba(239,68,68,0.09)' : '0 18px 50px rgba(2,132,199,0.4)',
          animation: listening ? 'pulse-glow 1.4s infinite' : 'none',
          transition: 'box-shadow .25s ease'
        }}
      >
        {thinking ? <Loader2 className="animate-spin" size={62} /> : <Mic size={72} />}
      </button>

      <h2 style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 26, fontWeight: 800, color: '#FFF', marginTop: 34 }}>
        {headline}
      </h2>

      {/* Chữ hiện dần để bác biết máy nghe đúng hay sai */}
      <div style={{ minHeight: 84, marginTop: 18, maxWidth: 460 }}>
        {transcript
          ? <p style={{ fontSize: 21, lineHeight: 1.5, color: '#FFF', fontWeight: 600 }}>“{transcript}”</p>
          : !message && <p style={{ fontSize: 16.5, color: 'rgba(255,255,255,0.62)', fontWeight: 600, lineHeight: 1.6 }}>
              {say('{{You}} cứ nói bình thường, ví dụ "hôm nay {{me}} thấy mệt" hay "thuốc này uống trước ăn hay sau ăn"')}
            </p>}

        {message && (
          <p style={{ fontSize: 17, color: '#FCA5A5', fontWeight: 700, lineHeight: 1.55 }}>{message}</p>
        )}
      </div>

      <button
        onClick={() => { stop(); onTypeInstead(); }}
        style={{
          marginTop: 26, padding: '15px 26px', borderRadius: 16,
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)',
          color: '#FFF', fontSize: 16.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 9
        }}
      >
        <Keyboard size={19} /> {say('{{Me}} gõ chữ thì dễ hơn')}
      </button>
    </div>
  );
}
