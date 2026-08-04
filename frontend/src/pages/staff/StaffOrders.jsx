import React, { useState, useEffect, useCallback } from 'react';
import axios, { SERVER_URL , getImageUrl } from '../../utils/axiosConfig';
import { useSocket } from '../../contexts/SocketContext';
import toast from 'react-hot-toast';
import { FiClock, FiPackage, FiTruck, FiCheckCircle, FiDollarSign, FiUser, FiPhone, FiMapPin, FiFileText, FiPrinter } from 'react-icons/fi';
import OrderReceipt from '../../components/admin/OrderReceipt';

/**
 * Trang quản lý đơn hàng dạng Kanban cho Staff.
 * - Mỗi cột đại diện cho 1 trạng thái đơn hàng
 * - Staff chỉ được chuyển trạng thái đi tới (không hủy)
 * - Cập nhật real-time qua Socket.IO
 */

// Cấu hình các cột trạng thái cho Staff (KHÔNG có cột CANCELLED)
const KANBAN_COLUMNS = [
  {
    key: 'PENDING',
    label: 'Chờ Duyệt',
    icon: <FiClock />,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    textColor: 'text-amber-700',
    badgeColor: 'bg-amber-500',
    nextStatus: 'PROCESSING',
    nextLabel: 'Xác nhận',
  },
  {
    key: 'PROCESSING',
    label: 'Đang Chuẩn Bị',
    icon: <FiPackage />,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-700',
    badgeColor: 'bg-blue-500',
    nextStatus: 'DELIVERING',
    nextLabel: 'Giao hàng',
  },
  {
    key: 'DELIVERING',
    label: 'Đang Giao',
    icon: <FiTruck />,
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-700',
    badgeColor: 'bg-purple-500',
    nextStatus: 'COMPLETED',
    nextLabel: 'Hoàn thành',
  },
  {
    key: 'COMPLETED',
    label: 'Hoàn Thành',
    icon: <FiCheckCircle />,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    textColor: 'text-green-700',
    badgeColor: 'bg-green-500',
    nextStatus: null, // Không có trạng thái tiếp theo
    nextLabel: null,
  },
];

// Cột đơn hàng chờ thanh toán QR (ở sidebar)
const AWAITING_PAYMENT = {
  key: 'AWAITING_PAYMENT',
  label: 'Chờ Thanh Toán QR',
  icon: <FiDollarSign />,
  bgColor: 'bg-orange-50',
  borderColor: 'border-orange-300',
  textColor: 'text-orange-700',
  badgeColor: 'bg-orange-500',
};

