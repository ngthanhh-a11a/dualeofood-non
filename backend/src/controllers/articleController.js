const asyncHandler = require('express-async-handler');
const Article = require('../models/Article');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const Notification = require('../models/Notification');
const cloudinary = require('../config/cloudinary');
const { emitAdminPendingCounts } = require('../utils/adminRealtime');

// Hàm tạo slug tự động
const generateSlug = (text) => {
    return text.toString().toLowerCase()
        .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
        .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
        .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
        .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
        .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
        .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
        .replace(/đ/gi, 'd')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

// @desc    Get all articles
// @route   GET /api/articles
// @access  Public (only published), Private/Admin (all)
const getArticles = asyncHandler(async (req, res) => {
    let query = {};
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
        query.isPublished = true;
        query.status = 'approved';
    }
    const articles = await Article.find(query).populate('author', 'name avatar').sort({ createdAt: -1 });
    res.json(articles);
});

// @desc    Get article by slug
// @route   GET /api/articles/:slug
// @access  Public
const getArticleBySlug = asyncHandler(async (req, res) => {
    const article = await Article.findOne({ slug: req.params.slug })
        .populate('author', 'name avatar')
        .populate('comments.user', 'avatar');

    if (article) {
        // Increment views
        article.views += 1;
        await article.save();
        res.json(article);
    } else {
        res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }
});

// @desc    Get article by ID
// @route   GET /api/articles/id/:id
// @access  Private/Admin or Staff
const getArticleById = asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id)
        .populate('author', 'name avatar')
        .populate('comments.user', 'avatar');
    if (article) {
        res.json(article);
    } else {
        res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }
});

// @desc    Create an article
// @route   POST /api/articles
// @access  Private (All authenticated users including customers)
const createArticle = asyncHandler(async (req, res) => {
    let { title, slug, content, tags, isPublished } = req.body;
    
    if (!title || !content) {
        return res.status(400).json({ message: 'Vui lòng nhập tiêu đề và nội dung bài viết.' });
    }

    if (!req.file) {
        return res.status(400).json({ message: 'Vui lòng cung cấp ảnh bìa (thumbnail) cho bài viết.' });
    }

    if (!slug || !slug.trim()) {
        slug = generateSlug(title);
    }

    const existingSlug = await Article.findOne({ slug });
    if (existingSlug) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const isAdminUser = req.user.role === 'admin';

    const article = new Article({
        title,
        slug,
        content,
        thumbnail: req.file.path,
        author: req.user.id,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : [],
        isPublished: isAdminUser ? (isPublished !== undefined ? isPublished : true) : false,
        status: isAdminUser ? 'approved' : 'pending'
    });

    const createdArticle = await article.save();

    await ActivityLog.create({
        user: req.user.id,
        action: 'CREATE_ARTICLE',
        description: `Đã tạo bài viết mới: ${title} (${article.status})`,
        targetModel: 'Article',
        targetId: createdArticle._id
    });

    // Nếu khách hàng gửi bài, gửi thông báo xác nhận và báo cho Admin
    if (!isAdminUser) {
        try {
            const customerNotif = await Notification.create({
                user: req.user.id,
                title: 'Bài viết đang chờ duyệt ⏳',
                content: `Bài viết "${title}" của bạn đã được gửi thành công và đang chờ Quản trị viên duyệt.`,
                type: 'ARTICLE_UPDATE',
                articleId: createdArticle._id
            });

            if (req.io) {
                req.io.to(req.user.id.toString()).emit('new_notification', customerNotif);
                req.io.to('admin_room').emit('new_admin_notification', {
                    type: 'ARTICLE_PENDING',
                    message: `Có bài viết mới cần duyệt từ khách hàng: ${title}`
                });
                emitAdminPendingCounts(req.io);
            }
        } catch (notifErr) {
            console.warn('Lỗi gửi thông báo tạo bài viết:', notifErr);
        }
    }

    res.status(201).json(createdArticle);
});

