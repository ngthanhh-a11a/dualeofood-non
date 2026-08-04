import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { useOutletContext } from 'react-router-dom'; // Để lấy hàm cập nhật badge
import { FiMail, FiCheckCircle, FiTrash2, FiX, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null); // State cho modal
  const { fetchUnreadMessages } = useOutletContext(); // Lấy hàm từ AdminLayout

  useEffect(() => {
    const getMessages = async () => {
      try {
        const response = await axios.get('/messages');
        setMessages(response.data);
      } catch (error) {
        console.error('Lỗi khi tải tin nhắn:', error);
        toast.error('Không thể tải danh sách tin nhắn.');
      } finally {
        setLoading(false);
      }
    };
    getMessages();
  }, []);

  const handleRowClick = async (message) => {
    setSelectedMessage(message);

    // Nếu tin nhắn chưa đọc, gọi API đánh dấu đã đọc
    if (!message.isRead) {
      try {
        await axios.put(`/messages/${message._id}/read`);
        // Cập nhật lại state trên giao diện
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg._id === message._id ? { ...msg, isRead: true } : msg
          )
        );
        // Gọi hàm để cập nhật lại "bong bóng" thông báo trên sidebar
        fetchUnreadMessages();
      } catch (error) {
        console.error('Lỗi khi đánh dấu đã đọc:', error);
      }
    }
  };

  const handleDelete = async (id) => {
    // Ngăn việc click vào nút xóa làm mở modal
    if (window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này không?')) {
      try {
        await axios.delete(`/messages/${id}`);
        setMessages(messages.filter(msg => msg._id !== id));
        toast.success('Đã xóa tin nhắn.');
        if (selectedMessage?._id === id) {
          setSelectedMessage(null); // Đóng modal nếu tin nhắn đang xem bị xóa
        }
        fetchUnreadMessages(); // Cập nhật lại badge
      } catch (error) {
        toast.error('Lỗi khi xóa tin nhắn!');
      }
    }
  };

  const handleCloseModal = () => {
    setSelectedMessage(null);
  };

  return (
    <div className="font-sans">
      <h1 className="text-2xl font-black text-slate-800 mb-6">Hộp Thư Góp Ý</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-sky-50/50 text-slate-500 text-sm uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-4 font-bold text-center">Trạng thái</th>
                <th className="p-4 font-bold">Khách Hàng</th>
                <th className="p-4 font-bold">Nội dung</th>
                <th className="p-4 font-bold">Thời gian</th>
                <th className="p-4 font-bold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Đang tải...</td></tr>
              ) : messages.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500 bg-gray-50">Hộp thư trống.</td></tr>
              ) : messages.map((msg) => (
                <tr key={msg._id} onClick={() => handleRowClick(msg)} className={`transition-colors cursor-pointer ${msg.isRead ? 'bg-white hover:bg-sky-50/50' : 'bg-sky-50 hover:bg-sky-100 font-bold'}`}>
                  <td className="p-4 text-2xl text-center">{msg.isRead ? <FiCheckCircle className="text-green-400 mx-auto" title="Đã đọc" /> : <FiMail className="text-sky-500 mx-auto" title="Chưa đọc" />}</td>
                  <td className="p-4"><p className="text-gray-800">{msg.name}</p><p className={`text-sm ${msg.isRead ? 'text-gray-500' : 'text-sky-600'}`}>{msg.phone}</p></td>
                  <td className="p-4"><p className="line-clamp-1 w-80">{msg.content}</p></td>
                  <td className="p-4 text-sm text-gray-500">{new Date(msg.createdAt).toLocaleString('vi-VN')}</td>
                  <td className="p-4 text-center">
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(msg._id); }} className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-100 transition" title="Xóa tin nhắn"><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cửa sổ xem chi tiết tin nhắn (Modal) */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm" onClick={handleCloseModal}>
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-11/12 max-w-2xl text-left transform transition-all duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-gray-800">Chi Tiết Tin Nhắn</h3>
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-2"><FiClock size={14} /> Gửi lúc: {new Date(selectedMessage.createdAt).toLocaleString('vi-VN')}</p>
              </div>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-red-500 p-2 -mr-2 -mt-2"><FiX size={24} /></button>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Người gửi</p>
                <p className="text-lg font-bold text-sky-600 mt-1">{selectedMessage.name}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Số điện thoại</p>
                <p className="text-lg font-bold text-gray-700 mt-1">{selectedMessage.phone}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Nội dung lời nhắn</p>
                <p className="text-base text-gray-800 mt-2 leading-relaxed whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button onClick={() => handleDelete(selectedMessage._id)} className="bg-red-50 text-red-600 font-bold py-2 px-5 rounded-lg hover:bg-red-100 transition flex items-center gap-2">
                <FiTrash2 /> Xóa Tin Nhắn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;




































































































































































































































































































































































































































