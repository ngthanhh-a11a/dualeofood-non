const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  broadcastNotification,
  deleteNotification,
  clearReadNotifications 
} = require('../controllers/notificationController');
const { verifyToken, isAdmin, authorizeRoles } = require('../middleware/authMiddleware'); // Middleware chặn người chưa đăng nhập
const { getAdminPendingCounts } = require('../utils/adminRealtime');

// [ADMIN/STAFF] Lấy số lượng việc cần xử lý thời gian thực
router.get('/admin-pending-counts', verifyToken, authorizeRoles('admin', 'staff'), async (req, res) => {
  const counts = await getAdminPendingCounts();
  res.json(counts);
});

// Lấy danh sách thông báo
router.route('/').get(verifyToken, getNotifications);

// Đánh dấu tất cả đã đọc (Phải đặt trên route /:id/read để tránh bị nhầm ID)
router.route('/read-all').put(verifyToken, markAllAsRead);

// Dọn dẹp các thông báo đã đọc
router.route('/clear-read').delete(verifyToken, clearReadNotifications);

// [ADMIN] Gửi thông báo hàng loạt
router.route('/broadcast').post(verifyToken, isAdmin, broadcastNotification);

// Đánh dấu 1 cái đã đọc
router.route('/:id/read').put(verifyToken, markAsRead);

// Xóa 1 thông báo
router.route('/:id').delete(verifyToken, deleteNotification);

module.exports = router;