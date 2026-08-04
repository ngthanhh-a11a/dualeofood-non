const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    sender: { 
        type: String, 
        enum: ['customer', 'support', 'ai'], 
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    }
});

const chatConversationSchema = new mongoose.Schema({
    // Nếu khách hàng vãng lai, dùng guestId. Nếu đã đăng nhập, dùng userId.
    guestId: { 
        type: String, 
        default: null 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        default: null 
    },
    customerName: { 
        type: String, 
        default: 'Khách hàng' 
    },
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    },
    messages: [chatMessageSchema],
    hasUnreadAdmin: { // Đánh dấu có tin nhắn admin chưa đọc không
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
