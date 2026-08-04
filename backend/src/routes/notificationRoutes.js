const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead, broadcastNotification } = require('../controllers/notificationController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware'); // Middleware chặn người chưa đăng nhập

// Lấy danh sách thông báo
router.route('/').get(verifyToken, getNotifications);

// Đánh dấu tất cả đã đọc (Phải đặt trên route /:id/read để tránh bị nhầm ID)
router.route('/read-all').put(verifyToken, markAllAsRead);

// [ADMIN] Gửi thông báo hàng loạt
router.route('/broadcast').post(verifyToken, isAdmin, broadcastNotification);

// Đánh dấu 1 cái đã đọc
router.route('/:id/read').put(verifyToken, markAsRead);

module.exports = router;