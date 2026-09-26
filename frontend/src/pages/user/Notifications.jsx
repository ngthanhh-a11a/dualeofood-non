import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  FiBell, 
  FiCheckCircle, 
  FiTrash2, 
  FiSearch, 
  FiPackage, 
  FiTag, 
  FiMessageSquare, 
  FiHeart, 
  FiAward, 
  FiInfo, 
  FiArrowRight, 
  FiCheck,
  FiFilter
} from 'react-icons/fi';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'order', 'social', 'promotion', 'system'
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const navigate = useNavigate();
  const socket = useSocket();

  // 1. Tải toàn bộ thông báo từ Backend (limit = 100)
  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/notifications?limit=100');
      if (Array.isArray(res.data)) {
        setNotifications(res.data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông báo:', error);
      toast.error(error.response?.data?.message || 'Không thể tải danh sách thông báo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 2. Lắng nghe real-time khi có thông báo mới qua socket
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    };

    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

  // 3. Đánh dấu 1 thông báo là đã đọc
  const handleMarkAsRead = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.put(`/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Lỗi đánh dấu đã đọc:', error);
    }
  };

  // 4. Đánh dấu tất cả là đã đọc
  const handleMarkAllAsRead = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await axios.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc!');
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả:', error);
      toast.error('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Xóa 1 thông báo
  const handleDeleteNotification = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.delete(`/notifications/${notifId}`);
      setNotifications((prev) => prev.filter((n) => n._id !== notifId));
      toast.success('Đã xóa thông báo');
    } catch (error) {
      console.error('Lỗi xóa thông báo:', error);
      toast.error(error.response?.data?.message || 'Không thể xóa thông báo.');
    }
  };

  // 6. Xóa / dọn dẹp tất cả thông báo đã đọc
  const handleClearRead = async () => {
    const hasRead = notifications.some((n) => n.isRead);
    if (!hasRead) {
      toast('Không có thông báo đã đọc nào để xóa.', { icon: 'ℹ️' });
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ thông báo đã đọc không?')) {
      return;
    }

    setIsProcessing(true);
    try {
      await axios.delete('/notifications/clear-read');
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      toast.success('Đã dọn dẹp các thông báo đã đọc thành công!');
    } catch (error) {
      console.error('Lỗi dọn thông báo:', error);
      toast.error(error.response?.data?.message || 'Không thể dọn thông báo.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 7. Nhấp vào thẻ thông báo để điều hướng tới trang tương ứng
  const handleCardClick = async (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif._id);
    }

    if (notif.link) {
      navigate(notif.link);
    } else if (notif.type === 'ORDER_UPDATE' && notif.orderId) {
      navigate('/my-orders', { state: { scrollToOrderId: notif.orderId } });
    } else if (notif.type === 'PROMOTION') {
      navigate('/promotions');
    } else if (notif.type && notif.type.startsWith('ARTICLE_')) {
      navigate('/blog');
    }
  };

  // 8. Định dạng icon, nhãn và màu sắc tương ứng với từng loại thông báo
  const getTypeConfig = (type) => {
    switch (type) {
      case 'ORDER_UPDATE':
        return {
          icon: FiPackage,
          label: 'Đơn hàng',
          badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          iconBg: 'bg-emerald-100 text-emerald-600',
          actionText: 'Xem đơn hàng',
        };
      case 'PROMOTION':
        return {
          icon: FiTag,
          label: 'Khuyến mãi',
          badgeBg: 'bg-amber-50 text-amber-600 border-amber-200',
          iconBg: 'bg-amber-100 text-amber-600',
          actionText: 'Săn ưu đãi',
        };
      case 'ARTICLE_APPROVED':
        return {
          icon: FiAward,
          label: 'Bài viết được duyệt',
          badgeBg: 'bg-purple-50 text-purple-600 border-purple-200',
          iconBg: 'bg-purple-100 text-purple-600',
          actionText: 'Xem bài viết',
        };
      case 'ARTICLE_LIKE':
        return {
          icon: FiHeart,
          label: 'Lượt thích',
          badgeBg: 'bg-rose-50 text-rose-600 border-rose-200',
          iconBg: 'bg-rose-100 text-rose-600',
          actionText: 'Xem bài viết',
        };
      case 'ARTICLE_COMMENT':
        return {
          icon: FiMessageSquare,
          label: 'Bình luận mới',
          badgeBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
          iconBg: 'bg-indigo-100 text-indigo-600',
          actionText: 'Xem bài viết',
        };
      case 'ARTICLE_UPDATE':
        return {
          icon: FiMessageSquare,
          label: 'Bài viết',
          badgeBg: 'bg-purple-50 text-purple-600 border-purple-200',
          iconBg: 'bg-purple-100 text-purple-600',
          actionText: 'Xem bài viết',
        };
      default:
        return {
          icon: FiBell,
          label: 'Hệ thống',
          badgeBg: 'bg-sky-50 text-sky-600 border-sky-200',
          iconBg: 'bg-sky-100 text-sky-600',
          actionText: 'Xem chi tiết',
        };
    }
  };

  // 9. Thống kê số lượng thông báo theo tab
  const counts = useMemo(() => {
    return {
      all: notifications.length,
      unread: notifications.filter((n) => !n.isRead).length,
      order: notifications.filter((n) => n.type === 'ORDER_UPDATE').length,
      social: notifications.filter((n) => n.type && n.type.startsWith('ARTICLE_')).length,
      promotion: notifications.filter((n) => n.type === 'PROMOTION').length,
      system: notifications.filter((n) => n.type === 'SYSTEM' || !n.type).length,
    };
  }, [notifications]);

  // 10. Lọc danh sách thông báo theo tab & từ khóa tìm kiếm
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Lọc theo Tab
      if (activeTab === 'unread' && n.isRead) return false;
      if (activeTab === 'order' && n.type !== 'ORDER_UPDATE') return false;
      if (activeTab === 'social' && (!n.type || !n.type.startsWith('ARTICLE_'))) return false;
      if (activeTab === 'promotion' && n.type !== 'PROMOTION') return false;
      if (activeTab === 'system' && n.type !== 'SYSTEM' && n.type) return false;

      // Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = n.title?.toLowerCase().includes(query);
        const contentMatch = n.content?.toLowerCase().includes(query);
        return titleMatch || contentMatch;
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  const tabs = [
    { key: 'all', label: 'Tất cả', count: counts.all, icon: FiBell },
    { key: 'unread', label: 'Chưa đọc', count: counts.unread, highlight: counts.unread > 0, icon: FiInfo },
    { key: 'order', label: 'Đơn hàng', count: counts.order, icon: FiPackage },
    { key: 'social', label: 'Bài viết & Tương tác', count: counts.social, icon: FiMessageSquare },
    { key: 'promotion', label: 'Khuyến mãi', count: counts.promotion, icon: FiTag },
    { key: 'system', label: 'Hệ thống', count: counts.system, icon: FiInfo },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 sm:py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* ================= HEADER TRUNG TÂM THÔNG BÁO ================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 mb-6 sm:mb-8 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                  <FiBell className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                    Trung Tâm Thông Báo
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Cập nhật tin tức đơn hàng, hoạt động cộng đồng và ưu đãi mới nhất
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {counts.unread > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-600 text-sm font-bold transition-all shadow-xs disabled:opacity-50"
                  title="Đánh dấu tất cả thông báo là đã đọc"
                >
                  <FiCheckCircle className="w-4 h-4" />
                  <span>Đã đọc tất cả ({counts.unread})</span>
                </button>
              )}

              <button
                onClick={handleClearRead}
                disabled={isProcessing || counts.all === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-sm font-semibold transition-all disabled:opacity-50"
                title="Xóa các thông báo đã đọc để gọn hộp thư"
              >
                <FiTrash2 className="w-4 h-4" />
                <span>Dọn thông báo đã đọc</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-6 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm thông báo theo nội dung, mã đơn hàng, sự kiện..."
              className="w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 w-5 h-5 rounded-full flex items-center justify-center transition"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ================= TABS CATEGORIES ================= */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : tab.highlight
                      ? 'bg-red-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ================= DANH SÁCH THÔNG BÁO ================= */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-200 border-t-sky-500 mb-4"></div>
            <p className="text-slate-500 text-sm font-medium">Đang tải thông báo của bạn...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-3xl mb-4 text-slate-400">
              {searchQuery ? '🔍' : activeTab === 'unread' ? '✨' : '📭'}
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">
              {searchQuery
                ? 'Không tìm thấy thông báo phù hợp'
                : activeTab === 'unread'
                ? 'Bạn đã đọc hết mọi thông báo!'
                : 'Chưa có thông báo nào trong mục này'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6">
              {searchQuery
                ? `Không có kết quả nào cho "${searchQuery}". Hãy thử tìm kiếm bằng từ khóa khác.`
                : activeTab === 'unread'
                ? 'Tuyệt vời! Bạn không bỏ sót bất kỳ cập nhật quan trọng nào từ DualeoFood.'
                : 'Khi có cập nhật về đơn hàng, giảm giá hoặc tin bài mới, thông báo sẽ hiển thị ở đây.'}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition"
              >
                Xóa tìm kiếm
              </button>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center">
                {activeTab !== 'all' && (
                  <button
                    onClick={() => setActiveTab('all')}
                    className="px-5 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-600 text-sm font-bold rounded-xl transition"
                  >
                    Xem tất cả thông báo
                  </button>
                )}
                <Link
                  to="/menu"
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold rounded-xl transition shadow-sm"
                >
                  Khám phá thực đơn ngay
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => {
              const typeCfg = getTypeConfig(notif.type);
              const Icon = typeCfg.icon;

              return (
                <div
                  key={notif._id}
                  onClick={() => handleCardClick(notif)}
                  className={`group relative bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer hover:shadow-md ${
                    notif.isRead
                      ? 'border-slate-100 hover:border-slate-200 text-slate-700'
                      : 'border-sky-100 bg-sky-50/40 hover:bg-sky-50/70 text-slate-900 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5 sm:gap-4">
                    {/* Cột Icon phân loại */}
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${typeCfg.iconBg}`}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>

                    {/* Khối Nội Dung Chính */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${typeCfg.badgeBg}`}
                        >
                          {typeCfg.label}
                        </span>

                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatDistanceToNow(new Date(notif.createdAt), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </span>

                        {!notif.isRead && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                            Mới
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-sm sm:text-base font-bold mb-1 group-hover:text-sky-600 transition-colors ${
                          notif.isRead ? 'text-slate-800' : 'text-slate-950 font-black'
                        }`}
                      >
                        {notif.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                        {notif.content}
                      </p>

                      {/* Footer thẻ: Nút bấm trực tiếp & công cụ */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 group-hover:translate-x-0.5 transition-transform">
                          <span>{typeCfg.actionText}</span>
                          <FiArrowRight className="w-3.5 h-3.5" />
                        </div>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {!notif.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(notif._id, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
                              title="Đánh dấu đã đọc"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteNotification(notif._id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                            title="Xóa thông báo này"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
