const mongoose = require('mongoose');

// Schema lưu vết mọi thao tác của Staff & Admin lên hệ thống (Audit Trail)
const activityLogSchema = new mongoose.Schema({
    // Ai thực hiện hành động?
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // Hành động gì?
    action: { 
        type: String, 
        required: true,
        enum: [
            // Thao tác Staff + Admin đều có
            'UPDATE_ORDER_STATUS',
            'CONFIRM_PAYMENT',
            'READ_MESSAGE',
            // Thao tác chỉ Admin mới có
            'DELETE_MESSAGE',
            'CREATE_PRODUCT',
            'UPDATE_PRODUCT',
            'DELETE_PRODUCT',
            'CREATE_CATEGORY',
            'UPDATE_CATEGORY',
            'DELETE_CATEGORY',
            'CREATE_COUPON',
            'UPDATE_COUPON',
            'DELETE_COUPON',
            'DELETE_USER',
            'UPDATE_USER_ROLE',
            'UPDATE_SETTINGS',
            'BROADCAST_NOTIFICATION',
            'UPDATE_AVATAR',
            'UPDATE_PROFILE',
            'CREATE_BANNER',
            'UPDATE_BANNER',
            'DELETE_BANNER',
            'CREATE_ARTICLE',
            'UPDATE_ARTICLE',
            'DELETE_ARTICLE'
        ]
    },
    // Mô tả chi tiết hành động (dạng text đọc được)
    description: { type: String, required: true },
    // Tham chiếu đến đối tượng bị tác động
    targetModel: { 
        type: String, 
        enum: ['Order', 'Product', 'User', 'Coupon', 'Message', 'Setting', 'Notification', 'Category', 'Banner', 'Article'] 
    },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    // Dữ liệu bổ sung (VD: trạng thái cũ/mới) để phục vụ truy vết
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { 
    timestamps: true // createdAt = thời điểm thao tác được thực hiện
});

// Index tối ưu truy vấn: lọc theo user hoặc action, sắp xếp theo thời gian
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
