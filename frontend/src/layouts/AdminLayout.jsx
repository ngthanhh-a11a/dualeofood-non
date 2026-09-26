import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiMenu, FiHome, FiBox, FiTag, FiShoppingCart, FiLogOut, 
  FiMessageSquare, FiUsers, FiBell, FiMail, FiImage, FiFileText, 
  FiSettings, FiChevronLeft, FiSearch, FiGlobe, FiGrid, FiGift, 
  FiMessageCircle, FiCheckCircle, FiClock, FiAlertCircle, FiRefreshCw, FiX
} from 'react-icons/fi';
import axios, { SERVER_URL, getImageUrl } from '../utils/axiosConfig';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();

  // State quản lý số lượng công việc cần xử lý thời gian thực
  const [pendingCounts, setPendingCounts] = useState({
    pendingOrders: 0,
    pendingArticles: 0,
    pendingStories: 0,
    pendingContentTotal: 0,
    unreadMessages: 0,
    unreadLiveChats: 0,
    totalNeedAction: 0,
  });

  // State cho bong bóng thông báo góc dưới bên phải
  const [isBubbleMenuOpen, setIsBubbleMenuOpen] = useState(false);
  const bubbleRef = useRef(null);

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  // Lấy toàn bộ số lượng việc cần xử lý từ server
  const fetchAllPendingCounts = async () => {
    try {
      const res = await axios.get('/notifications/admin-pending-counts');
      if (res.data) {
        setPendingCounts(res.data);
      }
    } catch (error) {
      try {
        const [ordersRes, msgsRes] = await Promise.all([
          axios.get('/orders/count/pending'),
          axios.get('/messages')
        ]);
        const orders = ordersRes.data?.count || 0;
        const unreadMsgs = (msgsRes.data || []).filter(m => !m.isRead).length;
        setPendingCounts(prev => ({
          ...prev,
          pendingOrders: orders,
          unreadMessages: unreadMsgs,
          totalNeedAction: orders + unreadMsgs + prev.pendingContentTotal + prev.unreadLiveChats
        }));
      } catch (err) {
        console.warn('Không thể đồng bộ số lượng việc cần duyệt:', err);
      }
    }
  };

  // Tải dữ liệu ban đầu và khi đổi trang
  useEffect(() => {
    fetchAllPendingCounts();
  }, [location.pathname]);

  // Đóng bong bóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bubbleRef.current && !bubbleRef.current.contains(event.target)) {
        setIsBubbleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // LẮNG NGHE REALTIME SOCKET.IO (KHÔNG CẦN TẢI LẠI TRANG)
  useEffect(() => {
    if (!socket) return;

    // 1. Nhận cập nhật toàn bộ số lượng cần xử lý từ backend
    socket.on('admin_pending_counts', (counts) => {
      setPendingCounts(counts);
    });

    // 2. Nhận số lượng đơn hàng thay đổi (tương thích)
    socket.on('update_pending_orders_count', (count) => {
      setPendingCounts(prev => ({
        ...prev,
        pendingOrders: count,
        totalNeedAction: count + prev.pendingContentTotal + prev.unreadMessages + prev.unreadLiveChats
      }));
    });

    // 3. Có đơn hàng mới được đặt thời gian thực
    socket.on('new_order', (order) => {
      const orderCode = order.orderCode || order._id?.slice(-6)?.toUpperCase();
      const amount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount || 0);

      toast.custom((t) => (
        <div 
          onClick={() => {
            navigate('/admin/orders');
            toast.dismiss(t.id);
          }}
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 p-4 cursor-pointer hover:bg-slate-50 transition border-l-4 border-rose-500`}
        >
          <div className="flex-1 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl shrink-0">
              🛍️
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-rose-600 uppercase tracking-wider">Đơn Hàng Mới Cần Duyệt!</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">Mã: #{orderCode} • {amount}</p>
              <p className="text-xs text-slate-500 mt-0.5">Khách: {order.shippingAddress?.fullName || 'Khách hàng'}</p>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
            className="text-slate-400 hover:text-slate-600 self-start p-1 cursor-pointer"
          >
            <FiX size={16} />
          </button>
        </div>
      ), { duration: 7000 });
    });

    // 4. Có bài viết, story hoặc liên hệ mới
    socket.on('new_admin_notification', (data) => {
      toast.custom((t) => (
        <div 
          onClick={() => {
            if (data.type === 'STORY_PENDING' || data.type === 'ARTICLE_PENDING') {
              navigate('/admin/articles');
            } else if (data.type === 'NEW_MESSAGE') {
              navigate('/admin/messages');
            } else if (data.type === 'NEW_REVIEW' || data.type === 'NEW_COMMENT') {
              navigate('/admin/reviews');
            }
            toast.dismiss(t.id);
          }}
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 p-4 cursor-pointer hover:bg-slate-50 transition border-l-4 border-amber-500`}
        >
          <div className="flex-1 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl shrink-0">
              {data.type === 'STORY_PENDING' ? '📱' : data.type === 'NEW_MESSAGE' ? '✉️' : (data.type === 'NEW_REVIEW' || data.type === 'NEW_COMMENT') ? '⭐' : '✍️'}
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-amber-600 uppercase tracking-wider">Cần Phê Duyệt / Xử Lý</p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">{data.message}</p>
              <p className="text-[11px] text-sky-600 mt-1 font-semibold flex items-center gap-1">
                Bấm để xem và duyệt ngay ➔
              </p>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
            className="text-slate-400 hover:text-slate-600 self-start p-1 cursor-pointer"
          >
            <FiX size={16} />
          </button>
        </div>
      ), { duration: 7000 });
    });

    // 5. Có tin nhắn Live Chat mới từ khách hàng
    socket.on('new_chat_message', (data) => {
      toast.custom((t) => (
        <div 
          onClick={() => {
            navigate('/admin/live-chat');
            toast.dismiss(t.id);
          }}
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 p-4 cursor-pointer hover:bg-slate-50 transition border-l-4 border-emerald-500`}
        >
          <div className="flex-1 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl shrink-0">
              💬
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-emerald-600 uppercase tracking-wider">Live Chat - Tin Nhắn Mới</p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">{data.customerName}: "{data.message?.content?.slice(0, 45)}..."</p>
              <p className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                Bấm để mở cuộc trò chuyện ➔
              </p>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
            className="text-slate-400 hover:text-slate-600 self-start p-1 cursor-pointer"
          >
            <FiX size={16} />
          </button>
        </div>
      ), { duration: 6000 });
    });

    return () => {
      socket.off('admin_pending_counts');
      socket.off('update_pending_orders_count');
      socket.off('new_order');
      socket.off('new_admin_notification');
      socket.off('new_chat_message');
    };
  }, [socket, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('chat_guest_id');
    window.dispatchEvent(new Event('authChange'));
    navigate('/login');
  };

  // Cấu hình Menu Sidebar kèm Chấm Đỏ và Badge số lượng thời gian thực
  const menuGroups = [
    {
      title: 'TỔNG QUAN',
      items: [
        { name: 'Dashboard', path: '/admin', icon: <FiHome /> },
      ]
    },
    {
      title: 'QUẢN LÝ CỬA HÀNG',
      items: [
        { 
          name: 'Đơn Hàng', 
          path: '/admin/orders', 
          icon: <FiShoppingCart />, 
          badge: pendingCounts.pendingOrders, 
          badgeColor: 'bg-rose-500 animate-pulse',
          hasAlertDot: pendingCounts.pendingOrders > 0
        },
        { name: 'Món ăn', path: '/admin/products', icon: <FiBox /> },
        { name: 'Danh mục', path: '/admin/categories', icon: <FiGrid /> },
        { name: 'Mã Giảm Giá', path: '/admin/coupons', icon: <FiGift /> },
      ]
    },
    {
      title: 'MARKETING & NỘI DUNG',
      items: [
        { name: 'Khách Hàng', path: '/admin/users', icon: <FiUsers /> },
        { name: 'Banners', path: '/admin/banners', icon: <FiImage /> },
        { 
          name: 'Bài viết & Story', 
          path: '/admin/articles', 
          icon: <FiFileText />, 
          badge: pendingCounts.pendingContentTotal,
          badgeColor: 'bg-rose-500 animate-pulse',
          hasAlertDot: pendingCounts.pendingContentTotal > 0,
        },
        { 
          name: 'Bình luận', 
          path: '/admin/reviews', 
          icon: <FiMessageCircle />
        },
      ]
    },
    {
      title: 'TƯƠNG TÁC & HỖ TRỢ',
      items: [
        { 
          name: 'Live Chat', 
          path: '/admin/live-chat', 
          icon: <FiMessageSquare />,
          badge: pendingCounts.unreadLiveChats,
          badgeColor: 'bg-emerald-500 animate-pulse',
          hasAlertDot: pendingCounts.unreadLiveChats > 0
        },
        { 
          name: 'Hộp Thư', 
          path: '/admin/messages', 
          icon: <FiMail />, 
          badge: pendingCounts.unreadMessages, 
          badgeColor: 'bg-indigo-500',
          hasAlertDot: pendingCounts.unreadMessages > 0
        },
        { name: 'Thông Báo', path: '/admin/broadcast', icon: <FiBell /> },
      ]
    },
    {
      title: 'HỆ THỐNG',
      items: [
        { name: 'Cài Đặt', path: '/admin/settings', icon: <FiSettings /> },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* ================= 1. SIDEBAR (THANH TRƯỢT QUẢN TRỊ) ================= */}
      <aside 
        className={`bg-white shadow-[4px_0_24px_rgba(0,0,0,0.03)] border-r border-slate-100 transition-all duration-300 ease-in-out flex flex-col z-20 ${
          isSidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        {/* LOGO AREA */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/25">
                <span className="text-white font-black text-lg">D</span>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight text-slate-800 whitespace-nowrap leading-none">
                  Dualeo<span className="text-sky-500">Admin</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1">Hệ thống quản trị 24/7</span>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center mx-auto shrink-0 shadow-lg shadow-sky-500/25">
              <span className="text-white font-black text-lg">D</span>
            </div>
          )}
        </div>

        {/* NAVIGATION THANH TRƯỢT */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 custom-scrollbar">
          <div className="px-3.5 space-y-6">
            {menuGroups.map((group, idx) => (
              <div key={idx}>
                {/* Tiêu đề nhóm */}
                {isSidebarOpen && (
                  <h3 className="px-3 text-[11px] font-black tracking-wider text-slate-400 mb-2 uppercase">
                    {group.title}
                  </h3>
                )}
                
                {/* Danh sách mục menu */}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                    return (
                      <Link 
                        key={item.name} 
                        to={item.path} 
                        className={`relative flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                          isActive 
                            ? 'bg-sky-50 text-sky-600 font-bold shadow-xs' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                        } ${!isSidebarOpen && 'justify-center'}`}
                        title={!isSidebarOpen ? item.name : ''}
                      >
                        {/* Vạch kích hoạt thanh bên trái */}
                        {isActive && isSidebarOpen && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-sky-500 rounded-r-full"></div>
                        )}

                        {/* Icon và Chấm đỏ cảnh báo khi thu gọn */}
                        <div className="relative flex items-center justify-center">
                          <span className={`text-[20px] transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                            {item.icon}
                          </span>

                          {/* Chấm đỏ khi Sidebar thu gọn */}
                          {!isSidebarOpen && item.hasAlertDot && (
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 text-white text-[8px] font-black items-center justify-center border border-white">
                                {item.badge > 9 ? '•' : item.badge}
                              </span>
                            </span>
                          )}
                        </div>
                        
                        {/* Tên mục & Chấm đỏ cảnh báo khi mở rộng */}
                        {isSidebarOpen && (
                          <div className="ml-3 flex-1 flex items-center justify-between min-w-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="truncate">{item.name}</span>
                              {item.hasAlertDot && (
                                <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" title="Cần xử lý" />
                              )}
                            </div>

                            {/* Badge số lượng đỏ rực rỡ */}
                            {item.badge > 0 && (
                              <span className={`ml-2 ${item.badgeColor || 'bg-rose-500'} text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-xs shrink-0 flex items-center gap-1`}>
                                <span>{item.badge > 99 ? '99+' : item.badge}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* FOOTER USER AREA */}
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout} 
            className={`flex items-center text-slate-500 hover:text-red-500 w-full px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors font-bold text-sm ${!isSidebarOpen && 'justify-center'}`}
            title={!isSidebarOpen ? 'Đăng xuất' : ''}
          >
            <FiLogOut className="text-[20px]" />
            {isSidebarOpen && <span className="ml-3">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* ================= 2. MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* TOPBAR */}
        <header className="h-20 bg-white/90 backdrop-blur-md shadow-xs border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
              title="Đóng / Mở thanh trượt"
            >
              <FiMenu className="text-xl" />
            </button>

            <div className="hidden md:flex items-center text-xs font-bold text-slate-500 bg-slate-100/80 px-3.5 py-2 rounded-xl gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Thời gian thực (Realtime Connected)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3.5">
            {/* Nút xem trang chủ */}
            <a 
              href="/" 
              target="_blank" 
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-sky-600 bg-slate-50 hover:bg-sky-50 px-3.5 py-2 rounded-xl transition-colors border border-slate-200/60"
            >
              <FiGlobe /> <span>Xem Web</span>
            </a>

            {/* Nút làm mới dữ liệu nhanh */}
            <button
              onClick={() => {
                fetchAllPendingCounts();
                toast.success('Đã làm mới số liệu công việc!');
              }}
              className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors border border-slate-200/60 cursor-pointer"
              title="Làm mới số liệu"
            >
              <FiRefreshCw className="text-base" />
            </button>
            
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            
            {/* User profile trên topbar */}
            <div className="flex items-center gap-2.5 p-1 pr-2.5 rounded-2xl border border-transparent hover:border-slate-100 transition-colors">
              <img 
                src={`https://ui-avatars.com/api/?name=${userInfo?.name || 'Admin'}&background=0284c7&color=fff&rounded=true&bold=true`} 
                alt="Admin" 
                className="w-9 h-9 rounded-xl shadow-xs" 
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-black text-slate-800 leading-tight">{userInfo?.name || 'Administrator'}</p>
                <p className="text-[10px] font-bold text-sky-500 uppercase tracking-wider">Quản trị viên</p>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/60 p-4 sm:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <Outlet context={{ fetchAllPendingCounts, pendingCounts }} /> 
          </div>
        </main>
      </div>

      {/* ================= 3. NÚT CHUÔNG BONG BÓNG MẶC ĐỊNH GÓC DƯỚI PHẢI (FLOATING ACTION BUBBLE) ================= */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end" ref={bubbleRef}>
        
        {/* DROPDOWN MENU BUNG LÊN PHÍA TRÊN BONG BÓNG */}
        {isBubbleMenuOpen && (
          <div className="mb-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-scaleUp z-50">
            {/* Header menu */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-white/10 text-white text-base">🔔</span>
                <div>
                  <h4 className="font-bold text-sm">Việc Cần Giải Quyết</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {pendingCounts.totalNeedAction > 0 
                      ? `Có ${pendingCounts.totalNeedAction} mục đang chờ xử lý` 
                      : 'Tuyệt vời! Không có mục nào chờ duyệt 🎉'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsBubbleMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Danh sách các việc cần giải quyết */}
            <div className="p-3 divide-y divide-slate-100 max-h-[380px] overflow-y-auto custom-scrollbar">
              {/* Mục 1: Đơn hàng */}
              <div 
                onClick={() => { navigate('/admin/orders'); setIsBubbleMenuOpen(false); }}
                className="py-2.5 px-3 rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    🛍️
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-800 group-hover:text-rose-600 transition-colors">
                      Đơn hàng mới chờ duyệt
                    </p>
                    <p className="text-[11px] text-slate-400">Đơn hàng cần chuẩn bị & giao</p>
                  </div>
                </div>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  pendingCounts.pendingOrders > 0 
                    ? 'bg-rose-500 text-white animate-pulse shadow-xs' 
                    : 'bg-slate-100 text-slate-400 font-bold'
                }`}>
                  {pendingCounts.pendingOrders}
                </span>
              </div>

              {/* Mục 2: Bài viết */}
              <div 
                onClick={() => { navigate('/admin/articles'); setIsBubbleMenuOpen(false); }}
                className="py-2.5 px-3 rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    📰
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-800 group-hover:text-amber-600 transition-colors">
                      Bài viết cộng đồng chờ duyệt
                    </p>
                    <p className="text-[11px] text-slate-400">Bài chia sẻ từ khách hàng</p>
                  </div>
                </div>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  pendingCounts.pendingArticles > 0 
                    ? 'bg-amber-500 text-white animate-pulse shadow-xs' 
                    : 'bg-slate-100 text-slate-400 font-bold'
                }`}>
                  {pendingCounts.pendingArticles}
                </span>
              </div>

              {/* Mục 3: Story 24h */}
              <div 
                onClick={() => { navigate('/admin/articles?tab=stories'); setIsBubbleMenuOpen(false); }}
                className="py-2.5 px-3 rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    📱
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-800 group-hover:text-rose-600 transition-colors">
                      Story 24h ẩm thực chờ duyệt
                    </p>
                    <p className="text-[11px] text-slate-400">Khoảnh khắc tin ngắn từ người dùng</p>
                  </div>
                </div>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  pendingCounts.pendingStories > 0 
                    ? 'bg-rose-500 text-white animate-pulse shadow-xs' 
                    : 'bg-slate-100 text-slate-400 font-bold'
                }`}>
                  {pendingCounts.pendingStories}
                </span>
              </div>

              {/* Mục 4: Live Chat */}
              <div 
                onClick={() => { navigate('/admin/live-chat'); setIsBubbleMenuOpen(false); }}
                className="py-2.5 px-3 rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    💬
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-800 group-hover:text-emerald-600 transition-colors">
                      Live Chat cần phản hồi
                    </p>
                    <p className="text-[11px] text-slate-400">Khách đang nhắn tin trực tuyến</p>
                  </div>
                </div>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  pendingCounts.unreadLiveChats > 0 
                    ? 'bg-emerald-500 text-white animate-pulse shadow-xs' 
                    : 'bg-slate-100 text-slate-400 font-bold'
                }`}>
                  {pendingCounts.unreadLiveChats}
                </span>
              </div>

              {/* Mục 5: Hộp thư */}
              <div 
                onClick={() => { navigate('/admin/messages'); setIsBubbleMenuOpen(false); }}
                className="py-2.5 px-3 rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    ✉️
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition-colors">
                      Tin nhắn liên hệ chưa xem
                    </p>
                    <p className="text-[11px] text-slate-400">Khách gửi phản hồi & câu hỏi</p>
                  </div>
                </div>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  pendingCounts.unreadMessages > 0 
                    ? 'bg-indigo-500 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-400 font-bold'
                }`}>
                  {pendingCounts.unreadMessages}
                </span>
              </div>
            </div>

            {/* Footer dropdown */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Tự động cập nhật thời gian thực</span>
              <button
                onClick={() => {
                  fetchAllPendingCounts();
                  toast.success('Đã làm mới số liệu!');
                }}
                className="font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
              >
                <FiRefreshCw size={12} /> Làm mới
              </button>
            </div>
          </div>
        )}

        {/* NÚT BONG BÓNG TRÒN NỔI BẬT GÓC DƯỚI PHẢI */}
        <button
          onClick={() => setIsBubbleMenuOpen(!isBubbleMenuOpen)}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer ring-4 ring-white ${
            pendingCounts.totalNeedAction > 0
              ? 'bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 shadow-rose-500/40'
              : 'bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 shadow-sky-500/40'
          }`}
          title="Trung tâm thông báo & Công việc cần duyệt"
        >
          <FiBell className={`text-2xl ${pendingCounts.totalNeedAction > 0 ? 'animate-bounce' : ''}`} />

          {/* Chấm đỏ nhấp nháy + Huy hiệu số lượng việc cần xử lý */}
          {pendingCounts.totalNeedAction > 0 && (
            <span className="absolute -top-1 -right-1 flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-rose-600 text-white text-[11px] font-black items-center justify-center border-2 border-white shadow-md">
                {pendingCounts.totalNeedAction > 99 ? '99+' : pendingCounts.totalNeedAction}
              </span>
            </span>
          )}
        </button>

      </div>

    </div>
  );
};

export default AdminLayout;