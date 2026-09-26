import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import {
    FaHeart, FaRegHeart, FaBookmark, FaRegBookmark,
    FaPaperPlane, FaCheckCircle, FaSmile
} from 'react-icons/fa';
import {
    FiClock, FiEye, FiUser, FiArrowLeft, FiTag,
    FiMessageSquare, FiSend, FiEyeOff, FiShare2, FiThumbsUp, FiCheck, FiTrash2
} from 'react-icons/fi';
import { TbPinFilled } from 'react-icons/tb';
import toast from 'react-hot-toast';

const BlogDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    // Comments & Claps state
    const [claps, setClaps] = useState(0);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [hasClapped, setHasClapped] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // BỘ LỌC BÌNH LUẬN: 'newest' (Mới nhất) | 'oldest' (Cũ nhất)
    const [commentSortOrder, setCommentSortOrder] = useState('newest');

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const res = await axios.get(`/articles/${slug}`);
                const artData = res.data;
                setArticle(artData);
                setClaps(artData.claps || 0);
                setComments(artData.comments || []);

                // Kiểm tra trạng thái đã like chưa
                if (userInfo && artData.clappedBy) {
                    const userId = userInfo._id || userInfo.id;
                    setHasClapped(artData.clappedBy.includes(userId));
                }

                // Kiểm tra trạng thái đã lưu vào Bookmark chưa
                const savedIds = JSON.parse(localStorage.getItem('saved_article_ids') || '[]');
                setIsSaved(savedIds.includes(artData._id));

                setLoading(false);
            } catch (error) {
                console.error('Lỗi khi lấy chi tiết bài viết:', error);
                toast.error('Không thể tải bài viết');
                setLoading(false);
            }
        };

        fetchArticle();
    }, [slug]);

    // Thả tim / Bỏ thả tim bài viết
    const handleToggleClap = async () => {
        if (!userInfo) return toast.error('Vui lòng đăng nhập để thích bài viết!');
        if (!article) return;

        const token = userInfo.token || localStorage.getItem('token');

        if (hasClapped) {
            setClaps(prev => Math.max(0, prev - 1));
            setHasClapped(false);

            try {
                await axios.post(`/articles/${article._id}/unclap`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (error) {
                console.error('Lỗi khi bỏ vỗ tay', error);
                setClaps(prev => prev + 1);
                setHasClapped(true);
            }
        } else {
            setClaps(prev => prev + 1);
            setHasClapped(true);
            toast.success('Đã thả tim bài viết!', { icon: '❤️' });

            try {
                await axios.post(`/articles/${article._id}/clap`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (error) {
                console.error('Lỗi khi vỗ tay', error);
                setClaps(prev => Math.max(0, prev - 1));
                setHasClapped(false);
            }
        }
    };

    // Lưu / Bỏ lưu bài viết (Bookmark màu vàng đồng bộ với Đánh giá của tôi)
    const handleToggleSave = () => {
        if (!article) return;
        const articleId = article._id;
        const savedIds = JSON.parse(localStorage.getItem('saved_article_ids') || '[]');
        const savedData = JSON.parse(localStorage.getItem('saved_articles_data') || '[]');

        if (isSaved) {
            const nextIds = savedIds.filter(id => id !== articleId);
            const nextData = savedData.filter(item => item._id !== articleId);
            localStorage.setItem('saved_article_ids', JSON.stringify(nextIds));
            localStorage.setItem('saved_articles_data', JSON.stringify(nextData));
            setIsSaved(false);
            toast('Đã bỏ lưu bài viết', { icon: '🔖' });
        } else {
            const nextIds = [...savedIds, articleId];
            const newEntry = {
                _id: article._id,
                title: article.title,
                slug: article.slug,
                thumbnail: article.thumbnail,
                content: article.content,
                author: article.author?.name || 'DualeoFood Official',
                authorAvatar: article.author?.avatar,
                tags: article.tags || [],
                claps: claps,
                commentsCount: comments.length,
                savedAt: new Date().toISOString()
            };
            const nextData = [newEntry, ...savedData.filter(item => item._id !== articleId)];
            localStorage.setItem('saved_article_ids', JSON.stringify(nextIds));
            localStorage.setItem('saved_articles_data', JSON.stringify(nextData));
            setIsSaved(true);
            toast.success('Đã lưu vào mục Yêu thích trong "Đánh giá của tôi"!', { icon: '⭐' });
        }
    };

    // Sao chép link bài viết để chia sẻ
    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Đã sao chép liên kết bài viết!', { icon: '📋' });
    };

    // Xóa bài viết (Chỉ tác giả hoặc Admin)
    const handleDeleteArticle = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.')) {
            return;
        }
        const loadingToast = toast.loading('Đang xóa bài viết...');
        try {
            await axios.delete(`/articles/${article._id}`);
            toast.dismiss(loadingToast);
            toast.success('Đã xóa bài viết thành công!');
            navigate('/blog');
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error('Lỗi khi xóa bài viết:', error);
            toast.error(error.response?.data?.message || 'Không thể xóa bài viết này');
        }
    };

    // Gửi bình luận mới
    const submitComment = async (e) => {
        e.preventDefault();
        if (!userInfo) return toast.error('Vui lòng đăng nhập để bình luận!');
        if (!commentText.trim()) return;

        setSubmittingComment(true);
        const token = userInfo.token || localStorage.getItem('token');

        try {
            const res = await axios.post(`/articles/${article._id}/comments`, { content: commentText }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComments(res.data.comments || []);
            setCommentText('');
            toast.success('Đã đăng bình luận thành công!', { icon: '💬' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể gửi bình luận');
        } finally {
            setSubmittingComment(false);
        }
    };

    // Ẩn/Hiện bình luận (Admin/Staff)
    const toggleHideComment = async (commentId) => {
        if (!userInfo || (userInfo.role !== 'admin' && userInfo.role !== 'staff')) return;
        const token = userInfo.token || localStorage.getItem('token');
        try {
            const res = await axios.put(`/articles/${article._id}/comments/${commentId}/visibility`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComments(res.data.comments);
            toast.success(res.data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi thao tác bình luận');
        }
    };

    // Sắp xếp và lọc bình luận
    const sortedComments = useMemo(() => {
        const visibleComments = comments.filter(c =>
            !c.isHidden || (userInfo && (userInfo.role === 'admin' || userInfo.role === 'staff'))
        );

        return [...visibleComments].sort((a, b) => {
            // Bình luận được ghim luôn ở đầu tiên
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;

            if (commentSortOrder === 'newest') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            } else {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }
        });
    }, [comments, commentSortOrder, userInfo]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-28 pb-20">
                <div className="max-w-3xl mx-auto px-4 space-y-6">
                    <div className="h-6 bg-slate-200 rounded-md w-32 animate-pulse"></div>
                    <div className="h-10 bg-slate-200 rounded-xl w-3/4 animate-pulse"></div>
                    <div className="w-full aspect-video bg-slate-200 rounded-3xl animate-pulse"></div>
                    <div className="space-y-3 pt-4">
                        <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-slate-200 rounded w-5/6 animate-pulse"></div>
                        <div className="h-4 bg-slate-200 rounded w-4/6 animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="min-h-screen bg-slate-50 pt-32 pb-20 text-center px-4">
                <div className="text-6xl mb-4">🔍</div>
                <h1 className="text-2xl font-black text-slate-800 mb-2">Không tìm thấy bài viết!</h1>
                <p className="text-slate-500 mb-6 text-sm">Bài viết có thể đã bị gỡ bỏ hoặc đường dẫn không đúng.</p>
                <Link to="/blog" className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm">
                    <FiArrowLeft /> Quay lại bảng tin Blog
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-20 font-sans">
            {/* CONTAINER BÀI VIẾT NÂNG CẤP CHUẨN INSTAGRAM & DUALLOFOOD */}
            <div className="max-w-3xl mx-auto px-3 sm:px-5 pt-8 md:pt-12">

                {/* 1. THANH ĐIỀU HƯỚNG TRÊN CÙNG: QUAY LẠI & HÀNH ĐỘNG NHANH */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate('/blog')}
                        className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-sky-600 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs group"
                    >
                        <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                        <span>Quay lại Feed</span>
                    </button>

                    <div className="flex items-center gap-2">
                        {/* Nút Bookmark Lưu Bài Viết (MÀU VÀNG KHI ĐÃ LƯU) */}
                        <button
                            onClick={handleToggleSave}
                            className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${isSaved
                                ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-2xs'
                                : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
                                }`}
                            title={isSaved ? "Đã lưu vào Đánh giá của tôi (Bấm để bỏ lưu)" : "Lưu vào bài viết yêu thích"}
                        >
                            {isSaved ? (
                                <FaBookmark className="text-amber-500 text-sm" />
                            ) : (
                                <FaRegBookmark className="text-slate-500 text-sm" />
                            )}
                            <span className="hidden sm:inline">{isSaved ? "Đã lưu" : "Lưu bài"}</span>
                        </button>

                        {/* Nút Chia sẻ */}
                        <button
                            onClick={handleShare}
                            className="p-2.5 rounded-xl bg-white text-slate-600 hover:text-sky-600 border border-slate-200/80 shadow-2xs transition-colors"
                            title="Sao chép liên kết"
                        >
                            <FiShare2 className="text-sm" />
                        </button>

                        {/* Nút Xóa bài viết nếu là tác giả hoặc admin */}
                        {Boolean(
                            userInfo && (
                                (article.author?._id && String(article.author._id) === String(userInfo._id || userInfo.id)) ||
                                (article.author && String(article.author) === String(userInfo._id || userInfo.id)) ||
                                userInfo.role === 'admin'
                            )
                        ) && (
                                <button
                                    onClick={handleDeleteArticle}
                                    className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 border border-rose-200/80 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                                    title="Xóa bài viết của tôi"
                                >
                                    <FiTrash2 className="text-sm" />
                                    <span className="hidden sm:inline">Xóa bài</span>
                                </button>
                            )}
                    </div>
                </div>

                {/* 2. THẺ BÀI VIẾT NÂNG CẤP (CARD CHÍNH) */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden mb-8">

                    {/* Header tác giả bài viết */}
                    <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            {/* Avatar tròn viền gradient chuẩn Instagram */}
                            <div className="p-0.5 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600">
                                <div className="w-11 h-11 rounded-full overflow-hidden bg-white p-0.5">
                                    {article.author?.avatar ? (
                                        <img src={article.author.avatar} alt="Author" className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        <div className="w-full h-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-sm rounded-full">
                                            {article.author?.name ? article.author.name.charAt(0).toUpperCase() : 'D'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-sm sm:text-base text-slate-900">
                                        {article.author?.name || 'dualeofood_official'}
                                    </span>
                                    <FaCheckCircle className="text-sky-500 text-xs shrink-0" title="Chính hãng DualeoFood" />
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mt-0.5">
                                    <span className="flex items-center gap-1">
                                        <FiClock size={12} /> {new Date(article.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <FiEye size={12} /> {article.views || 0} lượt xem
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tags bài viết */}
                        {article.tags && article.tags.length > 0 && (
                            <div className="hidden sm:flex items-center gap-1.5">
                                {article.tags.map((tag, idx) => (
                                    <span key={idx} className="bg-sky-50 text-sky-700 text-xs font-bold px-3 py-1 rounded-full border border-sky-100">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tiêu đề bài viết */}
                    <div className="px-5 sm:px-8 pt-6 pb-4">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight tracking-tight">
                            {article.title}
                        </h1>
                    </div>

                    {/* Ảnh bìa bài viết */}
                    <div className="px-5 sm:px-8 pb-6">
                        <div className="relative w-full aspect-[16/10] sm:aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-xs border border-slate-100">
                            <img
                                src={article.thumbnail}
                                alt={article.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Nội dung bài viết (Rich Text Prose) */}
                    <div className="px-5 sm:px-8 pb-8">
                        <div
                            className="prose prose-slate prose-base sm:prose-lg max-w-none break-words overflow-hidden w-full prose-headings:font-black prose-headings:text-slate-900 prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-sky-500 hover:prose-a:text-sky-600 prose-img:rounded-2xl prose-img:shadow-sm prose-blockquote:border-l-4 prose-blockquote:border-sky-500 prose-blockquote:bg-sky-50/60 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-xl"
                            dangerouslySetInnerHTML={{ __html: article.content ? article.content.replace(/&nbsp;/g, ' ') : '' }}
                        />
                    </div>

                    {/* Thanh tương tác dưới bài viết */}
                    <div className="px-5 sm:px-8 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Nút Like / Thả tim */}
                            <button
                                onClick={handleToggleClap}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${hasClapped
                                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                                    }`}
                            >
                                {hasClapped ? (
                                    <FaHeart className="text-rose-500 text-sm" />
                                ) : (
                                    <FaRegHeart className="text-slate-500 text-sm" />
                                )}
                                <span>{claps} lượt thích</span>
                            </button>

                            {/* Số bình luận */}
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl">
                                <FiMessageSquare className="text-sky-500 text-sm" />
                                <span>{comments.length} bình luận</span>
                            </span>
                        </div>

                        {/* Nút Bookmark Vàng */}
                        <button
                            onClick={handleToggleSave}
                            className={`p-2 rounded-xl transition-transform active:scale-125 ${isSaved ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
                                }`}
                            title={isSaved ? "Bỏ lưu bài viết" : "Lưu vào mục Yêu thích"}
                        >
                            {isSaved ? <FaBookmark className="text-xl" /> : <FaRegBookmark className="text-xl" />}
                        </button>
                    </div>
                </div>

                {/* 3. KHU VỰC BÌNH LUẬN NÂNG CẤP (CÓ BỘ LỌC CŨ NHẤT / MỚI NHẤT) */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-8">

                    {/* Header Bình luận + BỘ LỌC CŨ NHẤT / MỚI NHẤT */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 mb-6">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                                <FiMessageSquare />
                            </div>
                            <h3 className="text-lg sm:text-xl font-black text-slate-900">
                                Tất cả bình luận ({sortedComments.length})
                            </h3>
                        </div>

                        {/* BỘ LỌC SẮP XẾP BÌNH LUẬN: MỚI NHẤT / CŨ NHẤT */}
                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200/60">
                            <button
                                onClick={() => setCommentSortOrder('newest')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${commentSortOrder === 'newest'
                                    ? 'bg-white text-sky-600 shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                ⚡ Mới nhất
                            </button>
                            <button
                                onClick={() => setCommentSortOrder('oldest')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${commentSortOrder === 'oldest'
                                    ? 'bg-white text-sky-600 shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                ⏳ Cũ nhất
                            </button>
                        </div>
                    </div>

                    {/* Form nhập bình luận */}
                    {userInfo ? (
                        <form onSubmit={submitComment} className="mb-8">
                            <div className="flex gap-3 items-start">
                                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200">
                                    {userInfo.avatar ? (
                                        <img src={userInfo.avatar} alt={userInfo.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-sm">
                                            {userInfo.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 relative">
                                    <textarea
                                        rows="3"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Để lại cảm nhận hoặc câu hỏi của bạn về bài viết này..."
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none transition-all placeholder:text-slate-400"
                                        required
                                    ></textarea>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                            <FaSmile className="hover:text-amber-500 cursor-pointer transition-colors" />
                                            <span className="hidden sm:inline">Nhấn Đăng để gửi bình luận</span>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!commentText.trim() || submittingComment}
                                            className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-bold text-xs py-2 px-5 rounded-xl transition-all shadow-xs active:scale-95"
                                        >
                                            <FiSend size={13} />
                                            <span>{submittingComment ? 'Đang gửi...' : 'Đăng bình luận'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="mb-8 p-6 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-200">
                            <p className="text-slate-500 text-xs sm:text-sm mb-3">Vui lòng đăng nhập để tham gia thảo luận và bình luận bài viết.</p>
                            <Link
                                to="/login"
                                className="inline-block bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs py-2 px-5 rounded-xl transition-colors shadow-xs"
                            >
                                Đăng nhập ngay
                            </Link>
                        </div>
                    )}

                    {/* Danh sách tất cả bình luận */}
                    <div className="space-y-4">
                        {sortedComments.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-xs italic bg-slate-50/50 rounded-2xl border border-slate-100">
                                Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ suy nghĩ!
                            </div>
                        ) : (
                            sortedComments.map((cmt, idx) => {
                                const displayAvatar = (cmt.user && cmt.user.avatar) ? cmt.user.avatar : cmt.avatar;

                                return (
                                    <div
                                        key={cmt._id || idx}
                                        className={`p-4 rounded-2xl border transition-all ${cmt.isPinned
                                            ? 'bg-amber-50/40 border-amber-200'
                                            : cmt.isHidden
                                                ? 'bg-slate-100/60 border-slate-200 opacity-60'
                                                : 'bg-slate-50/70 border-slate-100 hover:border-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-full overflow-hidden bg-sky-100 text-sky-600 font-bold flex items-center justify-center shrink-0 border border-slate-200 text-xs">
                                                {displayAvatar ? (
                                                    <img src={displayAvatar} alt={cmt.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{cmt.name?.charAt(0).toUpperCase() || 'U'}</span>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                                                            {cmt.name}
                                                        </span>
                                                        {cmt.isPinned && (
                                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                                                <TbPinFilled size={11} className="text-amber-600" />
                                                                Đã ghim
                                                            </span>
                                                        )}
                                                        <span className="text-[11px] text-slate-400">
                                                            • {new Date(cmt.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                        </span>
                                                        {cmt.isHidden && (
                                                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.2 rounded-full font-bold">
                                                                Đã ẩn
                                                            </span>
                                                        )}
                                                    </div>

                                                    {userInfo && (userInfo.role === 'admin' || userInfo.role === 'staff') && (
                                                        <button
                                                            onClick={() => toggleHideComment(cmt._id)}
                                                            className="text-[11px] font-bold text-slate-400 hover:text-sky-600 transition-colors"
                                                        >
                                                            {cmt.isHidden ? 'Hiện lại' : 'Ẩn bình luận'}
                                                        </button>
                                                    )}
                                                </div>

                                                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                    {cmt.content}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
};

export default BlogDetail;
