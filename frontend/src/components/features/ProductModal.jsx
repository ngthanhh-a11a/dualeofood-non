import React, { useState, useEffect, useMemo } from 'react';
import { getImageUrl } from '../../utils/axiosConfig';
import { FiX, FiPlus, FiMinus, FiCheck, FiShoppingBag, FiEdit3 } from 'react-icons/fi';

const ProductModal = ({ product, isOpen = true, onClose, onAddToCart }) => {
  if (!product || !isOpen) return null;

  const sizes = useMemo(() => Array.isArray(product.sizes) ? product.sizes : [], [product.sizes]);
  const toppings = useMemo(() => Array.isArray(product.toppings) ? product.toppings : [], [product.toppings]);

  // State quản lý lựa chọn
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Khởi tạo lựa chọn mặc định khi mở modal cho sản phẩm
  useEffect(() => {
    if (sizes.length > 0) {
      setSelectedSize(sizes[0]);
    } else {
      setSelectedSize(null);
    }
    setSelectedToppings([]);
    setNote('');
    setQuantity(1);
  }, [product, sizes]);

  // Xử lý toggle topping
  const handleToggleTopping = (topping) => {
    setSelectedToppings(prev => {
      const exists = prev.some(t => t.name === topping.name);
      if (exists) {
        return prev.filter(t => t.name !== topping.name);
      } else {
        return [...prev, topping];
      }
    });
  };

  // Tính đơn giá 1 phần ăn
  const unitPrice = useMemo(() => {
    const base = Number(product.price) || 0;
    const sizeOffset = Number(selectedSize?.priceOffset) || 0;
    const toppingsTotal = selectedToppings.reduce((acc, t) => acc + (Number(t.price) || 0), 0);
    return base + sizeOffset + toppingsTotal;
  }, [product.price, selectedSize, selectedToppings]);

  // Tổng tiền cho toàn bộ số lượng
  const totalPrice = unitPrice * quantity;

  // Xử lý thêm vào giỏ hàng
  const handleConfirmAddToCart = (e) => {
    if (e) e.stopPropagation();

    const itemPayload = {
      productId: product._id,
      id: product._id,
      name: product.name,
      basePrice: product.price,
      price: unitPrice,
      image: product.image,
      size: selectedSize,
      toppings: selectedToppings,
      note: note.trim(),
      quantity: quantity
    };

    onAddToCart(itemPayload, e);
    if (onClose) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng modal tròn góc trên bên phải */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
          title="Đóng"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* PHẦN CUỘN NỘI DUNG (Header ảnh + Tùy chọn) */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
          {/* Header Món ăn */}
          <div className="flex flex-col sm:flex-row gap-5 p-5 sm:p-6 bg-gradient-to-b from-sky-50/50 to-white">
            <div className="w-full sm:w-44 h-44 sm:h-44 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/80 shadow-xs flex items-center justify-center">
              {product.image ? (
                <img 
                  src={getImageUrl(product.image)} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-6xl">🍔</span>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-100/70 px-2.5 py-1 rounded-full w-fit mb-2">
                {product.category?.name || 'Món ngon Dualeo'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 leading-snug">
                {product.name}
              </h2>
              {product.description && (
                <p className="text-xs sm:text-sm text-slate-500 mt-2 line-clamp-3">
                  {product.description}
                </p>
              )}
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-xs font-bold text-slate-400">Giá gốc:</span>
                <span className="text-lg sm:text-xl font-black text-sky-600">
                  {(product.price || 0).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
          </div>

          {/* CHỌN KÍCH CỠ (SIZE) */}
          {sizes.length > 0 && (
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                  <span>Kích thước (Size)</span>
                  <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                    Bắt buộc chọn 1
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sizes.map((s, idx) => {
                  const isSelected = selectedSize?.name === s.name;
                  const offset = Number(s.priceOffset) || 0;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                        isSelected 
                          ? 'border-sky-500 bg-sky-50/50 shadow-xs' 
                          : 'border-slate-200/80 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className={`font-bold text-sm ${isSelected ? 'text-sky-900' : 'text-slate-700'}`}>
                          {s.name}
                        </span>
                      </div>
                      <span className={`text-xs font-extrabold ${isSelected ? 'text-sky-600' : 'text-slate-500'}`}>
                        {offset > 0 ? `+${offset.toLocaleString('vi-VN')}đ` : 'Mặc định'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CHỌN TOPPING */}
          {toppings.length > 0 && (
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                  <span>Topping thêm</span>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    Tùy chọn
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {toppings.map((t, idx) => {
                  const isChecked = selectedToppings.some(item => item.name === t.name);
                  const price = Number(t.price) || 0;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleTopping(t)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                        isChecked 
                          ? 'border-emerald-500 bg-emerald-50/40 shadow-xs' 
                          : 'border-slate-200/80 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                          isChecked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <FiCheck className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className={`font-bold text-sm ${isChecked ? 'text-emerald-900' : 'text-slate-700'}`}>
                          {t.name}
                        </span>
                      </div>
                      <span className={`text-xs font-black ${isChecked ? 'text-emerald-600' : 'text-slate-500'}`}>
                        +{price.toLocaleString('vi-VN')}đ
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* GHI CHÚ CHO BẾP */}
          <div className="p-5 sm:p-6">
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-2 mb-2">
              <FiEdit3 className="text-slate-400" />
              <span>Ghi chú riêng cho món</span>
            </h3>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Không cay, nhiều sốt, để đá riêng..."
              maxLength={100}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 transition"
            />
          </div>
        </div>

        {/* FOOTER ĐIỀU KHIỂN SỐ LƯỢNG & NÚT THÊM */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 shadow-lg">
          {/* Bộ chọn số lượng */}
          <div className="flex items-center justify-between w-full sm:w-auto bg-slate-100 rounded-2xl p-1 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-10 h-10 rounded-xl bg-white text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-white flex items-center justify-center transition shadow-xs cursor-pointer"
            >
              <FiMinus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center font-black text-slate-800 text-base">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(q => q + 1)}
              className="w-10 h-10 rounded-xl bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center transition shadow-xs cursor-pointer"
            >
              <FiPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Nút bấm Thêm vào giỏ */}
          <button
            type="button"
            onClick={handleConfirmAddToCart}
            className="w-full flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-between shadow-lg shadow-sky-500/25 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FiShoppingBag className="w-5 h-5" />
              <span>Thêm vào giỏ hàng</span>
            </span>
            <span className="font-black text-base sm:text-lg">
              {totalPrice.toLocaleString('vi-VN')}đ
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;