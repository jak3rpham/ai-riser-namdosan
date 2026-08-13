import { config } from '../lib/config.js';

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

export default async function placesRoutes(app) {
  app.post('/nearby', async (request, reply) => {
    const { latitude, longitude, radius = 5000, type = 'all' } = request.body || {};

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return reply.code(400).send({
        ok: false,
        error_code: 'INVALID_COORDINATES',
        error_message: 'Tọa độ vị trí (latitude, longitude) không hợp lệ.'
      });
    }

    const apiKey = config.googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return reply.code(503).send({
        ok: false,
        error_code: 'NO_MAPS_KEY',
        error_message: 'Chưa cấu hình GOOGLE_MAPS_API_KEY trên máy chủ.'
      });
    }

    try {
      // Gọi Google Places API (New) - searchNearby
      const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.currentOpeningHours,places.nationalPhoneNumber,places.types,places.primaryType'
        },
        body: JSON.stringify({
          includedTypes: type === 'pharmacy' ? ['pharmacy'] : type === 'hospital' ? ['hospital', 'medical_clinic'] : ['hospital', 'pharmacy', 'medical_clinic', 'doctor'],
          maxResultCount: 15,
          locationRestriction: {
            circle: {
              center: { latitude, longitude },
              radius: Number(radius) || 5000.0
            }
          }
        })
      });

      if (!response.ok) {
        // Fallback sang legacy Nearby Search API nếu New API chưa bật
        const legacyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type === 'pharmacy' ? 'pharmacy' : 'hospital'}&key=${apiKey}`;
        const legacyRes = await fetch(legacyUrl);
        const legacyData = await legacyRes.json();

        if (legacyData.status === 'OK' && Array.isArray(legacyData.results)) {
          const places = legacyData.results.map(p => {
            const dist = getDistanceKm(latitude, longitude, p.geometry.location.lat, p.geometry.location.lng);
            return {
              id: p.place_id,
              name: p.name,
              address: p.vicinity,
              distance_km: dist,
              is_open: p.opening_hours?.open_now ?? true,
              type: p.types?.includes('pharmacy') ? 'PHARMACY' : 'HOSPITAL',
              phone: ''
            };
          }).sort((a, b) => a.distance_km - b.distance_km);

          return { ok: true, places };
        }

        const errText = await response.text();
        return reply.code(502).send({
          ok: false,
          error_code: 'PLACES_API_ERROR',
          error_message: 'Không truy vấn được Google Places API. Vui lòng kiểm tra quyền API Key.',
          detail: errText
        });
      }

      const data = await response.json();
      const placesList = (data.places || []).map(p => {
        const pLat = p.location?.latitude;
        const pLng = p.location?.longitude;
        const dist = (pLat && pLng) ? getDistanceKm(latitude, longitude, pLat, pLng) : 0;
        const isPharmacy = p.types?.includes('pharmacy') || p.primaryType === 'pharmacy';

        return {
          id: p.displayName?.text || `place_${Math.random()}`,
          name: p.displayName?.text || 'Cơ sở y tế',
          address: p.formattedAddress || 'Gần vị trí của bạn',
          distance_km: dist,
          is_open: p.currentOpeningHours?.openNow ?? true,
          type: isPharmacy ? 'PHARMACY' : 'HOSPITAL',
          phone: p.nationalPhoneNumber || ''
        };
      }).sort((a, b) => a.distance_km - b.distance_km);

      return { ok: true, places: placesList };
    } catch (err) {
      return reply.code(500).send({
        ok: false,
        error_code: 'SERVER_ERROR',
        error_message: 'Lỗi máy chủ khi kết nối Places API.',
        detail: err.message
      });
    }
  });
}
