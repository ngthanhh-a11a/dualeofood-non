const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const Product = require('../models/Product'); // Import Product model để kiểm tra
const slugify = require('slugify'); // Import thư viện slugify

// [GET] Lấy tất cả danh mục (cho cả Admin và User)
const getCategories = asyncHandler(async (req, res) => {
    // Logic phân quyền: User thường chỉ thấy danh mục active, admin thấy tất cả
    const filter = req.user?.role === 'admin' ? {} : { isActive: true };
    const categories = await Category.find(filter).sort({ name: 1 }); // Sắp xếp theo tên A-Z
    res.status(200).json(categories);
});

// [GET] Lấy chi tiết một danh mục bằng ID
const getCategoryById = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
        return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    res.status(200).json(category);
});

// [POST] Tạo danh mục mới (Chỉ Admin)
const createCategory = asyncHandler(async (req, res) => {
    const { name, image, isActive } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Vui lòng nhập tên danh mục' });
    }

    // Tự động tạo slug từ name để đảm bảo tính nhất quán và SEO-friendly
    const slug = slugify(name, { lower: true, strict: true, locale: 'vi' });

    // Kiểm tra xem name hoặc slug đã tồn tại chưa
    const categoryExists = await Category.findOne({ $or: [{ name }, { slug }] });
    if (categoryExists) {
        return res.status(400).json({ message: 'Tên hoặc slug của danh mục này đã tồn tại' });
    }

    const category = await Category.create({ name, slug, image, isActive });
    res.status(201).json(category);
});

// [PUT] Cập nhật danh mục (Chỉ Admin)
const updateCategory = asyncHandler(async (req, res) => {
    const { name, image, isActive } = req.body;
    const updateData = { image, isActive };

    // Nếu có tên mới, tạo slug mới và cập nhật
    if (name) {
        updateData.name = name;
        updateData.slug = slugify(name, { lower: true, strict: true, locale: 'vi' });
    }

    const category = await Category.findByIdAndUpdate(
        req.params.id,
        updateData,
        { returnDocument: 'after', runValidators: true }
    );

    if (!category) {
        return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    res.status(200).json(category);
});

// [DELETE] Xóa danh mục (Chỉ Admin)
const deleteCategory = asyncHandler(async (req, res) => {
    const categoryId = req.params.id;

    // 1. Kiểm tra xem có sản phẩm nào thuộc danh mục này không
    const productCount = await Product.countDocuments({ category: categoryId });
    if (productCount > 0) {
        return res.status(400).json({ message: `Không thể xóa. Đang có ${productCount} sản phẩm thuộc danh mục này.` });
    }

    // 2. Nếu không có, tiến hành xóa
    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
        return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }

    res.status(200).json({ message: 'Xóa danh mục thành công' });
});

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};