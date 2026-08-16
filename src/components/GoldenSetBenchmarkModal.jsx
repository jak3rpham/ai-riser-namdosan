import React, { useState } from 'react';
import { X, Award, Play, ShieldCheck, Loader2, AlertTriangle, FileWarning } from 'lucide-react';
import { runGoldenSetBenchmark, GOLDEN_SET_CASES, BENCHMARK_STATUS } from '../services/benchmarkService';

/**
 * Golden Set Benchmark.
 *
 * ⚠️ Bản trước hiển thị "Bộ test 15 đơn thuốc thật" và một con số độ chính xác
 * ~95.8% — cả hai đều là hằng số viết tay, không đo gì (doc 33 mục 5).
 * Modal này giờ nói đúng trạng thái thật: chưa có dataset thì chưa có số.
 */
export default function GoldenSetBenchmarkModal({ isOpen, onClose }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const hasDataset = GOLDEN_SET_CASES.length > 0;

  const handleStart = async () => {
    setRunning(true);
    setProgress(0);
    setResult(null);
    const report = await runGoldenSetBenchmark((current, total) => {
      setProgress(Math.round((current / total) * 100));
    });
    setResult(report);
    setRunning(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(20px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="liquid-card" style={{ width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto', background: '#FFF', borderRadius: 32, padding: 32, boxShadow: '0 25px 80px rgba(0,0,0,0.25)' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'var(--coral-soft)', color: 'var(--coral-main)', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
              <Award size={14} /> Đo chất lượng trích xuất
            </div>
            <h3 style={{ fontSize: 23, fontWeight: 800, color: 'var(--text-dark)' }}>📊 Golden Set Benchmark</h3>
            <p style={{ fontSize: 14, color: 'var(--text-sub)', marginTop: 2, lineHeight: 1.55 }}>
              Chạy Gemini trên các ảnh đơn thuốc thật rồi so từng trường với đáp án ghi tay.
              Thuốc bị bỏ sót tính là sai toàn bộ trường.
            </p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#F1F5F9', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <X size={22} />
          </button>
        </div>

        {/* Chưa có dataset — nói thẳng */}
        {!hasDataset && (
          <div style={{ padding: 20, borderRadius: 20, background: '#FFFBEB', border: '1.5px solid #FDE68A', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <FileWarning size={24} color="#B45309" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#B45309' }}>Chưa đo — chưa có dataset</h4>
              <p style={{ fontSize: 14, color: '#78350F', fontWeight: 600, marginTop: 6, lineHeight: 1.6 }}>
                {BENCHMARK_STATUS.note}
              </p>
              <p style={{ fontSize: 14, color: '#78350F', fontWeight: 600, marginTop: 10, lineHeight: 1.6 }}>
                Cần làm: thu <b>15–20 ảnh đơn thuốc thật</b> (đơn in bệnh viện, đơn viết tay
                phòng khám tư, túi thuốc nhà thuốc, vỏ vỉ mờ), tự ghi đáp án đúng, rồi nạp vào
                <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 6px', borderRadius: 8, margin: '0 4px' }}>GOLDEN_SET_CASES</code>
                trong <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 6px', borderRadius: 8 }}>benchmarkService.js</code>.
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginTop: 10, lineHeight: 1.6 }}>
                App cố tình không hiển thị con số nào khi chưa thật sự đo. Số liệu chất lượng
                trong bài nộp phải là số đo được, không phải số dựng sẵn.
              </p>
            </div>
          </div>
        )}

        {/* Có dataset — cho chạy */}
        {hasDataset && (
          <>
            <div style={{ padding: 20, borderRadius: 20, background: 'linear-gradient(135deg, rgba(255,241,237,0.8) 0%, rgba(255,255,255,0.9) 100%)', border: '1px solid var(--coral-border)', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-dark)' }}>
                  {result?.status === 'MEASURED' ? 'Đã đo xong' : `Sẵn sàng chạy ${GOLDEN_SET_CASES.length} ca`}
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 2 }}>
                  Mỗi lần chạy sẽ gọi Gemini thật, có tính phí và mất vài phút.
                </p>
              </div>
              <button className="btn-primary" onClick={handleStart} disabled={running} style={{ padding: '12px 22px', borderRadius: 16 }}>
                {running ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                <span>{running ? `Đang đo... (${progress}%)` : 'Chạy benchmark'}</span>
              </button>
            </div>

            {result?.status === 'MEASURED' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
                  <div style={{ padding: 16, borderRadius: 16, background: 'var(--emerald-soft)', border: '1px solid rgba(5,150,105,0.2)', textAlign: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--emerald-ok)', textTransform: 'uppercase' }}>Chính xác theo trường</span>
                    <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--emerald-ok)', marginTop: 4 }}>{result.overall_accuracy}%</div>
                  </div>
                  <div style={{ padding: 16, borderRadius: 16, background: '#FEF2F2', border: '1px solid #FECACA', textAlign: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#DC2626', textTransform: 'uppercase' }}>Thuốc bỏ sót</span>
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#DC2626', marginTop: 4 }}>{result.total_missed_meds}</div>
                  </div>
                  <div style={{ padding: 16, borderRadius: 16, background: '#FFF7ED', border: '1px solid #FED7AA', textAlign: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#C2410C', textTransform: 'uppercase' }}>Thuốc bịa thêm</span>
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#C2410C', marginTop: 4 }}>{result.total_hallucinated_meds}</div>
                  </div>
                  <div style={{ padding: 16, borderRadius: 16, background: '#F0F9FF', border: '1px solid #BAE6FD', textAlign: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--sky-blue)', textTransform: 'uppercase' }}>Độ trễ TB</span>
                    <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--sky-blue)', marginTop: 4 }}>{result.avg_latency_ms}ms</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.results.map(r => (
                    <div key={r.id} style={{ padding: 14, borderRadius: 16, background: '#FFF', border: `1px solid ${r.status === 'PASSED' ? 'var(--glass-border)' : '#FDE68A'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: '#F1F5F9', color: 'var(--text-muted)' }}>{r.id}</span>
                          <h5 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-dark)' }}>{r.title}</h5>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: r.field_accuracy >= 95 ? 'var(--emerald-ok)' : r.field_accuracy >= 85 ? '#B45309' : '#DC2626' }}>
                          {r.field_accuracy}%
                        </span>
                      </div>

                      {r.status === 'EXTRACTION_FAILED' && (
                        <div style={{ fontSize: 13, color: '#DC2626', fontWeight: 700, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertTriangle size={14} /> Không đọc được ({r.error_code})
                        </div>
                      )}

                      {r.field_errors?.length > 0 && (
                        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-sub)', fontWeight: 600, lineHeight: 1.6 }}>
                          {r.field_errors.slice(0, 5).map((e, i) => (
                            <div key={i}>
                              · <b>{e.med}</b> — {e.field}: mong đợi "{String(e.expected)}", AI đọc "{String(e.got)}"
                            </div>
                          ))}
                          {r.field_errors.length > 5 && <div>· ...và {r.field_errors.length - 5} lỗi nữa</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 16, background: 'rgba(241,245,249,0.8)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            Chỉ số này đo khả năng ĐỌC ĐÚNG chữ trên đơn. Nó không đo tính an toàn của lời khuyên
            và không thay được việc dược sĩ rà kho kiến thức.
          </span>
        </div>
      </div>
    </div>
  );
}
