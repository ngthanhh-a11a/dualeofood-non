import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { SERVER_URL, getImageUrl } from '../../utils/axiosConfig';
import { clearCart } from '../../redux/cartSlice';
import { useSocket } from '../../contexts/SocketContext';
import { 
  FiNavigation, 
  FiMapPin, 
  FiClock, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiInfo, 
  FiMap, 
  FiPlus, 
  FiHome, 
  FiBriefcase 
} from 'react-icons/fi';
import { 
  getCurrentCoordinates, 
  reverseGeocodeOSM, 
  getGoogleMapsUrl, 
  calculateRouteDistanceOSRM, 
  calculateShippingFee 
} from '../../utils/geolocation';
import MapPickerModal from '../../components/common/MapPickerModal';

const Checkout = () => {
  const cartItems = useSelector((state) => state.cart?.items || []);
  const totalPrice = useSelector((state) => state.cart?.totalPrice || 0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const socket = useSocket();
  const location = useLocation();
  const { discountAmount = 0, userVoucherId = null, couponCode = null } = location.state || {};

  const [shippingConfig, setShippingConfig] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

  // Thông tin khoảng cách và thời gian di chuyển
  const [distanceInfo, setDistanceInfo] = useState({
    distanceKm: 0,
    durationMinutes: 0,
    isCalculated: false,
    isRoadRoute: false,
    isOutOfRange: false
  });
  const [calculatedGpsFee, setCalculatedGpsFee] = useState(null);

  // Phí vận chuyển: 100% tính tự động theo khoảng cách GPS thực tế từ Quán
  const shippingFee = useMemo(() => {
    if (calculatedGpsFee !== null) {
      return calculatedGpsFee;
    }
    return 0;
  }, [calculatedGpsFee]);

  // Tính tổng tiền = Tổng món + Ship - Giảm giá (đảm bảo không bị âm)
  const finalPrice = totalPrice > 0 ? Math.max(0, totalPrice + shippingFee - discountAmount) : 0;

  // --- STATE CHO SỔ ĐỊA CHỈ ---
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [isAddressListExpanded, setIsAddressListExpanded] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const [formData, setFormData] = useState({
    name: '', phone: '', address: '', note: '', location: null
  });

  const isGpsReady = Boolean(formData.location?.lat && formData.location?.lng);
  // Địa chỉ được chọn từ sổ (không được sửa)
  const isSavedAddressSelected = selectedAddressId !== 'new' && Boolean(savedAddresses.find(a => a._id === selectedAddressId));

  // Lấy sổ địa chỉ người dùng & cấu hình GPS Quán
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const { data } = await axios.get('/users/profile');
        const userAddresses = data.addresses || [];
        setSavedAddresses(userAddresses);

        // Tự động ưu tiên địa chỉ mặc định hoặc địa chỉ đầu tiên có GPS
        const defaultAddress = userAddresses.find(addr => addr.isDefault) || userAddresses[0];
        if (defaultAddress) {
          handleSelectAddress(defaultAddress);
        } else {
          setSelectedAddressId('new');
          setIsAddressListExpanded(true);
        }
      } catch (error) {
        toast.error("Không thể tải sổ địa chỉ của bạn.");
      }
    };

    const fetchSettings = async () => {
      try {
        const { data } = await axios.get('/settings/public');
        if (data?.shippingConfig) {
          setShippingConfig(data.shippingConfig);
        }
      } catch (error) {
        console.error("Không thể tải cấu hình vận chuyển", error);
      }
    };

    fetchAddresses();
    fetchSettings();
  }, []);

  // Tự động tính cự ly OSRM và cập nhật cước ship mỗi khi tọa độ GPS thay đổi
  useEffect(() => {
    const updateGpsShipping = async () => {
      const customerLoc = formData.location;
      const storeLoc = shippingConfig?.restaurantLocation;

      if (
        customerLoc?.lat && 
        customerLoc?.lng && 
        storeLoc?.lat && 
        storeLoc?.lng
      ) {
        setIsCalculatingDistance(true);
        try {
          const routeInfo = await calculateRouteDistanceOSRM(
            storeLoc.lat,
            storeLoc.lng,
            customerLoc.lat,
            customerLoc.lng
          );

          const feeResult = calculateShippingFee(routeInfo.distanceKm, shippingConfig);
          setCalculatedGpsFee(feeResult.fee);
          setDistanceInfo({
            distanceKm: routeInfo.distanceKm,
            durationMinutes: routeInfo.durationMinutes,
            isCalculated: true,
            isRoadRoute: routeInfo.isRoadRoute,
            isOutOfRange: feeResult.isOutOfRange
          });
        } catch (e) {
          console.error("Lỗi tính khoảng cách GPS:", e);
        } finally {
          setIsCalculatingDistance(false);
        }
      } else {
        setCalculatedGpsFee(null);
        setDistanceInfo({
          distanceKm: 0,
          durationMinutes: 0,
          isCalculated: false,
          isRoadRoute: false,
          isOutOfRange: false
        });
      }
    };

    updateGpsShipping();
  }, [formData.location, shippingConfig]);

  // Hàm tự động điền thông tin vào form khi click chọn địa chỉ từ sổ (khóa không cho sửa)
  const handleSelectAddress = (address) => {
    setSelectedAddressId(address._id);
    setFormData({
      name: address.name,
      phone: address.phone,
      address: address.street,
      note: '',
      location: address.location || null
    });
    setIsAddressListExpanded(false); // Thu gọn lại cho gọn gàng
  };

  // Chuyển sang chế độ nhập địa chỉ mới (mở khóa để nhập)
  const handleSelectNewAddress = () => {
    setSelectedAddressId('new');
    setFormData(prev => ({
      ...prev,
      name: '',
      phone: '',
      address: '',
      note: '',
      location: null
    }));
    setIsAddressListExpanded(false);
  };

  // Tự động định vị GPS hiện tại qua thiết bị -> chuyển sang chế độ tự do chỉnh sửa
  const handleDetectLocation = async () => {
    setIsLocating(true);
    const toastId = toast.loading('Đang lấy tín hiệu GPS thiết bị...');
    try {
      const coords = await getCurrentCoordinates();
      toast.loading('Đang tìm địa chỉ...', { id: toastId });
      const streetName = await reverseGeocodeOSM(coords.lat, coords.lng);

      // Chuyển ngay sang chế độ new để người dùng được phép chỉnh sửa tên, sđt, địa chỉ
      setSelectedAddressId('new');
      setFormData(prev => ({
        ...prev,
        address: streetName || prev.address,
        location: {
          lat: coords.lat,
          lng: coords.lng
        }
      }));
      toast.success('Đã xác định vị trí GPS (Cho phép chỉnh sửa thông tin)!', { id: toastId });
    } catch (error) {
      toast.error(error.message || 'Không thể lấy vị trí hiện tại.', { id: toastId });
    } finally {
      setIsLocating(false);
    }
  };

  // Mở modal bản đồ để chọn vị trí mới
  const handleOpenMapPicker = () => {
    // Chuyển sang chế độ new để mở khóa thông tin
    setSelectedAddressId('new');
    setIsMapPickerOpen(true);
  };

  // Xử lý khi chọn vị trí thành công trên Modal Bản đồ
  const handleLocationPicked = ({ lat, lng, address }) => {
    setSelectedAddressId('new'); // Mở khóa cho phép chỉnh sửa
    setFormData(prev => ({
      ...prev,
      address: address || prev.address,
      location: { lat, lng }
    }));
    toast.success('Đã lưu vị trí GPS! Bạn có thể chỉnh sửa thêm thông tin.');
  };

  // CÁC STATE MỚI ĐỂ QUẢN LÝ LUỒNG THANH TOÁN QR
  const [qrGenerated, setQrGenerated] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);

  // Thông tin ngân hàng
  const bankId = 'TPB'; 
  const accountNo = '88420072005'; 
  const accountName = 'NGUYEN DUC THANH'; 
  const qrUrl = pendingOrder
    ? `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.jpg?amount=${pendingOrder.finalAmount}&addInfo=DH ${pendingOrder._id.substring(18)}&accountName=${accountName}`
    : `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.jpg?amount=${finalPrice}&addInfo=Thanh toan don hang&accountName=${accountName}`;

  // Lắng nghe sự kiện xác nhận thanh toán từ server
  useEffect(() => {
    if (!pendingOrder || !socket) return;

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

  // LẮNG NGHE SỰ KIỆN ADMIN THAY ĐỔI BIỂU PHÍ VẬN CHUYỂN -> TỰ ĐỘNG ĐỒNG BỘ REALTIME
  useEffect(() => {
    if (!socket) return;

    const handleShippingConfigUpdated = (newConfig) => {
      if (newConfig) {
        setShippingConfig(newConfig);
        toast('Cửa hàng vừa cập nhật biểu phí vận chuyển mới!', {
          icon: '🚚',
          style: {
            borderRadius: '12px',
            background: '#0284c7',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '13px'
          }
        });
      }
    };

    socket.on('shipping_config_updated', handleShippingConfigUpdated);

    return () => {
      socket.off('shipping_config_updated', handleShippingConfigUpdated);
    };
  }, [socket]);

  // Hàm gửi API tạo đơn hàng
  const createOrderRequest = async () => {
    if (!isGpsReady) {
      toast.error('Bắt buộc phải có vị trí GPS để giao hàng và tính cước!');
      return;
    }

    setIsCheckingPayment(true);
    try {
      const orderData = {
        items: cartItems,
        userVoucherId,
        couponCode,
        shippingFee,
        distanceKm: distanceInfo.distanceKm || 0,
        paymentMethod,
        customerInfo: formData
      };
      const { data } = await axios.post('/orders', orderData);

      if (paymentMethod === 'CASH') {
        dispatch(clearCart());
        navigate('/order-success', {
          replace: true,
          state: { fromCheckout: true, paymentMethod: 'CASH', orderId: data.order?._id },
        });
      } else if (paymentMethod === 'QR_CODE') {
        setPendingOrder(data.order);
        setQrGenerated(true);
      }
    } catch (error) {
      console.error('Lỗi khi tạo đơn hàng:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!');
      setIsCheckingPayment(false);
    }
  };
  
  const handleSubmitOrder = (e) => {
    e.preventDefault();
    if (qrGenerated) return;
    createOrderRequest();
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Bạn chưa có món đồ nào để thanh toán!</h2>
        <Link to="/" className="text-sky-500 font-bold hover:underline">Quay lại cửa hàng</Link>
      </div>
    );
  }

  return (
    <div className="font-sans bg-sky-50/50 py-10 md:py-16" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='hexagons' fill='%23dbeafe' fill-opacity='0.4' fill-rule='nonzero'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.99 7.5V30L0 22.5zM15 30v-7.5L28 15v7.5z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}>
      
      <div className="container mx-auto px-4 max-w-6xl relative">
        <h1 className="text-3xl md:text-4xl font-black text-sky-600 mb-8">💳 Thanh Toán Đơn Hàng</h1>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* ================= CỘT TRÁI: THÔNG TIN GIAO HÀNG ================= */}
          <div className="w-full lg:w-3/5 space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-sky-100">
              
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">1. Địa chỉ nhận hàng</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Chọn từ sổ địa chỉ đã lưu hoặc ghim vị trí mới trên bản đồ.</p>
                </div>
                {savedAddresses.length > 0 && (
                  <Link 
                    to="/profile" 
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1"
                  >
                    Quản lý sổ địa chỉ ↗
                  </Link>
                )}
              </div>

              {/* --- KHỐI SỔ ĐỊA CHỈ: CÓ THỂ ĐÓNG VÀO THÌ ẨN, BẤM RA THÌ THẤY (ACCORDION) --- */}
              {savedAddresses.length > 0 && (
                <div className="mb-6 bg-slate-50/80 p-3 sm:p-4 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Sổ địa chỉ của bạn ({savedAddresses.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddressListExpanded(!isAddressListExpanded)}
                      className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-white hover:bg-sky-50 px-3 py-1 rounded-lg border border-sky-200 transition shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      {isAddressListExpanded ? '▲ Thu gọn danh sách' : '▼ Đổi địa chỉ đã lưu'}
                    </button>
                  </div>

                  {/* KHI THU GỌN: CHỈ HIỂN THỊ ĐỊA CHỈ ĐANG CHỌN (GỌN GÀNG) */}
                  {!isAddressListExpanded && (
                    <div>
                      {isSavedAddressSelected ? (
                        (() => {
                          const activeAddr = savedAddresses.find(a => a._id === selectedAddressId);
                          const hasGps = Boolean(activeAddr?.location?.lat && activeAddr?.location?.lng);
                          return (
                            <div className="p-3 bg-white rounded-xl border-2 border-sky-500 shadow-xs flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-bold text-slate-800 text-sm">{activeAddr?.name}</span>
                                  <span className="text-xs text-slate-500 font-semibold">• {activeAddr?.phone}</span>
                                  {activeAddr?.label && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                                      {activeAddr.label === 'Nhà riêng' ? <FiHome size={11} /> : activeAddr.label === 'Công ty' ? <FiBriefcase size={11} /> : null}
                                      {activeAddr.label}
                                    </span>
                                  )}
                                  {activeAddr?.isDefault && (
                                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                                      Mặc định
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600 line-clamp-1">{activeAddr?.street}</p>
                              </div>
                              <div className="shrink-0 flex items-center gap-2">
                                {hasGps ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                                    <FiMapPin size={11} /> Đã có GPS
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                                    <FiAlertCircle size={11} /> Thiếu GPS
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="p-3 bg-white rounded-xl border border-sky-300 shadow-2xs flex items-center justify-between">
                          <span className="text-xs font-bold text-sky-700 flex items-center gap-1.5">
                            <FiPlus className="text-sky-500" /> Đang giao đến địa chỉ mới / vị trí tùy chỉnh
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsAddressListExpanded(true)}
                            className="text-xs font-bold text-slate-600 hover:text-sky-600 underline cursor-pointer"
                          >
                            Chọn lại từ sổ ({savedAddresses.length})
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* KHI MỞ RỘNG: HIỂN THỊ TOÀN BỘ DANH SÁCH & NÚT GIAO ĐỊA CHỈ KHÁC */}
                  {isAddressListExpanded && (
                    <div className="space-y-2 mt-2 pt-2 border-t border-slate-200/80 animate-fade-in">
                      <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                        {savedAddresses.map((addr) => {
                          const isSelected = selectedAddressId === addr._id;
                          const hasGps = Boolean(addr.location?.lat && addr.location?.lng);

                          return (
                            <div
                              key={addr._id}
                              onClick={() => handleSelectAddress(addr)}
                              className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                isSelected 
                                  ? 'border-sky-500 bg-white shadow-xs' 
                                  : 'border-slate-200 bg-white/70 hover:border-sky-300 hover:bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-800 text-sm">{addr.name}</span>
                                  <span className="text-xs text-slate-500 font-semibold">• {addr.phone}</span>
                                  {addr.label && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                                      {addr.label}
                                    </span>
                                  )}
                                  {addr.isDefault && (
                                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                                      Mặc định
                                    </span>
                                  )}
                                </div>

                                <div className="shrink-0">
                                  {hasGps ? (
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                      GPS OK
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                      Thiếu GPS
                                    </span>
                                  )}
                                </div>
                              </div>

                              <p className="text-xs text-slate-600 mt-1 line-clamp-1">{addr.street}</p>
                            </div>
                          );
                        })}

                        {/* Khối Giao đến địa chỉ / vị trí khác kèm 2 nút GPS và Bản đồ trực tiếp */}
                        <div
                          className={`p-3.5 rounded-xl border-2 border-dashed transition space-y-2.5 ${
                            selectedAddressId === 'new' 
                              ? 'border-sky-500 bg-white shadow-xs' 
                              : 'border-slate-300 bg-slate-50/60 hover:border-sky-400 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                              <FiPlus className="text-sky-500" /> Giao đến địa chỉ / vị trí khác (Tùy chỉnh thông tin)
                            </span>
                            {selectedAddressId === 'new' && (
                              <span className="text-[10px] font-extrabold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                                Đang chọn
                              </span>
                            )}
                          </div>

                          {/* 2 nút đặt trực tiếp bên trong danh sách như yêu cầu */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={handleDetectLocation}
                              disabled={isLocating || qrGenerated}
                              className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                              title="Dùng cảm biến GPS của thiết bị"
                            >
                              <FiNavigation className={`w-3.5 h-3.5 text-sky-600 ${isLocating ? 'animate-spin' : ''}`} />
                              <span>{isLocating ? 'Đang định vị...' : 'Vị trí hiện tại'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleOpenMapPicker}
                              disabled={qrGenerated}
                              className="w-full py-2 px-3 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-xl text-xs font-bold text-sky-700 transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                              title="Mở bản đồ kéo ghim chọn điểm giao"
                            >
                              <FiMap className="w-3.5 h-3.5 text-sky-600" />
                              <span>Chọn trên bản đồ</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FORM CHI TIẾT NGƯỜI NHẬN & TỌA ĐỘ GPS */}
              <form onSubmit={handleSubmitOrder} id="checkout-form" className="space-y-4">
                
                {/* Banner cảnh báo khi đang chọn địa chỉ từ sổ (khóa trường) */}
                {isSavedAddressSelected && (
                  <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl text-xs text-sky-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <FiInfo className="text-sky-600 shrink-0" size={15} />
                      Đang dùng thông tin từ sổ địa chỉ đã chọn (khóa chỉnh sửa).
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddressListExpanded(true)}
                      className="font-bold text-sky-600 hover:text-sky-700 underline shrink-0 cursor-pointer"
                    >
                      Đổi hoặc ghim vị trí khác ↗
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold text-xs mb-1.5">
                      Họ và Tên người nhận * {isSavedAddressSelected && <span className="text-[11px] font-normal text-slate-400">(Từ sổ)</span>}
                    </label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Nguyễn Văn A" 
                      value={formData.name}
                      readOnly={isSavedAddressSelected}
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none transition ${
                        isSavedAddressSelected 
                          ? 'bg-slate-100 text-slate-600 cursor-not-allowed border-slate-200' 
                          : 'bg-white border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
                      }`}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      disabled={qrGenerated}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-slate-700 font-bold text-xs mb-1.5">
                      Số điện thoại * {isSavedAddressSelected && <span className="text-[11px] font-normal text-slate-400">(Từ sổ)</span>}
                    </label>
                    <input 
                      type="tel" 
                      required 
                      pattern="[0-9]{10}" 
                      title="Số điện thoại phải có 10 chữ số" 
                      placeholder="0912345678" 
                      value={formData.phone}
                      readOnly={isSavedAddressSelected}
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none transition ${
                        isSavedAddressSelected 
                          ? 'bg-slate-100 text-slate-600 cursor-not-allowed border-slate-200' 
                          : 'bg-white border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
                      }`}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      disabled={qrGenerated}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <label className="block text-slate-700 font-bold text-xs">
                      Địa chỉ nhận hàng chi tiết * {isSavedAddressSelected && <span className="text-[11px] font-normal text-slate-400">(Từ sổ)</span>}
                    </label>
                    
                    {/* Khi chọn địa điểm từ sổ địa chỉ: KHÔNG HIỆN 2 NÚT NÀY. Chỉ hiện khi ở chế độ địa chỉ mới (chưa có sổ hoặc chọn vị trí khác) */}
                    {!isSavedAddressSelected && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleDetectLocation}
                          disabled={isLocating || qrGenerated}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                          title="Dùng GPS thiết bị"
                        >
                          <FiNavigation className={`w-3 h-3 text-sky-600 ${isLocating ? 'animate-spin' : ''}`} />
                          <span>{isLocating ? 'Đang định vị...' : 'Vị trí hiện tại'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleOpenMapPicker}
                          disabled={qrGenerated}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-300 transition active:scale-95 cursor-pointer"
                          title="Mở bản đồ kéo ghim"
                        >
                          <FiMap className="w-3 h-3 text-sky-600" />
                          <span>Chọn trên bản đồ</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <textarea 
                    required 
                    rows="2" 
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện..." 
                    value={formData.address}
                    readOnly={isSavedAddressSelected}
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none transition resize-none ${
                      isSavedAddressSelected 
                        ? 'bg-slate-100 text-slate-600 cursor-not-allowed border-slate-200' 
                        : 'bg-white border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
                    }`}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    disabled={qrGenerated}
                  ></textarea>
                  
                  {/* HỘP BÁO CƯỚC VÀ CỰ LY GPS (BẮT BUỘC 100%) */}
                  {isGpsReady ? (
                    <div className="mt-2.5 p-3 sm:p-3.5 bg-gradient-to-r from-sky-50 to-indigo-50/50 rounded-xl border border-sky-200 text-xs space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <span className="p-1 bg-sky-500 text-white rounded-md"><FiNavigation size={13} /></span>
                          <span>Khoảng cách: <strong className="text-sky-600 font-black text-sm">{distanceInfo.distanceKm} km</strong></span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 flex items-center gap-1 font-semibold">
                            <FiClock size={12} className="text-amber-500" /> ~{distanceInfo.durationMinutes} phút
                          </span>
                        </div>
                        {formData.location?.lat && (
                          <a
                            href={getGoogleMapsUrl(formData.location.lat, formData.location.lng)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-600 hover:text-sky-700 font-bold inline-flex items-center gap-1 hover:underline"
                          >
                            Lộ trình chỉ đường ↗
                          </a>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-sky-100 text-[11px] text-slate-600">
                        <span>
                          Cước ship tự động: {shippingFee === 0 ? (
                            <strong className="text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded font-black">
                              MIỄN PHÍ (0đ)
                            </strong>
                          ) : (
                            <strong className="text-sky-600 font-bold">{shippingFee.toLocaleString('vi-VN')}đ</strong>
                          )}
                        </span>
                        <span className="text-slate-400">
                          {shippingConfig?.baseFee === 0 
                            ? `(${shippingConfig?.baseDistanceKm || 3}km đầu: Miễn phí + ${(shippingConfig?.startFeeAfterBase || 10000).toLocaleString('vi-VN')}đ km tiếp + ${(shippingConfig?.pricePerKm || 5000).toLocaleString('vi-VN')}đ/km sau đó)`
                            : `(${shippingConfig?.baseDistanceKm || 3}km đầu: ${(shippingConfig?.baseFee || 15000).toLocaleString('vi-VN')}đ + ${(shippingConfig?.pricePerKm || 5000).toLocaleString('vi-VN')}đ/km tiếp)`
                          }
                        </span>
                      </div>

                      {distanceInfo.isOutOfRange && (
                        <div className="flex items-center gap-1.5 text-amber-700 font-medium text-[11px] bg-amber-50 p-2 rounded-lg border border-amber-200">
                          <FiAlertCircle size={14} className="shrink-0 text-amber-600" />
                          <span>Vị trí của bạn khá xa quán (&gt; {shippingConfig?.maxDistanceKm}km), thời gian giao có thể lâu hơn dự kiến.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                      <FiAlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold">Bắt buộc xác định vị trí GPS để giao hàng!</p>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          Hệ thống tính cước ship theo km thực tế từ Quán. Vui lòng bấm <strong>"Vị trí hiện tại"</strong> hoặc <strong>"Chọn trên bản đồ"</strong> phía trên.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1.5">Ghi chú cho quán (Tùy chọn)</label>
                  <input 
                    type="text" 
                    placeholder="Ví dụ: Giao trước cửa, gọi trước khi đến..." 
                    value={formData.note}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition"
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

          {/* Khối danh sách món ăn trong đơn hàng */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-50">
            <h3 className="font-bold text-gray-800 text-base mb-4 flex justify-between items-center">
              <span>Đơn hàng của bạn</span>
              <span className="text-xs text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full font-extrabold">{cartItems.length} món</span>
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cartItems.map((item, idx) => (
                <div key={item.id || idx} className="flex items-start justify-between text-xs py-2 border-b border-gray-100 last:border-none">
                  <div className="flex-1 pr-2">
                    <p className="font-bold text-gray-800 leading-snug">{item.name} <span className="text-sky-600 font-extrabold">x{item.quantity}</span></p>
                    <div className="flex flex-wrap gap-1 mt-1 text-[11px]">
                      {item.size?.name && (
                        <span className="text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded font-semibold border border-sky-100">
                          {item.size.name}
                        </span>
                      )}
                      {Array.isArray(item.toppings) && item.toppings.length > 0 && (
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium border border-emerald-100">
                          +{item.toppings.map(t => t.name).join(', ')}
                        </span>
                      )}
                    </div>
                    {item.note && (
                      <p className="text-[10px] text-amber-700 italic mt-0.5">📝 {item.note}</p>
                    )}
                  </div>
                  <span className="font-black text-gray-800 shrink-0">
                    {((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Nâng cấp hộp tổng cộng với màu gradient */}
          <div className="bg-gradient-to-br from-sky-500 to-sky-600 text-white p-6 md:p-8 rounded-2xl shadow-lg shadow-sky-500/30">
            <h2 className="text-xl font-black mb-6 border-b border-sky-400 pb-4">TỔNG CỘNG</h2>
            
            <div className="space-y-3 font-medium mb-6">
              <div className="flex justify-between">
                <span className="text-sky-100">Tiền món ăn:</span>
                <span>{totalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sky-100 flex items-center gap-1.5">
                  Phí giao hàng:
                  {distanceInfo.isCalculated && (
                    <span className="text-[11px] bg-white/20 px-1.5 py-0.5 rounded font-bold">
                      {distanceInfo.distanceKm} km
                    </span>
                  )}
                </span>
                {distanceInfo.isCalculated && shippingFee === 0 ? (
                  <span className="text-emerald-300 font-extrabold uppercase bg-emerald-500/30 px-2 py-0.5 rounded text-sm">
                    Miễn phí
                  </span>
                ) : (
                  <span>{shippingFee.toLocaleString('vi-VN')}đ</span>
                )}
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
              disabled={!isGpsReady || isCheckingPayment || qrGenerated}
              className={`w-full font-black text-base md:text-lg py-4 rounded-xl shadow-md transition duration-300 flex justify-center items-center gap-2
                ${!isGpsReady 
                  ? 'bg-slate-200/90 text-slate-500 cursor-not-allowed opacity-90 shadow-none' 
                  : (isCheckingPayment || qrGenerated) 
                    ? 'bg-sky-400 text-sky-100 cursor-not-allowed' 
                    : 'bg-white text-sky-600 hover:bg-sky-50 hover:scale-[1.02]'}
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
              ) : !isGpsReady ? (
                <span className="flex items-center gap-2">
                  <FiAlertCircle size={18} /> Vui lòng chọn vị trí GPS
                </span>
              ) : paymentMethod === 'CASH' ? 'ĐẶT HÀNG NGAY' 
                : 'TẠO MÃ THANH TOÁN'}
            </button>

            {!isGpsReady && (
              <p className="text-center text-xs text-sky-100/90 mt-2 font-medium">
                * Bắt buộc có vị trí GPS để xác định quãng đường giao hàng
              </p>
            )}
          </div>
        </div>
      </div>

      {/* MODAL BẢN ĐỒ CHỌN TỌA ĐỘ VỊ TRÍ GIAO HÀNG */}
      <MapPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        onSelectLocation={handleLocationPicked}
        initialLocation={formData.location}
        storeLocation={shippingConfig?.restaurantLocation}
      />

      </div>
    </div>
  );
};

export default Checkout;