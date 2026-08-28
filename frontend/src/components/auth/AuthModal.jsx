import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from "../../utils/axiosConfig";
import toast from 'react-hot-toast';
import { setCart, clearCart } from "../../redux/cartSlice";
import { closeAuthModal } from "../../redux/uiSlice";
import { GoogleLogin } from '@react-oauth/google';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      ></div>

      <style>{`
        .animate-modal-in { animation: modal-in 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; } 
        @keyframes modal-in { 0% { opacity: 0; transform: scale(0.9) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>

      {/* Modal Content */}
      <div className="bg-white/90 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-white/50 w-full max-w-md relative z-10 animate-modal-in">
        
        {/* Nút đóng */}
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-sky-500 tracking-wider mb-2">
            {forgotPasswordStep > 0 ? 'KHÔI PHỤC MẬT KHẨU' : 'DUALEOFOOD'}
          </h1>
          <p className="text-gray-500 font-medium">
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
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-r-lg mb-6 flex items-center gap-3 shadow-sm">
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
                    className="w-12 h-14 text-center text-2xl font-black bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-sky-500 focus:bg-sky-50 transition-all duration-300 text-sky-600"
                  />
                ))}
              </div>

              {/* Nếu đang ở bước Quên MK 2, hiện thêm form nhập MK mới */}
              {forgotPasswordStep === 2 && (
                <div className="space-y-4 mb-6 text-left">
                  <div>
                    <input type="password" name="password" required placeholder="Mật khẩu mới..."
                      value={formData.password} onChange={handleChange}
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500" />
                  </div>
                  <div>
                    <input type="password" name="confirmPassword" required placeholder="Xác nhận mật khẩu mới..."
                      value={formData.confirmPassword} onChange={handleChange}
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500" />
                  </div>
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
              <div>
                <label className="block text-gray-600 font-semibold mb-1 text-sm">Địa chỉ Email *</label>
                <input type="email" name="email" required placeholder="email@example.com"
                  value={formData.email} onChange={handleChange}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500 transition" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-black text-lg py-3 rounded-xl shadow-lg shadow-sky-500/30 transition hover:scale-[1.02] disabled:bg-gray-400 mt-4">
                {loading ? 'ĐANG XỬ LÝ...' : 'GỬI MÃ OTP'}
              </button>

              <button type="button" onClick={() => setForgotPasswordStep(0)} className="w-full text-sm font-semibold text-gray-500 hover:text-sky-500 underline mt-2">
                Quay lại Đăng nhập
              </button>
            </form>
          ) : (
          /* ================= FORM ĐĂNG NHẬP / ĐĂNG KÝ ================= */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {!isLogin && (
              <>
                <div>
                  <input type="text" name="name" required={!isLogin} placeholder="Họ và Tên *"
                    value={formData.name} onChange={handleChange}
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input type="tel" name="phone" required={!isLogin} placeholder="SĐT *"
                      value={formData.phone} onChange={handleChange}
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500" />
                  </div>
                  <div>
                    <input type="text" name="address" required={!isLogin} placeholder="Địa chỉ *"
                      value={formData.address} onChange={handleChange}
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500" />
                  </div>
                </div>
              </>
            )}

            <div>
              <input type="email" name="email" required placeholder="Địa chỉ Email *"
                value={formData.email} onChange={handleChange}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500" />
            </div>

            <div>
              <input type="password" name="password" required placeholder="Mật khẩu *"
                value={formData.password} onChange={handleChange} 
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500" />
            </div>

            {!isLogin && (
              <div>
                <input type="password" name="confirmPassword" required placeholder="Xác nhận Mật khẩu *"
                  value={formData.confirmPassword} onChange={handleChange}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500" />
              </div>
            )}

            {isLogin && (
              <div className="text-right">
                <button type="button" onClick={() => setForgotPasswordStep(1)} className="text-sm font-semibold text-sky-500 hover:underline">
                  Quên mật khẩu?
                </button>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-black text-lg py-3 rounded-xl shadow-lg shadow-sky-500/30 transition hover:scale-[1.02] disabled:bg-gray-400 mt-4"
            >
              {loading ? 'ĐANG XỬ LÝ...' : (isLogin ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ & NHẬN OTP')}
            </button>

            {/* Nút Đăng nhập Google */}
            <div className="mt-6 flex flex-col items-center">
              <div className="relative w-full flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative bg-white/90 px-4 text-sm text-gray-500">HOẶC</div>
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
          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-gray-600 font-medium">
              {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
              <button 
                onClick={() => { setIsLogin(!isLogin); setFormData({name: '', phone: '', address: '', email: '', password: '', confirmPassword: '', otp: ''}); }} 
                className="text-sky-500 font-bold hover:underline ml-1"
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
