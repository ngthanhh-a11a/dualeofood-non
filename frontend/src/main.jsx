import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux' // Import Provider
import { store } from './redux/store' // Import Store
import { SocketProvider } from './contexts/SocketContext' // Import SocketProvider
import { GoogleOAuthProvider } from '@react-oauth/google' // Import Google OAuth
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Không tự động gọi lại API khi user chuyển tab
      retry: 1, // Thử lại 1 lần nếu lỗi
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}>
          <SocketProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </SocketProvider>
        </GoogleOAuthProvider>
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
)