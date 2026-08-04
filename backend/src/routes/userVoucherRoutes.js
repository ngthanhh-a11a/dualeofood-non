const express = require('express');
const router = express.Router();
const { saveVoucher, getMyVouchers } = require('../controllers/userVoucherController');
const { verifyToken } = require('../middleware/authMiddleware'); // Bắt buộc phải đăng nhập mới được thao tác

// Gọi API lấy danh sách ví (GET /api/vouchers/my-vouchers)
router.route('/my-vouchers').get(verifyToken, getMyVouchers);

// Gọi API lưu mã vào ví (POST /api/vouchers/save)
router.route('/save').post(verifyToken, saveVoucher);

module.exports = router;