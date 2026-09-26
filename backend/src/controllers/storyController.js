const Story = require('../models/Story');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { emitAdminPendingCounts } = require('../utils/adminRealtime');

// @desc    Lấy danh sách Story công khai hiển thị trên Blog
// @route   GET /api/stories
// @access  Public (Tùy chọn auth)
exports.getStories = async (req, res) => {
    try {
        const currentUserId = req.user ? (req.user._id || req.user.id) : null;
        
        let filter = {
            $or: [
                { status: 'approved', isPublished: true }
            ]
        };

        // Nếu người dùng đăng nhập, lấy thêm Story của chính họ (kể cả đang chờ duyệt) để xem trước
        if (currentUserId) {
            filter.$or.push({ user: currentUserId });
        }

        let stories = await Story.find(filter)
            .sort({ isPinned: -1, createdAt: -1 })
            .limit(50);

        // Quy tắc sắp xếp theo yêu cầu:
        // 1. Của ai đăng thì người đó hiện đầu tiên
        // 2. Kế tiếp là Story được ghim (isPinned)
        // 3. Cuối cùng là các Story mới nhất về sau
        if (currentUserId) {
            const myStories = [];
            const otherPinned = [];
            const otherNormal = [];

            stories.forEach(s => {
                if (s.user && s.user.toString() === currentUserId.toString()) {
                    myStories.push(s);
                } else if (s.isPinned) {
                    otherPinned.push(s);
                } else {
                    otherNormal.push(s);
                }
            });

            stories = [...myStories, ...otherPinned, ...otherNormal];
        }

        res.json(stories);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách Story:', error);
        res.status(500).json({ message: 'Không thể tải danh sách Story' });
    }
};

// @desc    Lấy danh sách Story của chính người dùng đăng nhập
// @route   GET /api/stories/my-stories
// @access  Private
exports.getMyStories = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const stories = await Story.find({ user: userId }).sort({ createdAt: -1 });
        res.json(stories);
    } catch (error) {
        console.error('Lỗi khi lấy Story của tôi:', error);
        res.status(500).json({ message: 'Không thể tải danh sách Story của bạn' });
    }
};

// @desc    Admin lấy toàn bộ danh sách Story để kiểm duyệt & quản lý
// @route   GET /api/stories/admin/all
// @access  Admin, Staff
exports.getAllStoriesAdmin = async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } }
            ];
        }

        // Chuẩn hoá dữ liệu: Xoá bỏ nút bấm & link mặc định cũ nếu có ở các story của khách hàng
        await Story.updateMany(
            { status: 'pending', btnText: 'Khám phá ngay', link: '/menu' },
            { $set: { btnText: '', link: '' } }
        );

        const stories = await Story.find(query)
            .sort({ isPinned: -1, createdAt: -1 });

        res.json(stories);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách Story cho Admin:', error);
        res.status(500).json({ message: 'Không thể tải danh sách Story cho quản trị' });
    }
};

