const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');
const http = require('http'); // 1. Import http
const { Server } = require("socket.io"); // 2. Import Server từ socket.io
const jwt = require('jsonwebtoken'); // 3. Import jwt để giải mã token
const cron = require('node-cron'); // Import node-cron
const connectDB = require('./src/config/db');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');


// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const couponRoutes = require('./src/routes/couponRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const settingRoutes = require('./src/routes/settingRoutes'); // Import route cài đặt
const categoryRoutes = require('./src/routes/categoryRoutes'); // Import category routes
const userRoutes = require('./src/routes/userRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const userVoucherRoutes = require('./src/routes/userVoucherRoutes');
const activityLogRoutes = require('./src/routes/activityLogRoutes'); // Route nhật ký hoạt động
const chatRoutes = require('./src/routes/chatRoutes'); // Route cho Live Chat
const bannerRoutes = require('./src/routes/bannerRoutes'); // Route cho Banners
const articleRoutes = require('./src/routes/articleRoutes'); // Route cho Blog/Bài viết
const storyRoutes = require('./src/routes/storyRoutes'); // Route cho Story 24h

// Import Models cho cron job và socket
const Order = require('./src/models/Order');
const Setting = require('./src/models/Setting');
const ChatConversation = require('./src/models/ChatConversation');
const aiService = require('./src/services/aiService'); // Import AI Service

connectDB();

const app = express();

// --- TÍCH HỢP SOCKET.IO ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Cho phép tất cả các nguồn
        methods: ["GET", "POST"]
    }
});

// Middleware xác thực của Socket.IO
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        // Nếu không có token, vẫn cho kết nối nhưng không làm gì cả
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dualeofood_secret');

        // Gán thông tin user vào socket để sử dụng ở các sự kiện khác nếu cần
        socket.user = decoded;

        // Cho mỗi người dùng vào một "phòng" riêng theo ID để nhận thông báo cá nhân
        socket.join(decoded.id.toString());

        // Admin và Staff đều vào phòng admin_room để nhận thông báo đơn hàng
        if (decoded.role === 'admin' || decoded.role === 'staff') {
            socket.join('admin_room');
        }
        next(); // Chỉ gọi next() khi token hợp lệ
    } catch (error) {
        // Nếu token không hợp lệ, từ chối kết nối
        next(new Error('Authentication error'));
    }
});

// Danh sách lưu trữ bộ đếm thời gian cho mỗi cuộc hội thoại
const chatTimeouts = new Map();

const { emitAdminPendingCounts } = require('./src/utils/adminRealtime');

