import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from "../../utils/axiosConfig";
import toast from 'react-hot-toast';
import { setCart, clearCart } from "../../redux/cartSlice";
import { closeAuthModal } from "../../redux/uiSlice";
import { GoogleLogin } from '@react-oauth/google';
import { NeatGradient } from "@firecms/neat";

const NEAT_CONFIG = {
  colors: [
    { color: '#0F5393', enabled: true },
    { color: '#17E7FF', enabled: true },
    { color: '#04A5B6', enabled: true },
    { color: '#67AEF1', enabled: true },
    { color: '#FFFFFF', enabled: false },
    { color: '#5195E1', enabled: true },
  ],
  speed: 4.5,
  horizontalPressure: 3,
  verticalPressure: 4,
  waveFrequencyX: 2.5,
  waveFrequencyY: 2.5,
  waveAmplitude: 6,
  secondaryWaveEnabled: false,
  secondaryWaveFrequencyX: 3,
  secondaryWaveFrequencyY: 3,
  secondaryWaveAmplitude: 5,
  secondaryWaveSpeed: 0.6,
  secondaryWaveAngle: 1,
  shadows: 1, // Giảm từ 10 xuống 1 để phông nền sáng sủa, không bị tối
  highlights: 4, // Tăng độ sáng phản chiếu
  colorBrightness: 1.35, // Tăng độ sáng tổng thể giúp màu xanh nước biển rực rỡ tươi mới
  colorSaturation: 0.1,
  wireframe: false,
  antialias: true,
  colorBlending: 3,
  backgroundColor: '#FFFFFF', // Nền sáng trắng tinh khiết
  backgroundAlpha: 1,
  grainScale: 4,
  grainSparsity: 0,
  grainIntensity: 0,
  grainSpeed: 0.5,
  resolution: 0.9,
  yOffset: 21248.999984264374,
  yOffsetWaveMultiplier: 4,
  yOffsetColorMultiplier: 5.4,
  yOffsetFlowMultiplier: 10.1,
  flowDistortionA: 1.2,
  flowDistortionB: 1.8,
  flowScale: 1.5,
  flowEase: 0.25,
  flowEnabled: false,
  enableProceduralTexture: false,
  transparentTextureVoid: false,
  textureMode: 'bitmap',
  bakeEdgeSoftness: 1,
  textureVoidLikelihood: 0.27,
  textureVoidWidthMin: 60,
  textureVoidWidthMax: 420,
  textureBandDensity: 1.2,
  textureColorBlending: 0.06,
  textureSeed: 333,
  textureEase: 0.5,
  proceduralBackgroundColor: '#0E0707',
  textureShapeTriangles: 20,
  textureShapeCircles: 15,
  textureShapeBars: 15,
  textureShapeSquiggles: 10,
  domainWarpEnabled: false,
  domainWarpIntensity: 0,
  domainWarpScale: 3,
  vignetteIntensity: 0.25,
  vignetteRadius: 0.35,
  fresnelEnabled: false,
  fresnelPower: 1.3,
  fresnelIntensity: 0,
  fresnelColor: '#ffffff',
  iridescenceEnabled: false,
  iridescenceIntensity: 0.8,
  iridescenceSpeed: 1.5,
  prismEdgeEnabled: false,
  prismEdgeIntensity: 0.5,
  prismEdgeThinness: 3,
  prismEdgeSpread: 1,
  prismEdgeSpeed: 0.5,
  prismEdgeRipple: 1,
  bloomIntensity: 0.1,
  bloomThreshold: 0.1,
  chromaticAberration: 3,
  shapeType: 'sphere',
  shapeRotationX: -2.49,
  shapeRotationY: -0.89,
  shapeRotationZ: 0,
  shapeAutoRotateSpeedX: 1,
  shapeAutoRotateSpeedY: 1.2,
  sphereRadius: 18,
  torusRadius: 15,
  torusTube: 5,
  cylinderRadius: 10,
  cylinderHeight: 40,
  planeBend: 0,
  planeTwist: 0,
  silhouetteFade: 0.15,
  cylinderFade: 0.08,
  ribbonFade: 0.05,
  flatShading: false,
  cameraLock: false,
  cameraX: 22.5,
  cameraY: 0,
  cameraZ: 0,
  cameraRotationX: 0.86,
  cameraRotationY: -0.007,
  cameraRotationZ: 0,
  cameraZoom: 2.2,
};