// @desc    Tạo Story mới (Khách đăng chờ duyệt, Admin đăng duyệt ngay)
// @route   POST /api/stories
// @access  Private (Khách hàng hoặc Admin)
exports.createStory = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng tải lên một hình ảnh cho Story' });
        }

        const { title, caption, link, btnText } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Vui lòng nhập tiêu đề cho Story' });
        }

        const userId = req.user._id || req.user.id;
        if (!userId) {
            return res.status(401).json({ message: 'Không thể xác định danh tính người dùng' });
        }

        const userDoc = await User.findById(userId).select('name avatar');
        const isManager = req.user.role === 'admin' || req.user.role === 'staff';
        
        // Cấu hình Story: nếu là khách hàng, hoàn toàn không có nút hành động và link
        const newStory = new Story({
            title: title.trim(),
            caption: caption ? caption.trim() : '',
            image: req.file.path, // URL Cloudinary
            imagePublicId: req.file.filename, // Public ID trên Cloudinary
            user: userId,
            author: userDoc?.name || req.user.name || 'Thành viên DualeoFood',
            avatar: userDoc?.avatar || req.user.avatar || '',
            // Chỉ Admin hoặc Nhân viên mới có quyền thiết lập Nút bấm & Liên kết
            btnText: isManager && btnText ? btnText.trim() : '',
            link: isManager && link ? link.trim() : '',
            status: isManager ? 'approved' : 'pending', // Quản trị/nhân viên duyệt ngay, khách chờ duyệt
            isPublished: true,
            isPinned: false
        });

        const savedStory = await newStory.save();

        // Gửi thông báo đến người dùng và Admin khi khách tạo Story
        if (!isManager) {
            try {
                const Notification = require('../models/Notification');
                const customerNotif = await Notification.create({
                    user: userId,
                    title: 'Story đang chờ duyệt ⏳',
                    content: `Tin "${title.trim()}" của bạn đã được gửi thành công và đang chờ Quản trị viên duyệt.`,
                    type: 'STORY_UPDATE',
                    storyId: savedStory._id,
                    link: '/profile?tab=my-stories'
                });

                if (req.io) {
                    req.io.to(userId.toString()).emit('new_notification', customerNotif);
                    req.io.to('admin_room').emit('new_admin_notification', {
                        type: 'STORY_PENDING',
                        message: `Có Story mới cần duyệt từ khách hàng: ${title.trim()}`
                    });
                    emitAdminPendingCounts(req.io);
                }
            } catch (notifErr) {
                console.warn('Lỗi khi gửi thông báo tạo story:', notifErr);
            }
        } else {
            emitAdminPendingCounts(req.io);
        }

        res.status(201).json(savedStory);
    } catch (error) {
        console.error('Lỗi khi tạo Story:', error);
        res.status(500).json({ message: error.message || 'Lỗi hệ thống khi tạo Story' });
    }
};

// @desc    Admin duyệt hoặc từ chối Story
// @route   PUT /api/stories/:id/status
// @access  Admin, Staff
exports.updateStoryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Trạng thái kiểm duyệt không hợp lệ' });
        }

        const story = await Story.findById(req.params.id);
        if (!story) {
            return res.status(404).json({ message: 'Không tìm thấy Story' });
        }

        story.status = status;
        await story.save();

        // Gửi thông báo kết quả kiểm duyệt tới tác giả Story
        if (story.user && story.user.toString() !== (req.user._id || req.user.id).toString()) {
            try {
                const Notification = require('../models/Notification');
                let notifTitle = '';
                let notifContent = '';
                let notifType = 'STORY_UPDATE';

                if (status === 'approved') {
                    notifTitle = 'Story đã được duyệt 🎉';
                    notifContent = `Tin "${story.title}" của bạn đã được phê duyệt và đang hiển thị trên bảng tin DualeoFood!`;
                    notifType = 'STORY_APPROVED';
                } else if (status === 'rejected') {
                    notifTitle = 'Story không được duyệt ❌';
                    notifContent = `Tin "${story.title}" của bạn không phù hợp với tiêu chuẩn cộng đồng và đã bị từ chối.`;
                    notifType = 'STORY_REJECTED';
                }

                if (notifTitle) {
                    const notif = await Notification.create({
                        user: story.user,
                        title: notifTitle,
                        content: notifContent,
                        type: notifType,
                        storyId: story._id,
                        link: '/profile?tab=my-stories'
                    });

                    if (req.io) {
                        req.io.to(story.user.toString()).emit('new_notification', notif);
                    }
                }
            } catch (notifErr) {
                console.warn('Lỗi khi gửi thông báo duyệt Story:', notifErr);
            }
        }

        emitAdminPendingCounts(req.io);
        res.json({ message: `Đã cập nhật trạng thái thành ${status}`, story });
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái Story:', error);
        res.status(500).json({ message: 'Không thể cập nhật trạng thái kiểm duyệt Story' });
    }
};

