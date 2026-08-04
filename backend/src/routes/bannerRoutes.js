const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Cấu hình Multer để đẩy file trực tiếp lên đám mây Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'dualeofood_banners',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        public_id: (req, file) => `banner-${Date.now()}`
    }
});
const upload = multer({ storage });

// Middleware lấy user tuỳ chọn
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
        verifyToken(req, res, next);
    } else {
        next();
    }
};

const adminOrStaff = authorizeRoles('admin', 'staff');
const adminOnly = authorizeRoles('admin');

router.route('/')
    .get(optionalAuth, bannerController.getBanners)
    .post(verifyToken, adminOrStaff, upload.single('image'), bannerController.createBanner);

router.route('/:id')
    .put(verifyToken, adminOnly, upload.single('image'), bannerController.updateBanner)
    .delete(verifyToken, adminOnly, bannerController.deleteBanner);

module.exports = router;
