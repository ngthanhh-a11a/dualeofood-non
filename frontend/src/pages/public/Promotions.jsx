import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import PromotionalBanner from '../../components/features/PromotionalBanner';

// --- Skeleton Loading cho Voucher Card ---
const CouponSkeleton = () => (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
        <div className="p-6">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-100 rounded-xl flex-shrink-0"></div>
                <div className="flex-1">
                    <div className="h-5 bg-slate-100 rounded-lg w-3/4 mb-2.5"></div>
                    <div className="h-3.5 bg-slate-100 rounded-lg w-full"></div>
                </div>
            </div>
            <div className="mt-5 flex gap-2">
                <div className="h-7 bg-slate-50 rounded-lg w-24"></div>
                <div className="h-7 bg-slate-50 rounded-lg w-28"></div>
            </div>
        </div>
        <div className="px-6 py-4 border-t border-dashed border-slate-100 flex justify-between items-center">
            <div className="h-8 bg-slate-100 rounded-lg w-28"></div>
            <div className="h-10 bg-slate-100 rounded-xl w-20"></div>
        </div>
    </div>
);

// --- Component hiển thị countdown nhỏ gọn ---
const ExpiryCountdown = ({ expiryDate }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const calculate = () => {
            const now = new Date();
            const expiry = new Date(expiryDate);
            const diff = expiry - now;

            if (diff <= 0) {
                setTimeLeft('Đã hết hạn');
                setIsUrgent(true);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            if (days > 7) {
                setTimeLeft(`Còn ${days} ngày`);
                setIsUrgent(false);
            } else if (days > 0) {
                setTimeLeft(`Còn ${days}d ${hours}h`);
                setIsUrgent(days <= 2);
            } else {
                setTimeLeft(`Còn ${hours} giờ`);
                setIsUrgent(true);
            }
        };

        calculate();
        const interval = setInterval(calculate, 60000); // Cập nhật mỗi phút
        return () => clearInterval(interval);
    }, [expiryDate]);

    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${
            isUrgent 
                ? 'bg-red-50 text-red-600 border border-red-100' 
                : 'bg-slate-50 text-slate-500 border border-slate-100'
        }`}>
            <svg className={`w-3.5 h-3.5 ${isUrgent ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {timeLeft}
        </span>
    );
};

