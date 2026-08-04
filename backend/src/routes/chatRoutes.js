const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Lấy lịch sử chat (Public access vì có thể tra cứu qua guestId)
router.get('/history', chatController.getChatHistory);

// === ROUTES DÀNH CHO ADMIN + STAFF ===
router.get('/', verifyToken, authorizeRoles('admin', 'staff'), chatController.getAllConversations);
router.get('/:id', verifyToken, authorizeRoles('admin', 'staff'), chatController.getConversationById);
router.put('/:id/read', verifyToken, authorizeRoles('admin', 'staff'), chatController.markConversationAsRead);

module.exports = router;
