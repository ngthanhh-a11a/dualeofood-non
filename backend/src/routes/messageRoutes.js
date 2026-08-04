const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Route cho khách hàng gửi tin nhắn (công khai, không cần đăng nhập)
router.post('/', messageController.createMessage);

// === ROUTES DÀNH CHO ADMIN + STAFF ===

// Admin & Staff: Xem danh sách tin nhắn khách gửi
router.get('/', verifyToken, authorizeRoles('admin', 'staff'), messageController.getMessages);

// Admin & Staff: Đánh dấu đã đọc/chưa đọc tin nhắn
router.put('/:id/read', verifyToken, authorizeRoles('admin', 'staff'), messageController.toggleReadStatus);

// === ROUTES CHỈ DÀNH CHO ADMIN ===

// Chỉ Admin: Xóa tin nhắn (Staff không được xóa dữ liệu)
router.delete('/:id', verifyToken, authorizeRoles('admin'), messageController.deleteMessage);

module.exports = router;