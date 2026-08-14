import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast'; // 1. Import toast
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { SERVER_URL , getImageUrl } from '../../utils/axiosConfig';
import { clearCart } from '../../redux/cartSlice'; // 1. Import hành động clearCart
import { useSocket } from '../../contexts/SocketContext';

const Checkout = () => {
  const cartItems = useSelector((state) => state.cart?.items || []);
  const totalPrice = useSelector((state) => state.cart?.totalPrice || 0);
  const dispatch = useDispatch(); // 2. Khởi tạo dispatch
  const navigate = useNavigate();
  const socket = useSocket();
  const location = useLocation();
  const { discountAmount = 0, userVoucherId = null, couponCode = null } = location.state || {}; // Nhận cả ID voucher và mã code

  const [shippingFeesList, setShippingFeesList] = useState([]);
  const [selectedShippingArea, setSelectedShippingArea] = useState(null);

  // Phí vận chuyển mặc định là 15k nếu chưa load được cài đặt, hoặc lấy từ khu vực được chọn
  const shippingFee = selectedShippingArea ? selectedShippingArea.fee : (shippingFeesList.length > 0 ? shippingFeesList[0].fee : 15000);
  // Tính tổng tiền = Tổng món + Ship - Giảm giá (đảm bảo không bị âm)
  const finalPrice = totalPrice > 0 ? Math.max(0, totalPrice + shippingFee - discountAmount) : 0;

  // --- STATE CHO SỔ ĐỊA CHỈ ---
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [isAddressListOpen, setIsAddressListOpen] = useState(false); // State mới để điều khiển dropdown
  const addressDropdownRef = useRef(null); // Ref để xử lý click bên ngoài

  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const [formData, setFormData] = useState({
    name: '', phone: '', address: '', note: ''
  });

  // --- LOGIC MỚI: LẤY VÀ XỬ LÝ SỔ ĐỊA CHỈ ---
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const { data } = await axios.get('/users/profile');
        const userAddresses = data.addresses || [];
        setSavedAddresses(userAddresses);

        // Tự động chọn địa chỉ mặc định hoặc địa chỉ đầu tiên
        const defaultAddress = userAddresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          handleSelectAddress(defaultAddress);
        } else if (userAddresses.length > 0) {
          handleSelectAddress(userAddresses[0]);
        } else {
          // Nếu không có địa chỉ nào, đánh dấu là 'new'
          setSelectedAddressId('new');
        }
      } catch (error) {
        toast.error("Không thể tải sổ địa chỉ của bạn.");
      }
    };

    const fetchSettings = async () => {
      try {
        const { data } = await axios.get('/settings/public');
        if (data && data.shippingFees && data.shippingFees.length > 0) {
          setShippingFeesList(data.shippingFees);
          setSelectedShippingArea(data.shippingFees[0]);
        }
      } catch (error) {
        console.error("Không thể tải cấu hình vận chuyển", error);
      }
    };

    fetchAddresses();
    fetchSettings();
  }, []);

  // --- LOGIC MỚI: ĐÓNG DROPDOWN KHI CLICK RA NGOÀI ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addressDropdownRef.current && !addressDropdownRef.current.contains(event.target)) {
        setIsAddressListOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hàm tự động điền thông tin vào form
  const handleSelectAddress = (address) => {
    setSelectedAddressId(address._id);
    setFormData({
      name: address.name,
      phone: address.phone,
      address: address.street, // Lưu ý: schema dùng 'street', form dùng 'address'
      note: '' // Reset ghi chú khi chọn địa chỉ mới
    });
    setIsAddressListOpen(false); // Tự động đóng danh sách sau khi chọn
  };

  // CÁC STATE MỚI ĐỂ QUẢN LÝ LUỒNG THANH TOÁN QR
  const [qrGenerated, setQrGenerated] = useState(false); // Trạng thái đã tạo mã QR chưa
  const [isCheckingPayment, setIsCheckingPayment] = useState(false); // Trạng thái loading chờ ngân hàng
  const [pendingOrder, setPendingOrder] = useState(null); // State để lưu đơn hàng đang chờ thanh toán

  // Thông tin ngân hàng của bạn
  const bankId = 'TPB'; 
  const accountNo = '88420072005'; 
  const accountName = 'NGUYEN DUC THANH'; 
  // Cập nhật QR URL để chứa mã đơn hàng, giúp admin đối soát dễ hơn
  const qrUrl = pendingOrder
    ? `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.jpg?amount=${pendingOrder.finalAmount}&addInfo=DH ${pendingOrder._id.substring(18)}&accountName=${accountName}`
    : `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.jpg?amount=${finalPrice}&addInfo=Thanh toan don hang&accountName=${accountName}`;

  // Lắng nghe sự kiện xác nhận thanh toán từ server
  useEffect(() => {
    // Chỉ kết nối socket nếu đang trong quá trình chờ thanh toán QR
    if (!pendingOrder) return;

    if (!socket) return;

    socket.on('payment_confirmed', (confirmedOrder) => {
      if (confirmedOrder._id === pendingOrder._id) {
        dispatch(clearCart());
        setIsCheckingPayment(false);
        navigate('/order-success', {
          replace: true,
          state: { fromCheckout: true, paymentMethod: 'QR_CODE', orderId: confirmedOrder._id },
        });
      }
    });

    return () => {
      socket.off('payment_confirmed');
    };
  }, [pendingOrder, dispatch, socket, navigate]);

  // Hàm gửi API tạo đơn hàng
  const createOrderRequest = async () => {
    setIsCheckingPayment(true);
    try {
      const orderData = {
        items: cartItems,
        userVoucherId, // Gửi ID của voucher đã chọn lên backend
        couponCode, // Gửi mã code nếu là voucher nhập tay
        shippingFee,
        paymentMethod,
        customerInfo: formData
      };
      const { data } = await axios.post('/orders', orderData);

      if (paymentMethod === 'CASH') {
        // Với tiền mặt, xử lý thành công luôn → chuyển sang trang xác nhận
        dispatch(clearCart());
        navigate('/order-success', {
          replace: true,
          state: { fromCheckout: true, paymentMethod: 'CASH', orderId: data.order?._id },
        });
      } else if (paymentMethod === 'QR_CODE') {
        // Với QR, lưu đơn hàng đang chờ và hiển thị mã QR
        setPendingOrder(data.order);
        setQrGenerated(true);
        // isCheckingPayment vẫn là true để UI hiển thị trạng thái chờ
      }
    } catch (error) {
      console.error('Lỗi khi tạo đơn hàng:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!');
      setIsCheckingPayment(false);
    }
  };
  
  // Hàm xử lý tổng hợp khi bấm nút dưới cùng
  const handleSubmitOrder = (e) => {
    e.preventDefault(); // Ngăn form tự động reload trang

    // Nếu đã tạo QR, nút submit sẽ bị vô hiệu hóa, không làm gì cả
    if (qrGenerated) return;

    createOrderRequest(); // Hàm này sẽ tự phân luồng cho CASH hoặc QR
  };



  // Tìm đối tượng địa chỉ đang được chọn để hiển thị
  const selectedAddress = savedAddresses.find(addr => addr._id === selectedAddressId);

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Bạn chưa có món đồ nào để thanh toán!</h2>
        <Link to="/" className="text-sky-500 font-bold hover:underline">Quay lại cửa hàng</Link>
      </div>
    );
  }

  return (
    // 1. Thêm một div bao bọc toàn trang để áp dụng background pattern
    <div className="font-sans bg-sky-50/50 py-10 md:py-16" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='hexagons' fill='%23dbeafe' fill-opacity='0.4' fill-rule='nonzero'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.99 7.5V30L0 22.5zM15 30v-7.5L28 15v7.5z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}>
      
      {/* Thêm style cho modal */}
      <style>{`.animate-modal-in { animation: modal-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; } @keyframes modal-in { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }`}</style>

      <div className="container mx-auto px-4 max-w-6xl relative">
        <h1 className="text-3xl md:text-4xl font-black text-sky-600 mb-8">💳 Thanh Toán Đơn Hàng</h1>

      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* ================= CỘT TRÁI: THÔNG TIN GIAO HÀNG ================= */}
        <div className="w-full lg:w-3/5">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-sky-50">
            <h2 className="text-xl font-bold text-gray-800 mb-2">1. Địa chỉ giao hàng</h2>
            <p className="text-sm text-gray-500 mb-6">Chọn địa chỉ có sẵn hoặc nhập một địa chỉ mới.</p>
            
            {/* --- GIAO DIỆN CHỌN ĐỊA CHỈ MỚI --- */}
            <div className="relative mb-6" ref={addressDropdownRef}>
              {/* Hộp hiển thị địa chỉ đang chọn */}
              <div 
                onClick={() => setIsAddressListOpen(!isAddressListOpen)}
                className="flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition bg-white hover:border-sky-400"
              >
                <div className="flex-1 min-w-0">
                  {selectedAddressId === 'new' ? (
                    <p className="font-bold text-gray-700">Giao đến địa chỉ khác</p>
                  ) : selectedAddress ? (
                    <div>
                      <div className="flex items-center gap-2">
                        {selectedAddress.label && <span className="text-xs font-bold text-sky-600 bg-sky-100 px-2 py-1 rounded-full flex-shrink-0">{selectedAddress.label}</span>}
                        <p className="font-bold text-gray-800 truncate">{selectedAddress.name} - {selectedAddress.phone}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 truncate">{selectedAddress.street}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Vui lòng chọn hoặc thêm địa chỉ...</p>
                  )}
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isAddressListOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>

              {/* Danh sách địa chỉ xổ xuống */}
              <div className={`absolute top-full left-0 w-full bg-white rounded-xl shadow-lg mt-2 z-20 overflow-y-auto border border-gray-200 transition-all duration-300 ease-in-out ${isAddressListOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                <div className="p-2 space-y-1">
                  {savedAddresses.map(addr => (
                    <div key={addr._id} onClick={() => handleSelectAddress(addr)} className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedAddressId === addr._id ? 'bg-sky-100' : 'hover:bg-sky-50'}`}>
                      <div className="flex justify-between items-baseline">
                        <p className="font-bold text-gray-800">
                          {addr.label && <span className="text-xs font-bold text-sky-600 bg-sky-100 px-2 py-1 rounded-full mr-2">{addr.label}</span>}
                          {addr.name} - {addr.phone}
                        </p>
                        {addr.isDefault && <span className={`text-xs font-bold ${selectedAddressId === addr._id ? 'text-green-700' : 'text-green-600'}`}>Mặc định</span>}
                      </div>
                      <p className="text-sm text-gray-600">{addr.street}</p>
                    </div>
                  ))}
                  <div className="border-t my-1"></div>
                  <div onClick={() => { setSelectedAddressId('new'); setFormData({ name: '', phone: '', address: '', note: '' }); setIsAddressListOpen(false); }} className={`p-3 font-semibold rounded-lg cursor-pointer transition-colors ${selectedAddressId === 'new' ? 'bg-sky-100 text-sky-700' : 'text-sky-600 hover:bg-sky-50'}`}>
                    + Giao đến địa chỉ khác
                  </div>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmitOrder} id="checkout-form" className="space-y-5">
              <div>
                <label className="block text-gray-600 font-semibold mb-2">Họ và Tên *</label>
                <input type="text" required placeholder="Nhập họ tên của bạn..." 
                  value={formData.name}
                  className={`w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition ${selectedAddressId !== 'new' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={qrGenerated || selectedAddressId !== 'new'} // Vô hiệu hóa khi đã chọn địa chỉ có sẵn
                />
              </div>
              
              <div>
                <label className="block text-gray-600 font-semibold mb-2">Số điện thoại *</label>
                <input type="tel" required pattern="[0-9]{10}" title="Số điện thoại phải có 10 chữ số" placeholder="Nhập số điện thoại liên hệ..." 
                  value={formData.phone}
                  className={`w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition ${selectedAddressId !== 'new' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={qrGenerated || selectedAddressId !== 'new'}
                />
              </div>

              {shippingFeesList.length > 0 && (
                <div>
                  <label className="block text-gray-600 font-semibold mb-2">Khu vực giao hàng *</label>
                  <select 
                    value={selectedShippingArea ? selectedShippingArea.area : ''}
                    onChange={(e) => {
                      const area = shippingFeesList.find(a => a.area === e.target.value);
                      setSelectedShippingArea(area);
                    }}
                    className={`w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition ${selectedAddressId !== 'new' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    disabled={qrGenerated || selectedAddressId !== 'new'}
                  >
                    {shippingFeesList.map((item, idx) => (
                      <option key={idx} value={item.area}>
                        {item.area} - {item.fee.toLocaleString('vi-VN')}đ
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-gray-600 font-semibold mb-2">Địa chỉ giao hàng chi tiết *</label>
                <textarea required rows="3" placeholder="Số nhà, tên đường, phường/xã, quận/huyện..." 
                  value={formData.address}
                  className={`w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition resize-none ${selectedAddressId !== 'new' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  disabled={qrGenerated || selectedAddressId !== 'new'}
                ></textarea>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-2">Ghi chú cho quán (Tùy chọn)</label>
                <input type="text" placeholder="Ví dụ: Lấy nhiều tương cà, không hành..." 
                  value={formData.note}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition"
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  disabled={qrGenerated}
                />
              </div>
            </form>
          </div>
        </div>

        {/* ================= CỘT PHẢI: PHƯƠNG THỨC & TỔNG KẾT ================= */}
        <div className="w-full lg:w-2/5 space-y-6">
          
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-sky-50">
            <h2 className="text-xl font-bold text-gray-800 mb-6">2. Phương thức thanh toán</h2>
            
            <div className="space-y-4">
              <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition ${paymentMethod === 'CASH' ? 'border-sky-500 bg-sky-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="payment" value="CASH" checked={paymentMethod === 'CASH'} 
                  onChange={() => { setPaymentMethod('CASH'); setQrGenerated(false); }} 
                  disabled={qrGenerated}
                  className="w-5 h-5 text-sky-500 focus:ring-sky-500" 
                />
                <span className="ml-3 font-semibold text-gray-700">Thanh toán tiền mặt (COD)</span>
              </label>

              <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition ${paymentMethod === 'QR_CODE' ? 'border-sky-500 bg-sky-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="payment" value="QR_CODE" checked={paymentMethod === 'QR_CODE'} 
                  onChange={() => setPaymentMethod('QR_CODE')} 
                  disabled={qrGenerated}
                  className="w-5 h-5 text-sky-500 focus:ring-sky-500" 
                />
                <span className="ml-3 font-semibold text-gray-700">Chuyển khoản qua mã QR (Thủ công)</span>
              </label>
            </div>

            {/* Chỉ hiện mã QR khi khách đã bấm nút "TẠO MÃ THANH TOÁN" */}
            {paymentMethod === 'QR_CODE' && qrGenerated && (
              <div className="mt-6 p-4 bg-sky-50 border-2 border-sky-300 rounded-xl flex flex-col items-center transition-all">
                <p className="text-sm font-bold text-sky-700 mb-3 text-center">Quét mã để thanh toán tự động</p>
                <div className="bg-white p-2 rounded-xl shadow-sm">
                  <img src={qrUrl} alt="Mã QR Thanh Toán" className="w-48 h-48 object-contain" />
                </div>
                <p className="text-xs text-sky-600 mt-3 text-center px-4 font-medium">
                  Vui lòng không tắt trình duyệt. Hệ thống sẽ tự động xác nhận sau khi admin xác thực thanh toán.
                </p>
              </div>
            )}
          </div>

          {/* 2. Nâng cấp hộp tổng cộng với màu gradient */}
          <div className="bg-gradient-to-br from-sky-500 to-sky-600 text-white p-6 md:p-8 rounded-2xl shadow-lg shadow-sky-500/30">
            <h2 className="text-xl font-black mb-6 border-b border-sky-400 pb-4">TỔNG CỘNG</h2>
            
            <div className="space-y-3 font-medium mb-6">
              <div className="flex justify-between">
                <span className="text-sky-100">Tiền món ăn:</span>
                <span>{totalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sky-100">Phí giao hàng:</span>
                <span>{shippingFee.toLocaleString('vi-VN')}đ</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-300 font-bold">
                  <span>Giảm giá:</span>
                  <span>- {discountAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-end border-t border-sky-400 pt-4 mb-8">
              <span className="text-lg font-semibold">Thành tiền:</span>
              <span className="text-3xl font-black">{finalPrice.toLocaleString('vi-VN')}đ</span>
            </div>

            {/* Nút bấm thay đổi linh hoạt theo trạng thái */}
            <button 
              type="submit" 
              form="checkout-form" 
              disabled={isCheckingPayment || qrGenerated}
              className={`w-full font-black text-lg py-4 rounded-xl shadow-md transition duration-300 flex justify-center items-center gap-2
                ${(isCheckingPayment || qrGenerated) ? 'bg-sky-400 text-sky-100 cursor-not-allowed' : 'bg-white text-sky-500 hover:bg-gray-50 hover:scale-[1.02]'}
              `}
            >
              {isCheckingPayment ? (
                <>
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {qrGenerated ? 'ĐANG CHỜ XÁC NHẬN...' : 'ĐANG XỬ LÝ...'}
                </>
              ) : paymentMethod === 'CASH' ? 'ĐẶT HÀNG NGAY' 
                : 'TẠO MÃ THANH TOÁN'}
            </button>
          </div>
        </div>
      </div>


      </div>
    </div>
  );
};

export default Checkout;