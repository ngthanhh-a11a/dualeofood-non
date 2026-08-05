import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addToCart } from '../../redux/cartSlice';
import axios, { SERVER_URL , getImageUrl } from '../../utils/axiosConfig';
import StarRating from '../../components/common/StarRating';
import ReviewModal from '../../components/features/ReviewModal';
import toast from 'react-hot-toast';
import { useAddToCartAnimation } from '../../hooks/useAddToCartAnimation';
import { FiSearch, FiChevronDown, FiShoppingBag } from 'react-icons/fi';

// Component Card sản phẩm
const ProductCard = ({ product, onAddToCart, onProductClick, delay }) => (
  <div 
    className="product-card group bg-white rounded-2xl md:rounded-[2rem] p-3 md:p-4 shadow-sm hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-shadow duration-300 md:duration-500 border border-gray-100/50 flex flex-row md:flex-col items-center md:items-stretch gap-4 md:gap-0 opacity-0 animate-fade-in-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div 
      className="relative w-24 h-24 md:w-full md:h-auto md:aspect-square flex-shrink-0 rounded-xl md:rounded-[1.5rem] md:mb-4 bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer"
      onClick={() => onProductClick(product._id)}
    >
      {product.image ? (
        <img src={`${getImageUrl(product.image)}`} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 ease-out md:group-hover:scale-110" />
      ) : (
        <span className="text-4xl md:text-6xl">🍔</span>
      )}
      {/* Overlay gradient tinh tế khi hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 hidden md:block"></div>
    </div>
    
    <div className="flex-1 flex flex-col px-0 md:px-2 min-w-0">
      <h3 
        className="text-[1rem] md:text-[1.1rem] font-bold text-slate-800 mb-1 group-hover:text-orange-500 transition-colors truncate md:whitespace-normal md:line-clamp-2 cursor-pointer leading-tight"
        onClick={() => onProductClick(product._id)}
      >
        {product.name}
      </h3>
      
      <div className="flex items-center gap-1.5 mb-1.5 md:mb-4 text-sm md:mt-1">
        <StarRating rating={product.averageRating} size={12} />
        <span className="text-gray-400 font-medium text-[11px] md:text-xs">({product.numReviews || 0})</span>
      </div>

      <div className="flex items-center justify-between mt-auto pt-1 md:pt-2">
        <span className="text-[1.1rem] md:text-xl font-black text-slate-800">
          {product.price?.toLocaleString('vi-VN') || '0'}<span className="text-[10px] md:text-sm font-bold text-orange-500 ml-1">đ</span>
        </span>
        <button 
          onClick={(e) => onAddToCart(product, e)}
          className="w-8 h-8 md:w-12 md:h-12 shrink-0 bg-gradient-to-r from-sky-400 to-sky-600 text-white rounded-lg md:rounded-2xl flex items-center justify-center hover:shadow-lg hover:shadow-sky-500/30 md:hover:-translate-y-1 transition-all duration-300 group/btn relative overflow-hidden shadow-sm"
        >
           <FiShoppingBag className="w-4 h-4 md:w-5 md:h-5 relative z-10" />
           <div className="absolute inset-0 bg-white/20 translate-y-full md:group-hover/btn:translate-y-0 transition-transform duration-300 hidden md:block"></div>
        </button>
      </div>
    </div>
  </div>
);

// Component Skeleton Loading
const ProductCardSkeleton = () => (
  <div className="flex flex-row md:flex-col gap-4 md:gap-0 p-3 md:p-4 bg-white rounded-2xl md:rounded-[2rem] shadow-sm border border-gray-100">
      <div className="w-24 h-24 md:w-full md:h-auto md:aspect-square flex-shrink-0 bg-gray-100 rounded-xl md:rounded-[1.5rem] md:mb-4 animate-pulse"></div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-5 bg-gray-100 rounded-lg w-3/4 mb-3 animate-pulse"></div>
        <div className="h-4 bg-gray-100 rounded-lg w-1/3 mb-4 md:mb-6 animate-pulse"></div>
        <div className="flex justify-between items-center mt-auto">
           <div className="h-6 bg-gray-100 rounded-lg w-1/3 animate-pulse"></div>
           <div className="w-8 h-8 md:w-12 md:h-12 bg-gray-100 rounded-lg md:rounded-2xl animate-pulse"></div>
        </div>
      </div>
  </div>
);

const Menu = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { flyToCart } = useAddToCartAnimation();

  // Component State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [productToReview, setProductToReview] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  // State for sort dropdown
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);

  // State for category dropdown
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);
  
  // Derived state from URL for controlled components
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  // Fetch categories & user info
  useEffect(() => {
    const fetchCategories = async () => {
        try {
            const { data } = await axios.get('/categories');
            setCategories(data);
        } catch (error) {
            console.error("Lỗi khi tải danh mục:", error);
            toast.error("Không thể tải danh mục.");
        }
    };
    fetchCategories();

    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      try {
        setUserInfo(JSON.parse(storedUserInfo));
      } catch (e) {}
    }
  }, []);

  // Click outside handler for sort & category dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(searchParams);
        params.set('limit', '8'); // Đặt limit là 8 để dễ thấy phân trang hơn
        
        const { data } = await axios.get(`/products?${params.toString()}`);
        setProducts(data.products);
        setPagination({ currentPage: data.currentPage, totalPages: data.totalPages });
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu món ăn:', error);
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };
    fetchProducts();
  }, [searchParams]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      const currentSearch = searchParams.get('search') || '';
      if (searchTerm !== currentSearch) {
        if (searchTerm) {
          searchParams.set('search', searchTerm);
        } else {
          searchParams.delete('search');
        }
        searchParams.set('page', '1');
        setSearchParams(searchParams);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, searchParams, setSearchParams]);

  // Handlers
  const handleCategorySelect = (categorySlug) => {
    if (searchParams.get('category') === categorySlug) return;
    searchParams.set('category', categorySlug);
    searchParams.set('page', '1');
    setSearchParams(searchParams);
    setIsCategoryDropdownOpen(false);
  };

  const handleSortChange = (value) => {
    searchParams.set('sortBy', value);
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const handlePageChange = (newPage) => {
    searchParams.set('page', newPage);
    setSearchParams(searchParams);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleAddToCart = (product, event) => {
    dispatch(addToCart({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
    }));
    flyToCart(event);
  };

  const handleReviewSubmitted = () => {
    setIsReviewModalOpen(false);
    setProductToReview(null);
    toast.success('Cảm ơn bạn! Đang cập nhật lại thực đơn...');
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('t', Date.now());
    setSearchParams(newSearchParams);
  };

  const selectedCategory = searchParams.get('category') || 'all';
  const sortBy = searchParams.get('sortBy') || 'createdAt_desc';

  const sortOptions = [
    { value: 'createdAt_desc', text: 'Mới nhất' },
    { value: 'price_asc', text: 'Giá tăng dần' },
    { value: 'price_desc', text: 'Giá giảm dần' },
    { value: 'name_asc', text: 'Tên (A-Z)' },
  ];

  return (
    <div className="font-sans mb-20 bg-slate-50 min-h-screen pb-12">
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translate3d(0, 30px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .animate-fade-in-up { 
          animation: fade-in-up 0.5s ease-out forwards; 
          will-change: transform, opacity;
        }
        
        /* Ẩn scrollbar cho category pills */
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Hero Banner Cao Cấp */}
      <div className="container mx-auto px-4 lg:px-8 mt-2">
        <div 
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1887&auto=format&fit=crop')` }}
          className="bg-cover bg-center h-[200px] md:h-[380px] text-center relative overflow-hidden rounded-[2rem] shadow-xl"
        >
          {/* Gradient Mesh Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-900/70 via-black/40 to-black/60"></div>
          
          <div className="relative z-10 flex flex-col items-center justify-center h-full pt-10 px-4">
            <span className="text-sky-300 font-bold tracking-widest text-xs md:text-sm uppercase mb-1 md:mb-3 animate-fade-in-up">Taste the Difference</span>
            <h1 className="text-3xl md:text-6xl font-black text-white mb-2 md:mb-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Thực Đơn <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-sky-300">DualeoFood</span>
            </h1>
            <p className="text-gray-200 mt-1 md:mt-2 text-sm md:text-lg max-w-xl mx-auto animate-fade-in-up hidden md:block" style={{ animationDelay: '200ms' }}>
              Tinh hoa ẩm thực hội tụ trong từng món ăn. Nóng hổi, đậm vị và ngập tràn cảm hứng.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-20 -mt-16"> 
        {/* Glassmorphism Search & Filters Bar */}
        <div className="relative z-50 bg-white/80 backdrop-blur-xl p-4 sm:p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50 mb-10 flex flex-col lg:flex-row gap-4 items-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          
          {/* Search Input */}
          <div className="relative w-full lg:w-1/3">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
              <FiSearch className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Tìm món ăn yêu thích..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-[1.5rem] bg-gray-100/50 border border-transparent focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-300 text-[15px] font-medium placeholder-gray-400"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative w-full lg:w-56 shrink-0" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="flex items-center justify-between w-full bg-gray-100/50 hover:bg-gray-200/50 rounded-[1.5rem] px-5 py-3.5 font-bold text-[15px] text-gray-700 transition-all duration-300"
            >
              <span className="flex items-center gap-2 truncate">
                <span className="text-lg">{categories.find(c => c.slug === selectedCategory)?.image || '🍽️'}</span>
                <span>{categories.find(c => c.slug === selectedCategory)?.name || 'Tất cả'}</span>
              </span>
              <FiChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCategoryDropdownOpen && (
              <div className="absolute z-30 top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.1)] border border-gray-100 overflow-hidden py-2 animate-fade-in-up">
                <div className="max-h-72 overflow-y-auto hide-scrollbar">
                  <div
                    onClick={() => handleCategorySelect('all')}
                    className={`flex items-center gap-3 px-5 py-3 cursor-pointer font-semibold transition-colors text-[15px] ${
                      selectedCategory === 'all' ? 'bg-sky-50 text-sky-600' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">🍽️</span> Tất cả
                  </div>
                  {categories.map(cat => (
                    <div
                      key={cat._id}
                      onClick={() => handleCategorySelect(cat.slug)}
                      className={`flex items-center gap-3 px-5 py-3 cursor-pointer font-semibold transition-colors text-[15px] ${
                        selectedCategory === cat.slug ? 'bg-sky-50 text-sky-600' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{cat.image}</span> {cat.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative w-full lg:w-48 shrink-0" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="flex items-center justify-between w-full bg-gray-100/50 hover:bg-gray-200/50 rounded-[1.5rem] px-5 py-3.5 font-bold text-[15px] text-gray-700 transition-all duration-300"
            >
              <span className="truncate">{sortOptions.find(opt => opt.value === sortBy)?.text || 'Sắp xếp'}</span>
              <FiChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSortDropdownOpen && (
              <div className="absolute z-30 top-full right-0 mt-2 w-full bg-white rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.1)] border border-gray-100 overflow-hidden py-2 animate-fade-in-up">
                {sortOptions.map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => {
                      handleSortChange(opt.value);
                      setIsSortDropdownOpen(false);
                    }}
                    className={`px-5 py-3 cursor-pointer font-semibold transition-colors text-[15px] ${
                      sortBy === opt.value ? 'bg-sky-50 text-sky-600' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {opt.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 xl:gap-8">
            {Array.from({ length: 8 }).map((_, index) => <ProductCardSkeleton key={index} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[2rem] shadow-sm border border-gray-100">
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy món ăn</h3>
            <p className="text-gray-500 text-lg">
              {searchTerm ? `Chúng tôi không tìm thấy kết quả nào cho "${searchTerm}"` : "Thực đơn hiện đang trống."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 xl:gap-8">
            {products.map((product, index) => (
              <ProductCard 
                key={product._id} 
                product={product}
                onAddToCart={handleAddToCart}
                onProductClick={(id) => navigate(`/product/${id}`)}
                delay={index * 50} // Staggered animation delay
              />
            ))}
          </div>
        )}

        {/* Pagination Modern */}
        {pagination.totalPages > 1 && (
          <div className="mt-14 flex justify-center items-center gap-3">
            <button 
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-600 hover:border-sky-500 hover:text-sky-500 disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: pagination.totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full font-bold transition-all ${
                    pagination.currentPage === i + 1 
                      ? 'bg-gradient-to-r from-sky-400 to-sky-600 text-white shadow-md' 
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-sky-500 hover:text-sky-500'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button 
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-600 hover:border-sky-500 hover:text-sky-500 disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
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

export default Menu;