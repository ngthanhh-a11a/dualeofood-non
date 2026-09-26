const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const UserVoucher = require('../models/UserVoucher');
const ActivityLog = require('../models/ActivityLog'); // Import model nhật ký hoạt động
const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');
const { emitAdminPendingCounts } = require('../utils/adminRealtime');

// [POST] Tạo đơn hàng mới (Dành cho Customer đã đăng nhập)
exports.createOrder = async (req, res) => {
    try {
        const { items, paymentMethod, userVoucherId, couponCode, customerInfo, shippingFee = 0 } = req.body;
        let totalAmount = 0;
        const orderItems = [];

        // Tối ưu hóa: Lấy tất cả sản phẩm trong 1 lần gọi DB
        const productIds = items.map(item => item.id);
        const productsFromDB = await Product.find({ _id: { $in: productIds } });

        // Tạo một map để truy cập sản phẩm nhanh hơn
        const productMap = new Map(productsFromDB.map(p => [p._id.toString(), p]));

        // Lặp qua các sản phẩm trong giỏ hàng để tính toán
        for (const item of items) {
            const product = productMap.get(item.id);

            if (!product) {
                return res.status(404).json({ message: `Sản phẩm với ID: ${item.id} không tồn tại.` });
            }

            totalAmount += product.price * item.quantity;

            orderItems.push({
                product: product._id,
                quantity: item.quantity,
                price: product.price // Lưu lại giá chốt tại thời điểm mua
            });
        }

        // --- START: LOGIC XỬ LÝ VOUCHER ---
        let calculatedDiscount = 0;
        let appliedUserVoucher = null; // Voucher từ ví của người dùng
        let appliedCouponObject = null; // Coupon object (từ ví hoặc nhập tay)

        if (userVoucherId) {
            // Tìm voucher trong ví của người dùng
            appliedUserVoucher = await UserVoucher.findOne({
                _id: userVoucherId,
                user: req.user.id,
                isUsed: false
            }).populate('coupon');

            if (!appliedUserVoucher) {
                return res.status(400).json({ message: 'Voucher không hợp lệ hoặc đã được sử dụng.' });
            }
            appliedCouponObject = appliedUserVoucher.coupon;

        } else if (couponCode) {
            // Nếu không có userVoucherId, kiểm tra xem có couponCode không (trường hợp nhập tay)
            appliedCouponObject = await Coupon.findOne({ code: couponCode, isActive: true });
            if (!appliedCouponObject) {
                return res.status(404).json({ message: 'Mã voucher không tồn tại hoặc đã hết hiệu lực.' });
            }
        }

        // Nếu có một coupon được áp dụng (bằng cách này hay cách khác), hãy xác thực nó
        if (appliedCouponObject) {
            // Kiểm tra điều kiện voucher lần cuối ở server để đảm bảo an toàn
            if (new Date() > new Date(appliedCouponObject.expiryDate)) {
                return res.status(400).json({ message: 'Rất tiếc, voucher đã hết hạn.' });
            }
            if (totalAmount < appliedCouponObject.minOrderValue) {
                return res.status(400).json({ message: `Đơn hàng chưa đạt giá trị tối thiểu để dùng voucher này.` });
            }
            // Chỉ kiểm tra giới hạn nếu nó được thiết lập (không phải null)
            if (appliedCouponObject.usageLimit !== null && appliedCouponObject.usageCount >= appliedCouponObject.usageLimit) {
                return res.status(400).json({ message: 'Mã voucher đã hết lượt sử dụng.' });
            }

            // Tính toán lại số tiền giảm giá ở server để đảm bảo an toàn
            const discountFromCoupon = Math.min(
                totalAmount * (appliedCouponObject.discountPercent / 100),
                appliedCouponObject.maxDiscountAmount
            );
            calculatedDiscount = Math.round(discountFromCoupon);
        }
        // --- END: LOGIC XỬ LÝ VOUCHER ---

        // Xác định trạng thái ban đầu dựa trên phương thức thanh toán
        const initialStatus = paymentMethod === 'QR_CODE' ? 'AWAITING_PAYMENT' : 'PENDING';

        const finalAmount = totalAmount + shippingFee - calculatedDiscount;

        const newOrder = new Order({
            user: req.user.id, // Lấy ID từ token (middleware verifyToken cung cấp)
            items: orderItems,
            totalAmount,
            discountAmount: calculatedDiscount, // Sử dụng số tiền giảm giá đã được tính toán an toàn
            shippingFee,
            finalAmount,
            paymentMethod,
            customerInfo,
            status: initialStatus // Gán trạng thái ban đầu
        });

        await newOrder.save();

        // Nếu voucher được lấy từ ví, đánh dấu nó là đã sử dụng
        if (appliedUserVoucher) {
            appliedUserVoucher.isUsed = true;
            appliedUserVoucher.usedAt = new Date();
            await appliedUserVoucher.save();
        } 
        
        // Luôn tăng số lượt đã sử dụng của mã giảm giá gốc để cập nhật trên trang quản trị
        if (appliedCouponObject) {
            appliedCouponObject.usageCount += 1;
            await appliedCouponObject.save();
        }

        // --- START: GỬI THÔNG BÁO CHUYÊN NGHIỆP CHO KHÁCH HÀNG ---
        const notificationTitle = "🎉 Đặt hàng thành công!";
        const notificationContent = `Cảm ơn bạn đã tin tưởng DUALEOFOOD. Đơn hàng #${newOrder._id.toString().slice(-6)} của bạn đã được tiếp nhận và sẽ sớm được xử lý.`;

        const newNotification = await Notification.create({
            user: newOrder.user,
            title: notificationTitle,
            content: notificationContent,
            type: 'ORDER_UPDATE',
            orderId: newOrder._id
        });

        // Bắn tín hiệu real-time cho khách hàng để hiển thị chuông báo
        req.io.to(newOrder.user.toString()).emit('new_notification', newNotification);
        // --- END: GỬI THÔNG BÁO ---

        // Lấy thông tin chi tiết của đơn hàng vừa tạo để gửi đi
        const detailedOrder = await Order.findById(newOrder._id).populate('items.product', 'name image');
        
        // Chỉ thông báo cho admin đối với đơn hàng tiền mặt (trạng thái PENDING)
        // Đơn hàng QR sẽ được thông báo sau khi admin xác nhận thanh toán
        if (initialStatus === 'PENDING') {
            req.io.to('admin_room').emit('new_order', detailedOrder);
            const pendingCount = await Order.countDocuments({ status: 'PENDING' });
            req.io.to('admin_room').emit('update_pending_orders_count', pendingCount);
            emitAdminPendingCounts(req.io);
            // Thông báo cho dashboard cập nhật real-time
            req.io.to('admin_room').emit('dashboard_updated');
        }

        res.status(201).json({ message: 'Đặt hàng thành công!', order: detailedOrder });
    } catch (error) {
        throw error;
    }
};

