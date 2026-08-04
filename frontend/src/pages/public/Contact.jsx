import React, { useState, useEffect, useRef } from 'react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', content: '' });
  const [loading, setLoading] = useState(false);
  
  // State và Ref dùng cho hiệu ứng cuộn trang (Nhiều khối)
  const [visibleSections, setVisibleSections] = useState({
    header: false,
    card: false,
    map: false
  });
  const headerRef = useRef(null);
  const cardRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = entry.target.getAttribute('data-section');
            if (section) {
              setVisibleSections((prev) => ({ ...prev, [section]: true }));
              observer.unobserve(entry.target); // Ngừng theo dõi khối này sau khi đã hiện
            }
          }
        });
      },
      { threshold: 0.1 } // Kích hoạt khi khối lộ ra 10% trên màn hình
    );

    if (headerRef.current) observer.observe(headerRef.current);
    if (cardRef.current) observer.observe(cardRef.current);
    if (mapRef.current) observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/messages', formData);
      toast.success('Cảm ơn bạn! Lời nhắn của bạn đã được gửi đi thành công.');
      setFormData({ name: '', phone: '', content: '' }); // Xóa form sau khi gửi
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans relative overflow-hidden">
      {/* ================= STYLES ================= */}
      <style>{`
        .bg-mesh {
          background-color: #f0f9ff;
          background-image: 
            radial-gradient(at 40% 20%, hsla(200,100%,85%,1) 0px, transparent 50%),
            radial-gradient(at 80% 0%, hsla(189,100%,86%,1) 0px, transparent 50%),
            radial-gradient(at 0% 50%, hsla(195,100%,90%,1) 0px, transparent 50%);
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2.5s infinite;
        }
      `}</style>

      {/* Nền Mesh chung cho cả trang Liên hệ */}
      <div className="absolute inset-0 bg-mesh opacity-30 pointer-events-none z-0"></div>

      <div className="container mx-auto px-4 py-16 md:py-24 max-w-6xl relative z-10">
        
        {/* Header Section */}
        <div 
          ref={headerRef}
          data-section="header"
          className={`text-center mb-20 transition-all duration-1000 transform ${visibleSections.header ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
        >
          <div className="inline-block mb-6">
            <span className="bg-white/80 backdrop-blur-md text-sky-600 font-bold tracking-widest uppercase text-xs md:text-sm px-6 py-2 rounded-full border border-sky-100 shadow-sm">
              💬 Góp Ý & Phản Hồi
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-800 drop-shadow-sm mb-6 leading-tight">
            Liên Hệ Với <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-sky-600">DualeoFood</span>
          </h1>
          <p className="text-gray-600 font-medium mt-4 max-w-2xl mx-auto text-lg md:text-xl">
            Chúng tôi luôn sẵn sàng lắng nghe mọi ý kiến đóng góp từ bạn để mang đến trải nghiệm ẩm thực tuyệt vời nhất.
          </p>
        </div>
        
        {/* Main Contact Card */}
        <div 
          ref={cardRef}
          data-section="card"
          className={`bg-white/80 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white overflow-hidden flex flex-col md:flex-row mb-20 transition-all duration-1000 delay-200 transform ${visibleSections.card ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
        >
        
          {/* Cột trái: Phần thông tin liên hệ (Gradient) */}
          <div className="w-full md:w-2/5 bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 text-white p-10 md:p-14 flex flex-col justify-center relative overflow-hidden group">
            {/* Hiệu ứng bong bóng nền (Decorative Blobs) */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-200 opacity-20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000 pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl font-black mb-6">Thông Tin <br/> Trực Tuyến</h2>
              <p className="mb-12 text-sky-50 font-medium leading-relaxed text-lg">
                Bạn có câu hỏi hoặc cần hỗ trợ? Đừng ngần ngại liên hệ qua các kênh dưới đây.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-5 group/item cursor-default p-4 rounded-2xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/20">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl group-hover/item:bg-white group-hover/item:text-sky-500 transition-all duration-300 transform group-hover/item:-translate-y-1 shadow-sm">📍</div>
                  <div className="pt-1">
                    <p className="font-bold text-xl mb-1 text-white">Địa chỉ cửa hàng</p>
                    <p className="text-sky-100 leading-relaxed">123 Đường Bánh Mì, Quận Gà Rán, TP. Hồ Chí Minh</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-5 group/item cursor-default p-4 rounded-2xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/20">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl group-hover/item:bg-white group-hover/item:text-sky-500 transition-all duration-300 transform group-hover/item:-translate-y-1 shadow-sm">📞</div>
                  <div className="pt-1">
                    <p className="font-bold text-xl mb-1 text-white">Đường dây nóng</p>
                    <p className="text-sky-100 leading-relaxed">1900 1234 (Miễn phí từ 8h-22h)</p>
                  </div>
                </div>

                <div className="flex items-start gap-5 group/item cursor-default p-4 rounded-2xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/20">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl group-hover/item:bg-white group-hover/item:text-sky-500 transition-all duration-300 transform group-hover/item:-translate-y-1 shadow-sm">✉️</div>
                  <div className="pt-1">
                    <p className="font-bold text-xl mb-1 text-white">Email hỗ trợ</p>
                    <p className="text-sky-100 leading-relaxed">support@dualeofood.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Form Gửi Tin Nhắn */}
          <div className="w-full md:w-3/5 p-10 md:p-16 bg-white/50 flex flex-col justify-center">
            <h2 className="text-4xl font-black text-slate-800 mb-4">Gửi Lời Nhắn</h2>
            <p className="text-gray-500 font-medium mb-10 text-lg">Điền thông tin bên dưới, chúng tôi sẽ phản hồi bạn sớm nhất có thể.</p>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-700 font-bold mb-3 text-sm tracking-wide uppercase">Họ và Tên <span className="text-red-500">*</span></label>
                  <input type="text" required placeholder="VD: Nguyễn Văn A" 
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 transition-all duration-300 font-medium text-slate-700 shadow-sm" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-3 text-sm tracking-wide uppercase">Số Điện Thoại <span className="text-red-500">*</span></label>
                  <input type="tel" required placeholder="VD: 0901234567" 
                    value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 transition-all duration-300 font-medium text-slate-700 shadow-sm" />
                </div>
              </div>
              
              <div className="pt-2">
                <label className="block text-slate-700 font-bold mb-3 text-sm tracking-wide uppercase">Nội Dung Lời Nhắn <span className="text-red-500">*</span></label>
                <textarea required rows="4" placeholder="Bạn muốn nói gì với chúng tôi?..." 
                  value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 transition-all duration-300 font-medium text-slate-700 resize-none shadow-sm"></textarea>
              </div>
              
              <div className="pt-6">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="relative overflow-hidden w-full md:w-auto px-12 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-400 text-white font-black text-lg py-5 rounded-full shadow-xl shadow-sky-500/30 transition-all duration-300 hover:shadow-sky-500/50 hover:-translate-y-1 active:scale-95 group/submit"
                >
                  <span className="relative z-10">{loading ? 'ĐANG GỬI...' : 'GỬI LỜI NHẮN'}</span>
                  {!loading && <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent transform -translate-x-full group-hover/submit:animate-shimmer pointer-events-none"></div>}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Bản đồ Google Maps nhúng */}
        <div 
          ref={mapRef}
          data-section="map"
          className={`bg-white/80 backdrop-blur-md p-4 rounded-[3rem] shadow-2xl border border-white transition-all duration-1000 transform ${
            visibleSections.map ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
          }`}
        >
          <div className="w-full h-[450px] rounded-[2.5rem] overflow-hidden bg-gray-100 relative">
            <div className="absolute inset-0 bg-sky-500/5 pointer-events-none z-10 mix-blend-overlay"></div>
            <iframe 
              title="Bản đồ DualeoFood"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.1251208102663!2d106.71185591462276!3d10.801727861674338!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528a459cb43ab%3A0x6c3d29d370b5cf02!2zUXXhuq1uIELDrG5oIFRo4bqhbmg!5e0!3m2!1svi!2s!4v1680509650000!5m2!1svi!2s" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="relative z-0"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Contact;