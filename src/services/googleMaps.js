/**
 * Google Places API (New) — tìm nhà thuốc / phòng khám / bệnh viện gần vị trí thật.
 *
 * Thay cho `MOCK_HEALTHCARE_PLACES` trong `NearbyHealthcareModal.jsx` bản cũ:
 * 3 địa điểm TP.HCM ghi cứng, khoảng cách "0.4 km" bịa, badge ghi "Google Maps
 * Grounding" nhưng không gọi API nào.
 *
 * ─────────────────────────────────────────────────────────────────
 * KHÁC VỚI CALENDAR / TASKS: chỗ này dùng **API key**, không dùng OAuth —
 * tìm địa điểm không cần đụng vào tài khoản người dùng.
 *
 * ⚠️ Hai điều kiện bắt buộc, thiếu là gọi sẽ lỗi:
 *   1. Bật **Places API (New)** trong Google Cloud và **bật thanh toán**.
 *      Places API không có bậc miễn phí kiểu Gemini.
 *   2. Khoá phải giới hạn theo **HTTP referrer** = domain đang chạy,
 *      vì khoá này lộ ra trong mã nguồn phía trình duyệt.
 *   Xem doc 36 mục 4.
 */

const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places:searchNearby';

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const isMapsConfigured = () => !!apiKey;

/** Loại địa điểm theo cách Places phân loại */
export const PLACE_TYPES = {
  PHARMACY: 'pharmacy',
  HOSPITAL: 'hospital',
  CLINIC: 'doctor'
};

/**
 * Lấy vị trí hiện tại của người dùng.
 *
 * ⚠️ `navigator.geolocation` chỉ chạy trong secure context. Mở app bằng
 * http://192.168.x.x trên iPhone sẽ KHÔNG lấy được vị trí — phải dùng
 * `npm run dev:https` hoặc bản đã deploy (doc 34 mục 1–2).
 */
export function getCurrentPosition({ timeout = 10000 } = {}) {
  return new Promise(resolve => {
    if (!('geolocation' in navigator)) {
      resolve({
        ok: false,
        error_code: 'NO_GEOLOCATION',
        error_message: 'Trình duyệt này không hỗ trợ định vị.'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        ok: true,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      }),
      err => {
        const map = {
          1: 'Bạn chưa cho phép truy cập vị trí. Bật lại trong cài đặt trình duyệt rồi thử lại nhé.',
          2: 'Không xác định được vị trí lúc này. Kiểm tra GPS hoặc mạng.',
          3: 'Tìm vị trí quá lâu. Bạn thử lại nhé.'
        };
        resolve({
          ok: false,
          error_code: `GEOLOCATION_${err.code}`,
          error_message: map[err.code] || 'Không lấy được vị trí.',
          // Nguyên nhân hay gặp nhất mà thông báo của trình duyệt không nói rõ
          hint: window.location.protocol === 'http:' && window.location.hostname !== 'localhost'
            ? 'Trang đang chạy qua http nên trình duyệt chặn định vị. Dùng https giúp nhé.'
            : null
        });
      },
      { enableHighAccuracy: true, timeout, maximumAge: 60000 }
    );
  });
}

/** Khoảng cách đường chim bay giữa hai toạ độ (km) — công thức haversine */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Tìm cơ sở y tế gần một toạ độ.
 *
 * Không có khoá / lỗi API → trả về `{ok:false}`. KHÔNG rơi về danh sách bịa,
 * vì "nhà thuốc mở cửa 24/7 cách 0.4 km" mà không có thật thì người nhà chạy
 * ra đó lúc nửa đêm sẽ gặp cửa đóng.
 */
export async function searchNearbyHealthcare({
  latitude,
  longitude,
  types = [PLACE_TYPES.PHARMACY],
  radiusMeters = 3000,
  maxResults = 12
}) {
  if (!apiKey) {
    return {
      ok: false,
      error_code: 'NO_MAPS_KEY',
      error_message: 'Chưa cấu hình VITE_GOOGLE_MAPS_API_KEY nên chưa tìm được nhà thuốc gần bạn.'
    };
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { ok: false, error_code: 'NO_LOCATION', error_message: 'Chưa có vị trí để tìm kiếm.' };
  }

  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.location',
    'places.currentOpeningHours.openNow',
    'places.regularOpeningHours.weekdayDescriptions',
    'places.nationalPhoneNumber',
    'places.rating',
    'places.userRatingCount',
    'places.googleMapsUri',
    'places.primaryType'
  ].join(',');

  let response;
  try {
    response = await fetch(PLACES_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask
      },
      body: JSON.stringify({
        includedTypes: types,
        maxResultCount: Math.min(maxResults, 20),
        rankPreference: 'DISTANCE',
        languageCode: 'vi',
        regionCode: 'VN',
        locationRestriction: {
          circle: {
            center: { latitude, longitude },
            radius: radiusMeters
          }
        }
      })
    });
  } catch (err) {
    return {
      ok: false,
      error_code: 'NETWORK_ERROR',
      error_message: 'Không gọi được Google Maps (mất mạng?).',
      detail: err.message
    };
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const msg = body?.error?.message || '';

    let friendly = `Google Maps trả về lỗi ${response.status}.`;
    if (response.status === 403 && msg.includes('not been used')) {
      friendly = 'Places API (New) chưa được bật trong Google Cloud project. Xem doc 36 mục 4.';
    } else if (response.status === 403 && msg.includes('referer')) {
      friendly = 'Khoá Maps bị chặn với domain này. Thêm domain vào phần giới hạn HTTP referrer của khoá.';
    } else if (response.status === 400 && msg.includes('billing')) {
      friendly = 'Places API cần bật thanh toán trong Google Cloud.';
    }

    return { ok: false, error_code: `HTTP_${response.status}`, error_message: friendly, detail: msg };
  }

  const data = await response.json();

  const places = (data.places || []).map(p => {
    const lat = p.location?.latitude;
    const lng = p.location?.longitude;
    const distKm = lat != null ? haversineKm(latitude, longitude, lat, lng) : null;

    return {
      id: p.id,
      name: p.displayName?.text || 'Không rõ tên',
      address: p.formattedAddress || '',
      lat,
      lng,
      // Khoảng cách đường chim bay, không phải quãng đường đi thật — nói rõ ở UI
      distance_km: distKm != null ? Math.round(distKm * 10) / 10 : null,
      is_open: p.currentOpeningHours?.openNow ?? null,
      opening_hours: p.regularOpeningHours?.weekdayDescriptions || [],
      phone: p.nationalPhoneNumber || null,
      rating: p.rating ?? null,
      rating_count: p.userRatingCount ?? null,
      maps_uri: p.googleMapsUri || null,
      type: p.primaryType || null
    };
  });

  places.sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));

  return { ok: true, places, searched_at: new Date().toISOString() };
}

/** Tìm quanh vị trí hiện tại — gộp hai bước cho tiện gọi từ UI */
export async function findNearbyFromCurrentLocation(options = {}) {
  const pos = await getCurrentPosition();
  if (!pos.ok) return pos;

  const result = await searchNearbyHealthcare({
    latitude: pos.latitude,
    longitude: pos.longitude,
    ...options
  });

  return { ...result, origin: { latitude: pos.latitude, longitude: pos.longitude } };
}

/** Link mở Google Maps chỉ đường — deep link, không tốn quota API */
export function directionsUrl(place) {
  if (place.maps_uri) return place.maps_uri;
  const q = encodeURIComponent(`${place.name} ${place.address}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