// [GET] Admin xem toàn bộ đơn hàng
exports.getAllOrders = async (req, res) => {
    try {
        // Thêm logic phân trang
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Mặc định 10 đơn/trang
        const skip = (page - 1) * limit;

        // Thêm logic lọc theo trạng thái và thời gian
        const { status, startDate, endDate } = req.query;
        const filterQuery = {};
        if (status && status !== 'ALL') {
            filterQuery.status = status;
        }
        if (startDate && endDate) {
            filterQuery.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Đếm tổng số đơn hàng khớp với bộ lọc
        const totalOrders = await Order.countDocuments(filterQuery);

        // Lấy danh sách đơn hàng đã được lọc và phân trang
        const orders = await Order.find(filterQuery)
            .sort({ createdAt: -1 }) // Tự động đẩy đơn mới nhất lên đầu danh sách
            .skip(skip)
            .limit(limit)
            .populate('items.product', 'name image'); // Populate để lấy thông tin sản phẩm

        res.status(200).json({ orders, totalOrders, currentPage: page, totalPages: Math.ceil(totalOrders / limit) });
    } catch (error) {
        throw error;
    }
};

// [GET] Lấy danh sách đơn hàng của một User cụ thể (Dành cho Admin/Staff)
exports.getOrdersByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const orders = await Order.find({ user: userId })
            .sort({ createdAt: -1 })
            .populate('items.product', 'name image');

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        throw error;
    }
};

