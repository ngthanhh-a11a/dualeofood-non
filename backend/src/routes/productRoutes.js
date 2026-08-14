const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, isAdmin, authorizeRoles } = require('../middleware/authMiddleware');
const adminOrStaff = authorizeRoles('admin', 'staff');
const multer = require('multer');

const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Cấu hình Multer để đẩy file trực tiếp lên đám mây Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'dualeofood_products', // Thư mục lưu trên Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        public_id: (req, file) => `product-${Date.now()}` // Tên file
    }
});
const upload = multer({ storage });

// Khai báo các API
// Lấy danh sách thì không cần token bảo vệ
router.get('/', productController.getProducts); 

// Lấy tất cả đánh giá (Admin)
router.get('/reviews/all', verifyToken, adminOrStaff, productController.getAllProductReviews);

// Route lấy thống kê đánh giá (phải đặt trước route /:id)
router.get('/stats/reviews', verifyToken, isAdmin, productController.getProductReviewStats);

// Route công khai để ai cũng xem được chi tiết sản phẩm
router.get('/:id', productController.getProductById);

// Thêm/Xóa thì phải qua 2 lớp bảo vệ: verifyToken và isAdmin. Kèm theo upload 1 file ảnh.
router.post('/', verifyToken, isAdmin, upload.single('image'), productController.createProduct);
router.delete('/:id', verifyToken, isAdmin, productController.deleteProduct);
// Route mới để cập nhật sản phẩm
router.put('/:id', verifyToken, isAdmin, upload.single('image'), productController.updateProduct);
// Route được bảo vệ, chỉ user đã đăng nhập mới có thể tạo review
router.route('/:id/reviews').post(verifyToken, productController.createProductReview);
router.route('/:id/reviews/:reviewId/visibility').put(verifyToken, adminOrStaff, productController.toggleProductReviewVisibility);
router.route('/:id/reviews/:reviewId/pin').put(verifyToken, adminOrStaff, productController.toggleProductReviewPin);

// Route để ghim sản phẩm
router.put('/:id/pin', verifyToken, isAdmin, productController.pinProduct);

// Route để lấy danh sách sản phẩm đã ghim
router.get('/pinned/all', productController.getPinnedProducts);

module.exports = router;