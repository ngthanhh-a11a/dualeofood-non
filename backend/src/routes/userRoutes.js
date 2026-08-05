const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { 
    getAllUsers, 
    deleteUser, 
    updateUserRole,
    getProfile,
    updateProfile,
    changePassword,
    updateAvatar,
    getMyReviews,
    getMyArticleComments,
    getUserStats,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    listAllUsers,
    getUserById
} = require('../controllers/userController');
const { verifyToken, isAdmin, authorizeRoles } = require('../middleware/authMiddleware');

const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Cấu hình Multer để đẩy file trực tiếp lên đám mây Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'dualeofood_avatars', // Thư mục lưu ảnh trên Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        public_id: (req, file) => `avatar-${req.user.id}-${Date.now()}`
    }
});
const upload = multer({ storage });

// === CÁC ROUTE DÀNH CHO ADMIN ===
// Các route này yêu cầu cả đăng nhập (verifyToken) và quyền admin (isAdmin)
router.get('/stats', verifyToken, isAdmin, getUserStats);
router.get('/', verifyToken, isAdmin, getAllUsers);
router.get('/list-all', verifyToken, isAdmin, listAllUsers);

// === CÁC ROUTE DÀNH CHO NGƯỜI DÙNG THƯỜNG ===
// Các route này chỉ yêu cầu đăng nhập (verifyToken)
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/profile/avatar', verifyToken, upload.single('avatar'), updateAvatar);
router.put('/change-password', verifyToken, changePassword);
router.get('/my-reviews', verifyToken, getMyReviews);
router.get('/my-article-comments', verifyToken, getMyArticleComments);

// === CÁC ROUTE CÓ CHỨA PARAM (Nên để dưới cùng để tránh ghi đè route tĩnh) ===
router.get('/:id', verifyToken, authorizeRoles('admin', 'staff'), getUserById);
router.delete('/:id', verifyToken, isAdmin, deleteUser);
router.put('/:id/role', verifyToken, isAdmin, updateUserRole);

// === CÁC ROUTE DÀNH CHO QUẢN LÝ SỔ ĐỊA CHỈ ===
router.route('/addresses') // /api/users/addresses
    .post(verifyToken, addAddress); // Thêm địa chỉ mới

router.route('/addresses/:id') // /api/users/addresses/some_address_id
    .put(verifyToken, updateAddress) // Sửa địa chỉ
    .delete(verifyToken, deleteAddress); // Xóa địa chỉ

router.put('/addresses/:id/default', verifyToken, setDefaultAddress); // Đặt làm mặc định

module.exports = router;