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

// Hàm tiện ích để lấy đường dẫn ảnh chính xác
export const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    // Nếu ảnh đã là URL từ Cloudinary hoặc bên ngoài (bắt đầu bằng http hoặc https)
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    // Nếu là ảnh nội bộ cục bộ
    return `${SERVER_URL}${imagePath}`;
};

export default instance;