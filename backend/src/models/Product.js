const mongoose = require('mongoose');

// Schema cho một đánh giá
const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true }, // Lưu tên người dùng để không cần populate
    avatar: { type: String, default: '' },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false }
}, {
    timestamps: true,
});

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' }, // Sẽ lưu đường dẫn ảnh
    category: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // Kết nối trực tiếp đến bảng Category vừa tạo
        required: [true, 'Sản phẩm phải thuộc một danh mục'] 
    },
    isPinned: { type: Boolean, default: false },

    // --- CÁC TRƯỜNG MỚI CHO TÍNH NĂNG ĐÁNH GIÁ ---
    reviews: [reviewSchema], // Mảng chứa các đánh giá
    averageRating: { type: Number, required: true, default: 0 }, // Điểm trung bình
    numReviews: { type: Number, required: true, default: 0 }, // Số lượng đánh giá
    // ---------------------------------------------
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);