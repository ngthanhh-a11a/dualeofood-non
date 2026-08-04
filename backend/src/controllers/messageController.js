const Message = require('../models/Message');

// [POST] Khách hàng gửi tin nhắn
exports.createMessage = async (req, res) => {
    try {
        const { name, phone, content } = req.body;
        const newMessage = new Message({ name, phone, content });
        await newMessage.save();
        res.status(201).json({ message: 'Gửi tin nhắn thành công!' });
    } catch (error) {
        throw error;
    }
};

// [GET] Admin xem danh sách tin nhắn
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.status(200).json(messages);
    } catch (error) {
        throw error;
    }
};

// [PUT] Admin đánh dấu đã xem/chưa xem
exports.toggleReadStatus = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Không tìm thấy tin nhắn' });
        
        message.isRead = !message.isRead; // Đảo ngược trạng thái
        await message.save();
        
        res.status(200).json({ message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
        throw error;
    }
};

// [DELETE] Admin xóa tin nhắn
exports.deleteMessage = async (req, res) => {
    try {
        const deletedMessage = await Message.findByIdAndDelete(req.params.id);
        if (!deletedMessage) return res.status(404).json({ message: 'Không tìm thấy tin nhắn để xóa' });
        res.status(200).json({ message: 'Xóa tin nhắn thành công' });
    } catch (error) {
        throw error;
    }
};