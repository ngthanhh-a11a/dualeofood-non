import React, { useState, useEffect } from 'react';
import axios, { SERVER_URL, getImageUrl } from '../../utils/axiosConfig';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/cartSlice';
import ReviewModal from '../../components/features/ReviewModal';
import OrderStatusTracker from '../../components/features/OrderStatusTracker';
import toast from 'react-hot-toast';
import { 
  FiPackage, FiClock, FiTruck, FiCheckCircle, FiXCircle, 
  FiSearch, FiCopy, FiCheck, FiRefreshCw, FiFileText, 
  FiPrinter, FiX, FiChevronDown, FiChevronUp, FiDollarSign, 
  FiShoppingBag, FiMapPin, FiPhone, FiUser, FiInfo, FiTag, 
  FiCalendar, FiArrowRight, FiExternalLink, FiStar, FiFilter
} from 'react-icons/fi';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [copiedOrderId, setCopiedOrderId] = useState(null);
  
  // States bộ lọc & tìm kiếm
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // State thống kê đơn hàng
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeCount: 0,
    completedCount: 0,
    totalSpent: 0,
    statusCounts: { ALL: 0, PENDING: 0, PROCESSING: 0, DELIVERING: 0, COMPLETED: 0, CANCELLED: 0 }
  });

  // Modal hóa đơn điện tử (E-Receipt)
  const [receiptOrder, setReceiptOrder] = useState(null);

  // States modal đánh giá
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [productToReview, setProductToReview] = useState(null);
  const [reviewedProductIds, setReviewedProductIds] = useState([]);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();

  // Cấu hình trạng thái
  const statusConfig = {
    PENDING: { 
      text: 'Chờ duyệt', 
      color: 'bg-amber-50 text-amber-700 border-amber-200/80',
      badgeColor: 'bg-amber-500',
      icon: <FiClock className="w-3.5 h-3.5" /> 
    },
    PROCESSING: { 
      text: 'Đang chuẩn bị', 
      color: 'bg-sky-50 text-sky-700 border-sky-200/80',
      badgeColor: 'bg-sky-500',
      icon: <FiPackage className="w-3.5 h-3.5" /> 
    },
    DELIVERING: { 
      text: 'Đang giao hàng', 
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      badgeColor: 'bg-indigo-500',
      icon: <FiTruck className="w-3.5 h-3.5" /> 
    },
    COMPLETED: { 
      text: 'Hoàn thành', 
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      badgeColor: 'bg-emerald-500',
      icon: <FiCheckCircle className="w-3.5 h-3.5" /> 
    },
    CANCELLED: { 
      text: 'Đã hủy', 
      color: 'bg-rose-50 text-rose-700 border-rose-200/80',
      badgeColor: 'bg-rose-500',
      icon: <FiXCircle className="w-3.5 h-3.5" /> 
    },
  };

  // 1. Kết nối WebSocket lắng nghe cập nhật trạng thái real-time
  useEffect(() => {
    if (!socket) return;

    socket.on('order_status_updated', (updatedOrder) => {
      const statusInfo = statusConfig[updatedOrder.status] || { text: 'cập nhật' };
      toast.success(`Đơn hàng #${updatedOrder._id.substring(0, 8).toUpperCase()} đã chuyển sang "${statusInfo.text}"!`, {
        icon: '🔔',
        duration: 4000
      });

      // Cập nhật đơn trong danh sách
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === updatedOrder._id
            ? { ...order, status: updatedOrder.status }
            : order
        )
      );

      // Cập nhật lại stats
      fetchOrders();
    });

    return () => {
      socket.off('order_status_updated');
    };
  }, [socket]);

  // 2. Fetch danh sách đơn hàng
  const fetchOrders = async (targetPage = pagination.currentPage) => {
    setLoading(true);
    try {
      const orderIdToScroll = location.state?.scrollToOrderId;
      const params = new URLSearchParams({
        page: targetPage,
        limit: 6,
        status: statusFilter,
        sort: sortBy
      });

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (orderIdToScroll) {
        params.append('findOrderId', orderIdToScroll);
      }

      const response = await axios.get(`/orders/my-orders?${params.toString()}`);
      const { orders: fetchedOrders, totalPages, currentPage, reviewedProductIds: initialReviewedIds, stats: fetchedStats } = response.data;

      setOrders(fetchedOrders || []);
      setPagination({ currentPage: currentPage || 1, totalPages: totalPages || 1 });

      if (initialReviewedIds) {
        setReviewedProductIds(initialReviewedIds);
      }
      if (fetchedStats) {
        setStats(fetchedStats);
      }

      // Xử lý scroll đến đơn nếu được chuyển từ thông báo
      if (orderIdToScroll) {
        setExpandedOrderId(orderIdToScroll);
        setTimeout(() => {
          const element = document.getElementById(`order-${orderIdToScroll}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlight-order');
            setTimeout(() => {
              element.classList.remove('highlight-order');
            }, 2500);
          }
          navigate(location.pathname, { replace: true, state: {} });
        }, 150);
      }
    } catch (error) {
      console.error('Lỗi khi tải đơn hàng:', error);
      toast.error('Không thể tải dữ liệu đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [statusFilter, sortBy]);

  // Tìm kiếm với debounce nhẹ
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Toggle mở chi tiết đơn
  const handleToggleExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Copy mã đơn hàng
  const handleCopyOrderId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedOrderId(id);
    toast.success('Đã sao chép mã đơn hàng!');
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  // Đặt lại đơn hàng (Reorder)
  const handleReorder = (items) => {
    if (!items || items.length === 0) return;
    if (window.confirm('Bạn có muốn thêm toàn bộ các món trong đơn hàng này vào giỏ hàng?')) {
      let addedCount = 0;
      items.forEach(item => {
        if (item.product && item.product._id) {
          const cartItem = {
            ...item.product,
            id: item.product._id,
            price: item.price
          };
          for (let i = 0; i < (item.quantity || 1); i++) {
            dispatch(addToCart(cartItem));
          }
          addedCount += item.quantity || 1;
        }
      });
      toast.success(`Đã thêm ${addedCount} phần ăn vào giỏ hàng!`);
      navigate('/cart');
    }
  };

  // Hủy đơn hàng
  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này? Thao tác không thể hoàn tác.')) {
      try {
        await axios.put(`/orders/my-orders/${orderId}/cancel`);
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId ? { ...order, status: 'CANCELLED' } : order
          )
        );
        toast.success('Đã hủy đơn hàng thành công!');
        fetchOrders(pagination.currentPage);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Hủy đơn hàng thất bại!');
      }
    }
  };

  // Mở modal đánh giá
  const handleOpenReviewModal = (product) => {
    setProductToReview({ ...product, image: `${getImageUrl(product.image)}` });
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmitted = () => {
    if (productToReview) {
      setReviewedProductIds(prev => [...prev, productToReview._id]);
    }
    setIsReviewModalOpen(false);
    setProductToReview(null);
  };

  // In hóa đơn
  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="font-sans bg-slate-50 min-h-screen py-8 sm:py-12">
      <style>{`
        .highlight-order {
          transition: all 0.5s ease-in-out;
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.45);
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* ================= BREADCRUMB & HEADER ================= */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-2">
            <Link to="/" className="hover:text-sky-600 transition">Trang chủ</Link>
            <span>/</span>
            <Link to="/profile" className="hover:text-sky-600 transition">Tài khoản</Link>
            <span>/</span>
            <span className="text-sky-600 font-bold">Lịch sử đơn hàng</span>
          </nav>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                  <span className="p-2 bg-sky-100 text-sky-600 rounded-xl">
                    <FiShoppingBag className="w-6 h-6" />
                  </span>
                  Đơn Hàng Của Tôi
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time Sync
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Theo dõi quá trình giao nhận, xem lại chi tiết hóa đơn và dễ dàng đặt lại món ăn yêu thích.
              </p>
            </div>

            <Link
              to="/menu"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow transition transform active:scale-95 shrink-0"
            >
              <span>Đặt món mới</span>
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ================= 4 THẺ THỐNG KÊ TỔNG QUAN (METRICS HUB) ================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {/* Card 1: Tổng đơn */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <FiPackage className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng đơn</p>
              <h3 className="text-lg sm:text-2xl font-black text-slate-800 truncate">{stats.totalOrders}</h3>
            </div>
          </div>

          {/* Card 2: Đang thực hiện */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-100/80 shadow-xs flex items-center gap-3.5 relative overflow-hidden">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FiTruck className="w-5 h-5 animate-bounce" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-amber-600 uppercase tracking-wider">Đang giao / nấu</p>
              <h3 className="text-lg sm:text-2xl font-black text-slate-800 truncate">{stats.activeCount}</h3>
            </div>
            {stats.activeCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>

          {/* Card 3: Hoàn thành */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Hoàn tất</p>
              <h3 className="text-lg sm:text-2xl font-black text-slate-800 truncate">{stats.completedCount}</h3>
            </div>
          </div>

          {/* Card 4: Tổng chi tiêu */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <FiDollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Tích lũy chi tiêu</p>
              <h3 className="text-base sm:text-xl font-black text-sky-600 truncate">
                {stats.totalSpent.toLocaleString('vi-VN')}đ
              </h3>
            </div>
          </div>
        </div>

        {/* ================= TABS CHỌN TRẠNG THÁI ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-2 sm:p-3 mb-6 shadow-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'ALL', label: 'Tất cả', count: stats.statusCounts?.ALL ?? stats.totalOrders },
              { id: 'PENDING', label: 'Chờ duyệt', count: stats.statusCounts?.PENDING ?? 0 },
              { id: 'PROCESSING', label: 'Chuẩn bị', count: stats.statusCounts?.PROCESSING ?? 0 },
              { id: 'DELIVERING', label: 'Đang giao', count: stats.statusCounts?.DELIVERING ?? 0 },
              { id: 'COMPLETED', label: 'Hoàn thành', count: stats.statusCounts?.COMPLETED ?? 0 },
              { id: 'CANCELLED', label: 'Đã hủy', count: stats.statusCounts?.CANCELLED ?? 0 },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-sky-600 hover:bg-slate-100/80'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= THANH TÌM KIẾM & BỘ LỌC SẮP XẾP ================= */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã đơn (ví dụ: 66f1...)..."
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sắp xếp & Làm mới */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 pr-8 text-xs sm:text-sm font-bold text-slate-700 hover:border-slate-300 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 cursor-pointer transition"
              >
                <option value="newest">📅 Mới nhất</option>
                <option value="oldest">⌛ Cũ nhất</option>
                <option value="highest">💰 Giá cao nhất</option>
                <option value="lowest">🏷️ Giá thấp nhất</option>
              </select>
              <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            </div>

            <button
              onClick={() => fetchOrders(pagination.currentPage)}
              title="Tải lại danh sách"
              className="p-2.5 bg-white border border-slate-200 hover:border-sky-400 hover:text-sky-600 text-slate-600 rounded-xl transition cursor-pointer"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* ================= DANH SÁCH ĐƠN HÀNG ================= */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs animate-pulse">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                  <div className="h-5 bg-slate-200 rounded w-48" />
                  <div className="h-6 bg-slate-200 rounded-full w-24" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                  </div>
                  <div className="h-6 bg-slate-200 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl shadow-xs border border-dashed border-slate-200">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 text-3xl">
              📦
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {searchQuery || statusFilter !== 'ALL' ? 'Không tìm thấy đơn hàng nào phù hợp' : 'Bạn chưa có đơn hàng nào'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc bấm xem tất cả trạng thái đơn hàng.'
                : 'Thực đơn của DualeoFood luôn có rất nhiều món ăn thơm ngon và ưu đãi đang chờ bạn khám phá!'}
            </p>
            {searchQuery || statusFilter !== 'ALL' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            ) : (
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow transition"
              >
                <span>Khám phá thực đơn ngay</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order._id;
              const statusBadge = statusConfig[order.status] || {
                text: order.status,
                color: 'bg-slate-100 text-slate-700 border-slate-200',
                icon: null
              };

              return (
                <div
                  key={order._id}
                  id={`order-${order._id}`}
                  className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-xs hover:shadow-md ${
                    isExpanded ? 'border-sky-300 ring-2 ring-sky-50' : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  {/* ── HEADER CỦA THẺ ĐƠN HÀNG ── */}
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50/70 to-white border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Cột trái: Mã đơn & Ngày đặt */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-1.5">
                          <span>Đơn hàng:</span>
                          <span className="font-mono text-sky-600 font-black">
                            #{order._id.substring(0, 8).toUpperCase()}
                          </span>
                        </span>

                        {/* Nút 1-Click Copy */}
                        <button
                          type="button"
                          onClick={() => handleCopyOrderId(order._id)}
                          title="Sao chép toàn bộ mã đơn"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-sky-100 hover:text-sky-700 text-slate-500 text-[11px] font-semibold transition cursor-pointer"
                        >
                          {copiedOrderId === order._id ? (
                            <>
                              <FiCheck className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <FiCopy className="w-3 h-3" />
                              <span>Chép mã</span>
                            </>
                          )}
                        </button>

                        <span className="text-slate-300 hidden sm:inline">•</span>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                      </div>

                      {/* Cột phải: Badge trạng thái & Phương thức thanh toán */}
                      <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                        {/* Phương thức */}
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
                          {order.paymentMethod === 'QR_CODE' ? '📱 QR Code' : '💵 Tiền mặt'}
                        </span>

                        {/* Badge trạng thái */}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${statusBadge.color}`}>
                          {statusBadge.icon}
                          <span>{statusBadge.text}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── THÂN CARD: PREVIEW MÓN ĂN & THÔNG TIN NGƯỜI NHẬN ── */}
                  <div className="p-4 sm:p-5">
                    {/* Danh sách món ăn */}
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3.5 py-1">
                          {/* Ảnh món */}
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-100 overflow-hidden border border-slate-200/80 shrink-0">
                            {item.product?.image ? (
                              <img
                                src={`${getImageUrl(item.product.image)}`}
                                alt={item.product?.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">
                                🍔
                              </div>
                            )}
                          </div>

                          {/* Tên & Số lượng */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm truncate">
                              {item.product?.name || 'Món ăn không còn khả dụng'}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              Số lượng: <span className="font-bold text-slate-700">x{item.quantity}</span>
                              <span className="mx-1.5 text-slate-300">•</span>
                              <span className="text-slate-500">{item.price?.toLocaleString('vi-VN')}đ / phần</span>
                            </p>
                          </div>

                          {/* Thành tiền */}
                          <div className="text-right shrink-0">
                            <span className="font-black text-slate-800 text-sm sm:text-base">
                              {((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN')}đ
                            </span>

                            {/* Nút đánh giá nếu đơn hoàn thành */}
                            {order.status === 'COMPLETED' && (
                              <div className="mt-1">
                                {reviewedProductIds.includes(item.product?._id) ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                    <FiCheck className="w-3 h-3" /> Đã đánh giá
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleOpenReviewModal(item.product)}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md transition cursor-pointer"
                                  >
                                    <FiStar className="w-3 h-3 fill-amber-500" /> Đánh giá
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Thông tin giao hàng tóm tắt (nếu có customerInfo) */}
                    {order.customerInfo && (
                      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
                        {order.customerInfo.name && (
                          <span className="inline-flex items-center gap-1.5">
                            <FiUser className="w-3.5 h-3.5 text-slate-400" />
                            <strong className="text-slate-700">Người nhận:</strong> {order.customerInfo.name}
                          </span>
                        )}
                        {order.customerInfo.phone && (
                          <span className="inline-flex items-center gap-1.5">
                            <FiPhone className="w-3.5 h-3.5 text-slate-400" />
                            <strong className="text-slate-700">SĐT:</strong> {order.customerInfo.phone}
                          </span>
                        )}
                        {order.customerInfo.address && (
                          <span className="inline-flex items-center gap-1.5 truncate max-w-full">
                            <FiMapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <strong className="text-slate-700 shrink-0">Địa chỉ:</strong>
                            <span className="truncate">{order.customerInfo.address}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── KHU VỰC CHI TIẾT MỞ RỘNG (ACCORDION) ── */}
                  {isExpanded && (
                    <div className="bg-slate-50/90 border-t border-slate-100 p-4 sm:p-6 animate-fade-in">
                      {/* Stepper theo dõi tiến trình */}
                      <div className="bg-white rounded-xl p-3 sm:p-5 border border-slate-200/80 mb-5 shadow-2xs">
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Tiến độ xử lý đơn hàng
                        </h5>
                        <OrderStatusTracker status={order.status} />
                      </div>

                      {/* Chi tiết tính tiền */}
                      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs max-w-md ml-auto space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                          <span>Tạm tính tiền món:</span>
                          <span className="font-semibold text-slate-800">
                            {(order.totalAmount || order.finalAmount).toLocaleString('vi-VN')}đ
                          </span>
                        </div>

                        {order.shippingFee > 0 && (
                          <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                            <span>Phí giao hàng:</span>
                            <span className="font-semibold text-slate-800">
                              +{order.shippingFee.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        )}

                        {order.discountAmount > 0 && (
                          <div className="flex justify-between text-xs sm:text-sm text-emerald-600 font-medium">
                            <span className="flex items-center gap-1">
                              <FiTag className="w-3.5 h-3.5" /> Giảm giá voucher:
                            </span>
                            <span className="font-bold">
                              -{order.discountAmount.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                          <span className="text-sm font-bold text-slate-800">Tổng thanh toán:</span>
                          <span className="text-xl sm:text-2xl font-black text-sky-600">
                            {order.finalAmount.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </div>

                      {/* Ghi chú đơn nếu có */}
                      {order.customerInfo?.note && (
                        <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                          <FiInfo className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-bold">Ghi chú từ bạn:</strong> {order.customerInfo.note}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── FOOTER CỦA THẺ ĐƠN HÀNG ── */}
                  <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    {/* Nhóm nút thao tác bên trái */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Xem chi tiết / Thu gọn */}
                      <button
                        type="button"
                        onClick={() => handleToggleExpand(order._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-sky-600 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 transition cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <span>Thu gọn</span>
                            <FiChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <span>Chi tiết đơn</span>
                            <FiChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      {/* Nút xem hóa đơn điện tử */}
                      <button
                        type="button"
                        onClick={() => setReceiptOrder(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-purple-600 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 transition cursor-pointer"
                      >
                        <FiFileText className="w-4 h-4 text-purple-500" />
                        <span>Hóa đơn</span>
                      </button>

                      {/* Nút hủy đơn hàng nếu đang PENDING */}
                      {order.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(order._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 transition cursor-pointer"
                        >
                          <FiXCircle className="w-4 h-4" />
                          <span>Hủy đơn</span>
                        </button>
                      )}
                    </div>

                    {/* Nhóm tổng tiền & nút Mua lại bên phải */}
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 font-bold block">Tổng tiền</span>
                        <span className="text-lg sm:text-xl font-black text-sky-600">
                          {order.finalAmount.toLocaleString('vi-VN')}đ
                        </span>
                      </div>

                      {/* Nút Đặt lại đơn này */}
                      <button
                        type="button"
                        onClick={() => handleReorder(order.items)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer shrink-0"
                      >
                        <FiRefreshCw className="w-3.5 h-3.5" />
                        <span>Đặt lại</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= PHÂN TRANG ================= */}
        {!loading && pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => fetchOrders(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Trang trước
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => fetchOrders(page)}
                className={`w-9 h-9 rounded-xl text-xs sm:text-sm font-bold transition ${
                  pagination.currentPage === page
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => fetchOrders(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Trang sau
            </button>
          </div>
        )}

        {/* ================= MODAL HÓA ĐƠN ĐIỆN TỬ (E-RECEIPT) ================= */}
        {receiptOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
              {/* Header modal */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between no-print">
                <div className="flex items-center gap-2">
                  <FiFileText className="w-5 h-5 text-sky-500" />
                  <h3 className="font-extrabold text-slate-800 text-base">Hóa Đơn Điện Tử</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintReceipt}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    <FiPrinter className="w-3.5 h-3.5" />
                    <span>In</span>
                  </button>
                  <button
                    onClick={() => setReceiptOrder(null)}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Nội dung hóa đơn in được */}
              <div id="printable-receipt" className="p-6 text-slate-800 space-y-4">
                {/* Logo & Thông tin quán */}
                <div className="text-center pb-4 border-b border-dashed border-slate-300">
                  <h2 className="text-2xl font-black text-sky-500 tracking-wider">DUALEOFOOD</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Ẩm Thực Tươi Ngon • Giao Hàng Siêu Tốc</p>
                  <p className="text-[11px] text-slate-400">Hotline: 1900 6868 • Website: dualeofood.vn</p>
                </div>

                {/* Thông tin đơn */}
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã hóa đơn:</span>
                    <span className="font-mono font-bold">#{receiptOrder._id.substring(0, 10).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Thời gian đặt:</span>
                    <span className="font-semibold">{new Date(receiptOrder.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hình thức thanh toán:</span>
                    <span className="font-semibold">
                      {receiptOrder.paymentMethod === 'QR_CODE' ? 'Chuyển khoản QR' : 'Tiền mặt khi nhận'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Trạng thái:</span>
                    <span className="font-bold text-sky-600">
                      {statusConfig[receiptOrder.status]?.text || receiptOrder.status}
                    </span>
                  </div>
                </div>

                {/* Thông tin người nhận */}
                {receiptOrder.customerInfo && (
                  <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-slate-700">Khách hàng nhận hàng:</p>
                    <p>{receiptOrder.customerInfo.name || 'Khách hàng'} • {receiptOrder.customerInfo.phone || 'N/A'}</p>
                    <p className="text-slate-500">{receiptOrder.customerInfo.address || 'Giao tận nơi'}</p>
                  </div>
                )}

                {/* Bảng món ăn */}
                <div className="border-t border-b border-dashed border-slate-300 py-3 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider pb-1">
                    <span>Món ăn</span>
                    <span>Thành tiền</span>
                  </div>
                  {receiptOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{item.product?.name || 'Món ăn'}</p>
                        <p className="text-[11px] text-slate-500">
                          {item.quantity} x {item.price?.toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                      <span className="font-bold text-slate-800">
                        {((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tổng kết tiền */}
                <div className="text-xs space-y-1.5 pt-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Tạm tính:</span>
                    <span>{(receiptOrder.totalAmount || receiptOrder.finalAmount).toLocaleString('vi-VN')}đ</span>
                  </div>
                  {receiptOrder.shippingFee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Phí giao hàng:</span>
                      <span>+{receiptOrder.shippingFee.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  {receiptOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Giảm giá khuyến mãi:</span>
                      <span>-{receiptOrder.discountAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-800 pt-2 border-t border-slate-200">
                    <span>TỔNG CỘNG:</span>
                    <span className="text-sky-600 text-lg">
                      {receiptOrder.finalAmount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>

                {/* Lời cảm ơn chân thành */}
                <div className="text-center pt-3 text-xs text-slate-400 italic border-t border-dashed border-slate-300">
                  <p>Cảm ơn bạn đã lựa chọn DualeoFood!</p>
                  <p className="text-[10px] mt-0.5">Chúc quý khách ngon miệng và có trải nghiệm tuyệt vời ❤️</p>
                </div>
              </div>

              {/* Nút đóng modal */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 no-print">
                <button
                  onClick={() => setReceiptOrder(null)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm rounded-xl transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal đánh giá */}
        {isReviewModalOpen && productToReview && (
          <ReviewModal
            product={productToReview}
            onClose={() => {
              setIsReviewModalOpen(false);
              setProductToReview(null);
            }}
            onReviewSubmitted={handleReviewSubmitted}
          />
        )}
      </div>
    </div>
  );
};

export default MyOrders;