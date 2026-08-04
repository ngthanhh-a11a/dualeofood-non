const Coupon = require('../models/Coupon');

// [POST] Kiểm tra mã giảm giá
exports.verifyCoupon = async (req, res) => {
    try {
        const { code, orderValue } = req.body;
        
        // Tìm mã giảm giá đang kích hoạt
        const coupon = await Coupon.findOne({ code, isActive: true });
        if (!coupon) {
            return res.status(404).json({ message: 'Mã giảm giá không tồn tại hoặc đã bị khóa!' });
        }

        // Kiểm tra hạn sử dụng
        if (new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ message: 'Mã giảm giá đã hết hạn!' });
        }

        // Kiểm tra giá trị biên (Boundary Value) - Đơn hàng có đủ điều kiện không?
        if (orderValue < coupon.minOrderValue) {
            return res.status(400).json({ 
                message: `Đơn hàng tối thiểu phải từ ${coupon.minOrderValue}đ để áp dụng mã này!` 
            });
        }

        res.status(200).json({ message: 'Áp dụng mã thành công!', coupon });
    } catch (error) {
        throw error;
    }
};

// ================= CÁC HÀM DÀNH CHO ADMIN =================

// [POST] Tạo mã giảm giá mới
exports.createCoupon = async (req, res) => {
    try {
        const { code, discountPercent, maxDiscountAmount, minOrderValue, expiryDate, isActive = true, usageLimit } = req.body;
        
        const existingCoupon = await Coupon.findOne({ code });
        if (existingCoupon) {
            return res.status(400).json({ message: 'Mã giảm giá này đã tồn tại!' });
        }

        const newCoupon = new Coupon({ 
            code: code.toUpperCase(), 
            discountPercent, 
            maxDiscountAmount, 
            minOrderValue, 
            expiryDate, 
            isActive,
            // Xử lý usageLimit: nếu giá trị là số > 0 thì gán, ngược lại gán null (không giới hạn)
            usageLimit: usageLimit && Number(usageLimit) > 0 ? Number(usageLimit) : null
        });
        await newCoupon.save();
        res.status(201).json({ message: 'Tạo mã giảm giá thành công!', coupon: newCoupon });
    } catch (error) {
        throw error;
    }
};

// [PUT] Cập nhật mã giảm giá
exports.updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, discountPercent, maxDiscountAmount, minOrderValue, expiryDate, isActive, usageLimit } = req.body;

        const coupon = await Coupon.findById(id);
        if (!coupon) return res.status(404).json({ message: 'Không tìm thấy mã giảm giá!' });

        coupon.code = code ? code.toUpperCase() : coupon.code;
        coupon.discountPercent = discountPercent ?? coupon.discountPercent;
        coupon.maxDiscountAmount = maxDiscountAmount ?? coupon.maxDiscountAmount;
        coupon.minOrderValue = minOrderValue ?? coupon.minOrderValue;
        coupon.expiryDate = expiryDate || coupon.expiryDate;
        coupon.isActive = isActive ?? coupon.isActive;
        coupon.usageLimit = usageLimit && Number(usageLimit) > 0 ? Number(usageLimit) : null;

        const updatedCoupon = await coupon.save();
        res.status(200).json({ message: 'Cập nhật thành công!', coupon: updatedCoupon });
    } catch (error) {
        throw error;
    }
};

// [GET] Lấy danh sách mã giảm giá
exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.status(200).json(coupons);
    } catch (error) {
        throw error;
    }
};

// [GET] Lấy chi tiết một mã giảm giá
exports.getCouponById = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ message: 'Không tìm thấy mã!' });
        res.status(200).json(coupon);
    } catch (error) {
        throw error;
    }
};

// [DELETE] Xóa mã giảm giá
exports.deleteCoupon = async (req, res) => {
    try {
        const deletedCoupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!deletedCoupon) return res.status(404).json({ message: 'Không tìm thấy mã!' });
        res.status(200).json({ message: 'Xóa thành công!' });
    } catch (error) {
        throw error;
    }
};