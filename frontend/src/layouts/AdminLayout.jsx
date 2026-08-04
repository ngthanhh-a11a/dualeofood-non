import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiHome, FiBox, FiTag, FiShoppingCart, FiLogOut, FiMessageSquare, FiUsers, FiBell, FiMail, FiImage, FiFileText } from 'react-icons/fi';
import axios, { SERVER_URL , getImageUrl } from '../utils/axiosConfig';
import { useSocket } from '../contexts/SocketContext';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const socket = useSocket(); // State mới cho đơn hàng chờ

  // Hàm lấy số lượng tin nhắn chưa đọc (Tách ra để truyền xuống Outlet)
  const fetchUnreadMessages = async () => {
    try {
      const response = await axios.get('/messages');
      // Lọc ra các tin nhắn có isRead là false và đếm số lượng
      const unread = response.data.filter(msg => !msg.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Lỗi khi tải số lượng tin nhắn:', error);
    }
  };

  // Hàm lấy số lượng đơn hàng chờ duyệt ban đầu
  const fetchPendingOrders = async () => {
    try {
      // Gọi API chuyên dụng để đếm, hiệu quả hơn nhiều so với việc tải toàn bộ danh sách
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

  // Lắng nghe sự kiện WebSocket để cập nhật số lượng real-time
  useEffect(() => {
    if (!socket) return;

    // Lắng nghe sự kiện cập nhật số lượng đơn hàng chờ
    socket.on('update_pending_orders_count', (count) => {
      setPendingOrdersCount(count);
    });

    // Dọn dẹp khi component unmount
    return () => {
      socket.off('update_pending_orders_count');
    };
  }, [socket]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: <FiHome /> },
    { name: 'Banners', path: '/admin/banners', icon: <FiImage /> },
    { name: 'Bài viết & Tin tức', path: '/admin/articles', icon: <FiFileText /> },
    { name: 'Quản lý Món ăn', path: '/admin/products', icon: <FiBox /> },
    { name: 'Danh mục', path: '/admin/categories', icon: <FiTag /> },
    { name: 'Mã Giảm Giá', path: '/admin/coupons', icon: <FiTag /> },
    { name: 'Đơn Hàng', path: '/admin/orders', icon: <FiShoppingCart />, badge: pendingOrdersCount },
    { name: 'Khách Hàng', path: '/admin/users', icon: <FiUsers /> },
    { name: 'Gửi Thông Báo', path: '/admin/broadcast', icon: <FiBell /> },
    { name: 'Live Chat', path: '/admin/live-chat', icon: <FiMessageSquare /> },
    { name: 'Hộp Thư', path: '/admin/messages', icon: <FiMail />, badge: unreadCount },
];
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* SIDEBAR TỐI MÀU */}
      <div className={`bg-slate-900 text-white transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          {isSidebarOpen && <span className="font-black text-xl tracking-wider text-sky-400">ADMIN PRO</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-2xl hover:text-sky-400 focus:outline-none">
            <FiMenu />
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-3">
          {menuItems.map((item) => (
            <Link key={item.name} to={item.path} 
              className={`relative flex items-center justify-between px-3 py-3 rounded-lg transition-colors ${
                location.pathname === item.path ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <span className="text-xl">{item.icon}</span>
                {isSidebarOpen && <span className="ml-4 font-semibold">{item.name}</span>}
              </div>
              
              {/* Hiển thị số lượng (Badge) màu đỏ nổi bật nếu có tin nhắn mới */}
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
        {/* Topbar nhỏ của Admin */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-end px-8 z-10">
          <div className="flex items-center space-x-4">
            <img src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff" alt="Admin" className="w-10 h-10 rounded-full" />
            <span className="font-bold text-slate-700">Quản trị viên</span>
          </div>
        </header>

        {/* Nội dung thay đổi theo route */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {/* Truyền hàm đếm xuống để AdminMessages gọi mỗi khi đọc/xóa tin nhắn */}
          <Outlet context={{ fetchUnreadMessages }} /> 
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;