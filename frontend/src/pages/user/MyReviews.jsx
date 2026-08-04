import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios, { SERVER_URL , getImageUrl } from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import StarRating from '../../components/common/StarRating';

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  useEffect(() => {
    const fetchMyReviews = async (page = 1) => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/users/my-reviews?page=${page}`);
        setReviews(data.reviews);
        setPagination({ currentPage: data.currentPage, totalPages: data.totalPages });
      } catch (error) {
        toast.error('Không thể tải danh sách đánh giá.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyReviews(pagination.currentPage);
  }, [pagination.currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  if (loading) {
    return <div className="text-center py-20 font-bold text-sky-500">Đang tải đánh giá của bạn...</div>;
  }

  return (
    <div className="font-sans bg-slate-50/70 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-black text-sky-500 mb-8 border-b border-sky-100 pb-4">
          📝 ĐÁNH GIÁ CỦA TÔI
        </h1>

        {reviews.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
            <p className="text-xl text-gray-500 mb-6">Bạn chưa có đánh giá nào</p>
            <Link to="/my-orders" className="bg-sky-500 text-white font-bold py-3 px-8 rounded-full hover:bg-sky-600 transition">
              Xem đơn hàng để đánh giá
            </Link>
          </div>
        ) : (
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-sky-50">
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review._id} className="flex flex-col sm:flex-row gap-4 p-4 border-b border-gray-100 last:border-b-0">
                  <Link to={`/product/${review.product._id}`} className="flex-shrink-0 mx-auto sm:mx-0"><img src={`${getImageUrl(review.product.image)}`} alt={review.product.name} className="w-24 h-24 object-cover rounded-lg border" /></Link>
                  <div className="flex-1 text-center sm:text-left">
                    <Link to={`/product/${review.product._id}`}><h4 className="font-bold text-gray-800 hover:text-sky-500 transition text-lg">{review.product.name}</h4></Link>
                    <div className="flex items-center justify-center sm:justify-start gap-2 my-1.5"><StarRating rating={review.rating} /><span className="text-sm font-bold text-yellow-500">({review.rating}.0)</span></div>
                    <p className="text-gray-600 text-sm italic bg-gray-50 p-3 rounded-lg">"{review.comment}"</p>
                    <p className="text-xs text-gray-400 mt-2 text-right">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              ))}
            </div>
            {pagination.totalPages > 1 && (
              <div className="mt-8 pt-6 flex justify-center items-center gap-4 border-t border-gray-100">
                <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50">Trước</button>
                <span className="text-sm font-bold text-gray-600">Trang {pagination.currentPage} / {pagination.totalPages}</span>
                <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50">Sau</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReviews;