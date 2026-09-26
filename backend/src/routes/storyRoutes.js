const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Cấu hình Multer lưu ảnh vào thư mục dualeofood_stories trên Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'dualeofood_stories',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        public_id: (req, file) => `story-${Date.now()}`
    }
});
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn 5MB
});

// Middleware lấy user tùy chọn (cho phép khách vãng lai hoặc đã đăng nhập)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
        verifyToken(req, res, next);
    } else {
        next();
    }
};

const adminOrStaff = authorizeRoles('admin', 'staff');

// Routes công khai & Tạo Story
router.route('/')
    .get(optionalAuth, storyController.getStories)
    .post(verifyToken, upload.single('image'), storyController.createStory);

// Lấy Story của chính người dùng đăng nhập
router.get('/my-stories', verifyToken, storyController.getMyStories);

// Admin lấy danh sách toàn bộ Story để kiểm duyệt
router.get('/admin/all', verifyToken, adminOrStaff, storyController.getAllStoriesAdmin);

// Các thao tác kiểm duyệt của Admin (Duyệt, Ẩn/Hiện, Ghim)
router.put('/:id/status', verifyToken, adminOrStaff, storyController.updateStoryStatus);
router.put('/:id/publish', verifyToken, adminOrStaff, storyController.togglePublishStory);
router.put('/:id/pin', verifyToken, adminOrStaff, storyController.togglePinStory);

// Chỉnh sửa & Xóa Story
router.route('/:id')
    .put(verifyToken, adminOrStaff, upload.single('image'), storyController.updateStory)
    .delete(verifyToken, storyController.deleteStory);

module.exports = router;
