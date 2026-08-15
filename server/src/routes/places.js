import { config } from '../lib/config.js';

/**
 * Tìm nhà thuốc / cơ sở y tế gần vị trí người dùng.
 *
 * ─────────────────────────────────────────────────────────────────
 * TẠI SAO KHÔNG DÙNG GOOGLE PLACES LÀM NGUỒN CHÍNH
 *
 * Google Maps Platform chặn billing account đăng ký bằng thẻ/giấy tờ Việt Nam.
 * Bật Places API từ một project của người dùng VN sẽ rơi vào vòng lặp:
 * đòi bật billing → bật xong vẫn không dùng được → tạo project mới → lặp lại.
 * Đây là ràng buộc ở tầng quốc gia, không phải lỗi cấu hình, nên không có
 * cách nào "sửa" cho đúng. (Dùng VPN để lách là vi phạm ToS và có thể bị
 * khoá tài khoản — không đánh đổi.)
 *
 * Vì vậy nguồn dữ liệu thật ở đây là OpenStreetMap qua Overpass API:
 * miễn phí, không cần khoá, không cần billing, không bị chặn ở VN, và dữ
 * liệu nhà thuốc/bệnh viện tại các thành phố lớn của VN khá đầy đủ.
 *
 * Google Places vẫn được giữ làm nguồn ƯU TIÊN nếu môi trường có sẵn khoá
 * dùng được (vd khi triển khai ở nước khác). Hỏng ở bất kỳ bước nào thì rơi
 * xuống Overpass. Không bao giờ trả về "không tìm được" chỉ vì thiếu khoá.
 *
 * ─────────────────────────────────────────────────────────────────
 * VỀ TRƯỜNG `is_open`
 *
 * Ba trạng thái, KHÔNG phải hai: true / false / null.
 * `null` = không biết giờ mở cửa. Phần lớn điểm trên OSM rơi vào đây.
 *
 * Bản trước mặc định `is_open: true` khi thiếu dữ liệu. Hậu quả thật: app
 * khẳng định "ĐANG MỞ CỬA" cho nơi nó không hề biết, bác đi 3km tới nơi thì
 * đóng. Đoán bừa theo hướng ngược lại cũng sai — bác bỏ qua một nhà thuốc
 * đang mở. Không biết thì phải nói là không biết.
 */

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

/** Khoảng cách đường chim bay giữa hai toạ độ, đơn vị km. */
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/** Nhóm `type` của client → danh sách giá trị `amenity` trong OpenStreetMap. */
function amenitiesFor(type) {
  if (type === 'pharmacy') return ['pharmacy'];
  if (type === 'hospital') return ['hospital', 'clinic', 'doctors'];
  return ['pharmacy', 'hospital', 'clinic', 'doctors'];
}

/** Ghép các tag địa chỉ rời rạc của OSM thành một dòng đọc được. */
function buildAddress(tags) {
  const parts = [
    [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' '),
    tags['addr:subdistrict'] || tags['addr:ward'],
    tags['addr:district'],
    tags['addr:city']
  ].filter(Boolean);

  return parts.length ? parts.join(', ') : 'Gần vị trí của bác';
}

/**
 * Đọc tag `opening_hours` của OSM.
 * Chỉ xử lý trường hợp chắc chắn: "24/7". Mọi cú pháp phức tạp khác trả về
 * null thay vì đoán — đoán sai giờ mở cửa của cơ sở y tế là làm hại người dùng.
 */
function parseOpenState(tags) {
  const raw = tags.opening_hours;
  if (!raw) return null;
  if (raw.trim() === '24/7') return true;
  return null;
}

