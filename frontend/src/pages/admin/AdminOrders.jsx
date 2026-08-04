import React, { useState, useEffect } from 'react';
import axios, { SERVER_URL , getImageUrl } from '../../utils/axiosConfig';
// 1. Import socket.io-client
import { useSocket } from '../../contexts/SocketContext';
import toast from 'react-hot-toast'; // Import toast để tạo thông báo
import { FiSettings, FiX, FiPrinter } from 'react-icons/fi';
import OrderReceipt from '../../components/admin/OrderReceipt';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // State cho bộ lọc và phân trang
  const [filterStatus, setFilterStatus] = useState('ALL');
  const socket = useSocket();
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  // State cho modal cài đặt
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [orderSettings, setOrderSettings] = useState({ enabled: false, deleteAfterDays: 90 });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // State cho in ấn hóa đơn
  const [printingOrder, setPrintingOrder] = useState(null);

  // Cấu hình màu sắc và text cho từng trạng thái
  const statusConfig = {
    AWAITING_PAYMENT: { text: 'Chờ thanh toán', color: 'bg-gray-100 text-gray-700 border-gray-200' },
    PENDING: { text: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    PROCESSING: { text: 'Đang chuẩn bị', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    DELIVERING: { text: 'Đang giao', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    COMPLETED: { text: 'Hoàn thành', color: 'bg-green-100 text-green-700 border-green-200' },
    CANCELLED: { text: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-200' },
  };

  // Gọi API lấy danh sách đơn hàng khi vào trang Admin
  // Hàm này sẽ được gọi lại mỗi khi filter hoặc page thay đổi
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Gửi kèm tham số lọc và phân trang
      const response = await axios.get(`/orders?status=${filterStatus}&page=${pagination.currentPage}`);
      const { orders, totalPages, currentPage } = response.data;
      setOrders(orders);
      setPagination({ currentPage, totalPages });
    } catch (error) {
      console.error('Lỗi khi tải danh sách đơn hàng:', error);
      if (error.response && error.response.status === 403) {
        setErrorMsg('⛔ Bạn không có quyền truy cập! Vui lòng đăng nhập bằng tài khoản Admin.');
      } else {
        setErrorMsg('Có lỗi xảy ra khi tải danh sách đơn hàng từ Server.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus, pagination.currentPage]); // Phụ thuộc vào bộ lọc và trang hiện tại

  // Lấy cài đặt khi component được tải
  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const { data } = await axios.get('/settings/orders');
            // Đảm bảo cấu trúc dữ liệu đúng trước khi set state
            if (data && data.value && data.value.autoDelete) {
                setOrderSettings(data.value.autoDelete);
            }
        } catch (error) { console.error("Không thể tải cài đặt đơn hàng", error); }
    };
    fetchSettings();
  }, []);

  // --- START: LOGIC MỚI ĐỂ "MỞ KHÓA" ÂM THANH TRÊN TRÌNH DUYỆT ---
  useEffect(() => {
    const unlockAudio = () => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      // Gỡ bỏ các event listener sau khi đã chạy 1 lần
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []); // Mảng rỗng đảm bảo useEffect chỉ chạy một lần.
  // --- END: LOGIC MỞ KHÓA ÂM THANH ---

  // 2. Lắng nghe sự kiện từ Socket
  useEffect(() => {
    if (!socket) return;

    // Lắng nghe sự kiện 'new_order' từ server
    socket.on('new_order', (newOrder) => {
      // Hiển thị thông báo toast có nút tải lại, giúp admin chủ động hơn
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <p className="font-medium text-gray-900">🔔 Có đơn hàng mới!</p>
            <p className="mt-1 text-sm text-gray-500">Mã đơn: {newOrder._id.substring(0, 8)}</p>
          </div>
          <div className="flex border-l border-gray-200"><button onClick={() => { fetchOrders(); toast.dismiss(t.id); }} className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-sky-600 hover:text-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500">Tải lại</button></div>
        </div>
      ), { duration: 60000 }); // Tự ẩn sau 1 phút

      // --- PHÁT ÂM THANH THÔNG BÁO (ĐÃ CẢI TIẾN) ---
      const playNotificationSound = async () => {
        try {
          const audio = new Audio('/notification.mp3'); // Đảm bảo file này có trong thư mục /public
          await audio.play();
        } catch (err) {
          console.warn('Không thể tự động phát âm thanh thông báo:', err);
        }
      };
      playNotificationSound();
    });

    // Dọn dẹp listener khi component bị hủy
    return () => {
      socket.off('new_order');
      socket.off('order_status_updated');
    };
  }, [socket, fetchOrders]);

  // Hàm cập nhật trạng thái đơn hàng
  const handleUpdateStatus = async (id, newStatus) => {
    if (newStatus === 'CANCELLED') {
      const confirmCancel = window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?');
      if (!confirmCancel) return;
    }
    
    try {
      // Gọi API cập nhật trạng thái trên Backend (MongoDB)
      await axios.put(`/orders/${id}/status`, { status: newStatus });
      
      // Cập nhật lại UI sau khi API thành công
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === id ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      alert('Lỗi cập nhật trạng thái đơn hàng!');
    }
  };

  // Hàm xác nhận thanh toán
  const handleConfirmPayment = async (id) => {
    try {
      await axios.put(`/orders/${id}/confirm-payment`);
      toast.success('Đã xác nhận thanh toán!');
      // Cập nhật UI để chuyển trạng thái đơn hàng
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === id ? { ...order, status: 'PENDING' } : order
        )
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi xác nhận thanh toán!');
    }
  };

  // Hàm lưu cài đặt
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
        await axios.put('/settings/orders', { autoDelete: orderSettings });
        toast.success('Cài đặt đã được lưu thành công!');
        setIsSettingsModalOpen(false);
    } catch (error) {
        toast.error('Lỗi khi lưu cài đặt!');
    } finally {
        setIsSavingSettings(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset về trang 1 khi đổi bộ lọc
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  }

  // Hàm xử lý in hóa đơn
  const handlePrintOrder = (order) => {
    setPrintingOrder(order);
    
    // Đợi React render xong OrderReceipt portal ra DOM
    setTimeout(() => {
        window.print();
        // (Tùy chọn) Xóa state sau khi in xong để DOM sạch sẽ
        // setTimeout(() => setPrintingOrder(null), 1000);
    }, 200);
  };

  return (
    <div className="font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-slate-800">📦 Quản Lý Đơn Hàng</h1>
        
        {/* Bộ lọc trạng thái (UI demo) */}
        <div className="flex space-x-2">
          <select value={filterStatus} onChange={handleFilterChange} className="border border-gray-300 rounded-lg px-4 py-2 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="ALL">Tất cả đơn hàng</option>
            <option value="AWAITING_PAYMENT">Chờ thanh toán</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="PROCESSING">Đang chuẩn bị</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
          <button onClick={() => setIsSettingsModalOpen(true)} className="p-2.5 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-sky-500 transition">
            <FiSettings size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-sky-50/50 text-slate-500 text-sm uppercase tracking-wider border-b border-gray-100">
                <th className="p-4 font-bold">Mã Đơn</th>
                <th className="p-4 font-bold">Khách Hàng</th>
                <th className="p-4 font-bold">Chi Tiết Món</th>
                <th className="p-4 font-bold">Tổng Tiền</th>
                <th className="p-4 font-bold">Trạng Thái</th>
                <th className="p-4 font-bold text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {errorMsg ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-red-500 font-bold bg-red-50">
                    {errorMsg}
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500 font-medium">
                    Đang tải danh sách đơn hàng...
                  </td>
                </tr>
              ) : orders.map((order) => (
                <tr key={order._id} className="hover:bg-sky-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-sky-600">{order._id.substring(0, 8)}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-gray-800">{order.customerInfo?.name || 'Khách vãng lai'}</p>
                    <p className="text-sm text-gray-500">{order.customerInfo?.phone || 'N/A'}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1 w-40" title={order.customerInfo?.address}>{order.customerInfo?.address || 'N/A'}</p>
                  </td>
                  <td className="p-4">
                    <div 
                      className="text-sm text-gray-700 w-48 line-clamp-2" 
                      title={order.items?.map(item => `${item.product?.name || 'Món đã xóa'} (x${item.quantity})`).join(', ')}
                    >
                      {order.items?.map((item, index) => (
                        <span key={index}>
                          {item.product?.name || <span className="text-red-500 italic">Món đã xóa</span>} 
                          <span className="text-gray-400">(x{item.quantity})</span>
                          {index < order.items.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-black text-slate-800">{order.finalAmount?.toLocaleString('vi-VN')}đ</p>
                    <p className="text-xs font-semibold mt-1">
                      {order.paymentMethod === 'QR_CODE' 
                        ? <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">Đã CK (QR)</span> 
                        : <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">Tiền mặt</span>}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${statusConfig[order.status].color}`}>
                      {statusConfig[order.status].text}
                    </span>
                  </td>
                  <td className="p-4 text-center space-y-2">
                    {/* Nút In hóa đơn luôn hiển thị */}
                    <button onClick={() => handlePrintOrder(order)} className="w-32 bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold py-2 px-3 rounded shadow-sm transition flex justify-center items-center gap-2 mb-2 mx-auto">
                        <FiPrinter /> In Hóa Đơn
                    </button>

                    {/* Các nút thao tác thay đổi linh hoạt theo trạng thái hiện tại */}
                    {order.status === 'AWAITING_PAYMENT' && (
                      <button onClick={() => handleConfirmPayment(order._id)} className="w-32 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold py-2 px-3 rounded shadow-sm transition mx-auto block">
                        Xác nhận đã trả
                      </button>
                    )}

                    {order.status === 'PENDING' && (
                      <div className="flex flex-col space-y-2 items-center">
                        <button onClick={() => handleUpdateStatus(order._id, 'PROCESSING')} className="w-28 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold py-2 px-3 rounded shadow-sm transition">
                          Duyệt Đơn
                        </button>
                        <button onClick={() => handleUpdateStatus(order._id, 'CANCELLED')} className="w-28 bg-white border border-red-300 text-red-500 hover:bg-red-50 text-xs font-bold py-2 px-3 rounded transition">
                          Hủy Đơn
                        </button>
                      </div>
                    )}
                    
                    {order.status === 'PROCESSING' && (
                      <button onClick={() => handleUpdateStatus(order._id, 'DELIVERING')} className="w-28 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold py-2 px-3 rounded shadow-sm transition">
                        Giao Hàng
                      </button>
                    )}

                    {order.status === 'DELIVERING' && (
                      <button onClick={() => handleUpdateStatus(order._id, 'COMPLETED')} className="w-28 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 px-3 rounded shadow-sm transition">
                        Hoàn Thành
                      </button>
                    )}

                    {(order.status === 'COMPLETED' || order.status === 'CANCELLED') && (
                      <span className="text-gray-400 text-sm italic">Đã chốt</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* === KHU VỰC PHÂN TRANG === */}
        {pagination.totalPages > 1 && (
          <div className="p-4 flex justify-between items-center bg-sky-50/50 border-t border-gray-100">
            <button 
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trang trước
            </button>
            <span className="text-sm font-bold text-gray-600">
              Trang {pagination.currentPage} / {pagination.totalPages}
            </span>
            <button 
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trang sau
            </button>
          </div>
        )}
      </div>

      {/* Modal Cài Đặt */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg m-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><FiSettings /> Cài Đặt Đơn Hàng</h2>
              <button onClick={() => setIsSettingsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-sky-500 rounded focus:ring-sky-500"
                    checked={orderSettings.enabled}
                    onChange={(e) => setOrderSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                  />
                  <span className="ml-3 font-bold text-gray-700">Tự động xóa đơn hàng đã hoàn thành</span>
                </label>
                <p className="text-sm text-gray-500 mt-2 ml-8">
                  Hệ thống sẽ tự động xóa vĩnh viễn các đơn hàng có trạng thái "Hoàn thành" sau một khoảng thời gian để tối ưu hóa cơ sở dữ liệu.
                </p>
              </div>

              {orderSettings.enabled && (
                <div className="pl-8 animate-fade-in">
                  <label className="block text-gray-600 font-semibold mb-2">Xóa sau:</label>
                  <select 
                    value={orderSettings.deleteAfterDays}
                    onChange={(e) => setOrderSettings(prev => ({ ...prev, deleteAfterDays: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="30">30 ngày</option>
                    <option value="60">60 ngày</option>
                    <option value="90">90 ngày</option>
                    <option value="180">6 tháng</option>
                    <option value="365">1 năm</option>
                  </select>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button onClick={handleSaveSettings} disabled={isSavingSettings} className="px-6 py-2.5 bg-sky-500 text-white font-bold rounded-lg hover:bg-sky-600 transition disabled:bg-gray-400">
                {isSavingSettings ? 'Đang lưu...' : 'Lưu Cài Đặt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render Component In Hóa Đơn Ẩn */}
      {printingOrder && <OrderReceipt order={printingOrder} />}
    </div>
  );
};

export default AdminOrders;