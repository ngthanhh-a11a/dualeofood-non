import React, { useState, useEffect, useRef } from 'react';
import axios from '../../utils/axiosConfig';
import { useSocket } from '../../contexts/SocketContext';
import { FiSend, FiUser, FiMapPin, FiPhone, FiShoppingBag, FiClock, FiMessageSquare, FiMail } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CHAT_SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SupportDashboard = () => {
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [customerProfile, setCustomerProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const socket = useSocket();
    const [showAllOrders, setShowAllOrders] = useState(false);
    const messagesEndRef = useRef(null);

    // 1. Khởi tạo Socket
    useEffect(() => {
        if (!socket) return;

        // Lắng nghe tin nhắn mới từ bất kỳ khách nào (hoặc staff khác)
        socket.on('new_chat_message', (data) => {
            const { conversationId, message, customerName } = data;
            
            // Cập nhật danh sách bên trái (đẩy lên đầu, in đậm nếu chưa chọn)
            setConversations(prev => {
                const exists = prev.find(c => c._id === conversationId);
                let updated = prev;
                if (exists) {
                    updated = prev.map(c => c._id === conversationId ? { ...c, hasUnreadAdmin: true, updatedAt: new Date().toISOString() } : c);
                } else {
                    // Thêm mới
                    updated = [{ _id: conversationId, customerName, hasUnreadAdmin: true, updatedAt: new Date().toISOString() }, ...prev];
                }
            // Sort
            return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        });

        // THÊM: Nếu đang mở đúng ô chat đó, hiển thị luôn tin nhắn ra cột giữa
        setActiveChat(prev => {
            if (prev && prev._id === conversationId) {
                setMessages(msgs => {
                    // Kiểm tra trùng lặp để tránh lỗi hiển thị 2 lần của React StrictMode
                    if (msgs.some(m => m._id === message._id)) return msgs;
                    return [...msgs, message];
                });
            }
            return prev;
        });
    });

        socket.on('receive_message', (data) => {
             // Dùng cho trường hợp đang mở chat window này
            const { conversationId, message } = data;
            setActiveChat(prev => {
                if (prev && prev._id === conversationId) {
                    // Nếu đang mở đúng ô chat này, add tin nhắn vào mảng
                    setShowAllOrders(false);
                    setMessages(msgs => {
                        if (msgs.some(m => m._id === message._id)) return msgs;
                        return [...msgs, message];
                    });
                }
                return prev;
            });
        });

        return () => {
            socket.off('new_chat_message');
            socket.off('receive_message');
        };
    }, [socket]);

    // 2. Load danh sách chat ban đầu
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const res = await axios.get('/chats');
                if (res.data.success) {
                    setConversations(res.data.data);
                }
            } catch (error) {
                console.error("Lỗi tải danh sách chat:", error);
            }
        };
        fetchConversations();
    }, []);

    // Cuộn xuống cuối
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // 3. Xử lý chọn 1 đoạn chat
    const handleSelectChat = async (conv) => {
        setActiveChat(conv);
        setMessages([]);
        setCustomerProfile(null);
        setShowAllOrders(false);

        try {
            // Đánh dấu đã đọc
            await axios.put(`/chats/${conv._id}/read`);
            setConversations(prev => prev.map(c => c._id === conv._id ? { ...c, hasUnreadAdmin: false } : c));

            // Lấy chi tiết tin nhắn
            const res = await axios.get(`/chats/${conv._id}`);
            if (res.data.success) {
                setMessages(res.data.data.messages);
            }

            // Lấy thông tin Profile nếu có userId
            if (conv.userId) {
                setLoadingProfile(true);
                const profileRes = await axios.get(`/users/${conv.userId}`);
                // Đồng thời lấy lịch sử đơn hàng
                const ordersRes = await axios.get(`/orders/user/${conv.userId}`);
                
                setCustomerProfile({
                    info: profileRes.data,
                    orders: ordersRes.data.data || []
                });
                setLoadingProfile(false);
            }

        } catch (error) {
            console.error("Lỗi khi load chi tiết chat:", error);
            setLoadingProfile(false);
        }
    };

    // 4. Gửi tin nhắn
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !activeChat || !socket) return;

        socket.emit('support_send_message', {
            conversationId: activeChat._id,
            content: inputMessage
        });

        setInputMessage('');
    };

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden font-sans">
            {/* CỘT 1: Danh sách Chat */}
            <div className="w-1/4 min-w-[250px] border-r border-gray-100 bg-gray-50/50 flex flex-col">
                <div className="p-4 border-b border-gray-100 bg-white">
                    <h2 className="font-bold text-lg text-slate-800">Đang hoạt động</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <p className="text-center text-gray-400 mt-10 text-sm">Chưa có hội thoại nào</p>
                    ) : (
                        conversations.map(conv => (
                            <div 
                                key={conv._id} 
                                onClick={() => handleSelectChat(conv)}
                                className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${activeChat?._id === conv._id ? 'bg-orange-50 border-l-4 border-l-orange-500' : 'hover:bg-gray-100'} ${conv.hasUnreadAdmin && activeChat?._id !== conv._id ? 'bg-white' : ''}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-semibold ${conv.hasUnreadAdmin && activeChat?._id !== conv._id ? 'text-black font-bold' : 'text-slate-700'}`}>
                                        {conv.customerName || 'Khách hàng'}
                                    </span>
                                    {conv.hasUnreadAdmin && activeChat?._id !== conv._id && (
                                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400">
                                    {new Date(conv.updatedAt).toLocaleString('vi-VN')}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* CỘT 2: Cửa sổ Chat */}
            <div className="flex-1 flex flex-col bg-white">
                {activeChat ? (
                    <>
                        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                {customerProfile?.info?.avatar ? (
                                    <img src={customerProfile.info.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    activeChat.customerName ? activeChat.customerName.charAt(0).toUpperCase() : 'K'
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{activeChat.customerName}</h3>
                                <span className="text-xs text-green-500 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Đang kết nối
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                            {messages.map((msg, idx) => {
                                const isCustomer = msg.sender === 'customer';
                                return (
                                <div key={idx} className={`flex flex-col ${!isCustomer ? 'items-end' : 'items-start'}`}>
                                    {msg.sender === 'ai' && (
                                        <span className="text-[10px] text-gray-400 font-bold mr-2 mb-1 flex items-center gap-1">
                                            🤖 AI Đã Trả Lời Tự Động
                                        </span>
                                    )}
                                    <div className={`flex items-end gap-2 max-w-[80%] ${!isCustomer ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {isCustomer && (
                                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">
                                                {customerProfile?.info?.avatar ? (
                                                    <img src={customerProfile.info.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    activeChat.customerName ? activeChat.customerName.charAt(0).toUpperCase() : 'K'
                                                )}
                                            </div>
                                        )}
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                                            msg.sender === 'support' 
                                                ? 'bg-orange-500 text-white rounded-tr-none' 
                                                : msg.sender === 'ai'
                                                ? 'bg-blue-500 text-white rounded-tr-none'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                        }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
                            <input 
                                type="text"
                                value={inputMessage}
                                onChange={e => setInputMessage(e.target.value)}
                                placeholder="Nhập câu trả lời..."
                                className="flex-1 bg-gray-100/80 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                            />
                            <button 
                                type="submit"
                                disabled={!inputMessage.trim()}
                                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105"
                            >
                                <FiSend size={18} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <FiMessageSquare size={48} className="mb-4 opacity-20" />
                        <p>Chọn một đoạn chat để bắt đầu hỗ trợ</p>
                    </div>
                )}
            </div>

            {/* CỘT 3: Thông tin khách hàng */}
            <div className="w-1/4 min-w-[300px] border-l border-gray-100 bg-white flex flex-col overflow-y-auto">
                {activeChat ? (
                    <div className="p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2"><FiUser className="text-orange-500"/> Hồ Sơ Khách Hàng</h3>
                        
                        {!activeChat.userId ? (
                            <div className="bg-gray-50 rounded-xl p-5 text-center text-gray-500 border border-gray-100 text-sm">
                                Đây là khách vãng lai (Guest).<br/>Họ chưa tạo tài khoản trên hệ thống.
                            </div>
                        ) : loadingProfile ? (
                            <p className="text-sm text-gray-400 text-center">Đang tải hồ sơ...</p>
                        ) : customerProfile?.info ? (
                            <div className="space-y-6">
                                {/* Info Card */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl">
                                            {customerProfile.info.avatar ? (
                                                <img src={customerProfile.info.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                customerProfile.info.name ? customerProfile.info.name.charAt(0).toUpperCase() : 'K'
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-lg">{customerProfile.info.name}</p>
                                            <p className="text-sm text-gray-500">{customerProfile.info.role === 'customer' ? 'Khách hàng' : 'Nhân viên'}</p>
                                        </div>
                                    </div>
                                    <p className="flex items-start gap-3 text-sm text-gray-600">
                                        <FiMail className="mt-1 flex-shrink-0 text-orange-500"/>
                                        <span>{customerProfile.info.email || 'Chưa cập nhật email'}</span>
                                    </p>
                                </div>

                                <div className="border-t border-gray-100 pt-6">
                                    <h4 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2"><FiShoppingBag className="text-orange-500"/> Đơn hàng gần đây</h4>
                                    {customerProfile.orders.length === 0 ? (
                                        <p className="text-xs text-gray-400">Chưa có đơn hàng nào.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {(showAllOrders ? customerProfile.orders : customerProfile.orders.slice(0, 3)).map(order => (
                                                <div key={order._id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-slate-700">#{order._id.substring(0, 8)}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-500 flex items-center gap-1 mt-1"><FiClock size={10}/> {new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                                                    <p className="font-bold text-orange-600 mt-1">{order.finalAmount?.toLocaleString('vi-VN')}đ</p>
                                                </div>
                                            ))}
                                            {customerProfile.orders.length > 3 && !showAllOrders && (
                                                <p onClick={() => setShowAllOrders(true)} className="text-center text-xs text-orange-500 font-semibold mt-2 cursor-pointer hover:underline">
                                                    Xem tất cả ({customerProfile.orders.length})
                                                </p>
                                            )}
                                            {showAllOrders && (
                                                <p onClick={() => setShowAllOrders(false)} className="text-center text-xs text-slate-500 font-semibold mt-2 cursor-pointer hover:underline">
                                                    Thu gọn
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-red-500 text-center">Không tìm thấy thông tin khách hàng.</p>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center p-6 text-center text-gray-400 text-sm">
                        Thông tin khách hàng sẽ hiển thị tại đây
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportDashboard;
