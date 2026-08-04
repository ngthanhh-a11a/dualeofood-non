const express = require('express');
const router = express.Router();
const {
    createOrder,
    getMyOrders,
    getAllOrders,
    getDashboardStats,
    updateOrderStatus,
    cancelMyOrder, 
    getPendingOrdersCount,
    confirmOrderPayment,
    getOrdersByUserId
} = require('../controllers/orderController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// === ROUTES DÀNH CHO KHÁCH HÀNG (Customer) ===

// Khách hàng cần đăng nhập (verifyToken) mới được tạo đơn
router.post('/', verifyToken, createOrder);

// Khách hàng xem danh sách đơn hàng của mình
router.get('/my-orders', verifyToken, getMyOrders);

// Khách hàng tự hủy đơn (chỉ khi đơn đang PENDING)
router.put('/my-orders/:id/cancel', verifyToken, cancelMyOrder);

// === ROUTES DÀNH CHO ADMIN + STAFF ===

// Admin & Staff: Xem toàn bộ danh sách đơn hàng
router.get('/', verifyToken, authorizeRoles('admin', 'staff'), getAllOrders);

// Admin & Staff: Lấy danh sách đơn hàng của một người dùng cụ thể
router.get('/user/:userId', verifyToken, authorizeRoles('admin', 'staff'), getOrdersByUserId);

// Admin & Staff: Đếm số lượng đơn hàng đang chờ duyệt
router.get('/count/pending', verifyToken, authorizeRoles('admin', 'staff'), getPendingOrdersCount);

// Admin & Staff: Cập nhật trạng thái đơn hàng
// (Logic giới hạn trạng thái cho Staff nằm trong Controller)
router.put('/:id/status', verifyToken, authorizeRoles('admin', 'staff'), updateOrderStatus);

// Admin & Staff: Xác nhận thanh toán cho đơn hàng QR_CODE
router.put('/:id/confirm-payment', verifyToken, authorizeRoles('admin', 'staff'), confirmOrderPayment);

// === ROUTES CHỈ DÀNH CHO ADMIN ===

// Chỉ Admin: Xem thống kê Dashboard doanh thu
router.get('/stats/dashboard', verifyToken, authorizeRoles('admin'), getDashboardStats);

module.exports = router;