import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // Import Link
import { useDispatch } from 'react-redux';
import axios, { SERVER_URL , getImageUrl } from '../../utils/axiosConfig';
import { addToCart } from '../../redux/cartSlice';
import toast from 'react-hot-toast';
import { FiStar, FiShoppingCart, FiArrowLeft, FiEdit, FiEye, FiEyeOff, FiPlus, FiMinus, FiCheck, FiEdit3 } from 'react-icons/fi'; // Import FiShoppingCart
import { TbPinFilled } from 'react-icons/tb';
import StarRating from '../../components/common/StarRating'; // Import component
import ReviewModal from '../../components/features/ReviewModal';
import { useAddToCartAnimation } from '../../hooks/useAddToCartAnimation'; // Import hook animation

const ProductDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { flyToCart } = useAddToCartAnimation(); // Khởi tạo hook animation
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]); // State cho sản phẩm liên quan
  const [error, setError] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [productToReview, setProductToReview] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  // States cho tính năng Tùy biến món (Size & Topping)
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/products/${id}`);
      setProduct(data);
      setError('');

      // Khởi tạo tùy chọn mặc định
      if (Array.isArray(data.sizes) && data.sizes.length > 0) {
        setSelectedSize(data.sizes[0]);
      } else {
        setSelectedSize(null);
      }
      setSelectedToppings([]);
      setQuantity(1);
      setNote('');

      // Tải các sản phẩm liên quan dựa trên category
      if (data.category) {
        const { data: relatedData } = await axios.get(`/products?category=${data.category}&limit=5`);
        // Lọc sản phẩm hiện tại ra khỏi danh sách và chỉ lấy 4 sản phẩm
        const filteredRelated = relatedData.products.filter(p => p._id !== id).slice(0, 4);
        setRelatedProducts(filteredRelated);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải thông tin sản phẩm.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();

    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      try {
        setUserInfo(JSON.parse(storedUserInfo));
      } catch (e) {
        console.error("Lỗi parse thông tin người dùng:", e);
      }
    }
  }, [id]);

  const handleReviewSubmitted = () => {
    setIsReviewModalOpen(false);
    setProductToReview(null);
    toast.success('Cảm ơn bạn! Đang cập nhật lại danh sách đánh giá...');
    setTimeout(() => {
      fetchProduct(); // Tải lại dữ liệu sản phẩm để hiển thị review mới
    }, 500);
  };

  const toggleHideReview = async (reviewId) => {
    if (!userInfo || (userInfo.role !== 'admin' && userInfo.role !== 'staff')) return;
    try {
      const res = await axios.put(`/products/${product._id}/reviews/${reviewId}/visibility`, {}, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      // Update local product state with new stats and reviews
      setProduct(prev => ({
        ...prev,
        reviews: res.data.reviews,
        numReviews: res.data.numReviews,
        averageRating: res.data.averageRating
      }));
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi thao tác đánh giá');
    }
  };

  const handleOpenReviewModal = (product) => {
    if (!userInfo) {
      // Chuyển hướng đến trang đăng nhập và gửi kèm thông báo
      navigate('/login', { state: { message: 'Vui lòng đăng nhập để đánh giá sản phẩm!' } });
      return;
    }
    setProductToReview({
      ...product,
      image: `${getImageUrl(product.image)}`
    });
    setIsReviewModalOpen(true);
  }

  const handleToggleTopping = (topping) => {
    setSelectedToppings(prev => {
      const exists = prev.some(t => t.name === topping.name);
      if (exists) {
        return prev.filter(t => t.name !== topping.name);
      } else {
        return [...prev, topping];
      }
    });
  };

  const unitPrice = (Number(product?.price) || 0) + 
                    (Number(selectedSize?.priceOffset) || 0) + 
                    selectedToppings.reduce((acc, t) => acc + (Number(t.price) || 0), 0);
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = (e) => {
    if (!product) return;
    dispatch(addToCart({
      productId: product._id,
      id: product._id,
      name: product.name,
      basePrice: product.price,
      price: unitPrice,
      image: product.image,
      size: selectedSize,
      toppings: selectedToppings,
      note: note.trim(),
      quantity: quantity
    }));

    // Kích hoạt animation từ hook, truyền vào ID của ảnh sản phẩm
    flyToCart(null, 'product-detail-image');
  };

  if (loading) {
    return <div className="text-center py-20">Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500">
        <h2 className="text-2xl font-bold mb-4">Lỗi!</h2>
        <p>{error}</p>
        <Link to="/menu" className="mt-4 inline-block bg-sky-500 text-white px-6 py-2 rounded-lg">Quay lại Thực đơn</Link>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-20">Không tìm thấy sản phẩm.</div>;
  }

  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const toppings = Array.isArray(product.toppings) ? product.toppings : [];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Nút quay lại */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 font-semibold hover:text-sky-500 transition-colors cursor-pointer"
        >
          <FiArrowLeft />
          Quay lại
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Cột ảnh sản phẩm */}
        <div className="bg-gray-100 rounded-3xl p-8 sticky top-24 shadow-sm border border-slate-100">
          <img
            id="product-detail-image"
            src={`${getImageUrl(product.image)}`}
            alt={product.name}
            className="w-full h-auto max-h-[460px] object-contain mx-auto rounded-2xl"
          />
        </div>

        {/* Cột thông tin sản phẩm & Tùy biến */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 mb-3">{product.name}</h1>
            
            {/* Đánh giá */}
            <div className="flex items-center gap-4 mb-4">
              <StarRating rating={product.averageRating} />
              <span className="text-gray-500 text-sm font-semibold">
                ({product.numReviews} đánh giá)
              </span>
            </div>

            <p className="text-gray-600 text-base leading-relaxed">{product.description || 'Món ăn đặc sản tươi ngon được chế biến theo công thức độc quyền.'}</p>
          </div>

          {/* GIÁ TIỀN HIỂN THỊ */}
          <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 flex items-baseline justify-between">
            <div>
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider block mb-0.5">Đơn giá một phần:</span>
              <span className="text-3xl sm:text-4xl font-black text-sky-600">
                {unitPrice.toLocaleString('vi-VN')}đ
              </span>
            </div>
            {unitPrice > product.price && (
              <span className="text-xs font-bold text-slate-400 line-through">
                {(product.price || 0).toLocaleString('vi-VN')}đ
              </span>
            )}
          </div>

          {/* PHẦN CHỌN SIZE */}
          {sizes.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                  📏 Chọn Kích Cỡ (Size)
                </label>
                <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                  Bắt buộc
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {sizes.map((s, idx) => {
                  const isSelected = selectedSize?.name === s.name;
                  const offset = Number(s.priceOffset) || 0;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-sky-500 bg-sky-50/50 shadow-xs' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <p className={`font-bold text-sm ${isSelected ? 'text-sky-900' : 'text-slate-800'}`}>{s.name}</p>
                      <p className={`text-xs font-extrabold mt-0.5 ${isSelected ? 'text-sky-600' : 'text-slate-500'}`}>
                        {offset > 0 ? `+${offset.toLocaleString('vi-VN')}đ` : 'Mặc định'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PHẦN CHỌN TOPPING */}
          {toppings.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                  🧀 Thêm Topping
                </label>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  Tùy chọn
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {toppings.map((t, idx) => {
                  const isChecked = selectedToppings.some(item => item.name === t.name);
                  const price = Number(t.price) || 0;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleTopping(t)}
                      className={`p-3 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${
                        isChecked 
                          ? 'border-emerald-500 bg-emerald-50/40 shadow-xs' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center ${
                          isChecked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'
                        }`}>
                          {isChecked && <FiCheck className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={`text-sm font-bold ${isChecked ? 'text-emerald-900' : 'text-slate-700'}`}>{t.name}</span>
                      </div>
                      <span className={`text-xs font-black ${isChecked ? 'text-emerald-600' : 'text-slate-500'}`}>
                        +{price.toLocaleString('vi-VN')}đ
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* GHI CHÚ RIÊNG CHO MÓN */}
          <div className="pt-2">
            <label className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2 mb-2">
              <FiEdit3 className="text-slate-400" />
              <span>Ghi Chú Cho Quán</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Không cay, cho nhiều sốt mè..."
              maxLength={100}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 transition"
            />
          </div>

          {/* BỘ ĐẾM SỐ LƯỢNG VÀ NÚT BẤM MUA */}
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Stepper số lượng */}
            <div className="flex items-center justify-between bg-slate-100 rounded-2xl p-1 shrink-0 h-14 w-full sm:w-36">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-12 h-full rounded-xl bg-white text-slate-700 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center transition shadow-xs cursor-pointer"
              >
                <FiMinus className="w-4 h-4" />
              </button>
              <span className="font-black text-slate-800 text-lg">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(q => q + 1)}
                className="w-12 h-full rounded-xl bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center transition shadow-xs cursor-pointer"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>

            {/* Nút thêm vào giỏ hàng */}
            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-between bg-gradient-to-r from-sky-500 to-sky-600 text-white font-extrabold py-4 px-6 rounded-2xl hover:from-sky-600 hover:to-sky-700 transition duration-300 text-base shadow-lg shadow-sky-500/25 active:scale-[0.99] cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FiShoppingCart className="w-5 h-5" />
                <span>Thêm vào giỏ</span>
              </span>
              <span className="font-black text-lg">
                {totalPrice.toLocaleString('vi-VN')}đ
              </span>
            </button>

            {/* Nút viết đánh giá */}
            <button
              onClick={() => handleOpenReviewModal(product)}
              className="flex items-center justify-center bg-white border-2 border-sky-500 text-sky-500 font-bold p-4 rounded-2xl hover:bg-sky-50 transition-all duration-300 shadow-sm shrink-0 cursor-pointer"
              title="Viết đánh giá"
            >
              <FiEdit size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* Phần sản phẩm liên quan */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 pt-10 border-t">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Có thể bạn cũng thích</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map((relatedProduct) => (
              <div key={relatedProduct._id} className="product-card bg-white p-5 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 flex flex-col group">
                <Link to={`/product/${relatedProduct._id}`} className="w-full aspect-square bg-slate-50 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                  <img 
                    src={`${getImageUrl(relatedProduct.image)}`} 
                    alt={relatedProduct.name} 
                    className="product-image w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                </Link>
                <Link to={`/product/${relatedProduct._id}`}>
                  <h3 className="text-lg font-bold text-slate-800 text-center mb-2 group-hover:text-sky-500 transition line-clamp-2 min-h-[56px] flex items-center justify-center">
                    {relatedProduct.name}
                  </h3>
                </Link>
                <div className="flex items-center justify-center gap-2 mb-2 text-sm">
                  <StarRating rating={relatedProduct.averageRating} />
                  <span className="text-gray-500">({relatedProduct.numReviews || 0})</span>
                </div>
                <div className="text-center mb-5 mt-auto">
                  <span className="text-2xl font-black text-sky-500">{relatedProduct.price?.toLocaleString('vi-VN') || '0'}đ</span>
                </div>
                <button 
                  onClick={(e) => handleAddToCart(relatedProduct, e)}
                  className="w-full bg-sky-500 text-white font-bold py-3 rounded-xl hover:bg-sky-600 transition duration-300 text-sm"
                >
                  Thêm vào giỏ
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phần đánh giá của khách hàng */}
      <div className="mt-16 pt-10 border-t">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Đánh giá từ khách hàng</h2>
        </div>
        {product.reviews && product.reviews.filter(r => !r.isHidden || (userInfo && (userInfo.role === 'admin' || userInfo.role === 'staff'))).length > 0 ? (
          <div className="space-y-8">
            {product.reviews
              .filter(r => !r.isHidden || (userInfo && (userInfo.role === 'admin' || userInfo.role === 'staff')))
              .sort((a, b) => {
                  if (a.isPinned && !b.isPinned) return -1;
                  if (!a.isPinned && b.isPinned) return 1;
                  return new Date(b.createdAt) - new Date(a.createdAt);
              })
              .map((review) => {
                const displayAvatar = (review.user && review.user.avatar) ? review.user.avatar : review.avatar;
                
                return (
              <div key={review._id} className={`p-6 rounded-xl shadow-sm border transition-all ${review.isHidden ? 'bg-slate-100 opacity-70' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-sky-100 flex items-center justify-center border border-sky-200">
                      {displayAvatar ? (
                        <img src={displayAvatar} alt={review.name} className={`w-full h-full object-cover ${review.isHidden ? 'grayscale' : ''}`} />
                      ) : (
                        <span className="text-sky-500 font-bold">{review.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-800 flex items-center gap-1">
                          {review.name}
                          {review.isPinned && <TbPinFilled className="text-amber-500" size={16} title="Bình luận được ghim" />}
                        </h4>
                        {review.isHidden && (
                          <span className="text-[10px] bg-slate-300 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Đã ẩn</span>
                        )}
                      </div>
                      <div className="flex items-center mt-1">
                        <StarRating rating={review.rating} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                    {userInfo && (userInfo.role === 'admin' || userInfo.role === 'staff') && (
                      <button 
                          onClick={() => toggleHideReview(review._id)}
                          className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 transition-colors ${review.isHidden ? 'bg-sky-100 text-sky-600 hover:bg-sky-200' : 'bg-slate-200 text-slate-500 hover:bg-rose-100 hover:text-rose-600'}`}
                      >
                          {review.isHidden ? <FiEye size={12}/> : <FiEyeOff size={12}/>}
                          {review.isHidden ? 'Khôi phục' : 'Ẩn'}
                      </button>
                    )}
                  </div>
                </div>
                <p className={`${review.isHidden ? 'text-slate-500 italic' : 'text-gray-600'} mt-3 ml-[52px]`}>{review.comment}</p>
              </div>
              )})}
          </div>
        ) : (
          <p className="text-gray-500">Chưa có đánh giá nào cho sản phẩm này.</p>
        )}
      </div>

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
  );
};

export default ProductDetail;