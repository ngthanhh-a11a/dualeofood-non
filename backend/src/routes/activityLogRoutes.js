const express = require('express');
const router = express.Router();
const { getActivityLogs, getActivityStats } = require('../controllers/activityLogController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Tất cả route trong file này chỉ Admin mới truy cập được
router.use(verifyToken, authorizeRoles('admin'));

// Lấy danh sách nhật ký hoạt động (có phân trang, lọc theo user/action)
router.get('/', getActivityLogs);

// Lấy thống kê hoạt động của Staff (số thao tác theo ngày)
router.get('/stats', getActivityStats);

module.exports = router;
