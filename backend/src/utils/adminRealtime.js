const Order = require('../models/Order');
const Article = require('../models/Article');
const Story = require('../models/Story');
const Message = require('../models/Message');
const ChatConversation = require('../models/ChatConversation');

/**
 * Lấy toàn bộ số lượng công việc / thông báo cần Admin xử lý
 */
const getAdminPendingCounts = async () => {
    try {
        const [
            pendingOrders,
            pendingArticles,
            pendingStories,
            unreadMessages,
            unreadLiveChats
        ] = await Promise.all([
            Order.countDocuments({ status: 'PENDING' }),
            Article.countDocuments({ status: 'pending' }),
            Story.countDocuments({ status: 'pending' }),
            Message.countDocuments({ isRead: false }),
            ChatConversation.countDocuments({ hasUnreadAdmin: true })
        ]);

        const pendingContentTotal = pendingArticles + pendingStories;
        const totalNeedAction = pendingOrders + pendingContentTotal + unreadMessages + unreadLiveChats;

        return {
            pendingOrders,
            pendingArticles,
            pendingStories,
            pendingContentTotal,
            unreadMessages,
            unreadLiveChats,
            totalNeedAction
        };
    } catch (error) {
        console.error('Lỗi khi tính số lượng việc cần Admin xử lý:', error);
        return {
            pendingOrders: 0,
            pendingArticles: 0,
            pendingStories: 0,
            pendingContentTotal: 0,
            unreadMessages: 0,
            unreadLiveChats: 0,
            totalNeedAction: 0
        };
    }
};

/**
 * Phát realtime số lượng việc cần duyệt đến phòng admin_room qua Socket.io
 */
const emitAdminPendingCounts = async (io) => {
    if (!io) return;
    try {
        const counts = await getAdminPendingCounts();
        io.to('admin_room').emit('admin_pending_counts', counts);
        // Đồng thời cập nhật sự kiện cũ để tương thích
        io.to('admin_room').emit('update_pending_orders_count', counts.pendingOrders);
    } catch (error) {
        console.error('Lỗi khi emit realtime admin counts:', error);
    }
};

module.exports = {
    getAdminPendingCounts,
    emitAdminPendingCounts
};
