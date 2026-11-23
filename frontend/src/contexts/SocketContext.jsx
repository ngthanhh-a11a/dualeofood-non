import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

// Nếu có biến môi trường thì dùng, ngược lại kết nối trực tiếp qua Host/Nginx hiện tại
const CHAT_SOCKET_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        
        // Khởi tạo socket
        const newSocket = io(CHAT_SOCKET_URL, {
            auth: token ? { token } : undefined,
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        setSocket(newSocket);

        // Xử lý Back-Forward Cache (bfcache) của trình duyệt:
        // Đóng socket êm đẹp khi vào cache và tự kết nối lại khi người dùng bấm Back/Forward quay lại
        const handlePageHide = () => {
            if (newSocket && newSocket.connected) {
                newSocket.disconnect();
            }
        };

        const handlePageShow = (event) => {
            if (event.persisted && newSocket && !newSocket.connected) {
                newSocket.connect();
            }
        };

        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('pageshow', handlePageShow);

        return () => {
            window.removeEventListener('pagehide', handlePageHide);
            window.removeEventListener('pageshow', handlePageShow);
            newSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
