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
      enum: ['ORDER_UPDATE', 'PROMOTION', 'SYSTEM', 'ARTICLE_UPDATE', 'ARTICLE_APPROVED', 'ARTICLE_COMMENT', 'ARTICLE_LIKE', 'STORY_UPDATE', 'STORY_APPROVED', 'STORY_REJECTED'],
      default: 'SYSTEM'
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order' // Tham chiếu đến đơn hàng liên quan (nếu có)
    },
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article' // Tham chiếu đến bài viết liên quan (nếu có)
    },
    storyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story' // Tham chiếu đến Story liên quan (nếu có)
    },
    link: {
      type: String // Đường dẫn chuyển hướng khi click vào thông báo
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