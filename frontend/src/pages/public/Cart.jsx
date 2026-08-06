import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { removeFromCart, updateQuantity, clearCart, addToCart } from '../../redux/cartSlice';
import axios, { SERVER_URL , getImageUrl } from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { useAddToCartAnimation } from '../../hooks/useAddToCartAnimation';
import { FiPlus, FiMinus, FiTrash2, FiTag } from 'react-icons/fi';

// --- Component con: Modal chọn Voucher ---
const VoucherModal = ({ isOpen, onClose, vouchers, onSelectVoucher, onApplyCode, totalPrice }) => {
  if (!isOpen) return null;
  const [inputCode, setInputCode] = useState('');

  const handleApplyInputCode = (e) => {
    e.preventDefault();
    if (inputCode.trim()) {
      onApplyCode(inputCode.trim().toUpperCase());
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-slate-50 rounded-xl shadow-lg w-full max-w-lg m-4 animate-fade-in-down" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4">
          <h3 className="text-lg font-bold text-gray-800">🎟️ Kho Voucher của bạn</h3>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-red-500">&times;</button>
        </div>
        {/* Ô nhập mã */}
        <div className="p-4 border-t border-b">
          <form onSubmit={handleApplyInputCode} className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Nhập mã khuyến mãi tại đây..."
              className="flex-grow border-2 border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-sky-500 transition-colors"
            />
            <button type="submit" className="bg-sky-500 text-white font-bold px-6 rounded-lg hover:bg-sky-600 flex-shrink-0">Áp dụng</button>
          </form>
        </div>
        <div className="p-4 max-h-[50vh] overflow-y-auto">
          {vouchers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Bạn chưa có voucher nào trong ví.</p>
              <Link to="/promotions" className="text-sky-500 font-bold hover:underline mt-2 inline-block">Săn thêm voucher</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {vouchers.map(v => {
                const isApplicable = totalPrice >= v.coupon.minOrderValue;
                return (
                  <div key={v._id} className={`bg-white rounded-lg shadow-sm border p-4 flex items-center gap-4 transition-all ${!isApplicable ? 'opacity-60' : ''}`}>
                    <div className={`w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 flex flex-col items-center justify-center rounded-lg text-red-600 flex-shrink-0`}>
                        <span className="text-2xl font-black leading-none">{v.coupon.discountPercent}</span>
                        <span className="text-xs font-bold leading-none">%</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">Giảm {v.coupon.discountPercent}% cho đơn từ {v.coupon.minOrderValue.toLocaleString('vi-VN')}đ</p>
                      <p className="text-sm text-slate-500">Tối đa {v.coupon.maxDiscountAmount.toLocaleString('vi-VN')}đ. HSD: {new Date(v.coupon.expiryDate).toLocaleDateString('vi-VN')}</p>
                      {!isApplicable && <p className="text-xs font-bold text-red-500 mt-1">Chưa đủ điều kiện áp dụng</p>}
                    </div>
                    <button 
                      onClick={() => onSelectVoucher(v)} 
                      disabled={!isApplicable}
                      className="bg-sky-500 text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-sky-600 flex-shrink-0 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Áp dụng
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Component con: Card sản phẩm gợi ý ---
const SuggestedProductCard = ({ product, onAddToCart }) => (
  <div className="product-card-suggested snap-start flex-shrink-0 w-48 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
    <div className="w-full aspect-square bg-slate-50 rounded-xl mb-3 overflow-hidden">
      <img src={`${getImageUrl(product.image)}`} alt={product.name} className="product-image w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
    </div>
    <h4 className="font-bold text-sm text-slate-700 line-clamp-2 h-10">{product.name}</h4>
    <div className="flex justify-between items-center mt-2">
      <p className="font-black text-sky-500 text-lg">{product.price.toLocaleString('vi-VN')}đ</p>
      <button 
        onClick={(e) => onAddToCart(product, e)}
        className="w-9 h-9 flex items-center justify-center bg-sky-100 text-sky-600 rounded-full hover:bg-sky-500 hover:text-white transition-all duration-300 active:scale-90"
        title="Thêm vào giỏ"
      >
        <FiPlus size={20} />
      </button>
    </div>
  </div>
);


// --- Component chính: Trang Giỏ hàng ---
const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state.cart?.items || []);
  const totalPrice = useSelector((state) => state.cart?.totalPrice || 0);
  const token = localStorage.getItem('token');
  const { flyToCart } = useAddToCartAnimation();

  // 1. Khai báo các State cần thiết
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState([]);

  // 2. Gọi API lấy mã từ Ví
  useEffect(() => {
    if (token) {
      const fetchAvailableVouchers = async () => {
        try {
          const res = await axios.get('/vouchers/my-vouchers');
          const validVouchers = (Array.isArray(res.data) ? res.data : []).filter(v => {
             if (v.isUsed) return false;
             const coupon = v.coupon;
             if (!coupon) return false;
             if (!coupon.isActive) return false;
             if (new Date(coupon.expiryDate) < new Date()) return false;
             if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) return false;
             return true;
          });
          setAvailableVouchers(validVouchers);
        } catch (error) {
          console.error("Lỗi lấy ví voucher:", error);
        }
      };
      fetchAvailableVouchers();
    }

    // Gọi API lấy sản phẩm gợi ý
    const fetchSuggestedProducts = async () => {
      try {
        const res = await axios.get('/products/pinned/all');
        setSuggestedProducts(res.data.products || []);
      } catch (error) {
        console.error("Lỗi lấy sản phẩm gợi ý:", error);
      }
    };
    fetchSuggestedProducts();
  }, [token]);

  // 3. Hàm tính toán và áp dụng voucher
  const handleApplyVoucher = (voucherItem) => {
    const coupon = voucherItem.coupon;
    if (totalPrice < coupon.minOrderValue) {
      toast.error(`Đơn hàng phải từ ${coupon.minOrderValue.toLocaleString('vi-VN')}đ mới được áp dụng mã này!`);
      return;
    }
    let calculatedDiscount = (totalPrice * coupon.discountPercent) / 100;
    if (calculatedDiscount > coupon.maxDiscountAmount) {
      calculatedDiscount = coupon.maxDiscountAmount;
    }
    setSelectedVoucher(voucherItem);
    setDiscountAmount(Math.round(calculatedDiscount));
    setIsVoucherModalOpen(false);
    toast.success(`Đã áp dụng voucher ${coupon.code}!`);
  };

  // Hàm xử lý khi người dùng nhập mã tay
  const handleApplyManualCode = async (code) => {
    try {
      // Giả sử bạn đã có endpoint GET /api/coupons/code/:code
      const res = await axios.get(`/coupons/code/${code}`);
      const coupon = res.data;

      // Tạo một đối tượng voucher tạm thời để xử lý
      const manualVoucherItem = {
        coupon: coupon,
        isManual: true, // Đánh dấu đây là voucher nhập tay
        _id: `manual_${coupon._id}` // Tạo ID tạm để React phân biệt
      };

      // Gọi lại hàm apply có sẵn để kiểm tra điều kiện và tính toán
      handleApplyVoucher(manualVoucherItem);

    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Mã không hợp lệ hoặc đã có lỗi xảy ra.';
      toast.error(errorMsg);
    }
  };

  // Hàm bỏ chọn mã
  const handleRemoveVoucher = () => {
    setSelectedVoucher(null);
    setDiscountAmount(0);
    toast.info("Đã gỡ bỏ voucher.");
  };

  const handleCheckout = () => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để tiếp tục thanh toán.");
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    navigate('/checkout', {
      state: {
        discountAmount: discountAmount,
        userVoucherId: selectedVoucher?.isManual ? null : selectedVoucher?._id,
        couponCode: selectedVoucher?.isManual ? selectedVoucher.coupon.code : null
      }
    });
  };

  const handleRemoveFromCart = (id) => dispatch(removeFromCart(id));
  const handleUpdateQuantity = (id, quantity) => {
    if (quantity > 0) dispatch(updateQuantity({ id, quantity }));
  };
  const handleClearCart = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) dispatch(clearCart());
  };

  // Hàm thêm sản phẩm gợi ý vào giỏ
  const handleAddSuggestedToCart = (product, event) => {
    dispatch(addToCart({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
    }));
    flyToCart(event);
  };

  const shippingFee = 15000;
  const finalPrice = Math.max(0, totalPrice + shippingFee - discountAmount);

  return (
    <>
      <VoucherModal 
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        vouchers={availableVouchers}
        onSelectVoucher={handleApplyVoucher}
        onApplyCode={handleApplyManualCode}
        totalPrice={totalPrice}
      />
      <div className="bg-slate-50/70 min-h-screen">
        <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-black text-sky-600 mb-8">🛒 Giỏ Hàng Của Bạn</h1>
      {cartItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed">
          <h2 className="text-2xl font-bold text-gray-600 mb-6">Giỏ hàng của bạn đang trống!</h2>
          <Link to="/menu" className="bg-sky-500 text-white font-bold py-3 px-8 rounded-full hover:bg-sky-600 transition-all duration-300 shadow-lg shadow-sky-500/20">
            Bắt đầu mua sắm
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Cột trái: Danh sách sản phẩm và gợi ý */}
          <div className="w-full lg:w-3/5 space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-50">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
              <span className="font-bold text-gray-700">{cartItems.length} món trong giỏ</span>
              <button onClick={handleClearCart} className="text-sm text-red-500 hover:underline font-semibold">Xóa tất cả</button>
            </div>
              <div className="space-y-5">
              {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4">
                    <img src={`${getImageUrl(item.image)}`} alt={item.name} className="w-24 h-24 rounded-xl object-cover border" />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-lg">{item.name}</h3>
                      <p className="text-sky-500 font-black text-xl mt-1">{item.price.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border rounded-lg">
                        <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-50"><FiMinus /></button>
                        <span className="w-10 text-center font-bold">{item.quantity}</span>
                        <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100"><FiPlus /></button>
                      </div>
                      <button onClick={() => handleRemoveFromCart(item.id)} className="text-gray-400 hover:text-red-500 p-2">
                        <FiTrash2 size={20} />
                      </button>
                    </div>
                  </div>
              ))}
            </div>
            </div>

            {/* Khu vực "Mua kèm deal sốc" */}
            {suggestedProducts.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-50">
                <h3 className="text-lg font-bold text-gray-800 mb-4">🔥 Mua kèm deal sốc</h3>
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar snap-x">
                  {suggestedProducts.map(p => (
                    <SuggestedProductCard key={p._id} product={p} onAddToCart={handleAddSuggestedToCart} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cột phải: Tổng kết đơn hàng */}
          <div className="w-full lg:w-2/5">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-50 sticky top-28">
              <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">Tổng kết đơn hàng</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between font-medium text-gray-700"><span>Tạm tính:</span><span>{totalPrice.toLocaleString('vi-VN')}đ</span></div>
                <div className="flex justify-between font-medium text-gray-700"><span>Phí giao hàng:</span><span>{shippingFee.toLocaleString('vi-VN')}đ</span></div>
                
                {/* Khu vực Voucher được thiết kế lại */}
                <div className="border-t pt-4 mt-4">
                  {selectedVoucher ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-green-600 flex items-center gap-2"><FiTag /> Voucher áp dụng:</span>
                        <button onClick={handleRemoveVoucher} className="text-xs text-red-500 hover:underline">Bỏ chọn</button>
                      </div>
                      <div className="flex justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                        <span className="font-semibold text-green-700">{selectedVoucher.coupon.code}</span>
                        <span className="font-bold text-green-700">- {discountAmount.toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setIsVoucherModalOpen(true)} disabled={!token} className="w-full text-left text-sky-600 font-bold hover:underline disabled:text-gray-400 disabled:cursor-not-allowed disabled:no-underline flex items-center gap-2">
                      <FiTag /> {token ? 'Chọn hoặc nhập mã voucher' : 'Đăng nhập để dùng voucher'}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center border-t-2 border-dashed pt-4">
                <span className="text-lg font-bold">Tổng cộng:</span>
                <span className="text-2xl font-black text-sky-600">{finalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
              <button onClick={handleCheckout} className="mt-6 w-full bg-sky-500 text-white font-bold py-3.5 rounded-xl hover:bg-sky-600 transition-all duration-300 shadow-lg shadow-sky-500/30 active:scale-95">
                Tiến hành thanh toán
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
    </>
  );
};

export default Cart;