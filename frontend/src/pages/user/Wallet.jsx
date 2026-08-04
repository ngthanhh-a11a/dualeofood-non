import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Wallet = () => {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('available'); // 'available' or 'used'

    useEffect(() => {
        const fetchMyVouchers = async () => {
            setLoading(true);
            try {
                const res = await axios.get('/vouchers/my-vouchers');
                
                console.log("Dữ liệu Ví từ API:", res.data); // Bật F12 Console để xem nó là gì
                
                // Kiểm tra an toàn trước khi set state
                if (Array.isArray(res.data)) {
                    setVouchers(res.data);
                } else if (res.data && Array.isArray(res.data.data)) {
                    // Nếu Backend trả về dạng { success: true, data: [...] }
                    setVouchers(res.data.data);
                } else if (res.data && Array.isArray(res.data.vouchers)) {
                    setVouchers(res.data.vouchers);
                } else {
                    setVouchers([]); // Chống sập trang
                }
            } catch (error) {
                console.error("Lỗi khi tải ví voucher:", error);
                toast.error(error.response?.data?.message || "Không thể tải được ví voucher của bạn.");
                setVouchers([]); // Đảm bảo vouchers là mảng khi có lỗi
            } finally {
                setLoading(false);
            }
        };

        fetchMyVouchers();
    }, []);

    // Sửa lại dòng này để đảm bảo vouchers luôn là mảng
    const displayVouchers = (Array.isArray(vouchers) ? vouchers : []).filter(v => 
        activeTab === 'available' ? !v.isUsed : v.isUsed
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-black text-sky-600 mb-3 uppercase tracking-wide">🎟️ Kho Voucher Của Tôi</h1>
                <p className="text-gray-500 text-lg">Quản lý các mã giảm giá bạn đã lưu.</p>
            </div>

            <div className="flex justify-center border-b border-gray-200 mb-8">
                <button
                    onClick={() => setActiveTab('available')}
                    className={`px-6 py-3 font-bold text-lg transition-colors duration-300 ${activeTab === 'available' ? 'border-b-4 border-sky-500 text-sky-600' : 'text-gray-500 hover:text-sky-500'}`}
                >
                    Có thể dùng
                </button>
                <button
                    onClick={() => setActiveTab('used')}
                    className={`px-6 py-3 font-bold text-lg transition-colors duration-300 ${activeTab === 'used' ? 'border-b-4 border-red-500 text-red-600' : 'text-gray-500 hover:text-red-500'}`}
                >
                    Đã dùng / Hết hạn
                </button>
            </div>

            {displayVouchers.length === 0 ? (
                <div className="text-center text-gray-500 bg-gray-50 py-16 rounded-lg">
                    <p className="text-xl mb-4">
                        {activeTab === 'available' ? 'Bạn chưa có mã giảm giá nào.' : 'Bạn chưa sử dụng mã giảm giá nào.'}
                    </p>
                    <Link to="/promotions" className="bg-sky-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-sky-600 transition">
                        Săn Voucher ngay!
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayVouchers.map(({ _id, coupon, isUsed, usedAt }) => (
                        <div key={_id} className={`border rounded-2xl p-6 shadow-sm bg-white flex flex-col justify-between relative overflow-hidden group ${isUsed ? 'border-gray-200 bg-gray-50' : 'border-sky-100 hover:shadow-lg'}`}>
                            <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full -z-10 opacity-5 transition-opacity ${isUsed ? 'bg-gray-400' : 'bg-sky-500 group-hover:opacity-10'}`}></div>
                            
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`font-bold px-4 py-2 rounded-lg border inline-block uppercase tracking-wider text-sm shadow-sm ${isUsed ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-sky-50 text-sky-600 border-sky-200'}`}>
                                        {coupon?.code}
                                    </div>
                                </div>
                                <h3 className={`text-xl font-bold mb-2 ${isUsed ? 'text-gray-500' : 'text-gray-800'}`}>Ưu đãi {coupon?.code}</h3>
                                <p className={`mb-5 text-sm line-clamp-2 ${isUsed ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Giảm <span className={`font-bold ${isUsed ? 'text-gray-500' : 'text-sky-500'}`}>{coupon?.discountPercent}%</span> (tối đa <span className={`font-bold ${isUsed ? 'text-gray-500' : 'text-sky-500'}`}>{coupon?.maxDiscountAmount?.toLocaleString('vi-VN') || 0}đ</span>) cho đơn từ <span className="font-bold">{coupon?.minOrderValue?.toLocaleString('vi-VN') || 0}đ</span>.
                                </p>
                                <div className={`flex items-center text-xs font-medium mb-6 p-3 rounded-lg border ${isUsed ? 'bg-gray-100 border-gray-200 text-gray-500' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
                                    <span className="mr-2 text-lg">⏰</span> HSD: {coupon?.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                                </div>
                            </div>
                            {isUsed ? (<div className="mt-auto w-full text-center bg-gray-200 text-gray-500 font-bold py-3 px-4 rounded-xl">Đã sử dụng</div>) : (<Link to="/cart" className="mt-auto w-full text-center bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg">Dùng ngay</Link>)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Wallet;