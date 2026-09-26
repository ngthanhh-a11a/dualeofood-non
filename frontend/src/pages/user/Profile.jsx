import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios, { getImageUrl } from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { 
  FiUser, FiLock, FiSave, FiCamera, FiLoader, FiStar, 
  FiChevronRight, FiMapPin, FiPackage, FiFileText, FiClock,
  FiEye, FiHeart, FiMessageSquare, FiPlus, FiExternalLink, FiSettings,
  FiPlayCircle, FiTrash2
} from 'react-icons/fi';
import { FaBookmark, FaCheckCircle, FaHourglassHalf, FaTimesCircle, FaThumbtack } from 'react-icons/fa';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('my-posts'); // 'my-posts' | 'account' | 'shortcuts'
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

  // State cho Bài viết của tôi
  const [myArticles, setMyArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  // State cho Story của tôi
  const [myStories, setMyStories] = useState([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [deletingStoryId, setDeletingStoryId] = useState(null);
  const [deletingArticleId, setDeletingArticleId] = useState(null);

  const navigate = useNavigate();

  // Tải dữ liệu ban đầu
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/users/profile');
        setUser(data);
        if (data.avatar) {
          setAvatarPreview(`${getImageUrl(data.avatar)}`);
        }
      } catch (error) {
        toast.error('Không thể tải thông tin cá nhân.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Tải bài viết và story của chính người dùng
  useEffect(() => {
    const fetchMyArticles = async () => {
      setLoadingArticles(true);
      try {
        const res = await axios.get('/articles/my-articles');
        setMyArticles(res.data || []);
      } catch (error) {
        console.warn('Lỗi khi tải bài viết của tôi:', error);
      } finally {
        setLoadingArticles(false);
      }
    };

    const fetchMyStories = async () => {
      setLoadingStories(true);
      try {
        const res = await axios.get('/stories/my-stories');
        setMyStories(res.data || []);
      } catch (error) {
        console.warn('Lỗi khi tải story của tôi:', error);
      } finally {
        setLoadingStories(false);
      }
    };

    fetchMyArticles();
    fetchMyStories();
  }, []);

  // Xử lý khi chọn ảnh đại diện mới
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file hình ảnh hợp lệ.');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Tải ảnh đại diện lên server
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    const formData = new FormData();
    formData.append('avatar', avatarFile);

    setIsUploadingAvatar(true);
    try {
      const { data } = await axios.put('/users/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      storedUserInfo.avatar = data.user.avatar;
      localStorage.setItem('userInfo', JSON.stringify(storedUserInfo));

      toast.success('Cập nhật ảnh đại diện thành công!');
      setAvatarFile(null);
      setTimeout(() => window.location.reload(), 800);
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

  // Cập nhật họ tên
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data } = await axios.put('/users/profile', {
        name: user.name,
      });

      setUser(data.user);
      const storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      storedUserInfo.name = data.user.name;
      localStorage.setItem('userInfo', JSON.stringify(storedUserInfo));

      toast.success('Cập nhật thông tin thành công!');
      setTimeout(() => window.location.reload(), 800);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu mới không khớp!');
      return;
    }
    setIsSavingPassword(true);
    try {
      const { data } = await axios.put('/users/change-password', passwordData);
      toast.success(data.message || 'Đổi mật khẩu thành công!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Render badge trạng thái kiểm duyệt bài viết
  const renderArticleStatus = (status, isPublished) => {
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
          <FaCheckCircle className="text-emerald-500 text-xs" />
          <span>Đã duyệt & Đang hiển thị</span>
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200 animate-pulse">
          <FaHourglassHalf className="text-amber-500 text-xs" />
          <span>Chờ quản trị viên duyệt</span>
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
          <FaTimesCircle className="text-rose-500 text-xs" />
          <span>Chưa được duyệt</span>
        </span>
      );
    }
    return null;
  };

  // Render badge trạng thái kiểm duyệt story
  const renderStoryStatus = (status, isPublished) => {
    if (!isPublished) {
      return (
        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
          <span>Đã ẩn</span>
        </span>
      );
    }
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
          <FaCheckCircle className="text-[10px]" />
          <span>Đã duyệt</span>
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-500/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs animate-pulse">
          <FaHourglassHalf className="text-[10px]" />
          <span>Chờ duyệt</span>
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 bg-rose-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
          <FaTimesCircle className="text-[10px]" />
          <span>Từ chối</span>
        </span>
      );
    }
    return null;
  };

  // Xóa Story của tôi
  const handleDeleteStory = async (storyId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa Story này không? Hành động này không thể hoàn tác.')) {
      return;
    }
    setDeletingStoryId(storyId);
    try {
      await axios.delete(`/stories/${storyId}`);
      toast.success('Đã xóa Story thành công!');
      setMyStories((prev) => prev.filter((s) => s._id !== storyId));
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Không thể xóa Story này.');
    } finally {
      setDeletingStoryId(null);
    }
  };

  // Xóa bài viết của tôi
  const handleDeleteArticle = async (articleId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.')) {
      return;
    }
    setDeletingArticleId(articleId);
    try {
      await axios.delete(`/articles/${articleId}`);
      toast.success('Đã xóa bài viết thành công!');
      setMyArticles((prev) => prev.filter((a) => a._id !== articleId));
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Không thể xóa bài viết này.');
    } finally {
      setDeletingArticleId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 font-bold text-sky-500">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Đang tải thông tin tài khoản...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans bg-slate-50/70 min-h-screen py-6 md:py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* ================= 1. HEADER PROFILE & HOẠT ĐỘNG BANNER ================= */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden mb-6">
          {/* Banner màu gradient */}
          <div className="h-28 sm:h-36 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 relative">
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30">
              Khách hàng thân thiết
            </div>
          </div>

          {/* Khối avatar và thông tin người dùng */}
          <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              {/* Avatar với nút upload */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 group shrink-0">
                <img 
                  src={avatarPreview || `https://ui-avatars.com/api/?name=${user.name}&background=0ea5e9&color=fff&size=128&bold=true`} 
                  alt="Avatar" 
                  className="w-full h-full rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                />
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                <button 
                  onClick={() => fileInputRef.current.click()} 
                  className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Thay đổi ảnh đại diện"
                >
                  <FiCamera size={22} />
                </button>
              </div>

              {/* Thông tin tên & email */}
              <div className="mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800">{user.name}</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{user.email}</p>
                {avatarFile && (
                  <button 
                    onClick={handleAvatarUpload} 
                    disabled={isUploadingAvatar} 
                    className="mt-2 bg-sky-500 text-white font-bold py-1.5 px-3.5 rounded-lg hover:bg-sky-600 transition text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    {isUploadingAvatar ? <FiLoader className="animate-spin" /> : <FiSave />}
                    <span>{isUploadingAvatar ? 'Đang tải lên...' : 'Lưu ảnh đại diện mới'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Nút viết bài mới nhanh */}
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-transform active:scale-95 shrink-0"
            >
              <FiPlus className="text-base" />
              <span>Đăng bài viết mới</span>
            </Link>
          </div>
        </div>

        {/* ================= 2. TABS ĐIỀU HƯỚNG GỌN GÀNG ================= */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-1 rounded-2xl shadow-xs border border-slate-200/80 inline-flex max-w-full overflow-x-auto custom-scrollbar gap-1">
            <button
              onClick={() => setActiveTab('my-posts')}
              className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === 'my-posts' 
                  ? 'bg-sky-500 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FiFileText size={16} /> 
              <span>Bài viết của tôi ({myArticles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('my-stories')}
              className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === 'my-stories' 
                  ? 'bg-rose-500 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FiPlayCircle size={16} /> 
              <span>Story của tôi ({myStories.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === 'shortcuts' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FiStar size={16} /> 
              <span>Hoạt động & Tiện ích</span>
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === 'account' 
                  ? 'bg-slate-800 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FiSettings size={16} /> 
              <span>Cài đặt tài khoản</span>
            </button>
          </div>
        </div>

        {/* ================= 3. NỘI DUNG TỪNG TAB ================= */}

        {/* TAB 1: BÀI VIẾT CỦA TÔI */}
        {activeTab === 'my-posts' && (
          <div className="space-y-4 animate-fadeIn">
            {loadingArticles ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs text-slate-400 font-semibold">Đang tải bài viết của bạn...</p>
              </div>
            ) : myArticles.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200/80 shadow-xs">
                <div className="w-16 h-16 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  ✍️
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Bạn chưa đăng bài viết nào</h3>
                <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mb-6">
                  Chia sẻ những câu chuyện ẩm thực, review món ngon hoặc trải nghiệm ăn uống của bạn cùng cộng đồng DualeoFood nhé!
                </p>
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm py-2.5 px-6 rounded-xl transition-all shadow-xs"
                >
                  <FiPlus /> Đăng bài viết đầu tiên ngay
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-500">
                  <span>Bạn đã đăng {myArticles.length} bài viết</span>
                  <Link to="/blog" className="text-sky-500 hover:underline">
                    Đăng thêm bài mới ➔
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myArticles.map((art) => (
                    <div
                      key={art._id}
                      className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Ảnh bìa + Badge trạng thái */}
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 mb-3.5">
                          <img
                            src={art.thumbnail}
                            alt={art.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2.5 left-2.5">
                            {renderArticleStatus(art.status, art.isPublished)}
                          </div>
                        </div>

                        {/* Tiêu đề & Thông tin */}
                        <h4 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors text-base line-clamp-2 leading-snug mb-2">
                          {art.title}
                        </h4>

                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                          <span className="flex items-center gap-1">
                            <FiClock size={12} /> {new Date(art.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <FiEye size={12} /> {art.views || 0} xem
                          </span>
                        </div>

                        {/* Thống kê tim và bình luận */}
                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-3 border-t border-slate-100">
                          <span className="flex items-center gap-1 text-rose-500">
                            <FiHeart size={14} className="fill-current" /> {art.claps || 0} lượt thích
                          </span>
                          <span className="flex items-center gap-1 text-sky-500">
                            <FiMessageSquare size={14} /> {art.comments?.length || 0} bình luận
                          </span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {art.status === 'approved' ? 'Công khai trên feed' : 'Đang xử lý'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteArticle(art._id)}
                            disabled={deletingArticleId === art._id}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Xóa bài viết này"
                          >
                            {deletingArticleId === art._id ? (
                              <FiLoader className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <FiTrash2 size={13} />
                            )}
                            <span>Xóa</span>
                          </button>

                          <Link
                            to={`/blog/${art.slug}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <span>Xem</span>
                            <FiExternalLink size={12} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1.5: STORY CỦA TÔI */}
        {activeTab === 'my-stories' && (
          <div className="space-y-4 animate-fadeIn">
            {loadingStories ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs">
                <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs text-slate-400 font-semibold">Đang tải story của bạn...</p>
              </div>
            ) : myStories.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200/80 shadow-xs">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  📱
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Bạn chưa đăng Story nào</h3>
                <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mb-6">
                  Chia sẻ những khoảnh khắc 24h ẩm thực hấp dẫn, món ngon đang thưởng thức để kết nối với mọi người!
                </p>
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm py-2.5 px-6 rounded-xl transition-all shadow-xs"
                >
                  <FiPlus /> Tạo Story đầu tiên ngay
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-500">
                  <span>Bạn có {myStories.length} Story</span>
                  <Link to="/blog" className="text-rose-500 hover:underline flex items-center gap-1">
                    <FiPlus size={14} /> Đăng thêm Story mới ➔
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {myStories.map((story) => (
                    <div
                      key={story._id}
                      className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
                    >
                      {/* Ảnh Story tỷ lệ 4:5 hoặc 9:16 */}
                      <div className="relative aspect-[9/14] w-full overflow-hidden bg-slate-900">
                        <img
                          src={story.image}
                          alt={story.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none" />

                        {/* Badge trạng thái ở góc trên */}
                        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
                          {renderStoryStatus(story.status, story.isPublished)}
                          {story.isPinned && (
                            <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                              <FaThumbtack className="text-[9px]" /> Ghim
                            </span>
                          )}
                        </div>

                        {/* Nút xóa Story */}
                        <button
                          onClick={() => handleDeleteStory(story._id)}
                          disabled={deletingStoryId === story._id}
                          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors backdrop-blur-xs disabled:opacity-50"
                          title="Xóa story này"
                        >
                          {deletingStoryId === story._id ? (
                            <FiLoader className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FiTrash2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Nội dung bên dưới ảnh Story */}
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 text-white">
                          <h4 className="font-bold text-sm line-clamp-1 drop-shadow-sm">
                            {story.title}
                          </h4>
                          {story.caption && (
                            <p className="text-[11px] text-white/80 line-clamp-2 mt-0.5 drop-shadow-xs">
                              {story.caption}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-white/70 mt-2 pt-1.5 border-t border-white/20">
                            <span className="flex items-center gap-1">
                              <FiEye size={11} /> {story.viewsCount || 0} xem
                            </span>
                            <span>{new Date(story.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer link xem bài trên feed */}
                      <div className="p-2.5 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                        <Link
                          to="/blog"
                          className="w-full text-center text-xs font-bold text-sky-600 hover:text-sky-700 py-1 rounded-lg hover:bg-sky-50 transition-colors flex items-center justify-center gap-1"
                        >
                          <span>Xem trên feed</span>
                          <FiExternalLink size={12} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HOẠT ĐỘNG & TIỆN ÍCH LIÊN KẾT NHANH */}
        {activeTab === 'shortcuts' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
            {/* Đánh giá món ăn & bình luận */}
            <Link 
              to="/my-reviews" 
              className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:shadow-md hover:border-sky-300 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                  <FiStar />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm sm:text-base group-hover:text-sky-600 transition-colors">
                    Đánh giá của tôi
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Xem cảm nhận món ăn & bình luận</p>
                </div>
              </div>
              <FiChevronRight className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Bài viết đã lưu / Yêu thích */}
            <Link 
              to="/my-reviews?tab=saved" 
              className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:shadow-md hover:border-amber-300 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                  <FaBookmark />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm sm:text-base group-hover:text-amber-600 transition-colors">
                    Bài viết đã lưu (Yêu thích)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Các bài viết đã đánh dấu Bookmark</p>
                </div>
              </div>
              <FiChevronRight className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Đơn hàng của tôi */}
            <Link 
              to="/my-orders" 
              className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:shadow-md hover:border-emerald-300 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                  <FiPackage />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm sm:text-base group-hover:text-emerald-600 transition-colors">
                    Đơn hàng của tôi
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Theo dõi lịch sử đơn và trạng thái</p>
                </div>
              </div>
              <FiChevronRight className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Sổ địa chỉ */}
            <Link 
              to="/my-addresses" 
              className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:shadow-md hover:border-rose-300 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                  <FiMapPin />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm sm:text-base group-hover:text-rose-600 transition-colors">
                    Sổ địa chỉ nhận hàng
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Quản lý địa chỉ giao đồ ăn</p>
                </div>
              </div>
              <FiChevronRight className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}

        {/* TAB 3: CÀI ĐẶT TÀI KHOẢN & MẬT KHẨU */}
        {activeTab === 'account' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Form Thông tin cá nhân */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FiUser className="text-sky-500" /> Thông tin cá nhân
              </h3>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Họ và tên</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={user.name} 
                    onChange={handleProfileChange} 
                    required 
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-sky-500 transition" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Địa chỉ Email</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={user.email} 
                    disabled 
                    className="w-full border border-slate-200 bg-slate-100 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-500 cursor-not-allowed" 
                  />
                </div>
                <div className="pt-2 text-right">
                  <button 
                    type="submit" 
                    disabled={isSaving} 
                    className="bg-sky-500 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-sky-600 transition text-xs disabled:opacity-50 flex items-center gap-1.5 ml-auto shadow-xs"
                  >
                    <FiSave /> {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
                  </button>
                </div>
              </form>
            </div>

            {/* Form Đổi mật khẩu */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FiLock className="text-slate-700" /> Đổi mật khẩu
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Mật khẩu hiện tại</label>
                  <input 
                    type="password" 
                    name="currentPassword" 
                    value={passwordData.currentPassword} 
                    onChange={handlePasswordChange} 
                    required 
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-sky-500 transition" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Mật khẩu mới</label>
                  <input 
                    type="password" 
                    name="newPassword" 
                    value={passwordData.newPassword} 
                    onChange={handlePasswordChange} 
                    required 
                    placeholder="Ít nhất 6 ký tự"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-sky-500 transition" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Xác nhận mật khẩu mới</label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    value={passwordData.confirmPassword} 
                    onChange={handlePasswordChange} 
                    required 
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-sky-500 transition" 
                  />
                </div>
                <div className="pt-2 text-right">
                  <button 
                    type="submit" 
                    disabled={isSavingPassword} 
                    className="bg-slate-800 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-slate-900 transition text-xs disabled:opacity-50 ml-auto shadow-xs"
                  >
                    {isSavingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;