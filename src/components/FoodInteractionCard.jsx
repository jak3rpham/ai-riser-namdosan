import React from 'react';
import { Utensils, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { checkFoodInteractions } from '../services/safetyChecks';
import { resolveGenerics } from '../services/medicalKnowledge';
import MedicalDisclaimer from './MedicalDisclaimer';

/**
 * Cảnh báo kiêng ăn (M12) — suy từ THUỐC THẬT của người đang được chọn.
 *
 * ⚠️ Bản trước dùng mảng `MOCK_FOOD_INTERACTIONS` hardcode, không liên quan tới
 * thành viên đang chọn: chọn Mẹ Lan (chỉ đau khớp) vẫn hiện cảnh báo Metformin
 * mà bà không uống. Header lại ghi "Gemini AI tự động rà soát" trong khi không
 * có lời gọi AI nào (doc 33 mục 10).
 *
 * Bản này đọc đúng đơn của member, tra hoạt chất, rồi tra bảng kiêng ăn.
 * Một mục sai dược lý ở bản cũ (statin ↔ chất béo bão hoà) đã bỏ; tương tác
 * thật cần cảnh báo cho statin là bưởi.
 */
export default function FoodInteractionCard({ selectedMember, prescriptions = [], language = 'vi' }) {
  const isVi = language === 'vi';
  const meds = prescriptions
    .filter(p => !selectedMember?.id || p.member_id === selectedMember.id)
    .flatMap(p => p.medications || []);

  const warnings = checkFoodInteractions(meds);
  const unrecognized = meds.filter(m => resolveGenerics(m).length === 0).map(m => m.name);

  return (
    <div className="liquid-card" style={{ padding: 26 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Utensils color="var(--coral-main)" /> {isVi ? 'Kiêng ăn theo đơn thuốc' : 'Food-Drug Interactions'}
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-sub)' }}>
            {isVi
              ? `Đối chiếu ${meds.length} thuốc trong đơn của ${selectedMember?.display_name || 'thành viên'} với bảng tương tác thuốc–thức ăn.`
              : `Cross-referencing ${meds.length} medications for ${selectedMember?.display_name || 'member'} with food interaction database.`}
          </p>
        </div>

        <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 99, background: 'var(--coral-soft)', color: 'var(--coral-main)', whiteSpace: 'nowrap' }}>
          {isVi ? `${warnings.length} cảnh báo` : `${warnings.length} alerts`}
        </span>
      </div>

      {warnings.length === 0 ? (
        <div style={{ padding: 16, borderRadius: 16, background: '#F0FDF4', border: '1px solid #86EFAC', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <ShieldCheck size={20} color="var(--emerald-ok)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 14, color: '#166534', fontWeight: 600, lineHeight: 1.55 }}>
            {isVi ? 'Không có món nào cần kiêng trong bảng hiện tại.' : 'No dietary restrictions found in the database.'}
            {meds.length === 0 && (isVi ? ' Hồ sơ chưa có thuốc nào để đối chiếu.' : ' No medications on file to check.')}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {warnings.map((item, idx) => {
            const high = item.severity === 'HIGH';
            return (
              <div key={idx} style={{ padding: 16, borderRadius: 20, background: high ? '#FFF1F2' : '#FFFBEB', border: high ? '1px solid #FECDD3' : '1px solid #FDE68A', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ padding: 8, borderRadius: 12, background: high ? '#FFE4E6' : '#FEF3C7', color: high ? '#E11D48' : '#D97706', flexShrink: 0 }}>
                  <AlertTriangle size={20} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <h5 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-dark)' }}>{item.title}</h5>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 10px', borderRadius: 99, background: high ? '#E11D48' : '#D97706', color: '#FFF', whiteSpace: 'nowrap' }}>
                      {high ? (isVi ? 'NGUY CƠ CAO' : 'HIGH RISK') : (isVi ? 'CHÚ Ý' : 'WARNING')}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: 'var(--text-dark)', marginTop: 4, fontWeight: 600, lineHeight: 1.55 }}>
                    {item.description}
                  </p>

                  {item.alternative && (
                    <div style={{ fontSize: 13, color: 'var(--emerald-ok)', fontWeight: 700, marginTop: 6, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <ShieldCheck size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {item.alternative}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {unrecognized.length > 0 && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(241,245,249,0.8)', border: '1px dashed var(--glass-border)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', gap: 6, alignItems: 'flex-start', lineHeight: 1.55 }}>
          <Info size={13} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            {isVi ? (
              <>
                App chưa nhận dạng được hoạt chất của: <b>{unrecognized.join(', ')}</b>.
                Những thuốc này <b>chưa được kiểm tra kiêng ăn</b> — nhà mình hỏi dược sĩ giúp ạ.
              </>
            ) : (
              <>
                Active ingredients not identified for: <b>{unrecognized.join(', ')}</b>.
                These medications <b>were not checked for food interactions</b>.
              </>
            )}
          </span>
        </div>
      )}

      <MedicalDisclaimer variant="inline" language={language} />
    </div>
  );
}
