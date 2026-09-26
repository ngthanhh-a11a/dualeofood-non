import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from '../../utils/axiosConfig';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import PromotionalBanner from '../../components/features/PromotionalBanner';

// --- Skeleton Loading cho Voucher Card (Hỗ trợ cả List & Grid) ---
const CouponSkeleton = ({ viewMode = 'list' }) => {
    if (viewMode === 'list') {
        return (
            <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 flex flex-col md:flex-row items-stretch gap-4 animate-pulse">
                <div className="w-full md:w-36 h-24 md:h-auto bg-slate-100 rounded-xl flex-shrink-0"></div>
                <div className="flex-1 space-y-3 py-1">
                    <div className="h-5 bg-slate-100 rounded-md w-1/3"></div>
                    <div className="h-4 bg-slate-100 rounded-md w-2/3"></div>
                    <div className="flex gap-2 pt-1">
                        <div className="h-6 bg-slate-50 rounded-lg w-28"></div>
                        <div className="h-6 bg-slate-50 rounded-lg w-24"></div>
                    </div>
                </div>
                <div className="w-full md:w-44 flex flex-row md:flex-col justify-between items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-4">
                    <div className="h-9 bg-slate-100 rounded-xl w-28"></div>
                    <div className="h-9 bg-slate-100 rounded-xl w-28"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
            <div className="p-5">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-xl flex-shrink-0"></div>
                    <div className="flex-1">
                        <div className="h-5 bg-slate-100 rounded-lg w-3/4 mb-2"></div>
                        <div className="h-3.5 bg-slate-100 rounded-lg w-full"></div>
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    <div className="h-7 bg-slate-50 rounded-lg w-24"></div>
                    <div className="h-7 bg-slate-50 rounded-lg w-28"></div>
                </div>
            </div>
            <div className="px-5 py-3.5 border-t border-dashed border-slate-100 flex justify-between items-center">
                <div className="h-8 bg-slate-100 rounded-lg w-24"></div>
                <div className="h-9 bg-slate-100 rounded-xl w-20"></div>
            </div>
        </div>
    );
};

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
                setTimeLeft(`Còn ${days} ngày ${hours}h`);
                setIsUrgent(days <= 2);
            } else {
                setTimeLeft(`Còn ${hours} giờ`);
                setIsUrgent(true);
            }
        };

        calculate();
        const interval = setInterval(calculate, 60000);
        return () => clearInterval(interval);
    }, [expiryDate]);

    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
            isUrgent 
                ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                : 'bg-slate-100 text-slate-600 border border-slate-200/60'
        }`}>
            <svg className={`w-3.5 h-3.5 ${isUrgent ? 'animate-pulse text-rose-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
    const [savingId, setSavingId] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    // Bộ lọc & sắp xếp & tìm kiếm
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'hot', 'expiring', 'saved', 'unsaved'
    const [sortBy, setSortBy] = useState('default'); // 'default', 'discountDesc', 'minOrderAsc', 'expiringSoon', 'mostUsed'
    
    // Tuỳ chọn hiển thị & thanh kéo
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
    const [isScrollConstrained, setIsScrollConstrained] = useState(true); // Thu gọn với thanh cuộn
    const [scrollPercent, setScrollPercent] = useState(0);

    const scrollContainerRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('token');

    // Lấy dữ liệu mã khuyến mãi & ví voucher
    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const couponsRes = await axios.get('/coupons');
                
                // Lọc mã đang active, chưa hết hạn, chưa cạn lượt
                const activeCoupons = (couponsRes.data || []).filter(coupon => {
                    if (!coupon.isActive) return false;
                    if (new Date(coupon.expiryDate) < new Date()) return false;
                    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) return false;
                    return true;
                });
                
                setCoupons(activeCoupons);

                if (token) {
                    try {
                        const myVouchersRes = await axios.get('/vouchers/my-vouchers');
                        const ids = new Set((myVouchersRes.data || []).map(uv => uv.coupon?._id || uv.coupon));
                        setSavedVoucherIds(ids);
                    } catch (err) {
                        console.warn('Không thể tải ví voucher cá nhân:', err);
                    }
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

    // Xử lý lưu mã vào ví
    const handleSaveVoucher = async (couponId) => {
        if (!token) {
            toast.error('Vui lòng đăng nhập để lưu mã vào ví của bạn!');
            setTimeout(() => {
                navigate('/login', { state: { from: location.pathname, message: 'Vui lòng đăng nhập để lưu mã khuyến mãi.' } });
            }, 1200);
            return;
        }

        setSavingId(couponId);
        try {
            await axios.post('/vouchers/save', { couponId });
            toast.success('Đã lưu thành công vào Ví Voucher!');
            setSavedVoucherIds(prev => new Set(prev).add(couponId));
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu mã.';
            toast.error(errorMsg);
        } finally {
            setSavingId(null);
        }
    };

    // Xử lý sao chép mã
    const handleCopyCode = (code, couponId) => {
        navigator.clipboard.writeText(code);
        setCopiedId(couponId);
        toast.success(`Đã sao chép mã: ${code}`, { icon: '📋' });
        setTimeout(() => setCopiedId(null), 2500);
    };

    // Tính toán % lượt dùng
    const getUsagePercent = useCallback((coupon) => {
        if (!coupon.usageLimit) return null;
        return Math.min(100, Math.round((coupon.usageCount / coupon.usageLimit) * 100));
    }, []);

    // Kiểm tra xem mã có phải Hot không (>= 20% hoặc giảm tối đa >= 50.000đ)
    const isCouponHot = useCallback((coupon) => {
        return coupon.discountPercent >= 20 || coupon.maxDiscountAmount >= 50000;
    }, []);

    // Kiểm tra xem mã có sắp hết hạn (<= 3 ngày)
    const isCouponExpiringSoon = useCallback((coupon) => {
        const diff = new Date(coupon.expiryDate) - new Date();
        return diff > 0 && diff <= 3 * 24 * 60 * 60 * 1000;
    }, []);

    // Đếm số lượng cho từng bộ lọc
    const counts = useMemo(() => {
        let hot = 0;
        let expiring = 0;
        let saved = 0;
        let unsaved = 0;

        coupons.forEach(c => {
            if (isCouponHot(c)) hot++;
            if (isCouponExpiringSoon(c)) expiring++;
            if (savedVoucherIds.has(c._id)) saved++;
            else unsaved++;
        });

        return {
            all: coupons.length,
            hot,
            expiring,
            saved,
            unsaved
        };
    }, [coupons, savedVoucherIds, isCouponHot, isCouponExpiringSoon]);

    // Xử lý lọc và sắp xếp danh sách mã
    const filteredAndSortedCoupons = useMemo(() => {
        let list = [...coupons];

        // 1. Tìm kiếm (theo mã code hoặc mô tả)
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            list = list.filter(c => 
                c.code?.toLowerCase().includes(q) ||
                c.discountPercent?.toString().includes(q) ||
                c.minOrderValue?.toString().includes(q)
            );
        }

        // 2. Bộ lọc danh mục tab
        if (activeFilter === 'hot') {
            list = list.filter(isCouponHot);
        } else if (activeFilter === 'expiring') {
            list = list.filter(isCouponExpiringSoon);
        } else if (activeFilter === 'saved') {
            list = list.filter(c => savedVoucherIds.has(c._id));
        } else if (activeFilter === 'unsaved') {
            list = list.filter(c => !savedVoucherIds.has(c._id));
        }

        // 3. Sắp xếp
        if (sortBy === 'discountDesc') {
            list.sort((a, b) => b.discountPercent - a.discountPercent);
        } else if (sortBy === 'minOrderAsc') {
            list.sort((a, b) => a.minOrderValue - b.minOrderValue);
        } else if (sortBy === 'expiringSoon') {
            list.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
        } else if (sortBy === 'mostUsed') {
            list.sort((a, b) => {
                const pA = a.usageLimit ? a.usageCount / a.usageLimit : 0;
                const pB = b.usageLimit ? b.usageCount / b.usageLimit : 0;
                return pB - pA;
            });
        }

        return list;
    }, [coupons, searchQuery, activeFilter, sortBy, savedVoucherIds, isCouponHot, isCouponExpiringSoon]);

    // Theo dõi tiến trình cuộn của container thanh kéo
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight > clientHeight) {
            const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
            setScrollPercent(Math.min(100, Math.max(0, Math.round(progress))));
        } else {
            setScrollPercent(0);
        }
    };

    // Cuộn lên đầu khung cuộn
    const scrollToTop = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50 min-h-screen pb-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">

                {/* Banner Quảng Cáo Đầu Trang */}
                <div className="mb-8">
                    <PromotionalBanner onApplyCode={(code) => setSearchQuery(code)} />
                </div>

                {/* Header Tiêu Đề & Thống Kê Nhanh */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-200/60 text-sky-700 text-xs font-bold px-3.5 py-1.5 rounded-full mb-3 shadow-xs">
                                <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></span>
                                <span>KHO VOUCHER ƯU ĐÃI ĐỘC QUYỀN</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                Mã Khuyến Mãi Hôm Nay 🎁
                            </h1>
                            <p className="text-slate-500 text-sm sm:text-base mt-1.5 max-w-xl">
                                Thu thập voucher vào ví để tự động giảm giá ngay khi đặt món tại giỏ hàng.
                            </p>
                        </div>

                        {/* Thẻ Thống Kê Nhanh */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-4 shrink-0">
                            <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3.5 text-center">
                                <span className="block text-2xl font-black text-slate-800">{coupons.length}</span>
                                <span className="text-xs font-semibold text-slate-400 mt-0.5">Mã khả dụng</span>
                            </div>

                            <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-3.5 text-center">
                                <span className="block text-2xl font-black text-amber-600">{counts.hot}</span>
                                <span className="text-xs font-semibold text-amber-700/80 mt-0.5">Ưu đãi HOT 🔥</span>
                            </div>

                            <Link 
                                to={token ? "/wallet" : "/login"} 
                                className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 text-center group hover:bg-emerald-100/70 transition-colors"
                                title="Xem ví voucher của bạn"
                            >
                                <span className="block text-2xl font-black text-emerald-600 group-hover:scale-105 transition-transform">
                                    {savedVoucherIds.size}
                                </span>
                                <span className="text-xs font-semibold text-emerald-700/80 mt-0.5 flex items-center justify-center gap-0.5">
                                    Đã lưu ví ➔
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* THANH ĐIỀU HƯỚNG: TÌM KIẾM, BỘ LỌC, SẮP XẾP & CÔNG TẮC THANH KÉO */}
                <div id="promotions-list" className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs mb-6 scroll-mt-6">
                    {/* Hàng 1: Tìm kiếm + Sắp xếp + Chuyển View & Scroll */}
                    <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
                        {/* Thanh tìm kiếm */}
                        <div className="relative flex-1 max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm theo mã (vd: CHAOBAN, GIAM20)..."
                                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Sắp xếp & Chế độ xem & Tuỳ chọn thanh kéo */}
                        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                            {/* Dropdown Sắp xếp */}
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600">
                                <span className="text-slate-400">↕️ Sắp xếp:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-transparent font-bold text-slate-700 border-none outline-none cursor-pointer py-1 pr-1"
                                >
                                    <option value="default">Mới nhất</option>
                                    <option value="discountDesc">Giảm nhiều nhất (% cao)</option>
                                    <option value="minOrderAsc">Đơn tối thiểu thấp nhất</option>
                                    <option value="expiringSoon">Sắp hết hạn nhất</option>
                                    <option value="mostUsed">Sắp hết lượt nhất</option>
                                </select>
                            </div>

                            {/* Nút bật/tắt Thanh kéo cuộn gọn */}
                            <button
                                onClick={() => setIsScrollConstrained(!isScrollConstrained)}
                                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all ${
                                    isScrollConstrained
                                        ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                                title={isScrollConstrained ? "Đang bật khung cuộn gọn gàng" : "Đang mở rộng toàn trang"}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                                </svg>
                                <span>{isScrollConstrained ? "Thanh kéo: Gọn" : "Mở rộng: Tất cả"}</span>
                            </button>

                            {/* Chuyển đổi List / Grid */}
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                        viewMode === 'list'
                                            ? 'bg-white text-sky-600 shadow-xs'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                    title="Dạng danh sách"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    <span className="hidden sm:inline">Danh sách</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                        viewMode === 'grid'
                                            ? 'bg-white text-sky-600 shadow-xs'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                    title="Dạng lưới thẻ"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    <span className="hidden sm:inline">Lưới</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Hàng 2: Tabs Filter nhanh */}
                    <div className="flex items-center gap-2 overflow-x-auto pt-4 border-t border-slate-100 mt-4 custom-scrollbar pb-1">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                activeFilter === 'all'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <span>Tất cả</span>
                            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                                activeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                            }`}>{counts.all}</span>
                        </button>

                        <button
                            onClick={() => setActiveFilter('hot')}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                activeFilter === 'hot'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100/70 border border-amber-200/50'
                            }`}
                        >
                            <span>🔥 Hot / Giảm sâu</span>
                            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                                activeFilter === 'hot' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                            }`}>{counts.hot}</span>
                        </button>

                        <button
                            onClick={() => setActiveFilter('expiring')}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                activeFilter === 'expiring'
                                    ? 'bg-rose-500 text-white shadow-xs'
                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100/70 border border-rose-200/50'
                            }`}
                        >
                            <span>⏰ Sắp hết hạn</span>
                            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                                activeFilter === 'expiring' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
                            }`}>{counts.expiring}</span>
                        </button>

                        <button
                            onClick={() => setActiveFilter('saved')}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                activeFilter === 'saved'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70 border border-emerald-200/50'
                            }`}
                        >
                            <span>🎟️ Đã lưu vào ví</span>
                            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                                activeFilter === 'saved' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                            }`}>{counts.saved}</span>
                        </button>

                        <button
                            onClick={() => setActiveFilter('unsaved')}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                activeFilter === 'unsaved'
                                    ? 'bg-sky-600 text-white shadow-xs'
                                    : 'bg-sky-50 text-sky-700 hover:bg-sky-100/70 border border-sky-200/50'
                            }`}
                        >
                            <span>✨ Chưa lưu</span>
                            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                                activeFilter === 'unsaved' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800'
                            }`}>{counts.unsaved}</span>
                        </button>
                    </div>
                </div>

                {/* THANH TRẠNG THÁI HIỂN THỊ & CHỈ BÁO THANH KÉO CUỘN */}
                <div className="flex items-center justify-between px-2 mb-3 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-2">
                        <span>Hiển thị <strong className="text-slate-800 font-bold">{filteredAndSortedCoupons.length}</strong> / {coupons.length} mã</span>
                        {isScrollConstrained && filteredAndSortedCoupons.length > 3 && (
                            <span className="hidden sm:inline-flex items-center gap-1 text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md font-medium">
                                ↕️ Cuộn thanh kéo để xem tiếp
                            </span>
                        )}
                    </div>

                    {isScrollConstrained && (
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400">Tiến độ cuộn: {scrollPercent}%</span>
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-sky-500 transition-all duration-150"
                                    style={{ width: `${scrollPercent}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* KHU VỰC DANH SÁCH MÃ VỚI THANH KÉO (SCROLL CONTAINER) */}
                <div className="relative">
                    {loading ? (
                        <div className={viewMode === 'list' ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <CouponSkeleton key={i} viewMode={viewMode} />
                            ))}
                        </div>
                    ) : filteredAndSortedCoupons.length === 0 ? (
                        /* Trạng thái không có kết quả */
                        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                🔍
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">Không tìm thấy mã phù hợp</h3>
                            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-5">
                                Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc đang áp dụng.
                            </p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setActiveFilter('all');
                                    setSortBy('default');
                                }}
                                className="inline-flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-all"
                            >
                                Xóa tất cả bộ lọc
                            </button>
                        </div>
                    ) : (
                        /* Danh sách voucher với container cuộn */
                        <div
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                            className={`transition-all duration-300 ${
                                isScrollConstrained
                                    ? 'max-h-[640px] md:max-h-[700px] overflow-y-auto custom-scrollbar p-2 -m-2 rounded-2xl'
                                    : ''
                            }`}
                        >
                            {viewMode === 'list' ? (
                                /* === GIAO DIỆN DẠNG DANH SÁCH (LIST VIEW) === */
                                <div className="space-y-4">
                                    {filteredAndSortedCoupons.map((coupon, index) => {
                                        const isSaved = savedVoucherIds.has(coupon._id);
                                        const isSaving = savingId === coupon._id;
                                        const isCopied = copiedId === coupon._id;
                                        const usagePercent = getUsagePercent(coupon);
                                        const isAlmostGone = usagePercent && usagePercent >= 80;
                                        const isHot = isCouponHot(coupon);

                                        return (
                                            <div
                                                key={coupon._id}
                                                className={`group relative bg-white rounded-2xl border transition-all duration-200 hover:shadow-md hover:border-sky-300 flex flex-col md:flex-row items-stretch overflow-hidden ${
                                                    isSaved ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
                                                }`}
                                            >
                                                {/* CỘT TRÁI: STUB VOUCHER CÓ MÀU & ICON */}
                                                <div className={`relative flex md:flex-col items-center justify-between md:justify-center p-4 md:p-6 md:w-44 shrink-0 text-white ${
                                                    isHot 
                                                        ? 'bg-gradient-to-br from-amber-500 to-rose-500' 
                                                        : 'bg-gradient-to-br from-sky-500 to-blue-600'
                                                }`}>
                                                    {/* Vết khuyết bán nguyệt trên & dưới (Desktop) hoặc trái & phải (Mobile) */}
                                                    <div className="hidden md:block absolute -top-3 right-0 translate-x-1/2 w-6 h-6 rounded-full bg-slate-50 border border-slate-200 z-10"></div>
                                                    <div className="hidden md:block absolute -bottom-3 right-0 translate-x-1/2 w-6 h-6 rounded-full bg-slate-50 border border-slate-200 z-10"></div>
                                                    
                                                    <div className="flex items-center md:flex-col gap-2 text-center">
                                                        <span className="text-3xl md:text-4xl font-black tracking-tight leading-none">
                                                            {coupon.discountPercent}%
                                                        </span>
                                                        <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                                                            GIẢM GIÁ
                                                        </span>
                                                    </div>

                                                    <div className="text-xs md:text-[11px] font-medium text-white/90 md:mt-2 text-right md:text-center">
                                                        Tối đa {coupon.maxDiscountAmount?.toLocaleString('vi-VN')}đ
                                                    </div>
                                                </div>

                                                {/* ĐƯỜNG KẺ NÉT ĐỨT PHÂN CÁCH VÉ */}
                                                <div className="hidden md:block w-px border-r-2 border-dashed border-slate-200 my-3"></div>

                                                {/* KHU VỰC GIỮA: NỘI DUNG VOUCHER */}
                                                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                                                    <div>
                                                        {/* Huy hiệu HOT / ĐÃ LƯU / SẮP HẾT */}
                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                            {isSaved ? (
                                                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                    Đã lưu trong ví
                                                                </span>
                                                            ) : isHot ? (
                                                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                                                                    🔥 ƯU ĐÃI HOT
                                                                </span>
                                                            ) : null}

                                                            {isAlmostGone && !isSaved && (
                                                                <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                                                    ⚡ Sắp hết lượt
                                                                </span>
                                                            )}

                                                            <ExpiryCountdown expiryDate={coupon.expiryDate} />
                                                        </div>

                                                        {/* Tiêu đề & Điều kiện */}
                                                        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                                                            Giảm {coupon.discountPercent}% cho đơn hàng từ {coupon.minOrderValue?.toLocaleString('vi-VN')}đ
                                                        </h3>
                                                        <p className="text-slate-500 text-xs sm:text-sm mt-1">
                                                            Mức giảm tối đa lên đến <strong className="text-slate-700 font-semibold">{coupon.maxDiscountAmount?.toLocaleString('vi-VN')}đ</strong>. Áp dụng cho mọi món trong menu.
                                                        </p>
                                                    </div>

                                                    {/* Thanh tiến trình sử dụng */}
                                                    {usagePercent !== null && (
                                                        <div className="mt-3 max-w-sm">
                                                            <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                                                                <span className="text-slate-400">Đã dùng:</span>
                                                                <span className={isAlmostGone ? 'text-rose-600' : 'text-slate-600'}>
                                                                    {usagePercent}% {coupon.usageLimit ? `(${coupon.usageCount}/${coupon.usageLimit})` : ''}
                                                                </span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-300 ${
                                                                        isAlmostGone ? 'bg-rose-500' : 'bg-sky-500'
                                                                    }`}
                                                                    style={{ width: `${usagePercent}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* CỘT PHẢI: MÃ CODE & HÀNH ĐỘNG */}
                                                <div className="p-4 sm:p-5 bg-slate-50/70 border-t md:border-t-0 md:border-l border-slate-100 flex flex-row md:flex-col items-center justify-between md:justify-center gap-3 md:w-52 shrink-0">
                                                    {/* Nút bấm copy mã */}
                                                    <button
                                                        onClick={() => handleCopyCode(coupon.code, coupon._id)}
                                                        className="group/btn flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-sky-400 font-mono text-xs font-bold text-slate-700 hover:text-sky-600 transition-all shadow-2xs w-full active:scale-95"
                                                        title="Bấm để sao chép mã"
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
                                                                <svg className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                </svg>
                                                                <span className="tracking-wide">{coupon.code}</span>
                                                            </>
                                                        )}
                                                    </button>

                                                    {/* Nút lưu voucher vào ví */}
                                                    <button
                                                        onClick={() => handleSaveVoucher(coupon._id)}
                                                        disabled={isSaved || isSaving}
                                                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                                                            isSaved
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                                                : isSaving
                                                                    ? 'bg-slate-200 text-slate-500 cursor-wait'
                                                                    : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-sm hover:shadow-md'
                                                        }`}
                                                    >
                                                        {isSaving ? (
                                                            <span className="inline-block w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></span>
                                                        ) : isSaved ? (
                                                            <>
                                                                <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                                <span>Đã có trong ví</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                                </svg>
                                                                <span>Lưu vào ví</span>
                                                            </>
                                                        )}
                                                    </button>

                                                    {/* Link dùng ngay */}
                                                    <Link
                                                        to="/menu"
                                                        className="text-[11px] font-semibold text-slate-500 hover:text-sky-600 transition-colors hidden md:block"
                                                    >
                                                        Đặt món dùng ngay ➔
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* === GIAO DIỆN DẠNG LƯỚI (GRID VIEW) === */
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {filteredAndSortedCoupons.map((coupon) => {
                                        const isSaved = savedVoucherIds.has(coupon._id);
                                        const isSaving = savingId === coupon._id;
                                        const isCopied = copiedId === coupon._id;
                                        const usagePercent = getUsagePercent(coupon);
                                        const isAlmostGone = usagePercent && usagePercent >= 80;
                                        const isHot = isCouponHot(coupon);

                                        return (
                                            <div
                                                key={coupon._id}
                                                className={`group relative bg-white rounded-2xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between ${
                                                    isSaved ? 'border-emerald-200' : 'border-slate-200 hover:border-sky-300'
                                                }`}
                                            >
                                                {/* Vết cắt voucher ở 2 bên */}
                                                <div className="absolute left-0 top-[calc(100%-64px)] -translate-x-1/2 w-5 h-5 rounded-full bg-slate-50 border border-slate-200 z-10"></div>
                                                <div className="absolute right-0 top-[calc(100%-64px)] translate-x-1/2 w-5 h-5 rounded-full bg-slate-50 border border-slate-200 z-10"></div>

                                                {/* Thân trên */}
                                                <div className="p-5">
                                                    <div className="flex items-start justify-between gap-3 mb-3">
                                                        <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-xs text-white ${
                                                            isHot 
                                                                ? 'bg-gradient-to-br from-amber-500 to-rose-500' 
                                                                : 'bg-gradient-to-br from-sky-500 to-blue-600'
                                                        }`}>
                                                            <span className="text-xl font-black leading-none">{coupon.discountPercent}%</span>
                                                            <span className="text-[9px] font-bold tracking-wider leading-none mt-1">GIẢM</span>
                                                        </div>

                                                        <div className="flex flex-col items-end gap-1">
                                                            {isSaved ? (
                                                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                    Đã lưu
                                                                </span>
                                                            ) : isHot ? (
                                                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                                    🔥 HOT
                                                                </span>
                                                            ) : null}

                                                            <ExpiryCountdown expiryDate={coupon.expiryDate} />
                                                        </div>
                                                    </div>

                                                    <h3 className="font-bold text-slate-800 text-base line-clamp-1 group-hover:text-sky-600 transition-colors">
                                                        Giảm {coupon.discountPercent}% đơn hàng
                                                    </h3>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        Đơn tối thiểu <strong className="text-slate-700">{coupon.minOrderValue?.toLocaleString('vi-VN')}đ</strong>
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        Giảm tối đa: {coupon.maxDiscountAmount?.toLocaleString('vi-VN')}đ
                                                    </p>

                                                    {usagePercent !== null && (
                                                        <div className="mt-3">
                                                            <div className="flex justify-between text-[11px] font-semibold mb-1 text-slate-400">
                                                                <span>Đã dùng</span>
                                                                <span className={isAlmostGone ? 'text-rose-500' : 'text-slate-600'}>{usagePercent}%</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${isAlmostGone ? 'bg-rose-500' : 'bg-sky-500'}`}
                                                                    style={{ width: `${usagePercent}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Thân dưới: Code + Save button */}
                                                <div className="px-5 py-3.5 border-t border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-between gap-2">
                                                    <button
                                                        onClick={() => handleCopyCode(coupon.code, coupon._id)}
                                                        className="font-mono text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 active:scale-95"
                                                        title="Bấm để sao chép mã"
                                                    >
                                                        {isCopied ? 'Đã chép!' : coupon.code}
                                                    </button>

                                                    <button
                                                        onClick={() => handleSaveVoucher(coupon._id)}
                                                        disabled={isSaved || isSaving}
                                                        className={`text-xs font-bold py-1.5 px-3.5 rounded-xl transition-all active:scale-95 ${
                                                            isSaved
                                                                ? 'bg-slate-100 text-slate-400 cursor-default'
                                                                : isSaving
                                                                    ? 'bg-sky-100 text-sky-400 cursor-wait'
                                                                    : 'bg-sky-500 hover:bg-sky-600 text-white shadow-xs'
                                                        }`}
                                                    >
                                                        {isSaving ? '...' : isSaved ? 'Đã lưu' : 'Lưu mã'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Nút Cuộn Lên Đầu (khi đang ở chế độ thanh cuộn và đã cuộn xuống) */}
                    {isScrollConstrained && scrollPercent > 30 && (
                        <button
                            onClick={scrollToTop}
                            className="absolute bottom-4 right-4 z-20 bg-slate-900/80 hover:bg-slate-900 text-white p-2.5 rounded-full shadow-lg backdrop-blur-xs transition-all active:scale-90"
                            title="Cuộn lên đầu danh sách"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* HƯỚNG DẪN 3 BƯỚC SỬ DỤNG MÃ KHUYẾN MÃI */}
                <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 text-center mb-6">
                        3 Bước Dễ Dàng Để Sử Dụng Mã Giảm Giá
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 font-black text-sm flex items-center justify-center shrink-0">
                                1
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-800">Thu Thập Mã Ưu Đãi</h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Bấm <strong>"Lưu vào ví"</strong> hoặc sao chép mã khuyến mãi bạn ưng ý nhất tại trang này.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 font-black text-sm flex items-center justify-center shrink-0">
                                2
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-800">Chọn Món Ngon</h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Khám phá thực đơn phong phú và thêm các món ăn hấp dẫn vào giỏ hàng của bạn.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 font-black text-sm flex items-center justify-center shrink-0">
                                3
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-800">Áp Dụng Khi Thanh Toán</h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Tại trang thanh toán, chọn voucher trong ví hoặc dán mã vào ô khuyến mãi để nhận ngay chiết khấu.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Ghi Chú Nhỏ */}
                <div className="mt-8 text-center text-xs text-slate-400">
                    <p>Mỗi đơn hàng áp dụng tối đa 1 mã giảm giá. Điều khoản và thời hạn áp dụng có thể thay đổi tùy chương trình.</p>
                </div>

            </div>
        </div>
    );
};

export default Promotions;