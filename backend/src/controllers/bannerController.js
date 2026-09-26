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
    const { title, subtitle, buttonText, posX, posY, textAlign, linkUrl, isActive, order } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ message: 'Vui lòng cung cấp hình ảnh hoặc video cho banner.' });
    }

    const isVideo = req.file.mimetype && req.file.mimetype.startsWith('video');
    const mediaType = isVideo ? 'video' : 'image';
    const showContent = req.body.showContent === false || req.body.showContent === 'false' ? false : true;
    const finalTitle = (title && title.trim()) ? title.trim() : (showContent ? 'Banner Mới' : (mediaType === 'video' ? 'Video Banner' : 'Banner'));

    const banner = new Banner({
        title: finalTitle,
        subtitle: subtitle !== undefined ? subtitle.trim() : '',
        buttonText: buttonText !== undefined ? buttonText.trim() : 'Khám phá thêm',
        posX: posX !== undefined && !isNaN(Number(posX)) ? Number(posX) : 50,
        posY: posY !== undefined && !isNaN(Number(posY)) ? Number(posY) : 50,
        textAlign: ['left', 'center', 'right'].includes(textAlign) ? textAlign : 'center',
        linkUrl: linkUrl || '',
        image: req.file.path, // Link từ cloudinary
        mediaType,
        showContent,
        isActive: isActive !== undefined && (isActive === true || isActive === 'true'),
        order: order ? parseInt(order) : 0,
        status: req.user.role === 'admin' ? 'approved' : 'pending' // Staff tạo luôn ở trạng thái pending
    });

    const createdBanner = await banner.save();

    await ActivityLog.create({
        user: req.user.id,
        action: 'CREATE_BANNER',
        description: `Đã tạo banner mới: ${title} (${mediaType}, ${banner.status})`,
        targetModel: 'Banner',
        targetId: createdBanner._id
    });

    res.status(201).json(createdBanner);
});

// Hàm xóa media (ảnh hoặc video) trên Cloudinary
const deleteCloudinaryMedia = async (mediaUrl, mediaType) => {
    if (!mediaUrl || typeof mediaUrl !== 'string' || !mediaUrl.includes('cloudinary.com')) {
        return;
    }

    try {
        const urlWithoutQuery = mediaUrl.split('?')[0];
        const urlParts = urlWithoutQuery.split('/');
        const fileNameWithExt = urlParts[urlParts.length - 1];
        const folderName = urlParts[urlParts.length - 2];
        const fileName = fileNameWithExt.split('.')[0];
        const publicId = `${folderName}/${fileName}`;

        // Phân biệt resource_type: 'video' hay 'image' để Cloudinary xóa chính xác
        const isVideo = mediaType === 'video' ||
            mediaUrl.includes('/video/upload/') ||
            /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(fileNameWithExt);

        const resourceType = isVideo ? 'video' : 'image';

        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        console.log(`[Cloudinary] Đã xóa file ${resourceType}: ${publicId}`, result);
    } catch (err) {
        console.error('Lỗi khi xóa media trên Cloudinary:', err);
    }
};

// @desc    Update a banner
// @route   PUT /api/banners/:id
// @access  Private/Admin or Staff
const updateBanner = asyncHandler(async (req, res) => {
    const { title, subtitle, buttonText, posX, posY, textAlign, linkUrl, isActive, order, showContent, status } = req.body;
    const banner = await Banner.findById(req.params.id);

    if (banner) {
        if (showContent !== undefined) {
            banner.showContent = showContent === true || showContent === 'true';
        }
        if (title !== undefined) {
            banner.title = (title && title.trim()) ? title.trim() : (banner.showContent ? 'Banner Mới' : (banner.mediaType === 'video' ? 'Video Banner' : 'Banner'));
        }
        if (subtitle !== undefined) banner.subtitle = subtitle.trim();
        if (buttonText !== undefined) banner.buttonText = buttonText.trim();
        if (posX !== undefined && !isNaN(Number(posX))) banner.posX = Number(posX);
        if (posY !== undefined && !isNaN(Number(posY))) banner.posY = Number(posY);
        if (textAlign !== undefined && ['left', 'center', 'right'].includes(textAlign)) banner.textAlign = textAlign;
        if (linkUrl !== undefined) banner.linkUrl = linkUrl;
        if (isActive !== undefined) banner.isActive = isActive === true || isActive === 'true';
        if (order !== undefined) banner.order = parseInt(order);
        
        // Chỉ admin mới được duyệt/từ chối trạng thái
        if (req.user.role === 'admin' && status) {
            banner.status = status;
        } else if (req.user.role === 'staff') {
            // Khi nhân viên sửa banner, trạng thái tự động chuyển về pending chờ duyệt
            banner.status = 'pending';
        }

        if (req.file) {
            // Xóa file ảnh/video cũ trên Cloudinary để tránh rác dung lượng
            if (banner.image) {
                await deleteCloudinaryMedia(banner.image, banner.mediaType);
            }
            banner.image = req.file.path;
            const isVideo = req.file.mimetype && req.file.mimetype.startsWith('video');
            banner.mediaType = isVideo ? 'video' : 'image';
        }

        const updatedBanner = await banner.save();

        await ActivityLog.create({
            user: req.user.id,
            action: 'UPDATE_BANNER',
            description: `Đã cập nhật banner: ${banner.title} (Trạng thái: ${banner.status})`,
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
        // Tự động xóa file ảnh hoặc video tương ứng trên Cloudinary
        if (banner.image) {
            await deleteCloudinaryMedia(banner.image, banner.mediaType);
        }

        await Banner.findByIdAndDelete(req.params.id);

        await ActivityLog.create({
            user: req.user.id,
            action: 'DELETE_BANNER',
            description: `Đã xoá banner: ${banner.title}`,
            targetModel: 'Banner',
            targetId: req.params.id
        });

        res.json({ message: 'Đã xoá banner và file media trên Cloudinary thành công' });
    } else {
        res.status(404).json({ message: 'Không tìm thấy banner' });
    }
});

module.exports = { getBanners, createBanner, updateBanner, deleteBanner };
