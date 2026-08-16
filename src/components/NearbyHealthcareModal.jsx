import React, { useState, useEffect } from 'react';
import { X, MapPin, Navigation, Clock, Phone, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { apiPost } from '../services/apiClient';
import { getCurrentPosition } from '../services/googleMaps';
import { I18N_STRINGS } from '../services/i18n';

export default function NearbyHealthcareModal({ isOpen, onClose, language = 'vi' }) {
  const [filterType, setFilterType] = useState('ALL'); // ALL | PHARMACY | HOSPITAL
  const [openOnly, setOpenOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState(null);
  const [hint, setHint] = useState(null);

  const t = I18N_STRINGS[language] || I18N_STRINGS.vi;

  const fetchNearbyPlaces = async () => {
    setLoading(true);
    setError(null);
    setHint(null);

    const pos = await getCurrentPosition();

    if (!pos.ok) {
      setLoading(false);
      setError(pos.error_message);
      setHint(pos.hint);
      return;
    }

    const res = await apiPost('/places/nearby', {
      latitude: pos.latitude,
      longitude: pos.longitude,
      radius: 5000,
      type: filterType === 'PHARMACY' ? 'pharmacy' : filterType === 'HOSPITAL' ? 'hospital' : 'all'
    });

    setLoading(false);

    if (!res.ok) {
      setError(res.error_message);
      return;
    }

    setPlaces(res.places || []);
  };

  useEffect(() => {
    if (isOpen) {
      fetchNearbyPlaces();
    }
  }, [isOpen, filterType]);

  if (!isOpen) return null;

  const filteredPlaces = places.filter(place => {
    if (openOnly && place.is_open === false) return false;
    return true;
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(20px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="liquid-card" style={{ width: '100%', maxWidth: 740, maxHeight: '90vh', overflowY: 'auto', background: '#FFF', borderRadius: 32, padding: 32, boxShadow: '0 25px 80px rgba(0,0,0,0.25)' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'var(--sky-soft, #E0F2FE)', color: 'var(--sky-blue, #0284C7)', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
              <Navigation size={14} /> Dữ liệu OpenStreetMap
            </div>
            <h3 style={{ fontSize: 23, fontWeight: 800, color: 'var(--text-dark)' }}>📍 Tìm Nhà thuốc & Cơ sở Y tế gần đây</h3>
            <p style={{ fontSize: 14, color: 'var(--text-sub)' }}>
              Định vị vị trí hiện tại để liệt kê nhà thuốc và bệnh viện thực tế quanh bạn (khoảng cách đường chim bay).
            </p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#F1F5F9', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <X size={22} />
          </button>
        </div>

        {/* Filter Controls & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 20, padding: '12px 16px', background: '#F8FAFC', borderRadius: 20, border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: "Tất cả", val: "ALL" },
              { label: "💊 Nhà thuốc", val: "PHARMACY" },
              { label: "🏥 Bệnh viện & PK", val: "HOSPITAL" }
            ].map(tab => (
              <button
                key={tab.val}
                onClick={() => setFilterType(tab.val)}
                style={{
                  border: 'none', padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 800, cursor: 'pointer',
                  background: filterType === tab.val ? 'var(--coral-main)' : 'rgba(255,255,255,0.8)',
                  color: filterType === tab.val ? '#FFF' : 'var(--text-sub)',
                  boxShadow: filterType === tab.val ? '0 4px 12px var(--coral-glow)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--text-dark)', cursor: 'pointer' }}>
              <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} style={{ accentColor: 'var(--coral-main)', width: 16, height: 16 }} />
              🟢 Chỉ nơi đang mở cửa
            </label>

            <button className="btn-secondary" onClick={fetchNearbyPlaces} disabled={loading} style={{ padding: '6px 12px', borderRadius: 12, fontSize: 12 }}>
              {loading ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
              Tải lại
            </button>
          </div>
        </div>

        {/* Error / Hint Banner */}
        {error && (
          <div style={{ padding: 16, borderRadius: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#991B1B', fontWeight: 800, fontSize: 14 }}>
              <AlertCircle size={18} color="#DC2626" /> {error}
            </div>
            {hint && (
              <div style={{ marginTop: 8, fontSize: 13, color: '#7F1D1D', fontWeight: 600 }}>
                💡 Gợi ý: {hint}
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-sub)', fontWeight: 600 }}>
            <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 12px', color: 'var(--coral-main)' }} />
            Đang lấy vị trí và tìm cơ sở y tế quanh bác...
          </div>
        )}

        {/* Place Cards */}
        {!loading && !error && filteredPlaces.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-sub)', fontSize: 14 }}>
            Không tìm thấy cơ sở y tế nào gần vị trí của bạn với bộ lọc hiện tại.
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredPlaces.map(place => (
              <div key={place.id} style={{ padding: 18, borderRadius: 20, background: '#FFF', border: '1px solid var(--glass-border)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)' }}>{place.name}</h4>
                    {/* Ba trạng thái. `null` = không rõ giờ mở cửa — phần lớn điểm
                        trên OpenStreetMap rơi vào đây. Không được hiển thị thành
                        "đang mở" hay "đóng cửa": đoán sai kiểu nào cũng làm bác đi
                        oan hoặc bỏ lỡ chỗ đang mở. */}
                    {place.is_open === true && (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: 'rgba(5,150,105,0.1)', color: 'var(--emerald-ok)', border: '1px solid rgba(5,150,105,0.2)' }}>
                        🟢 ĐANG MỞ CỬA
                      </span>
                    )}
                    {place.is_open === false && (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: '#F1F5F9', color: '#64748B' }}>
                        ⚪ ĐÓNG CỬA
                      </span>
                    )}
                    {place.is_open == null && (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: '#FFF7ED', color: '#C2410C', border: '1px solid rgba(194,65,12,0.15)' }}>
                        ⏱ CHƯA RÕ GIỜ MỞ
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 14, color: 'var(--text-sub)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={15} color="var(--coral-main)" /> {place.address} {place.distance_km != null ? `(${place.distance_km} km chim bay)` : ''}
                  </div>

                  {place.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
                      <Phone size={14} /> {place.phone}
                    </div>
                  )}
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " " + place.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <button className="btn-primary" style={{ padding: '10px 18px', borderRadius: 16, fontSize: 13, whitespace: 'nowrap' }}>
                    <Navigation size={15} /> Chỉ đường
                  </button>
                </a>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
