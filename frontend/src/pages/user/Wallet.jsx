import React, { useState, useEffect, useMemo } from 'react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  FiTag, FiCopy, FiCheck, FiClock, FiSearch, FiAlertCircle, 
  FiGift, FiArrowRight, FiInfo, FiPercent, FiShoppingBag, 
  FiCheckCircle, FiX, FiFilter, FiRefreshCw 
} from 'react-icons/fi';

const Wallet = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [allCoupons, setAllCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Bộ lọc & tìm kiếm
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'expiring' | 'used' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'percent' | 'fixed'

  // Tính năng nhập mã nhanh
  const [redeemInput, setRedeemInput] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Feedback sao chép mã
  const [copiedCode, setCopiedCode] = useState(null);

  // Modal điều kiện chi tiết
  const [modalCoupon, setModalCoupon] = useState(null);

  // Trạng thái đang lưu mã hot
  const [savingCouponId, setSavingCouponId] = useState(null);

  // 1. Tải danh sách ví voucher và coupon toàn hệ thống
  const fetchWalletData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [resWallet, resCoupons] = await Promise.allSettled([
        axios.get('/vouchers/my-vouchers'),
        axios.get('/coupons')
      ]);

      if (resWallet.status === 'fulfilled' && resWallet.value?.data) {
        const raw = resWallet.value.data;
        const list = Array.isArray(raw) ? raw : (raw.data || raw.vouchers || []);
        setVouchers(list);
      } else {
        setVouchers([]);
      }

      if (resCoupons.status === 'fulfilled' && resCoupons.value?.data) {
        const cList = Array.isArray(resCoupons.value.data) ? resCoupons.value.data : [];
        setAllCoupons(cList.filter(c => c.isActive && new Date(c.expiryDate) >= new Date()));
      }
    } catch (error) {
      console.error('Lỗi khi tải kho voucher:', error);
      toast.error('Không thể làm mới danh sách voucher.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  // 2. Kiểm tra tính hợp lệ của coupon
  const isCouponValid = (coupon) => {
    if (!coupon) return false;
    if (!coupon.isActive) return false;
    if (new Date(coupon.expiryDate) < new Date()) return false;
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) return false;
    return true;
  };

  // 3. Tính số ngày còn lại đến khi hết hạn
  const getDaysLeft = (expiryDate) => {
    if (!expiryDate) return 999;
    const diff = new Date(expiryDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // 4. Thống kê số lượng
  const stats = useMemo(() => {
    const list = Array.isArray(vouchers) ? vouchers : [];
    let available = 0;
    let expiring = 0;
    let used = 0;

    list.forEach(v => {
      const isValid = isCouponValid(v.coupon);
      if (!v.isUsed && isValid) {
        available++;
        const d = getDaysLeft(v.coupon?.expiryDate);
        if (d > 0 && d <= 3) expiring++;
      } else {
        used++;
      }
    });

    return {
      total: list.length,
      available,
      expiring,
      used
    };
  }, [vouchers]);

  // 5. Lọc danh sách voucher hiển thị theo tab, tìm kiếm, loại giảm giá
  const filteredVouchers = useMemo(() => {
    const list = Array.isArray(vouchers) ? vouchers : [];

    return list.filter(v => {
      const coupon = v.coupon;
      if (!coupon) return false;

      const isValid = isCouponValid(coupon);
      const isAvailable = !v.isUsed && isValid;
      const daysLeft = getDaysLeft(coupon.expiryDate);
      const isExpiring = isAvailable && daysLeft > 0 && daysLeft <= 3;

      // Lọc theo Tab
      if (activeTab === 'available' && !isAvailable) return false;
      if (activeTab === 'expiring' && !isExpiring) return false;
      if (activeTab === 'used' && isAvailable) return false;

      // Lọc theo loại giảm giá
      if (typeFilter === 'percent' && (!coupon.discountPercent || coupon.discountPercent <= 0)) return false;
      if (typeFilter === 'fixed' && coupon.discountPercent > 0) return false;

      // Lọc theo từ khóa tìm kiếm (mã hoặc mô tả)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const code = (coupon.code || '').toLowerCase();
        const desc = `giảm ${coupon.discountPercent || 0}% tối đa ${coupon.maxDiscountAmount || 0}`.toLowerCase();
        if (!code.includes(query) && !desc.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [vouchers, activeTab, typeFilter, searchQuery]);

  // 6. Danh sách các mã HOT trên hệ thống mà User CHƯA lưu vào ví
  const unclaimedHotCoupons = useMemo(() => {
    const savedCouponIds = new Set(
      (vouchers || []).map(v => (v.coupon?._id || v.coupon)).filter(Boolean)
    );
    return allCoupons
      .filter(c => !savedCouponIds.has(c._id))
      .slice(0, 4); // Lấy tối đa 4 mã hot nhất
  }, [allCoupons, vouchers]);

  // 7. Xử lý tính năng 1: Nhập mã để lưu vào ví
  const handleRedeemCode = async (e) => {
    e.preventDefault();
    const cleanCode = redeemInput.trim().toUpperCase();
    if (!cleanCode) {
      toast.error('Vui lòng nhập mã voucher!');
      return;
    }

    setIsRedeeming(true);
    try {
      // 1. Kiểm tra tính hợp lệ
      const verifyRes = await axios.post('/coupons/verify', {
        code: cleanCode,
        orderValue: 9999999
      });

      const coupon = verifyRes.data?.coupon;
      if (!coupon?._id) {
        toast.error('Mã giảm giá không tồn tại hoặc đã hết hạn!');
        return;
      }

      // Kiểm tra xem mã này đã có trong ví chưa
      const alreadyHave = vouchers.some(v => (v.coupon?._id || v.coupon) === coupon._id && !v.isUsed);
      if (alreadyHave) {
        toast.error('Mã giảm giá này đã có sẵn trong ví của bạn!');
        return;
      }

      // 2. Lưu vào ví
      await axios.post('/vouchers/save', { couponId: coupon._id });

      // Hiệu ứng pháo hoa ăn mừng
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast.success(`Chúc mừng! Đã lưu mã "${cleanCode}" vào kho voucher!`, {
        icon: '🎉',
        duration: 3500
      });

      setRedeemInput('');
      fetchWalletData(true);
      setActiveTab('available');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể lưu mã. Vui lòng kiểm tra lại!');
    } finally {
      setIsRedeeming(false);
    }
  };

  // 8. Xử lý tính năng 2: Lưu 1 chạm từ danh sách mã HOT
  const handleSaveHotCoupon = async (couponId, couponCode) => {
    setSavingCouponId(couponId);
    try {
      await axios.post('/vouchers/save', { couponId });
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.7 }
      });
      toast.success(`Đã lưu mã "${couponCode}" vào kho voucher của bạn!`, { icon: '🎟️' });
      fetchWalletData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu mã vào ví.');
    } finally {
      setSavingCouponId(null);
    }
  };

  // 9. Xử lý sao chép mã 1 chạm (1-Click Copy)
  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Đã sao chép mã "${code}"!`, { id: `copy-${code}` });
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  // 10. Xử lý nút "Dùng ngay"
  const handleUseNow = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép mã "${code}"! Hãy dán vào ô giảm giá khi thanh toán.`, { duration: 3000 });
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center bg-slate-50/50">
        <div className="relative w-16 h-16">
          <div className="w-16 h-16 rounded-full border-4 border-sky-100 border-t-sky-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-xl">🎟️</div>
        </div>
        <p className="mt-4 text-sm font-bold text-slate-500 animate-pulse">Đang tải kho voucher của bạn...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/60 min-h-screen py-6 sm:py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* ================= BREADCRUMB ================= */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-4 sm:mb-6">
          <Link to="/" className="hover:text-sky-600 transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-slate-700">Kho Voucher</span>
        </nav>

        {/* ================= HERO HEADER ================= */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 text-white p-6 sm:p-8 md:p-10 shadow-xl shadow-sky-500/15 mb-6 sm:mb-8">
          {/* Họa tiết nền trang trí */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-sky-400/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-black uppercase tracking-wider mb-3">
                <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
                DualeoFood Loyalty & Rewards
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-2">
                🎟️ Kho Voucher Của Tôi
              </h1>
              <p className="text-sky-100 text-xs sm:text-sm max-w-xl leading-relaxed">
                Quản lý các mã giảm giá độc quyền, kiểm tra hạn dùng và áp dụng ngay để nhận ưu đãi hấp dẫn cho mỗi bữa ăn.
              </p>
            </div>

            {/* Nút hành động trên banner */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => fetchWalletData(true)}
                disabled={refreshing}
                className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-xs font-bold transition flex items-center gap-2 backdrop-blur-md active:scale-95 disabled:opacity-50"
                title="Làm mới ví"
              >
                <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Làm mới</span>
              </button>

              <Link
                to="/promotions"
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-white text-sky-700 hover:bg-sky-50 text-xs sm:text-sm font-black shadow-md transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap"
              >
                <FiGift className="w-4 h-4 text-sky-600" />
                <span>Săn Thêm Voucher</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* ================= 4 THẺ THỐNG KÊ TỔNG QUAN ================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Card 1: Tổng voucher */}
          <div 
            onClick={() => setActiveTab('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white shadow-xs ${
              activeTab === 'all' ? 'border-sky-500 ring-2 ring-sky-100' : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">Tổng voucher</span>
              <span className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <FiTag className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-800">{stats.total}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Tất cả mã đã lưu</p>
          </div>

          {/* Card 2: Khả dụng */}
          <div 
            onClick={() => setActiveTab('available')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white shadow-xs ${
              activeTab === 'available' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">Có thể dùng</span>
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <FiCheckCircle className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-600">{stats.available}</div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Sẵn sàng áp dụng ngay</p>
          </div>

          {/* Card 3: Sắp hết hạn */}
          <div 
            onClick={() => setActiveTab('expiring')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white shadow-xs ${
              activeTab === 'expiring' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">Sắp hết hạn</span>
              <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <FiClock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-amber-600">{stats.expiring}</div>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Còn dưới 3 ngày</p>
          </div>

          {/* Card 4: Đã dùng / Hết hạn */}
          <div 
            onClick={() => setActiveTab('used')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white shadow-xs ${
              activeTab === 'used' ? 'border-slate-400 ring-2 ring-slate-100' : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">Đã dùng / Hết hạn</span>
              <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
                <FiX className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-600">{stats.used}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Lịch sử voucher</p>
          </div>
        </div>

        {/* ================= TÍNH NĂNG: NHẬP MÃ LƯU VÀO VÍ ================= */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-sky-100 shadow-sm mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center text-lg shrink-0 shadow-sm">
                🎁
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm sm:text-base">
                  Bạn có mã giảm giá đặc biệt?
                </h3>
                <p className="text-xs text-slate-500">
                  Nhập mã voucher bạn nhận được để lưu vào ví và sử dụng bất cứ lúc nào.
                </p>
              </div>
            </div>

            <form onSubmit={handleRedeemCode} className="flex items-center gap-2 w-full md:max-w-md">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={redeemInput}
                  onChange={(e) => setRedeemInput(e.target.value.toUpperCase())}
                  placeholder="Nhập mã (VD: DUALEO20, FREESHIP)..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold tracking-wider text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition uppercase"
                />
                <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              </div>
              <button
                type="submit"
                disabled={isRedeeming || !redeemInput.trim()}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs sm:text-sm font-black rounded-xl shadow-sm transition active:scale-95 shrink-0 flex items-center gap-1.5"
              >
                {isRedeeming ? 'Đang lưu...' : 'Lưu Vào Ví'}
              </button>
            </form>
          </div>
        </div>

        {/* ================= BỘ LỌC, TÌM KIẾM & TABS ================= */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Tabs chính */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
              {[
                { key: 'available', label: 'Có thể dùng', count: stats.available },
                { key: 'expiring', label: 'Sắp hết hạn', count: stats.expiring },
                { key: 'used', label: 'Đã dùng / Hết hạn', count: stats.used },
                { key: 'all', label: 'Tất cả', count: stats.total }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    activeTab === tab.key 
                      ? 'bg-sky-500 text-white shadow-xs' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    activeTab === tab.key ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Tìm kiếm & Lọc loại */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Ô tìm kiếm */}
              <div className="relative flex-1 sm:w-60">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm mã hoặc ưu đãi..."
                  className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
                />
                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Lọc loại giảm giá */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-sky-500 transition cursor-pointer"
              >
                <option value="all">Tất cả hình thức</option>
                <option value="percent">Giảm theo %</option>
                <option value="fixed">Giảm tiền mặt</option>
              </select>
            </div>

          </div>
        </div>

        {/* ================= DANH SÁCH VOUCHER (TICKET DESIGN) ================= */}
        {filteredVouchers.length === 0 ? (
          /* Trạng thái trống */
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-xs mb-8">
            <div className="w-20 h-20 rounded-3xl bg-sky-50 text-sky-500 flex items-center justify-center text-3xl mx-auto mb-4">
              🎟️
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1">
              {searchQuery ? 'Không tìm thấy voucher phù hợp' : 'Chưa có voucher nào trong mục này'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
              {searchQuery 
                ? `Không có kết quả nào khớp với từ khóa "${searchQuery}". Hãy thử tìm kiếm bằng từ khóa khác.`
                : 'Bạn có thể săn các mã giảm giá hấp dẫn nhất tại trang khuyến mãi hoặc nhập mã bạn có ở trên.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Xóa bộ lọc
                </button>
              )}
              <Link
                to="/promotions"
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-bold transition shadow-sm"
              >
                Săn Voucher Ngay
              </Link>
            </div>
          </div>
        ) : (
          /* Grid danh sách vé */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {filteredVouchers.map(({ _id, coupon, isUsed, usedAt }) => {
              const isValid = isCouponValid(coupon);
              const isInactive = !isUsed && !isValid;
              const isAvailable = !isUsed && isValid;
              const daysLeft = getDaysLeft(coupon?.expiryDate);
              const isExpiringSoon = isAvailable && daysLeft > 0 && daysLeft <= 3;

              let statusBadge = null;
              if (isUsed) {
                statusBadge = { text: 'Đã sử dụng', color: 'bg-slate-100 text-slate-600 border-slate-200' };
              } else if (isInactive) {
                if (!coupon?.isActive) statusBadge = { text: 'Đã vô hiệu hóa', color: 'bg-rose-50 text-rose-600 border-rose-200' };
                else if (new Date(coupon?.expiryDate) < new Date()) statusBadge = { text: 'Đã hết hạn', color: 'bg-rose-50 text-rose-600 border-rose-200' };
                else statusBadge = { text: 'Hết lượt dùng', color: 'bg-amber-50 text-amber-700 border-amber-200' };
              } else if (isExpiringSoon) {
                statusBadge = { text: `Hết hạn sau ${daysLeft} ngày`, color: 'bg-amber-500 text-white font-extrabold animate-pulse' };
              }

              return (
                <div
                  key={_id}
                  className={`relative rounded-2xl bg-white border transition-all duration-200 overflow-hidden flex flex-col sm:flex-row group ${
                    isAvailable 
                      ? 'border-sky-100 shadow-sm hover:shadow-md hover:border-sky-300' 
                      : 'border-slate-200/80 bg-slate-50/50 opacity-75'
                  }`}
                >
                  {/* PHẦN CUỐNG VÉ TRÁI (Stub) */}
                  <div className={`p-4 sm:w-36 flex flex-col justify-between items-center text-center shrink-0 relative overflow-hidden ${
                    isAvailable 
                      ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white' 
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {/* Vết cắt răng cưa / khuyết bán nguyệt ở mép (Perforation notches) */}
                    <div className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50 z-10 border border-slate-200" />
                    
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-90 mb-1">
                      {coupon?.discountPercent ? 'Giảm %' : 'Giảm Tiền'}
                    </span>

                    <div className="my-auto py-2">
                      <div className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
                        {coupon?.discountPercent ? `${coupon.discountPercent}%` : `${(coupon?.maxDiscountAmount / 1000).toFixed(0)}K`}
                      </div>
                      <span className="text-[10px] font-bold opacity-80 uppercase block mt-1">
                        GIẢM GIÁ
                      </span>
                    </div>

                    <span className="text-[10px] font-semibold opacity-90 truncate max-w-full">
                      {coupon?.code}
                    </span>
                  </div>

                  {/* ĐƯỜNG PHÂN CÁCH ĐỨT ĐOẠN (Dashed line) */}
                  <div className="hidden sm:block w-[1px] border-r-2 border-dashed border-slate-200 my-2" />

                  {/* PHẦN THÂN VÉ PHẢI (Main Info) */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Dòng 1: Badge trạng thái + Nút copy */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {statusBadge ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.color}`}>
                            {statusBadge.text}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            Khả dụng
                          </span>
                        )}

                        {/* Nút 1-Click Copy */}
                        <button
                          type="button"
                          onClick={() => handleCopyCode(coupon?.code)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition border cursor-pointer ${
                            copiedCode === coupon?.code
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                          title="Sao chép mã"
                        >
                          {copiedCode === coupon?.code ? (
                            <>
                              <FiCheck className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <span className="font-mono font-bold text-[11px]">{coupon?.code}</span>
                              <FiCopy className="w-3 h-3 text-slate-400" />
                            </>
                          )}
                        </button>
                      </div>

                      {/* Tiêu đề & Điều kiện */}
                      <h4 className="font-black text-slate-800 text-sm sm:text-base mb-1 line-clamp-1">
                        Ưu đãi mã {coupon?.code}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed mb-3">
                        Giảm <span className="font-bold text-sky-600">{coupon?.discountPercent}%</span> (tối đa <span className="font-bold text-sky-600">{coupon?.maxDiscountAmount?.toLocaleString('vi-VN')}đ</span>) cho đơn hàng từ <span className="font-bold text-slate-700">{coupon?.minOrderValue?.toLocaleString('vi-VN')}đ</span>.
                      </p>
                    </div>

                    {/* Hạn sử dụng & Nút hành động */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <FiClock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px]">
                          HSD: {coupon?.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Nút xem điều kiện chi tiết */}
                        <button
                          type="button"
                          onClick={() => setModalCoupon(coupon)}
                          className="text-xs font-bold text-slate-400 hover:text-sky-600 transition flex items-center gap-1 cursor-pointer"
                        >
                          <FiInfo className="w-3.5 h-3.5" />
                          <span>Điều kiện</span>
                        </button>

                        {/* Nút hành động chính */}
                        {isAvailable ? (
                          <button
                            type="button"
                            onClick={() => handleUseNow(coupon?.code)}
                            className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
                          >
                            Dùng ngay
                          </button>
                        ) : (
                          <span className="px-3 py-1 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed">
                            Không khả dụng
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= GỢI Ý: CÁC MÃ HOT CHƯA LƯU VÀO VÍ ================= */}
        {unclaimedHotCoupons.length > 0 && (
          <div className="bg-gradient-to-br from-amber-500/10 via-sky-500/10 to-transparent rounded-3xl p-6 sm:p-8 border border-amber-200/60 shadow-sm mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-sm">
                  🔥
                </span>
                <div>
                  <h3 className="font-black text-slate-800 text-base sm:text-lg">
                    Voucher Đang HOT Trên Hệ Thống
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bạn chưa lưu các mã ưu đãi này vào ví. Bấm "Lưu vào ví" để không bỏ lỡ!
                  </p>
                </div>
              </div>

              <Link
                to="/promotions"
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 hover:underline self-start sm:self-auto"
              >
                <span>Xem tất cả ưu đãi</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {unclaimedHotCoupons.map(hotCoupon => (
                <div
                  key={hotCoupon._id}
                  className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px]">
                        HOT DEAL
                      </span>
                      <span className="text-xs font-black text-amber-600">
                        {hotCoupon.discountPercent ? `Giảm ${hotCoupon.discountPercent}%` : 'Giảm tiền'}
                      </span>
                    </div>

                    <div className="font-mono font-black text-sm text-slate-800 mb-1">
                      {hotCoupon.code}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">
                      Đơn tối thiểu từ {hotCoupon.minOrderValue?.toLocaleString('vi-VN')}đ.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={savingCouponId === hotCoupon._id}
                    onClick={() => handleSaveHotCoupon(hotCoupon._id, hotCoupon.code)}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <FiGift className="w-3.5 h-3.5" />
                    <span>{savingCouponId === hotCoupon._id ? 'Đang lưu...' : 'Lưu Vào Ví'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= MODAL CHI TIẾT ĐIỀU KIỆN ================= */}
        {modalCoupon && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setModalCoupon(null)}
          >
            <div 
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setModalCoupon(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center text-xl font-black">
                  🎟️
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-sky-600 tracking-wider">Chi Tiết Ưu Đãi</span>
                  <h3 className="text-lg font-black text-slate-800">
                    Mã {modalCoupon.code}
                  </h3>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 rounded-2xl p-4 text-xs mb-5">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Mức giảm:</span>
                  <span className="font-black text-sky-600">
                    {modalCoupon.discountPercent ? `Giảm ${modalCoupon.discountPercent}%` : 'Giảm tiền mặt'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Giảm tối đa:</span>
                  <span className="font-bold text-slate-800">
                    {modalCoupon.maxDiscountAmount ? `${modalCoupon.maxDiscountAmount.toLocaleString('vi-VN')}đ` : 'Không giới hạn'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Đơn hàng tối thiểu:</span>
                  <span className="font-bold text-slate-800">
                    {modalCoupon.minOrderValue ? `${modalCoupon.minOrderValue.toLocaleString('vi-VN')}đ` : '0đ'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Hạn sử dụng:</span>
                  <span className="font-bold text-slate-800">
                    {modalCoupon.expiryDate ? new Date(modalCoupon.expiryDate).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">Đối tượng áp dụng:</span>
                  <span className="font-bold text-emerald-600">
                    Mọi thành viên DualeoFood
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleCopyCode(modalCoupon.code);
                    setModalCoupon(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 transition"
                >
                  Sao chép mã
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalCoupon(null);
                    handleUseNow(modalCoupon.code);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs shadow-sm transition"
                >
                  Dùng ngay
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Wallet;