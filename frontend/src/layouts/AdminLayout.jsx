import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiHome, FiBox, FiTag, FiShoppingCart, FiLogOut, FiMessageSquare, FiUsers, FiBell, FiMail, FiImage, FiFileText, FiSettings, FiChevronLeft, FiSearch, FiGlobe, FiGrid, FiGift, FiMessageCircle } from 'react-icons/fi';
import axios, { SERVER_URL, getImageUrl } from '../utils/axiosConfig';
import { useSocket } from '../contexts/SocketContext';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const socket = useSocket();

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  const fetchUnreadMessages = async () => {
    try {
      const response = await axios.get('/messages');
      const unread = response.data.filter(msg => !msg.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Lỗi khi tải số lượng tin nhắn:', error);
    }
  };

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
    navigate('/login');
  };

  // Grouped Menu Items cho Sidebar gọn gàng hơn
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
        { name: 'Đơn Hàng', path: '/admin/orders', icon: <FiShoppingCart />, badge: pendingOrdersCount, badgeColor: 'bg-sky-500' },
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
        { name: 'Bài viết', path: '/admin/articles', icon: <FiFileText /> },
        { name: 'Bình luận', path: '/admin/reviews', icon: <FiMessageCircle /> },
      ]
    },
    {
      title: 'TƯƠNG TÁC',
      items: [
        { name: 'Hộp Thư', path: '/admin/messages', icon: <FiMail />, badge: unreadCount, badgeColor: 'bg-pink-500' },
        { name: 'Live Chat', path: '/admin/live-chat', icon: <FiMessageSquare /> },
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
      
      {/* SIDEBAR */}
      <aside 
        className={`bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-r border-slate-100 transition-all duration-300 ease-in-out flex flex-col z-20 ${
          isSidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        {/* LOGO AREA */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/30">
                <span className="text-white font-black text-lg">D</span>
              </div>
              <span className="font-black text-xl tracking-tight text-slate-800 whitespace-nowrap">Dualeo<span className="text-sky-500">Admin</span></span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center mx-auto flex-shrink-0 shadow-lg shadow-sky-500/30">
              <span className="text-white font-black text-lg">D</span>
            </div>
          )}
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 custom-scrollbar">
          <div className="px-4 space-y-6">
            {menuGroups.map((group, idx) => (
              <div key={idx}>
                {/* Group Title */}
                {isSidebarOpen && (
                  <h3 className="px-3 text-[11px] font-black tracking-wider text-slate-400 mb-2 uppercase">
                    {group.title}
                  </h3>
                )}
                
                {/* Group Items */}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                    return (
                      <Link 
                        key={item.name} 
                        to={item.path} 
                        className={`relative flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                          isActive 
                            ? 'bg-sky-50 text-sky-600 font-bold' 
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-semibold'
                        } ${!isSidebarOpen && 'justify-center'}`}
                        title={!isSidebarOpen ? item.name : ''}
                      >
                        {/* Active Indicator Line */}
                        {isActive && isSidebarOpen && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sky-500 rounded-r-full"></div>
                        )}

                        <span className={`text-[20px] transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                          {item.icon}
                        </span>
                        
                        {isSidebarOpen && (
                          <span className="ml-3 truncate">{item.name}</span>
                        )}
                        
                        {/* Badges */}
                        {item.badge > 0 && isSidebarOpen && (
                          <span className={`ml-auto ${item.badgeColor || 'bg-red-500'} text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm`}>
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                        {item.badge > 0 && !isSidebarOpen && (
                          <span className={`absolute top-2 right-2 ${item.badgeColor || 'bg-red-500'} text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm`}>
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
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
            className={`flex items-center text-slate-500 hover:text-red-500 w-full px-3 py-3 rounded-xl hover:bg-red-50 transition-colors font-bold ${!isSidebarOpen && 'justify-center'}`}
            title={!isSidebarOpen ? 'Đăng xuất' : ''}
          >
            <FiLogOut className="text-[20px]" />
            {isSidebarOpen && <span className="ml-3">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* TOPBAR */}
        <header className="h-20 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-100 flex items-center justify-between px-6 lg:px-10 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
            >
              <FiMenu className="text-xl" />
            </button>

            {/* Quick Actions / Breadcrumbs could go here */}
            <div className="hidden md:flex items-center text-sm font-semibold text-slate-400 bg-slate-100 px-4 py-2 rounded-xl">
              <FiSearch className="mr-2" /> 
              <span className="opacity-70">Giao diện quản trị viên</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a href="/" target="_blank" className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-sky-500 bg-slate-50 hover:bg-sky-50 px-4 py-2 rounded-xl transition-colors">
              <FiGlobe /> Xem trang chủ
            </a>
            
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            
            <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 pr-3 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
              <img 
                src={`https://ui-avatars.com/api/?name=${userInfo?.name || 'Admin'}&background=FF6B6B&color=fff&rounded=true&bold=true`} 
                alt="Admin" 
                className="w-10 h-10 rounded-xl shadow-sm" 
              />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-black text-slate-800 leading-tight">{userInfo?.name || 'Administrator'}</p>
                <p className="text-[11px] font-bold text-sky-500 uppercase">Quản trị viên</p>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {/* Truyền hàm đếm xuống để các page con gọi nếu cần */}
            <Outlet context={{ fetchUnreadMessages }} /> 
          </div>
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;