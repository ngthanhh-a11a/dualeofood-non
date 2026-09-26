import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../../redux/cartSlice'; // Import action clearCart
import { openAuthModal } from '../../redux/uiSlice'; // Import action mở popup login
import axios, { SERVER_URL , getImageUrl } from '../../utils/axiosConfig'; // Import axios và SERVER_URL
import RubberSegment from './RubberSegment';
import logoImage from '../../assets/logo.png';
import { 
  FiHome, FiInfo, FiBookOpen, FiFileText, FiTag, FiPhone, 
  FiList, FiShoppingBag, FiUser, FiCopy, FiCheck, FiGift, 
  FiArrowRight, FiSearch, FiBookmark, FiPercent, FiShoppingCart, FiBell,
  FiHeadphones
} from 'react-icons/fi'; // Icons Header & Bottom Nav & Voucher & Support
import { useSocket } from '../../contexts/SocketContext'; // Lắng nghe real-time
import { formatDistanceToNow } from 'date-fns'; // Hiển thị "5 phút trước"
import { vi } from 'date-fns/locale'; // Ngôn ngữ Tiếng Việt
import toast from 'react-hot-toast';

const Header = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false); // State cho dropdown của user
  const navigate = useNavigate();
  const location = useLocation(); // Lấy vị trí hiện tại

  // --- START: STATE VÀ LOGIC CHO HỆ THỐNG THÔNG BÁO ---
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const socket = useSocket();
  const notifRef = useRef(null); // Để xử lý click bên ngoài dropdown
  // --- END: STATE VÀ LOGIC CHO HỆ THỐNG THÔNG BÁO ---

  // --- START: STATE CHO SỐ LƯỢNG VOUCHER ---
  const [voucherCount, setVoucherCount] = useState(0);
  // --- END: STATE CHO SỐ LƯỢNG VOUCHER ---

  
  // 1. Lấy thông tin giỏ hàng từ Redux
  // Thêm fallback an toàn trong trường hợp state.cart chưa khởi tạo
  const cartState = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const cartItems = cartState?.items || [];
  
  // 2. Kiểm tra xem khách đã đăng nhập chưa (Lấy dữ liệu từ Local Storage)
  let userInfo = null;
  try {
    const storedUser = localStorage.getItem('userInfo');
    // Đảm bảo storedUser là một chuỗi JSON hợp lệ (bắt đầu bằng { )
    if (storedUser && storedUser !== 'undefined' && storedUser !== 'null' && storedUser.startsWith('{')) {
      userInfo = JSON.parse(storedUser);
    }
  } catch (error) {
    console.error('Lỗi khi parse userInfo:', error);
    // Xóa dữ liệu lỗi để tránh lặp lại
    localStorage.removeItem('userInfo');
  }

  // --- Đã gỡ bỏ logic unlockAudio vì không cần thiết và gây warning ---

  // --- START: CÁC HÀM XỬ LÝ THÔNG BÁO ---

  // 2. Gọi API lấy danh sách thông báo khi người dùng đăng nhập
  useEffect(() => {
    // Chỉ lấy thông báo cho khách hàng
    if (userInfo && userInfo.role !== 'admin') {
      const fetchNotifications = async () => {
        try {
          const res = await axios.get('/notifications');
          setNotifications(res.data);
        } catch (error) {
          console.error('Lỗi khi tải thông báo', error);
        }
      };
      fetchNotifications();
    }
  }, [userInfo?._id, userInfo?.role]); // Chạy lại khi trạng thái đăng nhập hoặc vai trò thay đổi

  // 3. Lắng nghe thông báo mới real-time qua Socket.IO
  useEffect(() => {
    // Chỉ kết nối socket và lắng nghe thông báo cho khách hàng (customer)
    if (!userInfo || userInfo.role === 'admin' || !socket) return;

    socket.on('new_notification', (newNotification) => {
      // Thêm thông báo mới vào đầu danh sách và tạo hiệu ứng rung
      setNotifications(prev => [newNotification, ...prev]);

      // --- PHÁT ÂM THANH THÔNG BÁO CHO KHÁCH HÀNG ---
      const playNotificationSound = async () => {
        try {
          const audio = new Audio('/notification.mp3'); // Đảm bảo file này có trong thư mục /public
          await audio.play();
        } catch (err) {
          // Lỗi này thường xảy ra do chính sách của trình duyệt chặn tự động phát âm thanh
          console.warn('Không thể tự động phát âm thanh thông báo cho khách hàng:', err);
        }
      };
      playNotificationSound();
    });

    return () => {
      socket.off('new_notification');
    };
  }, [userInfo?._id, userInfo?.role, socket]); // Thêm role vào dependency array

  // 4. Đóng dropdown thông báo khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  // Đóng mở User Sidebar Drawer thông thường
  // ─────────────────────────────────────────────────────────────────────
  const openUserSidebar = () => {
    setIsUserMenuOpen(true);
  };

  const closeUserSidebar = () => {
    setIsUserMenuOpen(false);
  };

  // Đóng sidebar khi nhấn Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isUserMenuOpen) {
        setIsUserMenuOpen(false);
        document.getElementById('user-account-btn')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUserMenuOpen]);

  // Lấy số lượng voucher khả dụng trong ví người dùng
  useEffect(() => {
    if (!userInfo) return;
    axios.get('/vouchers/my-vouchers')
      .then(res => {
        const raw = res?.data;
        const list = Array.isArray(raw) ? raw : (raw?.data || raw?.vouchers || []);
        const activeList = list.filter(v => !v.isUsed && v.coupon && v.coupon.isActive && new Date(v.coupon.expiryDate) >= new Date());
        setVoucherCount(activeList.length);
      })
      .catch(() => {});
  }, [userInfo?._id, isUserMenuOpen]);

  // 5. Tính toán số thông báo chưa đọc (chấm đỏ)
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // 6. Hàm xử lý khi click vào 1 thông báo
  const handleNotifClick = async (notif) => {
    // 1. Đánh dấu là đã đọc (nếu chưa đọc)
    if (!notif.isRead) {
      try {
        await axios.put(`/notifications/${notif._id}/read`);
        setNotifications(prev => prev.map(n =>
          n._id === notif._id ? { ...n, isRead: true } : n
        ));
      } catch (error) {
        console.error('Lỗi khi đánh dấu đã đọc', error);
      }
    }

    // 2. Đóng dropdown
    setIsNotifOpen(false);

    // 3. Điều hướng theo liên kết hoặc loại thông báo
    if (notif.link) {
      navigate(notif.link);
    } else if (notif.type === 'ORDER_UPDATE' && notif.orderId) {
      navigate('/my-orders', { state: { scrollToOrderId: notif.orderId } });
    } else if (notif.type && notif.type.startsWith('ARTICLE_')) {
      navigate('/blog');
    }
  };

  // 7. Hàm xử lý khi click "Đánh dấu tất cả đã đọc"
  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) { console.error('Lỗi khi đánh dấu tất cả đã đọc', error); }
  };

  const handleLogout = () => {
    // 1. Xóa thông tin đăng nhập khỏi localStorage TRƯỚC.
    // Điều này đảm bảo giỏ hàng trống (sau khi clear) sẽ được lưu vào 'cart_anonymous'
    // thay vì ghi đè lên giỏ hàng đã lưu của người dùng.
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('chat_guest_id');

    // Thông báo sự kiện thay đổi auth cho các component như CustomerChatWidget lắng nghe
    window.dispatchEvent(new Event('authChange'));

    // 2. Xóa giỏ hàng khỏi Redux. Middleware sẽ tự động lưu giỏ hàng trống này.
    dispatch(clearCart());

    // Đẩy về trang chủ thay vì /login
    navigate('/');
  };

  const currentNavValue = useMemo(() => {
    const p = location.pathname;
    if (p === '/') return '/';
    if (p.startsWith('/about')) return '/about';
    if (p.startsWith('/menu') || p.startsWith('/product')) return '/menu';
    if (p.startsWith('/blog')) return '/blog';
    if (p.startsWith('/promotions')) return '/promotions';
    if (p.startsWith('/contact')) return '/contact';
    return '';
  }, [location.pathname]);

  const navItems = [
    {
      value: '/',
      label: (
        <span className="hidden xl:inline text-xs xl:text-sm font-bold whitespace-nowrap">
          Trang chủ
        </span>
      ),
      icon: <FiHome className="w-4 h-4 sm:w-4.5 sm:h-4.5 flex-shrink-0" />
    },
    {
      value: '/about',
      label: (
        <span className="hidden xl:inline text-xs xl:text-sm font-bold whitespace-nowrap">
          Giới thiệu
        </span>
      ),
      icon: <FiInfo className="w-4 h-4 sm:w-4.5 sm:h-4.5 flex-shrink-0" />
    },
    {
      value: '/menu',
      label: (
        <span className="hidden xl:inline text-xs xl:text-sm font-bold whitespace-nowrap">
          Thực đơn
        </span>
      ),
      icon: <FiBookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5 flex-shrink-0" />
    },
    {
      value: '/blog',
      label: (
        <span className="hidden xl:inline text-xs xl:text-sm font-bold whitespace-nowrap">
          Bài viết
        </span>
      ),
      icon: <FiFileText className="w-4 h-4 sm:w-4.5 sm:h-4.5 flex-shrink-0" />
    },
    {
      value: '/promotions',
      label: (
        <span className="hidden xl:inline text-xs xl:text-sm font-bold whitespace-nowrap">
          Khuyến Mãi
        </span>
      ),
      icon: <FiTag className="w-4 h-4 sm:w-4.5 sm:h-4.5 flex-shrink-0" />
    },
    {
      value: '/contact',
      label: (
        <span className="hidden xl:inline text-xs xl:text-sm font-bold whitespace-nowrap">
          Liên hệ
        </span>
      ),
      icon: <FiPhone className="w-4 h-4 sm:w-4.5 sm:h-4.5 flex-shrink-0" />
    },
  ];

  const handleNavChange = (newPath) => {
    if (newPath && newPath !== location.pathname) {
      navigate(newPath);
    }
  };

  return (
    <>
      <header className="bg-white shadow-xs sticky top-0 z-40 font-sans">
      <style>{`
        .animate-fade-in-down { animation: fade-in-down 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; } 
        @keyframes fade-in-down { 
            from { opacity: 0; transform: translateY(-8px); } 
            to { opacity: 1; transform: translateY(0); } 
        }
        .shake { animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both; }

        /* Scrollbar tinh tế cho thông báo */
        .custom-notif-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-notif-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-notif-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
        .custom-notif-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        /* ── User Sidebar Drawer CSS ── */
        #user-sidebar-drawer {
          position: fixed;
          inset: 0;
          z-index: 300;
          padding: 0.75rem;
          pointer-events: none;
          visibility: hidden;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.6rem;
          overflow-x: hidden;
          overflow-y: auto;
          transition: visibility 0.65s ease;
        }
        @media (min-width: 640px) {
          #user-sidebar-drawer {
            padding: 1.25rem;
            gap: 0.75rem;
          }
        }
        #user-sidebar-drawer {
          position: fixed;
          inset: 0;
          z-index: 300;
          padding: 0.75rem;
          pointer-events: none;
          visibility: hidden;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.6rem;
          overflow-x: hidden;
          overflow-y: auto;
          transition: visibility 0.45s ease;
        }
        @media (min-width: 640px) {
          #user-sidebar-drawer {
            padding: 1.25rem;
            gap: 0.75rem;
          }
        }
        #user-sidebar-drawer.open {
          visibility: visible;
          pointer-events: auto;
          transition: visibility 0s ease;
        }
        .user-sidebar-bg {
          position: fixed;
          inset: 0;
          z-index: 1;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(3px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        #user-sidebar-drawer.open .user-sidebar-bg {
          opacity: 1;
          pointer-events: auto;
        }

        .user-sidebar-panel {
          max-width: 420px;
          width: 100%;
          border-radius: 20px;
          position: relative;
          z-index: 10;
          pointer-events: auto;
          transform: translateX(110%);
          opacity: 0;
          border: none;
          user-select: none;
          will-change: transform, opacity;
          transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
        }

        /* Khi đóng/thoát ra: Top và Bottom trượt ra êm ái theo đường cong tự nhiên */
        .user-sidebar-panel-top {
          background: #ffffff;
          box-shadow: 0 10px 40px rgba(0,0,0,0.12), 0 2px 10px rgba(0,0,0,0.06);
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          max-height: calc(90vh - 80px);
          transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
          transition-delay: 0s;
        }
        .user-sidebar-panel-bottom {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          box-shadow: 0 10px 30px rgba(2, 132, 199, 0.28), 0 2px 10px rgba(0,0,0,0.06);
          padding: 0.875rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 64px;
          transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
          transition-delay: 0.08s;
        }

        /* ── Animated Logout Button ── */
        .Btn-logout {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          width: 44px;
          height: 44px;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: width 0.18s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.18s ease, border-radius 0.18s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
          background-color: rgb(255, 65, 65);
          flex-shrink: 0;
        }

        .Btn-logout .sign {
          width: 100%;
          transition: width 0.18s cubic-bezier(0.16, 1, 0.3, 1), padding 0.18s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .Btn-logout .sign svg {
          width: 17px;
          height: 17px;
        }

        .Btn-logout .sign svg path {
          fill: white;
        }

        .Btn-logout .text {
          position: absolute;
          right: 0%;
          width: 0%;
          opacity: 0;
          color: white;
          font-size: 13.5px;
          font-weight: 600;
          white-space: nowrap;
          transition: opacity 0.15s ease, width 0.18s cubic-bezier(0.16, 1, 0.3, 1), padding 0.18s ease;
        }

        .Btn-logout:hover {
          width: 135px;
          border-radius: 40px;
          background-color: rgb(240, 45, 45);
        }

        .Btn-logout:hover .sign {
          width: 30%;
          padding-left: 14px;
        }

        .Btn-logout:hover .text {
          opacity: 1;
          width: 70%;
          padding-right: 12px;
        }

        .Btn-logout:active {
          transform: scale(0.96);
        }

        /* ── Animated Support Button (Tương tự Logout, màu xanh ngọc Emerald) ── */
        .Btn-support {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          width: 44px;
          height: 44px;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: width 0.18s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.18s ease, border-radius 0.18s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
          background-color: #10b981;
          flex-shrink: 0;
          text-decoration: none;
        }

        .Btn-support .sign {
          width: 100%;
          transition: width 0.18s cubic-bezier(0.16, 1, 0.3, 1), padding 0.18s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .Btn-support .sign svg {
          width: 18px;
          height: 18px;
          stroke: white;
        }

        .Btn-support .text {
          position: absolute;
          right: 0%;
          width: 0%;
          opacity: 0;
          color: white;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          transition: opacity 0.15s ease, width 0.18s cubic-bezier(0.16, 1, 0.3, 1), padding 0.18s ease;
        }

        .Btn-support:hover {
          width: 140px;
          border-radius: 40px;
          background-color: #059669;
        }

        .Btn-support:hover .sign {
          width: 30%;
          padding-left: 12px;
        }

        .Btn-support:hover .text {
          opacity: 1;
          width: 70%;
          padding-right: 12px;
        }

        .Btn-support:active {
          transform: scale(0.96);
        }


        /* Khi mở 3 gạch: Trồi ra mượt mà 60fps chuẩn phong cách cao cấp */
        #user-sidebar-drawer.open .user-sidebar-panel {
          transform: translateX(0);
          opacity: 1;
        }
        #user-sidebar-drawer.open .user-sidebar-panel-top {
          transition: transform 0.48s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
          transition-delay: 0s;
        }
        #user-sidebar-drawer.open .user-sidebar-panel-bottom {
          transition: transform 0.48s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
          transition-delay: 0.08s;
        }

        /* ── Menu Item: Hiệu ứng lan tỏa màu xanh từ trái sang phải từ từ chậm rãi bao phủ cả icon ── */
        .user-sidebar-item {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 0.875rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
          text-decoration: none;
          border: 1px solid transparent;
          margin-bottom: 3px;
          overflow: hidden;
          isolation: isolate;
          transition: color 0.4s ease, border-color 0.4s ease;
        }
        .user-sidebar-item::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #e0f2fe 0%, #f0f9ff 100%);
          transform: scaleX(0);
          transform-origin: left center;
          transition: transform 0.48s cubic-bezier(0.22, 1, 0.36, 1);
          z-index: -1;
          border-radius: inherit;
        }
        .user-sidebar-item:hover::before {
          transform: scaleX(1);
        }
        .user-sidebar-item:hover {
          color: #0284c7;
          border-color: #bae6fd;
        }
        /* Đã xóa hoàn toàn khung hình vuông quanh icon theo yêu cầu */
        .user-sidebar-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          flex-shrink: 0;
          background: transparent;
          border: none;
          transition: color 0.4s ease, transform 0.3s ease;
        }
        .user-sidebar-item:hover .user-sidebar-item-icon {
          color: #0284c7;
          transform: scale(1.1);
        }
        .user-sidebar-panel-top::-webkit-scrollbar { width: 4px; }
        .user-sidebar-panel-top::-webkit-scrollbar-track { background: #f8fafc; border-radius: 999px; }
        .user-sidebar-panel-top::-webkit-scrollbar-thumb { background: #bae6fd; border-radius: 999px; }
      `}</style>
      <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
        
        {/* ================= LOGO & TÊN THƯƠNG HIỆU (Hover hiện chữ dưới logo kiểu About) ================= */}
        <div className="relative group/logo flex-shrink-0 flex items-center justify-center">
          <Link 
            to="/" 
            className="flex items-center justify-center p-1 sm:p-1.5 rounded-2xl hover:bg-sky-50 transition-all duration-300" 
            title="DualeoFood Trang chủ"
          >
            <img 
              src={logoImage} 
              alt="DualeoFood Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain transition-transform duration-300 group-hover/logo:scale-105"
              onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=DF&background=0EA5E9&color=fff&rounded=true&bold=true"; }}
            />
          </Link>

          {/* Chữ DUALEOFOOD nhỏ lại, ẩn đi và chỉ hiện ra từ từ ngay dưới logo khi di chuột (Phong cách trang About) */}
          <div className="absolute top-[100%] left-1/2 -translate-x-1/2 pt-1 pointer-events-none z-50">
            <div className="opacity-0 -translate-y-2 scale-90 group-hover/logo:opacity-100 group-hover/logo:translate-y-0 group-hover/logo:scale-100 transition-all duration-300 ease-out">
              <span className="inline-block px-2.5 py-0.5 bg-white/95 backdrop-blur-md rounded-md shadow-lg border border-sky-100 text-[10px] sm:text-[11px] font-black tracking-widest text-sky-500 whitespace-nowrap">
                DUALEOFOOD
              </span>
            </div>
          </div>
        </div>

        {/* ================= MENU ĐIỀU HƯỚNG VỚI HIỆU ỨNG RUBBER SEGMENT (REACT BITS) ================= */}
        <nav className="hidden lg:flex items-center" aria-label="Menu điều hướng chính">
          <RubberSegment
            items={navItems}
            value={currentNavValue}
            onChange={handleNavChange}
            trackColor="transparent"
            thumbColor="#e0f2fe"
            textColor="#475569"
            activeTextColor="#0284c7"
            size="md"
            radius={12}
            inset={0}
            equalSlots={false}
            stretch={75}
            squash={3}
            speed={1}
            glide={65}
            draggable={true}
            className="font-bold"
            aria-label="Điều hướng các trang DualeoFood"
          />
        </nav>

        {/* ================= KHU VỰC CÔNG CỤ & TÀI KHOẢN ================= */}
        <div className="flex items-center space-x-2 sm:space-x-4 xl:space-x-6">
          
          {/* Nút Giỏ Hàng (Icon trơn không ô vuông bọc ngoài, số lượng hình tròn chuẩn 100%, cách xa nút hồ sơ) */}
          <div className="hidden md:flex relative group/cart items-center justify-center mr-3 sm:mr-4">
            <Link 
              to="/cart" 
              id="cart-icon" 
              className="relative flex items-center justify-center p-2 text-slate-700 hover:text-sky-500 transition-colors duration-200 cursor-pointer" 
              title="Giỏ hàng của bạn"
            >
              <FiShoppingCart className="w-6 h-6 sm:w-6.5 sm:h-6.5 group-hover/cart:scale-110 transition-transform duration-200 text-slate-700 group-hover/cart:text-sky-500" /> 
              
              {/* Vòng tròn đỏ hiển thị số lượng món ăn trong giỏ — HÌNH TRÒN CHUẨN 100% */}
              {cartItems?.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[11px] font-extrabold w-5 h-5 min-w-[20px] min-h-[20px] aspect-square flex items-center justify-center rounded-full border-2 border-white shadow-xs leading-none animate-bounce">
                  {cartItems.length}
                </span>
              )}
            </Link>

            {/* Chữ "Giỏ hàng" bình thường ẩn đi, khi di chuột vào sẽ hiện lên mượt mà ngay dưới icon */}
            <div className="absolute top-[100%] left-1/2 -translate-x-1/2 pt-1 pointer-events-none z-50">
              <div className="opacity-0 -translate-y-2 scale-90 group-hover/cart:opacity-100 group-hover/cart:translate-y-0 group-hover/cart:scale-100 transition-all duration-300 ease-out">
                <span className="inline-block px-2.5 py-0.5 bg-white/95 backdrop-blur-md rounded-md shadow-lg border border-sky-100 text-[10px] sm:text-[11px] font-bold text-sky-600 whitespace-nowrap">
                  Giỏ hàng
                </span>
              </div>
            </div>
          </div>

          {/* ================= ICON CHUÔNG THÔNG BÁO (Phong cách y chang Giỏ Hàng) ================= */}
          {userInfo && userInfo.role !== 'admin' && (
            <div className="relative group/bell flex items-center justify-center mr-1 sm:mr-2" ref={notifRef}>
              {/* Icon Chuông trơn không ô vuông bọc ngoài */}
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)} 
                className="relative flex items-center justify-center p-2 text-slate-700 hover:text-sky-500 transition-colors duration-200 cursor-pointer"
                aria-label="Mở thông báo"
                title="Thông báo"
              >
                <FiBell className="w-6 h-6 sm:w-6.5 sm:h-6.5 group-hover/bell:scale-110 transition-transform duration-200 text-slate-700 group-hover/bell:text-sky-500" />
                
                {/* Vòng tròn đỏ hiển thị số thông báo chưa đọc — HÌNH TRÒN CHUẨN 100% */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[11px] font-extrabold w-5 h-5 min-w-[20px] min-h-[20px] aspect-square flex items-center justify-center rounded-full border-2 border-white shadow-xs leading-none animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Chữ "Thông báo" bình thường ẩn đi, khi di chuột vào sẽ hiện lên mượt mà ngay dưới icon */}
              {!isNotifOpen && (
                <div className="absolute top-[100%] left-1/2 -translate-x-1/2 pt-1 pointer-events-none z-50">
                  <div className="opacity-0 -translate-y-2 scale-90 group-hover/bell:opacity-100 group-hover/bell:translate-y-0 group-hover/bell:scale-100 transition-all duration-300 ease-out">
                    <span className="inline-block px-2.5 py-0.5 bg-white/95 backdrop-blur-md rounded-md shadow-lg border border-sky-100 text-[10px] sm:text-[11px] font-bold text-sky-600 whitespace-nowrap">
                      Thông báo
                    </span>
                  </div>
                </div>
              )}

              {/* Menu Dropdown Thông báo */}
              {isNotifOpen && (
                <div className="absolute top-full mt-3 right-0 w-[calc(100vw-32px)] max-w-sm sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100/90 z-50 animate-fade-in-down">
                  {/* Mũi tên nhỏ trỏ vào icon chuông */}
                  <div className="absolute -top-1.5 right-3.5 w-3 h-3 bg-white border-t border-l border-gray-100 transform rotate-45" />

                  {/* Header Thông báo */}
                  <div className="flex justify-between items-center px-4 py-3.5 border-b border-gray-100 relative z-10 bg-white rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-gray-900 text-base">Thông báo</h4>
                      {unreadCount > 0 && (
                        <span className="bg-sky-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full leading-none">
                          {unreadCount} mới
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllAsRead} 
                        className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer transition-colors"
                      >
                        Đánh dấu tất cả đã đọc
                      </button>
                    )}
                  </div>
                  
                  {/* Danh sách thông báo */}
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50 custom-notif-scrollbar relative z-10">
                    {notifications.length === 0 ? (
                      <div className="py-12 px-6 text-center text-gray-400">
                        <FiBell className="w-10 h-10 mx-auto mb-2 text-gray-300 stroke-1" />
                        <p className="text-sm font-medium">Bạn chưa có thông báo nào.</p>
                      </div>
                    ) : (
                      notifications.map(notif => {
                        const notifIcon = notif.type === 'ARTICLE_APPROVED' ? '🎉'
                          : notif.type === 'ARTICLE_LIKE' ? '❤️'
                          : notif.type === 'ARTICLE_COMMENT' ? '💬'
                          : notif.type && notif.type.startsWith('ARTICLE_') ? '📝'
                          : notif.type === 'ORDER_UPDATE' ? '📦'
                          : notif.type === 'PROMOTION' ? '🎁'
                          : '🔔';

                        return (
                          <div 
                            key={notif._id} 
                            onClick={() => handleNotifClick(notif)}
                            className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${notif.isRead ? 'hover:bg-slate-50' : 'bg-sky-50/60 hover:bg-sky-100/60'}`}
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base shadow-2xs ${notif.isRead ? 'bg-gray-100 text-gray-600' : 'bg-sky-100 text-sky-600'}`}>
                              {notifIcon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-1">
                                <strong className="font-bold text-sm text-gray-800 leading-snug line-clamp-1">{notif.title}</strong>
                                {!notif.isRead && (
                                  <span className="w-2 h-2 bg-sky-500 rounded-full shrink-0 mt-1 shadow-xs" title="Chưa đọc" />
                                )}
                              </div>
                              <p className="text-xs text-gray-600 my-1 leading-relaxed line-clamp-2">{notif.content}</p>
                              <span className="text-[11px] text-gray-400 font-medium">
                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer Xem tất cả */}
                  <div className="p-3 bg-slate-50/90 rounded-b-2xl text-center border-t border-gray-100 relative z-10">
                    <Link 
                      to="/notifications" 
                      onClick={() => setIsNotifOpen(false)} 
                      className="text-xs sm:text-sm font-bold text-sky-600 hover:text-sky-700 hover:underline inline-flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Xem tất cả thông báo</span>
                      <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= KHU VỰC TÀI KHOẢN (Auth — Không ô vuông bọc ngoài) ================= */}
          <div className="border-l border-slate-200 sm:border-l sm:border-slate-200 pl-3 sm:pl-4 xl:pl-6 flex items-center">
            {userInfo ? (
              // Trạng thái 1: ĐÃ ĐĂNG NHẬP — nút trigger mở sidebar drawer (BỎ Ô VUÔNG BỌC NGOÀI)
              <div className="relative">
                <button 
                  type="button"
                  id="user-account-btn"
                  onClick={() => {
                    if (isUserMenuOpen) {
                      closeUserSidebar();
                    } else {
                      openUserSidebar();
                    }
                  }}
                  className="group flex items-center gap-2 p-1 transition-all duration-200 cursor-pointer bg-transparent border-none shadow-none text-slate-800 hover:text-sky-600"
                  aria-expanded={isUserMenuOpen}
                  aria-label="Mở thanh Sidebar tài khoản"
                >
                  {userInfo?.avatar ? (
                    <img 
                      src={`${getImageUrl(userInfo.avatar)}`} 
                      alt={userInfo.name} 
                      className="w-8 h-8 rounded-full object-cover shrink-0 shadow-xs group-hover:ring-2 group-hover:ring-sky-400 transition-all duration-200" 
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs group-hover:ring-2 group-hover:ring-sky-400 transition-all duration-200">
                      {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-sky-600 transition-colors hidden xl:inline whitespace-nowrap">
                    {userInfo?.name}
                  </span>
                  <span className="p-1 text-slate-400 group-hover:text-sky-500 transition-colors inline-flex items-center justify-center shrink-0">
                    <svg 
                      className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-90 text-sky-600' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </span>
                </button>
              </div>
            ) : (
              // Trạng thái 2: CHƯA ĐĂNG NHẬP
              <button
                type="button"
                onClick={() => dispatch(openAuthModal())}
                className="bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold py-1.5 px-3 sm:py-2.5 sm:px-5 rounded-xl shadow-sm transition duration-200 hover:scale-105 flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                </svg>
                <span>Đăng nhập</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          USER SIDEBAR DRAWER
          Pattern: GSAP Timeline .clear() & rebuild (demo-ui)
          • Enter: fromTo() — bắt đầu từ trạng thái đã biết (panels từ phải vào)
          • Exit:  to()     — pick up từ trạng thái hiện tại, panels rơi ngẫu nhiên
          • Bo tròn mượt mà: border-radius 16px (như demo-ui nav-border 10px)
          Cấu trúc 3 panels: Top (trắng) / Middle (xanh gradient) / Bottom (tối)
      ════════════════════════════════════════════════════════════════════════ */}
      {userInfo && (
        <div 
          id="user-sidebar-drawer" 
          className={isUserMenuOpen ? 'open' : ''}
          aria-hidden={!isUserMenuOpen}
        >
          {/* Backdrop */}
          <div
            className="user-sidebar-bg"
            onClick={closeUserSidebar}
            aria-hidden="true"
          />

          {/* ── PANEL 1: THÔNG TIN HỒ SƠ & DANH SÁCH ĐIỀU HƯỚNG (Top — Trắng) ── */}
          <div
            className="user-sidebar-panel user-sidebar-panel-top"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Avatar + Tên + Nút đóng */}
            <div className="flex items-start justify-between gap-3 pb-4 mb-3 border-b-2 border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                {userInfo?.avatar ? (
                  <img
                    src={`${getImageUrl(userInfo.avatar)}`}
                    alt={userInfo.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm">
                    {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-slate-800 text-sm sm:text-base truncate">
                      {userInfo?.name}
                    </h3>
                    {userInfo?.role === 'admin' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-200 shrink-0">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    {userInfo?.email || userInfo?.phone || 'Thành viên DualeoFood'}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-sky-700 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Hội viên DualeoFood
                  </span>
                </div>
              </div>

              {/* Nút đóng sidebar (chữ X đóng bình thường) */}
              <button
                type="button"
                id="sidebar-close-btn"
                onClick={closeUserSidebar}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors flex items-center justify-center cursor-pointer shrink-0 shadow-xs relative z-20"
                aria-label="Đóng sidebar"
              >
                <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Danh sách điều hướng */}
            <div className="flex flex-col flex-1">
              {[
                ...(userInfo?.role === 'admin' ? [{
                  to: '/admin',
                  label: 'Bảng Quản Trị Hệ Thống',
                  badge: 'Admin',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  )
                }] : []),
                {
                  to: '/profile',
                  label: 'Hồ Sơ Cá Nhân',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )
                },
                {
                  to: '/notifications',
                  label: 'Thông Báo Của Tôi',
                  badge: unreadCount > 0 ? `${unreadCount} mới` : null,
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  )
                },
                {
                  to: '/wallet',
                  label: 'Kho Voucher Của Tôi',
                  badge: voucherCount > 0 ? `${voucherCount} mã` : null,
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  )
                },
                {
                  to: '/my-addresses',
                  label: 'Sổ Địa Chỉ Nhận Hàng',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )
                },
                {
                  to: '/my-orders',
                  label: 'Lịch Sử Đơn Hàng',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  )
                },
                {
                  to: '/my-reviews',
                  label: 'Đánh Giá & Cảm Nhận',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  )
                }
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => closeUserSidebar()}
                  className="user-sidebar-item"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="user-sidebar-item-icon">
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 border border-sky-200">
                        {item.badge}
                      </span>
                    )}
                    <svg
                      className="w-4 h-4 text-slate-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── PANEL 2: ĐĂNG XUẤT TÀI KHOẢN & HỖ TRỢ 24/7 (Bottom — Nền xanh thương hiệu) ── */}
          <div
            className="user-sidebar-panel user-sidebar-panel-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút Đăng xuất bên trái */}
            <button
              type="button"
              onClick={() => {
                closeUserSidebar();
                handleLogout();
              }}
              className="Btn-logout"
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <div className="sign">
                <svg viewBox="0 0 512 512">
                  <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
                </svg>
              </div>
              <div className="text">Đăng xuất</div>
            </button>

            {/* Dấu gạch đứng phân cách ở giữa */}
            <div className="w-[1.5px] h-5 bg-white/30 rounded-full mx-2 shrink-0" aria-hidden="true" />

            {/* Nút Hỗ trợ 24/7 bên phải (Hiệu ứng bung chữ đồng bộ) */}
            <Link
              to="/contact"
              onClick={closeUserSidebar}
              className="Btn-support"
              title="Tổng đài chăm sóc & hỗ trợ khách hàng 24/7"
              aria-label="Hỗ trợ 24/7"
            >
              <div className="sign">
                <FiHeadphones className="w-[18px] h-[18px] text-white" />
              </div>
              <div className="text">Hỗ trợ 24/7</div>
            </Link>
          </div>
        </div>
      )}

      {/* ================= BOTTOM NAVIGATION BAR (Mobile Only) ================= */}
      {/* Đặt ngoài thẻ <header> để không bị backdrop-blur / transform hạn chế, cố định 100% ở đáy màn hình điện thoại */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-lg border-t border-slate-200/90 flex justify-around items-center h-16 z-[999] shadow-[0_-4px_25px_rgba(0,0,0,0.08)] pb-safe">
        <Link to="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${location.pathname === '/' ? 'text-sky-500 font-bold' : 'text-slate-500 hover:text-sky-500 font-medium'}`}>
          <FiHome size={21} />
          <span className="text-[10px]">Trang chủ</span>
        </Link>
        <Link to="/menu" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${location.pathname === '/menu' ? 'text-sky-500 font-bold' : 'text-slate-500 hover:text-sky-500 font-medium'}`}>
          <FiList size={21} />
          <span className="text-[10px]">Thực đơn</span>
        </Link>
        <Link to="/cart" className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${location.pathname === '/cart' ? 'text-sky-500 font-bold' : 'text-slate-500 hover:text-sky-500 font-medium'}`}>
          <div className="relative">
            <FiShoppingBag size={21} />
            {cartItems?.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                {cartItems.length}
              </span>
            )}
          </div>
          <span className="text-[10px]">Giỏ hàng</span>
        </Link>
        <button 
          onClick={() => {
            if (userInfo) {
              navigate('/profile');
            } else {
              dispatch(openAuthModal());
            }
          }} 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${location.pathname === '/profile' ? 'text-sky-500 font-bold' : 'text-slate-500 hover:text-sky-500 font-medium'}`}
        >
          <FiUser size={21} />
          <span className="text-[10px]">Tài khoản</span>
        </button>
      </nav>
    </>
  );
};

export default Header;