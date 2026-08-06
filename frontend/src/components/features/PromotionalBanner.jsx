import React from 'react';
import { Link } from 'react-router-dom';

const PromotionalBanner = () => {
    return (
        <>
            <style>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-12px) rotate(1deg); }
                }
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-8px) rotate(-1deg); }
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.95); opacity: 1; }
                    50% { transform: scale(1); opacity: 0.8; }
                    100% { transform: scale(0.95); opacity: 1; }
                }
                @keyframes count-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                .shimmer-text {
                    background: linear-gradient(90deg, #fff 0%, #e0f2fe 25%, #fff 50%, #bae6fd 75%, #fff 100%);
                    background-size: 200% 100%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 4s ease-in-out infinite;
                }
            `}</style>

            <div className="relative w-full rounded-2xl overflow-hidden">
                {/* Gradient nền chính - tông ấm hơn, chuyên nghiệp */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-sky-900 to-slate-900"></div>
                
                {/* Pattern overlay tinh tế */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                }}></div>

                {/* Gradient orbs mềm mại */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-600/15 rounded-full blur-[80px]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-400/10 rounded-full blur-[60px]"></div>

                {/* Nội dung chính */}
                <div className="relative z-10 px-6 py-10 md:px-12 md:py-14 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    
                    {/* Cột trái: Text */}
                    <div className="flex-1 text-center md:text-left">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-5">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                            <span className="text-xs font-semibold text-sky-200 tracking-wider uppercase">Ưu đãi đang diễn ra</span>
                        </div>

                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
                            <span className="shimmer-text">Săn Voucher</span>
                            <br />
                            <span className="text-white">Giảm Giá Sốc</span>
                        </h2>

                        <p className="mt-4 text-base md:text-lg text-sky-200/80 max-w-md leading-relaxed">
                            Tiết kiệm hơn mỗi đơn hàng với hàng loạt mã giảm giá hấp dẫn. Số lượng có hạn!
                        </p>

                        <div className="mt-7 flex flex-col sm:flex-row items-center gap-3 md:justify-start justify-center">
                            <Link 
                                to="/promotions" 
                                className="group inline-flex items-center gap-2 bg-white text-slate-900 font-bold py-3 px-7 rounded-xl shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                            >
                                Xem ưu đãi
                                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                            <span className="text-sm text-sky-300/60 font-medium">Áp dụng tự động khi thanh toán</span>
                        </div>
                    </div>

                    {/* Cột phải: Visual card stack */}
                    <div className="hidden md:flex flex-shrink-0 items-center justify-center w-72 h-56 relative">
                        {/* Card phía sau */}
                        <div 
                            className="absolute w-56 h-32 bg-white/5 backdrop-blur border border-white/10 rounded-2xl"
                            style={{ animation: 'float-delayed 6s ease-in-out infinite', top: '20%', left: '16%', transform: 'rotate(-4deg)' }}
                        ></div>
                        
                        {/* Card chính giữa */}
                        <div 
                            className="absolute w-56 h-32 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 flex flex-col justify-between"
                            style={{ animation: 'float-slow 5s ease-in-out infinite', top: '12%', left: '8%' }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-sky-300 font-semibold tracking-widest uppercase">Voucher</p>
                                    <p className="text-2xl font-black text-white mt-0.5">50% OFF</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="w-2/3 h-full bg-gradient-to-r from-sky-400 to-cyan-300 rounded-full"></div>
                                </div>
                                <span className="text-[10px] text-sky-300/70 font-medium">67% đã dùng</span>
                            </div>
                        </div>

                        {/* Badge nhỏ floating */}
                        <div 
                            className="absolute top-0 right-0 bg-emerald-500/90 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg"
                            style={{ animation: 'count-pulse 3s ease-in-out infinite' }}
                        >
                            MỚI
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PromotionalBanner;