const StaffOrders = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const [expandedOrder, setExpandedOrder] = useState(null); // Theo dõi đơn hàng đang mở chi tiết
  const [printingOrder, setPrintingOrder] = useState(null); // Trạng thái in hóa đơn

  // Hàm tải toàn bộ đơn hàng (không phân trang để dùng cho Kanban)
  const fetchAllOrders = useCallback(async () => {
    try {
      const response = await axios.get('/orders?limit=200'); // Tải nhiều đơn hàng
      setAllOrders(response.data.orders || []);
    } catch (error) {
      console.error('Lỗi khi tải đơn hàng:', error);
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  // Lắng nghe Socket.IO để tự động cập nhật
  useEffect(() => {
    if (!socket) return;

    // Khi có đơn hàng mới
    socket.on('new_order', (newOrder) => {
      setAllOrders(prev => [newOrder, ...prev]);
      toast.success(`🆕 Đơn hàng mới #${newOrder._id.slice(-6)}`);
    });

    // Khi trạng thái đơn hàng thay đổi (do chính mình hoặc Admin)
    socket.on('order_status_updated', (updatedOrder) => {
      setAllOrders(prev => prev.map(o => o._id === updatedOrder._id ? { ...o, status: updatedOrder.status } : o));
    });

    return () => {
      socket.off('new_order');
      socket.off('order_status_updated');
    };
  }, [socket]);

  // Hàm chuyển trạng thái đơn hàng
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`/orders/${orderId}/status`, { status: newStatus });
      // Cập nhật local state ngay lập tức (optimistic update)
      setAllOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      toast.success('Cập nhật trạng thái thành công!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  // Hàm xác nhận thanh toán QR
  const handleConfirmPayment = async (orderId) => {
    try {
      await axios.put(`/orders/${orderId}/confirm-payment`);
      setAllOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'PENDING' } : o));
      toast.success('Xác nhận thanh toán thành công!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi xác nhận thanh toán');
    }
  };

  // Nhóm đơn hàng theo trạng thái
  const getOrdersByStatus = (status) => {
    return allOrders.filter(o => o.status === status);
  };

  // Hàm xử lý in hóa đơn
  const handlePrintOrder = (order) => {
    setPrintingOrder(order);
    
    // Đợi React render xong OrderReceipt portal ra DOM
    setTimeout(() => {
        window.print();
    }, 200);
  };

  // Format tiền VNĐ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Format thời gian
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Quản Lý Đơn Hàng</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng cộng: <span className="font-bold text-slate-700">{allOrders.length}</span> đơn hàng</p>
        </div>
        <button onClick={fetchAllOrders} className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition text-sm">
          🔄 Tải lại
        </button>
      </div>

      {/* Đơn hàng Chờ Thanh Toán QR (nếu có) */}
      {getOrdersByStatus('AWAITING_PAYMENT').length > 0 && (
        <div className={`mb-4 p-4 rounded-xl border-2 ${AWAITING_PAYMENT.borderColor} ${AWAITING_PAYMENT.bgColor}`}>
          <h3 className={`font-bold ${AWAITING_PAYMENT.textColor} mb-3 flex items-center gap-2`}>
            {AWAITING_PAYMENT.icon}
            {AWAITING_PAYMENT.label}
            <span className={`${AWAITING_PAYMENT.badgeColor} text-white text-xs px-2 py-0.5 rounded-full`}>
              {getOrdersByStatus('AWAITING_PAYMENT').length}
            </span>
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {getOrdersByStatus('AWAITING_PAYMENT').map(order => (
              <div key={order._id} className="bg-white rounded-lg p-3 shadow-sm min-w-[220px] border border-orange-200">
                <p className="font-bold text-sm text-slate-700">#{order._id.slice(-6)}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">{formatTime(order.createdAt)}</p>
                  <button onClick={(e) => { e.stopPropagation(); handlePrintOrder(order); }} className="text-gray-400 hover:text-gray-700 p-1" title="In Hóa Đơn">
                    <FiPrinter size={16} />
                  </button>
                </div>
                <p className="font-bold text-orange-600 mt-1">{formatCurrency(order.finalAmount)}</p>
                <button
                  onClick={() => handleConfirmPayment(order._id)}
                  className="mt-2 w-full text-xs font-bold py-1.5 px-3 rounded-md bg-orange-500 text-white hover:bg-orange-600 transition"
                >
                  ✅ Xác nhận đã thanh toán
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
        {KANBAN_COLUMNS.map((column) => {
          const orders = getOrdersByStatus(column.key);
          return (
            <div key={column.key} className={`flex flex-col rounded-xl border-2 ${column.borderColor} ${column.bgColor} overflow-hidden`}>
              {/* Header cột */}
              <div className={`p-3 border-b ${column.borderColor} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${column.textColor}`}>{column.icon}</span>
                  <h3 className={`font-bold text-sm ${column.textColor}`}>{column.label}</h3>
                </div>
                <span className={`${column.badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
                  {orders.length}
                </span>
              </div>

              {/* Danh sách đơn hàng trong cột */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {orders.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">Không có đơn hàng</p>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order._id}
                      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                    >
                      {/* Dòng trên: Mã đơn + Thời gian + Nút in */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-800">#{order._id.slice(-6)}</span>
                          <button onClick={(e) => { e.stopPropagation(); handlePrintOrder(order); }} className="text-gray-400 hover:text-gray-700 p-1" title="In Hóa Đơn">
                            <FiPrinter size={14} />
                          </button>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">{formatTime(order.createdAt)}</span>
                      </div>

                      {/* Thông tin khách hàng */}
                      {order.customerInfo && (
                        <div className="space-y-1 mb-2 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <FiUser className="text-gray-400" size={12} />
                            <span className="truncate">{order.customerInfo.name}</span>
                          </div>
                          {expandedOrder === order._id && (
                            <>
                              <div className="flex items-center gap-1">
                                <FiPhone className="text-gray-400" size={12} />
                                <span>{order.customerInfo.phone}</span>
                              </div>
                              <div className="flex items-start gap-1">
                                <FiMapPin className="text-gray-400 mt-0.5" size={12} />
                                <span className="line-clamp-2">{order.customerInfo.address}</span>
                              </div>
                              {order.customerInfo.note && (
                                <div className="flex items-start gap-1">
                                  <FiFileText className="text-gray-400 mt-0.5" size={12} />
                                  <span className="italic text-amber-600 line-clamp-2">{order.customerInfo.note}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* Danh sách món (khi mở rộng) */}
                      {expandedOrder === order._id && order.items && (
                        <div className="mb-2 text-xs border-t border-gray-100 pt-2 space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-gray-600">
                              <span className="truncate flex-1">{item.product?.name || 'Sản phẩm'} x{item.quantity}</span>
                              <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tổng tiền + Phương thức thanh toán */}
                      <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                        <span className="text-[10px] font-medium text-gray-400">
                          {order.paymentMethod === 'QR_CODE' ? '💳 QR Code' : '💵 Tiền mặt'}
                        </span>
                        <span className="font-black text-emerald-600 text-sm">{formatCurrency(order.finalAmount)}</span>
                      </div>

                      {/* Nút chuyển trạng thái (nếu có) */}
                      {column.nextStatus && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Ngăn mở/đóng chi tiết
                            handleStatusChange(order._id, column.nextStatus);
                          }}
                          className={`mt-2 w-full text-xs font-bold py-2 px-3 rounded-lg text-white transition-all hover:scale-[1.02] active:scale-[0.98] ${
                            column.key === 'PENDING' ? 'bg-blue-500 hover:bg-blue-600' :
                            column.key === 'PROCESSING' ? 'bg-purple-500 hover:bg-purple-600' :
                            'bg-green-500 hover:bg-green-600'
                          }`}
                        >
                          {column.key === 'PENDING' && '📦 '}
                          {column.key === 'PROCESSING' && '🛵 '}
                          {column.key === 'DELIVERING' && '✅ '}
                          {column.nextLabel}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Render Component In Hóa Đơn Ẩn */}
      {printingOrder && <OrderReceipt order={printingOrder} />}
    </div>
  );
};

export default StaffOrders;
