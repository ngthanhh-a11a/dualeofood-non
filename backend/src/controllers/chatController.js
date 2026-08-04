const ChatConversation = require('../models/ChatConversation');

// API lấy lịch sử chat (cho cả Guest và User)
exports.getChatHistory = async (req, res) => {
    try {
        const { guestId, userId } = req.query;
        
        let orConditions = [];
        // Ưu tiên tìm theo guestId (cố định trên trình duyệt)
        if (guestId && guestId !== 'null') {
            orConditions.push({ guestId });
        }
        // Kèm theo userId (nếu đăng nhập trên máy mới)
        if (userId && userId !== 'null') {
            orConditions.push({ userId });
        }

        if (orConditions.length === 0) {
            return res.status(400).json({ success: false, message: 'Missing userId or guestId' });
        }

        let conversation = await ChatConversation.findOne({ $or: orConditions }).sort({ updatedAt: -1 });

        if (!conversation) {
            // Nếu chưa có, trả về mảng rỗng để frontend hiển thị giao diện bắt đầu
            return res.status(200).json({ success: true, messages: [] });
        }

        // Đánh dấu đã đọc các tin nhắn của support
        let hasUnread = false;
        conversation.messages.forEach(msg => {
            if (msg.sender === 'support' && !msg.isRead) {
                msg.isRead = true;
                hasUnread = true;
            }
        });

        if (hasUnread) {
            await conversation.save();
        }

        res.status(200).json({ success: true, messages: conversation.messages, status: conversation.status });
    } catch (error) {
        throw error;
    }
};

// API lấy danh sách toàn bộ các đoạn chat (Dành cho Admin/Staff)
exports.getAllConversations = async (req, res) => {
    try {
        // Sắp xếp: có tin nhắn mới của admin (hasUnreadAdmin = true) lên đầu, sau đó xếp theo thời gian
        const conversations = await ChatConversation.find()
            .sort({ hasUnreadAdmin: -1, updatedAt: -1 })
            .select('-messages'); // Không load toàn bộ tin nhắn để nhẹ payload

        res.status(200).json({ success: true, data: conversations });
    } catch (error) {
        throw error;
    }
};

// API lấy chi tiết 1 đoạn chat (Dành cho Admin/Staff)
exports.getConversationById = async (req, res) => {
    try {
        const conversation = await ChatConversation.findById(req.params.id);
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiên chat' });
        }
        res.status(200).json({ success: true, data: conversation });
    } catch (error) {
        throw error;
    }
};

// API đánh dấu đã đọc bởi Admin/Staff
exports.markConversationAsRead = async (req, res) => {
    try {
        const conversation = await ChatConversation.findById(req.params.id);
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiên chat' });
        }
        
        conversation.hasUnreadAdmin = false;
        await conversation.save();

        res.status(200).json({ success: true });
    } catch (error) {
        throw error;
    }
};
