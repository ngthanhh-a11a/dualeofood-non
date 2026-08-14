import React, { useState, useEffect, useRef } from 'react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

// --- Data ---
const FAQ_DATA = [
  {
    q: 'Phí giao hàng là bao nhiêu?',
    a: 'Phí giao hàng cố định là 15,000đ cho mọi đơn hàng. Đặc biệt, đơn hàng từ 200,000đ trở lên sẽ được miễn phí giao hàng hoàn toàn!'
  },
  {
    q: 'Thời gian giao hàng mất bao lâu?',
    a: 'Thời gian giao hàng trung bình từ 25-40 phút tùy theo khoảng cách và mức độ bận rộn. Bạn sẽ nhận được thông báo cập nhật trạng thái đơn hàng theo thời gian thực.'
  },
  {
    q: 'Tôi có thể hủy hoặc thay đổi đơn hàng sau khi đặt không?',
    a: 'Bạn có thể hủy đơn trong vòng 5 phút sau khi đặt. Sau khoảng thời gian đó, đơn hàng đã được nhà bếp xử lý và không thể thay đổi. Vui lòng liên hệ hotline để được hỗ trợ nhanh nhất!'
  },
  {
    q: 'Các phương thức thanh toán nào được chấp nhận?',
    a: 'Chúng tôi chấp nhận thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng, VNPay và Momo. Chúng tôi đang tích hợp thêm nhiều ví điện tử khác trong tương lai gần.'
  },
  {
    q: 'Tôi muốn đặt hàng số lượng lớn / theo cụm cho công ty?',
    a: 'Chúng tôi hỗ trợ đặt hàng theo cụm (bulk order) với mức chiết khấu hấp dẫn. Vui lòng liên hệ trực tiếp qua email hoặc hotline để được tư vấn và báo giá tốt nhất!'
  },
  {
    q: 'Làm sao để dùng mã giảm giá (voucher)?',
    a: 'Bạn vào trang Khuyến Mãi để lưu mã vào Ví Voucher của mình. Khi vào Giỏ Hàng, bấm "Chọn Voucher" và hệ thống sẽ tự động hiển thị các mã còn hạn sử dụng để bạn áp dụng.'
  },
];

