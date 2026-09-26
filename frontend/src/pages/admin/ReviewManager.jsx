import React, { useState, useEffect } from 'react';
import axios, { getImageUrl } from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { 
  FiMessageCircle, FiEye, FiEyeOff, FiStar, FiFileText, FiBox 
} from 'react-icons/fi';
import { TbPin, TbPinFilled } from 'react-icons/tb';

const ReviewManager = () => {
    const [activeTab, setActiveTab] = useState('products');
    const [productReviews, setProductReviews] = useState([]);
    const [articleComments, setArticleComments] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [reviewsRes, commentsRes] = await Promise.all([
                axios.get('/products/reviews/all'),
                axios.get('/articles/comments/all')
            ]);
            setProductReviews(reviewsRes.data || []);
            setArticleComments(commentsRes.data || []);
        } catch (error) {
            toast.error('Lỗi khi tải danh sách bình luận');
        }
        setLoading(false);
    };

    const handleToggleProductReviewVisibility = async (productId, reviewId) => {
        try {
            const res = await axios.put(`/products/${productId}/reviews/${reviewId}/visibility`);
            toast.success(res.data.message);
            setProductReviews(prev => prev.map(r => r._id === reviewId ? { ...r, isHidden: !r.isHidden } : r));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleToggleProductReviewPin = async (productId, reviewId) => {
        try {
            const res = await axios.put(`/products/${productId}/reviews/${reviewId}/pin`);
            toast.success(res.data.message);
            setProductReviews(prev => prev.map(r => r._id === reviewId ? { ...r, isPinned: !r.isPinned } : r));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleToggleArticleCommentVisibility = async (articleId, commentId) => {
        try {
            const res = await axios.put(`/articles/${articleId}/comments/${commentId}/visibility`);
            toast.success(res.data.message);
            setArticleComments(prev => prev.map(c => c._id === commentId ? { ...c, isHidden: !c.isHidden } : c));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleToggleArticleCommentPin = async (articleId, commentId) => {
        try {
            const res = await axios.put(`/articles/${articleId}/comments/${commentId}/pin`);
            toast.success(res.data.message);
            setArticleComments(prev => prev.map(c => c._id === commentId ? { ...c, isPinned: !c.isPinned } : c));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className={i < rating ? "fill-current" : "text-gray-300"} size={14} />
                ))}
            </div>
        );
    };

    return (
        <div className="font-sans pb-10 max-w-6xl mx-auto">
            {/* Header trang */}
            <div className="mb-6">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <FiMessageCircle className="text-sky-500" />
                    Quản lý Bình luận & Đánh giá
                </h1>
                <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
                    Kiểm duyệt, ghim nổi bật và quản lý phản hồi từ khách hàng.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200 mb-6">
                <button 
                    onClick={() => setActiveTab('products')}
                    className={`flex items-center gap-2 pb-3 px-2 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                        activeTab === 'products' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <FiBox size={18} /> 
                    <span>Đánh giá Món ăn ({productReviews.length})</span>
                </button>
                <button 
                    onClick={() => setActiveTab('articles')}
                    className={`flex items-center gap-2 pb-3 px-2 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                        activeTab === 'articles' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <FiFileText size={18} /> 
                    <span>Bình luận Bài viết ({articleComments.length})</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-32">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-sky-500"></div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
                    {activeTab === 'products' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                                        <th className="p-4 font-bold">Người dùng</th>
                                        <th className="p-4 font-bold">Nội dung đánh giá</th>
                                        <th className="p-4 font-bold w-48">Món ăn</th>
                                        <th className="p-4 font-bold text-center w-36">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productReviews.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center p-8 text-slate-500 text-xs">Chưa có đánh giá nào.</td></tr>
                                    ) : productReviews.map((review) => {
                                        const displayAvatar = (review.user && review.user.avatar) ? review.user.avatar : review.avatar;

                                        return (
                                        <tr 
                                            key={review._id} 
                                            className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${
                                                review.isHidden ? 'opacity-60 bg-slate-100/50' : ''
                                            }`}
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <img 
                                                        src={displayAvatar ? getImageUrl(displayAvatar) : `https://ui-avatars.com/api/?name=${review.name}&background=E0F2FE&color=0284C7`} 
                                                        className="w-10 h-10 rounded-full object-cover shadow-2xs" 
                                                        alt={review.name} 
                                                    />
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{review.name}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {new Date(review.createdAt).toLocaleDateString('vi-VN')} - {new Date(review.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <div className="mb-1 flex items-center gap-2">
                                                    {renderStars(review.rating)}
                                                    {review.isPinned && (
                                                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                                                            ⭐ Đã ghim
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{review.comment}</p>
                                            </td>

                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <img src={getImageUrl(review.product.image)} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                                    <span className="text-xs sm:text-sm font-semibold text-sky-600 truncate max-w-[130px]" title={review.product.name}>
                                                        {review.product.name}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* Nút Ẩn/Hiện */}
                                                    <button 
                                                        onClick={() => handleToggleProductReviewVisibility(review.product._id, review._id)}
                                                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                                            review.isHidden 
                                                                ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' 
                                                                : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
                                                        }`}
                                                        title={review.isHidden ? 'Hiện đánh giá' : 'Ẩn đánh giá'}
                                                    >
                                                        {review.isHidden ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                                    </button>
                                                    
                                                    {/* Nút Ghim */}
                                                    <button 
                                                        onClick={() => handleToggleProductReviewPin(review.product._id, review._id)}
                                                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                                            review.isPinned 
                                                                ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                                                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                        }`}
                                                        title={review.isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                                                    >
                                                        {review.isPinned ? <TbPinFilled size={16} /> : <TbPin size={16} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );})}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                                        <th className="p-4 font-bold">Người dùng</th>
                                        <th className="p-4 font-bold">Nội dung bình luận</th>
                                        <th className="p-4 font-bold w-48">Bài viết</th>
                                        <th className="p-4 font-bold text-center w-36">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {articleComments.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center p-8 text-slate-500 text-xs">Chưa có bình luận nào.</td></tr>
                                    ) : articleComments.map((comment) => {
                                        const displayAvatar = (comment.user && comment.user.avatar) ? comment.user.avatar : comment.avatar;

                                        return (
                                        <tr 
                                            key={comment._id} 
                                            className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${
                                                comment.isHidden ? 'opacity-60 bg-slate-100/50' : ''
                                            }`}
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <img 
                                                        src={displayAvatar ? getImageUrl(displayAvatar) : `https://ui-avatars.com/api/?name=${comment.name}&background=E0F2FE&color=0284C7`} 
                                                        className="w-10 h-10 rounded-full object-cover shadow-2xs" 
                                                        alt={comment.name} 
                                                    />
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{comment.name}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {new Date(comment.createdAt).toLocaleDateString('vi-VN')} - {new Date(comment.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <div className="mb-1 flex items-center gap-2">
                                                    {comment.isPinned && (
                                                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                                                            ⭐ Đã ghim
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{comment.content}</p>
                                            </td>

                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <img src={getImageUrl(comment.article?.thumbnail)} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                                    <span className="text-xs sm:text-sm font-semibold text-sky-600 truncate max-w-[130px]" title={comment.article?.title}>
                                                        {comment.article?.title}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* Nút Ẩn/Hiện */}
                                                    <button 
                                                        onClick={() => handleToggleArticleCommentVisibility(comment.article._id, comment._id)}
                                                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                                            comment.isHidden 
                                                                ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' 
                                                                : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
                                                        }`}
                                                        title={comment.isHidden ? 'Hiện bình luận' : 'Ẩn bình luận'}
                                                    >
                                                        {comment.isHidden ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                                    </button>
                                                    
                                                    {/* Nút Ghim */}
                                                    <button 
                                                        onClick={() => handleToggleArticleCommentPin(comment.article._id, comment._id)}
                                                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                                            comment.isPinned 
                                                                ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                                                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                        }`}
                                                        title={comment.isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                                                    >
                                                        {comment.isPinned ? <TbPinFilled size={16} /> : <TbPin size={16} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );})}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReviewManager;