async function searchOverpass({ latitude, longitude, radius, type }) {
  const amenities = amenitiesFor(type);
  const clauses = amenities
    .flatMap(a => [
      `node["amenity"="${a}"](around:${radius},${latitude},${longitude});`,
      `way["amenity"="${a}"](around:${radius},${latitude},${longitude});`
    ])
    .join('\n  ');

  const query = `[out:json][timeout:20];\n(\n  ${clauses}\n);\nout center tags 40;`;

  const response = await fetch(OVERPASS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // Bắt buộc. Overpass trả 406 cho User-Agent mặc định của Node (undici).
      // Quy ước của họ là tự định danh kèm cách liên hệ.
      'User-Agent': 'NhaMinh/1.0 (+https://ai-riser-namdosan-fa737.web.app)',
      'Accept': 'application/json'
    },
    body: new URLSearchParams({ data: query })
  });

  if (!response.ok) {
    throw new Error(`Overpass trả về HTTP ${response.status}`);
  }

  const data = await response.json();

  return (data.elements || [])
    .map(el => {
      const tags = el.tags || {};
      // Node có lat/lon trực tiếp; way trả về tâm hình học ở `center`.
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (lat == null || lon == null) return null;

      // Điểm không có tên thì vô dụng với người dùng — bỏ.
      const name = tags.name || tags['name:vi'];
      if (!name) return null;

      return {
        id: `osm_${el.type}_${el.id}`,
        name,
        address: buildAddress(tags),
        distance_km: getDistanceKm(latitude, longitude, lat, lon),
        is_open: parseOpenState(tags),
        type: tags.amenity === 'pharmacy' ? 'PHARMACY' : 'HOSPITAL',
        phone: tags.phone || tags['contact:phone'] || '',
        source: 'openstreetmap'
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, 15);
}

async function searchGooglePlaces({ latitude, longitude, radius, type, apiKey }) {
  const includedTypes = type === 'pharmacy'
    ? ['pharmacy']
    : type === 'hospital'
      ? ['hospital', 'medical_clinic']
      : ['hospital', 'pharmacy', 'medical_clinic', 'doctor'];

  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'places.displayName',
        'places.formattedAddress',
        'places.location',
        'places.currentOpeningHours.openNow',
        'places.nationalPhoneNumber',
        'places.types',
        'places.primaryType'
      ].join(',')
    },
    body: JSON.stringify({
      includedTypes,
      maxResultCount: 15,
      languageCode: 'vi',
      regionCode: 'VN',
      locationRestriction: {
        circle: { center: { latitude, longitude }, radius: Number(radius) || 5000 }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Places API trả về HTTP ${response.status}`);
  }

  const data = await response.json();

  return (data.places || [])
    .map(p => {
      const pLat = p.location?.latitude;
      const pLng = p.location?.longitude;
      const isPharmacy = p.types?.includes('pharmacy') || p.primaryType === 'pharmacy';

      return {
        id: `gg_${p.displayName?.text || Math.random().toString(36).slice(2)}`,
        name: p.displayName?.text || 'Cơ sở y tế',
        address: p.formattedAddress || 'Gần vị trí của bác',
        distance_km: (pLat != null && pLng != null)
          ? getDistanceKm(latitude, longitude, pLat, pLng)
          : null,
        // openNow vắng mặt nghĩa là không rõ, không phải là đang đóng.
        is_open: p.currentOpeningHours?.openNow ?? null,
        type: isPharmacy ? 'PHARMACY' : 'HOSPITAL',
        phone: p.nationalPhoneNumber || '',
        source: 'google_places'
      };
    })
    .sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));
}

export default async function placesRoutes(app) {
  app.post('/nearby', async (request, reply) => {
    const { latitude, longitude, radius = 5000, type = 'all' } = request.body || {};

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return reply.code(400).send({
        ok: false,
        error_code: 'INVALID_COORDINATES',
        error_message: 'Chưa lấy được vị trí của bác nên chưa tìm được nhà thuốc gần đây.'
      });
    }

    const searchRadius = Math.min(Math.max(Number(radius) || 5000, 500), 20000);
    const apiKey = config.googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY;

    // Nguồn ưu tiên: Google Places, chỉ khi môi trường thực sự có khoá dùng được.
    if (apiKey) {
      try {
        const places = await searchGooglePlaces({ latitude, longitude, radius: searchRadius, type, apiKey });
        if (places.length) {
          return { ok: true, places, source: 'google_places' };
        }
        request.log.info('Places API không trả kết quả, chuyển sang OpenStreetMap');
      } catch (err) {
        // Ở VN đây là đường đi bình thường, không phải sự cố. Log info, không log error.
        request.log.info({ err: err.message }, 'Places API không dùng được, chuyển sang OpenStreetMap');
      }
    }

    try {
      const places = await searchOverpass({ latitude, longitude, radius: searchRadius, type });

      if (!places.length) {
        return {
          ok: true,
          places: [],
          source: 'openstreetmap',
          notice: 'Chưa tìm thấy cơ sở y tế nào trong bán kính 5km quanh chỗ bác.'
        };
      }

      return { ok: true, places, source: 'openstreetmap' };
    } catch (err) {
      request.log.error({ err: err.message }, 'Overpass API lỗi');
      return reply.code(502).send({
        ok: false,
        error_code: 'PLACES_LOOKUP_FAILED',
        error_message: 'Chưa tìm được nhà thuốc gần đây. Bác thử lại sau một chút nhé.'
      });
    }
  });
}