// [GET] Khách hàng xem đơn hàng của mình
exports.getMyOrders = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const { findOrderId, status, search, sort } = req.query;

        const baseUserQuery = { user: req.user.id };
        const filterQuery = { user: req.user.id };

        // Lọc theo trạng thái nếu có
        if (status && status !== 'ALL') {
            filterQuery.status = status;
        }

        // Lọc theo từ khóa tìm kiếm (mã đơn) nếu có
        if (search && search.trim()) {
            const cleanSearch = search.trim();
            if (mongoose.Types.ObjectId.isValid(cleanSearch)) {
                filterQuery._id = cleanSearch;
            } else {
                // Cho phép tìm kiếm theo đuôi mã đơn hàng hoặc ký tự trong ID
                filterQuery.$expr = {
                    $regexMatch: {
                        input: { $toString: '$_id' },
                        regex: cleanSearch,
                        options: 'i'
                    }
                };
            }
        }

        // Thống kê tổng quan đơn hàng cho user
        const allUserOrders = await Order.find(baseUserQuery).select('status finalAmount createdAt').lean();
        const totalUserOrders = allUserOrders.length;

        const stats = {
            totalOrders: totalUserOrders,
            pendingCount: 0,
            processingCount: 0,
            deliveringCount: 0,
            completedCount: 0,
            cancelledCount: 0,
            activeCount: 0,
            totalSpent: 0,
            statusCounts: {
                ALL: totalUserOrders,
                PENDING: 0,
                PROCESSING: 0,
                DELIVERING: 0,
                COMPLETED: 0,
                CANCELLED: 0
            }
        };

        allUserOrders.forEach(o => {
            if (stats.statusCounts[o.status] !== undefined) {
                stats.statusCounts[o.status] += 1;
            }
            if (o.status === 'PENDING') stats.pendingCount++;
            if (o.status === 'PROCESSING') stats.processingCount++;
            if (o.status === 'DELIVERING') stats.deliveringCount++;
            if (o.status === 'COMPLETED') {
                stats.completedCount++;
                stats.totalSpent += (o.finalAmount || 0);
            }
            if (o.status === 'CANCELLED') stats.cancelledCount++;
            if (['PENDING', 'PROCESSING', 'DELIVERING'].includes(o.status)) {
                stats.activeCount++;
            }
        });

        // Nếu có yêu cầu tìm trang của một đơn hàng cụ thể
        if (findOrderId && mongoose.Types.ObjectId.isValid(findOrderId)) {
            const allFilteredOrderIds = await Order.find(filterQuery).sort({ createdAt: -1 }).select('_id').lean();
            const orderIndex = allFilteredOrderIds.findIndex(order => order._id.toString() === findOrderId);
            if (orderIndex !== -1) {
                page = Math.floor(orderIndex / limit) + 1;
            }
        }

        const skip = (page - 1) * limit;
        const totalOrders = await Order.countDocuments(filterQuery);

        // Xử lý sắp xếp
        let sortOption = { createdAt: -1 };
        if (sort === 'oldest') sortOption = { createdAt: 1 };
        if (sort === 'highest') sortOption = { finalAmount: -1 };
        if (sort === 'lowest') sortOption = { finalAmount: 1 };

        const orders = await Order.find(filterQuery)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .populate('items.product', 'name image price');

        // Lấy danh sách ID các sản phẩm mà người dùng này đã đánh giá
        const reviewedProducts = await Product.find({ 'reviews.user': req.user.id }, '_id');
        const reviewedProductIds = reviewedProducts.map(p => p._id.toString());

        res.status(200).json({
            orders,
            totalOrders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit) || 1,
            reviewedProductIds,
            stats
        });
    } catch (error) {
        console.error('Lỗi khi lấy đơn hàng của user:', error);
        res.status(500).json({ message: 'Lỗi server khi tải dữ liệu đơn hàng.', error: error.message });
    }
};

