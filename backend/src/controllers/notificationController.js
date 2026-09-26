const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const User = require('../models/User'); // Cần import User để lấy danh sách khách hàng

// 1. Lấy danh sách thông báo của User đang đăng nhập
const getNotifications = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  // Tìm thông báo theo ID của user, sắp xếp mới nhất lên đầu
  const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(limit);

  res.status(200).json(notifications);
});

// 2. Đánh dấu một thông báo cụ thể là "Đã đọc"
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  // Kiểm tra xem thông báo có tồn tại và có đúng là của user này không
  if (notification && notification.user.toString() === req.user.id) {
    notification.isRead = true;
    await notification.save();
    res.status(200).json({ message: 'Đã đánh dấu đọc' });
  } else {
    res.status(404).json({ message: 'Không tìm thấy thông báo' });
  }
});

// 3. (Tính năng thêm) Đánh dấu TẤT CẢ là đã đọc khi bấm nút "Đọc tất cả"
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user.id, isRead: false }, // Tìm các thông báo của user chưa đọc
    { $set: { isRead: true } }            // Cập nhật thành đã đọc
  );
  res.status(200).json({ message: 'Đã dọn sạch chấm đỏ!' });
});

// 4. Xóa một thông báo theo ID
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({ message: 'Không tìm thấy thông báo' });
  }

  if (notification.user.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Không có quyền xóa thông báo này' });
  }

  await notification.deleteOne();
  res.status(200).json({ message: 'Đã xóa thông báo thành công' });
});

// 5. Dọn dẹp tất cả thông báo đã đọc
const clearReadNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({
    user: req.user.id,
    isRead: true
  });
  res.status(200).json({ message: 'Đã dọn dẹp các thông báo đã đọc' });
});

// [POST] Gửi thông báo hàng loạt (Chỉ Admin)
const broadcastNotification = asyncHandler(async (req, res) => {
  const { title, content, userIds, sendToAll } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Tiêu đề và nội dung không được để trống.' });
  }

  let targetUserIds = [];

  if (sendToAll) {
    // Lấy tất cả người dùng không phải là 'admin' để đồng bộ với danh sách hiển thị
    const allUsers = await User.find({ role: { $ne: 'admin' } }).select('_id').lean();
    targetUserIds = allUsers.map(u => u._id);
  } else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
    targetUserIds = userIds;
  } else {
    return res.status(400).json({ message: 'Vui lòng chọn người nhận hoặc bật chế độ gửi cho tất cả.' });
  }

  if (targetUserIds.length === 0) {
    return res.status(400).json({ message: 'Không có người dùng nào để gửi thông báo.' });
  }

  const notificationsData = targetUserIds.map(userId => ({
    user: userId,
    title: title,
    content: content,
    type: 'PROMOTION', // Mặc định là thông báo khuyến mãi
  }));

  const createdNotifications = await Notification.insertMany(notificationsData);

  createdNotifications.forEach(notification => {
    req.io.to(notification.user.toString()).emit('new_notification', notification);
  });

  res.status(200).json({ message: `Gửi thông báo thành công tới ${targetUserIds.length} khách hàng!` });
});

module.exports = { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  clearReadNotifications, 
  broadcastNotification 
};