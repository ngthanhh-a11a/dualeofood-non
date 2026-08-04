import React from 'react';
import { createPortal } from 'react-dom';

const OrderReceipt = ({ order }) => {
    if (!order) return null;

    // Helper tính thành tiền của 1 món
    const getItemTotal = (item) => {
        return (item.price * item.quantity).toLocaleString('vi-VN');
    };

    const ReceiptContent = () => (
        <div className="receipt-container bg-white text-black" style={{ width: '80mm', margin: '0 auto', padding: '10px 15px', fontFamily: 'Arial, sans-serif' }}>
            <style>
                {`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    /* Sử dụng Flexbox để căn giữa hoàn toàn nội dung in */
                    .receipt-portal-wrapper {
                        display: flex !important; 
                        justify-content: center !important;
                        align-items: flex-start !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        min-height: 100vh;
                        visibility: visible;
                        background: white; /* Tránh nền xám nếu có */
                    }
                    .receipt-portal-wrapper * {
                        visibility: visible;
                    }
                    .receipt-container {
                        width: 80mm !important;
                        padding: 5mm !important;
                        margin: 0 auto !important; /* Cập nhật để căn giữa */
                        box-sizing: border-box;
                    }
                    @page {
                        margin: 0;
                        /* Nên để auto hoặc portrait thay vì ép size cụ thể nếu in máy thường */
                        size: auto; 
                    }
                }
                .receipt-divider {
                    border-top: 1px dashed #000;
                    margin: 8px 0;
                }
                .receipt-text {
                    font-size: 13px;
                    line-height: 1.4;
                }
                .receipt-text-sm {
                    font-size: 11px;
                    line-height: 1.3;
                }
                `}
            </style>
            
            <div className="text-center mb-3">
                <h1 className="text-xl font-bold uppercase mb-1">DƯA LÈO FOOD</h1>
                <p className="receipt-text-sm">Đ/c: 123 Đường Ẩm Thực, Q.1, TP.HCM</p>
                <p className="receipt-text-sm">Hotline: 0123.456.789</p>
            </div>

            <div className="text-center receipt-text font-bold uppercase mb-2">HÓA ĐƠN THANH TOÁN</div>
            
            <div className="receipt-divider"></div>

            <div className="receipt-text mb-2 space-y-1">
                <p className="flex justify-between"><span>Mã đơn:</span> <span className="font-bold">#{order._id?.substring(0, 8).toUpperCase()}</span></p>
                <p className="flex justify-between"><span>Ngày:</span> <span>{new Date().toLocaleString('vi-VN')}</span></p>
                <p className="flex justify-between"><span>Khách:</span> <span className="font-bold text-right">{order.customerInfo?.name || 'Khách lẻ'}</span></p>
                {order.customerInfo?.phone && <p className="flex justify-between"><span>SĐT:</span> <span>{order.customerInfo.phone}</span></p>}
            </div>

            <div className="receipt-divider"></div>

            <div className="w-full receipt-text">
                <div className="flex font-bold mb-2 pb-1 border-b border-black">
                    <div className="flex-1">Món ăn</div>
                    <div className="w-8 text-center">SL</div>
                    <div className="w-16 text-right">TTiền</div>
                </div>
                {order.items?.map((item, index) => (
                    <div key={index} className="flex mb-2 items-start">
                        <div className="flex-1 pr-1">
                            <span className="font-semibold">{item.product?.name || 'Món đã xóa'}</span>
                            <div className="receipt-text-sm text-gray-700">{item.price?.toLocaleString('vi-VN')}đ</div>
                        </div>
                        <div className="w-8 text-center font-bold mt-0.5">{item.quantity}</div>
                        <div className="w-16 text-right font-bold mt-0.5">{getItemTotal(item)}</div>
                    </div>
                ))}
            </div>

            <div className="receipt-divider"></div>

            <div className="receipt-text space-y-1 mt-2">
                <div className="flex justify-between">
                    <span>Cộng tiền hàng:</span>
                    <span>{order.totalAmount?.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between">
                    <span>Phí ship:</span>
                    <span>{order.shippingFee ? order.shippingFee.toLocaleString('vi-VN') : '0'}đ</span>
                </div>
                {order.discountAmount > 0 && (
                    <div className="flex justify-between">
                        <span>Giảm giá:</span>
                        <span>-{order.discountAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                )}
                <div className="flex justify-between font-black text-base mt-2 pt-2 border-t border-black">
                    <span className="uppercase">Tổng cộng:</span>
                    <span>{order.finalAmount?.toLocaleString('vi-VN')}đ</span>
                </div>
            </div>

            <div className="receipt-divider mt-3"></div>

            <div className="text-center receipt-text mt-3 space-y-1">
                <p>Thanh toán: <span className="font-bold uppercase">{order.paymentMethod === 'QR_CODE' ? 'Chuyển khoản QR' : 'Tiền mặt'}</span></p>
                {order.customerInfo?.address && (
                    <p className="mt-1 receipt-text-sm text-left"><span className="font-bold">Giao tới:</span> {order.customerInfo.address}</p>
                )}
                {order.customerInfo?.note && (
                    <p className="mt-1 receipt-text-sm text-left"><span className="font-bold">Ghi chú:</span> {order.customerInfo.note}</p>
                )}
            </div>

            <div className="text-center receipt-text-sm mt-5 font-bold">
                *** XIN CẢM ƠN QUÝ KHÁCH ***
            </div>
        </div>
    );

    return createPortal(
        <div className="receipt-portal-wrapper" id="printable-receipt" style={{ display: 'none' }}>
            <ReceiptContent />
        </div>,
        document.body
    );
};

export default OrderReceipt;