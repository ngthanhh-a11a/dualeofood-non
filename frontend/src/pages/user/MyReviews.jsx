import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios, { getImageUrl } from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import StarRating from '../../components/common/StarRating';
import { FiMessageSquare, FiStar, FiChevronLeft, FiChevronRight, FiTrash2, FiExternalLink, FiHeart } from 'react-icons/fi';
import { FaBookmark } from 'react-icons/fa';

const MyReviews = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') === 'saved' ? 'saved' : 'food';

  const [activeTab, setActiveTab] = useState(initialTab); // 'food' | 'article' | 'saved'
  
  // States cho Đánh giá đồ ăn
  const [foodReviews, setFoodReviews] = useState([]);
  const [foodLoading, setFoodLoading] = useState(true);
  const [foodPagination, setFoodPagination] = useState({ currentPage: 1, totalPages: 1 });

  // States cho Bình luận bài viết
  const [articleComments, setArticleComments] = useState([]);
  const [articleLoading, setArticleLoading] = useState(true);
  const [articlePagination, setArticlePagination] = useState({ currentPage: 1, totalPages: 1 });

  // States cho Bài viết yêu thích đã lưu
  const [savedArticles, setSavedArticles] = useState([]);

  // Cập nhật tab khi query param thay đổi
  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get('tab');
    if (tabParam === 'saved') {
      setActiveTab('saved');
    }
  }, [location.search]);

  // Load danh sách bài viết đã lưu từ localStorage
  useEffect(() => {
    const loadSavedArticles = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('saved_articles_data') || '[]');
        setSavedArticles(stored);
      } catch (err) {
        console.error('Lỗi khi đọc danh sách bài viết đã lưu:', err);
      }
    };
    loadSavedArticles();
  }, [activeTab]);

  // Xóa bài viết khỏi mục đã lưu
  const handleRemoveSavedArticle = (articleId) => {
    const updated = savedArticles.filter(item => item._id !== articleId);
    setSavedArticles(updated);
    localStorage.setItem('saved_articles_data', JSON.stringify(updated));

    const storedIds = JSON.parse(localStorage.getItem('saved_article_ids') || '[]');
    const updatedIds = storedIds.filter(id => id !== articleId);
    localStorage.setItem('saved_article_ids', JSON.stringify(updatedIds));

    toast('Đã bỏ lưu bài viết khỏi danh sách yêu thích', { icon: '🗑️' });
  };

  // Fetch Đánh giá đồ ăn
  useEffect(() => {
    const fetchFoodReviews = async (page = 1) => {
      setFoodLoading(true);
      try {
        const { data } = await axios.get(`/users/my-reviews?page=${page}`);
        setFoodReviews(data.reviews || []);
        setFoodPagination({ currentPage: data.currentPage, totalPages: data.totalPages });
      } catch (error) {
        toast.error('Không thể tải danh sách đánh giá món ăn.');
        console.error(error);
      } finally {
        setFoodLoading(false);
      }
    };
    if (activeTab === 'food') {
      fetchFoodReviews(foodPagination.currentPage);
    }
  }, [activeTab, foodPagination.currentPage]);

  // Fetch Bình luận bài viết
  useEffect(() => {
    const fetchArticleComments = async (page = 1) => {
      setArticleLoading(true);
      try {
        const { data } = await axios.get(`/users/my-article-comments?page=${page}`);
        setArticleComments(data.comments || []);
        setArticlePagination({ currentPage: data.currentPage, totalPages: data.totalPages });
      } catch (error) {
        toast.error('Không thể tải danh sách bình luận bài viết.');
        console.error(error);
      } finally {
        setArticleLoading(false);
      }
    };
    if (activeTab === 'article') {
      fetchArticleComments(articlePagination.currentPage);
    }
  }, [activeTab, articlePagination.currentPage]);

  const handlePageChange = (newPage) => {
    if (activeTab === 'food') {
      if (newPage > 0 && newPage <= foodPagination.totalPages) {
        setFoodPagination(prev => ({ ...prev, currentPage: newPage }));
      }
    } else if (activeTab === 'article') {
      if (newPage > 0 && newPage <= articlePagination.totalPages) {
        setArticlePagination(prev => ({ ...prev, currentPage: newPage }));
      }
    }
  };

  // UI Pagination Controls
  const PaginationControls = ({ pagination }) => {
    if (pagination.totalPages <= 1) return null;
    return (
      <div className="mt-8 flex justify-center items-center gap-4">
        <button 
          onClick={() => handlePageChange(pagination.currentPage - 1)} 
          disabled={pagination.currentPage === 1} 
          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-sky-50 hover:text-sky-500 disabled:opacity-50 transition"
        >
          <FiChevronLeft size={20} />
        </button>
        <span className="text-sm font-bold text-gray-700 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
          Trang {pagination.currentPage} / {pagination.totalPages}
        </span>
        <button 
          onClick={() => handlePageChange(pagination.currentPage + 1)} 
          disabled={pagination.currentPage === pagination.totalPages} 
          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-sky-50 hover:text-sky-500 disabled:opacity-50 transition"
        >
          <FiChevronRight size={20} />
        </button>
      </div>
    );
  };

  return (
    <div className="font-sans bg-slate-50/70 min-h-screen py-6 md:py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header Trang - Thu nhỏ gọn gàng, tinh tế */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-600 text-xs font-bold px-3 py-1 rounded-full mb-2 border border-sky-100">
            <span>⭐ Hoạt động cá nhân</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">Hoạt động & Yêu thích của tôi</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 max-w-md mx-auto">Quản lý đánh giá món ăn, bình luận và các bài viết bạn đã lưu</p>
        </div>

        {/* Custom Tabs (3 Tabs: Đánh giá món ăn, Bình luận, Bài viết đã lưu) */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-1 rounded-xl shadow-xs border border-gray-100 inline-flex max-w-full overflow-x-auto custom-scrollbar gap-1">
            {/* Tab 1: Đánh giá món ăn */}
            <button
              onClick={() => setActiveTab('food')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg font-bold text-xs transition-all duration-200 whitespace-nowrap ${
                activeTab === 'food' 
                  ? 'bg-sky-500 text-white shadow-xs' 
                  : 'text-gray-500 hover:bg-slate-50'
              }`}
            >
              <FiStar size={14} /> Đánh giá món ăn
            </button>

            {/* Tab 2: Bình luận bài viết */}
            <button
              onClick={() => setActiveTab('article')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg font-bold text-xs transition-all duration-200 whitespace-nowrap ${
                activeTab === 'article' 
                  ? 'bg-orange-500 text-white shadow-xs' 
                  : 'text-gray-500 hover:bg-slate-50'
              }`}
            >
              <FiMessageSquare size={14} /> Bình luận bài viết
            </button>

            {/* Tab 3: Bài viết đã lưu (Yêu thích) - Icon màu vàng amber */}
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg font-bold text-xs transition-all duration-200 whitespace-nowrap ${
                activeTab === 'saved' 
                  ? 'bg-amber-500 text-white shadow-xs' 
                  : 'text-gray-500 hover:bg-amber-50 hover:text-amber-600'
              }`}
            >
              <FaBookmark className={activeTab === 'saved' ? 'text-white' : 'text-amber-500'} size={13} /> 
              Bài viết đã lưu {savedArticles.length > 0 && `(${savedArticles.length})`}
            </button>
          </div>
        </div>

        {/* ================= NỘI DUNG TAB 1: ĐÁNH GIÁ MÓN ĂN ================= */}
        {activeTab === 'food' && (
          <div className="animate-fade-in-up">
            {foodLoading ? (
              <div className="text-center py-20 font-bold text-sky-500 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                Đang tải dữ liệu...
              </div>
            ) : foodReviews.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4 text-sky-500">
                  <FiStar size={32} />
                </div>
                <p className="text-xl font-bold text-gray-700 mb-2">Bạn chưa có đánh giá nào</p>
                <p className="text-gray-500 mb-6 text-sm">Hãy thưởng thức món ăn và để lại cảm nhận nhé!</p>
                <Link to="/my-orders" className="bg-sky-500 text-white font-bold py-3 px-8 rounded-full hover:bg-sky-600 transition shadow-lg shadow-sky-200 inline-block text-sm">
                  Xem đơn hàng đã mua
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {foodReviews.map(review => (
                  <div key={review._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 flex flex-col sm:flex-row gap-5 hover:shadow-md transition-shadow">
                    <Link to={`/product/${review.product?._id}`} className="flex-shrink-0 mx-auto sm:mx-0 block overflow-hidden rounded-xl group w-24 h-24 sm:w-28 sm:h-28">
                      <img src={`${getImageUrl(review.product?.image)}`} alt={review.product?.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </Link>
                    <div className="flex-1 flex flex-col justify-center text-center sm:text-left">
                      <Link to={`/product/${review.product?._id}`}>
                        <h4 className="font-black text-gray-800 hover:text-sky-500 transition text-lg mb-1">{review.product?.name}</h4>
                      </Link>
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                        <StarRating rating={review.rating} />
                        <span className="text-sm font-bold text-yellow-500 bg-yellow-50 px-2 py-0.5 rounded">({review.rating}.0)</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
                        <span className="absolute -top-3 left-4 text-2xl text-sky-200">"</span>
                        <p className="text-gray-700 text-sm italic relative z-10">{review.comment}</p>
                      </div>
                      <p className="text-xs font-semibold text-gray-400 mt-3 text-right">
                        {new Date(review.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
                <PaginationControls pagination={foodPagination} />
              </div>
            )}
          </div>
        )}

        {/* ================= NỘI DUNG TAB 2: BÌNH LUẬN BÀI VIẾT ================= */}
        {activeTab === 'article' && (
          <div className="animate-fade-in-up">
            {articleLoading ? (
              <div className="text-center py-20 font-bold text-orange-500 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                Đang tải dữ liệu...
              </div>
            ) : articleComments.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500">
                  <FiMessageSquare size={32} />
                </div>
                <p className="text-xl font-bold text-gray-700 mb-2">Bạn chưa bình luận bài viết nào</p>
                <p className="text-gray-500 mb-6 text-sm">Cùng đọc tin tức và tham gia thảo luận với mọi người nhé!</p>
                <Link to="/blog" className="bg-orange-500 text-white font-bold py-3 px-8 rounded-full hover:bg-orange-600 transition shadow-lg shadow-orange-200 inline-block text-sm">
                  Khám phá Bài viết
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {articleComments.map(comment => (
                  <div key={comment._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 flex flex-col sm:flex-row gap-5 hover:shadow-md transition-shadow">
                    <Link to={`/blog/${comment.article?.slug}`} className="flex-shrink-0 mx-auto sm:mx-0 block overflow-hidden rounded-xl group w-full sm:w-40 h-32 sm:h-auto aspect-video">
                      <img src={`${getImageUrl(comment.article?.thumbnail)}`} alt={comment.article?.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </Link>
                    <div className="flex-1 flex flex-col text-center sm:text-left">
                      <Link to={`/blog/${comment.article?.slug}`}>
                        <h4 className="font-bold text-gray-800 hover:text-orange-500 transition text-base md:text-lg mb-3 line-clamp-2 leading-tight">
                          {comment.article?.title}
                        </h4>
                      </Link>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex-1 relative">
                        <span className="absolute -top-3 left-4 text-2xl text-orange-200">"</span>
                        <p className="text-gray-700 text-sm relative z-10">{comment.content}</p>
                      </div>
                      <p className="text-xs font-semibold text-gray-400 mt-3 sm:text-right text-center">
                        {new Date(comment.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <PaginationControls pagination={articlePagination} />
              </div>
            )}
          </div>
        )}

        {/* ================= NỘI DUNG TAB 3: BÀI VIẾT ĐÃ LƯU (YÊU THÍCH) ================= */}
        {activeTab === 'saved' && (
          <div className="animate-fade-in-up">
            {savedArticles.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
                  <FaBookmark size={30} />
                </div>
                <p className="text-xl font-bold text-gray-700 mb-2">Chưa có bài viết yêu thích nào</p>
                <p className="text-gray-500 mb-6 text-sm max-w-sm mx-auto">
                  Hãy nhấn vào biểu tượng Bookmark vàng trên bài đăng để lưu lại những mẹo ẩm thực và ưu đãi bạn yêu thích!
                </p>
                <Link to="/blog" className="bg-amber-500 text-white font-bold py-3 px-8 rounded-full hover:bg-amber-600 transition shadow-lg shadow-amber-200 inline-block text-sm">
                  Khám phá bài viết ngay ➔
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2 mb-2 text-xs font-bold text-slate-500">
                  <span>Có {savedArticles.length} bài viết bạn đã đánh dấu yêu thích</span>
                  <Link to="/blog" className="text-sky-500 hover:underline">
                    Xem thêm bài đăng mới ➔
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedArticles.map((article) => (
                    <div 
                      key={article._id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                      <div>
                        {/* Ảnh bài viết */}
                        <div className="relative aspect-video overflow-hidden bg-slate-100">
                          <img 
                            src={article.thumbnail} 
                            alt={article.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {article.tags && article.tags.length > 0 && (
                            <span className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              #{article.tags[0]}
                            </span>
                          )}
                          <span className="absolute top-3 right-3 bg-amber-500 text-white p-1.5 rounded-full shadow-md">
                            <FaBookmark size={11} />
                          </span>
                        </div>

                        {/* Thông tin bài viết */}
                        <div className="p-4">
                          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                            <span className="font-semibold text-slate-600">{article.author || 'DualeoFood'}</span>
                            <span>•</span>
                            <span>{article.savedAt ? new Date(article.savedAt).toLocaleDateString('vi-VN') : ''}</span>
                          </div>

                          <Link to={`/blog/${article.slug}`}>
                            <h4 className="font-bold text-slate-800 group-hover:text-amber-600 transition-colors text-sm sm:text-base line-clamp-2 leading-snug mb-2">
                              {article.title}
                            </h4>
                          </Link>

                          <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold mt-2">
                            <span className="flex items-center gap-1 text-rose-500">
                              <FiHeart size={13} className="fill-current" /> {article.claps || 0}
                            </span>
                            <span className="flex items-center gap-1 text-sky-500">
                              <FiMessageSquare size={13} /> {article.commentsCount || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleRemoveSavedArticle(article._id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-600 py-1.5 px-2.5 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Bỏ lưu bài viết này"
                        >
                          <FiTrash2 size={13} />
                          <span>Bỏ lưu</span>
                        </button>

                        <Link
                          to={`/blog/${article.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 py-1.5 px-3.5 rounded-xl shadow-xs transition-all active:scale-95"
                        >
                          <span>Đọc bài viết</span>
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

      </div>
    </div>
  );
};

export default MyReviews;