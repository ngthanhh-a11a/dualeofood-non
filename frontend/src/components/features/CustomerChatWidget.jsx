import React, { useState, useEffect, useRef } from 'react';
import { FiMessageSquare, FiX, FiSend } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import axios from '../../utils/axiosConfig';

// Kết nối socket riêng cho chat (không cần token cho guest)
const CHAT_SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
let chatSocket;

const CustomerChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const socket = useSocket();
  const [guestId, setGuestId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  // Ẩn widget ở các trang Admin và Staff
  const isHidden = location.pathname.startsWith('/admin') || location.pathname.startsWith('/staff');

  useEffect(() => {
    // 1. Khởi tạo định danh người dùng
    const userStr = localStorage.getItem('userInfo');
    let currentUserId = null;
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        currentUserId = userObj.id || userObj._id;
        setUserId(currentUserId);
        setUserAvatar(userObj.avatar || null);
      } catch (e) {}
    }

    let currentGuestId = localStorage.getItem('chat_guest_id');
    if (!currentUserId && !currentGuestId) {
      currentGuestId = 'guest_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('chat_guest_id', currentGuestId);
    }
    setGuestId(currentGuestId);

    // 2. Load lịch sử tin nhắn
    const fetchHistory = async () => {
      try {
        const url = `/chats/history?userId=${currentUserId || 'null'}&guestId=${currentGuestId || 'null'}`;
        const res = await axios.get(url);
        if (res.data.success && res.data.messages) {
          setMessages(res.data.messages);
        }
      } catch (error) {
        console.error("Lỗi tải lịch sử chat:", error);
      }
    };
    fetchHistory();

    if (!socket) return;

    socket.emit('join_chat', { guestId: currentGuestId, userId: currentUserId });

    socket.on('receive_message', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.off('receive_message');
    };
  }, [socket]);

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    if (!socket) return;

    // --- Optimistic UI Update ---
    // Hiển thị ngay lập tức tin nhắn trên giao diện khách hàng
    const tempMessage = {
      _id: 'temp_' + Date.now(),
      sender: 'customer',
      content: inputMessage,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    setMessages(prev => [...prev, tempMessage]);

    // Emit qua Socket
    socket.emit('customer_send_message', {
      guestId,
      userId,
      customerName: userId ? JSON.parse(localStorage.getItem('userInfo')).name : 'Khách hàng',
      content: inputMessage
    });

    setInputMessage('');
  };

  if (isHidden) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Nút Chat hiển thị khi đóng */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
        >
          <FiMessageSquare size={24} />
        </button>
      )}

      {/* Cửa sổ Chat */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-[350px] h-[500px] flex flex-col overflow-hidden border border-gray-100 transition-all duration-300 transform origin-bottom-right">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-400 p-4 text-white flex justify-between items-center shadow-md">
            <div>
              <h3 className="font-bold text-lg">Chat Hỗ trợ</h3>
              <p className="text-xs opacity-90">Chúng tôi sẽ trả lời ngay!</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:bg-orange-600 p-1 rounded-full transition-colors">
              <FiX size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-10 text-sm">
                <p>Chưa có tin nhắn nào.</p>
                <p>Hãy gửi câu hỏi cho chúng tôi nhé!</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.sender === 'customer' ? 'items-end' : 'items-start'}`}>
                  {msg.sender === 'ai' && (
                    <span className="text-[10px] text-gray-400 font-bold ml-2 mb-1 flex items-center gap-1">
                      🤖 AI Trợ Lý
                    </span>
                  )}
                  {msg.sender === 'support' && (
                    <span className="text-[10px] text-orange-500 font-bold ml-2 mb-1 flex items-center gap-1">
                      🧑‍💼 Nhân viên
                    </span>
                  )}
                  <div className={`flex items-end gap-2 max-w-[90%] ${msg.sender === 'customer' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {msg.sender === 'customer' && (
                      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">
                        {userAvatar ? (
                          <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          '👤'
                        )}
                      </div>
                    )}
                    <div 
                      className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        msg.sender === 'customer' 
                          ? 'bg-orange-500 text-white rounded-tr-none' 
                          : msg.sender === 'ai'
                          ? 'bg-blue-50 text-blue-900 border border-blue-100 rounded-tl-none'
                          : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <input 
              type="text" 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Nhập tin nhắn..." 
              className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-shadow"
            />
            <button 
              type="submit" 
              disabled={!inputMessage.trim()}
              className="bg-orange-500 text-white w-10 h-10 flex items-center justify-center rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiSend size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CustomerChatWidget;
