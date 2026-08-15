import React, { useState } from 'react';
import { Calendar, MapPin, Bell, CheckCircle2, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { isGoogleConnected } from '../services/googleAuth';
import { createAppointmentEvent } from '../services/googleCalendar';

/**
 * ⚠️ Ở đây từng có `DEFAULT_APPOINTMENTS` — một cuộc hẹn bịa với bác sĩ bịa,
 * hiện ra khi hồ sơ chưa có lịch nào. Nguy hiểm không nằm ở cái tên bác sĩ mà
 * ở dòng `prep_instructions`: "Nhịn ăn sáng trước 07:00 để lấy máu". Một bác
 * 70 tuổi đọc được là nhịn ăn thật, cho một cuộc hẹn không tồn tại.
 *
 * Chưa có lịch thì nói là chưa có. Dữ liệu hư cấu chỉ nằm ở nhà mẫu.
 */

export default function AppointmentTrackerCard({
  selectedMember,
  appointments: propsAppointments,
  onSaveAppointment,
  language = 'vi'
}) {
  const memberAppointments = (propsAppointments || [])
    .filter(a => !a.member_id || a.member_id === selectedMember?.id);

  const [syncingId, setSyncingId] = useState(null);
  const [syncResults, setSyncResults] = useState({}); // { [appId]: { ok, link, error } }
  const [globalError, setGlobalError] = useState(null);

  const handleSyncAppointment = async (app) => {
    setGlobalError(null);
    setSyncingId(app.id);

    if (!isGoogleConnected()) {
      setSyncingId(null);
      setGlobalError('Chưa kết nối tài khoản Google. Vui lòng bấm "Kết nối Google" ở khung phía trên trước.');
      setSyncResults(prev => ({
        ...prev,
        [app.id]: { ok: false, error: 'Chưa kết nối Google' }
      }));
      return;
    }

    const dateTimeIso = app.dateTimeIso || '2026-08-18T08:30:00+07:00';
    const res = await createAppointmentEvent({
      title: `${selectedMember?.display_name || 'Người nhà'} tái khám — ${app.doctor}`,
      facility: app.hospital,
      dateTimeIso,
      notes: app.prep_instructions || ''
    });

    setSyncingId(null);

    if (res.ok) {
      const updated = { ...app, html_link: res.html_link, synced: true };
      setSyncResults(prev => ({
        ...prev,
        [app.id]: { ok: true, link: res.html_link }
      }));

      if (onSaveAppointment && selectedMember?.id) {
        await onSaveAppointment(selectedMember.id, updated);
      }
    } else {
      setSyncResults(prev => ({
        ...prev,
        [app.id]: { ok: false, error: res.error_message }
      }));
    }
  };

  return (
    <div className="liquid-card" style={{ padding: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar color="var(--coral-main)" /> Lịch Tái Khám & Xét Nghiệm
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-sub)' }}>
            Tự động nhắc lịch khám bác sĩ & hướng dẫn chuẩn bị trước ngày khám.
          </p>
        </div>
      </div>

      {globalError && (
        <div style={{ padding: '12px 14px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#991B1B', fontWeight: 600 }}>{globalError}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {memberAppointments.length === 0 && (
          <div style={{ padding: '20px 16px', borderRadius: 14, background: 'rgba(241,245,249,0.7)', textAlign: 'center' }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 4 }}>
              Chưa có lịch tái khám nào
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.5 }}>
              Chụp giấy hẹn khám hoặc nhập tay, app sẽ nhắc trước ngày khám
              và đồng bộ sang Google Calendar giúp bác.
            </div>
          </div>
        )}

        {memberAppointments.map(app => {
          const syncState = syncResults[app.id] || (app.html_link ? { ok: true, link: app.html_link } : null);
          const isSyncing = syncingId === app.id;

          return (
            <div key={app.id} style={{ padding: 18, borderRadius: 20, background: '#FFF', border: '1px solid var(--glass-border)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 99, background: 'var(--coral-soft)', color: 'var(--coral-main)' }}>
                      📅 {app.date} ({app.time})
                    </span>
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-dark)' }}>{app.doctor}</h4>
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-sub)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={15} color="var(--coral-main)" /> {app.hospital}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {syncState?.ok ? (
                    <a
                      href={syncState.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{ padding: '8px 14px', borderRadius: 99, fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'var(--emerald-ok)', fontWeight: 700 }}
                    >
                      <CheckCircle2 size={15} /> Xem trên Google Calendar <ExternalLink size={13} />
                    </a>
                  ) : (
                    <button
                      className="btn-secondary"
                      onClick={() => handleSyncAppointment(app)}
                      disabled={isSyncing}
                      style={{ padding: '8px 16px', borderRadius: 99, fontSize: 13 }}
                    >
                      {isSyncing ? <Loader2 className="animate-spin" size={15} /> : <Bell size={15} />}
                      {isSyncing ? "Đang đẩy sang Google..." : "Đồng bộ Google Calendar"}
                    </button>
                  )}
                </div>
              </div>

              {syncState?.ok === false && (
                <div style={{ marginTop: 10, fontSize: 12.5, color: '#DC2626', fontWeight: 600, background: '#FEF2F2', padding: '6px 12px', borderRadius: 8 }}>
                  ❌ Đồng bộ thất bại: {syncState.error}
                </div>
              )}

              {app.prep_instructions && (
                <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: '#F8FAFC', border: '1px dashed var(--glass-border)', fontSize: 13, color: 'var(--text-dark)' }}>
                  <strong style={{ color: 'var(--amber-warm)' }}>⚠️ Hướng dẫn trước khi khám:</strong> {app.prep_instructions}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
