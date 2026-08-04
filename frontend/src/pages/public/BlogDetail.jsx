import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { FiClock, FiEye, FiUser, FiArrowLeft, FiTag, FiThumbsUp, FiMessageSquare, FiSend, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

const BlogDetail = () => {
    const { slug } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Comments & Claps state
    const [claps, setClaps] = useState(0);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [clapping, setClapping] = useState(false);
    const [hasClapped, setHasClapped] = useState(false);
    
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const res = await axios.get(`/articles/${slug}`);
                setArticle(res.data);
                setClaps(res.data.claps || 0);
                setComments(res.data.comments || []);
                
                // Check if already clapped
                if (userInfo && res.data.clappedBy && (res.data.clappedBy.includes(userInfo._id) || res.data.clappedBy.includes(userInfo.id))) {
                    setHasClapped(true);
                } else {
                    setHasClapped(false);
                }

                setLoading(false);
            } catch (error) {
                console.error('Lỗi khi lấy chi tiết bài viết:', error);
                toast.error('Không thể tải bài viết');
                setLoading(false);
            }
        };

        fetchArticle();
    }, [slug]);

    const handleClap = async () => {
        if (!userInfo) return toast.error('Vui lòng đăng nhập để thích bài viết!');
        if (!article) return;
        
        if (hasClapped) {
            // Hủy thích (Unlike)
            setClaps(prev => Math.max(0, prev - 1));
            setHasClapped(false);

            try {
                await axios.post(`/articles/${article._id}/unclap`, {}, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                });
            } catch (error) {
                console.error('Lỗi khi bỏ vỗ tay', error);
                setClaps(prev => prev + 1);
                setHasClapped(true);
            }
        } else {
            // Thích (Like)
            setClapping(true);
            setClaps(prev => prev + 1);
            setHasClapped(true);

            try {
                await axios.post(`/articles/${article._id}/clap`, {}, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                });
            } catch (error) {
                console.error('Lỗi khi vỗ tay', error);
                setClaps(prev => Math.max(0, prev - 1));
                setHasClapped(false);
            }
            setTimeout(() => setClapping(false), 800);
        }
    };

    const submitComment = async (e) => {
        e.preventDefault();
        if (!userInfo) return toast.error('Vui lòng đăng nhập để bình luận!');
        if (!commentText.trim()) return;

        try {
            const res = await axios.post(`/articles/${article._id}/comments`, { content: commentText }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setComments(res.data.comments);
            setCommentText('');
            toast.success('Đã gửi bình luận');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể gửi bình luận');
        }
    };

    const toggleHideComment = async (commentId) => {
        if (!userInfo || (userInfo.role !== 'admin' && userInfo.role !== 'staff')) return;
        try {
            const res = await axios.put(`/articles/${article._id}/comments/${commentId}/visibility`, {}, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setComments(res.data.comments);
            toast.success(res.data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi thao tác bình luận');
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 mt-24 max-w-4xl">
                <div className="animate-pulse flex flex-col gap-4">
                    <div className="h-10 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-6 bg-slate-200 rounded w-1/4 mb-8"></div>
                    <div className="h-96 bg-slate-200 rounded-3xl w-full"></div>
                </div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="container mx-auto px-4 py-32 mt-24 text-center">
                <div className="text-6xl mb-6">🔍</div>
                <h1 className="text-3xl font-black text-slate-800 mb-4">Không tìm thấy bài viết!</h1>
                <p className="text-slate-500 mb-8">Bài viết này có thể đã bị xóa hoặc không tồn tại.</p>
                <Link to="/blog" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-full transition-colors shadow-lg shadow-sky-500/30">
                    ← Quay lại góc khám phá
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-16 font-sans">
            {/* Banner/Thumbnail Header */}
            <div className="relative w-full h-[60vh] mt-16 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 z-10"></div>
                <img 
                    src={article.thumbnail} 
                    alt={article.title} 
                    className="w-full h-full object-cover scale-105"
                />
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-end text-center px-6 pb-24 md:pb-32">
                    <div className="container max-w-4xl mx-auto animate-fade-in-up">
                        {article.tags && article.tags.length > 0 && (
                            <div className="flex justify-center gap-2 mb-6">
                                {article.tags.map((tag, idx) => (
                                    <span key={idx} className="bg-sky-500/90 backdrop-blur-md text-white text-sm font-bold px-5 py-1.5 rounded-full shadow-xl border border-sky-400/30 flex items-center gap-1.5 uppercase tracking-wider">
                                        <FiTag size={12}/> {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-8 leading-tight drop-shadow-2xl">
                            {article.title}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center text-sky-50 gap-x-8 gap-y-4 text-sm font-medium tracking-wide">
                            <span className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 flex items-center justify-center border-2 border-white/30">
                                    {article.author?.avatar ? (
                                        <img src={article.author.avatar} alt="Author" className="w-full h-full object-cover" />
                                    ) : (
                                        <FiUser size={18}/>
                                    )}
                                </div>
                                <span className="font-bold text-base">{article.author?.name || 'Admin'}</span>
                            </span>
                            <span className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm"><FiClock size={16}/> {new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                            <span className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm"><FiEye size={16}/> {article.views} Lượt xem</span>
                            <span className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm"><FiThumbsUp size={16}/> {claps} Lượt thích</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="container mx-auto px-4 max-w-4xl -mt-16 md:-mt-24 relative z-30 mb-20">
                <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-16 border border-slate-100">
                    <Link to="/blog" className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-500 mb-10 transition-colors font-bold tracking-wide uppercase text-sm group">
                        <FiArrowLeft className="group-hover:-translate-x-1 transition-transform"/> Quay lại bài viết khác
                    </Link>
                    
                    <div 
                        className="prose prose-lg md:prose-xl max-w-none break-words overflow-hidden w-full prose-img:max-w-full prose-img:h-auto prose-img:rounded-3xl prose-img:mx-auto prose-img:shadow-xl prose-headings:text-slate-800 prose-headings:font-black prose-a:text-sky-500 hover:prose-a:text-sky-600 prose-p:text-slate-700 prose-p:leading-relaxed prose-blockquote:border-sky-500 prose-blockquote:bg-sky-50 prose-blockquote:py-2 prose-blockquote:rounded-r-2xl"
                        dangerouslySetInnerHTML={{ __html: article.content ? article.content.replace(/&nbsp;/g, ' ') : '' }}
                    />

                    {/* Comments & Claps Section */}
                    <div className="mt-16 pt-12 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                            <div className="flex items-center gap-3">
                                <FiMessageSquare className="text-3xl text-sky-500" />
                                <h3 className="text-2xl font-black text-slate-800">Bình luận ({comments.filter(c => !c.isHidden || (userInfo && (userInfo.role === 'admin' || userInfo.role === 'staff'))).length})</h3>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <span className="text-slate-400 font-bold text-sm uppercase tracking-wider">{claps} Lượt thích</span>
                                <div className="relative">
                                    {clapping && !hasClapped && (
                                        <div className="absolute -top-10 text-sky-500 font-black text-2xl animate-float-up pointer-events-none drop-shadow-md z-10 w-full text-center">
                                            +1
                                        </div>
                                    )}
                                    <button 
                                        onClick={handleClap}
                                        className={`px-5 py-2.5 rounded-full flex items-center gap-2 shadow-sm font-bold transition-all duration-300 border ${hasClapped ? 'border-rose-500 text-rose-500 bg-rose-50' : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700'}`}
                                        title={hasClapped ? "Bỏ thích" : "Thích bài viết"}
                                    >
                                        <FiThumbsUp className={`text-xl ${hasClapped ? 'fill-current' : ''}`} />
                                        <span>{hasClapped ? 'Đã thích' : 'Thích'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Comment Form */}
                        {userInfo ? (
                            <form onSubmit={submitComment} className="mb-10 flex gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-sky-100">
                                    {userInfo.avatar ? (
                                        <img src={userInfo.avatar} alt={userInfo.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-sky-100 flex items-center justify-center text-sky-500 font-bold text-xl">
                                            {userInfo.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 relative">
                                    <textarea 
                                        rows="3" 
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..."
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none transition-all placeholder:text-slate-400"
                                        required
                                    ></textarea>
                                    <button type="submit" disabled={!commentText.trim()} className="absolute bottom-4 right-4 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg">
                                        <FiSend size={18} className="mr-0.5 mt-0.5" />
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="mb-10 p-6 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-300">
                                <p className="text-slate-500 mb-4">Vui lòng đăng nhập để tham gia thảo luận cùng cộng đồng.</p>
                                <Link to="/login" className="inline-block bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 px-6 rounded-full transition-colors shadow-lg shadow-sky-500/30">
                                    Đăng nhập ngay
                                </Link>
                            </div>
                        )}

                        {/* Comment List */}
                        <div className="space-y-6">
                            {comments.filter(c => !c.isHidden || (userInfo && (userInfo.role === 'admin' || userInfo.role === 'staff'))).length === 0 ? (
                                <p className="text-center text-slate-400 py-8 italic">Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ suy nghĩ!</p>
                            ) : (
                                comments.filter(c => !c.isHidden || (userInfo && (userInfo.role === 'admin' || userInfo.role === 'staff')))
                                    .reverse()
                                    .map((cmt, idx) => {
                                        const displayAvatar = (cmt.user && cmt.user.avatar) ? cmt.user.avatar : cmt.avatar;
                                        
                                        return (
                                    <div key={cmt._id || idx} className={`flex gap-4 p-5 rounded-2xl animate-fade-in-up transition-all ${cmt.isHidden ? 'bg-slate-100 opacity-60' : 'bg-slate-50'}`}>
                                        <div className={`w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center border ${cmt.isHidden ? 'bg-slate-200 border-slate-300' : 'bg-sky-100 border-sky-200'}`}>
                                            {displayAvatar ? (
                                                <img src={displayAvatar} alt={cmt.name} className={`w-full h-full object-cover ${cmt.isHidden ? 'grayscale' : ''}`} />
                                            ) : (
                                                <span className={`${cmt.isHidden ? 'text-slate-500' : 'text-sky-500'} font-bold`}>{cmt.name.charAt(0).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                                                <div className="flex items-baseline gap-2">
                                                    <h4 className="font-bold text-slate-800">{cmt.name}</h4>
                                                    <span className="text-xs text-slate-400">{new Date(cmt.createdAt).toLocaleString('vi-VN')}</span>
                                                    {cmt.isHidden && (
                                                        <span className="text-[10px] bg-slate-300 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Đã ẩn</span>
                                                    )}
                                                </div>
                                                {userInfo && (userInfo.role === 'admin' || userInfo.role === 'staff') && (
                                                    <button 
                                                        onClick={() => toggleHideComment(cmt._id)}
                                                        className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 transition-colors ${cmt.isHidden ? 'bg-sky-100 text-sky-600 hover:bg-sky-200' : 'bg-slate-200 text-slate-500 hover:bg-rose-100 hover:text-rose-600'}`}
                                                    >
                                                        {cmt.isHidden ? <FiEye size={12}/> : <FiEyeOff size={12}/>}
                                                        {cmt.isHidden ? 'Khôi phục' : 'Ẩn'}
                                                    </button>
                                                )}
                                            </div>
                                            <p className={`leading-relaxed whitespace-pre-wrap ${cmt.isHidden ? 'text-slate-500 italic' : 'text-slate-600'}`}>{cmt.content}</p>
                                        </div>
                                    </div>
                                )})
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Styles for animations and responsive rich text */}
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes float-up {
                    0% { opacity: 0; transform: translateY(10px) scale(0.8); }
                    20% { opacity: 1; transform: translateY(-10px) scale(1.2); }
                    100% { opacity: 0; transform: translateY(-40px) scale(1); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
                .animate-float-up { animation: float-up 0.8s ease-out forwards; }
                
                /* Đảm bảo nội dung nhúng không bị tràn */
                .prose iframe, .prose video, .prose img {
                    max-width: 100% !important;
                    height: auto !important;
                }
                .prose table {
                    width: 100% !important;
                    display: block;
                    overflow-x: auto;
                }
            `}</style>
        </div>
    );
};

export default BlogDetail;
