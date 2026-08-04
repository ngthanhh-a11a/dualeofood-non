import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios, { SERVER_URL , getImageUrl } from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { FiUser, FiLock, FiSave, FiCamera, FiLoader, FiStar, FiChevronRight, FiMapPin } from 'react-icons/fi';

const Profile = () => {
  const [user, setUser] = useState({ name: '', email: '', avatar: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // State cho ảnh đại diện
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Tải dữ liệu người dùng khi component được mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
          setLoading(true);
          const { data } = await axios.get('/users/profile');
          // Xử lý dữ liệu người dùng
          setUser(data);
          if (data.avatar) {
              setAvatarPreview(`${getImageUrl(data.avatar)}`);
          }
      } catch (error) {
          toast.error('Không thể tải dữ liệu trang hồ sơ.');
          console.error(error);
      } finally {
          setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Xử lý khi người dùng chọn ảnh mới
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Xử lý tải ảnh đại diện lên server
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    setIsUploadingAvatar(true);
    try {
      const { data } = await axios.put('/users/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Cập nhật localStorage để Header hiển thị avatar mới
      const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
      storedUserInfo.avatar = data.user.avatar;
      localStorage.setItem('userInfo', JSON.stringify(storedUserInfo));
      
      toast.success('Cập nhật ảnh đại diện thành công!');
      setTimeout(() => window.location.reload(), 1000); // Tải lại trang để Header cập nhật
    } catch (error) {
      toast.error(error.response?.data?.message || 'Tải ảnh lên thất bại.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleProfileChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  // Xử lý cập nhật thông tin cá nhân
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data } = await axios.put('/users/profile', {
        name: user.name,
      });
      // Cập nhật lại localStorage để Header hiển thị tên mới
      setUser(data.user);
      const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
      storedUserInfo.name = data.user.name;
      localStorage.setItem('userInfo', JSON.stringify(storedUserInfo));
      
      toast.success('Cập nhật thông tin thành công!');
      // Tải lại trang để đảm bảo Header được cập nhật
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  // Xử lý đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu mới không khớp!');
      return;
    }
    setIsSavingPassword(true);
    try {
      const { data } = await axios.put('/users/change-password', passwordData);
      toast.success(data.message);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 font-bold text-sky-500">Đang tải thông tin...</div>;
  }

  return (
    <div className="font-sans bg-slate-50/70 min-h-screen py-10 md:py-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cột trái: Avatar và thông tin tóm tắt */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-50 text-center sticky top-24">
              <div className="relative w-32 h-32 mx-auto group">
                <img 
                  src={avatarPreview || `https://ui-avatars.com/api/?name=${user.name}&background=0ea5e9&color=fff&size=128&bold=true`} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover border-4 border-white shadow-md"
                />
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                <button onClick={() => fileInputRef.current.click()} className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <FiCamera size={24} />
                </button>
              </div>
              
              {avatarFile && (
                <div className="mt-4">
                  <button onClick={handleAvatarUpload} disabled={isUploadingAvatar} className="bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 transition text-sm disabled:bg-gray-400 flex items-center justify-center gap-2 w-full">
                    {isUploadingAvatar ? <FiLoader className="animate-spin" /> : <FiSave />}
                    {isUploadingAvatar ? 'Đang tải lên...' : 'Lưu ảnh'}
                  </button>
                </div>
              )}

              <h2 className="text-2xl font-bold text-gray-800 mt-4">{user.name}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          {/* Cột phải: Các form chỉnh sửa */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-sky-50">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><FiUser /> Thông tin cá nhân</h3>
              <form onSubmit={handleProfileUpdate} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="text-sm font-semibold text-gray-600 mb-1 block">Họ và tên</label><input type="text" name="name" value={user.name} onChange={handleProfileChange} required className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-sky-500 transition" /></div>
                  <div><label className="text-sm font-semibold text-gray-600 mb-1 block">Email</label><input type="email" name="email" value={user.email} disabled className="w-full border-2 border-gray-200 bg-gray-100 rounded-lg px-4 py-2.5 text-gray-500" /></div>
                </div>
                <div className="text-right pt-2"><button type="submit" disabled={isSaving} className="bg-sky-500 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-sky-600 transition disabled:bg-gray-400 flex items-center gap-2 ml-auto"><FiSave/> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div>
              </form>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-sky-50">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><FiLock /> Đổi mật khẩu</h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-1 block">Mật khẩu hiện tại</label>
                  <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} required className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-sky-500 transition" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-1 block">Mật khẩu mới (ít nhất 6 ký tự)</label>
                  <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} required className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-sky-500 transition" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-1 block">Xác nhận mật khẩu mới</label>
                  <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} required className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-sky-500 transition" />
                </div>
                <div className="text-right pt-2"><button type="submit" disabled={isSavingPassword} className="bg-slate-700 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-slate-800 transition disabled:bg-gray-400">{isSavingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</button></div>
              </form>
            </div>

            {/* Mục 3: Liên kết đến trang Đánh giá */}
            <Link to="/my-reviews" className="block bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-sky-50 hover:shadow-lg hover:border-sky-300 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                    <FiStar className="w-6 h-6 text-sky-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Đánh giá của tôi</h3>
                </div>
                <FiChevronRight className="w-6 h-6 text-gray-400" />
              </div>
            </Link>

            {/* Mục 4: Liên kết đến trang Sổ địa chỉ */}
            <Link to="/my-addresses" className="block bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-sky-50 hover:shadow-lg hover:border-sky-300 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                    <FiMapPin className="w-6 h-6 text-sky-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Sổ địa chỉ</h3>
                </div>
                <FiChevronRight className="w-6 h-6 text-gray-400" />
              </div>
            </Link>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;