// @desc    Update an article
// @route   PUT /api/articles/:id
// @access  Private/Admin or Staff
const updateArticle = asyncHandler(async (req, res) => {
    const { title, slug, content, tags, isPublished, status } = req.body;
    const article = await Article.findById(req.params.id);

    if (article) {
        article.title = title || article.title;
        if (slug && slug !== article.slug) {
            const articleExists = await Article.findOne({ slug });
            if (articleExists) {
                return res.status(400).json({ message: 'Slug (Đường dẫn) đã tồn tại.' });
            }
            article.slug = slug;
        }
        article.content = content || article.content;
        article.isPublished = isPublished !== undefined ? isPublished : article.isPublished;
        
        // Cập nhật trạng thái kiểm duyệt (Chỉ Admin)
        if (req.user.role === 'admin' && status) {
            const oldStatus = article.status;
            article.status = status;

            // Khi bài viết được duyệt
            if (status === 'approved') {
                article.isPublished = true;
                try {
                    const notif = await Notification.create({
                        user: article.author,
                        title: 'Bài viết của bạn đã được duyệt! 🎉',
                        content: `Quản trị viên đã duyệt bài viết "${article.title}". Bài viết hiện đã xuất hiện trên bảng tin.`,
                        type: 'ARTICLE_APPROVED',
                        articleId: article._id,
                        link: `/blog/${article.slug}`
                    });

                    if (req.io) {
                        req.io.to(article.author.toString()).emit('new_notification', notif);
                    }
                } catch (notifErr) {
                    console.warn('Lỗi gửi thông báo duyệt bài:', notifErr);
                }
            } else if (status === 'rejected') {
                article.isPublished = false;
                try {
                    const notif = await Notification.create({
                        user: article.author,
                        title: 'Bài viết chưa được duyệt ⚠️',
                        content: `Rất tiếc, bài viết "${article.title}" của bạn chưa đạt yêu cầu kiểm duyệt của quản trị viên.`,
                        type: 'ARTICLE_UPDATE',
                        articleId: article._id
                    });

                    if (req.io) {
                        req.io.to(article.author.toString()).emit('new_notification', notif);
                    }
                } catch (notifErr) {
                    console.warn('Lỗi gửi thông báo từ chối bài:', notifErr);
                }
            }
        }
        
        if (tags) {
            article.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
        }

        if (req.file) {
            article.thumbnail = req.file.path;
        }

        const updatedArticle = await article.save();

        await ActivityLog.create({
            user: req.user.id,
            action: 'UPDATE_ARTICLE',
            description: `Đã cập nhật bài viết: ${article.title}`,
            targetModel: 'Article',
            targetId: updatedArticle._id
        });

        emitAdminPendingCounts(req.io);
        res.json(updatedArticle);
    } else {
        res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }
});

// @desc    Delete an article
// @route   DELETE /api/articles/:id
// @access  Private (Admin or Article Author)
const deleteArticle = asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id);

    if (!article) {
        return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }

    // Kiểm tra quyền: Admin hoặc chính tác giả bài viết
    const isAuthor = article.author && article.author.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isAuthor) {
        return res.status(403).json({ message: 'Bạn không có quyền xóa bài viết này!' });
    }

    // Tự động xóa thumbnail trên Cloudinary nếu có
    if (article.thumbnail && article.thumbnail.includes('cloudinary.com')) {
        try {
            const urlWithoutQuery = article.thumbnail.split('?')[0];
            const urlParts = urlWithoutQuery.split('/');
            const fileNameWithExt = urlParts[urlParts.length - 1];
            const folderName = urlParts[urlParts.length - 2];
            const fileName = fileNameWithExt.split('.')[0];
            const publicId = `${folderName}/${fileName}`;
            await cloudinary.uploader.destroy(publicId);
        } catch (err) {
            console.error('Lỗi khi xóa thumbnail bài viết trên Cloudinary:', err);
        }
    }

    await Article.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
        user: req.user.id,
        action: 'DELETE_ARTICLE',
        description: `Đã xoá bài viết: ${article.title}`,
        targetModel: 'Article',
        targetId: req.params.id
    });

    emitAdminPendingCounts(req.io);
    res.json({ message: 'Đã xoá bài viết thành công' });
});

// @desc    Add comment to article
// @route   POST /api/articles/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const article = await Article.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (article && user) {
        const comment = {
            user: user._id,
            name: user.name,
            avatar: user.avatar || '',
            content,
        };

        article.comments.push(comment);
        await article.save();

        // Gửi thông báo cho tác giả bài viết nếu người bình luận không phải là chính tác giả
        if (article.author && article.author.toString() !== req.user.id) {
            try {
                const notif = await Notification.create({
                    user: article.author,
                    title: 'Bình luận mới về bài viết 💬',
                    content: `${user.name} đã bình luận bài viết "${article.title}": "${content.slice(0, 60)}${content.length > 60 ? '...' : ''}"`,
                    type: 'ARTICLE_COMMENT',
                    articleId: article._id,
                    link: `/blog/${article.slug}`
                });

                if (req.io) {
                    req.io.to(article.author.toString()).emit('new_notification', notif);
                    req.io.to('admin_room').emit('new_admin_notification', {
                        type: 'NEW_COMMENT',
                        message: `${user.name} vừa bình luận vào bài viết "${article.title}"`
                    });
                }
            } catch (notifErr) {
                console.warn('Lỗi gửi thông báo bình luận:', notifErr);
            }
        }

        res.status(201).json({ message: 'Bình luận đã được thêm', comments: article.comments });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy bài viết hoặc người dùng');
    }
});

