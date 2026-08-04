const asyncHandler = require('express-async-handler');
const Product = require('../models/Product'); // Đảm bảo đường dẫn tới Model Product là đúng
const Category = require('../models/Category'); // Import Category model
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose'); // Import mongoose để kiểm tra ObjectId
const Order = require('../models/Order');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');


// ================= THÊM MÓN ĂN MỚI (CHỈ ADMIN) =================
const createProduct = asyncHandler(async (req, res) => {
    // 1. Lấy thông tin text từ form (Tên, giá, mô tả...)
    const { name, price, description, category } = req.body; // 'category' bây giờ là categoryId

    // 2. Lấy đường dẫn file ảnh do Multer (Cloudinary) trả về
    const image = req.file ? req.file.path : '';

    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Vui lòng nhập tên, giá và chọn danh mục cho món ăn!' });
    }

    // 3. Tạo món ăn mới trong Database
    const product = new Product({
      name,
      price,
      description,
      image, // Lưu đường dẫn ảnh vào DB
      category // Lưu ObjectId của category
    });

    const createdProduct = await product.save();
    // Trả về sản phẩm đã được populate để UI cập nhật ngay lập tức
    const populatedProduct = await Product.findById(createdProduct._id).populate('category', 'name slug');
    res.status(201).json({ message: 'Thêm món thành công!', product: populatedProduct });
});

// ================= LẤY DANH SÁCH MÓN ĂN =================
const getProducts = asyncHandler(async (req, res) => {
    // Logic phân trang
    const page = parseInt(req.query.page) || 1; // Trang hiện tại
    const limit = parseInt(req.query.limit) || 12; // Tăng giới hạn mặc định cho trang menu
    const skip = (page - 1) * limit;

    // Logic lọc, tìm kiếm và sắp xếp
    const { category, search, sortBy, isPinned } = req.query;
    const filterQuery = {};

    // 1. Lọc theo danh mục
    if (category && category.toLowerCase() !== 'all') {
      // Kiểm tra xem 'category' có phải là ObjectId hợp lệ không
      if (mongoose.Types.ObjectId.isValid(category)) {
        filterQuery.category = category;
      } else {
        // Nếu không, giả định nó là một slug và tìm ID tương ứng
        const categoryDoc = await Category.findOne({ slug: category });
        // Chỉ thêm vào bộ lọc nếu tìm thấy danh mục hợp lệ
        if (categoryDoc) filterQuery.category = categoryDoc._id;
      }
    }

    // 2. Tìm kiếm theo tên sản phẩm (không phân biệt hoa/thường)
    if (search) {
      filterQuery.name = { $regex: search, $options: 'i' };
    }

    // 3. Lọc theo trạng thái ghim
    if (isPinned === 'true') {
        filterQuery.isPinned = true;
    } else if (isPinned === 'false') {
        filterQuery.isPinned = false;
    }

    // 4. Sắp xếp
    let sortQuery = { createdAt: -1 }; // Mặc định: Món mới nhất lên đầu
    if (sortBy === 'price_asc') {
      sortQuery = { price: 1 }; // Giá tăng dần
    } else if (sortBy === 'price_desc') {
      sortQuery = { price: -1 }; // Giá giảm dần
    } else if (sortBy === 'name_asc') {
      sortQuery = { name: 1 }; // Tên A-Z
    }

    const totalProducts = await Product.countDocuments(filterQuery);
    const products = await Product.find(filterQuery)
        .populate('category', 'name slug') // Lấy thông tin danh mục (tên và slug)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit);

    res.status(200).json({
        products,
        totalProducts,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit)
    });
});

// ================= XÓA MÓN ĂN (CHỈ ADMIN) =================
const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: 'Không tìm thấy món ăn để xóa!' });
    }

    // Xóa file ảnh liên quan trên Cloudinary hoặc local server để tránh rác
    if (deletedProduct.image) {
      if (deletedProduct.image.includes('cloudinary.com')) {
          const urlParts = deletedProduct.image.split('/');
          const fileName = urlParts[urlParts.length - 1]; 
          const folderName = urlParts[urlParts.length - 2]; 
          const publicId = `${folderName}/${fileName.split('.')[0]}`; 
          try {
              await cloudinary.uploader.destroy(publicId);
          } catch (err) {
              console.error('Lỗi khi xóa ảnh trên Cloudinary:', err);
          }
      } else {
          const imagePath = path.join(__dirname, '..', '..', 'uploads', path.basename(deletedProduct.image));
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
      }
    }

    res.status(200).json({ message: 'Xóa món ăn thành công!' });
});

// ================= CẬP NHẬT MÓN ĂN (CHỈ ADMIN) =================
const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params; // Product ID
    const { name, price, description, category } = req.body;

    const product = await Product.findById(id);
    if (!product) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    // Cập nhật các trường text
    product.name = name || product.name;
    product.price = price || product.price;
    product.description = description || product.description;
    product.category = category || product.category;

    // Kiểm tra nếu có file ảnh mới được tải lên
    if (req.file) {
        // Xóa ảnh cũ để tránh rác
        if (product.image) {
            if (product.image.includes('cloudinary.com')) {
                const urlParts = product.image.split('/');
                const fileName = urlParts[urlParts.length - 1]; 
                const folderName = urlParts[urlParts.length - 2]; 
                const publicId = `${folderName}/${fileName.split('.')[0]}`; 
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (err) {
                    console.error('Lỗi khi xóa ảnh trên Cloudinary:', err);
                }
            } else {
                const oldImagePath = path.join(__dirname, '..', '..', 'uploads', path.basename(product.image));
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }
        // Cập nhật đường dẫn ảnh mới từ Cloudinary
        product.image = req.file.path;
    }

    await product.save();
    // Trả về sản phẩm đã được populate để UI cập nhật ngay lập tức
    const populatedProduct = await Product.findById(id).populate('category', 'name slug');
    res.status(200).json(populatedProduct);
});

