const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Dành cho khách hàng kiểm tra mã
router.post('/verify', couponController.verifyCoupon);

// Các API dành cho Admin quản lý mã giảm giá
router.post('/', verifyToken, isAdmin, couponController.createCoupon);
router.get('/', couponController.getAllCoupons); // Sửa ở đây: Gỡ bỏ middleware để API này trở thành public
router.get('/:id', verifyToken, isAdmin, couponController.getCouponById); // Lấy chi tiết để sửa
router.put('/:id', verifyToken, isAdmin, couponController.updateCoupon);
router.delete('/:id', verifyToken, isAdmin, couponController.deleteCoupon);

module.exports = router;