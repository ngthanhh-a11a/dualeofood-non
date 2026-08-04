import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../../redux/cartSlice'; // Import action clearCart
import { openAuthModal } from '../../redux/uiSlice'; // Import action mở popup login
import axios, { SERVER_URL , getImageUrl } from '../../utils/axiosConfig'; // Import axios và SERVER_URL
import logoImage from '../../assets/logo.png';
import { FaBell } from 'react-icons/fa'; // Icon chuông
import { FiHome, FiList, FiShoppingBag, FiUser } from 'react-icons/fi'; // Icon Bottom Nav
import { useSocket } from '../../contexts/SocketContext'; // Lắng nghe real-time
import { formatDistanceToNow } from 'date-fns'; // Hiển thị "5 phút trước"
import { vi } from 'date-fns/locale'; // Ngôn ngữ Tiếng Việt

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false); // State cho dropdown của user
  const navigate = useNavigate();
  const location = useLocation(); // Lấy vị trí hiện tại

  // --- START: STATE VÀ LOGIC CHO HỆ THỐNG THÔNG BÁO ---
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const socket = useSocket();
  const notifRef = useRef(null); // Để xử lý click bên ngoài dropdown
  // --- END: STATE VÀ LOGIC CHO HỆ THỐNG THÔNG BÁO ---
  
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

  // 4. Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    // 3. Nếu là thông báo đơn hàng, điều hướng tới trang MyOrders với state
    if (notif.type === 'ORDER_UPDATE' && notif.orderId) {
      navigate('/my-orders', { state: { scrollToOrderId: notif.orderId } });
    }
  };

  // 7. Hàm xử lý khi click "Đánh dấu tất cả đã đọc"
  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) { console.error('Lỗi khi đánh dấu tất cả đã đọc', error); }
  };

  // 3. Hàm xử lý Đăng xuất
  const handleLogout = () => {
    // 1. Xóa thông tin đăng nhập khỏi localStorage TRƯỚC.
    // Điều này đảm bảo giỏ hàng trống (sau khi clear) sẽ được lưu vào 'cart_anonymous'
    // thay vì ghi đè lên giỏ hàng đã lưu của người dùng.
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');

    // 2. Xóa giỏ hàng khỏi Redux. Middleware sẽ tự động lưu giỏ hàng trống này.
    dispatch(clearCart());

    // Đẩy về trang chủ thay vì /login
    navigate('/');
  };

  const navLinks = [
    { path: '/', text: 'Trang chủ' },
    { path: '/about', text: 'Giới thiệu' },
    { path: '/menu', text: 'Thực đơn' },
    { path: '/blog', text: 'Bài viết' },
    { path: '/promotions', text: 'Khuyến Mãi' },
    { path: '/contact', text: 'Liên hệ' },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 font-sans">
      {/* Thêm định nghĩa keyframes cho hiệu ứng shake, có thể chuyển vào file CSS chung */}
      <style>{`
        .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; } 
        @keyframes fade-in-down { 
            from { opacity: 0; transform: translateY(-10px); } 
            to { opacity: 1; transform: translateY(0); } 
        }
        .shake { animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        
        {/* ================= LOGO & TÊN THƯƠNG HIỆU ================= */}
        <Link to="/" className="flex items-center gap-1 sm:gap-2 hover:scale-105 transition transform flex-shrink-0">
          <img 
            src={logoImage} 
            alt="DualeoFood Logo" 
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
            onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=DF&background=0EA5E9&color=fff&rounded=true&bold=true"; }}
          />
          <span className="text-lg sm:text-2xl lg:text-3xl font-black text-sky-500 tracking-wider whitespace-nowrap">
            DUALEOFOOD
          </span>
        </Link>

        {/* ================= MENU ĐIỀU HƯỚNG (Chỉ hiện trên màn hình lớn) ================= */}
        <nav className="hidden lg:flex items-center space-x-8 font-bold text-gray-600">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative transition-colors duration-300 pb-1 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 after:bg-sky-500 after:transition-transform after:duration-300 after:ease-out ${
                location.pathname === link.path ? 'text-sky-500 after:scale-x-100' : 'text-gray-600 after:scale-x-0 hover:text-sky-500 hover:after:scale-x-100'
              }`}
            >
              {link.text}
            </Link>
          ))}
        </nav>

        {/* ================= KHU VỰC CÔNG CỤ & TÀI KHOẢN ================= */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          
          {/* Nút Giỏ Hàng (Ẩn trên Mobile vì đã có Bottom Nav) */}
          <Link to="/cart" id="cart-icon" className="hidden md:flex relative items-center text-slate-700 hover:text-sky-500 transition-transform duration-300 group bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
            <span className="text-2xl mr-1 group-hover:scale-110 transition transform">🛒</span> 
            <span className="font-bold">Giỏ hàng</span>
            
            {/* Vòng tròn đỏ hiển thị số lượng món ăn trong giỏ */}
            {cartItems?.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce">
                {cartItems.length}
              </span>
            )}
          </Link>

          {/* ================= ICON CHUÔNG THÔNG BÁO ================= */}
          {userInfo && userInfo.role !== 'admin' && (
            <div className="relative" ref={notifRef}>
              {/* Icon Chuông & Chấm đỏ */}
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)} 
                className="relative text-slate-700 hover:text-sky-500 transition"
                aria-label="Mở thông báo"
              >
                <FaBell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Menu Dropdown Thông báo */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-4 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 animate-fade-in-down">
                  <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h4 className="font-bold text-gray-800 text-lg">Thông báo</h4>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllAsRead} className="text-sm font-semibold text-sky-500 hover:underline">
                        Đánh dấu tất cả đã đọc
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-10 text-center text-gray-500">Bạn chưa có thông báo nào.</p>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif._id} 
                          onClick={() => handleNotifClick(notif)}
                          className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${notif.isRead ? 'hover:bg-gray-50' : 'bg-sky-50 hover:bg-sky-100'}`}
                        >
                          <div className="flex justify-between items-start">
                            <strong className="font-bold text-sm text-gray-800 mb-1 pr-2">{notif.title}</strong>
                            {!notif.isRead && <div className="w-2.5 h-2.5 bg-sky-500 rounded-full flex-shrink-0 mt-1" title="Chưa đọc"></div>}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notif.content}</p>
                          <p className="text-xs text-gray-400 font-semibold">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 bg-gray-50 rounded-b-xl text-center">
                      <Link to="/my-orders" onClick={() => setIsNotifOpen(false)} className="text-sm font-bold text-sky-600 hover:underline">Xem tất cả đơn hàng</Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= KHU VỰC TÀI KHOẢN (Auth) ================= */}
          <div className="border-l-2 pl-3 sm:pl-6 border-sky-50 flex items-center">
            {userInfo ? (
              // Trạng thái 1: ĐÃ ĐĂNG NHẬP
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  onBlur={() => setTimeout(() => setIsUserMenuOpen(false), 200)} // Thêm onBlur để tự đóng khi click ra ngoài
                  className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 transition"
                >
                  {userInfo?.avatar ? (
                    <img src={`${getImageUrl(userInfo.avatar)}`} alt={userInfo.name} className="w-8 h-8 rounded-full object-cover border border-sky-200" />
                  ) : (
                    <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 font-bold border border-sky-200">
                      {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="font-semibold text-gray-600 hidden md:inline">
                    <span className="text-sky-600 font-bold">{userInfo?.name}</span>
                  </span>
                   <svg className={`w-4 h-4 text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>

                {/* Dropdown Menu cho User */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-50 z-50 animate-fade-in-down py-2">
                    {userInfo?.role === 'admin' && (
                      <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-orange-500 hover:bg-orange-50">
                        ⚙️ Quản trị
                      </Link>
                    )}
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">👤 Hồ sơ cá nhân</Link>
                    <Link to="/my-addresses" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">📍 Địa chỉ của tôi</Link>
                    <Link to="/my-orders" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">📦 Đơn hàng của tôi</Link>
                    <Link to="/wallet" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">🎟️ Kho Voucher</Link>
                    <Link to="/my-reviews" className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">📝 Đánh giá của tôi</Link>
                    <div className="border-t my-2"></div>
                    <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50">
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Trạng thái 2: CHƯA ĐĂNG NHẬP
              <button
                onClick={() => dispatch(openAuthModal())}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm transition duration-300 hover:scale-105 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                </svg>
                Đăng nhập
              </button>
            )}
          </div>

          {/* Nút Hamburger (Chỉ hiện trên màn hình nhỏ) */}
          <button 
            className="lg:hidden text-slate-700 hover:text-sky-500"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Mở menu"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
          </button>

        </div>
      </div>

      {/* ================= MOBILE MENU (Sidebar) ================= */}
      {/* Lớp phủ nền */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 lg:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* Bảng menu */}
      <div className={`fixed top-0 right-0 h-full w-4/5 max-w-sm bg-white z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h2 className="font-black text-xl text-sky-500">MENU</h2>
          <button onClick={() => setIsMobileMenuOpen(false)} aria-label="Đóng menu">
            <svg className="w-7 h-7 text-slate-500 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        {/* Khu vực tài khoản trên mobile */}
        <div className="p-5 border-b border-slate-100">
          {userInfo ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                {userInfo?.avatar ? (
                  <img src={`${getImageUrl(userInfo.avatar)}`} alt={userInfo.name} className="w-12 h-12 rounded-full object-cover border-2 border-sky-200" />
                ) : (
                  <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 font-bold border-2 border-sky-200 text-xl">
                    {userInfo.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-800">{userInfo.name}</p>
                  <p className="text-sm text-gray-500">Chào mừng trở lại!</p>
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                {userInfo.role === 'admin' && <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-gray-700 p-3 rounded-xl hover:bg-orange-50 hover:text-orange-500 transition">⚙️ Quản trị</Link>}
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-gray-700 p-3 rounded-xl hover:bg-sky-50 hover:text-sky-500 transition">👤 Hồ sơ cá nhân</Link>
                <Link to="/my-addresses" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-gray-700 p-3 rounded-xl hover:bg-sky-50 hover:text-sky-500 transition">📍 Địa chỉ của tôi</Link>
                <Link to="/my-orders" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-gray-700 p-3 rounded-xl hover:bg-sky-50 hover:text-sky-500 transition">📦 Đơn hàng của tôi</Link>
                <Link to="/wallet" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-gray-700 p-3 rounded-xl hover:bg-sky-50 hover:text-sky-500 transition">🎟️ Kho Voucher</Link>
                <Link to="/my-reviews" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-gray-700 p-3 rounded-xl hover:bg-sky-50 hover:text-sky-500 transition">📝 Đánh giá của tôi</Link>
                <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="w-full text-left font-semibold text-red-500 p-3 rounded-xl hover:bg-red-50 transition">Đăng xuất</button>
              </div>
            </div>
          ) : (
            <button onClick={() => { setIsMobileMenuOpen(false); dispatch(openAuthModal()); }} className="w-full block bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-6 rounded-xl shadow-sm transition duration-300 text-center">
              Đăng nhập / Đăng ký
            </button>
          )}
        </div>

        {/* Khu vực điều hướng chính trên mobile */}
        <nav className="flex flex-col p-5 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`font-bold text-lg p-4 rounded-xl transition-colors duration-200 ${
                location.pathname === link.path ? 'bg-sky-100 text-sky-600' : 'text-gray-700 hover:bg-sky-50 hover:text-sky-500'
              }`}
            >
              {link.text}
            </Link>
          ))}
        </nav>
      </div>
      
      {/* ================= BOTTOM NAVIGATION BAR (Mobile Only) ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50">
        <Link to="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location.pathname === '/' ? 'text-sky-500' : 'text-gray-500 hover:text-sky-500'}`}>
          <FiHome size={22} />
          <span className="text-[10px] font-bold">Trang chủ</span>
        </Link>
        <Link to="/menu" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location.pathname === '/menu' ? 'text-sky-500' : 'text-gray-500 hover:text-sky-500'}`}>
          <FiList size={22} />
          <span className="text-[10px] font-bold">Thực đơn</span>
        </Link>
        <Link to="/cart" className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 ${location.pathname === '/cart' ? 'text-sky-500' : 'text-gray-500 hover:text-sky-500'}`}>
          <div className="relative">
            <FiShoppingBag size={22} />
            {cartItems?.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                {cartItems.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">Giỏ hàng</span>
        </Link>
        <button 
          onClick={() => {
            if (userInfo) {
              navigate('/profile');
            } else {
              dispatch(openAuthModal());
            }
          }} 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location.pathname === '/profile' ? 'text-sky-500' : 'text-gray-500 hover:text-sky-500'}`}
        >
          <FiUser size={22} />
          <span className="text-[10px] font-bold">Tài khoản</span>
        </button>
      </nav>

    </header>
  );
};

export default Header;