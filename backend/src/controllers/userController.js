const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const ActivityLog = require('../models/ActivityLog');
const cloudinary = require('../config/cloudinary');

// @desc    Get all users (for Admin)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Thêm logic tìm kiếm
    const { search } = req.query;
    const filterQuery = {};
    if (search) {
        filterQuery.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    const totalUsers = await User.countDocuments(filterQuery);
    const users = await User.find(filterQuery).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit);

    res.json({
        users,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers
    });
});

// @desc    Delete a user (for Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        if (user._id.toString() === req.user.id.toString()) {
            return res.status(400).json({ message: 'Bạn không thể tự xóa tài khoản của mình.' });
        }
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa người dùng thành công.' });
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
});

// @desc    Update user role (for Admin)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        if (user._id.toString() === req.user.id.toString()) {
            return res.status(400).json({ message: 'Bạn không thể tự thay đổi quyền của mình.' });
        }
        user.role = req.body.role || user.role;
        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
        });
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpires -__v -createdAt -updatedAt');
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (user) {
        user.name = req.body.name || user.name;
        const updatedUser = await user.save();
        res.json({
            message: "Cập nhật thành công",
            user: { 
                _id: updatedUser._id, 
                name: updatedUser.name, 
                email: updatedUser.email, 
                role: updatedUser.role,
                avatar: updatedUser.avatar,
            }
        });
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
});

// [POST] /api/users/addresses - Thêm địa chỉ mới
const addAddress = asyncHandler(async (req, res) => {
    const { name, phone, street, isDefault, label } = req.body;
    if (!name || !phone || !street) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin địa chỉ.' });
    }
    const user = await User.findById(req.user.id); // req.user.id lấy từ token đăng nhập

    if (user) {
        // Đảm bảo mảng addresses luôn tồn tại để tránh lỗi
        if (!user.addresses) {
            user.addresses = [];
        }

        // Nếu đánh dấu đây là mặc định, các địa chỉ cũ phải chuyển thành false
        if (isDefault === true) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        // Thêm địa chỉ mới vào mảng
        user.addresses.push({ name, phone, street, isDefault, label });
        await user.save();

        res.status(201).json(user.addresses);
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
});

// [PUT] /api/users/addresses/:id - Cập nhật địa chỉ
const updateAddress = asyncHandler(async (req, res) => {
    const { name, phone, street, isDefault, label } = req.body;
    const user = await User.findById(req.user.id);

    // Đảm bảo mảng addresses luôn tồn tại
    if (!user.addresses) {
        user.addresses = [];
    }

    const address = user.addresses.id(req.params.id);

    if (!address) return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });

    if (isDefault === true) {
        user.addresses.forEach(addr => addr.isDefault = false);
    }

    address.set({ name, phone, street, isDefault, label });
    await user.save();
    res.json(user.addresses);
});

// [DELETE] /api/users/addresses/:id - Xóa địa chỉ
const deleteAddress = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    // Đảm bảo mảng addresses luôn tồn tại
    if (!user.addresses) {
        user.addresses = [];
        await user.save();
        return res.json([]); // Trả về mảng rỗng vì không có gì để xóa
    }
    const address = user.addresses.id(req.params.id);

    if (!address) return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });

    const wasDefault = address.isDefault;
    user.addresses.pull(req.params.id); // Xóa sub-document

    // Nếu địa chỉ bị xóa là mặc định, tự động đặt địa chỉ đầu tiên làm mặc định (nếu còn)
    if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json(user.addresses);
});

// [PUT] /api/users/addresses/:id/default - Đặt làm địa chỉ mặc định
const setDefaultAddress = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    // Đảm bảo mảng addresses luôn tồn tại
    if (!user.addresses) {
        user.addresses = [];
    }

    const address = user.addresses.id(req.params.id);

    if (!address) return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });

    user.addresses.forEach(addr => addr.isDefault = false);
    address.isDefault = true;

    await user.save();
    res.json(user.addresses);
});
// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu không hợp lệ. Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }
    try {
        const user = await User.findById(req.user.id).select('+password');
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        throw error;
    }
});

