const asyncHandler = require('express-async-handler');
const UserVoucher = require('../models/UserVoucher');
const Coupon = require('../models/Coupon'); // Đảm bảo bạn import đúng tên Model bảng mã giảm giá gốc của bạn

// [POST] 1. Khách hàng bấm Lưu mã giảm giá
const saveVoucher = asyncHandler(async (req, res) => {
  const { couponId } = req.body;
  const userId = req.user.id; // Lấy từ middleware xác thực

  // (Tùy chọn) Kiểm tra xem mã giảm giá gốc có thực sự tồn tại không
  const coupon = await Coupon.findById(couponId);
  if (!coupon) {
    return res.status(404).json({ message: 'Mã giảm giá không tồn tại hoặc đã bị xóa!' });
  }

  // Tạo bản ghi lưu vào ví
  const newVoucher = await UserVoucher.create({
    user: userId,
    coupon: couponId
  });

  res.status(201).json({ 
      message: 'Lưu mã thành công! Bạn có thể xem trong Ví Voucher.',
      data: newVoucher 
  });
});

// [GET] 2. Lấy danh sách toàn bộ mã đang có trong ví của User
const getMyVouchers = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Lấy danh sách ví, dùng .populate() để kéo toàn bộ thông tin mã giảm giá từ bảng Coupon sang
  const myVouchers = await UserVoucher.find({ user: userId })
    .populate('coupon') 
    .sort({ createdAt: -1 }); // Mã mới lưu sẽ hiển thị lên đầu

  res.status(200).json(myVouchers);
});

module.exports = { saveVoucher, getMyVouchers };