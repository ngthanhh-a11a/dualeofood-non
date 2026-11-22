import React from 'react';
import { FiX, FiShare, FiPlusSquare, FiCheckCircle } from 'react-icons/fi';

const IOSInstallModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100 animate-scale-up">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
        >
          <FiX size={18} />
        </button>

        {/* Header */}
        <div className="text-center mb-6 pt-2">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-sky-50 flex items-center justify-center text-3xl shadow-xs border border-sky-100">
            🍏
          </div>
          <h3 className="text-xl font-black text-slate-800">
            Cài Đặt Trên iPhone / iPad
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Chỉ với 2 bước cực kỳ đơn giản trên Safari để đưa DualeoFood ra màn hình chính:
          </p>
        </div>

        {/* Các bước hướng dẫn */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black text-sm shrink-0">
              1
            </div>
            <div className="text-xs text-slate-700">
              <p className="font-bold text-slate-800 mb-0.5 flex items-center gap-1.5">
                Bấm nút Chia Sẻ <FiShare className="text-sky-600 inline" size={14} />
              </p>
              <p className="text-slate-500 leading-relaxed">
                Nhìn xuống thanh công cụ dưới cùng của trình duyệt Safari và bấm biểu tượng <strong>Chia sẻ (Share)</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black text-sm shrink-0">
              2
            </div>
            <div className="text-xs text-slate-700">
              <p className="font-bold text-slate-800 mb-0.5 flex items-center gap-1.5">
                Chọn "Thêm vào MH chính" <FiPlusSquare className="text-sky-600 inline" size={14} />
              </p>
              <p className="text-slate-500 leading-relaxed">
                Cuộn danh sách menu xuống và nhấn chọn dòng <strong>"Thêm vào Màn hình chính"</strong> (Add to Home Screen).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800">
            <FiCheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={18} />
            <p className="text-xs leading-relaxed">
              Bấm <strong>"Thêm" (Add)</strong> ở góc trên bên phải màn hình để hoàn tất. Logo DualeoFood sẽ xuất hiện ngay ngoài màn hình chính của bạn!
            </p>
          </div>
        </div>

        {/* Nút bấm Đã hiểu */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold text-sm rounded-xl transition shadow-md shadow-sky-500/20 cursor-pointer"
        >
          Đã hiểu, tôi sẽ làm ngay
        </button>
      </div>
    </div>
  );
};

export default IOSInstallModal;
