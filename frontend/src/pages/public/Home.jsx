import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/cartSlice';
import axios, { SERVER_URL , getImageUrl } from '../../utils/axiosConfig';
import { Link, useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import { FiStar, FiEdit } from 'react-icons/fi';
import ReviewModal from '../../components/features/ReviewModal';
import toast from 'react-hot-toast';
import StarRating from '../../components/common/StarRating'; // Import component
import { useConfetti } from '../../hooks/useConfetti';
import PromotionalBanner from '../../components/features/PromotionalBanner'; // Import component banner
import { useAddToCartAnimation } from '../../hooks/useAddToCartAnimation'; // Import hook animation

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // 2. Initialize navigate
  const { fireFromElement, fireJackpot } = useConfetti();
  const { flyToCart } = useAddToCartAnimation(); // Khởi tạo hook animation

  // States để quản lý modal đánh giá
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [productToReview, setProductToReview] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  // State to store the list of products from the DB
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]); // State để lưu danh sách danh mục
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // States for the search feature
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // State to store the selected category

  // State and Ref for scroll animations
  const [visibleSections, setVisibleSections] = useState({
    banner: false,
    features: false,
    menuSection: false,
    menuItems: false, // State độc lập dành riêng cho việc load lại danh sách món ăn
    promoBanner: false, // State cho banner khuyến mãi
    promo: false
  });
  const [clickedFeatures, setClickedFeatures] = useState(new Set());
  const [showJackpotModal, setShowJackpotModal] = useState(false);

  const bannerRef = useRef(null);
  const featuresRef = useRef(null);
  const menuSectionRef = useRef(null);
  const promoRef = useRef(null);
  const promoBannerRef = useRef(null); // Ref cho banner khuyến mãi

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = entry.target.getAttribute('data-section');
            if (section) {
              setVisibleSections((prev) => ({ 
                ...prev, 
                [section]: true,
                ...(section === 'menuSection' ? { menuItems: true } : {}) // Trigger menu items along with the menu section
              }));
              observer.unobserve(entry.target); // Stop observing once visible
            }
          }
        });
      },
      { threshold: 0.1 } // Trigger when 10% of the element is visible
    );

    if (bannerRef.current) observer.observe(bannerRef.current);
    if (featuresRef.current) observer.observe(featuresRef.current);
    if (menuSectionRef.current) observer.observe(menuSectionRef.current);
    if (promoRef.current) observer.observe(promoRef.current);
    if (promoBannerRef.current) observer.observe(promoBannerRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Get the first page of products
      const response = await axios.get('/products/pinned/all'); // Get 12 products for the homepage
      // Assign only the products array from the returned object
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching product data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Call API as soon as the page loads
  useEffect(() => {
    fetchProducts();

    const fetchBanners = async () => {
      try {
        const bannerRes = await axios.get('/banners');
        setBanners(bannerRes.data);
      } catch (error) {
        console.error('Lỗi khi tải banner:', error);
      }
    };
    fetchBanners();

    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      try {
        setUserInfo(JSON.parse(storedUserInfo));
      } catch (e) {
        console.error("Lỗi parse thông tin người dùng:", e);
      }
    }
  }, []);

  // Lấy danh sách danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get('/categories');
        setCategories(data);
      } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
      }
    };
    fetchCategories();
  }, []);

  // Đổi banner tự động
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  // Handle clicks outside to close search suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddToCart = (product, event) => {
    // Dispatch action to Redux as before
    dispatch(addToCart({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.image, // Also save the image to Redux
    }));

    // Kích hoạt animation từ hook
    flyToCart(event);
  };

  const handleOpenReviewModal = (product) => {
    if (!userInfo) {
      navigate('/login', { state: { message: 'Vui lòng đăng nhập để đánh giá sản phẩm!' } });
      return;
    }
    setProductToReview({
      ...product,
      image: `${getImageUrl(product.image)}`
    });
    setIsReviewModalOpen(true);
  }

  const handleReviewSubmitted = () => {
    setIsReviewModalOpen(false);
    setProductToReview(null);
    toast.success('Cảm ơn bạn! Đang cập nhật lại danh sách...');
    setTimeout(() => {
      // Tải lại dữ liệu sản phẩm để cập nhật số sao và lượt đánh giá
      fetchProducts();
    }, 500);
  };

  // Filter product list by search term AND category
  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchCategory = selectedCategory === 'ALL' || 
                          product.category?.slug === selectedCategory;
                          
    return matchSearch && matchCategory;
  }) : [];

  // Shared function to re-trigger the slide animation
  const triggerMenuAnimation = () => {
    setVisibleSections(prev => ({ ...prev, menuItems: false }));
    setTimeout(() => {
      setVisibleSections(prev => ({ ...prev, menuItems: true }));
    }, 50);
  };

  // Handler for category selection to re-run the animation
  const handleCategoryChange = (categorySlug) => {
    if (selectedCategory === categorySlug) return;
    setSelectedCategory(categorySlug);
    
    triggerMenuAnimation();
  };

  // 3. Handler for when the user performs a search
  const handleSearchSubmit = (e) => {
    e.preventDefault(); // Prevent form submission and page reload
    if (searchTerm.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Hàm xử lý khi click vào box tính năng (Easter Egg)
  const handleFeatureBoxClick = (event, index) => {
    if (clickedFeatures.has(index)) {
      fireFromElement(event.currentTarget);
      return;
    }

    const newClicked = new Set(clickedFeatures);
    newClicked.add(index);
    setClickedFeatures(newClicked);

    if (newClicked.size === 3) {
      fireJackpot();
      setTimeout(() => setShowJackpotModal(true), 1500); // Đợi pháo hoa nổ xong mới hiện Modal
    } else {
      const colorMap = {
        0: ['#38bdf8', '#0284c7', '#ffffff'], // Xanh
        1: ['#4ade80', '#16a34a', '#ffffff'], // Xanh lá
        2: ['#f472b6', '#db2777', '#ffffff'], // Hồng
      };
      fireFromElement(event.currentTarget, colorMap[index]);
    }
  };

  return (
    <div className="font-sans">
      {/* CSS cho hiệu ứng animation */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(-5deg); }
        }
        .animate-float-1 { animation: float 6s ease-in-out infinite; }
        .animate-float-2 { animation: float 7s ease-in-out infinite 1s; }
        .animate-float-3 { animation: float 8s ease-in-out infinite 0.5s; }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }

        @keyframes pop-in {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-pop-in { animation: pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
      
      {/* ================= SECTION 1: HERO BANNER (NEW DESIGN) ================= */}
      <section 
        ref={bannerRef}
        data-section="banner"
        className={`relative w-full ${banners.length > 0 ? '' : 'py-20 md:py-32'} overflow-hidden rounded-3xl mb-24 bg-gradient-to-br from-sky-100 via-blue-50 to-white transition-all duration-1000 transform ${visibleSections.banner ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
      >
        {banners.length > 0 ? (
           <div className="relative w-full aspect-[4/3] md:aspect-[21/9] max-h-[600px]">
              {banners.map((banner, index) => (
                 <div key={banner._id} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10 flex items-center justify-center flex-col p-6">
                        <h2 className="text-white text-3xl md:text-5xl lg:text-6xl font-black drop-shadow-xl text-center mb-6 max-w-4xl">{banner.title}</h2>
                        {banner.linkUrl && (
                           <Link to={banner.linkUrl} className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-transform">Khám Phá Ngay</Link>
                        )}
                    </div>
                 </div>
              ))}
              {/* Dots */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
                 {banners.map((_, idx) => (
                    <button key={idx} onClick={() => setCurrentBannerIndex(idx)} className={`w-3 h-3 rounded-full transition-colors ${idx === currentBannerIndex ? 'bg-sky-500' : 'bg-white/50'}`}></button>
                 ))}
              </div>
           </div>
        ) : (
          <>
          {/* Floating Images */}
          <div className="absolute inset-0 z-0 opacity-40 md:opacity-100">
            <img 
              src="https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=1000&auto=format&fit=crop" 
              alt="Floating Burger Combo" 
              className="absolute w-48 md:w-80 top-10 left-5 md:left-20 rounded-3xl shadow-xl animate-float-1"
            />
            <img 
              src="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=1000&auto=format&fit=crop" 
              alt="Floating Fried Chicken" 
              className="absolute w-40 md:w-64 bottom-5 right-5 md:right-20 rounded-3xl shadow-xl animate-float-2"
            />
            <img 
              src="https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=1000&auto=format&fit=crop"
              alt="Floating Burger" 
              className="absolute w-32 md:w-56 top-1/4 right-1/4 rounded-full shadow-xl animate-float-3"
            />
            <div className="absolute w-16 h-16 bg-sky-200/50 rounded-full bottom-1/4 left-1/4 blur-lg animate-float-2"></div>
            <div className="absolute w-24 h-24 bg-orange-200/50 rounded-full top-1/3 right-1/3 blur-xl animate-float-3"></div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-6 relative z-10 text-center">
            <h1 className="text-3xl md:text-6xl lg:text-7xl font-black text-amber-500 tracking-tight drop-shadow-sm mb-4 md:mb-6 animate-fade-in-up" style={{animationDelay: '100ms'}}
            >
              Nếm Thử Sự Khác Biệt, <br/> Cảm Nhận <span className="text-sky-500">Niềm Vui</span>.
            </h1>
            <p className="text-gray-600 text-base md:text-xl max-w-2xl mx-auto mb-6 md:mb-10 animate-fade-in-up" style={{animationDelay: '200ms'}}>
              Trải nghiệm nghệ thuật hương vị với thịt bò nướng mọng nước, gà rán giòn tan và những nguyên liệu tươi ngon nhất, tất cả được chế biến bằng cả đam mê.
            </p>
            <Link 
              to="/menu" 
              className="inline-block bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-12 rounded-xl shadow-lg shadow-sky-500/30 transition duration-300 hover:scale-105 animate-fade-in-up"
              style={{animationDelay: '300ms'}}
            >
              Khám Phá Thực Đơn
            </Link>
          </div>
          </>
        )}
      </section>

      {/* ================= SECTION 1.5: SERVICE ADVANTAGES ================= */}
      <section ref={featuresRef} data-section="features" className="py-24 md:py-32 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4"
            >
              Một Trải Nghiệm Khó Quên
            </h2>
            <p className="text-gray-600 text-lg">
              Chúng tôi cam kết mang đến không chỉ một bữa ăn, mà là một khoảnh khắc đáng nhớ dành cho bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🛵', title: 'Giao Hàng Siêu Tốc', desc: 'Nóng hổi và tươi ngon tận cửa nhà bạn chỉ trong 30 phút.' },
              { icon: '🥩', title: '100% Nguyên Liệu Tươi', desc: 'Được lấy hàng ngày từ các đối tác địa phương tin cậy.' },
              { icon: '💝', title: 'Chế Biến Bằng Đam Mê', desc: 'Mỗi món ăn là một tác phẩm nghệ thuật, được chuẩn bị bằng cả tình yêu.' }
            ].map((feature, index) => (
              <div 
                key={index} 
                className={`bg-white p-8 rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] active:scale-95 hover:-translate-y-2 transition-all duration-300 text-center transform cursor-pointer select-none ${visibleSections.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'} ${clickedFeatures.has(index) ? 'border-2 border-orange-400/50' : 'border-2 border-transparent'}`}
                style={{ transitionDelay: `${index * 150}ms` }}
                onClick={(e) => handleFeatureBoxClick(e, index)}
              >
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <span className="text-4xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SECTION 2: ON SALE ================= */}
      {/* Scrollbar Hide Styling */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <section 
        ref={menuSectionRef}
        data-section="menuSection"
        className="container mx-auto px-4 mb-24" // Increased bottom margin
      >
        <div className="flex flex-col md:flex-row gap-8">
          
          <div className="w-full md:w-1/4">
            {/* Desktop Categories: Vertical Sidebar */}
            <div className={`hidden md:block bg-white p-6 rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.05)] border border-slate-100/80 sticky top-28 transition-all duration-1000 transform ${visibleSections.menuSection ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-16'}`}
            >
              <h2 className="text-xl font-black text-slate-800 mb-4 border-b border-slate-100 pb-4">DANH MỤC</h2>
              <ul className="space-y-2 font-bold">
                <li 
                  key="ALL"
                  onClick={() => handleCategoryChange('ALL')}
                  className={`cursor-pointer flex items-center gap-4 px-4 py-3 rounded-xl transition duration-300 ${
                    selectedCategory === 'ALL'
                      ? 'bg-sky-500 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-sky-500'
                  }`}
                >
                  <span className="text-xl">🍽️</span> Tất Cả Món
                </li>
                {categories.map(cat => (
                  <li 
                    key={cat._id}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={`cursor-pointer flex items-center gap-4 px-4 py-3 rounded-xl transition duration-300 ${
                      selectedCategory === cat.slug
                        ? 'bg-sky-500 text-white shadow-lg'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-sky-500'
                    }`}
                  >
                    <span className="text-xl">{cat.image || '🍽️'}</span> {cat.name}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Mobile Categories: Horizontal Scroll */}
            <div className="block md:hidden mb-6">
              <ul className="flex flex-row items-center gap-3 overflow-x-auto no-scrollbar snap-x">
              <li 
                  key="ALL"
                  onClick={() => handleCategoryChange('ALL')}
                  className={`snap-start flex-shrink-0 cursor-pointer flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-colors duration-300 w-24 h-24 border-2 ${
                    selectedCategory === 'ALL'
                      ? 'bg-sky-500 text-white border-sky-500'
                      : 'bg-white text-slate-600 border-slate-100'
                  }`}
                >
                  <span className="text-3xl">🍽️</span> 
                  <span className="text-xs font-bold text-center">Tất Cả</span>
                </li>
                {categories.map(cat => (
                  <li 
                    key={cat._id}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={`snap-start flex-shrink-0 cursor-pointer flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-colors duration-300 w-24 h-24 border-2 ${
                      selectedCategory === cat.slug
                        ? 'bg-sky-500 text-white border-sky-500'
                        : 'bg-white text-slate-600 border-slate-100'
                    }`}
                  >
                    <span className="text-3xl">{cat.image || '🍽️'}</span> 
                    <span className="text-xs font-bold text-center">{cat.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="w-full md:w-3/4">
            <h2 className="text-3xl font-black text-slate-800 mb-6 uppercase flex items-center gap-2"
            >
              🔥 Thực Đơn Hôm Nay
            </h2>
            
            <form onSubmit={handleSearchSubmit} className="mb-8 relative" ref={searchRef}>
                <input
                  type="text"
                  placeholder="Tìm kiếm món ăn (VD: Burger...)"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full pl-14 pr-4 py-5 rounded-3xl border border-slate-200 shadow-lg shadow-black/5 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition text-md font-medium"
                />
                <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-2xl">🔍</span>
                
                {showSuggestions && searchTerm && (
                  <div className="absolute z-20 w-full bg-white mt-2 rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-80 overflow-y-auto">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.slice(0, 5).map(product => (
                        <div 
                          key={product._id} 
                          onClick={() => {
                            navigate(`/menu?search=${encodeURIComponent(product.name)}`);
                          }}
                          className="flex items-center gap-4 p-3 hover:bg-slate-50 cursor-pointer border-b border-gray-50 last:border-0 transition"
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                            {product.image ? (
                               <img src={`${getImageUrl(product.image)}`} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-lg">🍽️</div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-sm" dangerouslySetInnerHTML={{ __html: product.name.replace(new RegExp(searchTerm, "gi"), (match) => `<mark class="bg-yellow-200 rounded">${match}</mark>`) }}></h4>
                            <p className="text-sky-600 font-semibold text-xs">{product.price?.toLocaleString('vi-VN')}đ</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Không có gợi ý cho "{searchTerm}"
                      </div>
                    )}
                  </div>
                )}
            </form>

            {loading ? (
              <div className="flex justify-center items-center py-20 text-zinc-500 font-bold"
              >
                Đang tải dữ liệu từ Server...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                {searchTerm ? `Không tìm thấy món "${searchTerm}".` : 'Chưa có món ăn nào trong hệ thống.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
                {filteredProducts.map((product, index) => (
                  <div 
                    key={product._id}
                    className={`product-card bg-white p-3 md:p-5 rounded-2xl md:rounded-3xl shadow-sm md:shadow-[0_4px_16px_rgba(0,0,0,0.05)] md:hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] md:hover:-translate-y-2 transition-all duration-300 md:duration-500 border border-slate-100/80 flex flex-row md:flex-col items-center md:items-stretch gap-4 md:gap-0 group transform ${
                      visibleSections.menuItems ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 md:translate-y-16'
                    }`}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    
                    <div className="w-24 h-24 md:w-full md:h-auto md:aspect-square flex-shrink-0 bg-slate-50 rounded-xl md:rounded-2xl md:mb-4 flex items-center justify-center overflow-hidden relative">
                      {product.image ? (
                        <img src={`${getImageUrl(product.image)}`} alt={product.name} className="product-image w-full h-full object-cover transition-transform duration-500 md:group-hover:scale-110" />
                      ) : (
                        <span className="text-4xl md:text-6xl">🍔</span>
                      )}
                    </div>
                    
                    <div className="flex flex-col flex-1 h-full py-1 md:py-0 min-w-0">
                      <h3 className="text-[1rem] md:text-lg font-bold text-slate-800 md:text-center mb-1 md:mb-2 group-hover:text-sky-500 transition truncate md:whitespace-normal md:line-clamp-2 md:min-h-[56px] flex items-center md:justify-center">
                        {product.name}
                      </h3>
                      
                      {/* Hiển thị sao và số lượt đánh giá */}
                      <div className="flex items-center md:justify-center gap-1.5 mb-1.5 md:mb-2 text-xs md:text-sm">
                        <StarRating rating={product.averageRating} size={14} />
                        <span className="text-gray-500">({product.numReviews || 0})</span>
                      </div>

                      <div className="mb-2 md:mb-5 mt-auto md:mt-0 flex items-center md:block">
                        <span className="text-[1.1rem] md:text-2xl font-black text-sky-500">{product.price?.toLocaleString('vi-VN') || '0'}đ</span>
                      </div>

                      {/* Desktop Buttons Layout */}
                      <div className="w-full items-stretch gap-2 mt-auto hidden md:flex">
                        <button 
                          onClick={(e) => handleAddToCart(product, e)}
                          className="flex-1 bg-sky-500 text-white font-bold py-3 rounded-xl hover:bg-sky-600 transition duration-300 text-sm"
                        >
                          Thêm vào giỏ
                        </button>
                        <button
                          onClick={() => handleOpenReviewModal(product)}
                          className="flex items-center justify-center bg-white border-2 border-sky-500 text-sky-500 font-bold p-3 rounded-xl hover:bg-sky-50 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                          title="Viết đánh giá"
                        >
                          <FiEdit size={20} />
                        </button>
                      </div>

                      {/* Mobile Buttons Layout */}
                      <div className="w-full flex items-center gap-2 mt-auto md:hidden">
                        <button 
                          onClick={(e) => handleAddToCart(product, e)}
                          className="flex-1 bg-sky-500 text-white font-bold py-2 rounded-lg active:bg-sky-600 transition text-xs flex items-center justify-center gap-1 shadow-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                          Thêm
                        </button>
                        <button
                          onClick={() => handleOpenReviewModal(product)}
                          className="flex items-center justify-center bg-white border border-sky-500 text-sky-500 font-bold p-2 rounded-lg active:bg-sky-50 transition"
                          title="Viết đánh giá"
                        >
                          <FiEdit size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= BANNER KHUYẾN MÃI ================= */}
      <section 
        ref={promoBannerRef}
        data-section="promoBanner"
        className={`container mx-auto px-4 mb-24 transition-all duration-1000 transform ${visibleSections.promoBanner ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
        style={{ transitionDelay: '200ms' }}
      >
        <PromotionalBanner />
      </section>

      {/* ================= SECTION 3: APP PROMO ================= */}
      <section 
        ref={promoRef}
        data-section="promo"
        className={`container mx-auto px-4 mb-24 transition-all duration-1000 transform ${visibleSections.promo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
      >
        <div className="bg-sky-600 rounded-[3rem] p-12 md:p-20 text-white flex flex-col md:flex-row items-center justify-between shadow-[0_8px_24px_rgba(0,0,0,0.1)] relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-500/50 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-sky-400/50 opacity-20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="w-full md:w-3/5 relative z-10 text-center md:text-left mb-10 md:mb-0">
            <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight"
            >
              Tải Ứng Dụng Ngay <br/> Nhận Quà Liền Tay!
            </h2>
            <p className="text-sky-100 text-lg md:text-xl mb-10 max-w-lg mx-auto md:mx-0">
              Nhập mã <span className="font-bold text-white bg-sky-500/50 px-3 py-1.5 rounded-lg ml-1 mr-1">NEWAPP50</span> để được giảm ngay 50K cho đơn hàng đầu tiên trên ứng dụng di động.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button className="bg-white hover:bg-sky-100 text-sky-600 font-bold py-4 px-8 rounded-full flex items-center justify-center gap-3 transition transform hover:-translate-y-1 shadow-lg active:scale-95">
                App Store
              </button>
              <button 
                onClick={handleFeatureBoxClick}
                className="bg-white hover:bg-sky-100 text-sky-600 font-bold py-4 px-8 rounded-full flex items-center justify-center gap-3 transition transform hover:-translate-y-1 shadow-lg active:scale-95"
              >
                Google Play
              </button>
            </div>
          </div>
          
          <div className="w-full md:w-2/5 relative z-10 flex justify-center">
            {/* Simple CSS phone screen mockup */}
            <div className="w-64 h-[28rem] bg-slate-800 rounded-[3rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden relative flex flex-col items-center pt-8">
              <div className="w-32 h-6 bg-slate-900 absolute top-0 rounded-b-3xl"></div>
              <div className="text-5xl mb-6 mt-4 animate-bounce">🍔</div>
              <h3 className="text-white font-black text-2xl mb-8">DualeoFood</h3>
              <div className="w-48 h-32 bg-slate-700 rounded-2xl mb-4 animate-pulse"></div>
              <div className="w-48 h-12 bg-sky-500 rounded-full animate-pulse mt-4"></div>
            </div>
          </div>
        </div>
      </section>
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

      {/* Jackpot Modal */}
      {showJackpotModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center relative overflow-hidden animate-pop-in">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-sky-400 to-sky-600 rounded-t-3xl opacity-20"></div>
            <div className="relative z-10">
              <span className="text-6xl block mb-4">🎁</span>
              <h2 className="text-3xl font-black text-slate-800 mb-2">BÙM! Bất ngờ chưa!</h2>
              <p className="text-gray-600 mb-6 text-lg">
                Chúc mừng bạn đã khám phá ra bí mật của DualeoFood. Tặng bạn mã giảm giá 10% cho đơn hàng tiếp theo!
              </p>
              <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-4 mb-6">
                <span className="text-2xl font-bold text-sky-600 tracking-widest">SECRET10</span>
              </div>
              <button 
                onClick={() => setShowJackpotModal(false)}
                className="w-full bg-gradient-to-r from-sky-400 to-sky-600 text-white font-bold py-4 rounded-2xl hover:shadow-lg hover:shadow-sky-500/30 active:scale-95 transition-all"
              >
                Nhận quà & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;