// --- FAQ Item Component ---
const FaqItem = ({ item, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);

  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
        isOpen ? 'border-sky-300 shadow-md shadow-sky-100' : 'border-slate-100 bg-white hover:border-sky-200'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left transition-colors ${
          isOpen ? 'bg-sky-50' : 'bg-white'
        }`}
      >
        <div className="flex items-center gap-4">
          <span className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-black transition-colors ${
            isOpen ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'
          }`}>
            {index + 1}
          </span>
          <span className={`font-bold text-base transition-colors ${isOpen ? 'text-sky-700' : 'text-slate-800'}`}>
            {item.q}
          </span>
        </div>
        <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${
          isOpen ? 'bg-sky-500 text-white rotate-180' : 'bg-slate-100 text-slate-400'
        }`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{ maxHeight: isOpen ? contentRef.current?.scrollHeight + 'px' : '0px' }}
      >
        <p className="px-5 md:px-6 pb-5 md:pb-6 text-slate-600 leading-relaxed text-sm md:text-base border-t border-slate-100 pt-4">
          {item.a}
        </p>
      </div>
    </div>
  );
};

// --- 3D Tilt Card ---
const TiltCard = ({ emoji, title, value, sub }) => {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / (width / 2);
    const y = (e.clientY - top - height / 2) / (height / 2);
    card.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.03)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg) scale(1)';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="bg-white border border-slate-100 rounded-2xl p-5 flex items-start gap-4 cursor-default select-none shadow-sm"
      style={{ transition: 'transform 0.1s ease-out', willChange: 'transform' }}
    >
      <div className="w-12 h-12 bg-sky-50 border border-sky-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
        {emoji}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{title}</p>
        <p className="font-black text-slate-800 text-base">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

// --- Main Component ---
const Contact = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', content: '' });
  const [sendState, setSendState] = useState('idle'); // idle | riding | done
  const [visible, setVisible] = useState({ header: false, main: false, faq: false });
  const [storeInfo, setStoreInfo] = useState({
    address: '123 Đường Bánh Mì, Quận Gà Rán, TP. Hồ Chí Minh',
    phone: '1900 1234',
    email: 'support@dualeofood.com'
  });

  const headerRef = useRef(null);
  const mainRef = useRef(null);
  const faqRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const s = entry.target.getAttribute('data-section');
            if (s) {
              setVisible((prev) => ({ ...prev, [s]: true }));
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { threshold: 0.08 }
    );
    if (headerRef.current) observer.observe(headerRef.current);
    if (mainRef.current) observer.observe(mainRef.current);
    if (faqRef.current) observer.observe(faqRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/settings/public');
        if (res.data && res.data.storeInfo) {
          const info = res.data.storeInfo;
          setStoreInfo({
            address: info.address || '123 Đường Bánh Mì, Quận Gà Rán, TP. Hồ Chí Minh',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSendState('riding');
    try {
      await axios.post('/messages', formData);
      setSendState('done');
      toast.success('Cảm ơn bạn! Lời nhắn đã được gửi đi thành công 🚀');
      setFormData({ name: '', phone: '', content: '' });
      setTimeout(() => setSendState('idle'), 3000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại!');
      setSendState('idle');
    }
  };

  const SOCIALS = [
    { icon: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.89a8.27 8.27 0 0 0 4.84 1.55V7a4.85 4.85 0 0 1-1.07-.31z', label: 'TikTok', color: 'bg-slate-800', href: '#' },
    { icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z', label: 'Facebook', color: 'bg-blue-600', href: '#' },
    { icon: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5a1 1 0 101 1 1 1 0 00-1-1zM12 2a10 10 0 00-7.07 17.07A10 10 0 0022 12 10 10 0 0012 2zm5.5 14.5A7.48 7.48 0 0112 19.5a7.5 7.5 0 01-7.5-7.5A7.5 7.5 0 0112 4.5a7.5 7.5 0 017.5 7.5 7.48 7.48 0 01-2 5z', label: 'Instagram', color: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600', href: '#' },
  ];

  const buttonContent = () => {
    if (sendState === 'riding') return (
      <span className="flex items-center justify-center gap-3">
        <span className="text-2xl animate-bounce inline-block">🛵</span>
        <span className="text-sm font-black tracking-widest">ĐANG GIAO TIN NHẮN...</span>
      </span>
    );
    if (sendState === 'done') return (
      <span className="flex items-center justify-center gap-2">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        ĐÃ GỬI THÀNH CÔNG!
      </span>
    );
    return (
      <span className="flex items-center justify-center gap-2">
        <span>GỬI LỜI NHẮN</span>
        <span className="text-lg">🛵</span>
      </span>
    );
  };

  return (
    <div className="relative font-sans bg-slate-50 overflow-x-hidden">
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px) rotate(-4deg); } 50% { transform: translateY(-10px) rotate(4deg); } }
        @keyframes float2 { 0%, 100% { transform: translateY(0px) rotate(5deg); } 50% { transform: translateY(-14px) rotate(-5deg); } }
        @keyframes float3 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-8px) rotate(6deg); } }
        .float-1 { animation: float 3.5s ease-in-out infinite; }
        .float-2 { animation: float2 4.2s ease-in-out infinite; }
        .float-3 { animation: float3 5s ease-in-out infinite; }
        @keyframes slideRight {
          0% { transform: translateX(-10px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(calc(100vw + 50px)); opacity: 0; }
        }
        .animate-ride { animation: slideRight 1.5s ease-in-out; }
      `}</style>

      {/* Decorative background blobs */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-sky-100/60 rounded-full blur-3xl -z-10 pointer-events-none -translate-y-1/3 translate-x-1/3"></div>
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-cyan-100/50 rounded-full blur-3xl -z-10 pointer-events-none translate-y-1/3 -translate-x-1/4"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20">

        {/* ===== HEADER ===== */}
        <div
          ref={headerRef}
          data-section="header"
          className={`text-center mb-16 transition-all duration-1000 ${visible.header ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-600 border border-sky-200 text-xs font-bold tracking-widest uppercase px-5 py-2 rounded-full mb-5">
            <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse"></span>
            Góp Ý & Phản Hồi
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-800 leading-tight tracking-tight mb-4">
            Liên Hệ Với{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-cyan-400">
              DualeoFood
            </span>
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Chúng tôi luôn sẵn sàng lắng nghe. Hãy chia sẻ với chúng tôi bất cứ điều gì!
          </p>

          {/* Floating Social Icons */}
          <div className="flex items-center justify-center gap-4 mt-8">
            {SOCIALS.map((s, i) => (
              <a
                key={i}
                href={s.href}
                aria-label={s.label}
                className={`w-11 h-11 rounded-2xl ${s.color} flex items-center justify-center text-white shadow-lg hover:shadow-xl hover:-translate-y-2 hover:scale-110 transition-all duration-300 ${['float-1','float-2','float-3'][i]}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* ===== MAIN LAYOUT ===== */}
        <div
          ref={mainRef}
          data-section="main"
          className={`grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8 transition-all duration-1000 delay-150 ${visible.main ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          {/* === LEFT: Info Cards + Map === */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Contact Info Cards */}
            <div className="space-y-4">
              <h2 className="text-lg font-black text-slate-700 tracking-tight">Thông tin liên hệ</h2>
              <TiltCard emoji="📍" title="Địa chỉ cửa hàng" value={storeInfo.address} />
              <TiltCard emoji="📞" title="Đường dây nóng" value={storeInfo.phone} />
              <TiltCard emoji="✉️" title="Email hỗ trợ" value={storeInfo.email} />
              <TiltCard emoji="⏰" title="Giờ hoạt động" value="07:00 — 22:30" sub="Tất cả các ngày trong tuần" />
            </div>

            {/* Map - Asymmetric */}
            <div className="relative flex-1 min-h-[220px] rounded-3xl overflow-hidden border border-slate-100 shadow-md">
              <div className="absolute inset-0 bg-gradient-to-t from-sky-900/30 to-transparent z-10 pointer-events-none rounded-3xl"></div>
              <iframe
                title="Bản đồ DualeoFood"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.1251208102663!2d106.71185591462276!3d10.801727861674338!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528a459cb43ab%3A0x6c3d29d370b5cf02!2zUXXhuq1uIELDrG5oIFRo4bqhbmg!5e0!3m2!1svi!2s!4v1680509650000!5m2!1svi!2s"
                width="100%"
                height="100%"
                style={{ border: 0, position: 'absolute', inset: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
              {/* Badge on map */}
              <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-sm border border-sky-100 rounded-xl px-3 py-2 shadow-lg">
                <p className="text-xs font-black text-sky-600">📍 DualeoFood</p>
                <p className="text-[10px] text-slate-500">123 Đường Bánh Mì, Q.Gà Rán</p>
              </div>
            </div>
          </div>

          {/* === RIGHT: Contact Form === */}
          <div className="lg:col-span-3 bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-7 md:p-10 shadow-sm flex flex-col">
            <div className="mb-7">
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">Gửi Lời Nhắn</h2>
              <p className="text-slate-500 text-sm">Điền thông tin bên dưới — chúng tôi sẽ phản hồi bạn sớm nhất có thể!</p>
            </div>

            <form className="flex-1 flex flex-col gap-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Họ và Tên <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Số Điện Thoại <span className="text-red-400">*</span></label>
                  <input
                    type="tel"
                    required
                    placeholder="VD: 0901 234 567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Nội Dung Lời Nhắn <span className="text-red-400">*</span></label>
                <textarea
                  required
                  rows="6"
                  placeholder="Bạn muốn nói gì với chúng tôi? Hãy chia sẻ thoải mái nhé..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100 transition-all resize-none"
                ></textarea>
              </div>

              {/* Character count */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tin nhắn của bạn được bảo mật 🔒</span>
                <span>{formData.content.length} ký tự</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={sendState !== 'idle'}
                className={`mt-auto w-full py-4 rounded-2xl font-black text-base tracking-wider transition-all duration-300 shadow-lg active:scale-95 overflow-hidden ${
                  sendState === 'done'
                    ? 'bg-emerald-500 text-white shadow-emerald-200'
                    : sendState === 'riding'
                    ? 'bg-sky-400 text-white shadow-sky-200 cursor-wait'
                    : 'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-200 hover:shadow-sky-300 hover:-translate-y-0.5'
                }`}
              >
                {buttonContent()}
              </button>
            </form>
          </div>
        </div>

        {/* ===== FAQ SECTION ===== */}
        <div
          ref={faqRef}
          data-section="faq"
          className={`transition-all duration-1000 delay-300 ${visible.faq ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-7 md:p-10 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 text-sky-600 bg-sky-50 border border-sky-100 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-3">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Câu hỏi thường gặp
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-800">Bạn đang thắc mắc điều gì?</h2>
                <p className="text-slate-500 text-sm mt-1">Câu trả lời cho những vấn đề phổ biến nhất từ khách hàng của chúng tôi.</p>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl">
                <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Nhấn vào câu hỏi để xem đáp án
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FAQ_DATA.map((item, i) => (
                <FaqItem key={i} item={item} index={i} />
              ))}
            </div>

            {/* Still have questions? */}
            <div className="mt-8 text-center border-t border-slate-100 pt-7">
              <p className="text-slate-500 text-sm mb-3">Vẫn chưa tìm được câu trả lời? Chúng tôi sẵn sàng hỗ trợ!</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a href={`tel:${storeInfo.phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2 bg-sky-50 border border-sky-100 text-sky-600 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-sky-100 transition-colors">
                  📞 Gọi ngay: {storeInfo.phone}
                </a>
                <a href={`mailto:${storeInfo.email}`} className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-600 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-100 transition-colors">
                  ✉️ {storeInfo.email}
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Contact;