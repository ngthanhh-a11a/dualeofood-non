const express = require('express');
const router = express.Router();
const { 
    getCategories, 
    createCategory, 
    updateCategory,
    deleteCategory, // Giả định bạn đã thêm hàm này từ gợi ý trước
    getCategoryById // Giả định bạn đã thêm hàm này từ gợi ý trước
} = require('../controllers/categoryController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware'); 

router.route('/')
    .get(getCategories) // Bất kỳ ai cũng xem được danh sách
    .post(verifyToken, isAdmin, createCategory); // Chỉ Admin được tạo mới

router.route('/:id')
    .get(getCategoryById) // Bất kỳ ai cũng xem được chi tiết
    .put(verifyToken, isAdmin, updateCategory) // Chỉ Admin được cập nhật
    .delete(verifyToken, isAdmin, deleteCategory); // Chỉ Admin được xóa

module.exports = router;