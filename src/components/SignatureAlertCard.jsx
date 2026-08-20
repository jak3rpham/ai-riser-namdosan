import React from 'react';
import { AlertTriangle, ShieldAlert, Utensils, ShieldCheck, Pill, HelpCircle } from 'lucide-react';
import MedicalDisclaimer from './MedicalDisclaimer';

/**
 * Hiển thị kết quả kiểm tra an toàn.
 *
 * ⚠️ Thay đổi quan trọng so với bản trước (doc 33 mục 6):
 * Bản cũ khi không có cảnh báo thì hiện "An toàn 100% — Không phát hiện trùng
 * hoạt chất & kiêng ăn", và gắn nhãn "Verified by AI & National Pharmacopeia
 * Base" dưới mỗi cảnh báo. Cả hai đều không có cơ sở: bộ kiểm lúc đó chỉ biết
 * một hoạt chất, và không tồn tại nguồn "National Pharmacopeia Base" nào.
 *
 * Khẳng định an toàn sai còn nguy hiểm hơn không nói gì, vì nó làm người dùng
 * ngừng cảnh giác. Giờ card này nói ĐÚNG PHẠM VI đã kiểm được.
 */

const TYPE_STYLE = {
  ALLERGY_MATCH: { bg: '#FEF2F2', border: '#DC2626', fg: '#991B1B', icon: ShieldAlert },
  ALLERGY_CROSS: { bg: '#FEF2F2', border: '#F87171', fg: '#B91C1C', icon: ShieldAlert },
  DUPLICATE_ACTIVE_INGREDIENT: { bg: '#FEF2F2', border: '#F87171', fg: '#B91C1C', icon: Pill },
  DRUG_INTERACTION: { bg: '#FFF7ED', border: '#FB923C', fg: '#C2410C', icon: AlertTriangle },
  FOOD_INTERACTION: { bg: '#FFFBEB', border: '#FBBF24', fg: '#B45309', icon: Utensils }
};

const SEVERITY_LABEL = {
  vi: {
    CRITICAL: 'Nghiêm trọng',
    SEVERE: 'Nghiêm trọng',
    HIGH: 'Cần chú ý',
    MODERATE: 'Vừa',
    MEDIUM: 'Vừa',
    LOW: 'Nhẹ'
  },
  en: {
    CRITICAL: 'Critical',
    SEVERE: 'Severe',
    HIGH: 'Warning',
    MODERATE: 'Moderate',
    MEDIUM: 'Medium',
    LOW: 'Low'
  }
};

function CoverageNote({ coverage, isVi = true }) {
  if (!coverage) return null;

  return (
    <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.7)', border: '1px dashed var(--glass-border)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.6 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        <HelpCircle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          {isVi ? (
            <>
              Đã đối chiếu <b>{coverage.recognized}/{coverage.total_meds}</b> thuốc với kho kiến thức
              (phiên bản {coverage.knowledge_version}
              {coverage.reviewed_by_pharmacist ? ', đã được dược sĩ rà' : ', chưa được dược sĩ rà'}).
              {coverage.unrecognized?.length > 0 && (
                <> Chưa nhận dạng được: <b>{coverage.unrecognized.join(', ')}</b> — những thuốc này
                <b> không được kiểm tra</b>, nhà mình hỏi dược sĩ giúp ạ.</>
              )}
              {coverage.allergies_on_file === 0 && (
                <> Hồ sơ chưa ghi tiền sử dị ứng nào, nên app <b>chưa kiểm tra được phần dị ứng</b>.</>
              )}
            </>
          ) : (
            <>
              Cross-checked <b>{coverage.recognized}/{coverage.total_meds}</b> medications with knowledge base
              (version {coverage.knowledge_version}
              {coverage.reviewed_by_pharmacist ? ', reviewed by pharmacist' : ', unreviewed'}).
              {coverage.unrecognized?.length > 0 && (
                <> Unrecognized: <b>{coverage.unrecognized.join(', ')}</b> — these medications
                <b> were not checked</b>. Please consult a pharmacist.</>
              )}
              {coverage.allergies_on_file === 0 && (
                <> No recorded allergies on file, so <b>allergy screening was skipped</b>.</>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignatureAlertCard({ warnings = [], coverage = null, language = 'vi' }) {
  const isVi = language === 'vi';
  const severities = SEVERITY_LABEL[language] || SEVERITY_LABEL.vi;

  if (!warnings || warnings.length === 0) {
    return (
      <div className="liquid-card" style={{ padding: 22, background: 'linear-gradient(135deg, rgba(236,253,245,0.7) 0%, rgba(255,255,255,0.85) 100%)', border: '1px solid rgba(5,150,105,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 42, height: 42, borderRadius: 16, background: 'var(--emerald-grad)', display: 'grid', placeItems: 'center', color: '#FFF', flexShrink: 0 }}>
            <ShieldCheck size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--emerald-ok)' }}>
              {isVi ? 'Chưa phát hiện xung đột nào trong phạm vi đã kiểm' : 'No conflicts detected within checked scope'}
            </h4>
            <p style={{ fontSize: 14, color: 'var(--text-sub)', marginTop: 2, lineHeight: 1.55 }}>
              {isVi
                ? 'App đã đối chiếu dị ứng, trùng hoạt chất, tương tác thuốc–thuốc và kiêng ăn. Kho kiến thức còn hạn chế nên đây không phải lời khẳng định là an toàn tuyệt đối.'
                : 'Checked for allergies, duplicate ingredients, drug-drug and food-drug interactions. Please consult healthcare professionals for definitive guidance.'}
            </p>
            <CoverageNote coverage={coverage} isVi={isVi} />
          </div>
        </div>
        <MedicalDisclaimer variant="inline" language={language} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {warnings.map((warn, idx) => {
        const style = TYPE_STYLE[warn.type] || TYPE_STYLE.DRUG_INTERACTION;
        const Icon = style.icon;

        return (
          <div key={idx} className="liquid-card" style={{ padding: 22, background: style.bg, border: `1.5px solid ${style.border}` }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 42, height: 42, borderRadius: 16, background: style.border, display: 'grid', placeItems: 'center', color: '#FFF', flexShrink: 0 }}>
                <Icon size={22} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: style.fg }}>{warn.title}</h4>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 10px', borderRadius: 99, background: style.border, color: '#FFF' }}>
                    {severities[warn.severity] || warn.severity}
                  </span>
                </div>

                <p style={{ fontSize: 14, color: 'var(--text-sub)', marginTop: 6, lineHeight: 1.55, fontWeight: 500 }}>
                  {warn.description}
                </p>

                {warn.action_recommended && (
                  <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: style.fg, background: 'rgba(255,255,255,0.75)', padding: '8px 14px', borderRadius: 12 }}>
                    👉 {warn.action_recommended}
                  </div>
                )}

                {warn.alternative && (
                  <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: 'var(--emerald-ok)', background: 'rgba(255,255,255,0.75)', padding: '8px 14px', borderRadius: 12 }}>
                    {isVi ? 'Thay bằng:' : 'Alternative:'} {warn.alternative}
                  </div>
                )}

                {warn.source && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                    {isVi ? 'Nguồn:' : 'Source:'} {warn.source}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div className="liquid-card" style={{ padding: 16 }}>
        <CoverageNote coverage={coverage} />
        <MedicalDisclaimer variant="inline" />
      </div>
    </div>
  );
}