const Promotions = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savedVoucherIds, setSavedVoucherIds] = useState(new Set());
    const [savingId, setSavingId] = useState(null); // Track voucher đang được lưu
    const [copiedId, setCopiedId] = useState(null); // Track voucher vừa copy code
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const couponsRes = await axios.get('/coupons');
                setCoupons(couponsRes.data);

                if (token) {
                    const myVouchersRes = await axios.get('/vouchers/my-vouchers');
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
    }, [token]);

    const handleSaveVoucher = async (couponId) => {
        if (!token) {
            toast.error('Vui lòng đăng nhập để lưu mã vào ví của bạn!');
            setTimeout(() => {
                navigate('/login', { state: { from: location.pathname, message: 'Vui lòng đăng nhập để lưu mã khuyến mãi.' } });
            }, 1500);
            return;
        }

        setSavingId(couponId);
        try {
            await axios.post('/vouchers/save', { couponId });
            toast.success('Đã lưu vào Ví Voucher!');
            setSavedVoucherIds(prevIds => new Set(prevIds).add(couponId));
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu mã.';
            toast.error(errorMsg);
        } finally {
            setSavingId(null);
        }
    };

    const handleCopyCode = (code, couponId) => {
        navigator.clipboard.writeText(code);
        setCopiedId(couponId);
        toast.success(`Đã copy mã: ${code}`);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Tính phần trăm đã sử dụng
    const getUsagePercent = (coupon) => {
        if (!coupon.usageLimit) return null;
        return Math.round((coupon.usageCount / coupon.usageLimit) * 100);
    };

    // Loading state
    if (loading) {
        return (
            <div className="bg-slate-50/50 min-h-screen">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
                    {/* Header skeleton */}
                    <div className="text-center mb-12">
                        <div className="h-10 bg-slate-100 rounded-xl w-80 mx-auto mb-3 animate-pulse"></div>
                        <div className="h-5 bg-slate-100 rounded-lg w-96 mx-auto animate-pulse"></div>
                    </div>
                    {/* Banner skeleton */}
                    <div className="h-52 bg-slate-100 rounded-2xl mb-12 animate-pulse"></div>
                    {/* Cards skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Array.from({ length: 6 }).map((_, i) => <CouponSkeleton key={i} />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
                
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-100 text-sky-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                        Ưu đãi dành cho bạn
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
                        Khuyến Mãi & Voucher
                    </h1>
                    <p className="text-slate-500 mt-2 text-base max-w-lg mx-auto">
                        Lưu mã vào ví và áp dụng khi thanh toán để được giảm giá ngay
                    </p>
                </div>

                {/* Banner */}
                <div className="mb-12">
                    <PromotionalBanner />
                </div>

                {/* Stats bar */}
                {coupons.length > 0 && (
                    <div className="flex items-center justify-between mb-6 px-1">
                        <p className="text-sm text-slate-500 font-medium">
                            <span className="text-slate-800 font-bold">{coupons.length}</span> mã giảm giá đang hoạt động
                        </p>
                        {savedVoucherIds.size > 0 && (
                            <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Đã lưu {savedVoucherIds.size} mã
                            </p>
                        )}
                    </div>
                )}

                {/* Danh sách Voucher */}
                {coupons.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-1">Chưa có khuyến mãi</h3>
                        <p className="text-slate-400">Hiện tại chưa có chương trình nào. Quay lại sau nhé!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {coupons.map((coupon, index) => {
                            const isSaved = savedVoucherIds.has(coupon._id);
                            const isSaving = savingId === coupon._id;
                            const isCopied = copiedId === coupon._id;
                            const usagePercent = getUsagePercent(coupon);
                            const isAlmostGone = usagePercent && usagePercent >= 80;

                            return (
                                <div 
                                    key={coupon._id} 
                                    className={`group bg-white rounded-2xl border transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 relative overflow-hidden ${
                                        isSaved ? 'border-emerald-100' : 'border-slate-100 hover:border-slate-200'
                                    }`}
                                    style={{ animationDelay: `${index * 60}ms` }}
                                >
                                    {/* Badge đã lưu */}
                                    {isSaved && (
                                        <div className="absolute top-3 right-3 z-10">
                                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[11px] font-bold px-2 py-1 rounded-lg border border-emerald-100">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Đã lưu
                                            </span>
                                        </div>
                                    )}

                                    {/* Badge sắp hết */}
                                    {!isSaved && isAlmostGone && (
                                        <div className="absolute top-3 right-3 z-10">
                                            <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-[11px] font-bold px-2 py-1 rounded-lg border border-red-100 animate-pulse">
                                                🔥 Sắp hết
                                            </span>
                                        </div>
                                    )}

                                    {/* Vết cắt voucher */}
                                    <div className="absolute left-0 top-[calc(100%-68px)] -translate-x-1/2 w-6 h-6 rounded-full bg-slate-50/80 border border-slate-100"></div>
                                    <div className="absolute right-0 top-[calc(100%-68px)] translate-x-1/2 w-6 h-6 rounded-full bg-slate-50/80 border border-slate-100"></div>

                                    {/* Phần nội dung chính */}
                                    <div className="p-5 pb-4">
                                        <div className="flex items-center gap-4">
                                            {/* Icon phần trăm */}
                                            <div className={`w-14 h-14 flex flex-col items-center justify-center rounded-xl flex-shrink-0 ${
                                                isSaved 
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                    : 'bg-sky-50 text-sky-600 border border-sky-100'
                                            }`}>
                                                <span className="text-xl font-black leading-none">{coupon.discountPercent}</span>
                                                <span className="text-[9px] font-bold tracking-wider leading-none mt-0.5">% OFF</span>
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-bold text-slate-800 truncate">
                                                    Giảm {coupon.discountPercent}% đơn hàng
                                                </h3>
                                                <p className="text-sm text-slate-400 mt-0.5">
                                                    Tối đa <span className="font-semibold text-slate-600">{coupon.maxDiscountAmount.toLocaleString('vi-VN')}đ</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Chi tiết */}
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                                                </svg>
                                                Đơn từ {coupon.minOrderValue.toLocaleString('vi-VN')}đ
                                            </span>
                                            <ExpiryCountdown expiryDate={coupon.expiryDate} />
                                        </div>

                                        {/* Thanh tiến trình sử dụng */}
                                        {usagePercent !== null && (
                                            <div className="mt-3.5">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[11px] text-slate-400 font-medium">Đã sử dụng</span>
                                                    <span className={`text-[11px] font-bold ${isAlmostGone ? 'text-red-500' : 'text-slate-500'}`}>{usagePercent}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                            isAlmostGone 
                                                                ? 'bg-red-500' 
                                                                : 'bg-sky-500'
                                                        }`}
                                                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Phần footer - Code + Nút lưu */}
                                    <div className="px-5 py-3.5 border-t border-dashed border-slate-100 flex items-center justify-between gap-3">
                                        {/* Mã code - click to copy */}
                                        <button
                                            onClick={() => handleCopyCode(coupon.code, coupon._id)}
                                            className="group/copy inline-flex items-center gap-1.5 font-mono font-bold text-sm text-sky-600 bg-sky-50/80 hover:bg-sky-100 border border-sky-100 px-3 py-2 rounded-lg transition-all duration-200 active:scale-95"
                                            title="Nhấn để copy mã"
                                        >
                                            {isCopied ? (
                                                <>
                                                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <span className="text-emerald-600">Đã copy!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-3.5 h-3.5 text-sky-400 group-hover/copy:text-sky-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                    {coupon.code}
                                                </>
                                            )}
                                        </button>

                                        {/* Nút lưu voucher */}
                                        <button 
                                            onClick={() => handleSaveVoucher(coupon._id)}
                                            disabled={isSaved || isSaving}
                                            className={`inline-flex items-center gap-1.5 font-bold text-sm py-2.5 px-5 rounded-xl transition-all duration-200 active:scale-95 ${
                                                isSaved 
                                                    ? 'bg-slate-50 text-slate-400 cursor-default border border-slate-100' 
                                                    : isSaving
                                                        ? 'bg-sky-100 text-sky-400 cursor-wait border border-sky-200'
                                                        : 'bg-sky-500 text-white hover:bg-sky-600 shadow-sm hover:shadow-md'
                                            }`}
                                        >
                                            {isSaving ? (
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : isSaved ? (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Đã lưu
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                    </svg>
                                                    Lưu mã
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Ghi chú cuối trang */}
                <div className="mt-12 text-center">
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        Mã giảm giá được áp dụng tự động khi bạn lưu vào ví và chọn tại bước thanh toán. 
                        Mỗi mã chỉ sử dụng được một lần cho mỗi tài khoản.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Promotions;