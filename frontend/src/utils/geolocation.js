/**
 * Tiện ích định vị GPS và Reverse Geocoding qua OpenStreetMap Nominatim
 */

/**
 * Lấy tọa độ GPS hiện tại từ trình duyệt
 * @returns {Promise<{lat: number, lng: number}>}
 */
export const getCurrentCoordinates = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error('Trình duyệt của bạn không hỗ trợ định vị GPS.'));
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
            },
            (error) => {
                let msg = 'Không thể lấy vị trí hiện tại.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        msg = 'Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép quyền định vị trong cài đặt trình duyệt.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        msg = 'Thông tin vị trí hiện không khả dụng. Vui lòng bật GPS trên thiết bị.';
                        break;
                    case error.TIMEOUT:
                        msg = 'Quá thời gian xác định vị trí. Vui lòng thử lại.';
                        break;
                    default:
                        break;
                }
                reject(new Error(msg));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000
            }
        );
    });
};

/**
 * Đổi Tọa độ (lat, lng) thành Địa chỉ chữ qua OpenStreetMap Nominatim API
 * @param {number} lat - Vĩ độ
 * @param {number} lng - Kinh độ
 * @returns {Promise<string>} Địa chỉ định dạng tiếng Việt
 */
export const reverseGeocodeOSM = async (lat, lng) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi`,
            {
                headers: {
                    'User-Agent': 'DualeoFood-App/1.0'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Không thể kết nối đến máy chủ bản đồ.');
        }

        const data = await response.json();
        if (!data || !data.address) {
            return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }

        const addr = data.address;
        // Ghép các thành phần địa chỉ theo thứ tự chuẩn Việt Nam: Số nhà/Đường, Phường/Xã, Quận/Huyện, Tỉnh/TP
        const road = addr.road || addr.street || addr.pedestrian || addr.footway || '';
        const houseNumber = addr.house_number || '';
        const streetPart = houseNumber && road ? `${houseNumber} ${road}` : (road || houseNumber || '');

        const ward = addr.suburb || addr.quarter || addr.neighbourhood || addr.village || '';
        const district = addr.city_district || addr.district || addr.county || addr.town || '';
        const city = addr.city || addr.state || addr.province || '';

        const parts = [streetPart, ward, district, city].filter(Boolean);

        if (parts.length >= 2) {
            return parts.join(', ');
        }

        return data.display_name;
    } catch (error) {
        console.error('Lỗi Reverse Geocoding:', error);
        // Fallback hiển thị tọa độ nếu không thể giải mã
        return `Vị trí GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
    }
};

/**
 * Tạo link Google Maps dẫn đường hoặc xem vị trí
 */
export const getGoogleMapsUrl = (lat, lng) => {
    if (!lat || !lng) return '';
    return `https://www.google.com/maps?q=${lat},${lng}`;
};

/**
 * Tính khoảng cách đường chim bay giữa 2 tọa độ GPS (Công thức Haversine)
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Khoảng cách tính bằng km (làm tròn 1 chữ số thập phân)
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10;
};

/**
 * Tính cự ly di chuyển thực tế theo đường bộ và thời gian qua OpenStreetMap OSRM API
 * @param {number} lat1 - Vĩ độ điểm đi (Quán)
 * @param {number} lon1 - Kinh độ điểm đi (Quán)
 * @param {number} lat2 - Vĩ độ điểm đến (Khách)
 * @param {number} lon2 - Kinh độ điểm đến (Khách)
 * @returns {Promise<{distanceKm: number, durationMinutes: number, isRoadRoute: boolean}>}
 */
export const calculateRouteDistanceOSRM = async (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) {
        return { distanceKm: 0, durationMinutes: 0, isRoadRoute: false };
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 giây timeout

        // OSRM nhận kinh độ (lon) trước, vĩ độ (lat) sau
        const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data.code === 'Ok' && Array.isArray(data.routes) && data.routes.length > 0) {
                const route = data.routes[0];
                const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
                const durationMinutes = Math.max(5, Math.round(route.duration / 60));
                return {
                    distanceKm,
                    durationMinutes,
                    isRoadRoute: true
                };
            }
        }
    } catch (e) {
        console.warn('OSRM router không phản hồi, chuyển sang dự phòng Haversine:', e.message);
    }

    // Dự phòng: Đường chim bay nhân hệ số uốn lượn đô thị 1.25
    const straightKm = calculateHaversineDistance(lat1, lon1, lat2, lon2);
    const estimatedRoadKm = Math.round(straightKm * 1.25 * 10) / 10;
    const estimatedMinutes = Math.max(10, Math.round((estimatedRoadKm / 25) * 60)); // Vận tốc trung bình 25km/h

    return {
        distanceKm: estimatedRoadKm,
        durationMinutes: estimatedMinutes,
        isRoadRoute: false
    };
};

/**
 * Tính cước phí ship theo số km và bảng giá của quán
 * @param {number} distanceKm 
 * @param {object} config 
 * @returns {{fee: number, isOutOfRange: boolean, distanceKm: number, isFreeShipping: boolean}}
 */
export const calculateShippingFee = (distanceKm, config = {}) => {
    const baseDistance = Number(config.baseDistanceKm ?? 3);
    const baseFee = Number(config.baseFee ?? 0);
    const pricePerKm = Number(config.pricePerKm ?? 5000);
    const startFeeAfterBase = Number(config.startFeeAfterBase ?? (baseFee > 0 ? baseFee : 10000));
    const maxDistance = Number(config.maxDistanceKm ?? 25);

    const km = Number(distanceKm);
    if (!km || km <= 0 || isNaN(km)) {
        return { fee: 0, isOutOfRange: false, distanceKm: 0, isFreeShipping: baseFee === 0 };
    }

    const isOutOfRange = km > maxDistance;

    // 1. Trường hợp trong cự ly cơ sở (Ví dụ <= 3km)
    if (km <= baseDistance) {
        return { 
            fee: baseFee, // Nếu baseFee = 0 -> Miễn phí giao hàng (0đ)
            isOutOfRange, 
            distanceKm: km,
            isFreeShipping: baseFee === 0
        };
    }

    // 2. Trường hợp vượt cự ly cơ sở (Ví dụ > 3km)
    const extraKmTotal = km - baseDistance;
    let rawFee = 0;

    if (baseFee === 0) {
        // Trường hợp đặc biệt: Trong cự ly cơ sở miễn phí (0đ).
        // Khi vượt cự ly: km đầu tiên vượt mức tính cước khởi điểm (startFeeAfterBase), mỗi km sau đó cộng thêm pricePerKm
        if (extraKmTotal <= 1) {
            rawFee = startFeeAfterBase;
        } else {
            rawFee = startFeeAfterBase + (extraKmTotal - 1) * pricePerKm;
        }
    } else {
        // Trường hợp thông thường: Cước cơ sở + km phụ trội * đơn giá mỗi km
        rawFee = baseFee + extraKmTotal * pricePerKm;
    }

    // Làm tròn đến hàng nghìn đồng
    const roundedFee = Math.round(rawFee / 1000) * 1000;

    return {
        fee: Math.max(0, roundedFee),
        isOutOfRange,
        distanceKm: km,
        isFreeShipping: false
    };
};
