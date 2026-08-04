const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false } // Đánh dấu đã xem hay chưa
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);