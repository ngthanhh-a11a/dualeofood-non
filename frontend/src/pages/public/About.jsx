import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useConfetti } from '../../hooks/useConfetti';
import RubberSegment from '../../components/common/RubberSegment';
import ScrollExpand from '../../components/common/ScrollExpand';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

// Component hiệu ứng số chạy ngẫu nhiên với giao diện Glassmorphism Dashboard cao cấp
const LotteryStats = () => {
  const [stats, setStats] = useState({
    satisfaction: '99.8%',
    meals: '25.000+',
    rating: '4.9 / 5.0 ⭐'
  });
  const [isCompleted, setIsCompleted] = useState(false);
  const containerRef = useRef(null);
  const timerRef = useRef(null);
  const hasTriggeredRef = useRef(false);

  const startLottery = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsCompleted(false);

    const startTime = Date.now();
    const duration1 = 800;  // 99.8% dừng ở 0.8s
    const duration2 = 1200; // 25.000+ dừng ở 1.2s
    const duration3 = 1600; // 4.9 / 5.0 ⭐ dừng ở 1.6s

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;

      setStats({
        satisfaction: elapsed < duration1
          ? `${(Math.random() * 35 + 64).toFixed(1)}%`
          : '99.8%',

        meals: elapsed < duration2
          ? `${Math.floor(Math.random() * 80000 + 10000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}+`
          : '25.000+',

        rating: elapsed < duration3
          ? `${(Math.random() * 1.6 + 3.3).toFixed(1)} / 5.0 ⭐`
          : '4.9 / 5.0 ⭐'
      });

      if (elapsed >= duration3) {
        setIsCompleted(true);
        clearInterval(timerRef.current);
      }
    }, 35);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            startLottery();
          }
        } else {
          hasTriggeredRef.current = false;
        }
      },
      { threshold: 0.25 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto mb-12 sm:mb-16 select-none"
    >
      {/* KPI 1 */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between mb-3">
          <span className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center text-lg border border-sky-100 shadow-2xs group-hover:scale-105 transition-transform">
            💖
          </span>
          <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
            Vị Ngon Chuẩn Gu
          </span>
        </div>
        <p className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight mb-1">
          {stats.satisfaction}
        </p>
        <p className="text-xs sm:text-sm font-bold text-slate-600 mb-3">
          Thực khách hài lòng hương vị
        </p>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-400 to-blue-600 rounded-full transition-all duration-1000 ease-out"
            style={{ width: isCompleted ? '99.8%' : '50%' }}
          />
        </div>
      </div>

      {/* KPI 2 */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between mb-3">
          <span className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center text-lg border border-orange-100 shadow-2xs group-hover:scale-105 transition-transform">
            🍔
          </span>
          <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100">
            Giao Nóng Tận Tay
          </span>
        </div>
        <p className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight mb-1">
          {stats.meals}
        </p>
        <p className="text-xs sm:text-sm font-bold text-slate-600 mb-3">
          Bữa ăn chất lượng đã phục vụ
        </p>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: isCompleted ? '95%' : '40%' }}
          />
        </div>
      </div>

      {/* KPI 3 */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between mb-3">
          <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg border border-emerald-100 shadow-2xs group-hover:scale-105 transition-transform">
            ⭐
          </span>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
            100% Thực Tế
          </span>
        </div>
        <p className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight mb-1">
          {stats.rating}
        </p>
        <p className="text-xs sm:text-sm font-bold text-slate-600 mb-3">
          Điểm đánh giá từ 1.200+ review
        </p>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: isCompleted ? '98%' : '45%' }}
          />
        </div>
      </div>
    </div>
  );
};