// ================= LẤY CHI TIẾT MỘT MÓN ĂN =================
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('category', 'name slug')
        .populate('reviews.user', 'avatar');
    if (product) {
        res.status(200).json(product);
    } else {
        res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
});

// ================= TẠO REVIEW MỚI (CHỈ CUSTOMER) =================
const createProductReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    try {
        const product = await Product.findById(productId);

        if (product) {
            // 1. Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
            const alreadyReviewed = product.reviews.find(
                r => r.user.toString() === req.user.id.toString()
            );

            if (alreadyReviewed) {
                return res.status(400).json({ message: 'Bạn đã đánh giá sản phẩm này rồi' });
            }

            // Lấy thông tin user để lấy tên một cách đáng tin cậy
            const user = await User.findById(req.user.id).select('name avatar');

            // 2. Tạo review mới
            const review = {
                name: user.name, // Lấy tên từ đối tượng user vừa tìm được
                avatar: user.avatar || '',
                rating: Number(rating),
                comment,
                user: req.user.id
            };

            product.reviews.push(review);

            // 3. Cập nhật lại số lượng review và điểm trung bình (chỉ tính review chưa bị ẩn)
            const visibleReviews = product.reviews.filter(r => !r.isHidden);
            product.numReviews = visibleReviews.length;
            product.averageRating = visibleReviews.length > 0 
                ? visibleReviews.reduce((acc, item) => item.rating + acc, 0) / visibleReviews.length 
                : 0;

            await product.save();
            res.status(201).json({ message: 'Đánh giá đã được thêm thành công' });

        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        throw error;
    }
});

// ================= LẤY THỐNG KÊ ĐÁNH GIÁ (CHỈ ADMIN) =================
const getProductReviewStats = asyncHandler(async (req, res) => {
    // 1. Top 5 sản phẩm được đánh giá cao nhất (phải có ít nhất 1 review)
    const topRatedProducts = await Product.find({ numReviews: { $gt: 0 } })
        .sort({ averageRating: -1, numReviews: -1 }) // Ưu tiên rating cao, sau đó là nhiều review
        .limit(5)
        .select('name averageRating numReviews'); // Chỉ lấy các trường cần thiết

    // 2. Top 5 sản phẩm có nhiều lượt đánh giá nhất
    const mostReviewedProducts = await Product.find({ numReviews: { $gt: 0 } })
        .sort({ numReviews: -1, averageRating: -1 }) // Ưu tiên nhiều review, sau đó là rating cao
        .limit(5)
        .select('name numReviews averageRating');

    // 3. Phân bổ các mức sao đánh giá (1 sao, 2 sao,...)
    const ratingDistribution = await Product.aggregate([
        { $unwind: '$reviews' }, // Tách mỗi review trong mảng reviews thành một document riêng
        {
            $group: {
                _id: '$reviews.rating', // Gom nhóm theo số sao
                count: { $sum: 1 }      // Đếm số lượng review trong mỗi nhóm
            }
        },
        { $sort: { _id: 1 } }, // Sắp xếp từ 1 sao đến 5 sao
        { $project: { _id: 0, name: { $concat: [ { $toString: "$_id" }, " sao" ] }, count: '$count' } }
    ]);

    res.status(200).json({ topRatedProducts, mostReviewedProducts, ratingDistribution });
});

// ================= GHIM/BỎ GHIM MÓN ĂN (CHỈ ADMIN) =================
const pinProduct = asyncHandler(async (req, res) => {
    const { id } = req.params; // Product ID
    const product = await Product.findById(id);

    if (!product) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    product.isPinned = !product.isPinned;
    await product.save();

    // Trả về sản phẩm đã được populate để UI cập nhật ngay lập tức
    const populatedProduct = await Product.findById(id).populate('category', 'name slug');

    res.status(200).json({ message: `Đã ${product.isPinned ? 'ghim' : 'bỏ ghim'} sản phẩm`, product: populatedProduct });
});

// ================= LẤY DANH SÁCH MÓN ĂN ĐÃ GHIM =================
const getPinnedProducts = asyncHandler(async (req, res) => {
    const pinnedProducts = await Product.find({ isPinned: true })
        .populate('category', 'name slug')
        .sort({ updatedAt: -1 });
    res.status(200).json({ products: pinnedProducts });
});

// ================= ẨN/HIỆN ĐÁNH GIÁ (ADMIN/STAFF) =================
const toggleProductReviewVisibility = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    const review = product.reviews.id(req.params.reviewId);
    
    if (!review) {
        return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    }

    review.isHidden = !review.isHidden;

    // Recalculate stats based on visible reviews only
    const visibleReviews = product.reviews.filter(r => !r.isHidden);
    product.numReviews = visibleReviews.length;
    product.averageRating = visibleReviews.length > 0 
        ? visibleReviews.reduce((acc, item) => item.rating + acc, 0) / visibleReviews.length 
        : 0;

    await product.save();

    res.json({ 
        message: review.isHidden ? 'Đã ẩn đánh giá' : 'Đã hiện đánh giá', 
        reviews: product.reviews,
        numReviews: product.numReviews,
        averageRating: product.averageRating
    });
});

// NHỚ XUẤT ĐÚNG TÊN HÀM Ở ĐÂY THÌ BÊN ROUTE MỚI ĐỌC ĐƯỢC
module.exports = { createProduct, getProducts, deleteProduct, updateProduct, getProductById, createProductReview, getProductReviewStats, pinProduct, getPinnedProducts, toggleProductReviewVisibility };