import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import logoImage from '../../assets/logo.png';
import { FiFacebook, FiInstagram, FiTwitter } from 'react-icons/fi';
import axios from '../../utils/axiosConfig';

const Footer = () => {
  const [isVisible, setIsVisible] = useState(false);
  const footerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Chỉ chạy animation 1 lần
        }
      },
      { threshold: 0.1 } // Kích hoạt khi Footer lộ ra 10%
    );

    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  const [storeInfo, setStoreInfo] = useState({
    address: '123 Đường Bánh Mì, Quận Gà Rán, TP. HCM',
    phone: '1900 1234',
    email: 'support@dualeofood.com'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/settings/public');
        if (res.data && res.data.storeInfo) {
          const info = res.data.storeInfo;
          setStoreInfo({
            address: info.address || '123 Đường Bánh Mì, Quận Gà Rán, TP. HCM',
            phone: info.phone || '1900 1234',
            email: info.email || 'support@dualeofood.com'
          });
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin cửa hàng", error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <footer 
      ref={footerRef}
      className={`relative bg-white pt-16 pb-8 border-t border-sky-50 mt-10 transition-all duration-1000 transform overflow-hidden ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
    >
      {/* Đường viền ánh sáng gradient trên đỉnh footer */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-60"></div>
      
      {/* Quầng sáng trang trí nền nhẹ */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-sky-100/40 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-64 h-64 bg-orange-100/30 rounded-full filter blur-[90px] pointer-events-none"></div>

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Cột 1: Thông tin thương hiệu */}
          <div className={`space-y-5 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Link to="/" className="inline-flex items-center gap-2 group">
              <img 
                src={logoImage} 
                alt="DualeoFood Logo" 
                className="w-10 h-10 object-contain group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=DF&background=0EA5E9&color=fff&rounded=true&bold=true"; }}
              />
              <span className="text-2xl font-black bg-gradient-to-r from-sky-500 to-sky-600 bg-clip-text text-transparent tracking-wider">
                DUALEOFOOD
              </span>
            </Link>
            <p className="text-gray-500 leading-relaxed text-sm">
              Đem đến trải nghiệm ẩm thực tuyệt vời với những món ăn chất lượng, giao hàng thần tốc và dịch vụ tận tâm từ trái tim.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Đang mở cửa phục vụ
              </span>
            </div>
          </div>
          
          {/* Cột 2: Khám phá (Liên kết nhanh) */}
          <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h3 className="text-base font-black text-gray-800 uppercase tracking-wider mb-2">Khám Phá</h3>
            <div className="w-8 h-1 bg-gradient-to-r from-sky-400 to-sky-600 rounded-full mb-5"></div>
            <ul className="space-y-3 font-semibold text-gray-500 text-sm">
              <li>
                <Link to="/" className="hover:text-sky-500 hover:translate-x-1.5 transition-all duration-200 flex items-center gap-2 group/link">
                  <span className="text-sky-300 group-hover/link:text-sky-500 group-hover/link:translate-x-0.5 transition-all text-xs">▹</span> 
                  Trang Chủ
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-sky-500 hover:translate-x-1.5 transition-all duration-200 flex items-center gap-2 group/link">
                  <span className="text-sky-300 group-hover/link:text-sky-500 group-hover/link:translate-x-0.5 transition-all text-xs">▹</span> 
                  Về Chúng Tôi
                </Link>
              </li>
              <li>
                <Link to="/menu" className="hover:text-sky-500 hover:translate-x-1.5 transition-all duration-200 flex items-center gap-2 group/link">
                  <span className="text-sky-300 group-hover/link:text-sky-500 group-hover/link:translate-x-0.5 transition-all text-xs">▹</span> 
                  Thực Đơn
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-sky-500 hover:translate-x-1.5 transition-all duration-200 flex items-center gap-2 group/link">
                  <span className="text-sky-300 group-hover/link:text-sky-500 group-hover/link:translate-x-0.5 transition-all text-xs">▹</span> 
                  Liên Hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Chính sách */}
          <div className={`transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h3 className="text-base font-black text-gray-800 uppercase tracking-wider mb-2">Chính Sách</h3>
            <div className="w-8 h-1 bg-gradient-to-r from-sky-400 to-sky-600 rounded-full mb-5"></div>
            <ul className="space-y-3 font-semibold text-gray-500 text-sm">
              <li>
                <Link to="/privacy-policy" className="hover:text-sky-500 hover:translate-x-1.5 transition-all duration-200 flex items-center gap-2 group/link">
                  <span className="text-sky-300 group-hover/link:text-sky-500 group-hover/link:translate-x-0.5 transition-all text-xs">▹</span> 
                  Bảo Mật Thông Tin
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="hover:text-sky-500 hover:translate-x-1.5 transition-all duration-200 flex items-center gap-2 group/link">
                  <span className="text-sky-300 group-hover/link:text-sky-500 group-hover/link:translate-x-0.5 transition-all text-xs">▹</span> 
                  Điều Khoản Dịch Vụ
                </Link>
              </li>
              <li>
                <Link to="/return-policy" className="hover:text-sky-500 hover:translate-x-1.5 transition-all duration-200 flex items-center gap-2 group/link">
                  <span className="text-sky-300 group-hover/link:text-sky-500 group-hover/link:translate-x-0.5 transition-all text-xs">▹</span> 
                  Chính Sách Đổi Trả
                </Link>
              </li>
              <li>
                <Link to="/shopping-guide" className="hover:text-sky-500 hover:translate-x-1.5 transition-all duration-200 flex items-center gap-2 group/link">
                  <span className="text-sky-300 group-hover/link:text-sky-500 group-hover/link:translate-x-0.5 transition-all text-xs">▹</span> 
                  Hướng Dẫn Mua Hàng
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Thông tin liên hệ */}
          <div className={`transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h3 className="text-base font-black text-gray-800 uppercase tracking-wider mb-2">Liên Hệ</h3>
            <div className="w-8 h-1 bg-gradient-to-r from-sky-400 to-sky-600 rounded-full mb-5"></div>
            <ul className="space-y-3.5 text-gray-600 font-medium text-sm">
              <li className="flex items-start gap-3 p-1.5 -mx-1.5 rounded-xl hover:bg-sky-50/80 transition-colors group/item">
                <span className="text-sky-500 text-lg group-hover/item:scale-125 transition-transform flex-shrink-0">📍</span>
                <span className="leading-snug">{storeInfo.address}</span>
              </li>
              <li className="flex items-center gap-3 p-1.5 -mx-1.5 rounded-xl hover:bg-sky-50/80 transition-colors group/item">
                <span className="text-sky-500 text-lg group-hover/item:scale-125 transition-transform flex-shrink-0">📞</span>
                <span className="font-bold text-gray-800">{storeInfo.phone}</span>
              </li>
              <li className="flex items-center gap-3 p-1.5 -mx-1.5 rounded-xl hover:bg-sky-50/80 transition-colors group/item">
                <span className="text-sky-500 text-lg group-hover/item:scale-125 transition-transform flex-shrink-0">✉️</span>
                <span className="break-all">{storeInfo.email}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Thanh Bản quyền (Copyright) */}
        <div className={`border-t border-sky-100/80 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-gray-500 font-semibold text-xs sm:text-sm text-center md:text-left">
            &copy; 2026 <span className="text-sky-500 font-bold">DualeoFood</span>. Bản quyền thuộc về Nguyễn Đức Thành_2311558311.
          </p>
          <div className="flex items-center gap-3">
            <a 
              href="#" 
              aria-label="Facebook"
              className="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center text-sky-600 hover:bg-[#1877F2] hover:text-white hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1 active:scale-95 transition-all duration-300 border border-sky-100/50"
            >
              <FiFacebook className="text-lg" />
            </a>
            <a 
              href="#" 
              aria-label="Instagram"
              className="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center text-sky-600 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 hover:text-white hover:shadow-lg hover:shadow-rose-500/30 hover:-translate-y-1 active:scale-95 transition-all duration-300 border border-sky-100/50"
            >
              <FiInstagram className="text-lg" />
            </a>
            <a 
              href="#" 
              aria-label="Twitter"
              className="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center text-sky-600 hover:bg-[#1DA1F2] hover:text-white hover:shadow-lg hover:shadow-sky-500/30 hover:-translate-y-1 active:scale-95 transition-all duration-300 border border-sky-100/50"
            >
              <FiTwitter className="text-lg" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;