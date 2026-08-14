const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Các route công khai (Public)
router.get('/public', settingController.getPublicSettings);

// Tất cả các route bên dưới yêu cầu đăng nhập và là admin
router.use(verifyToken, isAdmin);

router.get('/orders', settingController.getOrderSettings);
router.put('/orders', settingController.updateOrderSettings);

router.get('/general', settingController.getGeneralSettings);
router.put('/general', settingController.updateGeneralSettings);

module.exports = router;