// @desc    Admin bật/tắt Ẩn - Xuất bản Story
// @route   PUT /api/stories/:id/publish
// @access  Admin, Staff
exports.togglePublishStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) {
            return res.status(404).json({ message: 'Không tìm thấy Story' });
        }

        story.isPublished = !story.isPublished;
        await story.save();

        res.json({ 
            message: story.isPublished ? 'Đã xuất bản Story' : 'Đã ẩn Story', 
            isPublished: story.isPublished 
        });
    } catch (error) {
        console.error('Lỗi khi thay đổi trạng thái xuất bản Story:', error);
        res.status(500).json({ message: 'Không thể cập nhật trạng thái hiển thị Story' });
    }
};

// @desc    Admin bật/tắt Ghim Story lên đầu
// @route   PUT /api/stories/:id/pin
// @access  Admin, Staff
exports.togglePinStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) {
            return res.status(404).json({ message: 'Không tìm thấy Story' });
        }

        story.isPinned = !story.isPinned;
        await story.save();

        res.json({ 
            message: story.isPinned ? 'Đã ghim Story lên đầu' : 'Đã bỏ ghim Story', 
            isPinned: story.isPinned 
        });
    } catch (error) {
        console.error('Lỗi khi thay đổi trạng thái ghim Story:', error);
        res.status(500).json({ message: 'Không thể cập nhật trạng thái ghim Story' });
    }
};

// @desc    Admin cập nhật thông tin Story (Gắn link, nút hành động, caption)
// @route   PUT /api/stories/:id
// @access  Admin, Staff
exports.updateStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) {
            return res.status(404).json({ message: 'Không tìm thấy Story' });
        }

        const { title, caption, btnText, link, status, isPublished, isPinned } = req.body;

        if (title) story.title = title.trim();
        if (caption !== undefined) story.caption = caption.trim();
        if (btnText !== undefined) story.btnText = btnText.trim();
        if (link !== undefined) story.link = link.trim();
        if (status) story.status = status;
        if (isPublished !== undefined) story.isPublished = isPublished;
        if (isPinned !== undefined) story.isPinned = isPinned;

        // Nếu admin tải ảnh mới thay thế
        if (req.file) {
            if (story.imagePublicId) {
                try {
                    await cloudinary.uploader.destroy(story.imagePublicId);
                } catch (delErr) {
                    console.warn('Lỗi khi xóa ảnh cũ trên Cloudinary:', delErr);
                }
            }
            story.image = req.file.path;
            story.imagePublicId = req.file.filename;
        }

        const updatedStory = await story.save();
        emitAdminPendingCounts(req.io);
        res.json(updatedStory);
    } catch (error) {
        console.error('Lỗi khi cập nhật Story:', error);
        res.status(500).json({ message: 'Không thể cập nhật thông tin Story' });
    }
};

// @desc    Xóa Story (Xóa record trong DB và xóa ảnh trên Cloudinary)
// @route   DELETE /api/stories/:id
// @access  Private (Admin hoặc chính chủ sở hữu)
exports.deleteStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) {
            return res.status(404).json({ message: 'Không tìm thấy Story' });
        }

        const isAdmin = req.user.role === 'admin' || req.user.role === 'staff';
        const userId = (req.user._id || req.user.id || '').toString();
        const isOwner = story.user ? story.user.toString() === userId : false;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa Story này' });
        }

        // Tự động dọn dẹp ảnh trên Cloudinary
        if (story.imagePublicId) {
            try {
                await cloudinary.uploader.destroy(story.imagePublicId);
            } catch (cloudErr) {
                console.warn('Không thể xóa ảnh Cloudinary:', cloudErr);
            }
        }

        await Story.findByIdAndDelete(req.params.id);
        emitAdminPendingCounts(req.io);
        res.json({ message: 'Đã xóa Story và dọn dẹp ảnh trên Cloudinary thành công' });
    } catch (error) {
        console.error('Lỗi khi xóa Story:', error);
        res.status(500).json({ message: 'Không thể xóa Story' });
    }
};
