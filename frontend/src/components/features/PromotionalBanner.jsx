import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PromotionalBanner = ({ onApplyCode }) => {
    const [copiedCode, setCopiedCode] = useState(null);
    const [activeTicketIndex, setActiveTicketIndex] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();

    // Danh sách 3 tấm vé thiết kế chuẩn xác theo ảnh mẫu thực tế
    const tickets = [
        {
            id: 'ticket-1',
            code: 'DUALEO50',
            stubColor: 'bg-amber-400 text-slate-900',
            stubTag: 'BIG SALE',
            stubSub: 'ƯU ĐÃI KHỦNG',
            hasSilverFoil: true,
            discountNumber: '50',
            discountUnit: '%',
            discountBadge: 'OFF',
            title: 'SIÊU SALE ĐẠI TIỆC',
            terms: 'Giảm tối đa 100.000đ cho đơn từ 199.000đ. Áp dụng toàn menu.',
            minOrder: 'Đơn từ 199K',
            expiry: 'HSD: 30/09/2026',
            type: 'barcode',
            accentColor: 'text-amber-500'
        },
        {
            id: 'ticket-2',
            code: 'CHAOBAN',
            stubColor: 'bg-sky-500 text-white',
            stubTag: 'VOUCHER',
            stubSub: 'QUÀ BẠN MỚI',
            hasSilverFoil: false,
            discountNumber: '30K',
            discountUnit: '',
            discountBadge: 'GIẢM',
            title: 'CHÀO BẠN MỚI',
            terms: 'Giảm 30.000đ cho đơn hàng đầu tiên từ 99.000đ tại DualeoFood.',
            minOrder: 'Đơn từ 99K',
            expiry: 'HSD: 15 ngày',
            type: 'qrcode',
            accentColor: 'text-sky-600'
        },
        {
            id: 'ticket-3',
            code: 'FREESHIP',
            stubColor: 'bg-emerald-500 text-white',
            stubTag: 'FREESHIP',
            stubSub: 'GIAO TỐC HÀNH',
            hasSilverFoil: true,
            discountNumber: '0',
            discountUnit: 'Đ',
            discountBadge: 'SHIP',
            title: 'MIỄN PHÍ GIAO HÀNG',
            terms: 'Freeship mọi đơn hàng trong bán kính 7km. Giao nhanh 30 phút.',
            minOrder: 'Đơn từ 0Đ',
            expiry: 'HSD: Hôm nay',
            type: 'barcode',
            accentColor: 'text-emerald-600'
        }
    ];

    const currentTicket = tickets[activeTicketIndex];

    // Xử lý sao chép mã với âm thanh và toast
    const handleCopy = (code, desc) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);

        try {
            const audio = new Audio('/ting.mp3');
            audio.volume = 0.6;
            audio.play().catch(() => {});
        } catch (e) {}

        toast.success(
            <div className="flex items-center gap-2">
                <span className="text-xl">🎟️</span>
                <div>
                    <p className="font-bold text-slate-800">Đã chép mã: <span className="font-mono text-sky-600 font-black">{code}</span></p>
                    <p className="text-xs text-slate-500">{desc} - Áp dụng ngay khi đặt món!</p>
                </div>
            </div>,
            { duration: 3000 }
        );

        if (onApplyCode) {
            onApplyCode(code);
        }

        setTimeout(() => {
            setCopiedCode((prev) => (prev === code ? null : prev));
        }, 3000);
    };

    // Cuộn xuống danh sách mã mượt mà
    const handleScrollToPromotions = (e) => {
        e.preventDefault();
        const el = document.getElementById('promotions-list');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        } else if (location.pathname !== '/promotions') {
            navigate('/promotions#promotions-list');
        }
    };

    return (
        <section className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 shadow-xl border border-sky-400/40 text-white">
            
            {/* Họa tiết trang trí nền nhẹ nhàng tông xanh */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-700/30 rounded-full blur-2xl pointer-events-none translate-y-1/3 -translate-x-1/4"></div>

            <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                    
                    {/* ===== CỘT TRÁI: THÔNG ĐIỆP & NÚT ĐIỀU HƯỚNG ===== */}
                    <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
                        
                        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 px-4 py-1.5 rounded-full shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse"></span>
                            <span className="text-xs font-bold tracking-wider uppercase text-sky-100">
                                Ưu Đãi Độc Quyền DualeoFood
                            </span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
                            Ăn Ngon Miệng, <br />
                            <span className="text-amber-300">Giá Cực Nhẹ Tênh</span>
                        </h2>

                        <p className="text-sky-100 text-sm sm:text-base max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
                            Chạm vào các tấm vé voucher bên cạnh để lấy mã giảm giá và áp dụng ngay vào đơn hàng của bạn. Số lượng mã có hạn mỗi ngày!
                        </p>

                        {/* Nút hành động */}
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                            <Link 
                                to="/menu"
                                className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-black/10 hover:shadow-black/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all text-sm sm:text-base"
                            >
                                <span>Đặt Món Dùng Mã</span>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>

                            <button 
                                onClick={handleScrollToPromotions}
                                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3.5 rounded-2xl border border-white/20 backdrop-blur-sm hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm"
                            >
                                <span>Xem toàn bộ mã</span>
                                <svg className="w-4 h-4 text-sky-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* ===== CỘT PHẢI: THẺ VOUCHER CHÂN THỰC THEO ẢNH MẪU ===== */}
                    <div className="lg:col-span-6 flex flex-col items-center">
                        
                        {/* Tab chuyển đổi giữa các mẫu vé */}
                        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/20 backdrop-blur-md border border-white/15 mb-5 shadow-inner">
                            {tickets.map((t, idx) => (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTicketIndex(idx)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                                        activeTicketIndex === idx
                                            ? 'bg-white text-slate-900 shadow-md scale-102'
                                            : 'text-sky-100 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {t.stubTag} {t.discountNumber}{t.discountUnit}
                                </button>
                            ))}
                        </div>

                        {/* TẤM VÉ CHÂN THỰC (REALISTIC TICKET) */}
                        <div className="w-full max-w-[440px] relative transition-transform duration-300 hover:scale-[1.02]">
                            
                            {/* Khối vé vật lý */}
                            <div className="relative flex rounded-2xl overflow-hidden shadow-2xl shadow-blue-950/40 border border-white/20">
                                
                                {/* ---------------- PHẦN CUỐNG VÉ MÀU (STUB) BÊN TRÁI ---------------- */}
                                <div className={`relative w-[34%] ${currentTicket.stubColor} p-4 sm:p-5 flex flex-col justify-between items-center text-center select-none overflow-hidden`}>
                                    
                                    {/* Mép răng cưa đục lỗ (Scalloped cutouts) bên cạnh ngoài cùng */}
                                    <div className="absolute -left-2 top-0 bottom-0 flex flex-col justify-between py-1 pointer-events-none">
                                        {[...Array(7)].map((_, i) => (
                                            <div key={i} className="w-3.5 h-3.5 rounded-full bg-sky-600 shadow-inner -translate-x-1/2"></div>
                                        ))}
                                    </div>

                                    {/* Tiêu đề cuống vé */}
                                    <div className="pt-1">
                                        <p className="text-[10px] font-black tracking-widest uppercase opacity-85">{currentTicket.stubSub}</p>
                                        <p className="text-xl sm:text-2xl font-black tracking-tight leading-none mt-1">{currentTicket.stubTag}</p>
                                    </div>

                                    {/* Dải kim loại ánh bạc (Silver Holographic Foil Bar) theo ảnh mẫu */}
                                    {currentTicket.hasSilverFoil ? (
                                        <div className="w-full my-3 py-1 px-1.5 rounded bg-gradient-to-r from-slate-300 via-white to-slate-400 border border-slate-300/80 shadow-inner flex items-center justify-center">
                                            <span className="text-[9px] font-mono font-bold text-slate-600 tracking-wider">DUALEO SECURE</span>
                                        </div>
                                    ) : (
                                        <div className="w-full my-3 py-1 px-1.5 rounded bg-white/20 border border-white/30 text-[9px] font-bold text-white tracking-widest">
                                            OFFICIAL
                                        </div>
                                    )}

                                    {/* Thông tin chân cuống */}
                                    <span className="text-[10px] font-bold opacity-75 font-mono">
                                        {currentTicket.minOrder}
                                    </span>
                                </div>

                                {/* ---------------- ĐƯỜNG PHÂN CÁCH CÓ VẾT KHUYẾT BÁN NGUYỆT (TICKET NOTCHES) ---------------- */}
                                <div className="relative w-0 flex-shrink-0 z-20">
                                    {/* Lỗ khuyết bán nguyệt trên đỉnh */}
                                    <div className="absolute -top-3 left-0 w-6 h-6 rounded-full bg-sky-600 -translate-x-1/2 shadow-inner border border-sky-700/40"></div>
                                    {/* Đường nét đứt đục lỗ xé vé (Perforated line) */}
                                    <div className="absolute top-3 bottom-3 left-0 border-r-2 border-dashed border-slate-300 -translate-x-1/2"></div>
                                    {/* Lỗ khuyết bán nguyệt dưới đáy */}
                                    <div className="absolute -bottom-3 left-0 w-6 h-6 rounded-full bg-sky-600 -translate-x-1/2 shadow-inner border border-sky-700/40"></div>
                                </div>

                                {/* ---------------- PHẦN THÂN VÉ MÀU TRẮNG (BODY) BÊN PHẢI ---------------- */}
                                <div className="relative flex-1 bg-white text-slate-800 p-4 sm:p-5 flex flex-col justify-between select-none">
                                    
                                    {/* Mép răng cưa đục lỗ bên cạnh ngoài cùng bên phải */}
                                    <div className="absolute -right-2 top-0 bottom-0 flex flex-col justify-between py-1 pointer-events-none">
                                        {[...Array(7)].map((_, i) => (
                                            <div key={i} className="w-3.5 h-3.5 rounded-full bg-sky-600 shadow-inner translate-x-1/2"></div>
                                        ))}
                                    </div>

                                    {/* Dòng 1: Mức giảm giá to rõ như ảnh mẫu */}
                                    <div className="flex items-start justify-between gap-2 pl-2">
                                        <div>
                                            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                                {currentTicket.title}
                                            </span>
                                            <div className="flex items-baseline gap-1 mt-0.5">
                                                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
                                                    {currentTicket.discountNumber}
                                                    {currentTicket.discountUnit}
                                                </span>
                                                <span className="text-xs sm:text-sm font-black text-rose-500 uppercase">
                                                    {currentTicket.discountBadge}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Nút bấm chép mã nhanh */}
                                        <button
                                            onClick={() => handleCopy(currentTicket.code, currentTicket.title)}
                                            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all duration-200 active:scale-95 shadow-sm flex items-center gap-1.5 ${
                                                copiedCode === currentTicket.code
                                                    ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                                                    : 'bg-sky-500 hover:bg-sky-600 text-white'
                                            }`}
                                        >
                                            {copiedCode === currentTicket.code ? (
                                                <>
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <span>ĐÃ CHÉP!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                    <span>CHÉP MÃ</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Dòng 2: Điều kiện áp dụng */}
                                    <p className="text-[11px] text-slate-500 mt-2 pl-2 line-clamp-1 leading-snug">
                                        {currentTicket.terms}
                                    </p>

                                    {/* Dòng 3: Khối Barcode hoặc QR Code thực tế kèm Mã code */}
                                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between pl-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Mã:</span>
                                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-xs font-black text-slate-800 tracking-wider">
                                                {currentTicket.code}
                                            </span>
                                        </div>

                                        {/* Họa tiết QR Code hoặc Barcode như ảnh mẫu */}
                                        {currentTicket.type === 'qrcode' ? (
                                            <div className="w-8 h-8 rounded border border-slate-300 p-0.5 flex flex-col justify-between bg-slate-50">
                                                <div className="flex justify-between">
                                                    <div className="w-2 h-2 bg-slate-800"></div>
                                                    <div className="w-2 h-2 bg-slate-800"></div>
                                                </div>
                                                <div className="flex justify-between items-center px-1">
                                                    <div className="w-1.5 h-1.5 bg-slate-800"></div>
                                                </div>
                                                <div className="flex justify-between">
                                                    <div className="w-2 h-2 bg-slate-800"></div>
                                                    <div className="w-1 h-1 bg-slate-800"></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-end gap-[1.5px] h-6 opacity-75">
                                                <div className="w-[1.5px] h-full bg-slate-800"></div>
                                                <div className="w-[3px] h-full bg-slate-800"></div>
                                                <div className="w-[1px] h-full bg-slate-800"></div>
                                                <div className="w-[2.5px] h-full bg-slate-800"></div>
                                                <div className="w-[1px] h-full bg-slate-800"></div>
                                                <div className="w-[3px] h-full bg-slate-800"></div>
                                                <div className="w-[1.5px] h-full bg-slate-800"></div>
                                                <div className="w-[1px] h-full bg-slate-800"></div>
                                                <div className="w-[2px] h-full bg-slate-800"></div>
                                            </div>
                                        )}
                                    </div>

                                </div>

                            </div>

                            {/* Gợi ý tương tác */}
                            <p className="text-[11px] text-center text-sky-100/80 mt-2 font-medium">
                                💡 Nhấp vào "CHÉP MÃ" để tự động lưu vào bộ nhớ tạm
                            </p>
                        </div>

                    </div>

                </div>
            </div>

            {/* Dải cam kết uy tín chân thực */}
            <div className="px-6 py-2.5 bg-black/15 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-sky-100">
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Món tươi ngon 100% chế biến trong ngày
                </span>
                <span className="hidden sm:inline">⚡ Giao hàng nhanh 30 phút</span>
                <span>🛡️ Hoàn tiền nếu đơn hàng không đúng cam kết</span>
            </div>

        </section>
    );
};

export default PromotionalBanner;