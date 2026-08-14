import React from 'react';
import { FiShield, FiLock, FiEye, FiServer } from 'react-icons/fi';

const PrivacyPolicy = () => {
    return (
        <div className="bg-slate-50 min-h-screen pb-20 font-sans text-slate-800">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-sky-500 to-sky-700 py-20 px-4 text-center">
                <div className="max-w-3xl mx-auto animate-fade-in-up">
                    <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/30">
                        <FiShield className="text-white text-4xl" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-md">
                        Bảo Mật Thông Tin
                    </h1>
                    <p className="text-sky-100 text-lg md:text-xl font-medium">
                        Cam kết tuyệt đối bảo vệ dữ liệu cá nhân của bạn.
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
                                <FiEye className="text-3xl text-sky-500 group-hover:text-white transition-colors duration-300" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-3">1. Mục đích thu thập thông tin</h2>
                                <p className="text-slate-600 leading-relaxed text-lg">
                                    Chúng tôi thu thập thông tin cá nhân của bạn (bao gồm họ tên, số điện thoại, địa chỉ giao hàng) nhằm mục đích:
                                </p>
                                <ul className="mt-3 list-disc pl-5 space-y-2 text-slate-600">
                                    <li>Xử lý và giao đơn hàng nhanh chóng, chính xác.</li>
                                    <li>Cung cấp dịch vụ hỗ trợ khách hàng và giải quyết khiếu nại.</li>
                                    <li>Gửi thông báo về tình trạng đơn hàng và các chương trình khuyến mãi (nếu bạn đồng ý).</li>
                                </ul>
                            </div>
                        </div>

                        {/* Section 2 */}
                        <div className="flex flex-col md:flex-row gap-6 items-start group">
                            <div className="bg-sky-50 p-4 rounded-2xl shrink-0 group-hover:bg-sky-500 transition-colors duration-300">
                                <FiLock className="text-3xl text-sky-500 group-hover:text-white transition-colors duration-300" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-3">2. Cam kết bảo mật</h2>
                                <p className="text-slate-600 leading-relaxed text-lg">
                                    Mọi thông tin cá nhân của bạn đều được chúng tôi bảo mật tuyệt đối. Chúng tôi cam kết <strong>KHÔNG</strong> bán, chia sẻ hay trao đổi thông tin khách hàng cho bất kỳ bên thứ ba nào vì mục đích thương mại.
                                    Việc chia sẻ thông tin chỉ được thực hiện trong trường hợp cần thiết (như cho đối tác vận chuyển) hoặc khi có yêu cầu từ cơ quan pháp luật có thẩm quyền.
                                </p>
                            </div>
                        </div>

                        {/* Section 3 */}
                        <div className="flex flex-col md:flex-row gap-6 items-start group">
                            <div className="bg-sky-50 p-4 rounded-2xl shrink-0 group-hover:bg-sky-500 transition-colors duration-300">
                                <FiServer className="text-3xl text-sky-500 group-hover:text-white transition-colors duration-300" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-3">3. Lưu trữ và bảo vệ dữ liệu</h2>
                                <p className="text-slate-600 leading-relaxed text-lg">
                                    Dữ liệu của khách hàng được lưu trữ an toàn trên máy chủ nội bộ. Chúng tôi sử dụng các biện pháp bảo mật công nghệ tiên tiến như mã hóa SSL để chống lại việc truy cập trái phép, mất mát hoặc đánh cắp dữ liệu.
                                </p>
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

export default PrivacyPolicy;