// Xử lý sự kiện Socket.io
io.on('connection', (socket) => {
    // Nếu là admin hoặc staff kết nối, gửi ngay số liệu công việc cần duyệt
    if (socket.user && (socket.user.role === 'admin' || socket.user.role === 'staff')) {
        emitAdminPendingCounts(io);
    }

    // 1. Khách hàng join phòng chat của riêng họ
    socket.on('join_chat', ({ guestId, userId }) => {
        const room = userId ? `chat_user_${userId}` : `chat_guest_${guestId}`;
        socket.join(room);
    });

    // 2. Khách hàng gửi tin nhắn
    socket.on('customer_send_message', async (data) => {
        const { guestId, userId, customerName, content } = data;

        try {
            let conversation = null;

            if (userId) {
                // 1. Tìm theo userId trước
                conversation = await ChatConversation.findOne({ userId });

                // 2. Nếu chưa có, kiểm tra xem có phiên guest (chưa thuộc về userId khác) hay không
                if (!conversation && guestId) {
                    conversation = await ChatConversation.findOne({
                        guestId,
                        $or: [{ userId: null }, { userId: { $exists: false } }]
                    });
                    if (conversation) {
                        conversation.userId = userId;
                    }
                }

                // 3. Nếu vẫn không có, tạo mới cho userId
                if (!conversation) {
                    conversation = new ChatConversation({
                        guestId: guestId || null,
                        userId: userId,
                        customerName: customerName || 'Khách hàng',
                        status: 'active'
                    });
                }
            } else {
                // Dành cho Guest vãng lai
                if (guestId) {
                    conversation = await ChatConversation.findOne({
                        guestId,
                        $or: [{ userId: null }, { userId: { $exists: false } }]
                    });
                }

                if (!conversation) {
                    conversation = new ChatConversation({
                        guestId: guestId || null,
                        userId: null,
                        customerName: customerName || 'Khách hàng',
                        status: 'active'
                    });
                }
            }

            // Cập nhật thông tin bổ sung nếu cần
            if (customerName && customerName !== 'Khách hàng') {
                conversation.customerName = customerName;
            }

            if (conversation.status === 'closed') {
                conversation.status = 'active'; // Mở lại nếu đã đóng
            }

            const newMessage = {
                sender: 'customer',
                content: content,
                isRead: false
            };

            conversation.messages.push(newMessage);
            conversation.hasUnreadAdmin = true;
            await conversation.save();

            const savedMessage = conversation.messages[conversation.messages.length - 1];

            // Broadcast tin nhắn cho các tab khác của khách hàng (trừ tab gửi)
            const room = userId ? `chat_user_${userId}` : `chat_guest_${guestId}`;
            socket.broadcast.to(room).emit('receive_message', savedMessage);

            // Báo cho Admin/Staff biết có tin nhắn mới
            io.to('admin_room').emit('new_chat_message', {
                conversationId: conversation._id,
                customerName: conversation.customerName,
                message: savedMessage
            });
            emitAdminPendingCounts(io);

            // --- TÍCH HỢP AI CHATBOT (10 GIÂY) ---
            // Xóa bộ đếm cũ nếu có
            if (chatTimeouts.has(conversation._id.toString())) {
                clearTimeout(chatTimeouts.get(conversation._id.toString()));
            }

            // Đặt bộ đếm mới (10 giây = 10000ms)
            const timeoutId = setTimeout(async () => {
                console.log(`[AI] Bắt đầu trả lời tự động cho hội thoại ${conversation._id}`);
                try {
                    // Gọi AI lấy câu trả lời
                    const aiReply = await aiService.generateAutoReply(content);

                    // Lưu câu trả lời của AI vào Database
                    const aiMessage = {
                        sender: 'ai', // Dùng 'ai' để phân biệt với support
                        content: aiReply,
                        isRead: false
                    };

                    // Nạp lại conversation từ DB để tránh lỗi version
                    const currentConv = await ChatConversation.findById(conversation._id);
                    if (currentConv) {
                        currentConv.messages.push(aiMessage);
                        // Khi AI trả lời, vẫn giữ hasUnreadAdmin = true để Admin biết cần xem lại
                        await currentConv.save();

                        const savedAiMessage = currentConv.messages[currentConv.messages.length - 1];

                        // Gửi tin nhắn của AI tới khách hàng
                        io.to(room).emit('receive_message', savedAiMessage);

                        // Gửi tin nhắn của AI tới Admin/Staff để hiển thị trên Dashboard
                        io.to('admin_room').emit('receive_message', {
                            conversationId: currentConv._id,
                            message: savedAiMessage
                        });
                    }
                } catch (aiError) {
                    console.error('Lỗi khi AI trả lời tự động:', aiError);
                } finally {
                    chatTimeouts.delete(conversation._id.toString());
                }
            }, 10000); // 10 giây

            // Lưu id của bộ đếm vào Map
            chatTimeouts.set(conversation._id.toString(), timeoutId);
            // --- KẾT THÚC TÍCH HỢP AI ---

        } catch (error) {
            console.error('Lỗi khi lưu tin nhắn:', error);
        }
    });

    // 3. Admin/Staff gửi phản hồi (Sẽ code ở bước sau khi làm giao diện Admin)
    socket.on('support_send_message', async (data) => {
        const { conversationId, content } = data;
        try {
            const conversation = await ChatConversation.findById(conversationId);
            if (conversation) {
                const newMessage = {
                    sender: 'support',
                    content: content,
                    isRead: false
                };
                conversation.messages.push(newMessage);
                conversation.hasUnreadAdmin = false;
                await conversation.save();

                const savedMessage = conversation.messages[conversation.messages.length - 1];

                // Báo lại cho toàn bộ admin/staff (để đồng bộ nhiều màn hình admin)
                io.to('admin_room').emit('receive_message', { conversationId, message: savedMessage });
                emitAdminPendingCounts(io);

                // Gửi tin nhắn đến khách hàng
                const room = conversation.userId ? `chat_user_${conversation.userId}` : `chat_guest_${conversation.guestId}`;
                io.to(room).emit('receive_message', savedMessage);

                // --- HỦY BỘ ĐẾM AI KHI ADMIN ĐÃ TRẢ LỜI ---
                const convIdStr = conversationId.toString();
                if (chatTimeouts.has(convIdStr)) {
                    clearTimeout(chatTimeouts.get(convIdStr));
                    chatTimeouts.delete(convIdStr);
                    console.log(`[AI] Đã hủy trả lời tự động cho hội thoại ${convIdStr}`);
                }
            }
        } catch (error) {
            console.error('Lỗi khi gửi phản hồi:', error);
        }
    });
});

app.use((req, res, next) => { req.io = io; next(); });

app.use(cors());
app.use(express.json());

// Cắm các Route vào hệ thống
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes); // Sử dụng category routes
app.use('/api/settings', settingRoutes); // Thêm route cài đặt
app.use('/api/notifications', notificationRoutes);
app.use('/api/vouchers', userVoucherRoutes);
app.use('/api/activity-logs', activityLogRoutes); // Đăng ký route nhật ký hoạt động
app.use('/api/chats', chatRoutes); // Route cho Live Chat
app.use('/api/banners', bannerRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/stories', storyRoutes);

// --- Không còn phục vụ ảnh tĩnh cục bộ vì đã dùng Cloudinary ---

// --- CRON JOB TỰ ĐỘNG XÓA ĐƠN HÀNG CŨ ---
// Tác vụ sẽ chạy vào 2:00 sáng mỗi ngày
cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Chạy tác vụ dọn dẹp đơn hàng cũ hàng ngày...');
    try {
        const setting = await Setting.findOne({ key: 'orderSettings' });

        // Chỉ chạy nếu cài đặt được bật
        if (setting && setting.value.autoDelete.enabled) {
            const days = setting.value.autoDelete.deleteAfterDays;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const result = await Order.deleteMany({
                status: 'COMPLETED',
                createdAt: { $lte: cutoffDate } // Xóa các đơn hàng đã hoàn thành và cũ hơn ngày giới hạn
            });

            if (result.deletedCount > 0) {
                console.log(`✅ Đã tự động xóa ${result.deletedCount} đơn hàng hoàn thành cũ.`);
            } else {
                console.log('ℹ️ Không có đơn hàng cũ nào để xóa.');
            }
        } else {
            console.log('ℹ️ Tính năng tự động xóa đơn hàng đang tắt. Bỏ qua.');
        }
    } catch (error) {
        console.error('❌ Lỗi trong quá trình dọn dẹp đơn hàng cũ:', error);
    }
}, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh"
});

app.get('/', (req, res) => {
    res.send('API Hệ thống Bán đồ ăn đang hoạt động!');
});

// Middleware xử lý lỗi
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Dùng server.listen thay cho app.listen
server.listen(PORT, () => {
    console.log(`🚀 Server đang chạy trên cổng ${PORT}`);
});
