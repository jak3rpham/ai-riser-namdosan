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
import { getManagerSections } from './ManagerSidebar';
import { I18N_STRINGS } from '../services/i18n';

/**
 * Bảng điều khiển của app Con.
 */
export default function FamilyDashboard({
  section = null,
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
  const shows = id => section === null || section === id;
  const [isPharmacyOpen, setIsPharmacyOpen] = useState(false);
  const [isMapsOpen, setIsMapsOpen] = useState(false);
  const t = I18N_STRINGS[language] || I18N_STRINGS.vi;
  const isVi = language === 'vi';

  // ⚠️ Chỉ lấy đơn của ĐÚNG thành viên đang chọn.
  const memberPrescriptions = prescriptions.filter(p => p.member_id === selectedMember.id);
  const activeMeds = memberPrescriptions.flatMap(p => p.medications || []);

  // Tính tỷ lệ tuân thủ từ dòng sự kiện thật (`feed`)
  const memberDoseLogs = feed.filter(f => f.type === 'DOSE_TAKEN' && (f.subject_id === selectedMember.id || f.subject_name === selectedMember.display_name));
  const dosesTakenCount = memberDoseLogs.length;
  // Giả định chuẩn 2 liều/ngày * số thuốc
  const expectedDoses = Math.max(1, activeMeds.length * 2);
  const complianceRate = dosesTakenCount > 0
    ? Math.min(100, Math.round((dosesTakenCount / expectedDoses) * 100))
    : null;

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

  const hasRemainingEstimate = Number.isFinite(minDaysRemaining);

  // Kiểm tra an toàn: dị ứng + trùng hoạt chất + tương tác thuốc–thuốc + kiêng ăn.
  const safety = runAllSafetyChecks({
    newMedications: [],
    existingMedications: activeMeds,
    memberProfile: selectedMember
  });

  const sections = getManagerSections(language);
  const sectionMeta = sections.find(s => s.id === section) || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* ── Đầu trang ── */}
      <div className="manager-section-head">
        <div>
          <h3 className="manager-section-title">{sectionMeta?.label || t.family_profile}</h3>
          <div className="manager-section-sub">
            {section
              ? `${sectionMeta?.hint || ''} — ${isVi ? 'hồ sơ của' : 'profile of'} ${selectedMember.display_name}`
              : t.family_profile_sub}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsMapsOpen(true)}
            className="btn-secondary"
            style={{ padding: '8px 16px', borderRadius: 99, fontSize: 13, border: '1px solid var(--glass-border)', color: 'var(--sky-blue)' }}
          >
            <MapPin size={16} /> {isVi ? 'Tìm nhà thuốc gần đây' : 'Nearby Pharmacies'}
          </button>

          <button
            onClick={() => setIsPharmacyOpen(true)}
            className="btn-secondary"
            style={{ padding: '8px 16px', borderRadius: 99, fontSize: 13, border: '1.5px solid var(--coral-border)', color: 'var(--coral-main)', background: 'var(--coral-soft)' }}
          >
            <UserCheck size={16} /> {t.pharmacy_mode_btn}
          </button>

          {!section && (
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
          )}
        </div>
      </div>

      {/* Prescription Upload & Scanning Wizard */}
      {shows('prescriptions') && (
        <PrescriptionUploadWizard onAddPrescription={onAddPrescription} selectedMember={selectedMember} prescriptions={prescriptions} language={language} />
      )}

      {/* Overview Stat Boxes */}
      {shows('overview') && (
      <div className="stat-grid">
        <div className="liquid-card" style={{ padding: 22 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>{t.compliance_rate}</span>
          <div style={{ fontSize: 32, fontWeight: 800, color: complianceRate == null ? 'var(--text-muted)' : 'var(--emerald-ok)', margin: '6px 0 2px' }}>
            {complianceRate == null ? '—' : `${complianceRate}%`}
          </div>
          <span style={{ fontSize: 14, color: complianceRate == null ? 'var(--text-sub)' : 'var(--emerald-ok)', fontWeight: 700 }}>
            {complianceRate == null
              ? (isVi ? 'Chưa có lần uống nào được ghi nhận' : 'No dose records logged yet')
              : (isVi ? `✓ ${selectedMember.display_name} đã ghi nhận ${dosesTakenCount} lần uống` : `✓ ${selectedMember.display_name} has logged ${dosesTakenCount} doses`)}
          </span>
        </div>

        <div className="liquid-card" style={{ padding: 22 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>{t.meds_count}</span>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-dark)', margin: '6px 0 2px' }}>
            {isVi ? `${activeMeds.length} loại` : `${activeMeds.length} items`}
          </div>
          <span style={{ fontSize: 14, color: 'var(--text-sub)', fontWeight: 600 }}>
            {activeMeds.length
              ? [...new Set(activeMeds.flatMap(m => resolveGenerics(m).map(g => GENERIC_PLAIN_NAMES[g]).filter(Boolean)))].join(' · ') || (isVi ? 'Chưa phân loại được' : 'Uncategorized')
              : (isVi ? 'Chưa có đơn thuốc nào' : 'No active prescriptions')}
          </span>
        </div>

        <div className="liquid-card" style={{ padding: 22 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>{t.medicine_cabinet}</span>
          {(() => {
            const low = hasRemainingEstimate && minDaysRemaining <= 5;
            const tone = !activeMeds.length || !hasRemainingEstimate
              ? 'var(--text-muted)'
              : low ? 'var(--amber-warm)' : 'var(--emerald-ok)';

            const headline = !activeMeds.length ? (isVi ? 'Chưa có thuốc' : 'No medications')
              : !hasRemainingEstimate ? (isVi ? 'Chưa tính được' : 'Not calculated')
              : minDaysRemaining === 0 ? (isVi ? 'Hết thuốc rồi' : 'Out of medication')
              : (isVi ? `Còn ${minDaysRemaining} ngày` : `${minDaysRemaining} days remaining`);

            const sub = !activeMeds.length ? (isVi ? 'Thêm đơn thuốc để app tính giúp ngày hết' : 'Add prescriptions to track refills')
              : !hasRemainingEstimate ? (isVi ? 'Đơn chưa ghi số ngày uống — bổ sung giúp nhé' : 'Duration not specified on prescription')
              : minDaysRemaining === 0 ? (isVi ? '⚠️ Theo đơn thì đã hết — nhà mình mua thêm nhé' : '⚠️ Medication finished — please refill')
              : low ? (isVi ? '⚠️ Sắp hết, nhà mình mua thêm nhé' : '⚠️ Low supply — refill soon')
              : (isVi ? '✓ Lượng thuốc còn đủ dùng' : '✓ Sufficient medication supply');

            return (
              <>
                <div style={{ fontSize: 32, fontWeight: 800, color: tone, margin: '6px 0 2px' }}>{headline}</div>
                <span style={{ fontSize: 14, color: tone === 'var(--text-muted)' ? 'var(--text-sub)' : tone, fontWeight: 700 }}>{sub}</span>
              </>
            );
          })()}
        </div>
      </div>
      )}

      {/* Signature Safety Alerts (T15 & M12) */}
      {shows('overview') && (
      <div>
        <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck color="var(--amber-warm)" /> {isVi ? 'Kiểm tra an toàn thuốc' : 'Medication Safety Checks'}
        </h4>
        <SignatureAlertCard warnings={safety.warnings} coverage={safety.coverage} language={language} />
      </div>
      )}

      {/* Dòng sự kiện realtime từ phía ba mẹ */}
      {shows('overview') && <FamilyFeedCard feed={feed} language={language} />}

      {/* Food-Drug Interactions (M12) */}
      {shows('food') && <FoodInteractionCard selectedMember={selectedMember} prescriptions={prescriptions} language={language} />}

      {/* Hospital Appointment & Consultation Sync (M20) */}
      {shows('appointments') && (
        <AppointmentTrackerCard selectedMember={selectedMember} appointments={appointments} onSaveAppointment={onAddAppointment} language={language} />
      )}

      {/* Health Metrics (M17) */}
      {shows('vitals') && (
        <HealthTrackerCard selectedMember={selectedMember} readings={readings} onSaveReading={onSaveReading} language={language} />
      )}

      {/* Medicine Cabinet */}
      {shows('prescriptions') && <MedicineCabinet medications={activeMeds} language={language} />}

      <MedicalDisclaimer variant="bar" language={language} />

      <PharmacyModeModal isOpen={isPharmacyOpen} onClose={() => setIsPharmacyOpen(false)} memberProfile={selectedMember} prescriptions={prescriptions} language={language} />
      <NearbyHealthcareModal isOpen={isMapsOpen} onClose={() => setIsMapsOpen(false)} language={language} />

    </div>
  );
}


