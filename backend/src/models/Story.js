const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    title: { type: String, required: true },
    caption: { type: String, default: '' },
    image: { type: String, required: true }, // URL trên Cloudinary
    imagePublicId: { type: String, default: '' }, // Public ID trên Cloudinary để xóa khi cần
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    author: { type: String, default: 'Thành viên DualeoFood' },
    avatar: { type: String, default: '' },
    btnText: { type: String, default: '' }, // Nút hành động (chỉ Admin/Nhân viên quản lý)
    link: { type: String, default: '' }, // Đường dẫn liên kết (chỉ Admin/Nhân viên quản lý)
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    isPublished: { type: Boolean, default: true },
    isPinned: { type: Boolean, default: false },
    viewsCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Story', storySchema);
