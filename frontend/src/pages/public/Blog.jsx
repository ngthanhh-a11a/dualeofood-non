import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { 
    FaHeart, FaRegHeart, FaRegComment, FaPaperPlane, 
    FaBookmark, FaRegBookmark, FaEllipsisH, FaCheckCircle, 
    FaSmile, FaTimes, FaImage, FaTag, FaGlobeAmericas, FaTrashAlt
} from 'react-icons/fa';
import { FiArrowRight, FiChevronLeft, FiChevronRight, FiUploadCloud, FiClock, FiPlus, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

// --- Danh sách Stories khởi tạo mặc định ---
const DEFAULT_STORIES = [
    {
        id: 's_deal',
        title: '🔥 Ưu đãi Hot',
        author: 'Dualeo Deals',
        avatar: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=200&auto=format&fit=crop',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop',
        caption: 'Giảm ngay 25% cho tất cả đơn hàng từ 150k trong tuần này! Nhập mã DEAL25 tại giỏ hàng.',
        link: '/menu',
        btnText: 'Săn Voucher Ngay',
        createdAt: new Date().toISOString()
    },
    {
        id: 's_chef',
        title: '🍔 Món Mới',
        author: 'Chef Dualeo',
        avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=200&auto=format&fit=crop',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop',
        caption: 'Burger bò phô mai tan chảy hảo hạng vừa ra mắt - thịt bò thượng hạng sốt tiêu đen đã lên kệ!',
        link: '/menu',
        btnText: 'Đặt Món Mới',
        createdAt: new Date().toISOString()
    }
];

const POPULAR_TAGS = ['review', 'monngon', 'anvat', 'trainghiem', 'pizza', 'burger', 'khuyenmai', 'bepdualeo'];

const Blog = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savedPostIds, setSavedPostIds] = useState(new Set());
    const [commentInputs, setCommentInputs] = useState({});
    const [submittingCommentId, setSubmittingCommentId] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    // Double-tap heart animation state { [articleId]: true }
    const [animatingHeartId, setAnimatingHeartId] = useState(null);
    const lastClickRef = useRef({});

    // Expanded captions state
    const [expandedCaptions, setExpandedCaptions] = useState({});

    // Post Options Modal state
    const [activeOptionsArticle, setActiveOptionsArticle] = useState(null);

    // Full Comments Modal state
    const [activeCommentArticle, setActiveCommentArticle] = useState(null);

    // Story Viewer Modal state & Dynamic Stories
    const [stories, setStories] = useState(() => {
        try {
            const saved = localStorage.getItem('dualeo_stories');
            return saved ? JSON.parse(saved) : DEFAULT_STORIES;
        } catch {
            return DEFAULT_STORIES;
        }
    });
    const [activeStoryIndex, setActiveStoryIndex] = useState(null);
    const [storyProgress, setStoryProgress] = useState(0);

    // === STATE CHO MODAL TẠO STORY THỰC TẾ ===
    const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
    const [storyFormData, setStoryFormData] = useState({
        title: '',
        caption: '',
        link: '',
        btnText: '',
        image: null,
        previewUrl: null
    });
    const [submittingStory, setSubmittingStory] = useState(false);
    const storyFileInputRef = useRef(null);

    // === STATE CHO MODAL TẠO BÀI VIẾT KIỂU FACEBOOK ===
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        title: '',
        content: '',
        tags: '',
        thumbnail: null,
        previewUrl: null
    });
    const [submittingPost, setSubmittingPost] = useState(false);
    const fileInputRef = useRef(null);

    const navigate = useNavigate();

    // Lấy thông tin user, bài viết, và danh sách đã lưu
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('userInfo') || 'null');
        setUserInfo(storedUser);

        const storedSaved = JSON.parse(localStorage.getItem('saved_article_ids') || '[]');
        setSavedPostIds(new Set(storedSaved));

        const fetchArticles = async () => {
            try {
                const res = await axios.get('/articles');
                setArticles(res.data || []);
            } catch (error) {
                console.error('Lỗi khi lấy bài viết:', error);
                toast.error('Không thể tải danh sách bài viết');
            } finally {
                setLoading(false);
            }
        };

        const fetchStories = async () => {
            try {
                const res = await axios.get('/stories');
                if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                    setStories(res.data);
                }
            } catch (err) {
                console.warn('Không thể tải Story từ server, sử dụng danh sách dự phòng:', err);
            }
        };

        fetchArticles();
        fetchStories();
    }, []);

    // Xử lý tự chạy Story khi mở modal
    useEffect(() => {
        if (activeStoryIndex === null || stories.length === 0) {
            setStoryProgress(0);
            return;
        }

        const duration = 5000;
        const intervalTime = 50;
        const step = (intervalTime / duration) * 100;

        const timer = setInterval(() => {
            setStoryProgress(prev => {
                if (prev >= 100) {
                    if (activeStoryIndex < stories.length - 1) {
                        setActiveStoryIndex(curr => curr + 1);
                        return 0;
                    } else {
                        setActiveStoryIndex(null);
                        return 0;
                    }
                }
                return prev + step;
            });
        }, intervalTime);

        return () => clearInterval(timer);
    }, [activeStoryIndex, stories.length]);

    // Chuyển đổi HTML thô thành văn bản thuần
    const getPlainText = (html) => {
        if (!html) return "";
        const doc = new DOMParser().parseFromString(html, "text/html");
        return (doc.body.textContent || "").replace(/\u00A0/g, ' ');
    };

    // Định dạng thời gian phong cách Instagram
    const timeAgo = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Vừa xong';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} giờ trước`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    // Kiểm tra bài viết đã được like chưa
    const isLikedByUser = (article) => {
        if (!userInfo) return false;
        const userId = userInfo._id || userInfo.id;
        return (article.clappedBy || []).includes(userId);
    };

    // Xử lý Thích / Bỏ thích (Like / Unlike)
    const handleToggleLike = async (article) => {
        if (!userInfo) {
            toast.error('Vui lòng đăng nhập để thả tim bài viết!');
            return;
        }

        const userId = userInfo._id || userInfo.id;
        const isLiked = isLikedByUser(article);

        // Optimistic update
        setArticles(prevList => prevList.map(item => {
            if (item._id === article._id) {
                const currentClaps = item.claps || 0;
                const currentClappedBy = item.clappedBy || [];

                return {
                    ...item,
                    claps: isLiked ? Math.max(0, currentClaps - 1) : currentClaps + 1,
                    clappedBy: isLiked 
                        ? currentClappedBy.filter(id => id !== userId) 
                        : [...currentClappedBy, userId]
                };
            }
            return item;
        }));

        try {
            const token = userInfo.token || localStorage.getItem('token');
            const endpoint = isLiked ? `/articles/${article._id}/unclap` : `/articles/${article._id}/clap`;
            await axios.post(endpoint, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Lỗi khi thao tác like:', error);
            toast.error('Có lỗi xảy ra khi thả tim.');
            const res = await axios.get('/articles');
            setArticles(res.data || []);
        }
    };

    // Xử lý Double Click / Tap trên ảnh bài viết
    const handleImageDoubleTap = (article) => {
        const now = Date.now();
        setAnimatingHeartId(article._id);
        setTimeout(() => setAnimatingHeartId(null), 900);

        if (!isLikedByUser(article)) {
            handleToggleLike(article);
        }

        lastClickRef.current[article._id] = now;
    };

    // Xử lý Lưu bài viết (Bookmark) - Màu vàng hổ phách
    const handleToggleSave = (article) => {
        const articleId = article._id;
        setSavedPostIds(prev => {
            const next = new Set(prev);
            const storedArticles = JSON.parse(localStorage.getItem('saved_articles_data') || '[]');

            if (next.has(articleId)) {
                next.delete(articleId);
                const updated = storedArticles.filter(a => a._id !== articleId);
                localStorage.setItem('saved_articles_data', JSON.stringify(updated));
                toast('Đã bỏ lưu bài viết', { icon: '🔖' });
            } else {
                next.add(articleId);
                const newArticleData = {
                    _id: article._id,
                    title: article.title,
                    slug: article.slug,
                    thumbnail: article.thumbnail,
                    content: article.content,
                    author: article.author?.name || 'DualeoFood Official',
                    authorAvatar: article.author?.avatar,
                    tags: article.tags || [],
                    claps: article.claps || 0,
                    commentsCount: article.comments?.length || 0,
                    savedAt: new Date().toISOString()
                };
                const updated = [newArticleData, ...storedArticles.filter(a => a._id !== articleId)];
                localStorage.setItem('saved_articles_data', JSON.stringify(updated));
                toast.success('Đã lưu bài viết vào mục "Đánh giá của tôi"!', { icon: '⭐' });
            }
            localStorage.setItem('saved_article_ids', JSON.stringify(Array.from(next)));
            return next;
        });
    };

    // Xử lý gửi bình luận nhanh trực tiếp trên Feed
    const handleQuickCommentSubmit = async (articleId) => {
        if (!userInfo) {
            toast.error('Vui lòng đăng nhập để bình luận!');
            return;
        }

        const text = (commentInputs[articleId] || '').trim();
        if (!text) return;

        setSubmittingCommentId(articleId);
        try {
            const token = userInfo.token || localStorage.getItem('token');
            const res = await axios.post(`/articles/${articleId}/comments`, { content: text }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setArticles(prev => prev.map(art => {
                if (art._id === articleId) {
                    return { ...art, comments: res.data.comments || [] };
                }
                return art;
            }));

            if (activeCommentArticle && activeCommentArticle._id === articleId) {
                setActiveCommentArticle(prev => ({
                    ...prev,
                    comments: res.data.comments || []
                }));
            }

            setCommentInputs(prev => ({ ...prev, [articleId]: '' }));
            toast.success('Đã đăng bình luận!', { icon: '💬' });
        } catch (error) {
            console.error('Lỗi khi gửi bình luận:', error);
            toast.error(error.response?.data?.message || 'Không thể đăng bình luận');
        } finally {
            setSubmittingCommentId(null);
        }
    };

    // Sao chép link bài viết
    const handleCopyPostLink = (article) => {
        const url = `${window.location.origin}/blog/${article.slug}`;
        navigator.clipboard.writeText(url);
        toast.success('Đã sao chép liên kết bài viết!', { icon: '📋' });
        setActiveOptionsArticle(null);
    };

    // Bật/tắt mở rộng caption
    const toggleCaption = (articleId) => {
        setExpandedCaptions(prev => ({ ...prev, [articleId]: !prev[articleId] }));
    };

    // === HÀM XỬ LÝ TẠO STORY THỰC TẾ (INSTAGRAM STYLE) ===
    const handleOpenCreateStory = () => {
        if (!userInfo) {
            toast.error('Vui lòng đăng nhập để tạo Story!');
            navigate('/login');
            return;
        }
        setShowCreateStoryModal(true);
    };

    const handleSelectStoryImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Vui lòng chọn file hình ảnh hợp lệ');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Ảnh không được vượt quá 5MB');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setStoryFormData(prev => ({
                    ...prev,
                    image: file,
                    previewUrl: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitCreateStory = async (e) => {
        e.preventDefault();
        if (!userInfo) return toast.error('Vui lòng đăng nhập!');
        if (!storyFormData.title.trim()) return toast.error('Vui lòng nhập tên tiêu đề Story');
        if (!storyFormData.image) return toast.error('Vui lòng chọn một hình ảnh cho Story');

        setSubmittingStory(true);
        const loadingToast = toast.loading('Đang tải ảnh lên Cloudinary và lưu Story...');
        try {
            const token = userInfo.token || localStorage.getItem('token');
            const data = new FormData();
            data.append('title', storyFormData.title.trim());
            data.append('caption', storyFormData.caption.trim());
            data.append('image', storyFormData.image);
            
            // Chỉ Quản trị viên hoặc Nhân viên mới được quyền gắn nút hành động và link điều hướng
            if (userInfo.role === 'admin' || userInfo.role === 'staff') {
                if (storyFormData.btnText) data.append('btnText', storyFormData.btnText.trim());
                if (storyFormData.link) data.append('link', storyFormData.link.trim());
            }

            const res = await axios.post('/stories', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            toast.dismiss(loadingToast);

            if (userInfo.role === 'admin') {
                toast.success('Đã đăng Story thành công! 🌟', { icon: '🎉' });
                setStories(prev => [res.data, ...prev]);
            } else {
                toast.success(
                    'Đăng Story thành công! Tin của bạn đang chờ Admin duyệt để hiển thị công khai. ⏳', 
                    { duration: 6000, icon: '✨' }
                );
            }

            setStoryFormData({
                title: '',
                caption: '',
                link: '',
                btnText: '',
                image: null,
                previewUrl: null
            });
            if (storyFileInputRef.current) storyFileInputRef.current.value = '';
            setShowCreateStoryModal(false);
        } catch (err) {
            toast.dismiss(loadingToast);
            console.error('Lỗi khi lưu story:', err);
            toast.error(err.response?.data?.message || 'Không thể tạo Story, vui lòng thử lại');
        } finally {
            setSubmittingStory(false);
        }
    };

    const handleDeleteStory = async (storyId, e) => {
        if (e) e.stopPropagation();
        if (window.confirm('Bạn có chắc chắn muốn xóa tin này không?')) {
            try {
                const token = userInfo?.token || localStorage.getItem('token');
                await axios.delete(`/stories/${storyId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStories(prev => prev.filter(s => s._id !== storyId && s.id !== storyId));
                setActiveStoryIndex(null);
                toast.success('Đã xóa Story thành công!');
            } catch (err) {
                console.error('Lỗi khi xóa story:', err);
                toast.error(err.response?.data?.message || 'Không thể xóa Story');
            }
        }
    };

    // === HÀM XỬ LÝ ĐĂNG BÀI VIẾT (FACEBOOK STYLE) ===
    const handleOpenCreateModal = () => {
        if (!userInfo) {
            toast.error('Vui lòng đăng nhập để đăng bài viết!');
            navigate('/login');
            return;
        }
        setShowCreateModal(true);
    };

    const handleSelectImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Vui lòng chọn file hình ảnh hợp lệ');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Ảnh không được vượt quá 5MB');
                return;
            }
            setCreateFormData(prev => ({
                ...prev,
                thumbnail: file,
                previewUrl: URL.createObjectURL(file)
            }));
        }
    };

    const handleRemoveImage = () => {
        setCreateFormData(prev => ({
            ...prev,
            thumbnail: null,
            previewUrl: null
        }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleAddTag = (tag) => {
        const currentTags = createFormData.tags
            .split(',')
            .map(t => t.trim().replace(/^#/, ''))
            .filter(Boolean);

        if (!currentTags.includes(tag)) {
            const newTags = [...currentTags, tag].join(', ');
            setCreateFormData(prev => ({ ...prev, tags: newTags }));
        }
    };

    const handleSubmitCreatePost = async (e) => {
        e.preventDefault();
        if (!userInfo) return toast.error('Vui lòng đăng nhập!');
        if (!createFormData.title.trim()) return toast.error('Vui lòng nhập tiêu đề bài viết');
        if (!createFormData.content.trim()) return toast.error('Vui lòng nhập nội dung bài viết');
        if (!createFormData.thumbnail) return toast.error('Vui lòng chọn một bức ảnh cho bài viết');

        setSubmittingPost(true);
        const loadingToast = toast.loading('Đang tải ảnh và gửi bài viết lên hệ thống...');

        try {
            const token = userInfo.token || localStorage.getItem('token');
            const data = new FormData();
            data.append('title', createFormData.title.trim());
            data.append('content', createFormData.content.trim());
            data.append('tags', createFormData.tags);
            data.append('thumbnail', createFormData.thumbnail);

            const res = await axios.post('/articles', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            toast.dismiss(loadingToast);

            if (userInfo.role === 'admin') {
                toast.success('Bài viết đã được đăng trực tiếp thành công!', { icon: '🎉' });
                // Thêm vào danh sách hiển thị
                setArticles(prev => [res.data, ...prev]);
            } else {
                toast.success(
                    'Đăng bài thành công! Bài viết đang chờ Ban quản trị duyệt. Bạn sẽ nhận thông báo qua quả chuông 🔔 khi được duyệt!', 
                    { duration: 6000, icon: '⏳' }
                );
            }

            // Reset form và đóng modal
            setCreateFormData({
                title: '',
                content: '',
                tags: '',
                thumbnail: null,
                previewUrl: null
            });
            setShowCreateModal(false);
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error('Lỗi khi đăng bài viết:', error);
            toast.error(error.response?.data?.message || 'Không thể đăng bài viết');
        } finally {
            setSubmittingPost(false);
        }
    };

    // Xóa bài viết (Chỉ chủ sở hữu bài viết hoặc Admin)
    const handleDeleteArticle = async (articleId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.')) {
            return;
        }
        const loadingToast = toast.loading('Đang xóa bài viết...');
        try {
            await axios.delete(`/articles/${articleId}`);
            toast.dismiss(loadingToast);
            toast.success('Đã xóa bài viết thành công!');
            setArticles(prev => prev.filter(a => a._id !== articleId));
            setActiveOptionsArticle(null);
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error('Lỗi khi xóa bài viết:', error);
            toast.error(error.response?.data?.message || 'Không thể xóa bài viết này');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-6 pb-20">
                <div className="max-w-[590px] mx-auto px-4 space-y-6">
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 flex gap-4 overflow-hidden animate-pulse">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 rounded-full bg-slate-200"></div>
                                <div className="w-12 h-2.5 bg-slate-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                    {[1, 2].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden animate-pulse">
                            <div className="p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                                <div className="space-y-1.5 flex-1">
                                    <div className="w-28 h-3.5 bg-slate-200 rounded"></div>
                                    <div className="w-16 h-2.5 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                            <div className="w-full aspect-square bg-slate-200"></div>
                            <div className="p-4 space-y-3">
                                <div className="w-20 h-4 bg-slate-200 rounded"></div>
                                <div className="w-3/4 h-3.5 bg-slate-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* CONTAINER TRUNG TÂM GỌN GÀNG CHUẨN FEED */}
            <div className="max-w-[590px] mx-auto px-3 sm:px-4 pt-6 md:pt-10 space-y-6">

                {/* 1. THANH STORIES TRÊN CÙNG (CÓ NÚT TẠO TIN THỰC TẾ) */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-4 overflow-x-auto custom-scrollbar pb-1">
                        
                        {/* NÚT TẠO TIN / STORY CỦA BẠN */}
                        <button
                            onClick={handleOpenCreateStory}
                            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
                            title="Tạo Story của bạn"
                        >
                            <div className="relative p-0.5 rounded-full bg-slate-200 group-hover:bg-sky-400 group-hover:scale-105 transition-all duration-200">
                                <div className="p-0.5 bg-white rounded-full">
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                                        {userInfo?.avatar ? (
                                            <img src={userInfo.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xl sm:text-2xl text-slate-400">👤</span>
                                        )}
                                    </div>
                                </div>
                                <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center border-2 border-white shadow-xs group-hover:scale-110 transition-transform">
                                    <FiPlus className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-800 max-w-[70px] truncate text-center group-hover:text-sky-600 transition-colors">
                                Tạo tin
                            </span>
                        </button>

                        {/* DANH SÁCH STORIES HOẠT ĐỘNG THỰC TẾ (ƯU TIÊN: CỦA BẠN -> ĐƯỢC GHIM -> MỚI NHẤT) */}
                        {[...stories].sort((a, b) => {
                            const aIsMine = userInfo && ((a.user?._id && String(a.user._id) === String(userInfo._id || userInfo.id)) || (a.user && String(a.user) === String(userInfo._id || userInfo.id)));
                            const bIsMine = userInfo && ((b.user?._id && String(b.user._id) === String(userInfo._id || userInfo.id)) || (b.user && String(b.user) === String(userInfo._id || userInfo.id)));
                            if (aIsMine && !bIsMine) return -1;
                            if (!aIsMine && bIsMine) return 1;
                            if (a.isPinned && !b.isPinned) return -1;
                            if (!a.isPinned && b.isPinned) return 1;
                            return new Date(b.createdAt) - new Date(a.createdAt);
                        }).map((story, idx) => {
                            const isMyStory = userInfo && ((story.user?._id && String(story.user._id) === String(userInfo._id || userInfo.id)) || (story.user && String(story.user) === String(userInfo._id || userInfo.id)));
                            const isPending = story.status === 'pending';
                            const isPinned = Boolean(story.isPinned);

                            return (
                                <button
                                    key={story._id || story.id || idx}
                                    onClick={() => {
                                        setActiveStoryIndex(idx);
                                        setStoryProgress(0);
                                    }}
                                    className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
                                    title={isPending ? "Story của bạn đang chờ duyệt" : story.title}
                                >
                                    <div className="relative">
                                        <div className={`p-0.5 rounded-full transition-transform duration-200 group-hover:scale-105 shadow-2xs ${
                                            isPending 
                                                ? 'bg-amber-400 ring-2 ring-amber-300 ring-offset-1 animate-pulse'
                                                : isPinned 
                                                ? 'bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 ring-1 ring-amber-400'
                                                : isMyStory
                                                ? 'bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500'
                                                : 'bg-gradient-to-tr from-amber-400 via-rose-500 to-sky-500'
                                        }`}>
                                            <div className="p-0.5 bg-white rounded-full">
                                                <img
                                                    src={story.avatar || "https://ui-avatars.com/api/?name=DF&background=0284c7&color=fff"}
                                                    alt={story.title}
                                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "https://ui-avatars.com/api/?name=Story&background=0284c7&color=fff";
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Huy hiệu nhỏ ở góc */}
                                        {isPending && (
                                            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-white shadow-xs">
                                                ⏳ Chờ
                                            </span>
                                        )}
                                        {!isPending && isPinned && (
                                            <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-xs" title="Đã ghim">
                                                ⭐
                                            </span>
                                        )}
                                        {!isPending && !isPinned && isMyStory && (
                                            <span className="absolute -bottom-1 -right-1 bg-sky-500 text-white text-[8px] font-bold px-1 rounded-full border border-white shadow-xs">
                                                Bạn
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[11px] font-semibold text-slate-700 max-w-[70px] truncate text-center group-hover:text-sky-600 transition-colors">
                                        {isMyStory ? (isPending ? 'Bạn (Chờ)' : 'Bạn') : story.title}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. KHUNG ĐĂNG BÀI VIẾT PHONG CÁCH FACEBOOK ("BẠN ĐANG NGHĨ GÌ THẾ?") */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                    {/* Hàng trên: Avatar + Input click mở modal */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-sky-100 flex items-center justify-center font-bold text-sky-600 shrink-0 border border-slate-200">
                            {userInfo?.avatar ? (
                                <img src={userInfo.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span>{userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : '👤'}</span>
                            )}
                        </div>

                        <button
                            onClick={handleOpenCreateModal}
                            className="flex-1 text-left bg-slate-100/80 hover:bg-slate-200/70 text-slate-500 rounded-full px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer truncate"
                        >
                            {userInfo?.name ? `${userInfo.name} ơi, bạn đang nghĩ gì thế?` : 'Bạn đang nghĩ gì thế? Chia sẻ câu chuyện ẩm thực...'}
                        </button>
                    </div>

                    {/* Đường kẻ mờ */}
                    <div className="border-t border-slate-100 mt-3 pt-2.5 flex items-center justify-around">
                        <button
                            onClick={handleOpenCreateModal}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors"
                        >
                            <FaImage className="text-emerald-500 text-base" />
                            <span>Ảnh/video</span>
                        </button>

                        <button
                            onClick={handleOpenCreateModal}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors"
                        >
                            <FaTag className="text-sky-500 text-base" />
                            <span>Gắn thẻ chủ đề</span>
                        </button>

                        <button
                            onClick={handleOpenCreateModal}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors"
                        >
                            <FaSmile className="text-amber-500 text-base" />
                            <span>Cảm xúc</span>
                        </button>
                    </div>
                </div>

                {/* Phím tắt xem mục yêu thích trong đánh giá */}
                {savedPostIds.size > 0 && (
                    <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-amber-800 font-semibold">
                            <FaBookmark className="text-amber-500" />
                            <span>Bạn đã lưu {savedPostIds.size} bài viết yêu thích</span>
                        </div>
                        <Link
                            to="/my-reviews?tab=saved"
                            className="font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 transition-colors"
                        >
                            Xem trong hồ sơ ➔
                        </Link>
                    </div>
                )}

                {/* 3. DANH SÁCH BÀI ĐĂNG (POSTS FEED) */}
                {articles.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            📸
                        </div>
                        <h3 className="text-base font-bold text-slate-800 mb-1">Chưa có bài đăng nào</h3>
                        <p className="text-sm text-slate-400 mb-4">Hãy là người đầu tiên chia sẻ món ngon lên bảng tin!</p>
                        <button
                            onClick={handleOpenCreateModal}
                            className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs"
                        >
                            <FiPlus /> Đăng bài ngay
                        </button>
                    </div>
                ) : (
                    articles.map((article) => {
                        const isLiked = isLikedByUser(article);
                        const isSaved = savedPostIds.has(article._id);
                        const isExpanded = expandedCaptions[article._id];
                        const plainTextContent = getPlainText(article.content);
                        const authorName = article.author?.name || 'dualeofood_official';
                        const authorAvatar = article.author?.avatar;
                        const commentsCount = article.comments?.length || 0;
                        const clapsCount = article.claps || 0;

                        return (
                            <div
                                key={article._id}
                                className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all duration-200"
                            >
                                {/* --- HEADER BÀI ĐĂNG --- */}
                                <div className="px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-0.5 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600">
                                            <div className="w-9 h-9 rounded-full overflow-hidden bg-white p-0.5">
                                                {authorAvatar ? (
                                                    <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    <div className="w-full h-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-xs rounded-full">
                                                        {authorName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-sm text-slate-900 hover:text-sky-600 cursor-pointer transition-colors">
                                                    {authorName}
                                                </span>
                                                <FaCheckCircle className="text-sky-500 text-xs shrink-0" title="Tài khoản đã xác minh" />
                                                <span className="text-slate-400 text-xs">•</span>
                                                <span className="text-xs text-slate-400 font-medium">
                                                    {timeAgo(article.createdAt)}
                                                </span>
                                            </div>
                                            {article.tags && article.tags.length > 0 && (
                                                <span className="text-[11px] font-semibold text-sky-600/90 block">
                                                    #{article.tags[0]}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setActiveOptionsArticle(article)}
                                        className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                                        title="Tùy chọn bài viết"
                                    >
                                        <FaEllipsisH className="text-sm" />
                                    </button>
                                </div>

                                {/* --- ẢNH BÀI ĐĂNG --- */}
                                <div
                                    className="relative w-full aspect-[4/3] sm:aspect-square bg-slate-900 cursor-pointer select-none overflow-hidden"
                                    onDoubleClick={() => handleImageDoubleTap(article)}
                                >
                                    <img
                                        src={article.thumbnail}
                                        alt={article.title}
                                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.01]"
                                    />

                                    {animatingHeartId === article._id && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                            <FaHeart className="text-white drop-shadow-[0_4px_20px_rgba(239,68,68,0.8)] text-7xl sm:text-8xl animate-ping" />
                                        </div>
                                    )}

                                    {article.tags && article.tags.length > 0 && (
                                        <div className="absolute bottom-3 left-3 z-10">
                                            <span className="bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
                                                #{article.tags[0]}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* --- ACTION BAR --- */}
                                <div className="px-4 pt-3.5 pb-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-4 text-2xl">
                                            <button
                                                onClick={() => handleToggleLike(article)}
                                                className="focus:outline-none transition-transform active:scale-125"
                                                title={isLiked ? "Bỏ thích" : "Thích"}
                                            >
                                                {isLiked ? (
                                                    <FaHeart className="text-rose-500 scale-105 transition-all" />
                                                ) : (
                                                    <FaRegHeart className="text-slate-700 hover:text-slate-400 transition-colors" />
                                                )}
                                            </button>

                                            <button
                                                onClick={() => setActiveCommentArticle(article)}
                                                className="text-slate-700 hover:text-slate-400 transition-transform active:scale-125 focus:outline-none"
                                                title="Bình luận"
                                            >
                                                <FaRegComment />
                                            </button>

                                            <button
                                                onClick={() => handleCopyPostLink(article)}
                                                className="text-slate-700 hover:text-slate-400 transition-transform active:scale-125 focus:outline-none"
                                                title="Sao chép liên kết chia sẻ"
                                            >
                                                <FaPaperPlane className="text-xl" />
                                            </button>
                                        </div>

                                        {/* Nút Bookmark Màu Vàng */}
                                        <button
                                            onClick={() => handleToggleSave(article)}
                                            className="text-2xl focus:outline-none transition-transform active:scale-125"
                                            title={isSaved ? "Đã lưu vào mục Yêu thích (Bấm để bỏ lưu)" : "Lưu vào mục Yêu thích"}
                                        >
                                            {isSaved ? (
                                                <FaBookmark className="text-amber-500 scale-110 drop-shadow-sm transition-all" />
                                            ) : (
                                                <FaRegBookmark className="text-slate-700 hover:text-amber-500 transition-colors" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Likes Count */}
                                    <div className="text-sm font-bold text-slate-900 mb-1.5">
                                        {clapsCount.toLocaleString('vi-VN')} lượt thích
                                    </div>

                                    {/* Caption */}
                                    <div className="text-sm text-slate-800 leading-relaxed mb-2">
                                        <span className="font-bold text-slate-900 mr-2">{authorName}</span>
                                        <span className="font-semibold text-slate-900">{article.title}</span>
                                        <span className="mx-1.5 text-slate-400">—</span>
                                        <span>
                                            {isExpanded ? plainTextContent : `${plainTextContent.slice(0, 110)}...`}
                                        </span>
                                        {plainTextContent.length > 110 && (
                                            <button
                                                onClick={() => toggleCaption(article._id)}
                                                className="text-slate-400 text-xs font-semibold ml-1.5 hover:text-slate-700 transition-colors"
                                            >
                                                {isExpanded ? 'thu gọn' : 'xem thêm'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Comments Count & Latest comment */}
                                    {commentsCount > 0 ? (
                                        <div className="space-y-1 mb-2">
                                            <button
                                                onClick={() => setActiveCommentArticle(article)}
                                                className="text-xs font-semibold text-slate-400 hover:text-slate-600 block transition-colors"
                                            >
                                                Xem tất cả {commentsCount} bình luận
                                            </button>

                                            {article.comments && article.comments.slice(-1).map((cmt, cIdx) => (
                                                <div key={cIdx} className="text-xs text-slate-700 leading-normal">
                                                    <span className="font-bold text-slate-900 mr-2">{cmt.name}</span>
                                                    <span>{cmt.content}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 mb-2">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                                    )}

                                    {/* Date & Link chi tiết */}
                                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold tracking-wider uppercase border-b border-slate-100 pb-3 pt-1">
                                        <span>{new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                                        <Link
                                            to={`/blog/${article.slug}`}
                                            className="text-sky-500 hover:text-sky-600 normal-case font-bold flex items-center gap-1 transition-colors"
                                        >
                                            Xem bài gốc <FiArrowRight className="text-xs" />
                                        </Link>
                                    </div>
                                </div>

                                {/* Form nhập bình luận */}
                                <div className="px-4 py-3 flex items-center gap-3 bg-white">
                                    <FaSmile className="text-slate-400 text-lg hover:text-amber-500 cursor-pointer transition-colors shrink-0" />
                                    <input
                                        type="text"
                                        value={commentInputs[article._id] || ''}
                                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [article._id]: e.target.value }))}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleQuickCommentSubmit(article._id);
                                        }}
                                        placeholder="Thêm bình luận..."
                                        className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 bg-transparent border-none outline-none"
                                    />
                                    <button
                                        onClick={() => handleQuickCommentSubmit(article._id)}
                                        disabled={!commentInputs[article._id]?.trim() || submittingCommentId === article._id}
                                        className="text-xs font-bold text-sky-500 hover:text-sky-600 disabled:opacity-30 disabled:pointer-events-none transition-colors shrink-0"
                                    >
                                        {submittingCommentId === article._id ? 'Đang gửi...' : 'Đăng'}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* === 4. MODAL TẠO BÀI VIẾT PHONG CÁCH FACEBOOK === */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
                        {/* Header Modal */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between relative">
                            <h3 className="w-full text-center text-base sm:text-lg font-bold text-slate-900">
                                Tạo bài viết ẩm thực
                            </h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="absolute right-3.5 top-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        {/* Body Modal (Cuộn được) */}
                        <form onSubmit={handleSubmitCreatePost} className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                            {/* User Profile bar */}
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full overflow-hidden bg-sky-100 text-sky-600 flex items-center justify-center font-bold border border-slate-200 text-sm">
                                    {userInfo?.avatar ? (
                                        <img src={userInfo.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}</span>
                                    )}
                                </div>

                                <div>
                                    <p className="font-bold text-sm text-slate-900">{userInfo?.name || 'Khách hàng'}</p>
                                    <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[11px] font-semibold px-2 py-0.5 rounded-md mt-0.5">
                                        <FaGlobeAmericas className="text-slate-400" />
                                        <span>Công khai • {userInfo?.role === 'admin' ? 'Đăng trực tiếp' : 'Chờ duyệt'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Ô nhập Tiêu đề bài viết */}
                            <div>
                                <input
                                    type="text"
                                    value={createFormData.title}
                                    onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                                    placeholder="Tiêu đề bài viết (vd: Bữa trưa tuyệt vời tại DualeoFood...)"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                                    required
                                />
                            </div>

                            {/* Ô Textarea Nội dung bài viết */}
                            <div>
                                <textarea
                                    rows="4"
                                    value={createFormData.content}
                                    onChange={(e) => setCreateFormData({ ...createFormData, content: e.target.value })}
                                    placeholder={`${userInfo?.name || 'Bạn'} ơi, hãy chia sẻ trải nghiệm, công thức hay cảm nhận món ngon của bạn...`}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none transition-all"
                                    required
                                ></textarea>
                            </div>

                            {/* Vùng Tải Lên Ảnh Bìa (Photo Upload) */}
                            <div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleSelectImage}
                                    accept="image/*"
                                    className="hidden"
                                />

                                {createFormData.previewUrl ? (
                                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video">
                                        <img
                                            src={createFormData.previewUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-colors shadow-md"
                                            title="Xóa ảnh này"
                                        >
                                            <FaTimes className="text-xs" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-200 hover:border-sky-400 hover:bg-sky-50/30 rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                                            <FiUploadCloud />
                                        </div>
                                        <p className="text-xs font-bold text-slate-700">Thêm ảnh cho bài viết</p>
                                        <p className="text-[11px] text-slate-400">Hỗ trợ JPG, PNG, WEBP (tối đa 5MB)</p>
                                    </div>
                                )}
                            </div>

                            {/* Gợi ý Hashtags nhanh */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-bold text-slate-600">Gợi ý thẻ chủ đề:</span>
                                    <input
                                        type="text"
                                        value={createFormData.tags}
                                        onChange={(e) => setCreateFormData({ ...createFormData, tags: e.target.value })}
                                        placeholder="Nhập thêm tags (cách nhau bởi dấu phẩy)"
                                        className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none w-48 text-right"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {POPULAR_TAGS.map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => handleAddTag(tag)}
                                            className="text-[11px] font-semibold bg-slate-100 hover:bg-sky-50 hover:text-sky-600 text-slate-600 px-2.5 py-1 rounded-full transition-colors"
                                        >
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Hộp ghi chú kiểm duyệt thân thiện */}
                            {userInfo?.role !== 'admin' && (
                                <div className="bg-sky-50/80 border border-sky-100 rounded-xl p-3 flex items-start gap-2.5 text-xs text-sky-800">
                                    <span className="text-base shrink-0">💡</span>
                                    <p className="leading-relaxed">
                                        Bài viết sẽ được Ban quản trị xem xét và duyệt. Khi duyệt thành công, bạn sẽ nhận được thông báo qua biểu tượng <strong>Quả chuông 🔔</strong> cạnh giỏ hàng.
                                    </p>
                                </div>
                            )}

                            {/* Nút Đăng bài */}
                            <button
                                type="submit"
                                disabled={submittingPost}
                                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 text-sm"
                            >
                                {submittingPost ? (
                                    <>
                                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        <span>Đang đăng bài viết...</span>
                                    </>
                                ) : (
                                    <span>Đăng bài viết</span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL TUỲ CHỌN BÀI VIẾT */}
            {activeOptionsArticle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl divide-y divide-slate-100 text-center text-sm font-semibold">
                        <button
                            onClick={() => handleCopyPostLink(activeOptionsArticle)}
                            className="w-full py-3.5 text-sky-600 hover:bg-slate-50 transition-colors"
                        >
                            Sao chép liên kết
                        </button>
                        <button
                            onClick={() => {
                                navigate(`/blog/${activeOptionsArticle.slug}`);
                                setActiveOptionsArticle(null);
                            }}
                            className="w-full py-3.5 text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Đi tới bài viết chi tiết
                        </button>
                        <button
                            onClick={() => {
                                handleToggleSave(activeOptionsArticle);
                                setActiveOptionsArticle(null);
                            }}
                            className="w-full py-3.5 text-amber-600 hover:bg-slate-50 transition-colors"
                        >
                            {savedPostIds.has(activeOptionsArticle._id) ? 'Bỏ lưu bài viết' : '⭐ Lưu vào mục Yêu thích'}
                        </button>
                        {Boolean(
                            userInfo && (
                                (activeOptionsArticle.author?._id && String(activeOptionsArticle.author._id) === String(userInfo._id || userInfo.id)) ||
                                (activeOptionsArticle.author && String(activeOptionsArticle.author) === String(userInfo._id || userInfo.id)) ||
                                userInfo.role === 'admin'
                            )
                        ) && (
                            <button
                                onClick={() => handleDeleteArticle(activeOptionsArticle._id)}
                                className="w-full py-3.5 text-rose-600 hover:bg-rose-50 transition-colors font-bold flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <FiTrash2 size={16} />
                                <span>Xóa bài viết của tôi</span>
                            </button>
                        )}
                        <button
                            onClick={() => setActiveOptionsArticle(null)}
                            className="w-full py-3.5 text-slate-400 hover:bg-slate-50 transition-colors font-normal"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL BÌNH LUẬN ĐẦY ĐỦ */}
            {activeCommentArticle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
                        <button
                            onClick={() => setActiveCommentArticle(null)}
                            className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-slate-900/40 hover:bg-slate-900/70 text-white flex items-center justify-center transition-colors"
                        >
                            <FaTimes className="text-sm" />
                        </button>

                        <div className="hidden md:block w-1/2 bg-slate-900 shrink-0">
                            <img
                                src={activeCommentArticle.thumbnail}
                                alt={activeCommentArticle.title}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="flex-1 flex flex-col h-[500px] md:h-auto max-h-[80vh]">
                            <div className="p-4 border-b border-slate-100 flex items-center gap-3 shrink-0">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-sky-100">
                                    {activeCommentArticle.author?.avatar ? (
                                        <img src={activeCommentArticle.author.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-xs text-sky-600">
                                            {activeCommentArticle.author?.name?.charAt(0) || 'A'}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-xs text-slate-900 truncate">
                                        {activeCommentArticle.author?.name || 'dualeofood_official'}
                                    </p>
                                    <p className="text-[11px] text-slate-400 truncate">{activeCommentArticle.title}</p>
                                </div>
                            </div>

                            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
                                {(!activeCommentArticle.comments || activeCommentArticle.comments.length === 0) ? (
                                    <div className="text-center py-12 text-slate-400 text-xs">
                                        Chưa có bình luận nào. Hãy bắt đầu cuộc trò chuyện!
                                    </div>
                                ) : (
                                    activeCommentArticle.comments.map((cmt, idx) => (
                                        <div key={idx} className="flex items-start gap-3 text-xs">
                                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center shrink-0">
                                                {cmt.avatar ? (
                                                    <img src={cmt.avatar} alt={cmt.name} className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    <span>{cmt.name?.charAt(0).toUpperCase() || 'U'}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 leading-relaxed">
                                                <p className="text-slate-800">
                                                    <strong className="text-slate-900 mr-2">{cmt.name}</strong>
                                                    {cmt.content}
                                                </p>
                                                <span className="text-[10px] text-slate-400 block mt-1">
                                                    {timeAgo(cmt.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-3 border-t border-slate-100 flex items-center gap-2 shrink-0 bg-slate-50/50">
                                <input
                                    type="text"
                                    value={commentInputs[activeCommentArticle._id] || ''}
                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [activeCommentArticle._id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleQuickCommentSubmit(activeCommentArticle._id);
                                    }}
                                    placeholder="Thêm bình luận..."
                                    className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-medium"
                                />
                                <button
                                    onClick={() => handleQuickCommentSubmit(activeCommentArticle._id)}
                                    disabled={!commentInputs[activeCommentArticle._id]?.trim() || submittingCommentId === activeCommentArticle._id}
                                    className="px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                                >
                                    Đăng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL TẠO STORY MỚI THỰC TẾ */}
            {showCreateStoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div 
                        className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Modal */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <span className="p-2 rounded-xl bg-sky-100 text-sky-600 font-bold text-sm">✨</span>
                                <h3 className="font-bold text-base text-slate-800">Tạo Story ẩm thực</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCreateStoryModal(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <FaTimes className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body Form */}
                        <form onSubmit={handleSubmitCreateStory} className="p-5 overflow-y-auto space-y-4">
                            {/* Tiêu đề ngắn gọn */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Tên tin / Tiêu đề ngắn <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="VD: Món Ngon Vừa Thử, Siêu Giảm Giá..."
                                    value={storyFormData.title}
                                    onChange={(e) => setStoryFormData(prev => ({ ...prev, title: e.target.value }))}
                                    maxLength={30}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs sm:text-sm font-medium"
                                />
                            </div>

                            {/* Tải hình ảnh Story */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Ảnh Story (dọc hoặc vuông) <span className="text-rose-500">*</span>
                                </label>
                                
                                {storyFormData.previewUrl ? (
                                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-[9/12] max-h-56 bg-slate-900 group">
                                        <img 
                                            src={storyFormData.previewUrl} 
                                            alt="Preview Story" 
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStoryFormData(prev => ({ ...prev, image: null, previewUrl: null }));
                                                if (storyFileInputRef.current) storyFileInputRef.current.value = '';
                                            }}
                                            className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-rose-500 text-white rounded-full transition-colors"
                                            title="Xóa ảnh"
                                        >
                                            <FaTimes size={13} />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => storyFileInputRef.current?.click()}
                                        className="border-2 border-dashed border-sky-300 hover:border-sky-500 rounded-2xl p-6 text-center cursor-pointer bg-sky-50/50 hover:bg-sky-50 transition-colors flex flex-col items-center justify-center gap-2"
                                    >
                                        <FiUploadCloud className="w-8 h-8 text-sky-500" />
                                        <p className="text-xs font-bold text-slate-700">Bấm để chọn ảnh từ máy tính / điện thoại</p>
                                        <p className="text-[10px] text-slate-400">Hỗ trợ JPG, PNG, WEBP (tối đa 5MB)</p>
                                    </div>
                                )}

                                <input
                                    ref={storyFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleSelectStoryImage}
                                    className="hidden"
                                />
                            </div>

                            {/* Nội dung / Caption */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Mô tả cảm nghĩ / Thông điệp
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Chia sẻ hương vị, cảm xúc hoặc ưu đãi cho mọi người..."
                                    value={storyFormData.caption}
                                    onChange={(e) => setStoryFormData(prev => ({ ...prev, caption: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs sm:text-sm font-medium resize-none"
                                />
                            </div>

                            {/* Chỉ hiển thị cài đặt Link và Nút hành động cho Admin và Nhân viên */}
                            {(userInfo?.role === 'admin' || userInfo?.role === 'staff') ? (
                                <div className="grid grid-cols-2 gap-3 p-3 bg-sky-50/70 border border-sky-100 rounded-2xl">
                                    <div>
                                        <label className="block text-xs font-bold text-sky-800 mb-1">
                                            Nút hành động (Quản trị)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="VD: Đặt Món Ngay"
                                            value={storyFormData.btnText}
                                            onChange={(e) => setStoryFormData(prev => ({ ...prev, btnText: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-xl border border-sky-200 text-xs font-medium bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-sky-800 mb-1">
                                            Đường dẫn liên kết (Quản trị)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="/menu hoặc link"
                                            value={storyFormData.link}
                                            onChange={(e) => setStoryFormData(prev => ({ ...prev, link: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-xl border border-sky-200 text-xs font-medium bg-white"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    💡 Tin của bạn sẽ được gửi đến Ban quản trị duyệt trước khi hiển thị công khai trên bảng tin.
                                </p>
                            )}

                            {/* Nút Submit */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={submittingStory}
                                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                >
                                    {submittingStory ? 'Đang tạo Story...' : 'Đăng Story Ngay 🚀'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL XEM INSTAGRAM STORY HOẠT ĐỘNG THỰC TẾ */}
            {activeStoryIndex !== null && stories[activeStoryIndex] && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn">
                    <button
                        onClick={() => setActiveStoryIndex(null)}
                        className="absolute top-4 right-4 z-40 text-white hover:text-rose-400 p-2 text-xl transition-colors"
                    >
                        <FaTimes />
                    </button>

                    <div className="relative w-full max-w-sm h-[80vh] max-h-[680px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4 text-white">
                        {/* Thanh chỉ số tiến trình Story */}
                        <div className="flex gap-1.5 z-20">
                            {stories.map((_, i) => (
                                <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-white transition-all duration-75"
                                        style={{
                                            width: i < activeStoryIndex ? '100%' : i === activeStoryIndex ? `${storyProgress}%` : '0%'
                                        }}
                                    ></div>
                                </div>
                            ))}
                        </div>

                        {/* Tác giả Story & Nút Xóa nếu là chủ sở hữu */}
                        <div className="flex items-center justify-between z-20 mt-3">
                            <div className="flex items-center gap-3">
                                <img
                                    src={stories[activeStoryIndex].avatar || "https://ui-avatars.com/api/?name=DF&background=0284c7&color=fff"}
                                    alt="Story Author"
                                    className="w-9 h-9 rounded-full object-cover border-2 border-white"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://ui-avatars.com/api/?name=Story&background=0284c7&color=fff";
                                    }}
                                />
                                <div>
                                    <p className="font-bold text-xs">{stories[activeStoryIndex].author}</p>
                                    <p className="text-[10px] text-white/70">Story ẩm thực • DualeoFood</p>
                                </div>
                            </div>

                            {/* Nút xóa tin nếu là tin của bạn hoặc admin */}
                            {((stories[activeStoryIndex]?.user && (userInfo?._id === stories[activeStoryIndex]?.user || userInfo?._id === stories[activeStoryIndex]?.user?._id)) || (stories[activeStoryIndex]?.userId && userInfo?._id === stories[activeStoryIndex]?.userId) || userInfo?.role === 'admin') && (
                                <button
                                    onClick={(e) => handleDeleteStory(stories[activeStoryIndex]._id || stories[activeStoryIndex].id, e)}
                                    className="text-white/80 hover:text-rose-400 p-1.5 rounded-full hover:bg-white/10 transition-colors"
                                    title="Xóa Story này"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Hình ảnh Story */}
                        <img
                            src={stories[activeStoryIndex].image}
                            alt="Story Image"
                            className="absolute inset-0 w-full h-full object-cover -z-0"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 -z-0"></div>

                        {/* Nút chuyển đổi Trái / Phải */}
                        <div className="absolute inset-y-0 inset-x-0 flex items-center justify-between px-2 z-10 pointer-events-none">
                            <button
                                onClick={() => {
                                    if (activeStoryIndex > 0) {
                                        setActiveStoryIndex(prev => prev - 1);
                                        setStoryProgress(0);
                                    }
                                }}
                                disabled={activeStoryIndex === 0}
                                className="pointer-events-auto p-2 text-white/70 hover:text-white disabled:opacity-0"
                            >
                                <FiChevronLeft className="text-2xl" />
                            </button>
                            <button
                                onClick={() => {
                                    if (activeStoryIndex < stories.length - 1) {
                                        setActiveStoryIndex(prev => prev + 1);
                                        setStoryProgress(0);
                                    } else {
                                        setActiveStoryIndex(null);
                                    }
                                }}
                                className="pointer-events-auto p-2 text-white/70 hover:text-white"
                            >
                                <FiChevronRight className="text-2xl" />
                            </button>
                        </div>

                        {/* Chú thích & Nút hành động (Chỉ hiện khi Admin/Nhân viên có cấu hình nút và link) */}
                        <div className="z-20 space-y-3">
                            {stories[activeStoryIndex].caption && (
                                <p className="text-sm font-medium leading-relaxed bg-black/40 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                                    {stories[activeStoryIndex].caption}
                                </p>
                            )}
                            {Boolean(stories[activeStoryIndex].btnText && stories[activeStoryIndex].link) && (
                                <Link
                                    to={stories[activeStoryIndex].link}
                                    onClick={() => setActiveStoryIndex(null)}
                                    className="w-full block text-center bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-transform active:scale-95"
                                >
                                    {stories[activeStoryIndex].btnText} ➔
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Blog;
