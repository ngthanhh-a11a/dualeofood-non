import React from 'react';
import { Link } from 'react-router-dom';

const PromotionalBanner = () => {
    return (
        <div className="relative w-full rounded-2xl overflow-hidden bg-sky-50 border border-sky-100">
            {/* Soft decorative elements instead of glowing orbs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-200/40 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-200/40 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl"></div>

            {/* Content */}
            <div className="relative z-10 px-6 py-10 md:px-12 md:py-12 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                
                {/* Left: Text */}
                <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-600 border border-sky-200 rounded-full px-4 py-1.5 mb-4">
                        <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></span>
                        <span className="text-xs font-bold tracking-wider uppercase">Chương trình khuyến mãi</span>
                    </div>

                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 leading-tight tracking-tight">
                        Ăn Ngon Miệng, <br />
                        <span className="text-sky-500">Giá Nhẹ Tênh</span>
                    </h2>

                    <p className="mt-4 text-base md:text-lg text-slate-600 max-w-md mx-auto md:mx-0">
                        Áp dụng ngay các mã giảm giá bên dưới để tiết kiệm hơn cho bữa ăn của bạn. Số lượng có hạn!
                    </p>

                    <div className="mt-6">
                        <Link 
                            to="/menu" 
                            className="inline-flex items-center justify-center bg-sky-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-sky-600 transition-colors shadow-sm hover:shadow-md active:scale-95"
                        >
                            Đặt Món Ngay
                        </Link>
                    </div>
                </div>

                {/* Right: Simple illustration or visual */}
                <div className="hidden md:flex flex-shrink-0 items-center justify-center w-72 h-56 relative">
                     {/* Simplified Card Visual */}
                     <div className="absolute w-56 h-32 bg-white rounded-xl shadow-lg border border-slate-100 p-5 rotate-3 hover:rotate-0 transition-transform duration-300">
                        <div className="flex justify-between items-start border-b border-dashed border-slate-200 pb-3 mb-3">
                            <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase">Voucher</p>
                                <p className="text-2xl font-black text-sky-500">Giảm 20%</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center">
                                <span className="text-sky-400 text-sm">🎫</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-sm text-slate-500">
                            <span>Mã: <strong className="text-slate-700 font-mono">NGON20</strong></span>
                        </div>
                     </div>
                     
                     <div className="absolute w-56 h-32 bg-slate-50 rounded-xl shadow-sm border border-slate-200 -rotate-6 -z-10 mt-6 -ml-6"></div>
                </div>
            </div>
        </div>
    );
};

export default PromotionalBanner;