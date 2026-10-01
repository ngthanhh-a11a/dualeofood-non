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