// [PUT] Cập nhật trạng thái đơn hàng (Admin + Staff)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // === RBAC: Giới hạn trạng thái cho Staff ===
        // Staff chỉ được chuyển trạng thái đi tới, KHÔNG được hủy đơn
        const STAFF_ALLOWED_STATUSES = ['PROCESSING', 'DELIVERING', 'COMPLETED'];
        if (req.user.role === 'staff' && !STAFF_ALLOWED_STATUSES.includes(status)) {
            return res.status(403).json({ 
                message: 'Nhân viên không có quyền chuyển đơn hàng sang trạng thái này.' 
            });
        }

        // Lấy đơn hàng trước để lưu trạng thái cũ cho Activity Log
        const orderBefore = await Order.findById(id);
        if (!orderBefore) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng!' });
        }
        const oldStatus = orderBefore.status;

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { status },
            { returnDocument: 'after' }
        );

        // --- START: GHI NHẬT KÝ HOẠT ĐỘNG (Activity Log) ---
        await ActivityLog.create({
            user: req.user.id,
            action: 'UPDATE_ORDER_STATUS',
            description: `Cập nhật đơn hàng #${id.toString().slice(-6)} từ ${oldStatus} → ${status}`,
            targetModel: 'Order',
            targetId: id,
            metadata: { oldStatus, newStatus: status }
        });
        // --- END: GHI NHẬT KÝ ---

        // --- START: TÍCH HỢP GỬI THÔNG BÁO CHO KHÁCH HÀNG ---
        if (['PROCESSING', 'DELIVERING', 'COMPLETED', 'CANCELLED'].includes(updatedOrder.status)) {
            const statusMap = {
                PROCESSING: 'Đang chuẩn bị',
                DELIVERING: 'Đang giao',
                COMPLETED: 'Hoàn thành',
                CANCELLED: 'Đã hủy'
            };

            let title = 'Cập nhật đơn hàng';
            let content = `Đơn hàng #${updatedOrder._id.toString().slice(-6)} của bạn đã được cập nhật sang trạng thái: ${statusMap[updatedOrder.status]}.`;

            if (updatedOrder.status === 'DELIVERING') {
                title = '🛵 Đơn hàng đang đến!';
                content = 'Tài xế đang trên đường giao món ăn ngon đến cho bạn. Vui lòng chú ý điện thoại nhé!';
            } else if (updatedOrder.status === 'COMPLETED') {
                title = '✅ Giao hàng thành công';
                content = 'Chúc bạn ngon miệng với DUALEOFOOD! Đừng quên để lại đánh giá cho chúng tôi nhé.';
            } else if (updatedOrder.status === 'CANCELLED') {
                title = '❌ Đơn hàng đã bị hủy';
                content = `Rất tiếc, đơn hàng #${updatedOrder._id.toString().slice(-6)} của bạn đã bị hủy.`;
            }

            const newNotification = await Notification.create({
                user: updatedOrder.user,
                title: title,
                content: content,
                type: 'ORDER_UPDATE',
                orderId: updatedOrder._id
            });

            req.io.to(updatedOrder.user.toString()).emit('new_notification', newNotification);
        }
        // --- END: TÍCH HỢP GỬI THÔNG BÁO ---
        
        // Sau khi cập nhật, gửi lại số lượng đơn hàng đang chờ cho admin
        const pendingCount = await Order.countDocuments({ status: 'PENDING' });
        req.io.to('admin_room').emit('update_pending_orders_count', pendingCount);
        emitAdminPendingCounts(req.io);

        // Gửi thông báo cập nhật trạng thái đến khách hàng sở hữu đơn hàng này
        req.io.to(updatedOrder.user.toString()).emit('order_status_updated', updatedOrder);

        // Nếu trạng thái là COMPLETED hoặc CANCELLED, dashboard cần cập nhật
        if (status === 'COMPLETED' || status === 'CANCELLED') {
            req.io.to('admin_room').emit('dashboard_updated');
        }

        res.status(200).json({ message: 'Cập nhật thành công', order: updatedOrder });
    } catch (error) {
        throw error;
    }
};

