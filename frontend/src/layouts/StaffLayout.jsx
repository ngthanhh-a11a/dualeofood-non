import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiShoppingCart, FiMessageSquare, FiLogOut, FiMail, FiImage, FiFileText } from 'react-icons/fi';
import axios, { SERVER_URL , getImageUrl } from '../utils/axiosConfig';
import { useSocket } from '../contexts/SocketContext';

/**
 * Layout dành riêng cho Staff (Nhân viên).
 * Gọn hơn AdminLayout, chỉ hiển thị các menu Staff được phép truy cập:
 * - Quản lý Đơn Hàng
 * - Tin Nhắn Khách Hàng
 */
const StaffLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const socket = useSocket();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  // Lấy số lượng tin nhắn chưa đọc
  const fetchUnreadMessages = async () => {
    try {
      const response = await axios.get('/messages');
      const unread = response.data.filter(msg => !msg.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Lỗi khi tải số lượng tin nhắn:', error);
    }
  };

  // Lấy số lượng đơn hàng chờ duyệt
  const fetchPendingOrders = async () => {
    try {
      const response = await axios.get('/orders/count/pending');
      setPendingOrdersCount(response.data.count);
    } catch (error) {
      console.error('Lỗi khi tải số lượng đơn hàng chờ:', error);
    }
  };

  useEffect(() => {
    fetchUnreadMessages();
    fetchPendingOrders();
  }, [location.pathname]);

  // Lắng nghe Socket.IO để cập nhật real-time
  useEffect(() => {
    if (!socket) return;

    socket.on('update_pending_orders_count', (count) => {
      setPendingOrdersCount(count);
    });

    return () => {
      socket.off('update_pending_orders_count');
    };
  }, [socket]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('chat_guest_id');
    window.dispatchEvent(new Event('authChange'));
    navigate('/login');
  };

  // Menu của Staff
  const menuItems = [
    { name: 'Đơn Hàng', path: '/staff', icon: <FiShoppingCart />, badge: pendingOrdersCount },
    { name: 'Banners', path: '/staff/banners', icon: <FiImage /> },
    { name: 'Bài viết & Tin tức', path: '/staff/articles', icon: <FiFileText /> },
    { name: 'Live Chat', path: '/staff/live-chat', icon: <FiMessageSquare /> },
    { name: 'Hộp Thư', path: '/staff/messages', icon: <FiMail />, badge: unreadCount },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* SIDEBAR TỐI MÀU - Giống AdminLayout nhưng gọn hơn */}
      <div className={`bg-slate-900 text-white transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          {isSidebarOpen && <span className="font-black text-xl tracking-wider text-emerald-400">STAFF</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-2xl hover:text-emerald-400 focus:outline-none">
            <FiMenu />
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-3">
          {menuItems.map((item) => (
            <Link key={item.name} to={item.path}
              className={`relative flex items-center justify-between px-3 py-3 rounded-lg transition-colors ${
                location.pathname === item.path ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <span className="text-xl">{item.icon}</span>
                {isSidebarOpen && <span className="ml-4 font-semibold">{item.name}</span>}
              </div>

              {/* Badge hiển thị số lượng */}
              {item.badge > 0 && isSidebarOpen && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {item.badge}
                </span>
              )}
              {item.badge > 0 && !isSidebarOpen && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-slate-900">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button onClick={handleLogout} className="flex items-center text-red-400 hover:text-red-300 w-full px-3 py-2 rounded-lg hover:bg-slate-800 transition">
            <FiLogOut className="text-xl" />
            {isSidebarOpen && <span className="ml-4 font-semibold">Đăng xuất</span>}
          </button>
        </div>
      </div>

      {/* KHU VỰC NỘI DUNG CHÍNH */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-end px-8 z-10">
          <div className="flex items-center space-x-4">
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Nhân viên</span>
            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.name || 'Staff')}&background=059669&color=fff`} alt="Staff" className="w-10 h-10 rounded-full" />
            <span className="font-bold text-slate-700">{userInfo.name || 'Nhân viên'}</span>
          </div>
        </header>

        {/* Nội dung thay đổi theo route */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Outlet context={{ fetchUnreadMessages }} />
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;
