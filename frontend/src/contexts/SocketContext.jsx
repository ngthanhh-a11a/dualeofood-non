import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const CHAT_SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
            transports: ['websocket', 'polling']
        });

        setSocket(newSocket);

        return () => {
            // Tránh warning "WebSocket is closed before connection is established"
            setTimeout(() => {
                newSocket.disconnect();
            }, 500);
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