// [PUT] Admin/Staff xác nhận thanh toán cho đơn hàng QR
exports.confirmOrderPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng!' });
        }

        // Chỉ cho phép xác nhận các đơn hàng đang chờ thanh toán
        if (order.status !== 'AWAITING_PAYMENT') {
            return res.status(400).json({ message: 'Đơn hàng không ở trạng thái chờ thanh toán.' });
        }

        // Cập nhật trạng thái sang "Chờ duyệt"
        order.status = 'PENDING';
        await order.save();

        // --- GHI NHẬT KÝ HOẠT ĐỘNG ---
        await ActivityLog.create({
            user: req.user.id,
            action: 'CONFIRM_PAYMENT',
            description: `Xác nhận thanh toán QR cho đơn hàng #${id.toString().slice(-6)}`,
            targetModel: 'Order',
            targetId: id,
            metadata: { paymentMethod: 'QR_CODE' }
        });

        const detailedOrder = await Order.findById(id).populate('items.product', 'name image');

        // 1. Gửi thông báo có đơn hàng mới cho admin/staff
        req.io.to('admin_room').emit('new_order', detailedOrder);

        // 2. Cập nhật lại số lượng đơn hàng đang chờ
        const pendingCount = await Order.countDocuments({ status: 'PENDING' });
        req.io.to('admin_room').emit('update_pending_orders_count', pendingCount);

        // 3. Gửi thông báo xác nhận thanh toán thành công cho khách hàng
        req.io.to(order.user.toString()).emit('payment_confirmed', detailedOrder);

        // 4. Thông báo cho dashboard cập nhật real-time
        req.io.to('admin_room').emit('dashboard_updated');

        res.status(200).json({ message: 'Xác nhận thanh toán thành công!', order: detailedOrder });
    } catch (error) {
        throw error;
    }
};

// [PUT] Khách hàng tự hủy đơn hàng của mình
exports.cancelMyOrder = async (req, res) => {
    try {
        const { id } = req.params; // Order ID
        const userId = req.user.id; // User ID from token

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng!' });
        }

        // Security check: Đảm bảo đơn hàng này thuộc về user đang yêu cầu
        if (order.user.toString() !== userId) {
            return res.status(403).json({ message: 'Bạn không có quyền hủy đơn hàng này!' });
        }

        // Chỉ cho phép hủy khi đơn hàng đang ở trạng thái "Chờ duyệt"
        if (order.status !== 'PENDING') {
            return res.status(400).json({ message: 'Không thể hủy đơn hàng ở trạng thái này.' });
        }

        // Cập nhật trạng thái
        order.status = 'CANCELLED';
        await order.save();

        // Gửi lại số lượng đơn hàng đang chờ cho admin sau khi hủy
        const pendingCount = await Order.countDocuments({ status: 'PENDING' });
        req.io.to('admin_room').emit('update_pending_orders_count', pendingCount);

        // Dashboard cũng cần cập nhật
        req.io.to('admin_room').emit('dashboard_updated');

        res.status(200).json({ message: 'Đã hủy đơn hàng thành công.', order });
    } catch (error) {
        throw error;
    }
};

