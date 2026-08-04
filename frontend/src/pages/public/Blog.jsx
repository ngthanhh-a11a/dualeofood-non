import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { FiClock, FiEye, FiUser, FiArrowRight, FiMessageSquare, FiThumbsUp } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Blog = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clappedArticles, setClappedArticles] = useState({});
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        setClappedArticles(JSON.parse(localStorage.getItem('clapped_articles') || '{}'));
        setUserInfo(JSON.parse(localStorage.getItem('userInfo') || 'null'));
        const fetchArticles = async () => {
            try {
                const res = await axios.get('/articles');
                setArticles(res.data);
                setLoading(false);
            } catch (error) {
                console.error('Lỗi khi lấy bài viết:', error);
                toast.error('Không thể tải danh sách bài viết');
                setLoading(false);
            }
        };

        fetchArticles();
    }, []);

    // Hàm tiện ích để chuyển đổi HTML thô thành văn bản thuần và giải mã các thực thể (như &nbsp;)
    const getPlainText = (html) => {
        if (!html) return "";
        const doc = new DOMParser().parseFromString(html, "text/html");
        // Thay thế khoảng trắng không ngắt (U+00A0) thành khoảng trắng thường (U+0020)
        return (doc.body.textContent || "").replace(/\u00A0/g, ' ');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <div className="container mx-auto px-4 py-20 mt-16 max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="animate-pulse bg-white rounded-3xl h-96 shadow-sm border border-slate-100"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* HERO SECTION */}
            <div className="relative w-full overflow-hidden min-h-[500px] flex items-center justify-center">
                {/* Background Image & Overlay */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1495195134817-a1a28078103c?q=80&w=2000&auto=format&fit=crop" 
                        alt="Blog Background" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-900/95 via-sky-800/80 to-blue-900/90 mix-blend-multiply"></div>
                </div>

                {/* Floating Elements (Decorative) */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 text-6xl opacity-20 animate-bounce" style={{animationDuration: '3s'}}>🍔</div>
                    <div className="absolute bottom-20 right-10 text-5xl opacity-20 animate-bounce" style={{animationDuration: '4s'}}>🥤</div>
                    <div className="absolute top-1/3 right-1/4 text-4xl opacity-20 animate-pulse">🍟</div>
                    <div className="absolute bottom-1/4 left-1/4 text-5xl opacity-20 animate-pulse">🍕</div>
                </div>

                <div className="container mx-auto px-4 py-24 md:py-32 relative z-10 text-center flex flex-col items-center mt-10">
                    <span className="bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-[0_0_20px_rgba(56,189,248,0.5)] border border-sky-300/30 px-6 py-2 rounded-full text-sm font-black tracking-[0.2em] uppercase mb-8 backdrop-blur-md animate-pulse">
                        DualeoFood Blog
                    </span>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-100 to-sky-300 mb-8 drop-shadow-2xl leading-tight">
                        GÓC KHÁM PHÁ
                    </h1>
                    <p className="text-white text-xl md:text-2xl max-w-3xl mx-auto mb-16 font-semibold leading-relaxed drop-shadow-xl border-t border-b border-sky-400/30 py-6 bg-black/10 backdrop-blur-sm rounded-3xl">
                        Cập nhật những thông tin ẩm thực hấp dẫn, ưu đãi độc quyền và các câu chuyện thú vị từ nhà bếp của chúng tôi.
                    </p>
                    
                    {/* Scroll Down Indicator */}
                    <div className="animate-bounce w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-2xl">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                    </div>
                </div>
                
                {/* SVG Curve at the bottom */}
                <div className="absolute bottom-0 w-full overflow-hidden leading-none">
                    <svg className="relative block w-full h-[50px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,123.63,195,111.9,239.5,103.74,281.65,76.54,321.39,56.44Z" className="fill-slate-50"></path>
                    </svg>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="container mx-auto px-4 pb-24 -mt-8 relative z-20 max-w-6xl">
                {articles.length === 0 ? (
                    <div className="text-center text-gray-500 py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                        <span className="text-4xl block mb-4">📰</span>
                        Hiện chưa có bài viết nào. Hãy quay lại sau nhé!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {articles.map((article, idx) => {
                            const hasClapped = userInfo && article.clappedBy && (article.clappedBy.includes(userInfo._id) || article.clappedBy.includes(userInfo.id));
                            const hasCommented = userInfo && article.comments?.some(c => c.user === userInfo.id || c.user === userInfo._id);
                            
                            return (
                                <div 
                                    key={article._id} 
                                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 group cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col" 
                                    style={{animationDelay: `${idx * 100}ms`}}
                                >
                                    <div className="relative h-60 overflow-hidden">
                                        <div className="absolute inset-0 bg-sky-900/10 group-hover:bg-transparent transition-colors z-10"></div>
                                        <img 
                                            src={article.thumbnail} 
                                            alt={article.title} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        {article.tags && article.tags.length > 0 && (
                                            <div className="absolute top-4 left-4 z-20 flex gap-2">
                                                <span className="bg-sky-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm bg-opacity-90">
                                                    {article.tags[0]}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 md:p-8 flex flex-col flex-1 relative">
                                        <div className="flex items-center text-xs text-slate-400 mb-4 gap-4 font-semibold tracking-wider">
                                            <span className="flex items-center gap-1.5"><FiClock size={14}/> {new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                                            <span className="flex items-center gap-1.5"><FiEye size={14}/> {article.views} views</span>
                                            <span className={`flex items-center gap-1.5 transition-colors ${hasClapped ? 'text-rose-500' : ''}`}>
                                                <FiThumbsUp size={14} className={hasClapped ? 'fill-current' : ''}/> {article.claps || 0}
                                            </span>
                                            <span className={`flex items-center gap-1.5 transition-colors ${hasCommented ? 'text-sky-500' : ''}`}>
                                                <FiMessageSquare size={14} className={hasCommented ? 'fill-current' : ''}/> {article.comments?.length || 0}
                                            </span>
                                        </div>
                                    <h2 className="text-xl font-bold text-slate-800 mb-4 line-clamp-2 group-hover:text-sky-500 transition-colors leading-snug">
                                        <Link to={`/blog/${article.slug}`}>{article.title}</Link>
                                    </h2>
                                    <p className="text-slate-500 mb-6 line-clamp-3 text-sm leading-relaxed flex-1">
                                        {getPlainText(article.content)}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full overflow-hidden bg-sky-100 flex items-center justify-center text-sky-500 font-black text-sm border-2 border-white shadow-sm">
                                                {article.author?.avatar ? (
                                                    <img src={article.author.avatar} alt="Author" className="w-full h-full object-cover" />
                                                ) : (
                                                    <FiUser />
                                                )}
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{article.author?.name || 'Admin'}</span>
                                        </div>
                                        <Link to={`/blog/${article.slug}`} className="text-sky-500 font-bold text-sm hover:text-sky-600 flex items-center gap-1 transition-colors">
                                            Đọc tiếp <FiArrowRight />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Blog;
