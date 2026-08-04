const mongoose = require('mongoose');

// Schema cho bình luận bài viết
const articleCommentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    avatar: { type: String, default: '' },
    content: { type: String, required: true },
    isHidden: { type: Boolean, default: false }
}, {
    timestamps: true,
});

const articleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    thumbnail: { type: String, required: true }, // Ảnh bìa bài viết
    content: { type: String, required: true }, // Nội dung HTML của bài viết
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String }], // Phân loại bài viết
    views: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false }, // Đã xuất bản chưa
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    claps: { type: Number, default: 0 },
    clappedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [articleCommentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Article', articleSchema);