// @desc    Add clap to article
// @route   POST /api/articles/:id/clap
// @access  Private
const addClap = asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id);

    if (article) {
        let isFirstClap = false;
        if (!article.clappedBy.includes(req.user.id)) {
            article.clappedBy.push(req.user.id);
            article.claps += 1;
            await article.save();
            isFirstClap = true;
        }

        // Gửi thông báo cho tác giả nếu người thả tim không phải là tác giả
        if (isFirstClap && article.author && article.author.toString() !== req.user.id) {
            try {
                const user = await User.findById(req.user.id);
                const userName = user?.name || 'Một người dùng';
                const notif = await Notification.create({
                    user: article.author,
                    title: 'Lượt thích bài viết mới ❤️',
                    content: `${userName} đã thả tim bài viết "${article.title}" của bạn.`,
                    type: 'ARTICLE_LIKE',
                    articleId: article._id,
                    link: `/blog/${article.slug}`
                });

                if (req.io) {
                    req.io.to(article.author.toString()).emit('new_notification', notif);
                }
            } catch (notifErr) {
                console.warn('Lỗi gửi thông báo lượt thích:', notifErr);
            }
        }

        res.json({ message: 'Đã vỗ tay', claps: article.claps, clappedBy: article.clappedBy });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy bài viết');
    }
});

// @desc    Remove clap from article
// @route   POST /api/articles/:id/unclap
// @access  Private
const removeClap = asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id);

    if (article) {
        if (article.clappedBy.includes(req.user.id)) {
            article.clappedBy.pull(req.user.id);
            article.claps = Math.max(0, article.claps - 1);
            await article.save();
        }
        res.json({ message: 'Đã bỏ vỗ tay', claps: article.claps, clappedBy: article.clappedBy });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy bài viết');
    }
});

// @desc    Toggle comment visibility (Admin/Staff only)
// @route   PUT /api/articles/:id/comments/:commentId/visibility
// @access  Private (Admin/Staff)
const toggleCommentVisibility = asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id);

    if (!article) {
        res.status(404);
        throw new Error('Không tìm thấy bài viết');
    }

    const comment = article.comments.id(req.params.commentId);
    
    if (!comment) {
        res.status(404);
        throw new Error('Không tìm thấy bình luận');
    }

    comment.isHidden = !comment.isHidden;
    await article.save();

    res.json({ message: comment.isHidden ? 'Đã ẩn bình luận' : 'Đã hiện bình luận', comments: article.comments });
});

// @desc    Toggle comment pin status (Admin/Staff only)
// @route   PUT /api/articles/:id/comments/:commentId/pin
// @access  Private (Admin/Staff)
const toggleArticleCommentPin = asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id);

    if (!article) {
        res.status(404);
        throw new Error('Không tìm thấy bài viết');
    }

    const comment = article.comments.id(req.params.commentId);
    
    if (!comment) {
        res.status(404);
        throw new Error('Không tìm thấy bình luận');
    }

    comment.isPinned = !comment.isPinned;
    await article.save();

    res.json({ message: comment.isPinned ? 'Đã ghim bình luận' : 'Đã bỏ ghim bình luận', comments: article.comments });
});

// @desc    Get all article comments globally (Admin/Staff only)
// @route   GET /api/articles/comments/all
// @access  Private (Admin/Staff)
const getAllArticleComments = asyncHandler(async (req, res) => {
    const articles = await Article.find({ 'comments.0': { $exists: true } })
        .populate('comments.user', 'avatar')
        .select('title thumbnail comments');
        
    let allComments = [];
    articles.forEach(article => {
        article.comments.forEach(comment => {
            allComments.push({
                ...comment.toObject(),
                article: { _id: article._id, title: article.title, thumbnail: article.thumbnail }
            });
        });
    });
    allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(allComments);
});

// @desc    Get articles created by logged in user
// @route   GET /api/articles/my-articles
// @access  Private
const getMyArticles = asyncHandler(async (req, res) => {
    const articles = await Article.find({ author: req.user.id })
        .populate('author', 'name avatar')
        .sort({ createdAt: -1 });
    res.json(articles);
});

module.exports = { 
    getArticles, 
    getArticleBySlug, 
    getArticleById, 
    createArticle, 
    updateArticle, 
    deleteArticle, 
    addComment, 
    addClap, 
    removeClap, 
    toggleCommentVisibility, 
    toggleArticleCommentPin, 
    getAllArticleComments,
    getMyArticles
};
