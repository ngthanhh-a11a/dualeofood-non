import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // Import Link
import { useDispatch } from 'react-redux';
import axios, { SERVER_URL , getImageUrl } from '../../utils/axiosConfig';
import { addToCart } from '../../redux/cartSlice';
import toast from 'react-hot-toast';
import { FiStar, FiShoppingCart, FiArrowLeft, FiEdit, FiEye, FiEyeOff } from 'react-icons/fi'; // Import FiShoppingCart
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

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/products/${id}`);
      setProduct(data);
      setError('');

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

  const handleAddToCart = (productToAdd, event) => {
    dispatch(addToCart({
      id: productToAdd._id,
      name: productToAdd.name,
      price: productToAdd.price,
      image: productToAdd.image,
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

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Nút quay lại */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 font-semibold hover:text-sky-500 transition-colors"
        >
          <FiArrowLeft />
          Quay lại
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Cột ảnh sản phẩm */}
        <div className="bg-gray-100 rounded-2xl p-8">
          <img
            id="product-detail-image" // Thêm ID để JS có thể tìm thấy
            src={`${getImageUrl(product.image)}`}
            alt={product.name}
            className="w-full h-auto object-cover rounded-lg shadow-lg"
          />
        </div>

        {/* Cột thông tin sản phẩm */}
        <div>
          <h1 className="text-4xl font-extrabold text-gray-800 mb-4">{product.name}</h1>
          
          {/* Đánh giá */}
          <div className="flex items-center gap-4 mb-6">
            <StarRating rating={product.averageRating} />
            <span className="text-gray-600 font-medium">
              ({product.numReviews} đánh giá)
            </span>
          </div>

          <p className="text-gray-600 text-lg mb-6">{product.description}</p>

          <div className="text-4xl font-black text-sky-500 mb-8">
            {(product.price || 0).toLocaleString('vi-VN')}đ
          </div>

          <div className="flex items-stretch gap-4 mb-8">
            <button
              onClick={(e) => handleAddToCart(product, e)}
              className="flex-1 flex items-center justify-center gap-3 bg-sky-500 text-white font-bold py-4 px-8 rounded-xl hover:bg-sky-600 transition duration-300 text-lg shadow-md"
            >
              <FiShoppingCart />
              Thêm vào giỏ hàng
            </button>
            <button
              onClick={() => handleOpenReviewModal(product)}
              className="flex items-center justify-center bg-white border-2 border-sky-500 text-sky-500 font-bold p-4 rounded-xl hover:bg-sky-50 transition-all duration-300 shadow-md transform hover:scale-105 hover:shadow-lg"
              title="Viết đánh giá"
            >
              <FiEdit size={24} />
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
              .slice(0).reverse().map((review) => {
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
                        <h4 className="font-bold text-gray-800">{review.name}</h4>
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