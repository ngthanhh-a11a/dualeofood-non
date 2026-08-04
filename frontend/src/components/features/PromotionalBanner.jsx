import React from 'react';
import { Link } from 'react-router-dom';

const PromotionalBanner = () => {
    return (
        <>
            {/* Style cho banner animations */}
            <style>{`
                @keyframes text-shine {
                    0% { background-position: 200% center; }
                    100% { background-position: -200% center; }
                }
                @keyframes glow {
                    0% { box-shadow: 0 0 20px rgba(56, 189, 248, 0.3), 0 0 40px rgba(56, 189, 248, 0.2); }
                    50% { box-shadow: 0 0 30px rgba(56, 189, 248, 0.5), 0 0 50px rgba(56, 189, 248, 0.3); }
                    100% { box-shadow: 0 0 20px rgba(56, 189, 248, 0.3), 0 0 40px rgba(56, 189, 248, 0.2); }
                }
                @keyframes card-float {
                    0% { transform: translateY(0px) rotateX(10deg) rotateY(-15deg); }
                    50% { transform: translateY(-20px) rotateX(10deg) rotateY(-15deg); }
                    100% { transform: translateY(0px) rotateX(10deg) rotateY(-15deg); }
                }
                .animate-text-shine { background-size: 200% auto; animation: text-shine 3s linear infinite; }
                .animate-glow { animation: glow 5s ease-in-out infinite; }
                .animate-card-float { animation: card-float 8s ease-in-out infinite; }
            `}</style>

            {/* --- BANNER KHUYẾN MÃI NÂNG CẤP --- */}
            <div className="relative w-full bg-gradient-to-br from-sky-600 to-blue-700 rounded-3xl p-8 md:p-12 overflow-hidden animate-glow group">
                {/* Lớp nền hiệu ứng */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/az-subtle.png')] opacity-20"></div>
                <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-gradient-to-tr from-sky-500/50 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-bl from-blue-500/50 to-transparent rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-white text-center md:text-left">
                        <span className="inline-block bg-white/20 text-white text-sm font-bold px-4 py-1 rounded-full mb-4">DEAL GIỜ VÀNG</span>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                            <span className="block animate-text-shine bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-white">SĂN VOUCHER</span>
                            <span className="block">GIÁ SỐC</span>
                        </h2>
                        <p className="mt-4 text-lg md:text-xl font-medium text-sky-100 max-w-lg">Giảm giá cực mạnh, số lượng có hạn. Đừng bỏ lỡ cơ hội thưởng thức món ngon với giá hời!</p>
                        <Link to="/promotions" className="mt-8 inline-block bg-white text-sky-600 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-blue-100 transition-all duration-300 transform hover:scale-105 active:scale-95">Khám Phá Ngay</Link>
                    </div>
                    {/* Hình ảnh 3D giả lập */}
                    <div className="relative w-64 h-64 hidden md:block flex-shrink-0 [perspective:1000px]">
                        <div className="w-full h-full animate-card-float [transform-style:preserve-3d]">
                            <div className="absolute w-52 h-32 bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl p-4 transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 [transform:translateZ(40px)]"><p className="font-bold text-sky-600">VOUCHER 50%</p><div className="w-full h-2 bg-gray-200 rounded-full mt-2"><div className="w-3/4 h-2 bg-sky-500 rounded-full"></div></div></div>
                            <div className="absolute w-52 h-32 bg-white/50 backdrop-blur-sm rounded-xl shadow-lg p-4 transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 [transform:translateZ(20px)]"></div>
                            <div className="absolute w-52 h-32 bg-white/20 backdrop-blur-sm rounded-xl shadow-md p-4 transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"></div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PromotionalBanner;