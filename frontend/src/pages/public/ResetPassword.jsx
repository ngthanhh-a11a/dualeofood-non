import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { token } = useParams(); // Lấy token từ URL
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`/auth/reset-password/${token}`, { password });
      setMessage(response.data.message + ' Bạn sẽ được chuyển đến trang đăng nhập sau 3 giây.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans py-10 bg-sky-50">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-sky-50 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-sky-500 mb-2">TẠO MẬT KHẨU MỚI</h1>
          <p className="text-gray-500 font-medium">Vui lòng nhập mật khẩu mới của bạn.</p>
        </div>

        {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-center">{message}</div>}
        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">{error}</div>}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-600 font-semibold mb-1 text-sm">Mật khẩu mới *</label>
              <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-sky-500 transition" />
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-1 text-sm">Xác nhận mật khẩu *</label>
              <input type="password" required placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-sky-500 transition" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-black text-lg py-3 rounded-xl shadow-md transition duration-300 disabled:bg-gray-400 mt-2">
              {loading ? 'ĐANG CẬP NHẬT...' : 'ĐẶT LẠI MẬT KHẨU'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;