// [GET] Thống kê Dashboard (Dành cho Admin)
exports.getDashboardStats = async (req, res) => {
    try {
        const { startDate: startDateStr, endDate: endDateStr } = req.query;

        let startDate, endDate;

        // Nếu có query, parse nó. Nếu không, mặc định là 30 ngày gần nhất.
        if (startDateStr && endDateStr) {
            startDate = new Date(startDateStr);
            startDate.setHours(0, 0, 0, 0); // Bắt đầu của ngày

            // Logic mới: endDate là 00:00:00 của ngày KẾ TIẾP
            endDate = new Date(endDateStr);
            endDate.setDate(endDate.getDate() + 1);
            endDate.setHours(0, 0, 0, 0);
        } else {
            // Mặc định là 30 ngày gần nhất
            endDate = new Date();
            endDate.setDate(endDate.getDate() + 1);
            endDate.setHours(0, 0, 0, 0);
            
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
        }

        // Xác định format gom nhóm và đơn vị thời gian dựa trên khoảng thời gian
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const timezone = "Asia/Ho_Chi_Minh"; // Sử dụng múi giờ Việt Nam

        let groupByFormat, groupByUnit;
        if (diffDays <= 2) { // Hiển thị theo giờ cho 2 ngày trở lại
            groupByFormat = "%H:00, %d/%m"; 
            groupByUnit = "hour";
        } else if (diffDays <= 62) { // Khoảng 2 tháng -> gom theo ngày
            groupByFormat = "%d/%m"; 
            groupByUnit = "day";
        } else if (diffDays <= 366) { // 1 năm -> gom theo tháng
            groupByFormat = "%m/%Y"; 
            groupByUnit = "month";
        } else { // Nhiều hơn 1 năm -> gom theo năm
            groupByFormat = "%Y"; 
            groupByUnit = "year";
        }

        const matchStage = {
            $match: {
                createdAt: { $gte: startDate, $lt: endDate }, // Sử dụng $lt thay cho $lte
                status: { $nin: ['CANCELLED', 'AWAITING_PAYMENT'] }
            }
        };

        const stats = await Order.aggregate([
            // Giai đoạn 1: Dùng $facet để chạy nhiều pipeline tính toán song song
            {
                $facet: {
                    // Pipeline tính các chỉ số tổng quan
                    "overallStats": [
                        matchStage, // Áp dụng bộ lọc
                        {
                            $group: {
                                _id: null,
                                totalRevenue: { $sum: "$finalAmount" },
                                totalOrders: { $sum: 1 },
                                couponsUsed: {
                                    $sum: { $cond: [{ $gt: ["$discountAmount", 0] }, 1, 0] }
                                }
                            }
                        }
                    ],
                    // Pipeline gom nhóm dữ liệu cho biểu đồ
                    "revenueData": [
                        matchStage, // Áp dụng bộ lọc
                        {
                            $group: {
                                _id: {
                                    $dateTrunc: {
                                        date: "$createdAt",
                                        unit: groupByUnit,
                                        timezone: timezone
                                    }
                                },
                                doanhThu: { $sum: "$finalAmount" }
                            }
                        },
                        { $sort: { "_id": 1 } },
                        {
                            $project: {
                                _id: 0,
                                name: { $dateToString: { format: groupByFormat, date: "$_id", timezone: timezone } },
                                doanhThu: "$doanhThu"
                            }
                        }
                    ],
                    // Pipeline tính các sản phẩm bán chạy nhất
                    "bestSellingProducts": [
                        matchStage, // Áp dụng bộ lọc
                        { $unwind: "$items" },
                        {
                            $group: {
                                _id: "$items.product",
                                totalSold: { $sum: "$items.quantity" }
                            }
                        },
                        { $sort: { totalSold: -1 } },
                        { $limit: 5 },
                        {
                            $lookup: {
                                from: "products",
                                localField: "_id",
                                foreignField: "_id",
                                as: "productInfo"
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                name: { $ifNull: [ { $arrayElemAt: ["$productInfo.name", 0] }, "Sản phẩm đã xóa" ] },
                                totalSold: "$totalSold"
                            }
                        }
                    ]
                }
            }
        ]);
        
        // Tính tổng số đơn hàng nói chung trong khoảng thời gian (bao gồm cả CANCELLED)
        const totalOrdersInDateRange = await Order.countDocuments({
             createdAt: { $gte: startDate, $lte: endDate } 
        });

        // Trích xuất kết quả từ aggregation
        const overall = stats[0].overallStats[0] || { totalRevenue: 0, totalOrders: 0, couponsUsed: 0 };
        const revenueData = stats[0].revenueData;
        const bestSellingProducts = stats[0].bestSellingProducts || [];

        res.status(200).json({
            totalRevenue: overall.totalRevenue,
            totalOrders: totalOrdersInDateRange, // Trả về tổng số đơn hàng (gồm cả hủy)
            couponsUsed: overall.couponsUsed,
            revenueData,
            bestSellingProducts
        });
    } catch (error) {
        throw error;
    }
};

// [GET] Lấy số lượng đơn hàng đang chờ duyệt (Tối ưu hóa)
exports.getPendingOrdersCount = async (req, res) => {
    try {
        const count = await Order.countDocuments({ status: 'PENDING' });
        res.status(200).json({ count });
    } catch (error) {
        throw error;
    }
};

// **Lưu ý:** Bạn cần export hàm mới `confirmOrderPayment` ở cuối file.