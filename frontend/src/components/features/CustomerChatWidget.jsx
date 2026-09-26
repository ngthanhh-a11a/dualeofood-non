import React, { useState, useEffect, useRef } from 'react';
import { FiMessageSquare, FiX, FiSend } from 'react-icons/fi';
import { Mascot } from 'page-mascot';
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

  // Khởi tạo trạng thái kéo thả và quán tính (Inertia physics)
  const dragRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPointerRef = useRef({ x: 0, y: 0, time: 0 });
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const animFrameRef = useRef(null);

  // Vị trí mở khung chat đồng bộ theo vị trí nhân vật (mép trái/phải và độ cao Y)
  const [chatPosition, setChatPosition] = useState({
    side: 'right',
    top: null,
  });

  const handleOpenChat = () => {
    if (dragRef.current) {
      const rect = dragRef.current.getBoundingClientRect();
      const elementCenterX = rect.left + rect.width / 2;
      const isLeft = elementCenterX < window.innerWidth / 2;
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        // Trên mobile: Luôn neo cố định phía trên thanh Bottom Nav để không bị tràn/mất ô nhập tin nhắn
        setChatPosition({
          side: isLeft ? 'left' : 'right',
          top: null,
        });
      } else {
        const headerEl = document.querySelector('header');
        const headerBottom = headerEl ? Math.max(0, headerEl.getBoundingClientRect().bottom) : 70;
        const chatHeight = 500;
        const minTop = headerBottom + 16;
        const maxTop = Math.max(minTop, window.innerHeight - chatHeight - 16);

        // Canh khung chat theo độ cao hiện tại của nhân vật trên Desktop
        let targetTop = rect.top - 10;
        targetTop = Math.max(minTop, Math.min(maxTop, targetTop));

        setChatPosition({
          side: isLeft ? 'left' : 'right',
          top: Math.round(targetTop),
        });
      }
    } else {
      setChatPosition({
        side: 'right',
        top: null,
      });
    }
    setIsOpen(true);
  };

  // Tính toán giới hạn màn hình (chặn header và các mép)
  const getBounds = () => {
    if (!dragRef.current) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    const rect = dragRef.current.getBoundingClientRect();
    const curX = offsetRef.current.x;
    const curY = offsetRef.current.y;
    const origLeft = rect.left - curX;
    const origTop = rect.top - curY;
    const origRight = rect.right - curX;
    const origBottom = rect.bottom - curY;

    // Ranh giới Header: Tuyệt đối không cho lấn vào Header phía trên
    const headerEl = document.querySelector('header');
    const headerBottom = headerEl ? Math.max(0, headerEl.getBoundingClientRect().bottom) : 70;
    const topSafePadding = 12; // Cách đáy header 12px
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const bottomPadding = isMobile ? 80 : 16;  // Tránh bị thanh bottom navigation che lấp trên mobile

    const minX = sidePadding - origLeft;
    const maxX = window.innerWidth - sidePadding - origRight;
    const minY = (headerBottom + topSafePadding) - origTop;
    const maxY = window.innerHeight - bottomPadding - origBottom;

    return { minX, maxX, minY, maxY };
  };

  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    isDraggingRef.current = true;
    setIsDragging(true);
    hasMovedRef.current = false;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    dragStartRef.current = { x: offsetRef.current.x, y: offsetRef.current.y };
    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    velocityRef.current = { vx: 0, vy: 0 };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;

    if (!hasMovedRef.current && Math.hypot(dx, dy) > 5) {
      hasMovedRef.current = true;
    }

    if (!hasMovedRef.current) return;

    const now = performance.now();
    const dt = Math.max(1, now - lastPointerRef.current.time);
    const vx = ((e.clientX - lastPointerRef.current.x) / dt) * 16.6;
    const vy = ((e.clientY - lastPointerRef.current.y) / dt) * 16.6;
    velocityRef.current = { vx, vy };
    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now };

    let targetX = dragStartRef.current.x + dx;
    let targetY = dragStartRef.current.y + dy;

    // Giới hạn tuyệt đối khi đang kéo (không lấn header, không vượt mép)
    const bounds = getBounds();
    targetX = Math.max(bounds.minX, Math.min(bounds.maxX, targetX));
    targetY = Math.max(bounds.minY, Math.min(bounds.maxY, targetY));

    offsetRef.current = { x: targetX, y: targetY };
    if (dragRef.current) {
      dragRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
    }
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerUp);

    // Nếu không di chuyển quá 5px, tính là nhấn chuột mở chat
    if (!hasMovedRef.current) {
      handleOpenChat();
      return;
    }

    // Hiệu ứng giống Bong bóng Messenger (Snap to Edge):
    // Tự động hít về mép trái hoặc phải gần nhất với tốc độ êm dịu, vừa phải
    let { vx, vy } = velocityRef.current;
    const timeSinceLast = performance.now() - lastPointerRef.current.time;
    if (timeSinceLast > 80) {
      vx = 0;
      vy = 0;
    } else {
      // Giới hạn lực ném ban đầu ở mức nhẹ
      vx = Math.max(-6, Math.min(6, vx * 0.3));
      vy = Math.max(-6, Math.min(6, vy * 0.3));
    }

    const bounds = getBounds();
    const rect = dragRef.current ? dragRef.current.getBoundingClientRect() : null;
    const elementCenterX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const screenCenterX = window.innerWidth / 2;

    // Quyết định mép hít vào: ném nhẹ cũng nhận diện được hướng, ngược lại chọn mép gần hơn
    let targetSnapX = bounds.maxX;
    if (vx > 2) {
      targetSnapX = bounds.maxX; // Ném sang phải -> hít mép phải
    } else if (vx < -2) {
      targetSnapX = bounds.minX; // Ném sang trái -> hít mép trái
    } else {
      targetSnapX = elementCenterX < screenCenterX ? bounds.minX : bounds.maxX;
    }

    let curX = offsetRef.current.x;
    let curY = offsetRef.current.y;

    const runSnapAndInertia = () => {
      const dx = targetSnapX - curX;

      // Khống chế trần tốc độ tối đa không quá 8px/frame
      // Dù bạn có kéo ra tận giữa màn hình lớn rồi buông thì nhân vật vẫn lướt từ tốn, không phóng vút đi
      const MAX_SPEED = 8;
      const desiredVx = Math.sign(dx) * Math.min(MAX_SPEED, Math.max(1, Math.abs(dx) * 0.06));
      vx = vx + (desiredVx - vx) * 0.12;
      curX += vx;

      // Quán tính trôi dọc nhẹ nhàng
      vy *= 0.8;
      curY += vy;

      // Đảm bảo không bao giờ lọt vào Header và đáy màn hình
      const currentBounds = getBounds();
      if (curY < currentBounds.minY) {
        curY = currentBounds.minY;
        vy = 0;
      } else if (curY > currentBounds.maxY) {
        curY = currentBounds.maxY;
        vy = 0;
      }

      offsetRef.current = { x: curX, y: curY };
      if (dragRef.current) {
        dragRef.current.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
      }

      // Dừng lại êm khi đã tiếp giáp mép
      if (Math.abs(dx) < 1 && Math.abs(vx) < 0.4 && Math.abs(vy) < 0.4) {
        curX = targetSnapX;
        offsetRef.current = { x: curX, y: curY };
        if (dragRef.current) {
          dragRef.current.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
        }
        animFrameRef.current = null;
      } else {
        animFrameRef.current = requestAnimationFrame(runSnapAndInertia);
      }
    };

    animFrameRef.current = requestAnimationFrame(runSnapAndInertia);
  };

  // Cập nhật vị trí khi mở/đóng hoặc resize màn hình
  useEffect(() => {
    if (!isOpen && dragRef.current) {
      dragRef.current.style.transform = `translate3d(${offsetRef.current.x}px, ${offsetRef.current.y}px, 0)`;
    }
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (!dragRef.current) return;
      const bounds = getBounds();
      const rect = dragRef.current.getBoundingClientRect();
      const elementCenterX = rect.left + rect.width / 2;
      const targetX = elementCenterX < window.innerWidth / 2 ? bounds.minX : bounds.maxX;
      let curY = Math.max(bounds.minY, Math.min(bounds.maxY, offsetRef.current.y));
      offsetRef.current = { x: targetX, y: curY };
      dragRef.current.style.transform = `translate3d(${targetX}px, ${curY}px, 0)`;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Ẩn widget ở các trang Admin và Staff
  const isHidden = location.pathname.startsWith('/admin') || location.pathname.startsWith('/staff');

  useEffect(() => {
    let currentUserId = null;
    let currentGuestId = null;

    const loadSessionAndHistory = async () => {
      // 1. Khởi tạo định danh người dùng
      const userStr = localStorage.getItem('userInfo');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          currentUserId = userObj.id || userObj._id;
          setUserId(currentUserId);
          setUserAvatar(userObj.avatar || null);
        } catch (e) {
          setUserId(null);
          setUserAvatar(null);
        }
      } else {
        setUserId(null);
        setUserAvatar(null);
      }

      currentGuestId = localStorage.getItem('chat_guest_id');
      if (!currentUserId && !currentGuestId) {
        currentGuestId = 'guest_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('chat_guest_id', currentGuestId);
      }
      setGuestId(currentGuestId);

      // Reset danh sách tin nhắn trước khi tải tin nhắn của phiên mới
      setMessages([]);

      // 2. Load lịch sử tin nhắn
      try {
        const url = `/chats/history?userId=${currentUserId || 'null'}&guestId=${currentGuestId || 'null'}`;
        const res = await axios.get(url);
        if (res.data.success && res.data.messages) {
          setMessages(res.data.messages);
        }
      } catch (error) {
        console.error("Lỗi tải lịch sử chat:", error);
      }

      if (socket) {
        socket.emit('join_chat', { guestId: currentGuestId, userId: currentUserId });
      }
    };

    loadSessionAndHistory();

    const handleAuthChange = () => {
      loadSessionAndHistory();
    };

    window.addEventListener('authChange', handleAuthChange);

    if (!socket) {
      return () => {
        window.removeEventListener('authChange', handleAuthChange);
      };
    }

    const handleReceiveMessage = (msg) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      socket.off('receive_message', handleReceiveMessage);
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

    let customerName = 'Khách hàng';
    try {
      const userStr = localStorage.getItem('userInfo');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        customerName = userObj.name || userObj.fullName || 'Khách hàng';
      }
    } catch (e) { }

    // Emit qua Socket
    socket.emit('customer_send_message', {
      guestId,
      userId,
      customerName,
      content: inputMessage
    });

    setInputMessage('');
  };

  if (isHidden) return null;

  return (
    <>
      {/* Nút Chat / Mascot hiển thị khi đóng - Hỗ trợ giữ chuột kéo thả quán tính */}
      {!isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 pointer-events-none">
          <div
            ref={dragRef}
            onPointerDown={handlePointerDown}
            className={`pointer-events-auto relative select-none flex flex-col items-center group ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
              touchAction: 'none',
              userSelect: 'none',
              willChange: 'transform',
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleOpenChat()}
            title="Giữ chuột kéo thả (có quán tính) hoặc nhấn để mở Chat Hỗ trợ"
          >
            {/* Nhân vật Mascot */}
            <div className="transition-transform duration-300 group-hover:scale-105 active:scale-95 drop-shadow-xl pointer-events-none">
              <Mascot
                directions="/mascots/toaster-directions.webp"
                reactions="/mascots/toaster-reactions.webp"
                size={96}
                label="Hỗ trợ viên Toaster"
              />
            </div>

            {/* Chữ 'Chat Hỗ trợ' nằm ngay dưới, căn giữa, không phông nền, không chấm xanh */}
            <span className="mt-0.5 text-xs font-bold text-slate-800 tracking-tight select-none text-center drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] transition-all duration-200 group-hover:scale-105 group-hover:text-black pointer-events-none">
              Chat Hỗ trợ
            </span>
          </div>
        </div>
      )}

      {/* Cửa sổ Chat - Tối ưu hiển thị cho cả Desktop và Mobile */}
      {isOpen && (
        <div
          className={`fixed z-[1000] transition-all duration-300 ${
            chatPosition.side === 'left' ? 'left-3 md:left-6' : 'right-3 md:right-6'
          } ${chatPosition.top === null ? 'bottom-20 md:bottom-6' : ''}`}
          style={{
            top: chatPosition.top !== null ? `${chatPosition.top}px` : undefined,
          }}
        >
          <div className="relative">
            {/* Mascot ngồi trên nóc khung chat tương ứng mép trái/phải */}
            <div className={`absolute -top-14 md:-top-16 ${chatPosition.side === 'left' ? 'left-4 md:left-6' : 'right-4 md:right-6'} z-20 drop-shadow-xl pointer-events-auto`}>
              <Mascot
                directions="/mascots/toaster-directions.webp"
                reactions="/mascots/toaster-reactions.webp"
                size={72}
                label="Hỗ trợ viên Toaster"
              />
            </div>

            <div className={`bg-white rounded-2xl shadow-2xl w-[calc(100vw-1.5rem)] max-w-[360px] md:w-[350px] h-[65vh] max-h-[500px] md:h-[500px] flex flex-col overflow-hidden border border-slate-200 transition-all duration-300 transform ${
              chatPosition.side === 'left' ? 'origin-bottom-left md:origin-top-left' : 'origin-bottom-right md:origin-top-right'
            }`}>
              {/* Header tông màu slate theo Mascot */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 text-white flex justify-between items-center shadow-md border-b border-slate-700/60 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  {/* Mặt nhân vật Toaster tĩnh (nhìn thẳng, không theo chuột) */}
                  <div
                    className="w-9 h-9 rounded-full bg-slate-800 border border-slate-600/80 shadow-inner flex-shrink-0"
                    style={{
                      backgroundImage: 'url(/mascots/toaster-directions.webp)',
                      backgroundSize: '300% 300%',
                      backgroundPosition: '50% 50%',
                      backgroundRepeat: 'no-repeat',
                    }}
                    title="Hỗ trợ viên Toaster"
                  />
                  <div>
                    <h3 className="font-bold text-base leading-tight flex items-center gap-1.5">
                      Chat Hỗ trợ
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                    </h3>
                    <p className="text-[11px] text-slate-300">Chúng tôi sẽ trả lời ngay!</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white hover:bg-slate-700/80 p-1.5 rounded-full transition-colors">
                  <FiX size={20} />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 min-h-0 p-4 overflow-y-auto bg-slate-50 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-10 text-sm">
                    <p>Chưa có tin nhắn nào.</p>
                    <p>Hãy gửi câu hỏi cho chúng tôi nhé!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.sender === 'customer' ? 'items-end' : 'items-start'}`}>
                      {msg.sender === 'support' && (
                        <span className="text-[10px] text-slate-500 font-bold ml-2 mb-1 flex items-center gap-1">
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
                          className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.sender === 'customer'
                              ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-tr-none'
                              : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/80'
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
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 flex-shrink-0">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-shadow"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="bg-slate-800 text-white w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <FiSend size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerChatWidget;
