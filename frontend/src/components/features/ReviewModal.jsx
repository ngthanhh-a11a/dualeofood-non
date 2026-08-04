import React, { useState } from 'react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { FiStar, FiX } from 'react-icons/fi';

const ReviewModal = ({ product, onClose, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Vui lòng chọn số sao đánh giá!');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`/products/${product._id}/reviews`, {
        rating,
        comment,
      });
      toast.success('Cảm ơn bạn đã gửi đánh giá!');
      onReviewSubmitted(product._id); // Báo cho component cha biết đã review xong
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gửi đánh giá thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-11/12 max-w-lg relative transform transition-all animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <FiX size={24} />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">Đánh giá sản phẩm</h2>
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <img src={product.image} alt={product.name} className="w-16 h-16 rounded-md object-cover" />
          <div>
            <h3 className="font-bold text-lg">{product.name}</h3>
            <p className="text-sm text-gray-500">Hãy chia sẻ cảm nhận của bạn nhé!</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Phần chọn sao */}
          <div>
            <label className="block text-gray-600 font-semibold mb-2">Chất lượng sản phẩm *</label>
            <div className="flex items-center gap-2 text-3xl">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  className={`cursor-pointer transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                />
              ))}
            </div>
          </div>

          {/* Phần bình luận */}
          <div>
            <label htmlFor="comment" className="block text-gray-600 font-semibold mb-2">
              Bình luận của bạn
            </label>
            <textarea
              id="comment"
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Sản phẩm rất tuyệt vời..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition"
            ></textarea>
          </div>

          {/* Nút gửi */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-md disabled:bg-gray-400"
          >
            {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </form>
      </div>
      <style>{`.animate-fade-in { animation: fade-in 0.3s ease-out forwards; } @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
};

export default ReviewModal;