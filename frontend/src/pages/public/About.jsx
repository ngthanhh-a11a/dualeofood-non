import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useConfetti } from '../../hooks/useConfetti'; // 1. Import hook mới

const About = () => {
  // State mới để lưu vị trí cuộn cho hiệu ứng parallax
  const [parallaxOffset, setParallaxOffset] = useState(0);
  
  // 2. Khởi tạo hook confetti
  const { fireFromElement } = useConfetti();

  // State và Ref dùng cho hiệu ứng cuộn trang
  const [visibleSections, setVisibleSections] = useState({
    banner: false,
    story: false,
    values: false,
    cta: false
  });

  const bannerRef = useRef(null);
  const storyRef = useRef(null);
  const valuesRef = useRef(null);
  const ctaRef = useRef(null);

  // 3. Hàm xử lý khi click vào box
  const handleValueBoxClick = (event) => {
    fireFromElement(event.currentTarget);
  };

  useEffect(() => {
    // --- LOGIC CHO HIỆU ỨNG FADE-IN KHI CUỘN ---
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = entry.target.getAttribute('data-section');
            if (section) {
              setVisibleSections((prev) => ({ ...prev, [section]: true }));
              observer.unobserve(entry.target); // Ngừng theo dõi khi đã hiển thị
            }
          }
        });
      },
      { threshold: 0.1 } // Kích hoạt khi khối lộ ra 10%
    );

    if (bannerRef.current) observer.observe(bannerRef.current);
    if (storyRef.current) observer.observe(storyRef.current);
    if (valuesRef.current) observer.observe(valuesRef.current);
    if (ctaRef.current) observer.observe(ctaRef.current);

    // --- LOGIC CHO HIỆU ỨNG PARALLAX ---
    const handleScroll = () => {
      setParallaxOffset(window.pageYOffset);
    };
    window.addEventListener('scroll', handleScroll);

    // --- DỌN DẸP KHI COMPONENT UNMOUNT ---
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // Mảng rỗng đảm bảo useEffect chỉ chạy một lần khi mount

  return (
    <div className="font-sans">
      
      {/* ================= STYLES ================= */}
      <style>{`
        @keyframes blob {
          0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
        }
        .animate-blob {
          animation: blob 8s ease-in-out infinite;
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(-12deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
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

      {/* ================= SECTION 1: HERO BANNER ================= */}
      <section 
        ref={bannerRef}
        data-section="banner"
        className={`relative bg-mesh py-24 md:py-32 overflow-hidden rounded-b-[4rem] shadow-sm transition-opacity duration-1000 ${visibleSections.banner ? 'opacity-100' : 'opacity-0'}`}
        style={{ transform: `translateY(${parallaxOffset * 0.4}px)` }}
      >
        <div className="absolute inset-0 backdrop-blur-[2px]"></div> {/* Glassmorphism nhẹ */}
        <div className="container mx-auto px-4 text-center z-10 relative">
          <div className="inline-block mb-6">
            <span className="bg-white/80 backdrop-blur-md text-sky-600 font-bold tracking-widest uppercase text-xs md:text-sm px-6 py-2 rounded-full border border-sky-100 shadow-sm">
              ✨ Về Chúng Tôi
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-800 mb-8 drop-shadow-sm leading-tight">
            Câu Chuyện Của <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-sky-600">
              DualeoFood
            </span>
          </h1>
          <p className="text-gray-600/90 text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed font-medium">
            Hành trình mang đến những chiếc burger ngon nhất, đậm đà nhất và ngập tràn tình yêu ẩm thực từ nhà bếp đến bàn ăn của bạn.
          </p>
        </div>
        
        {/* Background Decorations */}
        <div className="absolute top-10 left-10 text-6xl md:text-8xl opacity-30 animate-float-slow">🍔</div>
        <div className="absolute bottom-10 right-20 text-6xl md:text-8xl opacity-30 animate-float-slow" style={{ animationDelay: '1s' }}>🍟</div>
        <div className="absolute top-20 right-1/4 text-4xl md:text-6xl opacity-30 animate-float-slow" style={{ animationDelay: '2s' }}>🥤</div>
        
        {/* Glow orb */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-sky-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-pulse pointer-events-none"></div>
      </section>

      {/* ================= SECTION 2: CÂU CHUYỆN THƯƠNG HIỆU ================= */}
      <section 
        ref={storyRef}
        data-section="story"
        className={`container mx-auto px-4 py-20 md:py-32 transition-all duration-1000 transform ${visibleSections.story ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
      >
        <div className="flex flex-col md:flex-row items-center gap-16 md:gap-24">
          {/* Hình ảnh */}
          <div className="w-full md:w-1/2 relative">
            <div className="absolute -inset-4 bg-sky-100/50 rounded-full filter blur-xl animate-pulse"></div>
            <div className="relative overflow-hidden shadow-2xl border-[10px] border-white animate-blob bg-sky-200 group">
              <img 
                src="https://images.unsplash.com/photo-1586816001966-79b736744398?q=80&w=1000&auto=format&fit=crop" 
                alt="Làm burger" 
                className="w-full h-[450px] object-cover group-hover:scale-110 transition duration-1000 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <p className="text-white font-bold text-2xl tracking-wide transform translate-y-4 group-hover:translate-y-0 transition duration-500">
                  Được chế biến thủ công mỗi ngày 🧑‍🍳
                </p>
              </div>
            </div>
            
            {/* Huy hiệu nhỏ trang trí */}
            <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-3xl shadow-xl border border-sky-50 animate-bounce delay-150">
              <span className="text-4xl">🌟</span>
            </div>
          </div>

          {/* Nội dung */}
          <div className="w-full md:w-1/2 space-y-8 relative">
            <div className="absolute -top-10 -left-10 text-9xl text-sky-50 opacity-50 z-0 select-none font-serif">"</div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black text-slate-800 leading-tight">
                Ngon Từ Nguyên Liệu, <br/> 
                <span className="text-sky-500">Đậm Từ Đam Mê</span>
              </h2>
              <div className="w-24 h-2 bg-gradient-to-r from-sky-400 to-sky-600 rounded-full mt-6"></div>
              
              <div className="mt-8 space-y-6">
                <p className="text-gray-600 text-xl leading-relaxed font-medium">
                  Được thành lập từ một căn bếp nhỏ với niềm đam mê bất tận dành cho Fast Food, DualeoFood không ngừng nỗ lực để tạo ra những hương vị độc bản. 
                </p>
                <p className="text-gray-500 text-lg leading-relaxed">
                  Chúng tôi tin rằng, một bữa ăn nhanh không chỉ cần "nhanh" mà còn phải đảm bảo dinh dưỡng, sử dụng thịt bò 100% nguyên chất tươi ngon cùng lớp bánh mì mềm xốp được nướng mới mỗi sáng.
                </p>
              </div>

              {/* Stats Box */}
              <div className="pt-8 flex gap-8">
                <div className="bg-sky-50 p-6 rounded-3xl border border-sky-100 flex-1 hover:-translate-y-2 transition-transform duration-300">
                  <p className="text-5xl font-black text-sky-600 mb-2">10K<span className="text-sky-400">+</span></p>
                  <p className="text-sky-800 font-bold uppercase tracking-wider text-sm">Khách hàng</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex-1 hover:-translate-y-2 transition-transform duration-300">
                  <p className="text-5xl font-black text-orange-500 mb-2">100<span className="text-orange-400">%</span></p>
                  <p className="text-orange-800 font-bold uppercase tracking-wider text-sm">Tươi ngon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 3: GIÁ TRỊ CỐT LÕI ================= */}
      <section 
        ref={valuesRef}
        data-section="values"
        className="relative py-20 md:py-32"
      >
        {/* Background nghiêng */}
        <div className="absolute inset-0 bg-sky-50/80 transform -skew-y-3 z-0"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-6">Vì Sao Chọn DualeoFood?</h2>
            <p className="text-gray-600 text-xl font-medium">Chúng tôi cam kết mang lại trải nghiệm tuyệt vời nhất cho thực khách thông qua 3 tiêu chí vàng.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12 px-4 md:px-0">
            {[
              { icon: '🥩', title: 'Nguyên Liệu Tươi Sạch', desc: 'Thịt bò nhập khẩu, rau củ chuẩn VietGAP được giao mới mỗi ngày.' },
              { icon: '⚡', title: 'Giao Hàng Thần Tốc', desc: 'Đồ ăn luôn nóng hổi, vỏ bánh luôn giòn tan khi đến tay bạn trong 30 phút.' },
              { icon: '💝', title: 'Phục Vụ Tận Tâm', desc: 'Mỗi món ăn là một tác phẩm nghệ thuật được chăm chút bởi các đầu bếp.' },
            ].map((item, index) => (
              <div 
                key={index} 
                className={`bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-lg hover:shadow-sky-500/20 transition-all duration-500 border border-white/50 text-center group transform cursor-pointer ${visibleSections.values ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-24'}`}
                style={{ transitionDelay: `${index * 200}ms` }}
                onClick={handleValueBoxClick}
              >
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-sky-100 to-sky-50 rounded-3xl flex items-center justify-center text-5xl mb-8 group-hover:-translate-y-4 group-hover:shadow-xl transition-all duration-500 border border-sky-100/50">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-4 group-hover:text-sky-600 transition-colors">{item.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SECTION 4: CALL TO ACTION ================= */}
      <section 
        ref={ctaRef}
        data-section="cta"
        className={`container mx-auto px-4 py-20 md:py-32 transition-all duration-1000 transform ${visibleSections.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
      >
        <div className="bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 rounded-[3rem] shadow-2xl shadow-sky-500/30 relative overflow-hidden group">
          
          {/* Background Patterns */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/food.png')]"></div>
          
          <div className="flex flex-col md:flex-row items-center">
            {/* Nội dung bên trái */}
            <div className="w-full md:w-3/5 p-12 md:p-20 relative z-10 text-center md:text-left">
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-white font-bold text-sm tracking-widest uppercase mb-6 backdrop-blur-md border border-white/30">
                Ưu đãi đặc biệt
              </span>
              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight drop-shadow-md text-white">
                Đói Bụng <br className="hidden md:block" /> Rồi Nhỉ?
              </h2>
              <p className="text-sky-50 text-xl md:text-2xl mb-12 leading-relaxed font-medium">
                Khám phá ngay thực đơn ngập tràn các món ngon hấp dẫn và đặt hàng chỉ với vài thao tác cơ bản.
              </p>
              
              <Link to="/" className="relative inline-flex items-center justify-center bg-white text-sky-600 font-black text-xl py-5 px-12 rounded-full shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] hover:-translate-y-1 transition-all duration-300 overflow-hidden group/btn">
                <span className="relative z-10 flex items-center gap-2">
                  XEM THỰC ĐƠN NGAY
                  <svg className="w-6 h-6 transform group-hover/btn:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </span>
                {/* Hiệu ứng ánh sáng chạy ngang nút */}
                <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-sky-100 to-transparent opacity-50 transform -translate-x-full group-hover/btn:animate-shimmer"></div>
              </Link>
            </div>

            {/* Hình ảnh bên phải (Bay lơ lửng, tràn viền) */}
            <div className="w-full md:w-2/5 relative h-64 md:h-auto hidden md:block">
              {/* Ánh sáng glow phía sau burger */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white opacity-20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
              
              <img 
                src="https://freepngimg.com/thumb/burger/5-2-burger-png-thumb.png" 
                alt="Delicious Burger" 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] max-w-none scale-150 animate-float-slow drop-shadow-2xl z-20 pointer-events-none"
                style={{ filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.5))' }}
              />
              
              {/* Trang trí phụ */}
              <div className="absolute top-10 right-10 text-6xl opacity-80 animate-spin-slow z-30">🍅</div>
              <div className="absolute bottom-10 left-0 text-7xl opacity-80 animate-bounce z-30" style={{ animationDelay: '1s' }}>🧀</div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;