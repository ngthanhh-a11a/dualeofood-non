import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios, { SERVER_URL, getImageUrl } from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import StarRating from '../../components/common/StarRating';
import { FiMessageSquare, FiStar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const MyReviews = () => {
  const [activeTab, setActiveTab] = useState('food'); // 'food' hoặc 'article'
  
  // States cho Đánh giá đồ ăn
  const [foodReviews, setFoodReviews] = useState([]);
  const [foodLoading, setFoodLoading] = useState(true);
  const [foodPagination, setFoodPagination] = useState({ currentPage: 1, totalPages: 1 });

  // States cho Bình luận bài viết
  const [articleComments, setArticleComments] = useState([]);
  const [articleLoading, setArticleLoading] = useState(true);
  const [articlePagination, setArticlePagination] = useState({ currentPage: 1, totalPages: 1 });

  // Fetch Đánh giá đồ ăn
  useEffect(() => {
    const fetchFoodReviews = async (page = 1) => {
      setFoodLoading(true);
      try {
        const { data } = await axios.get(`/users/my-reviews?page=${page}`);
        setFoodReviews(data.reviews);
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
        setArticleComments(data.comments);
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
    } else {
      if (newPage > 0 && newPage <= articlePagination.totalPages) {
        setArticlePagination(prev => ({ ...prev, currentPage: newPage }));
      }
    }
  };

  // UI Components
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
    <div className="font-sans bg-slate-50/70 min-h-screen py-10 md:py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header Trang */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-4 tracking-tight">Hoạt động của tôi</h1>
          <p className="text-gray-500">Quản lý các đánh giá món ăn và bình luận bài viết của bạn</p>
        </div>

        {/* Custom Tabs */}
        <div className="flex justify-center mb-10">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex max-w-full overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveTab('food')}
              className={`flex items-center gap-2 px-5 md:px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap ${
                activeTab === 'food' 
                  ? 'bg-sky-500 text-white shadow-md transform scale-105' 
                  : 'text-gray-500 hover:bg-slate-50'
              }`}
            >
              <FiStar size={18} /> Đánh giá món ăn
            </button>
            <button
              onClick={() => setActiveTab('article')}
              className={`flex items-center gap-2 px-5 md:px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap ${
                activeTab === 'article' 
                  ? 'bg-orange-500 text-white shadow-md transform scale-105' 
                  : 'text-gray-500 hover:bg-slate-50'
              }`}
            >
              <FiMessageSquare size={18} /> Bình luận bài viết
            </button>
          </div>
        </div>

        {/* Nội dung Tab: Đánh giá món ăn */}
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
                    <Link to={`/product/${review.product._id}`} className="flex-shrink-0 mx-auto sm:mx-0 block overflow-hidden rounded-xl group w-24 h-24 sm:w-28 sm:h-28">
                      <img src={`${getImageUrl(review.product.image)}`} alt={review.product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </Link>
                    <div className="flex-1 flex flex-col justify-center text-center sm:text-left">
                      <Link to={`/product/${review.product._id}`}>
                        <h4 className="font-black text-gray-800 hover:text-sky-500 transition text-lg mb-1">{review.product.name}</h4>
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

        {/* Nội dung Tab: Bình luận bài viết */}
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
                    <Link to={`/blog/${comment.article.slug}`} className="flex-shrink-0 mx-auto sm:mx-0 block overflow-hidden rounded-xl group w-full sm:w-40 h-32 sm:h-auto aspect-video">
                      <img src={`${getImageUrl(comment.article.thumbnail)}`} alt={comment.article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </Link>
                    <div className="flex-1 flex flex-col text-center sm:text-left">
                      <Link to={`/blog/${comment.article.slug}`}>
                        <h4 className="font-bold text-gray-800 hover:text-orange-500 transition text-base md:text-lg mb-3 line-clamp-2 leading-tight">
                          {comment.article.title}
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

      </div>
    </div>
  );
};

export default MyReviews;