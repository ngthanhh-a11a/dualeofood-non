const mongoose = require('mongoose');

const userVoucherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Khóa ngoại tham chiếu đến bảng Khách hàng
      required: true
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon', // Khóa ngoại tham chiếu đến bảng Mã giảm giá gốc (Hãy đảm bảo tên ref khớp với tên Model hiện tại của bạn)
      required: true
    },
    isUsed: {
      type: Boolean,
      default: false // Khi khách mới bấm "Lưu mã", trạng thái mặc định là chưa dùng
    },
    usedAt: {
      type: Date,
      default: null // Cột này rất quan trọng để audit (truy vết) xem khách xài mã lúc nào
    }
  },
  {
    timestamps: true // Tự động sinh ra trường createdAt để biết khách lưu mã vào ví lúc mấy giờ
  }
);

// Tối ưu hóa Database (Database Indexing): 
// Đảm bảo một user chỉ có thể lưu một mã giảm giá cụ thể TỐI ĐA 1 LẦN.
// Tránh lỗi spam click khiến 1 mã lưu thành 10 bản ghi trong ví.
userVoucherSchema.index({ user: 1, coupon: 1 }, { unique: true });

module.exports = mongoose.model('UserVoucher', userVoucherSchema);