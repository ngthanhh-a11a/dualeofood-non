const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    image: { type: String, required: true }, // Đường dẫn ảnh trên Cloudinary
    linkUrl: { type: String, default: '' }, // Link điều hướng khi bấm vào
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    order: { type: Number, default: 0 } // Số càng nhỏ hiện càng trước
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
