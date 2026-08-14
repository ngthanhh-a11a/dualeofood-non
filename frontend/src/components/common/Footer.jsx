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
      className={`bg-white pt-16 pb-8 border-t border-sky-50 mt-10 transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
    >
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Cột 1: Thông tin thương hiệu */}
          <div className="space-y-5">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
              <img 
                src={logoImage} 
                alt="DualeoFood Logo" 
                className="w-10 h-10 object-contain"
                onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=DF&background=0EA5E9&color=fff&rounded=true&bold=true"; }}
              />
              <span className="text-2xl font-black text-sky-500 tracking-wider">DUALEOFOOD</span>
            </Link>
            <p className="text-gray-500 leading-relaxed">
              Đem đến trải nghiệm ẩm thực tuyệt vời với những món ăn chất lượng, giao hàng thần tốc và dịch vụ tận tâm từ trái tim.
            </p>
          </div>
          
          {/* Cột 2: Khám phá (Liên kết nhanh) */}
          <div>
            <h3 className="text-lg font-black text-gray-800 mb-6 uppercase tracking-wider">Khám Phá</h3>
            <ul className="space-y-4 font-semibold text-gray-500">
              <li><Link to="/" className="hover:text-sky-500 transition flex items-center gap-2"><span className="text-sky-300">▹</span> Trang Chủ</Link></li>
              <li><Link to="/about" className="hover:text-sky-500 transition flex items-center gap-2"><span className="text-sky-300">▹</span> Về Chúng Tôi</Link></li>
              <li><Link to="/menu" className="hover:text-sky-500 transition flex items-center gap-2"><span className="text-sky-300">▹</span> Thực Đơn</Link></li>
              <li><Link to="/contact" className="hover:text-sky-500 transition flex items-center gap-2"><span className="text-sky-300">▹</span> Liên Hệ</Link></li>
            </ul>
          </div>

          {/* Cột 3: Chính sách */}
          <div>
            <h3 className="text-lg font-black text-gray-800 mb-6 uppercase tracking-wider">Chính Sách</h3>
            <ul className="space-y-4 font-semibold text-gray-500">
              <li><Link to="/privacy-policy" className="hover:text-sky-500 transition flex items-center gap-2"><span className="text-sky-300">▹</span> Bảo Mật Thông Tin</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-sky-500 transition flex items-center gap-2"><span className="text-sky-300">▹</span> Điều Khoản Dịch Vụ</Link></li>
              <li><Link to="/return-policy" className="hover:text-sky-500 transition flex items-center gap-2"><span className="text-sky-300">▹</span> Chính Sách Đổi Trả</Link></li>
              <li><Link to="/shopping-guide" className="hover:text-sky-500 transition flex items-center gap-2"><span className="text-sky-300">▹</span> Hướng Dẫn Mua Hàng</Link></li>
            </ul>
          </div>

          {/* Cột 4: Thông tin liên hệ */}
          <div>
            <h3 className="text-lg font-black text-gray-800 mb-6 uppercase tracking-wider">Liên Hệ</h3>
            <ul className="space-y-4 text-gray-600 font-medium mb-6">
              <li className="flex items-start gap-3"><span className="text-sky-500 text-xl">📍</span><span>{storeInfo.address}</span></li>
              <li className="flex items-center gap-3"><span className="text-sky-500 text-xl">📞</span><span className="font-bold text-gray-800">{storeInfo.phone}</span></li>
              <li className="flex items-center gap-3"><span className="text-sky-500 text-xl">✉️</span><span>{storeInfo.email}</span></li>
            </ul>
          </div>
        </div>

        {/* Thanh Bản quyền (Copyright) */}
        <div className="border-t border-sky-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 font-semibold text-sm">
            &copy; 2026 <span className="text-sky-500 font-bold">DualeoFood</span>. Bản quyền thuộc về Nguyễn Đức Thành_2311558311.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center text-sky-600 hover:bg-sky-500 hover:text-white transition shadow-sm">
              <FiFacebook className="text-xl" />
            </a>
            <a href="#" className="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center text-sky-600 hover:bg-sky-500 hover:text-white transition shadow-sm">
              <FiInstagram className="text-xl" />
            </a>
            <a href="#" className="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center text-sky-600 hover:bg-sky-500 hover:text-white transition shadow-sm">
              <FiTwitter className="text-xl" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;