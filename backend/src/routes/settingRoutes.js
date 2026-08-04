const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Tất cả các route trong file này đều yêu cầu đăng nhập và là admin
router.use(verifyToken, isAdmin);

router.get('/orders', settingController.getOrderSettings);
router.put('/orders', settingController.updateOrderSettings);

module.exports = router;