// Component hình nền NeatGradient động 3D - Chỉ mount khi Modal hiển thị
const NeatGradientBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let gradientInstance = null;
    try {
      gradientInstance = new NeatGradient({
        ref: canvasRef.current,
        ...NEAT_CONFIG,
      });
      // Vô hiệu hóa chữ nhỏ watermark "NEAT" khi nền di chuyển
      gradientInstance._licensed = true;
    } catch (err) {
      console.error("Lỗi khởi tạo NeatGradient:", err);
    }

    return () => {
      if (gradientInstance) {
        try {
          gradientInstance.destroy();
        } catch (e) {
          console.error("Lỗi destroy NeatGradient:", e);
        }
      }
    };
  }, []);

  return (
    <canvas
      id="gradient"
      ref={canvasRef}
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 0 }}
    />
  );
};

// Component ô nhập liệu không khung viền với hiệu ứng chữ nhảy sóng (Wave Input) màu xanh nước
const WaveInput = ({ label, type = "text", name, value, onChange, required = false, className = "" }) => {
  const chars = label.split('');

  return (
    <div className={`wave-group ${className}`}>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder=" "
        className="wave-input"
      />
      <span className="wave-bar" />
      <label className="wave-label">
        {chars.map((char, index) => (
          <span
            key={index}
            className="wave-char"
            style={{ '--index': index }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </label>
    </div>
  );
};

const AuthModal = () => {
  const isAuthModalOpen = useSelector((state) => state.ui.isAuthModalOpen);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const messageFromRedirect = location.state?.message;

  const [isLogin, setIsLogin] = useState(true);
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0);

  // OTP State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  // Resend Timer State
  const [resendTimer, setResendTimer] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Xử lý đếm ngược gửi lại OTP
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Tự động submit khi OTP đủ 6 số
  useEffect(() => {
    if (showOTP && otp.every(digit => digit !== '')) {
      const otpString = otp.join('');
      if (forgotPasswordStep === 2) {
        // Tự động submit luồng Quên mật khẩu nếu đủ 6 số
        handleForgotPasswordSubmitAuto(otpString);
      } else {
        // Tự động submit luồng Đăng ký
        handleVerifyOTPAuto(otpString);
      }
    }
  }, [otp, showOTP, forgotPasswordStep]);

  if (!isAuthModalOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return; // Chỉ nhận số
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Nhảy sang ô tiếp theo
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otp];
    pastedData.forEach((char, index) => {
      if (!isNaN(char) && index < 6) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const startResendTimer = () => {
    setResendTimer(30);
  };

  const loadUserCart = (userId) => {
    const savedCartJSON = localStorage.getItem(`cart_${userId}`);
    if (savedCartJSON) {
      try {
        const savedCart = JSON.parse(savedCartJSON);
        if (savedCart && savedCart.items) {
          dispatch(setCart(savedCart));
        }
      } catch (e) { console.error("Lỗi parse giỏ hàng từ localStorage:", e); }
    } else {
      dispatch(clearCart());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const response = await axios.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userInfo', JSON.stringify(response.data.user));
        window.dispatchEvent(new Event('authChange'));
        
        loadUserCart(response.data.user._id);
        toast.success('Đăng nhập thành công!');
        
        dispatch(closeAuthModal()); // Đóng modal

        const userRole = response.data.user.role;
        if (userRole === 'admin') window.location.href = '/admin';
        else if (userRole === 'staff') window.location.href = '/staff';
        // Nếu là Customer, ở lại trang hiện tại (Modal tự đóng)
        
      } else {
        if (formData.password !== formData.confirmPassword) { 
          toast.error('Mật khẩu và xác nhận mật khẩu không khớp!');
          setLoading(false);
          return;
        }

        await axios.post('/auth/register', {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          email: formData.email,
          password: formData.password
        });
        
        toast.success('Đã gửi mã OTP! Vui lòng kiểm tra email của bạn.');
        setShowOTP(true);
        startResendTimer(); // Bắt đầu đếm ngược
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      // Giả định backend có API gửi lại OTP cho email chưa active
      // Nếu không có, ta dùng lại API register. (Tùy backend của bạn, ở đây giả sử gọi lại register/resend)
      await axios.post('/auth/register', {
        name: formData.name, phone: formData.phone, address: formData.address, email: formData.email, password: formData.password
      });
      toast.success('Đã gửi lại mã OTP!');
      setOtp(['', '', '', '', '', '']); // Xóa OTP cũ
      inputRefs.current[0].focus();
      startResendTimer();
    } catch (error) {
      toast.error('Không thể gửi lại mã lúc này.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (forgotPasswordStep === 1) {
      try {
        const response = await axios.post('/auth/forgot-password-otp', { email: formData.email });
        toast.success(response.data.message);
        setForgotPasswordStep(2);
        setShowOTP(true);
        startResendTimer();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleForgotPasswordSubmitAuto = async (otpString) => {
    setLoading(true);
    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu nhập lại không khớp!');
      setLoading(false);
      return;
    }
    try {
      const response = await axios.post('/auth/reset-password-otp', {
        email: formData.email,
        otp: otpString,
        password: formData.password
      });
      toast.success(response.data.message + ' Vui lòng đăng nhập lại.');
      setForgotPasswordStep(0);
      setShowOTP(false);
      setIsLogin(true);
      setOtp(['', '', '', '', '', '']);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mã OTP không đúng!');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTPAuto = async (otpString) => {
    setLoading(true);
    try {
      const response = await axios.post('/auth/verify-otp', {
        email: formData.email,
        otp: otpString
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userInfo', JSON.stringify(response.data.user));
      window.dispatchEvent(new Event('authChange'));

      loadUserCart(response.data.user._id);
      toast.success('Xác thực thành công! Đang đăng nhập...');
      
      setTimeout(() => {
        dispatch(closeAuthModal());
        window.location.reload(); // Tải lại để lấy thông tin Header
      }, 1000);

    } catch (error) {
      toast.error(error.response?.data?.message || 'Mã OTP không đúng!');
      setOtp(['', '', '', '', '', '']); // Tự động xóa mã lỗi để nhập lại
      inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    dispatch(closeAuthModal());
    // Reset state when closed
    setIsLogin(true);
    setShowOTP(false);
    setForgotPasswordStep(0);
    setOtp(['', '', '', '', '', '']);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const response = await axios.post('/auth/google-login', {
        token: credentialResponse.credential,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userInfo', JSON.stringify(response.data.user));
      window.dispatchEvent(new Event('authChange'));

      loadUserCart(response.data.user._id);
      toast.success('Đăng nhập Google thành công!');
      
      setTimeout(() => {
        dispatch(closeAuthModal());
        window.location.reload(); 
      }, 1000);
    } catch (error) {
      toast.error('Đăng nhập Google thất bại. Vui lòng thử lại.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col md:flex-row items-center justify-center md:justify-end overflow-y-auto overflow-x-hidden p-6 md:py-10 md:pr-14 lg:pr-24 xl:pr-32 bg-white">
      {/* 3D Animated NeatGradient Canvas Background - Giữ sắc nét 100%, sáng rực rỡ, không bị mờ */}
      <NeatGradientBackground />

      {/* Nút đóng cố định ở góc trên bên phải */}
      <button 
        onClick={handleClose} 
        className="fixed top-5 right-5 md:top-8 md:right-8 z-50 text-gray-600 hover:text-gray-900 bg-white/80 hover:bg-white shadow-md p-2.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
        title="Đóng (Esc)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Khu vực bên trái màn hình: Giữ nguyên để phô diễn hiệu ứng 3D - click vào đây sẽ đóng modal */}
      <div 
        className="hidden md:block flex-1 h-full cursor-pointer z-10" 
        onClick={handleClose} 
        title="Nhấp vào đây để quay lại"
      />

      <style>{`
        .wave-group {
          position: relative;
          width: 100%;
          margin-bottom: 1.5rem;
        }

        .wave-group .wave-input {
          font-size: 16px;
          padding: 10px 4px 8px 4px;
          display: block;
          width: 100%;
          border: none;
          border-bottom: 1.5px solid #94a3b8;
          background: transparent;
          color: #0f172a;
          outline: none;
          font-weight: 500;
        }

        .wave-group .wave-input:focus {
          outline: none;
        }

        .wave-group .wave-label {
          color: #64748b;
          font-size: 16px;
          font-weight: 500;
          position: absolute;
          pointer-events: none;
          left: 4px;
          top: 10px;
          display: flex;
          user-select: none;
        }

        .wave-group .wave-char {
          display: inline-block;
          transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1) all;
          transition-delay: calc(var(--index) * 0.035s);
        }

        .wave-group .wave-input:focus ~ .wave-label .wave-char,
        .wave-group .wave-input:not(:placeholder-shown) ~ .wave-label .wave-char,
        .wave-group .wave-input:valid ~ .wave-label .wave-char {
          transform: translateY(-22px);
          font-size: 13px;
          font-weight: 600;
          color: #0284c7; /* Giữ màu xanh nước biển */
        }

        .wave-group .wave-bar {
          position: relative;
          display: block;
          width: 100%;
        }

        .wave-group .wave-bar:before,
        .wave-group .wave-bar:after {
          content: '';
          height: 2.5px;
          width: 0;
          bottom: 0px;
          position: absolute;
          background: #0284c7; /* Giữ màu xanh nước biển */
          transition: 0.25s ease all;
        }

        .wave-group .wave-bar:before {
          left: 50%;
        }

        .wave-group .wave-bar:after {
          right: 50%;
        }

        .wave-group .wave-input:focus ~ .wave-bar:before,
        .wave-group .wave-input:focus ~ .wave-bar:after {
          width: 50%;
        }

        .animate-form-in { animation: form-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; } 
        @keyframes form-in { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Form Content: Nằm trực tiếp trên background, không khung chữ nhật, input hiệu ứng sóng màu xanh nước */}
      <div className="w-full max-w-sm sm:max-w-md relative z-20 py-6 md:py-0 animate-form-in">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-sky-500 tracking-wider mb-2 drop-shadow-sm">
            {forgotPasswordStep > 0 ? 'KHÔI PHỤC MẬT KHẨU' : 'DUALEOFOOD'}
          </h1>
          <p className="text-gray-600 font-medium text-sm sm:text-base">
            {showOTP 
              ? 'Xác thực tài khoản'
              : forgotPasswordStep === 1 
                ? 'Nhập email để nhận mã OTP' 
                : isLogin 
                  ? 'Chào mừng bạn quay trở lại!' 
                  : 'Tạo tài khoản mới ngay hôm nay'
            }
          </p>
        </div>

        {/* Thông báo từ Redirect (chỉ hiện khi chưa nhập OTP) */}
        {messageFromRedirect && !showOTP && forgotPasswordStep === 0 && (
          <div className="bg-yellow-100/90 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-r-lg mb-6 flex items-center gap-3 shadow-sm">
            <span className="font-semibold text-sm">{messageFromRedirect}</span>
          </div>
        )}

        {/* ================= FORM NHẬP OTP 6 Ô ================= */}
        {showOTP ? (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-6">
                Mã xác thực 6 số đã được gửi đến <br/>
                <span className="font-bold text-sky-600">{formData.email}</span>
              </p>
              
              <div className="flex justify-between gap-2 mb-6" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(index, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(index, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-black bg-white/95 border-2 border-gray-300 rounded-xl outline-none focus:border-sky-500 focus:bg-white transition-all duration-300 text-sky-600 shadow-sm"
                  />
                ))}
              </div>

              {/* Nếu đang ở bước Quên MK 2, hiện thêm form nhập MK mới */}
              {forgotPasswordStep === 2 && (
                <div className="space-y-3 mb-6 text-left">
                  <WaveInput
                    label="Mật khẩu mới *"
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <WaveInput
                    label="Xác nhận mật khẩu mới *"
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              )}
              
              {/* Đếm ngược Gửi lại OTP */}
              {forgotPasswordStep !== 2 && (
                <button 
                  type="button" 
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0 || loading}
                  className={`text-sm font-semibold transition flex items-center justify-center mx-auto gap-2 ${resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-sky-500 hover:text-sky-600'}`}
                >
                  {resendTimer > 0 ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Gửi lại mã ({resendTimer}s)
                    </>
                  ) : 'Gửi lại mã OTP'}
                </button>
              )}
            </div>
            
            <button 
              type="button" onClick={() => setShowOTP(false)}
              className="w-full text-sm font-semibold text-gray-500 hover:text-gray-800 underline mt-2"
            >
              Quay lại
            </button>
          </div>
        ) : (
          /* ================= FORM QUÊN MẬT KHẨU (BƯỚC 1) ================= */
          forgotPasswordStep === 1 ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <WaveInput
                label="Địa chỉ Email *"
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
              />

              <button type="submit" disabled={loading}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-black text-lg py-3.5 rounded-xl shadow-lg shadow-sky-500/30 transition hover:scale-[1.02] active:scale-[0.98] disabled:bg-gray-400 mt-6">
                {loading ? 'ĐANG XỬ LÝ...' : 'GỬI MÃ OTP'}
              </button>

              <button type="button" onClick={() => setForgotPasswordStep(0)} className="w-full text-sm font-semibold text-gray-500 hover:text-sky-500 underline mt-2">
                Quay lại Đăng nhập
              </button>
            </form>
          ) : (
          /* ================= FORM ĐĂNG NHẬP / ĐĂNG KÝ ================= */
          <form onSubmit={handleSubmit} className="space-y-3">
            
            {!isLogin && (
              <>
                <WaveInput
                  label="Họ và Tên *"
                  type="text"
                  name="name"
                  required={!isLogin}
                  value={formData.name}
                  onChange={handleChange}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-4">
                  <WaveInput
                    label="Số điện thoại *"
                    type="tel"
                    name="phone"
                    required={!isLogin}
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  <WaveInput
                    label="Địa chỉ *"
                    type="text"
                    name="address"
                    required={!isLogin}
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            <WaveInput
              label="Địa chỉ Email *"
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
            />

            <WaveInput
              label="Mật khẩu *"
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
            />

            {!isLogin && (
              <WaveInput
                label="Xác nhận Mật khẩu *"
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            )}

            {isLogin && (
              <div className="text-right -mt-2 mb-3">
                <button type="button" onClick={() => setForgotPasswordStep(1)} className="text-sm font-semibold text-sky-600 hover:underline">
                  Quên mật khẩu?
                </button>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-black text-lg py-3.5 rounded-xl shadow-lg shadow-sky-500/30 transition hover:scale-[1.02] active:scale-[0.98] disabled:bg-gray-400 mt-6 cursor-pointer"
            >
              {loading ? 'ĐANG XỬ LÝ...' : (isLogin ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ & NHẬN OTP')}
            </button>

            {/* Nút Đăng nhập Google */}
            <div className="mt-6 flex flex-col items-center">
              <div className="relative w-full flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative bg-white/80 px-4 text-xs font-bold text-gray-500 tracking-wider">HOẶC</div>
              </div>
              
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  toast.error('Đăng nhập Google thất bại');
                }}
                theme="outline"
                size="large"
                shape="pill"
                text="continue_with"
                width="100%"
              />
            </div>

          </form>
          )
        )}

        {!showOTP && forgotPasswordStep === 0 && (
          <div className="mt-8 text-center border-t border-gray-300 pt-6">
            <p className="text-gray-700 font-medium">
              {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
              <button 
                onClick={() => { setIsLogin(!isLogin); setFormData({name: '', phone: '', address: '', email: '', password: '', confirmPassword: '', otp: ''}); }} 
                className="text-sky-600 font-bold hover:underline ml-1"
              >
                {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
