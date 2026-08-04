import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig'; // Sử dụng axios config chung của dự án
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast'; // Sử dụng toast cho thống nhất

import PromotionalBanner from '../../components/features/PromotionalBanner'; // 1. Import banner component
// --- Component Skeleton Loading cho thẻ Voucher ---
const CouponSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-lg flex flex-col relative animate-pulse">
        {/* Giả lập các vết cắt */}
        <div className="absolute top-2/3 -translate-y-1/2 -left-4 w-8 h-8 rounded-full bg-slate-50"></div>
        <div className="absolute top-2/3 -translate-y-1/2 -right-4 w-8 h-8 rounded-full bg-slate-50"></div>

        {/* Phần nội dung trên */}
        <div className="p-6">
            <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-slate-200 rounded-xl flex-shrink-0"></div>
                <div className="flex-1 mt-1">
                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-2.5"></div>
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                </div>
            </div>
            <div className="mt-4 h-9 bg-slate-100 rounded-lg"></div>
        </div>

        {/* Phần nội dung dưới */}
        <div className="p-6 flex items-center justify-between gap-4 border-t-2 border-dashed border-slate-200">
            <div className="h-10 bg-slate-300 rounded-lg w-full"></div>
        </div>
    </div>
);

const Promotions = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savedVoucherIds, setSavedVoucherIds] = useState(new Set()); // State để lưu ID các voucher đã lưu
    const navigate = useNavigate();
    const location = useLocation();

    // Lấy token từ localStorage để xác định trạng thái đăng nhập
    const token = localStorage.getItem('token'); 

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                // Gọi API lấy danh sách Coupon đang hoạt động
                const couponsRes = await axios.get('/coupons'); 
                setCoupons(couponsRes.data);

                // Nếu người dùng đã đăng nhập, lấy danh sách voucher họ đã lưu
                if (token) {
                    const myVouchersRes = await axios.get('/vouchers/my-vouchers');
                    // Tạo một Set chứa ID của các coupon đã lưu để kiểm tra nhanh hơn
                    const ids = new Set(myVouchersRes.data.map(uv => uv.coupon._id));
                    setSavedVoucherIds(ids);
                }

            } catch (error) {
                console.error('Lỗi khi tải dữ liệu khuyến mãi:', error);
                toast.error('Không thể tải danh sách khuyến mãi.');
            } finally {
                setLoading(false);
            }
        };
        fetchCoupons();
    }, [token]); // Thêm token vào dependency array để fetch lại khi trạng thái đăng nhập thay đổi

    const handleSaveVoucher = async (couponId) => {
        // Lớp bảo vệ 1: Chặn người dùng chưa đăng nhập
        if (!token) {
            // Hiện thông báo lỗi
            toast.error('Vui lòng đăng nhập để lưu mã vào ví của bạn!');
            
            // Đợi một chút cho người dùng đọc thông báo rồi mới chuyển trang
            setTimeout(() => {
                // Chuyển hướng sang trang Login, lưu lại đường dẫn hiện tại (from) và gửi thông báo
                navigate('/login', { state: { from: location.pathname, message: 'Vui lòng đăng nhập để lưu mã khuyến mãi.' } });
            }, 1500);
            return;
        }

        // Lớp bảo vệ 2: Gọi API lưu mã
        try {
            // axiosConfig đã tự động đính kèm token
            await axios.post('/vouchers/save', { couponId });
            // Thông báo lưu thành công
            toast.success('Lưu mã thành công! Đã thêm vào Ví Voucher.');
            // Cập nhật UI ngay lập tức: thêm ID của voucher vừa lưu vào state
            setSavedVoucherIds(prevIds => new Set(prevIds).add(couponId));
        } catch (error) {
            // Lớp bảo vệ 3: Bắt lỗi từ Backend (ví dụ: mã đã lưu, mã không tồn tại)
            const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu mã.';
            // Hiện thông báo lỗi
            toast.error(errorMsg);
        }
    };

    // Giao diện khi đang gọi API
    if (loading) {
        return ( // Thay thế spinner bằng Skeleton Loading
            <div className="bg-slate-50 min-h-screen">
                <div className="container mx-auto px-4 py-12">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-black text-red-600 mb-3 uppercase tracking-wide">🔥 Siêu Khuyến Mãi 🔥</h1>
                        <p className="text-gray-500 text-lg">Săn ngay các mã giảm giá hấp dẫn nhất từ DUALEOFOOD</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                        {Array.from({ length: 6 }).map((_, index) => <CouponSkeleton key={index} />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="container mx-auto px-4 py-12">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-black text-sky-600 mb-3 uppercase tracking-wide">✨ Siêu Khuyến Mãi ✨</h1>
                    <p className="text-gray-500 text-lg">Săn ngay các mã giảm giá hấp dẫn nhất từ DUALEOFOOD</p>
                </div>

                {/* 2. Sử dụng component banner đã tách */}
                <div className="mb-16">
                    <PromotionalBanner />
                </div>
                
                {coupons.length === 0 ? (
                    <div className="text-center text-gray-500 bg-white py-16 rounded-2xl shadow-sm border border-dashed">
                        Hiện tại chưa có chiến dịch khuyến mãi nào. Bạn vui lòng quay lại sau nhé!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                        {coupons.map((coupon) => {
                            const isSaved = savedVoucherIds.has(coupon._id);

                            return (
                                <div key={coupon._id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col relative group">
                                    {/* Vết cắt bán nguyệt */}
                                    <div className="absolute top-2/3 -translate-y-1/2 -left-4 w-8 h-8 rounded-full bg-slate-50"></div>
                                    <div className="absolute top-2/3 -translate-y-1/2 -right-4 w-8 h-8 rounded-full bg-slate-50"></div>

                                    {/* Phần nội dung trên */}
                                    <div className="p-6 flex-1">
                                        <div className="flex items-start gap-4">
                                            <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-blue-100 flex flex-col items-center justify-center rounded-xl text-sky-600 flex-shrink-0">
                                                <span className="text-2xl font-black leading-none">{coupon.discountPercent}</span>
                                                <span className="text-xs font-bold leading-none">%</span>
                                                <span className="text-[10px] font-bold leading-none mt-0.5">OFF</span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800">Giảm {coupon.discountPercent}%</h3>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    Tối đa <span className="font-semibold text-slate-700">{coupon.maxDiscountAmount.toLocaleString('vi-VN')}đ</span> cho đơn từ <span className="font-semibold text-slate-700">{coupon.minOrderValue.toLocaleString('vi-VN')}đ</span>.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-4 text-xs text-slate-500 font-medium bg-slate-100 p-2.5 rounded-lg flex items-center gap-2 border border-slate-200">
                                            <span className="text-base">⏰</span>
                                            Hạn sử dụng: {new Date(coupon.expiryDate).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>
                                    
                                    {/* Phần nội dung dưới với đường viền đứt nét */}
                                    <div className="p-6 flex items-center justify-between gap-4 border-t-2 border-dashed border-slate-200">
                                        <p className="font-mono font-bold text-sky-600 text-base bg-sky-50 border border-sky-100 px-4 py-2 rounded-lg">{coupon.code}</p>
                                        <button 
                                            onClick={() => handleSaveVoucher(coupon._id)}
                                            disabled={isSaved}
                                            className={`font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-md active:scale-95
                                                ${isSaved 
                                                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                                                    : 'bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:shadow-lg hover:shadow-sky-500/30 hover:from-sky-600 hover:to-blue-600'
                                                }`
                                            }
                                        >
                                            {isSaved ? 'Đã lưu' : 'Lưu'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Promotions;