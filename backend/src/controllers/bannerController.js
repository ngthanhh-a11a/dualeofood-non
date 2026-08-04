const asyncHandler = require('express-async-handler');
const Banner = require('../models/Banner');
const cloudinary = require('../config/cloudinary');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all banners
// @route   GET /api/banners
// @access  Public (only active ones), Private/Admin (all)
const getBanners = asyncHandler(async (req, res) => {
    // If not admin/staff, only return active banners
    let query = {};
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
        query.isActive = true;
        query.status = 'approved';
    }
    const banners = await Banner.find(query).sort({ order: 1, createdAt: -1 });
    res.json(banners);
});

// @desc    Create a banner
// @route   POST /api/banners
// @access  Private/Admin or Staff
const createBanner = asyncHandler(async (req, res) => {
    const { title, linkUrl, isActive, order } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ message: 'Vui lòng cung cấp hình ảnh cho banner.' });
    }

    const banner = new Banner({
        title,
        linkUrl: linkUrl || '',
        image: req.file.path, // Link từ cloudinary
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0,
        status: req.user.role === 'admin' ? 'approved' : 'pending'
    });

    const createdBanner = await banner.save();

    await ActivityLog.create({
        user: req.user.id,
        action: 'CREATE_BANNER',
        description: `Đã tạo banner mới: ${title}`,
        targetModel: 'Banner',
        targetId: createdBanner._id
    });

    res.status(201).json(createdBanner);
});

// @desc    Update a banner
// @route   PUT /api/banners/:id
// @access  Private/Admin or Staff
const updateBanner = asyncHandler(async (req, res) => {
    const { title, linkUrl, isActive, order } = req.body;
    const banner = await Banner.findById(req.params.id);

    if (banner) {
        banner.title = title || banner.title;
        banner.linkUrl = linkUrl !== undefined ? linkUrl : banner.linkUrl;
        banner.isActive = isActive !== undefined ? isActive : banner.isActive;
        banner.order = order !== undefined ? order : banner.order;
        
        if (req.user.role === 'admin' && req.body.status) {
            banner.status = req.body.status;
        }

        if (req.file) {
            // Có thể xoá ảnh cũ trên cloudinary ở đây nếu muốn
            banner.image = req.file.path;
        }

        const updatedBanner = await banner.save();

        await ActivityLog.create({
            user: req.user.id,
            action: 'UPDATE_BANNER',
            description: `Đã cập nhật banner: ${banner.title}`,
            targetModel: 'Banner',
            targetId: updatedBanner._id
        });

        res.json(updatedBanner);
    } else {
        res.status(404).json({ message: 'Không tìm thấy banner' });
    }
});

// @desc    Delete a banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin or Staff
const deleteBanner = asyncHandler(async (req, res) => {
    const banner = await Banner.findById(req.params.id);

    if (banner) {
        await Banner.findByIdAndDelete(req.params.id);

        await ActivityLog.create({
            user: req.user.id,
            action: 'DELETE_BANNER',
            description: `Đã xoá banner: ${banner.title}`,
            targetModel: 'Banner',
            targetId: req.params.id
        });

        res.json({ message: 'Đã xoá banner' });
    } else {
        res.status(404).json({ message: 'Không tìm thấy banner' });
    }
});

module.exports = { getBanners, createBanner, updateBanner, deleteBanner };
