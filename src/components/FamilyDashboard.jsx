import React, { useState } from 'react';
import { Users, Calendar, ShieldCheck, Plus, Sparkles, Activity, UserCheck, MapPin } from 'lucide-react';
import PrescriptionUploadWizard from './PrescriptionUploadWizard';
import SignatureAlertCard from './SignatureAlertCard';
import MedicineCabinet from './MedicineCabinet';
import PharmacyModeModal from './PharmacyModeModal';
import NearbyHealthcareModal from './NearbyHealthcareModal';
import HealthTrackerCard from './HealthTrackerCard';
import FoodInteractionCard from './FoodInteractionCard';
import AppointmentTrackerCard from './AppointmentTrackerCard';
import { runAllSafetyChecks } from '../services/safetyChecks';
import { resolveGenerics, GENERIC_PLAIN_NAMES } from '../services/medicalKnowledge';
import MedicalDisclaimer from './MedicalDisclaimer';
import FamilyFeedCard from './FamilyFeedCard';
import { I18N_STRINGS } from '../services/mockData';

export default function FamilyDashboard({
  members = [],
  selectedMember,
  onSelectMember,
  readings = [],
  onSaveReading,
  prescriptions = [],
  onAddPrescription,
  appointments = [],
  onAddAppointment,
  feed = [],
  language = 'vi'
}) {
  const [isPharmacyOpen, setIsPharmacyOpen] = useState(false);
  const [isMapsOpen, setIsMapsOpen] = useState(false);
  const t = I18N_STRINGS[language] || I18N_STRINGS.vi;

  // ⚠️ Chỉ lấy đơn của ĐÚNG thành viên đang chọn.
  const memberPrescriptions = prescriptions.filter(p => p.member_id === selectedMember.id);
  const activeMeds = memberPrescriptions.flatMap(p => p.medications || []);

  // Tính tỷ lệ tuân thủ từ dòng sự kiện thật (`feed`)
  const memberDoseLogs = feed.filter(f => f.type === 'DOSE_TAKEN' && (f.subject_id === selectedMember.id || f.subject_name === selectedMember.display_name));
  const dosesTakenCount = memberDoseLogs.length;
  // Giả định chuẩn 2 liều/ngày * số thuốc
  const expectedDoses = Math.max(1, activeMeds.length * 2);
  // Chưa ghi nhận lần uống nào thì KHÔNG có tỷ lệ. Bản trước rơi về 96% —
  // một con số bịa, hiện ngay trên hồ sơ vừa tạo, kèm câu "uống rất đúng giờ"
  // cho người chưa từng uống viên nào.
  const complianceRate = dosesTakenCount > 0
    ? Math.min(100, Math.round((dosesTakenCount / expectedDoses) * 100))
    : null;

  /**
   * Còn mấy ngày nữa hết thuốc.
   *
   * ⚠️ Bản trước lấy thẳng `duration_days` — SỐ NGÀY BÁC SĨ KÊ, không phải số
   * ngày còn lại. Đơn kê 30 ngày quét vào từ tháng trước vẫn hiện "Hết sau 30
   * ngày" kèm dấu ✓ "Lượng thuốc còn đầy đủ", đúng lúc trong nhà đã hết thuốc.
   * Con cái nhìn con số đó để quyết định có đi mua thuốc hay không.
   *
   * Và `|| 7` ở cuối là một con số từ trên trời rơi xuống cho thuốc không ghi
   * số ngày. Giờ thuốc nào không biết thì không tính, thay vì đoán.
   */
  // `created_at` về từ hai nguồn: chuỗi "2026-08-16" do màn quét đơn ghi, và
  // Timestamp của Firestore do nhà mẫu ghi bằng serverTimestamp().
  const daysSince = value => {
    const ms = value?.toDate ? value.toDate().getTime() : Date.parse(value);
    if (!Number.isFinite(ms)) return 0;
    return Math.max(0, Math.floor((Date.now() - ms) / 86400000));
  };

  const minDaysRemaining = memberPrescriptions.reduce((min, p) => {
    const elapsed = daysSince(p.created_at);
    return (p.medications || []).reduce((acc, med) => {
      const total = parseInt(med.duration_days ?? med.est_remaining, 10);
      if (!Number.isFinite(total)) return acc;
      return Math.min(acc, Math.max(0, total - elapsed));
    }, min);
  }, Infinity);

  // Không thuốc nào ghi đủ để tính → nói là chưa tính được, không bịa một con số
  const hasRemainingEstimate = Number.isFinite(minDaysRemaining);

  // Kiểm tra an toàn: dị ứng + trùng hoạt chất + tương tác thuốc–thuốc + kiêng ăn.
  const safety = runAllSafetyChecks({
    newMedications: [],
    existingMedications: activeMeds,
    memberProfile: selectedMember
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Top Bar: Member Selector & Status */}
      <div className="liquid-card" style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)' }}>{t.family_profile}</h3>
          <span style={{ fontSize: 13.5, color: 'var(--text-sub)' }}>{t.family_profile_sub}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsMapsOpen(true)}
            className="btn-secondary"
            style={{ padding: '8px 16px', borderRadius: 99, fontSize: 13, border: '1px solid var(--glass-border)', color: 'var(--sky-blue)' }}
          >
            <MapPin size={16} /> 📍 Tìm Nhà thuốc (M16)
          </button>

          <button
            onClick={() => setIsPharmacyOpen(true)}
            className="btn-secondary"
            style={{ padding: '8px 16px', borderRadius: 99, fontSize: 13, border: '1.5px solid var(--coral-border)', color: 'var(--coral-main)', background: 'var(--coral-soft)' }}
          >
            <UserCheck size={16} /> {t.pharmacy_mode_btn}
          </button>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {members.map(m => (
              <div
                key={m.id}
                onClick={() => onSelectMember(m)}
                className={`member-chip ${selectedMember.id === m.id ? 'active' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 99,
                  background: selectedMember.id === m.id ? '#FFF' : 'rgba(255,255,255,0.6)',
                  border: selectedMember.id === m.id ? '1.5px solid var(--coral-main)' : '1px solid var(--glass-border)',
                  fontWeight: 700, fontSize: 14, color: selectedMember.id === m.id ? 'var(--coral-main)' : 'var(--text-sub)',
                  cursor: 'pointer', boxShadow: selectedMember.id === m.id ? '0 4px 14px rgba(255,107,75,0.15)' : 'none'
                }}
              >
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: m.avatar_color || 'var(--coral-grad)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 11, fontWeight: 800 }}>
                  {m.display_name.charAt(0)}
                </div>
                {m.display_name} ({m.relation})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prescription Upload & Scanning Wizard */}
      <PrescriptionUploadWizard onAddPrescription={onAddPrescription} selectedMember={selectedMember} prescriptions={prescriptions} language={language} />

      {/* Overview Stat Boxes */}
      <div className="stat-grid">
        <div className="liquid-card" style={{ padding: 22 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>{t.compliance_rate}</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: complianceRate == null ? 'var(--text-muted)' : 'var(--emerald-ok)', margin: '6px 0 2px' }}>
            {complianceRate == null ? '—' : `${complianceRate}%`}
          </div>
          <span style={{ fontSize: 13.5, color: complianceRate == null ? 'var(--text-sub)' : 'var(--emerald-ok)', fontWeight: 700 }}>
            {complianceRate == null
              ? 'Chưa có lần uống nào được ghi nhận'
              : `✓ ${selectedMember.display_name} đã ghi nhận ${dosesTakenCount} lần uống`}
          </span>
        </div>

        <div className="liquid-card" style={{ padding: 22 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>{t.meds_count}</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-dark)', margin: '6px 0 2px' }}>{activeMeds.length} loại</div>
          <span style={{ fontSize: 13.5, color: 'var(--text-sub)', fontWeight: 600 }}>
            {activeMeds.length
              ? [...new Set(activeMeds.flatMap(m => resolveGenerics(m).map(g => GENERIC_PLAIN_NAMES[g]).filter(Boolean)))].join(' · ') || 'Chưa phân loại được'
              : 'Chưa có đơn thuốc nào'}
          </span>
        </div>

        <div className="liquid-card" style={{ padding: 22 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>{t.medicine_cabinet}</span>
          {(() => {
            const low = hasRemainingEstimate && minDaysRemaining <= 5;
            const tone = !activeMeds.length || !hasRemainingEstimate
              ? 'var(--text-muted)'
              : low ? 'var(--amber-warm)' : 'var(--emerald-ok)';

            const headline = !activeMeds.length ? 'Chưa có thuốc'
              : !hasRemainingEstimate ? 'Chưa tính được'
              : minDaysRemaining === 0 ? 'Hết thuốc rồi'
              : `Còn ${minDaysRemaining} ngày`;

            const sub = !activeMeds.length ? 'Thêm đơn thuốc để app tính giúp ngày hết'
              : !hasRemainingEstimate ? 'Đơn chưa ghi số ngày uống — bổ sung giúp nhé'
              : minDaysRemaining === 0 ? '⚠️ Theo đơn thì đã hết — nhà mình mua thêm nhé'
              : low ? '⚠️ Sắp hết, nhà mình mua thêm nhé'
              : '✓ Lượng thuốc còn đủ dùng';

            return (
              <>
                <div style={{ fontSize: 28, fontWeight: 800, color: tone, margin: '6px 0 2px' }}>{headline}</div>
                <span style={{ fontSize: 13.5, color: tone === 'var(--text-muted)' ? 'var(--text-sub)' : tone, fontWeight: 700 }}>{sub}</span>
              </>
            );
          })()}
        </div>
      </div>

      {/* Signature Safety Alerts (T15 & M12) */}
      <div>
        <h4 style={{ fontSize: 17, fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck color="var(--amber-warm)" /> Kiểm tra an toàn thuốc
        </h4>
        <SignatureAlertCard warnings={safety.warnings} coverage={safety.coverage} />
      </div>

      {/* Dòng sự kiện realtime từ phía ba mẹ */}
      <FamilyFeedCard feed={feed} />

      {/* Food-Drug Interactions (M12) */}
      <FoodInteractionCard selectedMember={selectedMember} prescriptions={prescriptions} language={language} />

      {/* Hospital Appointment & Consultation Sync (M20) */}
      <AppointmentTrackerCard selectedMember={selectedMember} appointments={appointments} onSaveAppointment={onAddAppointment} language={language} />


      {/* Health Metrics (M17) */}
      <HealthTrackerCard selectedMember={selectedMember} readings={readings} onSaveReading={onSaveReading} language={language} />

      {/* Medicine Cabinet */}
      <MedicineCabinet medications={activeMeds} language={language} />

      <MedicalDisclaimer variant="bar" language={language} />

      <PharmacyModeModal isOpen={isPharmacyOpen} onClose={() => setIsPharmacyOpen(false)} memberProfile={selectedMember} prescriptions={prescriptions} language={language} />
      <NearbyHealthcareModal isOpen={isMapsOpen} onClose={() => setIsMapsOpen(false)} language={language} />

    </div>
  );
}


