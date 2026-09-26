const ChatConversation = require('../models/ChatConversation');

// API lấy lịch sử chat (cho cả Guest và User)
exports.getChatHistory = async (req, res) => {
    try {
        const { guestId, userId } = req.query;
        let conversation = null;

        const hasUserId = userId && userId !== 'null' && userId !== 'undefined';
        const hasGuestId = guestId && guestId !== 'null' && guestId !== 'undefined';

        if (!hasUserId && !hasGuestId) {
            return res.status(400).json({ success: false, message: 'Missing userId or guestId' });
        }

        if (hasUserId) {
            // Đã đăng nhập: Ưu tiên tìm hội thoại gắn trực tiếp với userId này
            conversation = await ChatConversation.findOne({ userId }).sort({ updatedAt: -1 });

            // Nếu người dùng này chưa có hội thoại, kiểm tra nếu có phiên guest (chưa thuộc về userId nào khác)
            if (!conversation && hasGuestId) {
                const guestConv = await ChatConversation.findOne({
                    guestId,
                    $or: [{ userId: null }, { userId: { $exists: false } }]
                }).sort({ updatedAt: -1 });

                if (guestConv) {
                    guestConv.userId = userId;
                    await guestConv.save();
                    conversation = guestConv;
                }
            }
        } else if (hasGuestId) {
            // Khách vãng lai: Chỉ tìm hội thoại của guestId mà userId đang là null
            conversation = await ChatConversation.findOne({
                guestId,
                $or: [{ userId: null }, { userId: { $exists: false } }]
            }).sort({ updatedAt: -1 });
        }

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
        console.error("Lỗi khi lấy lịch sử chat:", error);
        res.status(500).json({ success: false, message: error.message });
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

        if (req.io) {
            const { emitAdminPendingCounts } = require('../utils/adminRealtime');
            emitAdminPendingCounts(req.io);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        throw error;
    }
};
