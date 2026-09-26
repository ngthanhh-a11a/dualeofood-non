const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: { type: String, default: 'Banner' },
    subtitle: { type: String, default: '' }, // Phụ đề phía trên (ví dụ: GỢI Ý QUÀ TẶNG)
    buttonText: { type: String, default: 'Khám phá thêm' }, // Chữ trên nút/link
    posX: { type: Number, default: 50 }, // Tọa độ X (0 - 100%)
    posY: { type: Number, default: 50 }, // Tọa độ Y (0 - 100%)
    textAlign: { type: String, enum: ['left', 'center', 'right'], default: 'center' }, // Căn lề chữ
    image: { type: String, required: true }, // Đường dẫn ảnh hoặc video trên Cloudinary
    linkUrl: { type: String, default: '' }, // Link điều hướng khi bấm vào
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' }, // Phân loại ảnh hay video
    showContent: { type: Boolean, default: true }, // Ẩn hoặc hiện tiêu đề và nút giữa banner
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    order: { type: Number, default: 0 } // Số càng nhỏ hiện càng trước
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
