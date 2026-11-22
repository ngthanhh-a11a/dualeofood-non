import React, { useState, useEffect } from 'react';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [backOnline, setBackOnline] = useState(false);

  useEffect(() => {
    let timer = null;

    const handleOffline = () => {
      setBackOnline(false);
      setIsOffline(true);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setBackOnline(true);
      timer = setTimeout(() => {
        setBackOnline(false);
      }, 2500);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!isOffline && !backOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md pointer-events-none transition-all duration-300 transform translate-y-0"
    >
      <div
        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md border text-sm font-medium transition-all ${
          isOffline
            ? 'bg-amber-950/90 text-amber-100 border-amber-500/40 shadow-amber-950/50'
            : 'bg-emerald-950/90 text-emerald-100 border-emerald-500/40 shadow-emerald-950/50'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              isOffline ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {isOffline ? (
              <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>

          {/* Nội dung thông báo */}
          <div className="leading-tight">
            <p className="font-semibold text-[13px] tracking-wide">
              {isOffline ? 'Mất kết nối Internet' : 'Đã kết nối lại Internet'}
            </p>
            <p className="text-[11px] opacity-80">
              {isOffline ? 'Đang chờ mạng Wi-Fi hoặc 4G...' : 'Hệ thống đã sẵn sàng phục vụ bạn!'}
            </p>
          </div>
        </div>

        {/* Pulse Indicator */}
        <div className="flex items-center pr-1 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isOffline ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isOffline ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </span>
        </div>
      </div>
    </div>
  );
};

export default OfflineBanner;
