const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    // Dùng key để lưu các loại cài đặt khác nhau, ví dụ: 'orderSettings', 'siteInfo'
    key: {
        type: String,
        required: true,
        unique: true,
    },
    value: mongoose.Schema.Types.Mixed, // Lưu một object cài đặt bất kỳ
});

module.exports = mongoose.model('Setting', settingSchema);