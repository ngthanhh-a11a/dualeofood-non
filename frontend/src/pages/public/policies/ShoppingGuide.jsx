import React from 'react';
import { FiShoppingCart, FiSearch, FiCheckSquare, FiTruck } from 'react-icons/fi';

const ShoppingGuide = () => {
    return (
        <div className="bg-slate-50 min-h-screen pb-20 font-sans text-slate-800">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-sky-500 to-sky-700 py-20 px-4 text-center">
                <div className="max-w-3xl mx-auto animate-fade-in-up">
                    <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/30">
                        <FiShoppingCart className="text-white text-4xl" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-md">
                        Hướng Dẫn Mua Hàng
                    </h1>
                    <p className="text-sky-100 text-lg md:text-xl font-medium">
                        Chỉ với 4 bước đơn giản, bạn sẽ có ngay bữa ăn ngon miệng.
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-10">
                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100">
                    
                    <div className="grid gap-12 relative before:absolute before:inset-0 before:ml-10 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-sky-400 before:to-transparent">
                        
                        {/* Step 1 */}
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-20 h-20 rounded-full border-4 border-white bg-sky-500 text-white shadow-xl md:order-1 group-hover:scale-110 transition-transform duration-300 z-10">
                                <FiSearch className="text-3xl" />
                            </div>
                            <div className="w-[calc(100%-6rem)] md:w-[calc(50%-4rem)] bg-sky-50 p-6 rounded-2xl shadow-sm border border-sky-100 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-sky-600 text-xl">Bước 1: Chọn Món Ăn</h3>
                                </div>
                                <p className="text-slate-600">
                                    Truy cập vào Thực đơn hoặc sử dụng thanh tìm kiếm để tìm những món ăn yêu thích của bạn. Bạn có thể xem chi tiết hình ảnh, thành phần và đánh giá của món ăn.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-20 h-20 rounded-full border-4 border-white bg-sky-500 text-white shadow-xl md:order-1 group-hover:scale-110 transition-transform duration-300 z-10">
                                <FiShoppingCart className="text-3xl" />
                            </div>
                            <div className="w-[calc(100%-6rem)] md:w-[calc(50%-4rem)] bg-sky-50 p-6 rounded-2xl shadow-sm border border-sky-100 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-sky-600 text-xl">Bước 2: Thêm Vào Giỏ Hàng</h3>
                                </div>
                                <p className="text-slate-600">
                                    Sau khi chọn được món ưng ý, hãy nhấn nút "Thêm vào giỏ hàng". Bạn có thể tùy chỉnh số lượng món ăn và tiếp tục mua sắm hoặc chuyển đến trang Thanh toán.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-20 h-20 rounded-full border-4 border-white bg-sky-500 text-white shadow-xl md:order-1 group-hover:scale-110 transition-transform duration-300 z-10">
                                <FiCheckSquare className="text-3xl" />
                            </div>
                            <div className="w-[calc(100%-6rem)] md:w-[calc(50%-4rem)] bg-sky-50 p-6 rounded-2xl shadow-sm border border-sky-100 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-sky-600 text-xl">Bước 3: Xác Nhận & Thanh Toán</h3>
                                </div>
                                <p className="text-slate-600">
                                    Tại trang thanh toán, điền thông tin địa chỉ giao hàng và chọn phương thức thanh toán (Tiền mặt hoặc Ví điện tử). Áp dụng mã giảm giá (nếu có) và xác nhận đặt hàng.
                                </p>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-20 h-20 rounded-full border-4 border-white bg-sky-500 text-white shadow-xl md:order-1 group-hover:scale-110 transition-transform duration-300 z-10">
                                <FiTruck className="text-3xl" />
                            </div>
                            <div className="w-[calc(100%-6rem)] md:w-[calc(50%-4rem)] bg-sky-50 p-6 rounded-2xl shadow-sm border border-sky-100 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-sky-600 text-xl">Bước 4: Nhận Hàng & Thưởng Thức</h3>
                                </div>
                                <p className="text-slate-600">
                                    Đơn hàng của bạn sẽ được tài xế của chúng tôi chuẩn bị và giao đến tận nơi nhanh chóng. Chúc bạn có một bữa ăn thật ngon miệng!
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
            `}</style>
        </div>
    );
};

export default ShoppingGuide;
