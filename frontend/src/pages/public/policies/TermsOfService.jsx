import React from 'react';
import { FiFileText, FiCheckCircle, FiAlertCircle, FiGlobe } from 'react-icons/fi';

const TermsOfService = () => {
    return (
        <div className="bg-slate-50 min-h-screen pb-20 font-sans text-slate-800">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-sky-500 to-sky-700 py-20 px-4 text-center">
                <div className="max-w-3xl mx-auto animate-fade-in-up">
                    <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/30">
                        <FiFileText className="text-white text-4xl" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-md">
                        Điều Khoản Dịch Vụ
                    </h1>
                    <p className="text-sky-100 text-lg md:text-xl font-medium">
                        Vui lòng đọc kỹ các điều khoản trước khi sử dụng dịch vụ.
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-10">
                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100">
                    
                    <div className="grid gap-12">
                        {/* Section 1 */}
                        <div className="flex flex-col md:flex-row gap-6 items-start group">
                            <div className="bg-sky-50 p-4 rounded-2xl shrink-0 group-hover:bg-sky-500 transition-colors duration-300">
                                <FiCheckCircle className="text-3xl text-sky-500 group-hover:text-white transition-colors duration-300" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-3">1. Chấp nhận điều khoản</h2>
                                <p className="text-slate-600 leading-relaxed text-lg">
                                    Bằng việc truy cập và mua hàng trên website của chúng tôi, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản và điều kiện này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản, vui lòng không sử dụng dịch vụ của chúng tôi.
                                </p>
                            </div>
                        </div>

                        {/* Section 2 */}
                        <div className="flex flex-col md:flex-row gap-6 items-start group">
                            <div className="bg-sky-50 p-4 rounded-2xl shrink-0 group-hover:bg-sky-500 transition-colors duration-300">
                                <FiGlobe className="text-3xl text-sky-500 group-hover:text-white transition-colors duration-300" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-3">2. Quyền sở hữu trí tuệ</h2>
                                <p className="text-slate-600 leading-relaxed text-lg">
                                    Tất cả nội dung trên trang web này bao gồm văn bản, thiết kế, đồ họa, biểu tượng, hình ảnh đều là tài sản độc quyền của chúng tôi. Việc sao chép, phân phối hoặc sử dụng cho mục đích thương mại mà không có sự cho phép bằng văn bản đều bị nghiêm cấm.
                                </p>
                            </div>
                        </div>

                        {/* Section 3 */}
                        <div className="flex flex-col md:flex-row gap-6 items-start group">
                            <div className="bg-sky-50 p-4 rounded-2xl shrink-0 group-hover:bg-sky-500 transition-colors duration-300">
                                <FiAlertCircle className="text-3xl text-sky-500 group-hover:text-white transition-colors duration-300" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-3">3. Trách nhiệm của người dùng</h2>
                                <ul className="mt-3 list-disc pl-5 space-y-2 text-slate-600">
                                    <li>Bạn đồng ý cung cấp thông tin chính xác, cập nhật và đầy đủ trong quá trình mua hàng và thanh toán.</li>
                                    <li>Không sử dụng website vào mục đích lừa đảo, phá hoại hoặc vi phạm pháp luật.</li>
                                    <li>Mọi hành vi bình luận mang tính xúc phạm, thô tục trên hệ thống đều sẽ bị xóa mà không cần báo trước.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                        <p className="text-slate-500 italic">
                            Chính sách này có hiệu lực từ ngày 01/01/2026. Chúng tôi có quyền cập nhật chính sách mà không cần thông báo trước.
                        </p>
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

export default TermsOfService;
