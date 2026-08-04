import React from 'react';
import { SERVER_URL , getImageUrl } from '../utils/axiosConfig';

const ProductModal = ({ product, onClose, onAddToCart }) => {
  if (!product) return null;

  // Ngăn chặn sự kiện click từ nội dung modal lan ra ngoài overlay
  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    // Lớp overlay bao phủ toàn màn hình
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
      onClick={onClose} // Bấm ra ngoài để đóng
    >
      {/* Nội dung của Modal */}
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl mx-auto transform transition-all scale-100 animate-fade-in-up flex flex-col md:flex-row overflow-hidden"
        onClick={handleModalContentClick}
      >
        {/* Cột trái: Hình ảnh */}
        <div className="w-full md:w-1/2 h-64 md:h-auto bg-gray-100 flex items-center justify-center p-4">
          <img 
            src={`${getImageUrl(product.image)}`} 
            alt={product.name} 
            className="max-w-full max-h-full object-contain rounded-2xl"
          />
        </div>

        {/* Cột phải: Thông tin chi tiết */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col">
          <h2 className="text-3xl font-black text-gray-800 mb-2">{product.name}</h2>
          <p className="text-gray-500 mb-4">{product.description || 'Món ăn thơm ngon, hấp dẫn đang chờ bạn thưởng thức.'}</p>
          
          <div className="mt-auto">
            <div className="flex items-baseline space-x-2 mb-6">
              <span className="text-4xl font-black text-sky-500">
                {product.price?.toLocaleString('vi-VN') || '0'}đ
              </span>
            </div>
            
            <button 
              onClick={() => onAddToCart(product)}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 rounded-xl transition duration-300 shadow-md text-lg"
            >
              + Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;