// Component Trưng Bày Đánh Giá Tương Tác: Spotlight Hero & Card Stack (Tối Giản, Chuyên Nghiệp)
const InteractiveReviewShowcase = () => {
  const [activeIdx, setActiveIdx] = useState(0);

  const reviews = [
    {
      id: 0,
      name: 'Hải Đăng',
      username: '@haidang.foodie',
      role: 'Food Reviewer Sài Gòn (150K Follower)',
      badge: '★ Đánh giá tiêu biểu',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200/80',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300&auto=format&fit=crop',
      dish: '🍔 Burger Bò Phô Mai Đặc Biệt',
      rating: 5,
      date: 'Vừa đánh giá hôm nay',
      quote: '“Thịt bò ở đây thơm nức mũi và cực kỳ mọng nước Juicy, không hề bị khô hay bở. Bánh mì nướng nóng hổi ăn kèm sốt phô mai kéo sợi béo ngậy chua ngọt cực dính! Chắc chắn là quán burger chân ái của mình ở Sài Gòn.”',
      scores: [
        { label: 'Vị giòn & mọng nước', score: '9.9/10', pct: '99%' },
        { label: 'Sốt phô mai độc bản', score: '10/10', pct: '100%' },
        { label: 'Giao nóng hổi < 30p', score: '9.8/10', pct: '98%' }
      ]
    },
    {
      id: 1,
      name: 'Thảo Vy',
      username: '@thaovy.design',
      role: 'Senior UI/UX Designer • Khách VIP',
      badge: '★ Khách hàng VIP',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200/80',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop',
      dish: '🍗 Combo Gà Rán & Burger Giòn',
      rating: 5,
      date: 'Hôm qua',
      quote: '“Trưa nào văn phòng công ty mình cũng rủ nhau order combo DualeoFood. Giao hàng siêu thần tốc, lúc anh shipper đưa hộp vẫn bốc khói nghi ngút. Bao bì giấy thân thiện môi trường lại rất chỉn chu. 10 điểm chất lượng!”',
      scores: [
        { label: 'Tốc độ giao vận', score: '10/10', pct: '100%' },
        { label: 'Vỏ bánh giòn xốp', score: '9.8/10', pct: '98%' },
        { label: 'Đóng gói chỉn chu', score: '10/10', pct: '100%' }
      ]
    },
    {
      id: 2,
      name: 'Quốc Bảo',
      username: '@bao.techie',
      role: 'Kỹ sư phần mềm • Khách thân thiết 2 năm',
      badge: '★ Khách thân thiết',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=300&auto=format&fit=crop',
      dish: '🥩 Burger Bò BBQ Thượng Hạng',
      rating: 5,
      date: '3 ngày trước',
      quote: '“Điều mình ưng ý nhất là rau xà lách và cà chua cực kỳ tươi giòn ngọt, chuẩn vị nông trại Đà Lạt chứ không bị dập nát. Ăn xong không hề bị ngấy mỡ hay nặng bụng. Rất xứng đáng cho những ngày làm việc bận rộn.”',
      scores: [
        { label: 'Rau sạch VietGAP', score: '10/10', pct: '100%' },
        { label: 'Thịt bò đậm đà', score: '9.7/10', pct: '97%' },
        { label: 'Dịch vụ chu đáo', score: '9.9/10', pct: '99%' }
      ]
    },
    {
      id: 3,
      name: 'Diệu Linh',
      username: '@dieulinh.eatclean',
      role: 'Health & Nutrition Creator',
      badge: '★ Ăn sạch lành mạnh',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
      dish: '🥑 Burger Bò Bơ Trái Cây',
      rating: 5,
      date: '5 ngày trước',
      quote: '“Hiếm có tiệm burger nào tính toán kỹ lưỡng hàm lượng calo và dinh dưỡng cân bằng như DualeoFood. Bơ trái cây béo tự nhiên quyện cùng thịt bò nạc ít mỡ và rau tươi ăn rất thanh mà vẫn đã miệng!”',
      scores: [
        { label: 'Dinh dưỡng cân bằng', score: '10/10', pct: '100%' },
        { label: 'Bơ tươi béo ngậy', score: '9.9/10', pct: '99%' },
        { label: 'Trải nghiệm tổng thể', score: '9.8/10', pct: '98%' }
      ]
    }
  ];

  const current = reviews[activeIdx] || reviews[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 max-w-6xl mx-auto items-stretch select-none">
      {/* ================= CỘT TRÁI: SPOTLIGHT HERO CARD (6/12) ================= */}
      <div className="lg:col-span-6 flex flex-col">
        <div className="h-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl relative overflow-hidden flex flex-col justify-between group transition-all duration-500">
          {/* Dải gradient trên đầu */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-sky-500 to-emerald-500" />

          {/* Phần trên: Header Spotlight */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${current.badgeColor} shadow-2xs`}>
                {current.badge}
              </span>
              <div className="flex items-center gap-1 text-amber-400 text-base">
                {'★'.repeat(5)}
              </div>
            </div>

            {/* Dấu ngoặc kép nghệ thuật */}
            <div className="text-4xl sm:text-5xl font-serif text-sky-500/25 leading-none mb-1">
              “
            </div>

            {/* Trích dẫn cảm nhận chính */}
            <p className="text-slate-700 text-sm sm:text-base leading-relaxed italic mb-6 min-h-[90px] font-medium">
              {current.quote}
            </p>

            {/* Radar Score Bars: Điểm số chi tiết từng tiêu chí */}
            <div className="space-y-2.5 bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Chấm Điểm Trải Nghiệm</span>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Rất Xuất Sắc
                </span>
              </div>
              {current.scores.map((sc, sIdx) => (
                <div key={sIdx}>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>{sc.label}</span>
                    <span className="text-sky-600 font-extrabold">{sc.score}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 to-rose-400 rounded-full transition-all duration-700 ease-out"
                      style={{ width: sc.pct }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Phần dưới: Thông tin người đánh giá */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={current.avatar}
                  alt={current.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-sky-400 shadow-sm"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center text-[9px] shadow-2xs">
                  ✓
                </span>
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5 truncate">
                  {current.name}
                  <span className="text-[11px] font-normal text-slate-400">{current.username}</span>
                </h4>
                <p className="text-xs text-sky-600 font-semibold truncate">{current.dish}</p>
              </div>
            </div>

            <span className="text-xs font-semibold text-slate-500 bg-slate-100/90 px-3 py-1.5 rounded-full shrink-0">
              {current.date}
            </span>
          </div>
        </div>
      </div>

      {/* ================= CỘT PHẢI: INTERACTIVE CARD STACK (6/12) ================= */}
      <div className="lg:col-span-6 flex flex-col justify-between space-y-3 sm:space-y-3.5">
        {reviews.map((rev, idx) => {
          const isActive = activeIdx === idx;
          return (
            <div
              key={rev.id}
              onClick={() => setActiveIdx(idx)}
              className={`rounded-2xl p-4 sm:p-5 border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isActive
                  ? 'bg-white border-sky-500 shadow-xl ring-1 ring-sky-500/30 translate-x-1 sm:translate-x-2'
                  : 'bg-white border-slate-200/80 hover:bg-slate-50/70 hover:border-slate-300 shadow-xs'
              }`}
            >
              {/* Dải màu bên trái khi active */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-sky-500 to-rose-500" />
              )}

              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={rev.avatar}
                    alt={rev.name}
                    className={`w-10 h-10 rounded-full object-cover border-2 transition-transform ${
                      isActive ? 'border-sky-500 scale-105' : 'border-slate-200'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-black text-slate-800 truncate">
                        {rev.name}
                      </h4>
                      {isActive && (
                        <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.2 rounded-full border border-sky-200/60 hidden sm:inline-block">
                          ✦ Đang xem
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                      {rev.role}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                  {rev.dish}
                </span>
              </div>

              {/* Đoạn trích dẫn ngắn */}
              <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 italic mb-2.5 pl-0.5">
                {rev.quote}
              </p>

              {/* Hàng dưới: số sao & ngày đánh giá */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1 text-amber-400 text-xs">
                  {'★'.repeat(rev.rating)}
                </div>

                <span className="text-[11px] text-slate-400 font-medium">
                  {rev.date}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Component hiển thị text với hiệu ứng Kinetic Split Chars (chữ bay vào từ các góc và xoay ngẫu nhiên giống GSAP SplitText + back.out)
const KineticSplitCharText = ({
  text = '',
  progress = 0,
  className = '',
  charClassName = '',
  activeColor = 'text-slate-800',
  inactiveColor = 'text-slate-300/80',
  stagger = 0.85
}) => {
  const words = text.split(' ');
  let charCounter = 0;
  const totalChars = Math.max(text.length, 1);

  return (
    <span className={`inline-block select-text ${className}`}>
      {words.map((word, wIdx) => {
        const chars = Array.from(word);
        const wordChars = chars.map((char) => {
          const charIndex = charCounter++;
          // Tính toán offset ngẫu nhiên nhưng ổn định (deterministic seed)
          const seed = (charIndex * 41 + 17) % 100;
          const randomY = ((seed % 40) - 20) * 1.6; // Tương đương yPercent: random(-200, 200)
          const randomRotate = ((seed % 30) - 15) * 1.4; // Tương đương rotation: random(-20, 20)

          // Ngưỡng xuất hiện của ký tự
          const threshold = (charIndex / totalChars) * stagger;
          const charP = Math.min(Math.max((progress - threshold) / 0.16, 0), 1);
          const isSettled = charP >= 0.96;

          // Nội suy vị trí chuyển động: từ vị trí bay ngẫu nhiên về vị trí gốc
          const currentY = (1 - charP) * randomY;
          const currentRotate = (1 - charP) * randomRotate;
          const currentScale = 0.75 + 0.25 * charP;

          return (
            <span
              key={charIndex}
              className={`inline-block will-change-transform ${charClassName}`}
              style={{
                transform: `translate3d(0, ${currentY}px, 0) rotate(${currentRotate}deg) scale(${currentScale})`,
                opacity: Math.max(charP, 0.18),
                filter: isSettled ? 'none' : `blur(${(1 - charP) * 2.5}px)`,
                transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out, filter 0.3s ease-out'
              }}
            >
              <span className={`transition-colors duration-200 ${isSettled ? activeColor : inactiveColor}`}>
                {char}
              </span>
            </span>
          );
        });

        charCounter++; // Dấu cách giữa các từ

        return (
          <span key={wIdx} className="inline-block whitespace-nowrap mr-[0.28em]">
            {wordChars}
          </span>
        );
      })}
    </span>
  );
};

// Helper tạo số giả ngẫu nhiên dựa trên chuỗi để luôn đồng nhất giữa các lần render
const pseudoRandom = (seed, min, max) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const val = Math.abs(Math.sin(hash));
  return min + val * (max - min);
};

// Hàm gia tốc back.out(1.2) chuẩn GSAP
const easeBackOut = (t) => {
  const c1 = 1.2;
  const c3 = c1 + 1;
  const clamped = Math.min(Math.max(t, 0), 1);
  return 1 + c3 * Math.pow(clamped - 1, 3) + c1 * Math.pow(clamped - 1, 2);
};

// Pre-compute và cache dữ liệu SplitText để đạt hiệu năng 60-120 FPS tối đa khi cuộn
const splitDataCache = new Map();

const getSplitData = (text) => {
  if (!text) return [];
  if (splitDataCache.has(text)) return splitDataCache.get(text);
  const words = text.split(' ');
  let charGlobalIdx = 0;
  const result = words.map((word) => {
    return word.split('').map((ch) => {
      const idx = charGlobalIdx++;
      return {
        ch,
        initY: pseudoRandom(`y_${text}_${idx}_${ch}`, -200, 200),
        initRot: pseudoRandom(`r_${text}_${idx}_${ch}`, -20, 20),
        staggerStart: Math.min(idx * 0.03, 0.35)
      };
    });
  });
  splitDataCache.set(text, result);
  return result;
};

// Component SplitText cho từng chữ cái áp dụng hiệu ứng gsap.from(char, { yPercent: random(-200, 200), rotation: random(-20, 20), ease: 'back.out(1.2)' })
const SplitTextAnimation = ({ text, progress, className = '', charClassName = '' }) => {
  const wordsData = useMemo(() => getSplitData(text), [text]);
  if (!text) return null;

  // Khi đã vào vị trí hoàn chỉnh (progress >= 1), render text thuần túy để giải phóng hàng trăm DOM nodes & GPU transform
  if (progress >= 1) {
    return <span className={`inline-block ${className}`}>{text}</span>;
  }
  if (progress <= 0) {
    return <span className={`inline-block opacity-0 ${className}`}>{text}</span>;
  }

  return (
    <span className={`inline-block ${className}`}>
      {wordsData.map((wordChars, wIdx) => (
        <span key={wIdx} className="inline-block whitespace-nowrap mr-[0.25em]">
          {wordChars.map((item, cIdx) => {
            const rawP = Math.min(Math.max((progress - item.staggerStart) / (1 - item.staggerStart), 0), 1);
            const easedP = easeBackOut(rawP);
            const currentY = (1 - easedP) * item.initY;
            const currentRot = (1 - easedP) * item.initRot;
            // Đảm bảo chữ luôn hiển thị rõ ràng, không bao giờ bị mất
            const currentOpacity = 0.6 + easedP * 0.4;
            const currentScale = 0.75 + easedP * 0.25;

            return (
              <span
                key={cIdx}
                className={`inline-block will-change-transform ${charClassName}`}
                style={{
                  transform: `translate3d(0, ${currentY}%, 0) rotate(${currentRot}deg) scale(${currentScale})`,
                  opacity: currentOpacity
                }}
              >
                {item.ch}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
};

// Component Cuộn Ngang 4 Bước Quy Trình Bằng Chuột (Giữ nguyên thẻ chữ nhật, kéo hết thẻ cuối, SplitText animation)
const ProcessHorizontalGallery = ({ isVisible = false, sectionRef }) => {
  const stripRef = useRef(null);
  const containerRef = useRef(null);
  const [scrollP, setScrollP] = useState(0);
  const [maxScrollX, setMaxScrollX] = useState(0);

  const steps = [
    {
      badge: 'Bột Mì Men Tự Nhiên',
      title: 'Bánh Mì Nướng Mới',
      subtitle: 'Nướng Mới Mỗi Sáng Lúc 6:00',
      desc: 'Bột mì cao cấp được ủ men tự nhiên suốt 18 tiếng, nướng mới mỗi sáng lúc 6h để lớp vỏ luôn giòn rụm và ruột bánh mềm xốp thơm ngậy vị bơ.',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop',
      stats: [
        { label: 'Ủ men tự nhiên', val: '18 Giờ' },
        { label: 'Nhiệt độ lò', val: '220°C' },
        { label: 'Mẻ đầu ngày', val: '6:00 Sáng' }
      ]
    },
    {
      badge: '100% Bò Tươi Nhập Khẩu',
      title: 'Thịt Bò Thượng Hạng',
      subtitle: 'Áp Chảo Lửa Lớn Khóa Trọn Vị Juicy',
      desc: 'Thịt bò tươi nhập khẩu xay mới trong ngày với tỷ lệ vàng 80% nạc - 20% mỡ, áp chảo nhiệt độ cao để khóa trọn dòng nước thịt ngọt lịm mọng nước.',
      image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop',
      stats: [
        { label: 'Tỷ lệ nạc mỡ', val: '80 / 20' },
        { label: 'Áp chảo 2 mặt', val: '180 Giây' },
        { label: 'Tiêu chuẩn', val: 'Nhập Khẩu' }
      ]
    },
    {
      badge: 'Nông Trại Hữu Cơ Đà Lạt',
      title: 'Rau Củ Chuẩn VietGAP',
      subtitle: 'Thu Hoạch Sáng Sớm • Sơ Chế Lạnh 4°C',
      desc: 'Xà lách thủy canh giòn ngọt, cà chua bi mọng nước được thu hoạch từ sáng sớm tại Đà Lạt, bảo quản lạnh 4°C giữ trọn vitamin và khoáng chất.',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1200&auto=format&fit=crop',
      stats: [
        { label: 'Chứng nhận', val: 'VietGAP' },
        { label: 'Sơ chế lạnh', val: '4°C' },
        { label: 'Thu hoạch', val: 'Trong 24h' }
      ]
    },
    {
      badge: 'Công Thức Gia Truyền',
      title: 'Nước Sốt Độc Quyền',
      subtitle: 'Hòa Quyện Từ 12 Loại Thảo Mộc Tự Nhiên',
      desc: 'Linh hồn tạo nên hương vị khó quên: Công thức sốt gia truyền hòa quyện tinh tế từ 12 loại thảo mộc thiên nhiên, cân bằng hoàn hảo giữa béo ngậy và thanh mát.',
      image: 'https://images.unsplash.com/photo-1586816001966-79b736744398?q=80&w=1200&auto=format&fit=crop',
      stats: [
        { label: 'Nguyên liệu sốt', val: '12 Thảo Mộc' },
        { label: 'Nghiên cứu R&D', val: '5 Năm' },
        { label: 'Hương vị', val: 'Độc Quyền' }
      ]
    },
    {
      badge: 'Giao Hàng Thần Tốc',
      title: 'Bàn Tiệc Sẵn Sàng',
      subtitle: 'Giao Nóng Hổi Tận Tay Dưới 30 Phút',
      desc: 'Chiếc burger hoàn thiện được đóng gói giữ nhiệt và trao tận tay bạn vẫn bốc khói thơm lừng, sẵn sàng cho những khoảnh khắc ẩm thực thăng hoa.',
      image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=1200&auto=format&fit=crop',
      stats: [
        { label: 'Thời gian giao', val: '< 30 Phút' },
        { label: 'Đóng gói', val: 'Eco-Friendly' },
        { label: 'Hài lòng', val: '99.8%' }
      ]
    }
  ];

  useEffect(() => {
    const calcDimensions = () => {
      if (stripRef.current) {
        const strip = stripRef.current;
        const windowW = window.innerWidth;
        const children = strip.children;
        const lastChild = children[children.length - 1];

        if (lastChild) {
          // Tọa độ mép phải thực tế của thẻ cuối cùng tính từ mép trái strip
          const lastChildRight = lastChild.offsetLeft + lastChild.offsetWidth;
          // Khoảng đệm lề phải đồng bộ đều với lề trái (px-4 = 16px, sm:px-6 = 24px, lg:px-8 = 32px)
          const edgePadding = windowW >= 1024 ? 32 : windowW >= 640 ? 24 : 16;
          // Thẻ cuối cùng kéo đều sát tới mép lề phải, loại bỏ hoàn toàn khoảng trắng trống thừa
          const max = Math.max(lastChildRight - windowW + edgePadding, 0);
          setMaxScrollX(max);
        } else {
          const edgePadding = windowW >= 1024 ? 32 : windowW >= 640 ? 24 : 16;
          const max = Math.max(strip.scrollWidth - windowW + edgePadding, 0);
          setMaxScrollX(max);
        }
      }
    };

    calcDimensions();
    window.addEventListener('resize', calcDimensions);
    const timer1 = setTimeout(calcDimensions, 200);
    const timer2 = setTimeout(calcDimensions, 600);

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const el = containerRef.current;
          if (el) {
            const rect = el.getBoundingClientRect();
            const totalScrollable = rect.height - window.innerHeight;
            if (totalScrollable > 0) {
              const scrolled = -rect.top;
              const p = Math.min(Math.max(scrolled / totalScrollable, 0), 1);
              setScrollP(p);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('resize', calcDimensions);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const currentTranslateX = scrollP * maxScrollX;

  // Tính toán tiến trình SplitText cho từng thẻ dựa theo tọa độ thực tế trên màn hình
  const getCardTextProgress = (idx) => {
    if (idx === 0 && scrollP < 0.15) return 1;
    if (idx === steps.length - 1 && scrollP > 0.85) return 1;
    const strip = stripRef.current;
    if (!strip || !strip.children[idx]) {
      const targetP = idx / (steps.length - 1);
      return Math.min(Math.max((scrollP - (targetP - 0.2)) / 0.25, 0), 1);
    }
    const cardEl = strip.children[idx];
    const screenLeft = cardEl.offsetLeft - currentTranslateX;
    const windowW = typeof window !== 'undefined' ? window.innerWidth : 1200;

    // Khi thẻ vừa chạm mép phải (100%): progress = 0
    // Khi thẻ tiến sâu vào màn hình (45%): progress = 1 (chữ ráp xong hoàn chỉnh)
    const startX = windowW;
    const endX = windowW * 0.45;
    if (screenLeft >= startX) return 0;
    if (screenLeft <= endX) return 1;
    return (startX - screenLeft) / (startX - endX);
  };

  return (
    <section
      ref={(el) => {
        containerRef.current = el;
        if (sectionRef) sectionRef.current = el;
      }}
      data-section="process"
      className="relative w-full"
      style={{ height: '340vh' }}
    >
      {/* Khung cố định ghim lại trên màn hình - Bổ sung padding-top pt-20 sm:pt-24 lg:pt-28 để tiêu đề KHÔNG BỊ NAVBAR CHE KHUẤT */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-start pt-20 sm:pt-24 lg:pt-28 pb-4 bg-gradient-to-b from-sky-50/40 via-white to-sky-50/30">
        
        {/* ================= TIÊU ĐỀ KHỐI (HIỂN THỊ RÕ RÀNG BÊN DƯỚI HEADER NAVBAR, CĂN TRÁI CONTAINER MX-AUTO PX-4) ================= */}
        <div className="container mx-auto px-4 z-20 shrink-0 mb-3 sm:mb-4 text-left">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-emerald-600 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>TỪ NÔNG TRẠI ĐẾN BÀN ĂN</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 leading-tight tracking-tight">
            Quy Trình Chuẩn Bếp{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600">
              DualeoFood
            </span>
          </h2>
        </div>

        {/* ================= DẢI ẢNH CUỘN NGANG: THẺ CHỮ NHẬT VUÔNG VẮN (KHÔNG BO TRÒN GÓC), CHỮ NỔI TRỰC TIẾP ================= */}
        <div className="horiz-gallery-wrapper w-full overflow-hidden flex-1 flex items-center my-auto py-2">
          <div
            ref={stripRef}
            className="horiz-gallery-strip flex flex-nowrap items-center gap-6 sm:gap-8 px-4 sm:px-6 lg:px-8 will-change-transform"
            style={{
              transform: `translate3d(-${currentTranslateX}px, 0, 0)`
            }}
          >
            {steps.map((item, idx) => {
              const textP = getCardTextProgress(idx);

              return (
                <div
                  key={idx}
                  className="project-wrap flex-shrink-0 w-[58vw] sm:w-[54vw] md:w-[50vw] lg:w-[48vw] min-w-[360px] max-w-[780px] group select-none"
                >
                  {/* Khung thẻ ảnh hình chữ nhật VUÔNG VẮN KHÔNG BO TRÒN GÓC (rounded-none), sang trọng */}
                  <div className="relative h-[calc(100vh-210px)] min-h-[380px] max-h-[640px] w-full rounded-none overflow-hidden border border-slate-200/80 shadow-2xl transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)] hover:scale-[1.01]">
                    
                    {/* Ảnh gốc lớn sắc nét, thẳng góc không bo tròn */}
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover object-center rounded-none group-hover:scale-105 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />

                    {/* Lớp gradient tương phản mềm mại phủ dưới đáy ảnh để chữ nổi bật sắc nét */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

                    {/* Badge góc trên */}
                    <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10">
                      <span className="px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase bg-black/40 backdrop-blur-sm border border-white/25 text-white shadow-lg">
                        {item.badge}
                      </span>
                    </div>

                    {/* KHỐI CHỮ NỔI TRỰC TIẾP TRÊN BỨC ẢNH (KHÔNG KHUNG HỘP, SIÊU MƯỢT VÀ SẮC NÉT) */}
                    <div className="absolute bottom-6 sm:bottom-8 md:bottom-10 left-6 sm:left-8 md:left-10 right-6 sm:right-8 md:right-10 z-10 text-white select-none">
                      
                      {/* Phụ đề màu vàng nổi bật */}
                      <p className="text-xs sm:text-sm font-bold text-amber-300 tracking-wider uppercase mb-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                        {item.subtitle}
                      </p>

                      {/* Tiêu đề SplitText bay chữ ngẫu nhiên, nổi bật trực tiếp trên ảnh */}
                      <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-2.5 drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)]">
                        <SplitTextAnimation text={item.title} progress={textP} />
                      </h3>

                      {/* Đoạn mô tả chữ nổi trên ảnh */}
                      <p className="text-xs sm:text-sm md:text-base text-white/95 font-medium leading-relaxed mb-4 max-w-2xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] line-clamp-2 sm:line-clamp-3">
                        {item.desc}
                      </p>

                      {/* 3 Khối chỉ số kỹ thuật nổi nhẹ nhàng trực tiếp */}
                      <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 pt-3 border-t border-white/20">
                        {item.stats.map((st, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-1.5 sm:gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                            <span className="text-xs sm:text-sm text-white/80 font-medium">
                              {st.label}:
                            </span>
                            <span className="text-xs sm:text-sm md:text-base font-bold text-white">
                              {st.val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};

// Component tiêu đề section: Căn trái, không có viền bao bọc; hỗ trợ SplitText cho các section khác, riêng section có disableSplitText={true} sẽ hiển thị liền mạch ngay lập tức
const ScrollRevealHeader = ({
  badge,
  badgeStyle = 'text-sky-600',
  badgeDot = 'bg-sky-500',
  titlePrefix = '',
  titleHighlight = '',
  titleSuffix = '',
  highlightGradient = 'from-sky-500 to-sky-600',
  description = '',
  progress = 0,
  disableSplitText = false
}) => {
  // Trích xuất mã màu chữ nếu badgeStyle có chứa class text-...
  const textColor = badgeStyle.includes('text-rose')
    ? 'text-rose-600'
    : badgeStyle.includes('text-emerald')
    ? 'text-emerald-600'
    : badgeStyle.includes('text-amber')
    ? 'text-amber-600'
    : badgeStyle.includes('text-indigo')
    ? 'text-indigo-600'
    : 'text-sky-600';

  // 1. Tiến trình Badge (0.01 -> 0.08)
  const badgeP = Math.min(Math.max((progress - 0.01) / 0.07, 0), 1);
  // 2. Tiến trình Tiêu đề SplitText (0.04 -> 0.30)
  const titleTextP = Math.min(Math.max((progress - 0.04) / 0.26, 0), 1);
  // 3. Tiến trình đoạn văn SplitText (0.12 -> 0.42)
  const descTextP = Math.min(Math.max((progress - 0.12) / 0.30, 0), 1);

  return (
    <div className="text-left max-w-3xl mb-8 sm:mb-12 select-none">
      {/* Badge thuần chữ không khung viền bao bọc - Căn lề trái */}
      {badge && (
        <div className={`flex items-center gap-2 text-xs sm:text-sm font-extrabold tracking-widest uppercase mb-2.5 ${textColor}`}>
          {badgeDot && <span className={`w-2 h-2 rounded-full ${badgeDot} animate-pulse shrink-0`} />}
          <span>{badge}</span>
        </div>
      )}

      {/* Tiêu đề chính h2 - Căn lề trái; nếu disableSplitText thì hiển thị liền mạch 100%, nếu không thì chạy SplitText bay chữ */}
      <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-800 mb-3 sm:mb-4 leading-tight tracking-tight">
        {disableSplitText ? (
          <>
            {titlePrefix && <span className="text-slate-800">{titlePrefix}</span>}
            {titleHighlight && (
              <span className={`text-transparent bg-clip-text bg-gradient-to-r ${highlightGradient}`}>
                {titleHighlight}
              </span>
            )}
            {titleSuffix && <span className="text-slate-800">{titleSuffix}</span>}
          </>
        ) : (
          <>
            {titlePrefix && (
              <SplitTextAnimation
                text={titlePrefix}
                progress={titleTextP}
                className="text-slate-800"
              />
            )}
            {titleHighlight && (
              <SplitTextAnimation
                text={titleHighlight}
                progress={titleTextP}
                className={`text-transparent bg-clip-text bg-gradient-to-r ${highlightGradient}`}
                charClassName={`text-transparent bg-clip-text bg-gradient-to-r ${highlightGradient}`}
              />
            )}
            {titleSuffix && (
              <SplitTextAnimation
                text={titleSuffix}
                progress={titleTextP}
                className="text-slate-800"
              />
            )}
          </>
        )}
      </h2>

      {/* Đoạn mô tả - Căn lề trái */}
      {description && (
        disableSplitText ? (
          <p className="text-xs sm:text-base md:text-lg leading-relaxed text-slate-600 font-medium text-left max-w-2xl">
            {description}
          </p>
        ) : (
          <div className="text-xs sm:text-base md:text-lg leading-relaxed text-slate-600 font-medium text-left max-w-2xl">
            <SplitTextAnimation
              text={description}
              progress={descTextP}
              className="text-slate-600 font-medium"
            />
          </div>
        )
      )}
    </div>
  );
};

const About = () => {
  // 1. Khởi tạo Lenis Smooth Scroll siêu mượt theo quán tính (tinh chỉnh độ trễ tự nhiên 0.85s, không bị ghìm tay cuộn)
  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.85,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
    });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // 2. Khởi tạo hook confetti
  const { fireFromElement } = useConfetti();

  // State và Ref dùng cho hiệu ứng cuộn trang
  const [visibleSections, setVisibleSections] = useState({
    banner: false,
    story: false,
    process: false,
    values: false,
    timeline: false,
    team: false,
    reviews: false,
    cta: false
  });

  const bannerRef = useRef(null);
  const storyRef = useRef(null);
  const processRef = useRef(null);
  const valuesRef = useRef(null);
  const timelineRef = useRef(null);
  const teamRef = useRef(null);
  const reviewsRef = useRef(null);
  const ctaRef = useRef(null);
  const storyContentRef = useRef(null);
  const storyImageRef = useRef(null);
  const [storyImageProgress, setStoryImageProgress] = useState(0);
  const [storyScrollProgress, setStoryScrollProgress] = useState(0);
  const [valuesProgress, setValuesProgress] = useState(0);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [teamProgress, setTeamProgress] = useState(0);
  const [reviewsProgress, setReviewsProgress] = useState(0);
  const [activeMilestone, setActiveMilestone] = useState(0);
  const [milestoneScrollP, setMilestoneScrollP] = useState([0, 0, 0, 0]);

  // Ref lưu giá trị cuộn trước đó để loại bỏ 90% re-render React thừa thãi
  const scrollValuesRef = useRef({
    storyScrollProgress: 0,
    storyImageProgress: 0,
    valuesProgress: 0,
    timelineProgress: 0,
    teamProgress: 0,
    reviewsProgress: 0,
    activeMilestone: 0,
    milestoneScrollP: [0, 0, 0, 0]
  });

  // Mảng từ ngữ cho đoạn 1 (phục vụ hiệu ứng hiện chữ từ từ theo bước cuộn)
  const paragraph1Words = [
    "Được", "thành", "lập", "từ", "một", "căn", "bếp", "nhỏ", "với", "niềm",
    "đam", "mê", "bất", "tận", "dành", "cho", "Fast Food,", "DualeoFood",
    "không", "ngừng", "nỗ", "lực", "để", "tạo", "ra", "những", "hương", "vị", "độc", "bản."
  ];

  // Mảng từ ngữ cho đoạn 2
  const paragraph2Words = [
    "Chúng", "tôi", "tin", "rằng,", "một", "bữa", "ăn", "nhanh", "không", "chỉ",
    "cần", "\"nhanh\"", "mà", "còn", "phải", "đảm", "bảo", "dinh", "dưỡng,", "sử",
    "dụng", "thịt", "bò", "100%", "nguyên", "chất", "tươi", "ngon", "cùng", "lớp",
    "bánh", "mì", "mềm", "xốp", "được", "nướng", "mới", "mỗi", "sáng."
  ];

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
    if (processRef.current) observer.observe(processRef.current);
    if (valuesRef.current) observer.observe(valuesRef.current);
    if (timelineRef.current) observer.observe(timelineRef.current);
    if (teamRef.current) observer.observe(teamRef.current);
    if (reviewsRef.current) observer.observe(reviewsRef.current);
    if (ctaRef.current) observer.observe(ctaRef.current);

    // --- TÍNH TIẾN TRÌNH CUỘN BÁM SÁT 100% THEO TAY CUỘN (60FPS BẰNG RAF) ---
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const windowHeight = window.innerHeight;
          const sv = scrollValuesRef.current;

          // 1. Khối Câu Chuyện Thương Hiệu (Story)
          if (storyContentRef.current) {
            const rect = storyContentRef.current.getBoundingClientRect();
            if (rect.top <= windowHeight && rect.bottom >= 0) {
              const startPoint = windowHeight * 0.85;
              const endPoint = windowHeight * 0.20;
              const progress = Math.min(Math.max((startPoint - rect.top) / (startPoint - endPoint), 0), 1);
              if (Math.abs(progress - sv.storyScrollProgress) > 0.008 || (progress === 0 && sv.storyScrollProgress !== 0) || (progress === 1 && sv.storyScrollProgress !== 1)) {
                sv.storyScrollProgress = progress;
                setStoryScrollProgress(progress);
              }
            } else if (rect.top > windowHeight && sv.storyScrollProgress !== 0) {
              sv.storyScrollProgress = 0;
              setStoryScrollProgress(0);
            } else if (rect.bottom < 0 && sv.storyScrollProgress !== 1) {
              sv.storyScrollProgress = 1;
              setStoryScrollProgress(1);
            }
          }

          // 1.1 Tấm ảnh burger cạnh Câu chuyện DualeoFood
          if (storyImageRef.current) {
            const rect = storyImageRef.current.getBoundingClientRect();
            if (rect.top <= windowHeight && rect.bottom >= 0) {
              const startPoint = windowHeight * 0.95;
              const endPoint = windowHeight * 0.35;
              const progress = Math.min(Math.max((startPoint - rect.top) / (startPoint - endPoint), 0), 1);
              if (Math.abs(progress - sv.storyImageProgress) > 0.008 || (progress === 0 && sv.storyImageProgress !== 0) || (progress === 1 && sv.storyImageProgress !== 1)) {
                sv.storyImageProgress = progress;
                setStoryImageProgress(progress);
              }
            } else if (rect.top > windowHeight && sv.storyImageProgress !== 0) {
              sv.storyImageProgress = 0;
              setStoryImageProgress(0);
            } else if (rect.bottom < 0 && sv.storyImageProgress !== 1) {
              sv.storyImageProgress = 1;
              setStoryImageProgress(1);
            }
          }

          // 3. Khối 3 Tiêu Chí Vàng (VÌ SAO CHỌN DUALEOFOOD)
          if (valuesRef.current) {
            const rect = valuesRef.current.getBoundingClientRect();
            if (rect.top <= windowHeight && rect.bottom >= 0) {
              const startPoint = windowHeight * 0.85;
              const totalDistance = rect.height * 0.75 + windowHeight * 0.25;
              const progress = Math.min(Math.max((startPoint - rect.top) / totalDistance, 0), 1);
              if (Math.abs(progress - sv.valuesProgress) > 0.01 || (progress === 0 && sv.valuesProgress !== 0) || (progress === 1 && sv.valuesProgress !== 1)) {
                sv.valuesProgress = progress;
                setValuesProgress(progress);
              }
            }
          }

          // 4. Khối Dòng Thời Gian (CHẶNG ĐƯỜNG TỰ HÀO - TIMELINE)
          if (timelineRef.current) {
            const rect = timelineRef.current.getBoundingClientRect();
            if (rect.top <= windowHeight && rect.bottom >= 0) {
              const startPoint = windowHeight * 0.85;
              const totalDistance = rect.height * 0.85;
              const progress = Math.min(Math.max((startPoint - rect.top) / totalDistance, 0), 1);
              if (Math.abs(progress - sv.timelineProgress) > 0.01 || (progress === 0 && sv.timelineProgress !== 0) || (progress === 1 && sv.timelineProgress !== 1)) {
                sv.timelineProgress = progress;
                setTimelineProgress(progress);
              }

              const targetLine = windowHeight * 0.45;
              let currentActive = 0;
              const cardP = [0, 0, 0, 0];
              let hasCardPChanged = false;

              for (let i = 0; i < 4; i++) {
                const el = document.getElementById(`heritage-milestone-${i}`);
                if (el) {
                  const elRect = el.getBoundingClientRect();
                  if (elRect.top <= targetLine) {
                    currentActive = i;
                  }
                  const p = Math.min(Math.max((windowHeight * 0.85 - elRect.top) / (windowHeight * 0.50), 0), 1);
                  cardP[i] = p;
                  if (Math.abs(p - sv.milestoneScrollP[i]) > 0.02) {
                    hasCardPChanged = true;
                  }
                }
              }

              if (currentActive !== sv.activeMilestone) {
                sv.activeMilestone = currentActive;
                setActiveMilestone(currentActive);
              }

              if (hasCardPChanged) {
                sv.milestoneScrollP = cardP;
                setMilestoneScrollP(cardP);
              }
            }
          }

          // 5. Khối Đội Ngũ Đầu Bếp (LINH HỒN CỦA DUALEOFOOD)
          if (teamRef.current) {
            const rect = teamRef.current.getBoundingClientRect();
            if (rect.top <= windowHeight && rect.bottom >= 0) {
              const startPoint = windowHeight * 0.85;
              const totalDistance = rect.height * 0.75 + windowHeight * 0.25;
              const progress = Math.min(Math.max((startPoint - rect.top) / totalDistance, 0), 1);
              if (Math.abs(progress - sv.teamProgress) > 0.01 || (progress === 0 && sv.teamProgress !== 0) || (progress === 1 && sv.teamProgress !== 1)) {
                sv.teamProgress = progress;
                setTeamProgress(progress);
              }
            }
          }

          // 6. Khối Bức Tường Yêu Thương (YÊU THƯƠNG TỪ THỰC KHÁCH)
          if (reviewsRef.current) {
            const rect = reviewsRef.current.getBoundingClientRect();
            if (rect.top <= windowHeight && rect.bottom >= 0) {
              const startPoint = windowHeight * 0.85;
              const totalDistance = rect.height * 0.75 + windowHeight * 0.25;
              const progress = Math.min(Math.max((startPoint - rect.top) / totalDistance, 0), 1);
              if (Math.abs(progress - sv.reviewsProgress) > 0.01 || (progress === 0 && sv.reviewsProgress !== 0) || (progress === 1 && sv.reviewsProgress !== 1)) {
                sv.reviewsProgress = progress;
                setReviewsProgress(progress);
              }
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Cập nhật ngay tiến trình khi vừa vào trang

    // --- DỌN DẸP KHI COMPONENT UNMOUNT ---
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // Mảng rỗng đảm bảo useEffect chỉ chạy một lần khi mount

  // Tiến trình trượt mượt mà từ dưới lên cho 2 thẻ thống kê theo bước cuộn
  const stat1Progress = Math.min(Math.max((storyScrollProgress - 0.70) / 0.22, 0), 1);
  const stat2Progress = Math.min(Math.max((storyScrollProgress - 0.76) / 0.22, 0), 1);

  // Tiến trình cho tấm ảnh burger cạnh Câu chuyện DualeoFood (chạy từ dưới lên & từ mờ sang rõ)
  const burgerImgOpacity = 0.2 + storyImageProgress * 0.8;
  const burgerImgTranslateY = (1 - storyImageProgress) * 75;
  const burgerImgScale = 0.92 + storyImageProgress * 0.08;
  const burgerImgBlur = (1 - storyImageProgress) * 10;

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
        .water-fill-overlay {
          clip-path: circle(0% at 0% 100%);
          transition: clip-path 0.7s cubic-bezier(0.25, 1, 0.4, 1);
        }
        .group:hover .water-fill-overlay {
          clip-path: circle(160% at 0% 100%);
        }
        @keyframes waterfall-flow-down {
          0% { background-position: 0 0; }
          100% { background-position: 0 120px; }
        }
        .animate-waterfall-flow-down {
          background-image: repeating-linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.75) 0px,
            rgba(255, 255, 255, 0.95) 16px,
            rgba(56, 189, 248, 0.25) 30px,
            rgba(2, 132, 199, 0.6) 48px,
            rgba(255, 255, 255, 0.8) 64px,
            rgba(186, 230, 253, 0.4) 80px,
            rgba(255, 255, 255, 0.75) 120px
          );
          animation: waterfall-flow-down 0.75s linear infinite;
        }
        @keyframes water-spray {
          0% { transform: scale(0.6) translateY(0); opacity: 0.9; }
          50% { transform: scale(1.15) translateY(-5px); opacity: 1; }
          100% { transform: scale(1.3) translateY(-9px); opacity: 0; }
        }
        .animate-water-spray {
          animation: water-spray 0.9s ease-out infinite;
        }
        @keyframes foam-churn {
          0%, 100% { transform: scale(1) translateY(0); opacity: 0.95; }
          50% { transform: scale(1.08) translateY(-2px); opacity: 0.8; }
        }
        .animate-foam-churn {
          animation: foam-churn 1.2s ease-in-out infinite;
        }
        @keyframes water-shimmer {
          0% { transform: translateX(-120%) skewX(-15deg); }
          100% { transform: translateX(220%) skewX(-15deg); }
        }
        .animate-water-shimmer {
          animation: water-shimmer 2.2s ease-in-out infinite;
        }
        @keyframes water-vertical-stream {
          0% { stroke-dashoffset: 40; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes fish-leap {
          0% {
            transform: translate(-50px, 30px) rotate(-55deg) scale(0.6);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          50% {
            transform: translate(0px, -50px) rotate(5deg) scale(1.15);
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translate(50px, 30px) rotate(65deg) scale(0.6);
            opacity: 0;
          }
        }
        .animate-fish-leap {
          animation: fish-leap 2.2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
        }
        @keyframes plant-leaf-sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(5deg); }
        }
        .animate-plant-sway {
          animation: plant-leaf-sway 3s ease-in-out infinite;
        }
      `}</style>

      {/* ================= SECTION 1: HERO BANNER ================= */}
      <section
        ref={bannerRef}
        data-section="banner"
        className={`relative bg-mesh py-12 sm:py-20 md:py-32 overflow-hidden rounded-b-[2.5rem] md:rounded-b-[4rem] shadow-sm transition-opacity duration-1000 ${visibleSections.banner ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="absolute inset-0 backdrop-blur-[2px]"></div> {/* Glassmorphism nhẹ */}
        <div className="container mx-auto px-4 text-center z-10 relative">
          <div className="inline-block mb-4 sm:mb-6">
            <span className="bg-white/80 backdrop-blur-md text-sky-600 font-bold tracking-widest uppercase text-xs md:text-sm px-4 sm:px-6 py-1.5 sm:py-2 rounded-full border border-sky-100 shadow-sm">
              ✨ Về Chúng Tôi
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-slate-800 mb-4 sm:mb-8 drop-shadow-sm leading-tight">
            Câu Chuyện Của <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-sky-600">
              DualeoFood
            </span>
          </h1>
          <p className="text-gray-600/90 text-xs sm:text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed font-medium">
            Hành trình mang đến những chiếc burger ngon nhất, đậm đà nhất và ngập tràn tình yêu ẩm thực từ nhà bếp đến bàn ăn của bạn.
          </p>
        </div>

        {/* Background Decorations */}
        <div className="absolute top-10 left-10 text-4xl sm:text-6xl md:text-8xl opacity-30 animate-float-slow pointer-events-none select-none">🍔</div>
        <div className="absolute bottom-10 right-20 text-4xl sm:text-6xl md:text-8xl opacity-30 animate-float-slow pointer-events-none select-none" style={{ animationDelay: '1s' }}>🍟</div>
        <div className="absolute top-20 right-1/4 text-3xl sm:text-4xl md:text-6xl opacity-30 animate-float-slow pointer-events-none select-none" style={{ animationDelay: '2s' }}>🥤</div>

        {/* Glow orb */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-sky-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 pointer-events-none"></div>
      </section>

      {/* ================= SECTION 2: CÂU CHUYỆN THƯƠNG HIỆU ================= */}
      <section
        ref={storyRef}
        data-section="story"
        className={`container mx-auto px-4 py-12 sm:py-20 md:py-32 transition-all duration-1000 transform ${visibleSections.story ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
      >
        <div className="flex flex-col md:flex-row items-center gap-8 sm:gap-16 md:gap-24">
          {/* Tấm ảnh burger với hiệu ứng cuộn từ dưới chạy lên, từ mờ sang rõ ràng */}
          <div 
            ref={storyImageRef}
            className="w-full md:w-1/2 relative transform-gpu"
            style={{
              opacity: burgerImgOpacity,
              transform: `translateY(${burgerImgTranslateY}px) scale(${burgerImgScale})`,
              filter: `blur(${burgerImgBlur}px)`,
              transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease-out, filter 0.35s ease-out',
              willChange: 'transform, opacity, filter'
            }}
          >
            <div 
              className="absolute -inset-2 sm:-inset-4 bg-gradient-to-tr from-sky-200/50 to-blue-200/30 rounded-3xl md:rounded-[2.5rem] filter blur-xl -z-10 transition-all duration-500"
              style={{
                opacity: 0.3 + storyImageProgress * 0.7,
                transform: `scale(${0.9 + storyImageProgress * 0.1})`
              }}
            ></div>
            <div className="relative overflow-hidden shadow-2xl rounded-3xl md:rounded-[2.5rem] border-[4px] sm:border-[8px] border-white bg-sky-100 group">
              <img
                src="https://images.unsplash.com/photo-1586816001966-79b736744398?q=80&w=1000&auto=format&fit=crop"
                alt="Làm burger"
                className="w-full h-[260px] sm:h-[350px] md:h-[450px] object-cover group-hover:scale-105 transition duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 sm:p-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white font-bold text-lg sm:text-2xl tracking-wide transform translate-y-4 group-hover:translate-y-0 transition duration-300">
                  Được chế biến thủ công mỗi ngày 🧑‍🍳
                </p>
              </div>
            </div>

            {/* Huy hiệu nhỏ trang trí */}
            <div 
              className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 bg-white p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xl border border-sky-50 animate-bounce delay-150 transition-all duration-500"
              style={{
                opacity: storyImageProgress > 0.4 ? 1 : 0,
                transform: `scale(${Math.min(Math.max((storyImageProgress - 0.4) / 0.5, 0), 1)})`
              }}
            >
              <span className="text-2xl sm:text-4xl">🌟</span>
            </div>
          </div>

          {/* Nội dung với hiệu ứng Scroll-Driven Reveal mượt mà */}
          <div ref={storyContentRef} className="w-full md:w-1/2 space-y-4 sm:space-y-8 relative">
            <div className="absolute -top-10 -left-10 text-9xl text-sky-50 opacity-50 z-0 select-none font-serif pointer-events-none">"</div>
            <div className="relative z-10">

              {/* Badge chỉ báo nhẹ - Không khung viền bao bọc */}
              <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold tracking-widest uppercase text-sky-600 mb-2.5">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shrink-0"></span>
                <span>CÂU CHUYỆN DUALEOFOOD</span>
              </div>

              {/* Tiêu đề hiện chữ theo tiến trình cuộn */}
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black leading-tight">
                <span className={`transition-colors duration-300 ${storyScrollProgress >= 0.05 ? 'text-slate-800' : 'text-slate-300 opacity-40'}`}>
                  Ngon Từ Nguyên Liệu,
                </span>{' '}
                <br />
                <span className={`transition-all duration-300 ${storyScrollProgress >= 0.12 ? 'text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-sky-600' : 'text-slate-300 opacity-40'}`}>
                  Đậm Từ Đam Mê
                </span>
                {storyScrollProgress >= 0.05 && storyScrollProgress < 0.18 && (
                  <span className="inline-block w-1.5 sm:w-2 h-5 sm:h-8 bg-sky-500 rounded-full animate-pulse ml-1.5 sm:ml-2 align-middle"></span>
                )}
              </h2>

              {/* Đường gạch chân gradient tự động nở dài từ 0px đến 96px theo tay cuộn */}
              <div
                className="h-1.5 sm:h-2 bg-gradient-to-r from-sky-400 to-sky-600 rounded-full mt-3 sm:mt-6 transition-all duration-200 origin-left"
                style={{
                  width: `${Math.min(Math.max((storyScrollProgress - 0.08) / 0.12, 0), 1) * 96}px`,
                  opacity: storyScrollProgress >= 0.08 ? 1 : 0
                }}
              ></div>

              <div className="mt-4 sm:mt-8 space-y-3 sm:space-y-6">

                {/* Đoạn 1: Từng từ sáng lên và hiện rõ theo bước kéo chuột */}
                <p className="text-sm sm:text-xl leading-relaxed">
                  {paragraph1Words.map((word, idx) => {
                    const threshold = 0.18 + (idx / paragraph1Words.length) * 0.34;
                    const isRevealed = storyScrollProgress >= threshold;
                    const nextThreshold = 0.18 + ((idx + 1) / paragraph1Words.length) * 0.34;
                    const isCurrent = isRevealed && storyScrollProgress < nextThreshold;

                    const isBrand = word.includes("DualeoFood");
                    const isFastFood = word.includes("Fast");

                    return (
                      <span key={idx} className="inline-block mr-1 sm:mr-1.5 transition-all duration-200">
                        <span
                          className={`transition-colors duration-200 ${isRevealed
                              ? isBrand
                                ? "text-sky-600 font-black drop-shadow-xs"
                                : isFastFood
                                  ? "text-amber-500 font-bold"
                                  : "text-slate-800 font-bold"
                              : "text-slate-300 opacity-35 font-normal"
                            }`}
                        >
                          {word}
                        </span>
                        {isCurrent && storyScrollProgress < 0.92 && (
                          <span className="inline-block w-1 sm:w-1.5 h-3.5 sm:h-5 bg-sky-500 rounded-full animate-pulse ml-0.5 align-middle shadow-xs"></span>
                        )}
                      </span>
                    );
                  })}
                </p>

                {/* Đoạn 2: Tiếp tục hiện rõ từng từ khi cuộn sâu hơn */}
                <p className="text-xs sm:text-lg leading-relaxed">
                  {paragraph2Words.map((word, idx) => {
                    const threshold = 0.52 + (idx / paragraph2Words.length) * 0.33;
                    const isRevealed = storyScrollProgress >= threshold;
                    const nextThreshold = 0.52 + ((idx + 1) / paragraph2Words.length) * 0.33;
                    const isCurrent = isRevealed && storyScrollProgress < nextThreshold;

                    const isSpecial = word.includes("100%") || word.includes("\"nhanh\"");

                    return (
                      <span key={idx} className="inline-block mr-1 sm:mr-1.5 transition-all duration-200">
                        <span
                          className={`transition-colors duration-200 ${isRevealed
                              ? isSpecial
                                ? "text-sky-600 font-black"
                                : "text-slate-700 font-semibold"
                              : "text-slate-300 opacity-35 font-normal"
                            }`}
                        >
                          {word}
                        </span>
                        {isCurrent && storyScrollProgress < 0.92 && (
                          <span className="inline-block w-1 sm:w-1.5 h-3.5 sm:h-5 bg-sky-500 rounded-full animate-pulse ml-0.5 align-middle shadow-xs"></span>
                        )}
                      </span>
                    );
                  })}
                </p>
              </div>

              {/* Stats Box: 2 thẻ thống kê trượt mượt mà từ dưới lên và hiển thị sắc nét khi cuộn */}
              <div className="pt-4 sm:pt-8 flex gap-3 sm:gap-8">
                {/* Thẻ 10K+ Khách hàng */}
                <div
                  className="flex-1"
                  style={{
                    opacity: stat1Progress,
                    transform: `translateY(${(1 - stat1Progress) * 48}px)`,
                    transition: 'transform 0.25s ease-out, opacity 0.25s ease-out'
                  }}
                >
                  <div className="bg-sky-50 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-sky-100 h-full hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-sky-100/60">
                    <p className="text-2xl sm:text-5xl font-black text-sky-600 mb-0.5 sm:mb-2">10K<span className="text-sky-400">+</span></p>
                    <p className="text-sky-800 font-bold uppercase tracking-wider text-xs sm:text-sm">Khách hàng</p>
                  </div>
                </div>

                {/* Thẻ 100% Tươi ngon (xuất hiện so le trượt từ dưới lên) */}
                <div
                  className="flex-1"
                  style={{
                    opacity: stat2Progress,
                    transform: `translateY(${(1 - stat2Progress) * 48}px)`,
                    transition: 'transform 0.25s ease-out, opacity 0.25s ease-out'
                  }}
                >
                  <div className="bg-orange-50 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-orange-100 h-full hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-orange-100/60">
                    <p className="text-2xl sm:text-5xl font-black text-orange-500 mb-0.5 sm:mb-2">100<span className="text-orange-400">%</span></p>
                    <p className="text-orange-800 font-bold uppercase tracking-wider text-xs sm:text-sm">Tươi ngon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 3: QUY TRÌNH 4 BƯỚC TẠO MÓN NGON (CUỘN NGANG KHI LĂN CHUỘT) ================= */}
      <ProcessHorizontalGallery
        sectionRef={processRef}
        isVisible={visibleSections.process}
      />

      {/* ================= SECTION 4: GIÁ TRỊ CỐT LÕI (Tối ưu gọn gàng trên Mobile) ================= */}
      <section
        ref={valuesRef}
        data-section="values"
        className="relative py-10 sm:py-16 md:py-32"
      >
        {/* Background nghiêng */}
        <div className="absolute inset-0 bg-sky-50/80 transform -skew-y-3 z-0"></div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Tiêu đề khối 3 Tiêu Chí Vàng hiện dần từ từ theo tay lăn chuột */}
          <ScrollRevealHeader
            badge="3 TIÊU CHÍ VÀNG"
            badgeStyle="bg-sky-100/80 text-sky-700 border-sky-200/60"
            badgeDot="bg-sky-500"
            titlePrefix="Vì Sao Chọn "
            titleHighlight="DualeoFood?"
            highlightGradient="from-sky-500 to-sky-600"
            description="Nguyên liệu sạch mỗi ngày, giao nhanh nóng hổi và phục vụ tận tâm từ căn bếp nhỏ."
            progress={valuesProgress}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-5 md:gap-10 lg:gap-12 px-1 sm:px-4 md:px-0">
            {[
              {
                icon: '🥩',
                title: 'Nguyên Liệu Tươi Sạch',
                desc: 'Thịt bò nhập khẩu, rau củ chuẩn VietGAP được giao mới mỗi ngày.',
                accent: 'from-rose-500 via-orange-500 to-amber-500',
                iconBg: 'from-rose-100/80 to-orange-50/80 border-rose-200/60 text-rose-600',
                badge: 'Chuẩn VietGAP'
              },
              {
                icon: '⚡',
                title: 'Giao Hàng Thần Tốc',
                desc: 'Đồ ăn luôn nóng hổi, vỏ bánh luôn giòn tan khi đến tay bạn trong 30 phút.',
                accent: 'from-amber-400 via-yellow-400 to-sky-500',
                iconBg: 'from-amber-100/80 to-sky-50/80 border-amber-200/60 text-amber-600',
                badge: 'Trong 30 Phút'
              },
              {
                icon: '💝',
                title: 'Phục Vụ Tận Tâm',
                desc: 'Mỗi món ăn là một tác phẩm nghệ thuật được chăm chút bởi các đầu bếp.',
                accent: 'from-pink-500 via-rose-400 to-sky-500',
                iconBg: 'from-pink-100/80 to-sky-50/80 border-pink-200/60 text-pink-600',
                badge: '100% Tận Tâm'
              },
            ].map((item, index) => {
              const cardThreshold = 0.10 + index * 0.25;
              const cardProgress = Math.min(Math.max((valuesProgress - cardThreshold) / 0.22, 0), 1);
              const isRevealed = cardProgress > 0.5;

              return (
                <div
                  key={index}
                  className="relative bg-white/95 backdrop-blur-xl p-4 sm:p-7 md:p-10 rounded-2xl md:rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-sky-500/20 active:scale-[0.98] border border-sky-100/80 flex flex-row md:flex-col items-center text-left md:text-center gap-3.5 sm:gap-6 md:gap-0 group transform cursor-pointer overflow-hidden transition-all duration-300"
                  style={{
                    opacity: 0.2 + cardProgress * 0.8,
                    transform: `translateY(${(1 - cardProgress) * 40}px) scale(${0.96 + cardProgress * 0.04})`
                  }}
                  onClick={handleValueBoxClick}
                >
                  {/* Hiệu ứng màu xanh nước xuất hiện từ góc dưới trái lấn lên bo tròn khắp thẻ */}
                  <div className="water-fill-overlay absolute inset-0 bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 rounded-2xl md:rounded-[2.5rem] pointer-events-none z-0"></div>

                  {/* Hiệu ứng tia sáng chiếu nhẹ trên thẻ */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100/40 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700 z-0"></div>

                  {/* Icon thẻ */}
                  <div className={`relative z-10 w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 md:mx-auto bg-gradient-to-br ${item.iconBg} group-hover:bg-white group-hover:border-white/90 rounded-xl sm:rounded-2xl md:rounded-3xl flex items-center justify-center text-2xl sm:text-3xl md:text-5xl md:mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border flex-shrink-0 shadow-sm md:shadow-md ${isRevealed ? 'scale-100' : 'scale-90'}`}>
                    {item.icon}
                  </div>

                  <div className="flex-1 min-w-0 z-10 relative">
                    <div className="flex items-center gap-2 md:justify-center mb-1 md:mb-3">
                      <h3 className={`text-sm sm:text-base md:text-2xl font-black group-hover:text-white transition-colors duration-300 ${isRevealed ? 'text-slate-800' : 'text-slate-400'}`}>
                        {item.title}
                      </h3>
                    </div>
                    <p className={`text-xs sm:text-sm md:text-lg leading-relaxed transition-colors duration-300 ${isRevealed ? 'text-gray-600 group-hover:text-white/95' : 'text-slate-400'}`}>
                      {item.desc}
                    </p>

                    {/* Badge nhỏ góc dưới */}
                    <div className="mt-2.5 md:mt-6 flex items-center gap-1.5 md:justify-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-600 text-[10px] sm:text-xs font-bold border border-sky-100 group-hover:bg-white group-hover:text-sky-600 group-hover:border-white group-hover:shadow-md transition-all duration-300">
                        <span>✨</span> {item.badge}
                      </span>
                      <span className="text-[10px] text-gray-400 group-hover:text-white/80 font-medium hidden sm:inline-block transition-colors duration-300">
                        (Bấm để nổ pháo hoa 🎉)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SECTION 5: DÒNG THỜI GIAN HÀNH TRÌNH ================= */}
      <section
        ref={timelineRef}
        data-section="timeline"
        className={`container mx-auto px-4 py-12 sm:py-20 md:py-28 transition-all duration-1000 transform ${visibleSections.timeline ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
          }`}
      >
        {/* Tiêu đề khối Chặng Đường Tự Hào hiện dần từ từ theo tay lăn chuột */}
        <ScrollRevealHeader
          badge="CHẶNG ĐƯỜNG TỰ HÀO"
          badgeStyle="bg-sky-50 text-sky-700 border-sky-200/80"
          badgeDot="bg-sky-500"
          titlePrefix="Hành Trình Kiến Tạo "
          titleHighlight="Hương Vị"
          highlightGradient="from-sky-500 via-cyan-500 to-blue-600"
          description="Từ căn bếp nhỏ tràn đầy nhiệt huyết đến hàng vạn bữa ăn ngon trao tận tay thực khách."
          progress={timelineProgress}
        />

        {/* KHỐI DÒNG THỜI GIAN TÁCH ĐÔI (SPLIT-SCREEN HERITAGE TIMELINE) */}
        {(() => {
          const milestones = [
            {
              year: '2021',
              badge: 'Khởi Nguyên',
              badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200/80',
              title: 'Căn Bếp Nhỏ 15m²',
              tag: '1 Lò nướng • 3 Món thủ công',
              desc: 'Khởi đầu từ niềm đam mê ẩm thực cháy bỏng trong căn bếp nhỏ chỉ vỏn vẹn 15m². Từng chiếc bánh burger đầu tiên được tạo hình và nướng vàng rụm hoàn toàn thủ công, trao gửi hương vị ấm cúng đến những vị khách đầu tiên chính là người thân và bạn bè.',
              highlight: '“Mỗi mẻ bánh ra lò lúc ấy mang trọn vẹn cả tình yêu nghề và ước mơ kiến tạo hương vị độc bản.”',
              stats: [
                { label: 'Diện tích bếp', val: '15 m²' },
                { label: 'Thực đơn ban đầu', val: '3 Món' },
                { label: 'Phương thức', val: '100% Thủ Công' }
              ],
              location: 'Sài Gòn • Khởi Nghiệp',
              image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop',
              gradient: 'from-amber-500 to-orange-600',
              activeGlow: 'ring-amber-400/30 border-amber-400/80 shadow-amber-500/10',
              navColor: 'from-amber-500 to-orange-500',
              range: [0.04, 0.28]
            },
            {
              year: '2023',
              badge: 'Bứt Phá',
              badgeStyle: 'bg-sky-50 text-sky-800 border-sky-200/80',
              title: 'Chạm Mốc 5.000 Thực Khách',
              tag: 'Sốt Phô Mai Kéo Sợi Độc Bản',
              desc: 'Chính thức mở rộng căn bếp trung tâm đầu tiên tại Quận 1. Đội ngũ dày công nghiên cứu và ra mắt công thức sốt phô mai béo ngậy độc quyền, nhanh chóng tạo nên làn sóng ẩm thực đường phố được đông đảo giới trẻ Sài Gòn đón nhận nồng nhiệt.',
              highlight: '“Hương vị sốt phô mai đặc sánh đã đưa tên tuổi DualeoFood vượt khỏi ranh giới một căn bếp nhỏ.”',
              stats: [
                { label: 'Thực khách thân thiết', val: '5.000+' },
                { label: 'Căn bếp mở rộng', val: 'Chi nhánh Q.1' },
                { label: 'Dấu ấn độc bản', val: 'Sốt Phô Mai' }
              ],
              location: 'Chi Nhánh Quận 1',
              image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=1200&auto=format&fit=crop',
              gradient: 'from-sky-500 to-blue-600',
              activeGlow: 'ring-sky-400/30 border-sky-400/80 shadow-sky-500/10',
              navColor: 'from-sky-500 to-blue-600',
              range: [0.28, 0.52]
            },
            {
              year: '2024',
              badge: 'Tiêu Chuẩn Xanh',
              badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
              title: '100% Nguyên Liệu Chuẩn VietGAP',
              tag: 'Rau Sạch Nông Trại Hữu Cơ Đà Lạt',
              desc: 'Đặt sức khỏe của khách hàng lên hàng đầu, DualeoFood ký kết hợp tác trực tiếp với các nông trại hữu cơ Đà Lạt để cung ứng 100% xà lách, cà chua tươi sạch thu hoạch trong ngày. Quy trình vận chuyển thần tốc giữ trọn độ tươi giòn và dinh dưỡng quý giá.',
              highlight: '“Ăn nhanh nhưng phải sạch, tươi và an lành là cam kết bất biến của đội ngũ DualeoFood.”',
              stats: [
                { label: 'Nguồn rau sạch', val: '100% VietGAP' },
                { label: 'Thời gian giao hàng', val: '< 30 Phút' },
                { label: 'Nông trại đối tác', val: 'Đà Lạt Farm' }
              ],
              location: 'Nông Trại Đà Lạt & Giao Vận',
              image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1200&auto=format&fit=crop',
              gradient: 'from-emerald-500 to-teal-600',
              activeGlow: 'ring-emerald-400/30 border-emerald-400/80 shadow-emerald-500/10',
              navColor: 'from-emerald-500 to-teal-600',
              range: [0.52, 0.74]
            },
            {
              year: '2026',
              badge: 'Kỷ Nguyên Số',
              badgeStyle: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
              title: 'Hệ Sinh Thái DualeoFood Toàn Diện',
              tag: 'Nền Tảng Đặt Món Online Thông Minh',
              desc: 'Phục vụ hơn 10.000+ lượt khách yêu thích mỗi tháng, DualeoFood ra mắt ứng dụng đặt món hiện đại, tối ưu hóa thời gian chờ và cá nhân hóa trải nghiệm ẩm thực. Mở rộng chuỗi bếp tiện ích phủ sóng nhiều khu vực, đưa món ngon nóng hổi đến mọi gia đình.',
              highlight: '“Công nghệ kết nối đam mê ẩm thực – nơi mỗi bữa ăn đều là một trải nghiệm trọn vẹn và tiện nghi.”',
              stats: [
                { label: 'Khách hàng hàng tháng', val: '10.000+' },
                { label: 'Phạm vi phục vụ', val: 'Toàn Quốc' },
                { label: 'Kênh công nghệ', val: 'App & Web 24/7' }
              ],
              location: 'Hệ Thống DualeoFood App',
              image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200&auto=format&fit=crop',
              gradient: 'from-indigo-500 to-violet-600',
              activeGlow: 'ring-indigo-400/30 border-indigo-400/80 shadow-indigo-500/10',
              navColor: 'from-indigo-500 to-violet-600',
              range: [0.74, 0.96]
            }
          ];

          // Sử dụng activeMilestone được tính toán trực tiếp theo tọa độ thực tế của từng thẻ
          const activeIndex = activeMilestone;
          const currentMilestone = milestones[activeIndex] || milestones[0];

          const scrollToMilestone = (idx) => {
            setActiveMilestone(idx);
            const el = document.getElementById(`heritage-milestone-${idx}`);
            if (el) {
              const yOffset = -130;
              const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          };

          return (
            <div className="relative max-w-6xl mx-auto pt-4 pb-12 select-none">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                {/* ================= CỘT TRÁI (GHIM CỐ ĐỊNH - KHUNG ẢNH QUAY 90 ĐỘ 3D TỐI GIẢN & CHUYÊN NGHIỆP) ================= */}
                <div className="lg:col-span-5 lg:sticky lg:top-28 z-20 space-y-3.5">
                  {/* Khung Ảnh Nghệ Thuật Với Hiệu Ứng Quay 90 Độ 3D (3D 90-Degree Cube Flip) */}
                  <div
                    className="relative h-[320px] sm:h-[380px] lg:h-[430px] rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 bg-slate-950"
                    style={{ perspective: '1200px' }}
                  >
                    {/* Các Thẻ Ảnh Xếp 3D Quay 90 Độ */}
                    {milestones.map((item, idx) => {
                      const diff = idx - activeIndex;
                      let cardTransform = '';
                      let cardOpacity = 0;
                      let cardZIndex = 10;

                      if (diff === 0) {
                        // Thẻ hiện tại: góc 0 độ đối diện trực diện, sắc nét
                        cardTransform = 'rotateY(0deg) translateZ(0px) scale(1)';
                        cardOpacity = 1;
                        cardZIndex = 20;
                      } else if (diff < 0) {
                        // Thẻ trước: quay 90 độ sang trái vào không gian 3D
                        cardTransform = 'rotateY(-90deg) translateZ(80px) scale(0.88)';
                        cardOpacity = 0;
                        cardZIndex = 10 + diff;
                      } else {
                        // Thẻ tiếp theo: quay 90 độ sang phải chờ sẵn
                        cardTransform = 'rotateY(90deg) translateZ(80px) scale(0.88)';
                        cardOpacity = 0;
                        cardZIndex = 10 - diff;
                      }

                      return (
                        <div
                          key={idx}
                          className="absolute inset-0 will-change-transform"
                          style={{
                            transform: cardTransform,
                            opacity: cardOpacity,
                            zIndex: cardZIndex,
                            transformStyle: 'preserve-3d',
                            backfaceVisibility: 'hidden',
                            transition: 'transform 0.75s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease-out'
                          }}
                        >
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                      );
                    })}

                    {/* Lớp Phủ Gradient Mềm Mại Tạo Độ Tương Phản Cho Chữ */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/25 pointer-events-none z-20" />

                    {/* Badge Tinh Gọn Góc Trên */}
                    <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-black tracking-wider uppercase shadow-md">
                        {currentMilestone.year}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-white/95 text-[11px] font-semibold tracking-wide">
                        {currentMilestone.badge}
                      </span>
                    </div>

                    {/* Thông Tin Tinh Gọn Nổi Trực Tiếp Dưới Ảnh (Tối Giản, Không Hộp Đóng Khung Nặng Nề) */}
                    <div className="absolute bottom-5 left-5 right-5 z-30 select-none">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-1 drop-shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{currentMilestone.location}</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-white leading-tight mb-1 drop-shadow-md">
                        {currentMilestone.title}
                      </h3>
                      <p className="text-xs text-white/85 font-medium drop-shadow-sm line-clamp-1">
                        {currentMilestone.tag}
                      </p>
                    </div>
                  </div>

                  {/* Thanh Điều Hướng Nhanh 4 Mốc Thời Gian (RubberSegment từ React Bits) */}
                  <div className="w-full flex items-center justify-center">
                    <RubberSegment
                      items={milestones.map(m => ({
                        value: m.year,
                        label: m.year
                      }))}
                      value={milestones[activeIndex]?.year || '2021'}
                      onChange={(selectedYear, idx) => scrollToMilestone(idx)}
                      trackColor="#f1f5f9"
                      thumbColor="#0284c7"
                      textColor="#64748b"
                      activeTextColor="#ffffff"
                      size="md"
                      radius={16}
                      inset={4}
                      equalSlots={true}
                      stretch={90}
                      squash={4}
                      speed={1}
                      glide={75}
                      draggable={true}
                      className="w-full border border-slate-200/80 shadow-inner font-black"
                      aria-label="Điều hướng mốc thời gian"
                    />
                  </div>
                </div>

                {/* ================= CỘT PHẢI (CHUỖI CÂU CHUYỆN - CHỮ HIỆN DẦN THEO TAY LĂN CHUỘT) ================= */}
                <div className="lg:col-span-7 space-y-8 sm:space-y-12">
                  {milestones.map((item, idx) => {
                    const isActive = activeIndex === idx;
                    // Tiến trình xuất hiện chữ tính trực tiếp theo vị trí thực tế của từng thẻ
                    const cardProgress = milestoneScrollP[idx] !== undefined ? milestoneScrollP[idx] : (isActive ? 1 : 0);

                    return (
                      <div
                        id={`heritage-milestone-${idx}`}
                        key={idx}
                        className={`rounded-3xl p-6 sm:p-8 border transition-all duration-500 transform-gpu relative overflow-hidden ${
                          isActive
                            ? `bg-white shadow-2xl ring-2 ${item.activeGlow} translate-y-0`
                            : 'bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm opacity-60 hover:opacity-100 hover:bg-white/90'
                        }`}
                      >
                        {/* Dải gradient mỏng trên đầu card */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${item.gradient}`} />

                        {/* Hàng Tiêu Đề & Huy Hiệu (Không Có Icon Emojis Rườm Rà) */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className={`text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r ${item.gradient}`}>
                              {item.year}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${item.badgeStyle}`}>
                              {item.badge}
                            </span>
                          </div>

                          <span className="text-xs text-slate-500 font-semibold bg-slate-100/90 px-3 py-1 rounded-full">
                            {item.location}
                          </span>
                        </div>

                        {/* Tiêu Đề Mốc: Hiệu ứng Kinetic Split Text ký tự bay vào */}
                        <h4 className="text-lg sm:text-xl font-black text-slate-800 mb-1">
                          <KineticSplitCharText
                            text={item.title}
                            progress={Math.min(cardProgress * 1.35, 1)}
                            activeColor="text-slate-800"
                            inactiveColor="text-slate-300"
                            stagger={0.6}
                          />
                        </h4>
                        <p className={`text-xs sm:text-sm font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r ${item.gradient}`}>
                          {item.tag}
                        </p>

                        {/* Nội Dung Câu Chuyện: Hiệu ứng Kinetic Split Chars bay vào & xoay ngẫu nhiên từ gia tốc back.out bám sát tay lăn chuột */}
                        <p className="text-sm sm:text-base leading-relaxed mb-5 select-text min-h-[64px]">
                          <KineticSplitCharText
                            text={item.desc}
                            progress={cardProgress}
                            activeColor="text-slate-700 font-medium"
                            inactiveColor="text-slate-300/80"
                            stagger={0.85}
                          />
                        </p>

                        {/* Khối Điểm Nhấn Trích Dẫn */}
                        <div
                          className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border-l-4 border-sky-500/80 text-xs sm:text-sm italic text-slate-700 leading-relaxed font-medium transition-all duration-300"
                          style={{
                            opacity: cardProgress > 0.35 ? 1 : 0.45,
                            transform: `translateY(${cardProgress > 0.35 ? 0 : 6}px)`
                          }}
                        >
                          {item.highlight}
                        </div>

                        {/* Bộ 3 Chỉ Số Ấn Tượng */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3.5 border-t border-slate-100">
                          {item.stats.map((st, sIdx) => (
                            <div key={sIdx} className="bg-slate-50/80 rounded-xl p-2 sm:p-2.5 text-center border border-slate-100/80">
                              <span className="text-[10px] text-slate-400 font-medium block mb-0.5 truncate">
                                {st.label}
                              </span>
                              <span className="text-xs sm:text-sm font-black text-slate-800 block truncate">
                                {st.val}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </section>



      {/* ================= SECTION 6: ĐỘI NGŨ ĐẦU BẾP ================= */}
      <section
        ref={teamRef}
        data-section="team"
        className={`relative py-12 sm:py-20 md:py-28 bg-gradient-to-b from-sky-50/50 via-white to-sky-50/30 transition-all duration-1000 transform ${visibleSections.team ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
          }`}
      >
        <div className="container mx-auto px-4 mb-8 sm:mb-12">
          {/* Tiêu đề khối Đội Ngũ Đầu Bếp hiện dần từ từ theo tay lăn chuột - XÓA HIỆU ỨNG BAY CHỮ RIÊNG CHO SECTION NÀY */}
          <ScrollRevealHeader
            badge="LINH HỒN CỦA DUALEOFOOD"
            badgeStyle="bg-sky-100/80 text-sky-700 border-sky-200/60"
            badgeDot="bg-sky-500"
            titlePrefix="Những Bàn Tay "
            titleHighlight="Tạo Nên Độc Bản"
            highlightGradient="from-sky-500 to-sky-600"
            description="Đằng sau từng mẻ bánh thơm lừng là đôi bàn tay khéo léo và trọn vẹn tình yêu nghề bếp."
            progress={teamProgress}
            disableSplitText={true}
          />
        </div>

        {/* ================= 3 THÀNH PHẦN CUỘN MỞ RỘNG TOÀN MÀN HÌNH THEO CHIỀU DỌC (REACT BITS SCROLL EXPAND) ================= */}
        <div className="w-full relative flex flex-col">
          {[
            {
              name: 'Nguyễn Minh Tuấn',
              role: 'Bếp Trưởng Điều Hành',
              exp: '10 Năm Kinh Nghiệm',
              desc: 'Từng tu nghiệp ẩm thực tại Pháp, người dày công nghiên cứu nên bộ ba công thức nước sốt độc bản làm say lòng thực khách.',
              avatar: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?q=80&w=1800&auto=format&fit=crop',
              badge: 'Master Chef',
              tag: 'Head Chef'
            },
            {
              name: 'Trần Mai Anh',
              role: 'Chuyên Gia Dinh Dưỡng',
              exp: '8 Năm Nghiên Cứu',
              desc: 'Phụ trách cân đối hàm lượng calo, vitamin và khoáng chất trong từng khẩu phần, đảm bảo bữa ăn nhanh nhưng phải cực kỳ lành mạnh.',
              avatar: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1800&auto=format&fit=crop',
              badge: 'Nutritionist',
              tag: 'R&D Lead'
            },
            {
              name: 'Đội Giao Vận Thần Tốc',
              role: 'Dualeo Speed Fleet',
              exp: 'Cam Kết Dưới 30 Phút',
              desc: 'Những chiến binh đường phố luôn sẵn sàng lên đường trong mọi thời tiết, giữ trọn độ nóng hổi và vỏ bánh giòn tan khi đến tay bạn.',
              avatar: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?q=80&w=1800&auto=format&fit=crop',
              badge: 'Speed Fleet',
              tag: 'Delivery Lead'
            }
          ].map((member, idx) => (
            <div key={idx} className="w-full relative">
              <ScrollExpand
                src={member.avatar}
                alt={member.name}
                title={member.badge}
                scrollHint="Cuộn để mở rộng toàn màn hình"
                useWindowScroll={true}
                startWidth={68}
                startHeight={68}
                startRadius={24}
                endRadius={0}
                mediaZoom={1.10}
                scrollDistance={0.85}
                holdDistance={1.25}
                smoothing={0.06}
                overlayScrim={0.75}
                className="w-full"
              >
                <div className="flex flex-col items-center justify-end text-center px-4 sm:px-8 max-w-2xl select-none">
                  {/* Badge & Tag - Thuần chữ sang trọng, không emoji */}
                  <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[11px] sm:text-xs font-bold tracking-wider uppercase shadow-md">
                      {member.badge}
                    </span>
                    <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full bg-sky-500/80 backdrop-blur-md text-white text-[11px] font-semibold tracking-wide shadow-xs">
                      {member.tag}
                    </span>
                  </div>

                  {/* Tên thành viên - Cỡ chữ tinh tế, gọn gàng */}
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-1.5 tracking-tight drop-shadow-lg">
                    {member.name}
                  </h3>

                  {/* Chức vụ & Kinh nghiệm */}
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-2.5 sm:mb-3">
                    <span className="text-sky-300 text-xs sm:text-sm md:text-base font-bold drop-shadow-sm">
                      {member.role}
                    </span>
                    <span className="text-white/40 hidden sm:inline">•</span>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400/25 border border-amber-300/40 text-amber-300 text-[11px] sm:text-xs font-bold shadow-xs">
                      {member.exp}
                    </span>
                  </div>

                  {/* Châm ngôn chữ viết tay thanh thoát - XÓA HOÀN TOÀN HÌNH CHỮ NHẬT BAO BỌC */}
                  <p className="font-handwriting text-lg sm:text-xl md:text-2xl text-amber-200/95 leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] max-w-xl mb-1">
                    “{member.desc}”
                  </p>
                  <span className="font-signature text-base sm:text-lg text-sky-200/90 font-bold tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                    — {member.name}
                  </span>
                </div>
              </ScrollExpand>
            </div>
          ))}
        </div>
      </section>

      {/* ================= SECTION 7: BỨC TƯỜNG YÊU THƯƠNG ================= */}
      <section
        ref={reviewsRef}
        data-section="reviews"
        className={`container mx-auto px-4 py-12 sm:py-20 md:py-28 transition-all duration-1000 transform ${visibleSections.reviews ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
          }`}
      >
        {/* Tiêu đề khối Bức Tường Yêu Thương hiện dần từ từ theo tay lăn chuột */}
        <ScrollRevealHeader
          badge="YÊU THƯƠNG TỪ THỰC KHÁCH"
          badgeStyle="bg-rose-50 text-rose-700 border-rose-200/80"
          badgeDot="bg-rose-500"
          titlePrefix="Thực Khách Nói Gì Về "
          titleHighlight="DualeoFood?"
          highlightGradient="from-rose-500 to-sky-600"
          description="Nụ cười và sự hài lòng của bạn chính là món quà ý nghĩa nhất dành cho DualeoFood."
          progress={reviewsProgress}
        />

        {/* Thống kê tín nhiệm với hiệu ứng quay số ngẫu nhiên như sổ xố & Glassmorphism Dashboard */}
        <LotteryStats />

        {/* Khối Trưng Bày Đánh Giá Tương Tác: Spotlight Hero 3D + Card Stack */}
        <InteractiveReviewShowcase />
      </section>

      {/* ================= SECTION 8: CALL TO ACTION ================= */}
      <section
        ref={ctaRef}
        data-section="cta"
        className={`container mx-auto px-4 py-10 sm:py-20 md:py-32 transition-all duration-1000 transform ${visibleSections.cta ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-16 scale-[0.98]'}`}
      >
        <div className="bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 rounded-3xl sm:rounded-[3rem] shadow-2xl shadow-sky-500/30 relative overflow-hidden group">

          {/* Background Patterns */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/food.png')]"></div>

          <div className="flex flex-col md:flex-row items-center">
            {/* Nội dung bên trái */}
            <div className="w-full md:w-3/5 p-6 sm:p-12 md:p-20 relative z-10 text-center md:text-left">
              <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/20 text-white font-bold text-xs sm:text-sm tracking-widest uppercase mb-4 sm:mb-6 backdrop-blur-md border border-white/30">
                Ưu đãi đặc biệt
              </span>
              <h2 className="text-2xl sm:text-4xl md:text-6xl font-black mb-4 sm:mb-8 leading-tight drop-shadow-md text-white">
                Đói Bụng <br className="hidden md:block" /> Rồi Nhỉ?
              </h2>
              <p className="text-sky-50 text-xs sm:text-lg md:text-2xl mb-6 sm:mb-12 leading-relaxed font-medium">
                Khám phá ngay thực đơn ngập tràn các món ngon hấp dẫn và đặt hàng chỉ với vài thao tác cơ bản.
              </p>

              <Link to="/" className="relative inline-flex items-center justify-center bg-white text-sky-600 font-black text-sm sm:text-xl py-3 px-6 sm:py-5 sm:px-12 rounded-full shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] hover:-translate-y-1 transition-all duration-300 overflow-hidden group/btn">
                <span className="relative z-10 flex items-center gap-2">
                  XEM THỰC ĐƠN NGAY
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 transform group-hover/btn:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
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