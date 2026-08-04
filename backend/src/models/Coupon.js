const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    discountPercent: { type: Number, required: true }, // Ví dụ: 10 (tức là 10%)
    maxDiscountAmount: { type: Number, required: true }, // Giảm tối đa bao nhiêu tiền
    minOrderValue: { type: Number, required: true }, // Đơn tối thiểu để áp dụng
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    
    // THÊM 2 TRƯỜNG NÀY:
    usageLimit: {
        type: Number,
        default: null // null nghĩa là không giới hạn (Vô hạn)
    },
    usageCount: {
        type: Number,
        default: 0 // Ban đầu tạo ra thì chưa ai dùng, số lượng = 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);