import axios from 'axios';

// URL gốc của server (DÙNG CHO VIỆC HIỂN THỊ HÌNH ẢNH)
export const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const instance = axios.create({
    baseURL: `${SERVER_URL}/api`, // Đường dẫn gọi về Backend
});

// Tự động đính kèm Token đăng nhập vào mỗi request (dùng cho các chức năng của Admin sau này)
instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Hàm tiện ích để lấy đường dẫn ảnh chính xác & tự động nâng cấp độ sắc nét cao nhất
export const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    // Nếu ảnh đã là URL từ Cloudinary hoặc bên ngoài (bắt đầu bằng http hoặc https)
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        // Tự động nâng cấp ảnh Cloudinary lên độ nét tối đa (q_auto:best), hỗ trợ màn hình Retina (dpr_auto), định dạng webp (f_auto)
        if (imagePath.includes('/image/upload/') && !imagePath.includes('/image/upload/q_')) {
            return imagePath.replace('/image/upload/', '/image/upload/q_auto:best,f_auto,dpr_auto/');
        }
        return imagePath;
    }
    // Nếu là ảnh nội bộ cục bộ
    return `${SERVER_URL}${imagePath}`;
};

// Giữ nguyên URL video gốc với độ phân giải và bitrate cao nhất, ngăn Cloudinary q_auto nén giảm chất lượng gây mờ trên màn hình máy tính lớn
export const getOptimizedVideoUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    return url;
};

// Lấy ảnh Poster đại diện (frame đầu tiên tại giây thứ 0) từ video Cloudinary với độ sắc nét tối đa
export const getVideoPosterUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    if (url.includes('/video/upload/')) {
        const transformed = url.includes('/video/upload/q_')
            ? url.replace('/video/upload/', '/video/upload/so_0,')
            : url.replace('/video/upload/', '/video/upload/so_0,q_auto:best,f_auto,dpr_auto,w_1920,c_limit/');
        // Đổi phần mở rộng video sang .jpg để Cloudinary trả về ảnh tĩnh frame đầu tiên sắc nét
        return transformed.replace(/\.(mp4|webm|mov|mkv|avi|m4v)$/i, '.jpg');
    }
    return '';
};

// Tối ưu hóa hình ảnh Cloudinary (độ nét tối đa q_auto:best, mật độ điểm ảnh Retina dpr_auto, webp/avif f_auto)
export const getOptimizedImageUrl = (url, width = 1920) => {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('/image/upload/') && !url.includes('/image/upload/q_')) {
        return url.replace('/image/upload/', `/image/upload/q_auto:best,f_auto,dpr_auto,w_${width},c_limit/`);
    }
    return url;
};

export default instance;