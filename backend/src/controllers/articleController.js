const asyncHandler = require('express-async-handler');
const Article = require('../models/Article');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

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
// @access  Private/Admin or Staff
const createArticle = asyncHandler(async (req, res) => {
    const { title, slug, content, tags, isPublished } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ message: 'Vui lòng cung cấp ảnh bìa (thumbnail) cho bài viết.' });
    }

    const articleExists = await Article.findOne({ slug });
    if (articleExists) {
        return res.status(400).json({ message: 'Slug (Đường dẫn) đã tồn tại. Vui lòng chọn slug khác.' });
    }

    const article = new Article({
        title,
        slug,
        content,
        thumbnail: req.file.path,
        author: req.user.id,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        isPublished: isPublished !== undefined ? isPublished : false,
        status: req.user.role === 'admin' ? 'approved' : 'pending'
    });

    const createdArticle = await article.save();

    await ActivityLog.create({
        user: req.user.id,
        action: 'CREATE_ARTICLE',
        description: `Đã tạo bài viết mới: ${title}`,
        targetModel: 'Article',
        targetId: createdArticle._id
    });

    res.status(201).json(createdArticle);
});

// @desc    Update an article
// @route   PUT /api/articles/:id
// @access  Private/Admin or Staff
const updateArticle = asyncHandler(async (req, res) => {
    const { title, slug, content, tags, isPublished } = req.body;
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
        
        if (req.user.role === 'admin' && req.body.status) {
            article.status = req.body.status;
        }
        
        if (tags) {
            article.tags = tags.split(',').map(tag => tag.trim());
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

        res.json(updatedArticle);
    } else {
        res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }
});

// @desc    Delete an article
// @route   DELETE /api/articles/:id
// @access  Private/Admin or Staff
const deleteArticle = asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id);

    if (article) {
        await Article.findByIdAndDelete(req.params.id);

        await ActivityLog.create({
            user: req.user.id,
            action: 'DELETE_ARTICLE',
            description: `Đã xoá bài viết: ${article.title}`,
            targetModel: 'Article',
            targetId: req.params.id
        });

        res.json({ message: 'Đã xoá bài viết' });
    } else {
        res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }
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
        if (!article.clappedBy.includes(req.user.id)) {
            article.clappedBy.push(req.user.id);
            article.claps += 1;
            await article.save();
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

module.exports = { getArticles, getArticleBySlug, getArticleById, createArticle, updateArticle, deleteArticle, addComment, addClap, removeClap, toggleCommentVisibility, toggleArticleCommentPin, getAllArticleComments };