// @desc    Update user avatar
// @route   PUT /api/users/profile/avatar
// @access  Private
const updateAvatar = asyncHandler(async (req, res) => {
    // 1. Kiểm tra xem người dùng có gửi tệp tin hay không để tránh lỗi hệ thống
    if (!req.file) {
        return res.status(400).json({ message: 'Vui lòng chọn một tệp tin hình ảnh.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        // Xóa tệp vừa tải lên nếu không tìm thấy người dùng
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Xóa ảnh đại diện cũ nếu có
    if (user.avatar) {
        if (user.avatar.includes('cloudinary.com')) {
            // Tách public_id từ đường dẫn url của Cloudinary (Ví dụ: .../v1234/dualeofood_avatars/avatar-xyz.png)
            const urlParts = user.avatar.split('/');
            const fileName = urlParts[urlParts.length - 1]; // avatar-xyz.png
            const folderName = urlParts[urlParts.length - 2]; // dualeofood_avatars
            const publicId = `${folderName}/${fileName.split('.')[0]}`; // dualeofood_avatars/avatar-xyz
            
            try {
                await cloudinary.uploader.destroy(publicId);
            } catch (err) {
                console.error('Lỗi khi xóa ảnh trên Cloudinary:', err);
            }
        } else {
            // Logic cũ: Xóa ảnh dưới local nếu người dùng vẫn dùng ảnh cũ
            const relativeAvatarPath = user.avatar.startsWith('/') ? user.avatar.slice(1) : user.avatar;
            const oldAvatarPath = path.join(__dirname, '..', '..', relativeAvatarPath);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }
    }

    // Cập nhật đường dẫn ảnh mới từ Cloudinary
    user.avatar = req.file.path; // Cloudinary trả về đường dẫn tĩnh vào biến này
    const updatedUser = await user.save();

    // 2. Ghi nhận lịch sử hoạt động vào cơ sở dữ liệu
    await ActivityLog.create({
        user: updatedUser._id,
        action: 'UPDATE_AVATAR',
        description: `Người dùng ${updatedUser.name} đã cập nhật ảnh đại diện mới.`,
        targetModel: 'User',
        targetId: updatedUser._id
    });

    res.json({
        message: "Cập nhật ảnh đại diện thành công!",
        user: { _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, avatar: updatedUser.avatar }
    });
});

// @desc    Get reviews made by the current user
// @route   GET /api/users/my-reviews
// @access  Private
const getMyReviews = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // 5 reviews per page
    const skip = (page - 1) * limit;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Aggregation to get total count for pagination
    const totalReviewsCount = await Product.aggregate([
        { $unwind: '$reviews' },
        { $match: { 'reviews.user': userId } },
        { $count: 'total' }
    ]);
    const totalReviews = totalReviewsCount.length > 0 ? totalReviewsCount[0].total : 0;

    // Aggregation to get paginated reviews
    const reviews = await Product.aggregate([
        // Match products that contain a review by the user
        { $match: { 'reviews.user': userId } },
        // Unwind the reviews array
        { $unwind: '$reviews' },
        // Match only the specific reviews by the user
        { $match: { 'reviews.user': userId } },
        // Sort by review date descending (newest first)
        { $sort: { 'reviews.createdAt': -1 } },
        // Pagination
        { $skip: skip },
        { $limit: limit },
        // Project the desired fields
        {
            $project: {
                _id: '$reviews._id',
                rating: '$reviews.rating',
                comment: '$reviews.comment',
                createdAt: '$reviews.createdAt',
                product: { _id: '$_id', name: '$name', image: '$image' }
            }
        }
    ]);

    res.json({ reviews, currentPage: page, totalPages: Math.ceil(totalReviews / limit) });
});

// @desc    Get user registration statistics
// @route   GET /api/users/stats
// @access  Private/Admin
const getUserStats = asyncHandler(async (req, res) => {
    const { period } = req.query; // e.g., '7d', '30d', '12m'
    let startDate = new Date();
    let groupByFormat = "%Y-%m-%d"; // Group by day by default

    switch (period) {
        case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
        case '12m':
            startDate.setMonth(startDate.getMonth() - 12);
            groupByFormat = "%Y-%m"; // Group by month for yearly view
            break;
        default:
            startDate.setDate(startDate.getDate() - 7); // Default to 7 days
    }

    startDate.setHours(0, 0, 0, 0);

    const stats = await User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
            $group: {
                _id: { $dateToString: { format: groupByFormat, date: "$createdAt" } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: "$count" } }
    ]);

    res.json(stats);
});


// [GET] Lấy danh sách rút gọn của tất cả user (dành cho mục đích nội bộ)
const listAllUsers = asyncHandler(async (req, res) => {
    // Chỉ lấy các trường cần thiết để giảm tải dữ liệu
    // Lấy tất cả người dùng không phải là 'admin' để đảm bảo danh sách khách hàng đầy đủ
    const users = await User.find({ role: { $ne: 'admin' } }).select('name email avatar').sort({ createdAt: -1 });
    res.status(200).json(users);
});

// [GET] Lấy thông tin chi tiết một user qua ID (dành cho Admin/Staff khi xem hồ sơ chat)
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
        res.status(200).json(user);
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
});

module.exports = { getAllUsers, deleteUser, updateUserRole, getProfile, updateProfile, changePassword, updateAvatar, getMyReviews, getUserStats, addAddress, updateAddress, deleteAddress, setDefaultAddress, listAllUsers, getUserById };