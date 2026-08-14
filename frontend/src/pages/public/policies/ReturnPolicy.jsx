import React from 'react';
import { FiRefreshCcw, FiClock, FiAlertTriangle, FiPhoneCall } from 'react-icons/fi';

const ReturnPolicy = () => {
    return (
        <div className="bg-slate-50 min-h-screen pb-20 font-sans text-slate-800">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-sky-500 to-sky-700 py-20 px-4 text-center">
                <div className="max-w-3xl mx-auto animate-fade-in-up">
                    <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/30">
                        <FiRefreshCcw className="text-white text-4xl" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-md">
                        Chính Sách Đổi Trả
                    </h1>
                    <p className="text-sky-100 text-lg md:text-xl font-medium">
                        Quy định về việc đổi trả và hoàn tiền để đảm bảo quyền lợi khách hàng.
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
                                <FiAlertTriangle className="text-3xl text-sky-500 group-hover:text-white transition-colors duration-300" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-3">1. Điều kiện áp dụng đổi trả</h2>
                                <p className="text-slate-600 leading-relaxed text-lg mb-3">
                                    Khách hàng được quyền yêu cầu đổi trả món ăn hoặc hoàn tiền trong các trường hợp sau:
                                </p>
                                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                                    <li>Món ăn giao không đúng với đơn đặt hàng (sai món, thiếu món).</li>
                                    <li>Món ăn bị hư hỏng, ôi thiu hoặc có dị vật bên trong.</li>
                                    <li>Đóng gói bị rách vỡ nghiêm trọng ảnh hưởng đến chất lượng món ăn.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Section 2 */}
                        <div className="flex flex-col md:flex-row gap-6 items-start group">
                            <div className="bg-sky-50 p-4 rounded-2xl shrink-0 group-hover:bg-sky-500 transition-colors duration-300">
                                <FiClock className="text-3xl text-sky-500 group-hover:text-white transition-colors duration-300" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-3">2. Thời gian giải quyết</h2>
                                <p className="text-slate-600 leading-relaxed text-lg">
                                    Vì tính chất đặc thù của ngành ẩm thực, mọi yêu cầu đổi trả cần được phản hồi <strong>trong vòng 2 giờ</strong> kể từ thời điểm nhận hàng. Quá thời gian trên, chúng tôi xin phép từ chối giải quyết để đảm bảo tính khách quan về nguyên nhân làm ảnh hưởng đến món ăn.
                                </p>
                            </div>
                        </div>

                        {/* Section 3 */}
                        <div className="flex flex-col md:flex-row gap-6 items-start group">
                            <div className="bg-sky-50 p-4 rounded-2xl shrink-0 group-hover:bg-sky-500 transition-colors duration-300">
                                <FiPhoneCall className="text-3xl text-sky-500 group-hover:text-white transition-colors duration-300" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-3">3. Quy trình đổi trả</h2>
                                <ol className="list-decimal pl-5 space-y-2 text-slate-600 text-lg">
                                    <li>Khách hàng vui lòng chụp lại hình ảnh hoặc video rõ nét tình trạng món ăn và giữ nguyên hiện trạng.</li>
                                    <li>Liên hệ ngay với bộ phận CSKH qua số Hotline: <strong>0393.743.023</strong> hoặc qua tính năng nhắn tin trên website.</li>
                                    <li>Cung cấp mã đơn hàng và hình ảnh minh chứng.</li>
                                    <li>Chúng tôi sẽ tiến hành xác minh và gửi ngay đơn hàng thay thế hoặc hoàn tiền 100% theo phương thức thanh toán ban đầu (hoặc voucher giảm giá cho lần sau).</li>
                                </ol>
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

export default ReturnPolicy;
