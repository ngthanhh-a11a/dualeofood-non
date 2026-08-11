import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// ===== CONFETTI PARTICLE COMPONENT =====
const ConfettiPiece = ({ style }) => <div className="confetti-piece" style={style} />;

const generateConfetti = (count = 80) => {
  const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6FC8', '#A855F7', '#F97316'];
  const shapes = ['square', 'circle', 'strip'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    left: `${Math.random() * 100}%`,
    animationDuration: `${2.5 + Math.random() * 2.5}s`,
    animationDelay: `${Math.random() * 1.5}s`,
    size: `${6 + Math.random() * 8}px`,
    rotate: `${Math.random() * 360}deg`,
  }));
};

// ===== ANIMATED CHECK ICON =====
const AnimatedCheck = () => (
  <svg
    className="checkmark-svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 52 52"
    width="72"
    height="72"
  >
    <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
    <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
  </svg>
);

// ===== MAIN PAGE =====
const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { paymentMethod, orderId } = location.state || {};

  const [confetti] = useState(() => generateConfetti(90));
  const [showContent, setShowContent] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const timerRef = useRef(null);

  // Nếu truy cập trực tiếp không qua checkout thì redirect về home
  useEffect(() => {
    if (!location.state?.fromCheckout) {
      navigate('/', { replace: true });
    }
  }, [location.state, navigate]);

  // Delay nhỏ để animation check chạy trước khi hiện nội dung
  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 400);
    return () => clearTimeout(t);
  }, []);

  // Đếm ngược 10s rồi tự chuyển sang my-orders
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          navigate('/my-orders', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [navigate]);

  const isQR = paymentMethod === 'QR_CODE';

  return (
    <>
      {/* ===== INLINE CSS ===== */}
      <style>{`
        /* --- Confetti --- */
        .confetti-piece {
          position: fixed;
          top: -20px;
          animation: confettiFall linear forwards;
          pointer-events: none;
          z-index: 9999;
          opacity: 0.9;
        }
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotateZ(0deg) rotateX(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(105vh) rotateZ(720deg) rotateX(360deg); opacity: 0; }
        }

        /* --- Check animation --- */
        .checkmark-svg {
          display: block;
          margin: 0 auto;
          stroke-width: 3;
          stroke: #fff;
        }
        .checkmark-circle {
          stroke: #fff;
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          animation: strokeCircle 0.7s cubic-bezier(0.65, 0, 0.45, 1) 0.1s forwards;
        }
        .checkmark-check {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          stroke-linecap: round;
          stroke-linejoin: round;
          animation: strokeCheck 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.7s forwards;
        }
        @keyframes strokeCircle {
          to { stroke-dashoffset: 0; }
        }
        @keyframes strokeCheck {
          to { stroke-dashoffset: 0; }
        }

        /* --- Icon pulse ring --- */
        @keyframes ripple {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .ripple-ring {
          animation: ripple 1.4s ease-out infinite;
        }
        .ripple-ring-2 {
          animation: ripple 1.4s ease-out 0.5s infinite;
        }

        /* --- Fade-slide-up content --- */
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeSlideUp 0.5s ease forwards; }
        .fade-up-d1 { animation: fadeSlideUp 0.5s ease 0.15s forwards; opacity: 0; }
        .fade-up-d2 { animation: fadeSlideUp 0.5s ease 0.3s  forwards; opacity: 0; }
        .fade-up-d3 { animation: fadeSlideUp 0.5s ease 0.45s forwards; opacity: 0; }
        .fade-up-d4 { animation: fadeSlideUp 0.5s ease 0.6s  forwards; opacity: 0; }

        /* --- Countdown ring --- */
        .countdown-ring {
          stroke-dasharray: 157;
          stroke-dashoffset: 0;
          transition: stroke-dashoffset 1s linear;
        }

        /* --- Shine button --- */
        @keyframes shine {
          0%   { left: -100%; }
          100% { left: 200%; }
        }
        .btn-shine::after {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: shine 2.5s infinite 1.5s;
        }
      `}</style>

      {/* ===== CONFETTI LAYER ===== */}
      <div aria-hidden="true">
        {confetti.map((p) => (
          <ConfettiPiece
            key={p.id}
            style={{
              left: p.left,
              width: p.shape === 'strip' ? `${parseInt(p.size) * 0.4}px` : p.size,
              height: p.shape === 'strip' ? `${parseInt(p.size) * 2.5}px` : p.size,
              borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? '2px' : '1px',
              backgroundColor: p.color,
              animationDuration: p.animationDuration,
              animationDelay: p.animationDelay,
              transform: `rotateZ(${p.rotate})`,
            }}
          />
        ))}
      </div>

      {/* ===== PAGE CONTENT ===== */}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-green-50 px-4 py-16">
        <div className="w-full max-w-md">

          {/* --- ICON BLOCK --- */}
          <div className="relative flex items-center justify-center mb-8">
            {/* Ripple rings */}
            <span className="absolute w-36 h-36 rounded-full bg-green-200 ripple-ring" />
            <span className="absolute w-36 h-36 rounded-full bg-green-200 ripple-ring-2" />
            {/* Icon circle */}
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-400/40">
              <AnimatedCheck />
            </div>
          </div>

          {/* --- CARD --- */}
          <div className={`bg-white rounded-3xl shadow-2xl shadow-gray-200/80 border border-gray-100 overflow-hidden transition-all duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>

            {/* Top green bar */}
            <div className="h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400" />

            <div className="p-8 text-center">
              {/* Title */}
              <div className="fade-up">
                <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-3 tracking-wider uppercase">
                  🎉 Đặt hàng thành công
                </span>
                <h1 className="text-3xl md:text-4xl font-black text-gray-800 leading-tight">
                  Cảm ơn bạn!
                </h1>
              </div>

              {/* Description */}
              <p className="text-gray-500 mt-3 mb-6 leading-relaxed text-[15px] fade-up-d1">
                {isQR
                  ? 'Hệ thống đã nhận được thanh toán của bạn. Đơn hàng sẽ được chuẩn bị và giao đi ngay lập tức.'
                  : 'Đơn hàng của bạn đã được ghi nhận. Chúng tôi sẽ chuẩn bị và giao đến bạn sớm nhất!'}
              </p>

              {/* Info box */}
              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 mb-6 text-left space-y-3 fade-up-d2">
                {orderId && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 font-medium">Mã đơn hàng</span>
                    <span className="text-sm font-mono font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-lg">
                      #{orderId.toString().slice(-8).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-medium">Thanh toán</span>
                  <span className="text-sm font-bold text-gray-700">
                    {isQR ? '💳 Chuyển khoản QR' : '💵 Tiền mặt (COD)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-medium">Trạng thái</span>
                  <span className="flex items-center gap-1.5 text-sm font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Đang xử lý
                  </span>
                </div>
              </div>

              {/* Estimated time */}
              <div className="flex items-center justify-center gap-3 mb-7 fade-up-d3">
                <div className="flex-1 h-px bg-gray-100" />
                <div className="flex items-center gap-2 text-gray-400 text-sm whitespace-nowrap">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Giao hàng dự kiến&nbsp;<strong className="text-gray-600">30–45 phút</strong>
                </div>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3 fade-up-d4">
                <Link
                  to="/my-orders"
                  replace
                  onClick={() => clearInterval(timerRef.current)}
                  className="btn-shine relative overflow-hidden w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-sky-400/30 hover:shadow-sky-500/40 hover:scale-[1.02] active:scale-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Xem đơn hàng của tôi
                </Link>

                <Link
                  to="/"
                  replace
                  onClick={() => clearInterval(timerRef.current)}
                  className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-600 hover:border-sky-300 hover:text-sky-600 font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:bg-sky-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Tiếp tục mua sắm
                </Link>
              </div>

              {/* Auto redirect countdown */}
              <div className="mt-6 flex items-center justify-center gap-2.5 fade-up-d4">
                {/* Mini SVG countdown ring */}
                <svg width="22" height="22" viewBox="0 0 56 56" className="-rotate-90">
                  <circle cx="28" cy="28" r="25" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                  <circle
                    cx="28" cy="28" r="25" fill="none" stroke="#38bdf8" strokeWidth="5"
                    strokeDasharray="157"
                    strokeDashoffset={157 - (157 * countdown) / 10}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <p className="text-xs text-gray-400">
                  Tự động chuyển sang đơn hàng sau&nbsp;
                  <strong className="text-sky-500">{countdown}s</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-400 mt-5">
            Cần hỗ trợ?&nbsp;
            <Link to="/contact" className="text-sky-500 hover:underline font-medium">
              Liên hệ với chúng tôi
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default OrderSuccess;
