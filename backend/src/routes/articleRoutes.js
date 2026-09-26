const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Cấu hình Multer để đẩy file trực tiếp lên đám mây Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'dualeofood_articles',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        public_id: (req, file) => `article-${Date.now()}`
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
    .get(optionalAuth, articleController.getArticles)
    .post(verifyToken, upload.single('thumbnail'), articleController.createArticle);

router.get('/comments/all', verifyToken, adminOrStaff, articleController.getAllArticleComments);
router.get('/my-articles', verifyToken, articleController.getMyArticles);

router.route('/:slug').get(articleController.getArticleBySlug);
router.route('/id/:id').get(verifyToken, adminOrStaff, articleController.getArticleById);

router.route('/:id/comments').post(verifyToken, articleController.addComment);
router.route('/:id/comments/:commentId/visibility').put(verifyToken, adminOrStaff, articleController.toggleCommentVisibility);
router.route('/:id/comments/:commentId/pin').put(verifyToken, adminOrStaff, articleController.toggleArticleCommentPin);
router.route('/:id/clap').post(verifyToken, articleController.addClap);
router.route('/:id/unclap').post(verifyToken, articleController.removeClap);

router.route('/:id')
    .put(verifyToken, adminOnly, upload.single('thumbnail'), articleController.updateArticle)
    .delete(verifyToken, articleController.deleteArticle);

module.exports = router;
