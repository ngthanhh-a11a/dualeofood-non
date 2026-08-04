 const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User' // Tham chiếu đến người nhận thông báo
    },
    title: { 
      type: String, 
      required: true 
    },
    content: { 
      type: String, 
      required: true 
    },
    type: {
      type: String,
      required: true,
      enum: ['ORDER_UPDATE', 'PROMOTION', 'SYSTEM'], // Chỉ cho phép 3 loại thông báo này
      default: 'SYSTEM'
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order' // Tham chiếu đến đơn hàng liên quan (nếu có)
    },
    isRead: { 
      type: Boolean, 
      default: false // Mặc định khi mới tạo là chưa đọc (chấm đỏ)
    }
  },
  { 
    timestamps: true // Tự động tạo createdAt để hiển thị thời gian (VD: 5 phút trước)
  }
);

module.exports = mongoose.model('Notification', notificationSchema);