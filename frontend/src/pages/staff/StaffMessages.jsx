import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { FiMail, FiCheck, FiUser, FiPhone, FiClock } from 'react-icons/fi';

/**
 * Trang xem tin nhắn dành cho Staff.
 * Staff chỉ được XEM và ĐÁNH DẤU ĐÃ ĐỌC, KHÔNG được XÓA tin nhắn.
 */
const StaffMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fetchUnreadMessages } = useOutletContext(); // Hàm cập nhật badge sidebar

  // Tải danh sách tin nhắn
  const fetchMessages = async () => {
    try {
      const response = await axios.get('/messages');
      setMessages(response.data);
    } catch (error) {
      toast.error('Lỗi khi tải tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Đánh dấu đã đọc/chưa đọc
  const handleToggleRead = async (id) => {
    try {
      await axios.put(`/messages/${id}/read`);
      setMessages(prev => prev.map(msg =>
        msg._id === id ? { ...msg, isRead: !msg.isRead } : msg
      ));
      fetchUnreadMessages(); // Cập nhật badge sidebar
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  // Format thời gian tương đối
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now - date) / (1000 * 60));

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} giờ trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">Tin Nhắn Khách Hàng</h1>
        <p className="text-sm text-gray-500 mt-1">
          {messages.filter(m => !m.isRead).length} tin chưa đọc / Tổng cộng {messages.length} tin nhắn
        </p>
      </div>

      {/* Thông báo giới hạn quyền */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700 font-medium">
        💡 Bạn chỉ có quyền xem và đánh dấu đã đọc tin nhắn. Liên hệ Admin nếu cần xóa tin nhắn.
      </div>

      {/* Danh sách tin nhắn */}
      {messages.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FiMail className="mx-auto text-4xl mb-3" />
          <p className="font-medium">Chưa có tin nhắn nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg._id}
              className={`bg-white rounded-xl p-4 shadow-sm border-l-4 transition-all hover:shadow-md ${
                msg.isRead ? 'border-gray-200 opacity-70' : 'border-emerald-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Tên + Số điện thoại */}
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1.5">
                      <FiUser className="text-gray-400" size={14} />
                      <span className="font-bold text-slate-800">{msg.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FiPhone className="text-gray-400" size={14} />
                      <span className="text-sm text-gray-600">{msg.phone}</span>
                    </div>
                  </div>

                  {/* Nội dung tin nhắn */}
                  <p className="text-gray-700 text-sm leading-relaxed">{msg.content}</p>

                  {/* Thời gian */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <FiClock className="text-gray-400" size={12} />
                    <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
                  </div>
                </div>

                {/* Nút đánh dấu đã đọc / chưa đọc */}
                <button
                  onClick={() => handleToggleRead(msg._id)}
                  className={`ml-4 p-2 rounded-lg transition flex-shrink-0 ${
                    msg.isRead
                      ? 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50'
                      : 'text-emerald-500 hover:text-gray-400 hover:bg-gray-50'
                  }`}
                  title={msg.isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                >
                  {msg.isRead ? <FiCheck size={20} /> : <FiMail size={20} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffMessages;
