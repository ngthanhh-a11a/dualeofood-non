import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { 
    FiPlus, FiEdit2, FiTrash2, FiImage, FiExternalLink, 
    FiCheck, FiX, FiEye, FiEyeOff, FiStar, FiSearch, FiSliders 
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const ArticleManager = () => {
    // Tab state: 'articles' | 'stories'
    const [activeTab, setActiveTab] = useState('articles');

    // === ARTICLES STATE ===
    const [articles, setArticles] = useState([]);
    const [loadingArticles, setLoadingArticles] = useState(true);
    const [showArticleModal, setShowArticleModal] = useState(false);
    const [isEditingArticle, setIsEditingArticle] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    
    const [articleFormData, setArticleFormData] = useState({
        _id: '',
        title: '',
        slug: '',
        content: '',
        tags: '',
        isPublished: false,
        thumbnail: null,
        previewImage: null
    });

    // === STORIES STATE ===
    const [stories, setStories] = useState([]);
    const [loadingStories, setLoadingStories] = useState(false);
    const [storyFilter, setStoryFilter] = useState('all');
    const [storySearch, setStorySearch] = useState('');
    const [showStoryModal, setShowStoryModal] = useState(false);
    const [isEditingStory, setIsEditingStory] = useState(false);
    const [submittingStory, setSubmittingStory] = useState(false);

    const [storyFormData, setStoryFormData] = useState({
        _id: '',
        title: '',
        caption: '',
        btnText: 'Khám phá ngay',
        link: '/menu',
        isPinned: false,
        isPublished: true,
        status: 'approved',
        image: null,
        previewImage: null
    });

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'image'],
            ['clean']
        ],
    };

    // ================= ARTICLE HANDLERS =================
    const fetchArticles = async () => {
        setLoadingArticles(true);
        try {
            const res = await axios.get('/articles');
            setArticles(res.data);
        } catch (error) {
            toast.error('Lỗi khi tải danh sách bài viết');
        }
        setLoadingArticles(false);
    };

    const generateSlug = (text) => {
        return text.toString().toLowerCase()
            .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
            .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
            .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
            .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
            .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
            .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
            .replace(/đ/gi, 'd')
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };

    const handleArticleTitleChange = (e) => {
        const title = e.target.value;
        if (!isEditingArticle) {
            setArticleFormData({ ...articleFormData, title, slug: generateSlug(title) });
        } else {
            setArticleFormData({ ...articleFormData, title });
        }
    };

    const handleArticleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setArticleFormData({
            ...articleFormData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleArticleContentChange = (content) => {
        setArticleFormData({ ...articleFormData, content });
    };

    const handleArticleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setArticleFormData({
                ...articleFormData,
                thumbnail: file,
                previewImage: URL.createObjectURL(file)
            });
        }
    };

    const handleOpenArticleModal = async (article = null) => {
        if (article) {
            try {
                const res = await axios.get(`/articles/id/${article._id}`);
                const data = res.data;
                setIsEditingArticle(true);
                setArticleFormData({
                    _id: data._id,
                    title: data.title,
                    slug: data.slug,
                    content: data.content,
                    tags: data.tags ? data.tags.join(', ') : '',
                    isPublished: data.isPublished,
                    thumbnail: null,
                    previewImage: data.thumbnail
                });
            } catch (error) {
                toast.error('Không thể lấy chi tiết bài viết');
                return;
            }
        } else {
            setIsEditingArticle(false);
            setArticleFormData({
                _id: '',
                title: '',
                slug: '',
                content: '',
                tags: '',
                isPublished: true,
                thumbnail: null,
                previewImage: null
            });
        }
        setShowArticleModal(true);
    };

    const handleArticleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('title', articleFormData.title);
        data.append('slug', articleFormData.slug);
        data.append('content', articleFormData.content);
        data.append('tags', articleFormData.tags);
        data.append('isPublished', articleFormData.isPublished);
        
        if (articleFormData.thumbnail) {
            data.append('thumbnail', articleFormData.thumbnail);
        } else if (!isEditingArticle) {
            toast.error('Vui lòng chọn ảnh bìa cho bài viết');
            return;
        }

        try {
            if (isEditingArticle) {
                await axios.put(`/articles/${articleFormData._id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('Cập nhật bài viết thành công');
            } else {
                await axios.post('/articles', data, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('Tạo bài viết mới thành công');
            }
            setShowArticleModal(false);
            fetchArticles();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleDeleteArticle = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xoá bài viết này không?')) {
            try {
                await axios.delete(`/articles/${id}`);
                toast.success('Xoá bài viết thành công');
                fetchArticles();
            } catch (error) {
                toast.error('Lỗi khi xoá bài viết');
            }
        }
    };

    const togglePublishArticle = async (article) => {
        try {
            await axios.put(`/articles/${article._id}`, { isPublished: !article.isPublished });
            toast.success(article.isPublished ? 'Đã ẩn bài viết' : 'Đã xuất bản bài viết');
            fetchArticles();
        } catch (error) {
            toast.error('Lỗi khi cập nhật trạng thái xuất bản');
        }
    };

    const handleUpdateArticleStatus = async (id, status) => {
        try {
            await axios.put(`/articles/${id}`, { status });
            toast.success(`Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} bài viết`);
            fetchArticles();
        } catch (error) {
            toast.error('Lỗi khi cập nhật trạng thái kiểm duyệt');
        }
    };

    // ================= STORY HANDLERS =================
    const fetchStories = async () => {
        setLoadingStories(true);
        try {
            const res = await axios.get('/stories/admin/all');
            setStories(res.data || []);
        } catch (error) {
            toast.error('Lỗi khi tải danh sách Story');
        }
        setLoadingStories(false);
    };

    const handleOpenStoryModal = (story = null) => {
        if (story) {
            setIsEditingStory(true);
            setStoryFormData({
                _id: story._id,
                title: story.title || '',
                caption: story.caption || '',
                btnText: story.btnText || '',
                link: story.link || '',
                isPinned: !!story.isPinned,
                isPublished: story.isPublished !== false,
                status: story.status || 'approved',
                image: null,
                previewImage: story.image
            });
        } else {
            setIsEditingStory(false);
            setStoryFormData({
                _id: '',
                title: '',
                caption: '',
                btnText: 'Săn Voucher Ngay',
                link: '/menu',
                isPinned: false,
                isPublished: true,
                status: 'approved',
                image: null,
                previewImage: null
            });
        }
        setShowStoryModal(true);
    };

    const handleStoryImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setStoryFormData({
                ...storyFormData,
                image: file,
                previewImage: URL.createObjectURL(file)
            });
        }
    };

    const handleStorySubmit = async (e) => {
        e.preventDefault();
        if (!storyFormData.title.trim()) return toast.error('Vui lòng nhập tiêu đề Story');
        if (!isEditingStory && !storyFormData.image) return toast.error('Vui lòng chọn ảnh cho Story');

        setSubmittingStory(true);
        const data = new FormData();
        data.append('title', storyFormData.title.trim());
        data.append('caption', storyFormData.caption.trim());
        data.append('btnText', storyFormData.btnText.trim());
        data.append('link', storyFormData.link.trim());
        data.append('isPinned', storyFormData.isPinned);
        data.append('isPublished', storyFormData.isPublished);
        data.append('status', storyFormData.status);

        if (storyFormData.image) {
            data.append('image', storyFormData.image);
        }

        try {
            if (isEditingStory) {
                await axios.put(`/stories/${storyFormData._id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Cập nhật Story thành công!');
            } else {
                await axios.post('/stories', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Tạo Story mới thành công!');
            }
            setShowStoryModal(false);
            fetchStories();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu Story');
        } finally {
            setSubmittingStory(false);
        }
    };

    const handleUpdateStoryStatus = async (id, status) => {
        try {
            await axios.put(`/stories/${id}/status`, { status });
            toast.success(`Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} Story`);
            fetchStories();
        } catch (error) {
            toast.error('Lỗi khi duyệt Story');
        }
    };

    const togglePublishStory = async (story) => {
        try {
            await axios.put(`/stories/${story._id}/publish`);
            toast.success(story.isPublished ? 'Đã ẩn Story' : 'Đã xuất bản Story');
            fetchStories();
        } catch (error) {
            toast.error('Lỗi khi cập nhật trạng thái hiển thị Story');
        }
    };

    const togglePinStory = async (story) => {
        try {
            await axios.put(`/stories/${story._id}/pin`);
            toast.success(story.isPinned ? 'Đã bỏ ghim Story' : 'Đã ghim Story lên đầu bảng tin ⭐');
            fetchStories();
        } catch (error) {
            toast.error('Lỗi khi ghim Story');
        }
    };

    const handleDeleteStory = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xoá Story này? Ảnh trên Cloudinary cũng sẽ được xóa sạch.')) {
            try {
                await axios.delete(`/stories/${id}`);
                toast.success('Xoá Story và dọn dẹp Cloudinary thành công');
                fetchStories();
            } catch (error) {
                toast.error('Lỗi khi xoá Story');
            }
        }
    };

    // Filtered stories logic
    const filteredStories = stories.filter(story => {
        if (storyFilter === 'pending' && story.status !== 'pending') return false;
        if (storyFilter === 'approved' && story.status !== 'approved') return false;
        if (storyFilter === 'rejected' && story.status !== 'rejected') return false;
        if (storyFilter === 'hidden' && story.isPublished !== false) return false;
        if (storyFilter === 'pinned' && !story.isPinned) return false;

        if (storySearch.trim()) {
            const query = storySearch.toLowerCase();
            const matchTitle = story.title?.toLowerCase().includes(query);
            const matchAuthor = story.author?.toLowerCase().includes(query);
            const matchCaption = story.caption?.toLowerCase().includes(query);
            return matchTitle || matchAuthor || matchCaption;
        }
        return true;
    });

    const pendingStoriesCount = stories.filter(s => s.status === 'pending').length;

    useEffect(() => {
        fetchArticles();
        fetchStories();
    }, []);

    const renderStatusBadge = (status) => {
        switch (status) {
            case 'approved': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Đã duyệt</span>;
            case 'pending': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 animate-pulse">Chờ duyệt</span>;
            case 'rejected': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Từ chối</span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Tabs Navigation */}
            <div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Quản lý Nội dung Cộng đồng</h1>
                        <p className="text-sm text-gray-500">Quản lý bài viết tin tức và hệ thống Stories 24h trên DualeoFood</p>
                    </div>

                    {activeTab === 'articles' ? (
                        <button 
                            onClick={() => handleOpenArticleModal()}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                        >
                            <FiPlus /> Viết bài mới
                        </button>
                    ) : (
                        <button 
                            onClick={() => handleOpenStoryModal()}
                            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                        >
                            <FiPlus /> Tạo Story mới (Admin)
                        </button>
                    )}
                </div>

                {/* Tabs Chuyển đổi: Bài viết vs Stories */}
                <div className="flex items-center gap-2 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('articles')}
                        className={`pb-3 px-4 font-bold text-sm sm:text-base border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                            activeTab === 'articles'
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <span>📰 Bài viết & Tin tức</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">{articles.length}</span>
                    </button>

                    <button
                        onClick={() => {
                            setActiveTab('stories');
                            fetchStories();
                        }}
                        className={`pb-3 px-4 font-bold text-sm sm:text-base border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                            activeTab === 'stories'
                                ? 'border-sky-500 text-sky-600'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <span>📱 Quản lý Stories 24h</span>
                        {pendingStoriesCount > 0 ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold animate-pulse shadow-xs">
                                {pendingStoriesCount} chờ duyệt
                            </span>
                        ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">{stories.length}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* ================= TAB 1: BÀI VIẾT ================= */}
            {activeTab === 'articles' && (
                loadingArticles ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600">
                                    <th className="p-4 w-32">Ảnh bìa</th>
                                    <th className="p-4">Tiêu đề bài viết</th>
                                    <th className="p-4 w-32 text-center">Lượt xem</th>
                                    <th className="p-4 w-32 text-center">Hiển thị</th>
                                    <th className="p-4 w-32 text-center">Kiểm duyệt</th>
                                    <th className="p-4 w-44 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {articles.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-400">
                                            Chưa có bài viết nào. Hãy tạo bài viết đầu tiên!
                                        </td>
                                    </tr>
                                ) : (
                                    articles.map(article => (
                                        <tr key={article._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 align-middle">
                                                <div className="h-16 w-24 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                                                    <img src={article.thumbnail} alt={article.title} className="w-full h-full object-cover" />
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <Link to={`/blog/${article.slug}`} target="_blank" className="font-bold text-slate-800 hover:text-orange-500 flex items-center gap-1.5 transition-colors">
                                                    {article.title}
                                                    <FiExternalLink className="text-xs text-gray-400" />
                                                </Link>
                                                <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                                    <span>Tác giả: <strong className="text-gray-600">{article.author?.name || 'Admin'}</strong></span>
                                                    <span>•</span>
                                                    <span>{new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-center font-medium text-gray-600">
                                                {article.views || 0}
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                <button 
                                                    onClick={() => togglePublishArticle(article)}
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                                                        article.isPublished 
                                                            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {article.isPublished ? 'Đang hiện' : 'Đã ẩn'}
                                                </button>
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                {renderStatusBadge(article.status)}
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {article.status === 'pending' && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleUpdateArticleStatus(article._id, 'approved')} 
                                                                title="Duyệt bài viết"
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <FiCheck className="text-lg" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleUpdateArticleStatus(article._id, 'rejected')} 
                                                                title="Từ chối duyệt"
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <FiX className="text-lg" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button 
                                                        onClick={() => handleOpenArticleModal(article)} 
                                                        title="Chỉnh sửa bài viết"
                                                        className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        <FiEdit2 className="text-lg" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteArticle(article._id)} 
                                                        title="Xóa bài viết"
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        <FiTrash2 className="text-lg" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {/* ================= TAB 2: QUẢN LÝ STORIES ================= */}
            {activeTab === 'stories' && (
                <div className="space-y-4">
                    {/* Thanh lọc trạng thái và tìm kiếm Story */}
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                            {[
                                { key: 'all', label: `Tất cả (${stories.length})` },
                                { key: 'pending', label: `Chờ duyệt (${pendingStoriesCount})`, badge: pendingStoriesCount > 0 },
                                { key: 'approved', label: 'Đã duyệt' },
                                { key: 'pinned', label: '⭐ Đã ghim' },
                                { key: 'hidden', label: 'Đã ẩn' }
                            ].map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => setStoryFilter(item.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                        storyFilter === item.key 
                                            ? 'bg-sky-500 text-white shadow-xs' 
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative min-w-[240px]">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                            <input
                                type="text"
                                placeholder="Tìm tiêu đề, tác giả..."
                                value={storySearch}
                                onChange={(e) => setStorySearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                    </div>

                    {loadingStories ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600">
                                        <th className="p-4 w-28 text-center">Ảnh Story</th>
                                        <th className="p-4">Tiêu đề & Tác giả</th>
                                        <th className="p-4 w-44">Nút bấm & Liên kết</th>
                                        <th className="p-4 w-28 text-center">Ghim đầu</th>
                                        <th className="p-4 w-28 text-center">Hiển thị</th>
                                        <th className="p-4 w-32 text-center">Kiểm duyệt</th>
                                        <th className="p-4 w-44 text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredStories.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="p-8 text-center text-gray-400">
                                                Không có Story nào phù hợp với bộ lọc hiện tại.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStories.map(story => (
                                            <tr key={story._id} className="hover:bg-gray-50/50 transition-colors">
                                                {/* Ảnh Story */}
                                                <td className="p-4 align-middle text-center">
                                                    <div className="relative inline-block w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-rose-500 to-sky-500 shadow-2xs">
                                                        <img 
                                                            src={story.image} 
                                                            alt={story.title} 
                                                            className="w-full h-full object-cover rounded-full bg-slate-100"
                                                        />
                                                    </div>
                                                </td>

                                                {/* Tiêu đề & Thông tin tác giả */}
                                                <td className="p-4 align-middle">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-800 text-sm">{story.title}</span>
                                                        {story.isPinned && (
                                                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                                ⭐ Ghim
                                                            </span>
                                                        )}
                                                    </div>
                                                    {story.caption && (
                                                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{story.caption}</p>
                                                    )}
                                                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                                        <span>Người đăng: <strong className="text-slate-600">{story.author}</strong></span>
                                                        <span>•</span>
                                                        <span>{new Date(story.createdAt).toLocaleDateString('vi-VN')}</span>
                                                    </div>
                                                </td>

                                                {/* Nút bấm & Liên kết */}
                                                <td className="p-4 align-middle">
                                                    {(story.btnText && story.link) ? (
                                                        <div className="inline-flex flex-col gap-1">
                                                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100 w-fit">
                                                                {story.btnText}
                                                            </span>
                                                            <Link 
                                                                to={story.link} 
                                                                target="_blank" 
                                                                className="text-[11px] text-gray-400 hover:text-sky-600 flex items-center gap-1 truncate max-w-[140px]"
                                                                title={story.link}
                                                            >
                                                                <FiExternalLink size={10} />
                                                                <span className="truncate">{story.link}</span>
                                                            </Link>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">
                                                            Không có (Khách đăng)
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Ghim đầu */}
                                                <td className="p-4 align-middle text-center">
                                                    <button
                                                        onClick={() => togglePinStory(story)}
                                                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                                                            story.isPinned
                                                                ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 shadow-2xs'
                                                                : 'bg-gray-100 text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                                                        }`}
                                                        title={story.isPinned ? "Bỏ ghim" : "Ghim lên đầu bảng tin"}
                                                    >
                                                        <FiStar className={`text-base ${story.isPinned ? 'fill-amber-500' : ''}`} />
                                                    </button>
                                                </td>

                                                {/* Hiển thị */}
                                                <td className="p-4 align-middle text-center">
                                                    <button 
                                                        onClick={() => togglePublishStory(story)}
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                                                            story.isPublished 
                                                                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {story.isPublished ? 'Đang hiện' : 'Đã ẩn'}
                                                    </button>
                                                </td>

                                                {/* Kiểm duyệt */}
                                                <td className="p-4 align-middle text-center">
                                                    {renderStatusBadge(story.status)}
                                                </td>

                                                {/* Thao tác */}
                                                <td className="p-4 align-middle text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {story.status === 'pending' && (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleUpdateStoryStatus(story._id, 'approved')} 
                                                                    title="Phê duyệt Story này"
                                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                                                                >
                                                                    <FiCheck className="text-lg" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleUpdateStoryStatus(story._id, 'rejected')} 
                                                                    title="Từ chối Story"
                                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                                >
                                                                    <FiX className="text-lg" />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button 
                                                            onClick={() => handleOpenStoryModal(story)} 
                                                            title="Chỉnh sửa nội dung & link"
                                                            className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <FiEdit2 className="text-lg" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteStory(story._id)} 
                                                            title="Xóa vĩnh viễn (xóa cả Cloudinary)"
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <FiTrash2 className="text-lg" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ================= MODAL BÀI VIẾT ================= */}
            {showArticleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto mt-10">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
                            <h2 className="text-xl font-bold text-slate-800">
                                {isEditingArticle ? 'Chỉnh sửa Bài viết' : 'Viết bài mới'}
                            </h2>
                            <button onClick={() => setShowArticleModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl cursor-pointer">&times;</button>
                        </div>
                        <form onSubmit={handleArticleSubmit} className="p-6 h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="col-span-2 space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề bài viết <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" required
                                            value={articleFormData.title} onChange={handleArticleTitleChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-lg font-semibold"
                                            placeholder="Nhập tiêu đề..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Đường dẫn (Slug)</label>
                                        <input 
                                            type="text" name="slug" required
                                            value={articleFormData.slug} onChange={handleArticleInputChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm text-gray-500 bg-gray-50"
                                        />
                                    </div>
                                    <div className="pb-12">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nội dung <span className="text-red-500">*</span></label>
                                        <div className="bg-white rounded-lg border border-gray-200 h-96">
                                            <ReactQuill 
                                                theme="snow"
                                                value={articleFormData.content}
                                                onChange={handleArticleContentChange}
                                                modules={quillModules}
                                                className="h-[340px]"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-1 space-y-6">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <h3 className="font-bold text-slate-700 mb-4 border-b border-gray-200 pb-2">Xuất bản</h3>
                                        <label className="flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" name="isPublished"
                                                checked={articleFormData.isPublished} onChange={handleArticleInputChange}
                                                className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 border-gray-300"
                                            />
                                            <span className="ml-2 font-semibold text-gray-700">Công khai bài viết này</span>
                                        </label>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <h3 className="font-bold text-slate-700 mb-4 border-b border-gray-200 pb-2">Ảnh bìa <span className="text-red-500">*</span></h3>
                                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors overflow-hidden">
                                            {articleFormData.previewImage ? (
                                                <img src={articleFormData.previewImage} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <FiImage className="w-8 h-8 text-gray-400 mb-2" />
                                                    <p className="text-sm text-gray-500 font-medium">Tải ảnh lên</p>
                                                </div>
                                            )}
                                            <input type="file" className="hidden" accept="image/*" onChange={handleArticleImageChange} />
                                        </label>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <h3 className="font-bold text-slate-700 mb-4 border-b border-gray-200 pb-2">Thẻ (Tags)</h3>
                                        <input 
                                            type="text" name="tags"
                                            value={articleFormData.tags} onChange={handleArticleInputChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm"
                                            placeholder="Cách nhau bởi dấu phẩy, vd: Khuyến mãi, Trà sữa"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3 sticky bottom-0 bg-white pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowArticleModal(false)} className="px-5 py-2.5 rounded-lg font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
                                    Hủy bỏ
                                </button>
                                <button type="submit" className="px-5 py-2.5 rounded-lg font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors cursor-pointer">
                                    {isEditingArticle ? 'Lưu bài viết' : 'Đăng bài viết'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= MODAL STORY (TẠO MỚI / CHỈNH SỬA ADMIN) ================= */}
            {showStoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-scaleUp">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <span>📱</span>
                                {isEditingStory ? 'Chỉnh sửa Story' : 'Tạo Story mới (Admin)'}
                            </h2>
                            <button onClick={() => setShowStoryModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl cursor-pointer">&times;</button>
                        </div>

                        <form onSubmit={handleStorySubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            {/* Tiêu đề */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Tiêu đề Story <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={30}
                                    placeholder="VD: 🔥 Ưu đãi Hot, 🍔 Món Mới..."
                                    value={storyFormData.title}
                                    onChange={(e) => setStoryFormData({ ...storyFormData, title: e.target.value })}
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold"
                                />
                            </div>

                            {/* Ảnh Story */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Hình ảnh Story {!isEditingStory && <span className="text-red-500">*</span>}
                                </label>
                                <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors overflow-hidden">
                                    {storyFormData.previewImage ? (
                                        <img src={storyFormData.previewImage} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-4 text-center">
                                            <FiImage className="w-8 h-8 text-sky-500 mb-1" />
                                            <p className="text-xs text-gray-600 font-semibold">Tải ảnh lên (lưu Cloudinary)</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">Tỉ lệ dọc hoặc vuông</p>
                                        </div>
                                    )}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleStoryImageChange} />
                                </label>
                            </div>

                            {/* Lời nhắn / Caption */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Nội dung mô tả / Caption
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Nội dung hiển thị phía dưới ảnh Story..."
                                    value={storyFormData.caption}
                                    onChange={(e) => setStoryFormData({ ...storyFormData, caption: e.target.value })}
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs resize-none"
                                />
                            </div>

                            {/* Cấu hình Nút hành động & Link (Đặc quyền Admin) */}
                            <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-100 space-y-3">
                                <p className="text-xs font-bold text-sky-800 flex items-center gap-1.5">
                                    <FiSliders size={13} />
                                    Cài đặt Nút hành động & Link điều hướng (Admin)
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                            Chữ trên nút
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="VD: Săn Voucher Ngay"
                                            value={storyFormData.btnText}
                                            onChange={(e) => setStoryFormData({ ...storyFormData, btnText: e.target.value })}
                                            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                            Đường dẫn liên kết
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="/menu hoặc /promotions"
                                            value={storyFormData.link}
                                            onChange={(e) => setStoryFormData({ ...storyFormData, link: e.target.value })}
                                            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Tuỳ chọn ghim, xuất bản, kiểm duyệt */}
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={storyFormData.isPinned}
                                        onChange={(e) => setStoryFormData({ ...storyFormData, isPinned: e.target.checked })}
                                        className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                                    />
                                    <span className="text-xs font-bold text-gray-700">⭐ Ghim lên đầu</span>
                                </label>

                                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={storyFormData.isPublished}
                                        onChange={(e) => setStoryFormData({ ...storyFormData, isPublished: e.target.checked })}
                                        className="w-4 h-4 text-sky-500 rounded focus:ring-sky-500"
                                    />
                                    <span className="text-xs font-bold text-gray-700">👁️ Công khai</span>
                                </label>
                            </div>

                            {/* Trạng thái kiểm duyệt */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Trạng thái kiểm duyệt
                                </label>
                                <select
                                    value={storyFormData.status}
                                    onChange={(e) => setStoryFormData({ ...storyFormData, status: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                                >
                                    <option value="approved">✅ Đã duyệt (Approved)</option>
                                    <option value="pending">⏳ Chờ duyệt (Pending)</option>
                                    <option value="rejected">❌ Từ chối (Rejected)</option>
                                </select>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowStoryModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingStory}
                                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                                >
                                    {submittingStory ? 'Đang lưu...' : (isEditingStory ? 'Cập nhật Story' : 'Đăng Story ngay')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArticleManager;
