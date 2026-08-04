const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Bỏ required để hỗ trợ Google Login (không có password)
    googleId: { type: String }, // Lưu ID của Google (tùy chọn)
    avatar: { type: String }, // Đường dẫn ảnh đại diện


    // === HỆ THỐNG PHÂN QUYỀN 3 CẤP (RBAC) ===
    role: { 
        type: String, 
        enum: ['customer', 'staff', 'admin'], // Thêm vai trò 'staff' (Nhân viên)
        default: 'customer' 
    },

    // Trạng thái hoạt động: Admin có thể vô hiệu hóa tài khoản Staff
    isActive: { type: Boolean, default: true },

    // Ngày được bổ nhiệm làm nhân viên (chỉ có ý nghĩa với role 'staff')
    hiredAt: { type: Date, default: null },
    
    // === CÁC TRƯỜNG THÊM VÀO ĐỂ LÀM XÁC THỰC OTP ===
    isVerified: { type: Boolean, default: false }, // Đánh dấu tài khoản đã xác thực chưa
    otp: { type: String },                         // Lưu mã OTP 6 số
    otpExpires: { type: Date },                     // Thời gian hết hạn của mã OTP

    // Mảng chứa các địa chỉ đã lưu của người dùng
    addresses: [
      {
        label: { type: String }, // Tên gợi nhớ cho địa chỉ, VD: "Nhà", "Công ty"
        name: { type: String, required: true }, // Tên người nhận
        phone: { type: String, required: true }, // Số điện thoại liên hệ
        street: { type: String, required: true }, // Địa chỉ cụ thể
        isDefault: { type: Boolean, default: false } // Địa chỉ mặc định
      }
    ]
}, { timestamps: true }); // Tự động thêm createdAt và updatedAt

module.exports = mongoose.model('User', userSchema);