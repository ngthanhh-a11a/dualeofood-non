import React, { useState, useEffect } from 'react';
import axios, { SERVER_URL , getImageUrl } from '../../utils/axiosConfig';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext'; // 1. Import useSocket
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/cartSlice';
import ReviewModal from '../../components/features/ReviewModal'; // 1. Import component ReviewModal
import OrderStatusTracker from '../../components/features/OrderStatusTracker'; // Import component mới
import toast from 'react-hot-toast';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [expandedOrderId, setExpandedOrderId] = useState(null); // State để quản lý đơn hàng đang mở
  // States để quản lý modal đánh giá
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [productToReview, setProductToReview] = useState(null);
  const [reviewedProductIds, setReviewedProductIds] = useState([]); // Lưu ID sản phẩm đã đánh giá trong phiên này
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket(); // Dùng socket từ context
  
  // 2. Kết nối WebSocket để lắng nghe cập nhật trạng thái real-time
  useEffect(() => {
    if (!socket) return;

    // Lắng nghe sự kiện 'order_status_updated' từ server
    socket.on('order_status_updated', (updatedOrder) => {
      // Hiển thị thông báo cho người dùng
      const statusInfo = statusConfig[updatedOrder.status] || { text: 'cập nhật' };
      toast.success(`Đơn hàng #${updatedOrder._id.substring(0, 8)} đã ${statusInfo.text.toLowerCase()}!`);

      // Cập nhật lại trạng thái của đơn hàng tương ứng trong danh sách
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === updatedOrder._id
            ? { ...order, status: updatedOrder.status } // Chỉ cập nhật trạng thái
            : order
        )
      );
    });

    return () => {
      socket.off('order_status_updated');
    };
  }, [socket]);

  // Hợp nhất logic tải dữ liệu và cuộn vào một useEffect để xử lý đồng bộ
  useEffect(() => {
    const orderIdToScroll = location.state?.scrollToOrderId;

    const fetchAndProcessOrders = async () => {
      setLoading(true);
      try {
        // Xây dựng query: nếu có orderIdToScroll, gửi nó lên backend để tìm đúng trang
        const pageQuery = `page=${pagination.currentPage}`;
        const findOrderQuery = orderIdToScroll ? `&findOrderId=${orderIdToScroll}` : '';
        
        const response = await axios.get(`/orders/my-orders?${pageQuery}${findOrderQuery}`);
        const { orders, totalPages, currentPage, reviewedProductIds: initialReviewedIds } = response.data;
        
        // Cập nhật state với dữ liệu từ backend (có thể là trang mới)
        setOrders(orders);
        setPagination({ currentPage, totalPages });
        if (initialReviewedIds) {
          setReviewedProductIds(initialReviewedIds);
        }

        // Nếu đang trong luồng "tìm và cuộn", thực hiện cuộn sau khi đã có dữ liệu
        if (orderIdToScroll) {
          setExpandedOrderId(orderIdToScroll);
          
          // Dùng timeout để đảm bảo React đã render xong danh sách đơn hàng mới
          setTimeout(() => {
            const element = document.getElementById(`order-${orderIdToScroll}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.classList.add('highlight-order');
              setTimeout(() => {
                element.classList.remove('highlight-order');
              }, 2500);
            }
            // Xóa state khỏi location để tránh cuộn lại khi refresh/back
            navigate(location.pathname, { replace: true, state: {} });
          }, 100);
        }
      } catch (error) {
        console.error('Lỗi khi tải đơn hàng:', error);
        toast.error('Không thể tải dữ liệu đơn hàng.');
        // Nếu lỗi, cũng xóa state để tránh vòng lặp lỗi
        if (orderIdToScroll) {
          navigate(location.pathname, { replace: true, state: {} });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessOrders();
  }, [pagination.currentPage, location.state]);

  const handleToggleExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handleOpenReviewModal = (product) => {
    // Thêm SERVER_URL vào ảnh để modal hiển thị đúng
    setProductToReview({ ...product, image: `${getImageUrl(product.image)}` });
    setIsReviewModalOpen(true);
  };

  const handleReorder = (items) => {
    if (window.confirm('Bạn có muốn thêm tất cả các món trong đơn hàng này vào giỏ hàng không?')) {
      items.forEach(item => {
        // Đảm bảo chỉ thêm lại các sản phẩm vẫn còn tồn tại
        if (item.product && item.product._id) { 
          // Tạo payload chính xác cho addToCart
          // Lấy thông tin sản phẩm (như name, image) từ item.product
          // Nhưng quan trọng là lấy `price` từ `item.price` (giá tại thời điểm đặt hàng)
          const cartItem = {
            ...item.product,
            id: item.product._id, // ID của sản phẩm
            price: item.price      // Giá lịch sử của sản phẩm
          };
          dispatch(addToCart(cartItem));
        }
      });
      toast.success('Đã thêm các món vào giỏ hàng!');
      navigate('/cart');
    }
  };

  // Hàm xử lý hủy đơn hàng
  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
      try {
        // Gọi API để hủy đơn hàng
        await axios.put(`/orders/my-orders/${orderId}/cancel`);
        // Cập nhật giao diện ngay lập tức
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId ? { ...order, status: 'CANCELLED' } : order
          )
        );
        toast.success('Đã hủy đơn hàng thành công!');
      } catch (error) { 
        toast.error(error.response?.data?.message || 'Hủy đơn hàng thất bại!'); 
      }
    }
  };

  const statusConfig = {
    PENDING: { text: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    PROCESSING: { text: 'Đang chuẩn bị', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    DELIVERING: { text: 'Đang giao', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    COMPLETED: { text: 'Hoàn thành', color: 'bg-green-100 text-green-700 border-green-200' },
    CANCELLED: { text: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-200' },
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleReviewSubmitted = () => {
    if (productToReview) {
      // Cập nhật UI ngay lập tức để ẩn nút "Đánh giá"
      setReviewedProductIds(prev => [...prev, productToReview._id]);
    }
    // Đóng modal và reset lại state sau khi gửi
    setIsReviewModalOpen(false);
    setProductToReview(null);
  };

  if (loading) return <div className="text-center py-20 font-bold text-sky-500">Đang tải đơn hàng...</div>;

  return (
    <div className="font-sans bg-slate-50/70 min-h-screen py-12">
      {/* Thêm style cho hiệu ứng highlight */}
      <style>{`
        .highlight-order {
          transition: all 0.5s ease-in-out;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5); /* sky-500 with 50% opacity */
        }
      `}</style>
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl font-black text-sky-500 mb-8 border-b border-sky-100 pb-4">
          📦 ĐƠN HÀNG CỦA TÔI
        </h1>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
            <p className="text-xl text-gray-500 mb-6">Bạn chưa có đơn hàng nào</p>
            <Link to="/" className="bg-sky-500 text-white font-bold py-3 px-8 rounded-full hover:bg-sky-600 transition">
              Quay lại Thực đơn
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div 
                key={order._id} 
                id={`order-${order._id}`} // Thêm ID để có thể cuộn tới
                className={`bg-white rounded-2xl shadow-sm border border-sky-50 overflow-hidden transition-all duration-300 transform hover:shadow-lg hover:-translate-y-1 ${
                  expandedOrderId === order._id ? 'border-l-4 border-l-sky-500 shadow-xl' : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                      <p className="font-bold text-gray-800">Mã đơn: <span className="text-sky-600">{order._id.substring(0, 8)}</span></p>
                      <p className="text-sm text-gray-500 mt-1">Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="mt-3 sm:mt-0 flex items-center gap-4">
                      <span className={`px-4 py-1.5 text-sm font-bold rounded-full border ${statusConfig[order.status]?.color}`}>
                        {statusConfig[order.status]?.text}
                      </span>
                      <button onClick={() => handleToggleExpand(order._id)} className="text-sky-500 font-bold text-sm hover:underline">
                        {expandedOrderId === order._id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                      </button>
                      {/* Nút hủy đơn hàng chỉ hiển thị khi trạng thái là PENDING */}
                      {order.status === 'PENDING' && (
                        <button onClick={() => handleCancelOrder(order._id)} className="text-red-500 font-bold text-sm hover:underline ml-4">
                          Hủy đơn
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Phần chi tiết có thể mở rộng */}
                {expandedOrderId === order._id && (
                  <div className="bg-slate-50/70 border-t border-gray-100 animate-fade-in">
                    {/* Thanh tiến trình trạng thái đơn hàng */}
                    <OrderStatusTracker status={order.status} />

                    <div className="p-6">
                      <div className="space-y-4">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                              {item.product?.image ? (
                                <img src={`${getImageUrl(item.product.image)}`} alt={item.product?.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl">🍔</div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-800">{item.product?.name || 'Món ăn đã bị xóa'}</h4>
                              <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                            </div>
                            <div className="font-bold text-sky-600">
                              {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                            </div>
                            {/* Nút đánh giá cho từng sản phẩm */}
                            {order.status === 'COMPLETED' && (
                              <div className="ml-auto">
                                {reviewedProductIds.includes(item.product?._id) ? (
                                  <span className="text-sm font-bold text-green-500">Đã đánh giá</span>
                                ) : (
                                  <button
                                    onClick={() => handleOpenReviewModal(item.product)}
                                    className="text-sm font-bold text-sky-500 hover:underline"
                                  >
                                    Đánh giá
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-end">
                        <button onClick={() => handleReorder(order.items)} className="bg-sky-100 text-sky-600 font-bold py-2 px-4 rounded-lg hover:bg-sky-200 transition text-sm mb-4 sm:mb-0">
                          🔄 Đặt lại đơn này
                        </button>
                        <div className="text-right">
                          {order.discountAmount > 0 && (
                            <p className="text-sm text-green-500 font-semibold mb-1">Giảm giá: -{order.discountAmount.toLocaleString('vi-VN')}đ</p>
                          )}
                          <p className="text-lg">
                            Tổng tiền: <span className="text-2xl font-black text-sky-500">{order.finalAmount.toLocaleString('vi-VN')}đ</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Phương thức: {order.paymentMethod === 'QR_CODE' ? 'Chuyển khoản QR' : 'Tiền mặt'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* === KHU VỰC PHÂN TRANG === */}
        {orders.length > 0 && pagination.totalPages > 1 && (
          <div className="mt-8 pt-4 flex justify-center items-center gap-4 border-t border-gray-100">
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
            > Trang sau </button>
          </div>
        )}

        {/* Render Modal Đánh giá */}
        {isReviewModalOpen && productToReview && (
          <ReviewModal
            product={productToReview}
            onClose={() => {
              setIsReviewModalOpen(false);
              setProductToReview(null);
            }}
            onReviewSubmitted={handleReviewSubmitted}
          />
        )}
      </div>
    </div>
  );
};

export default MyOrders;