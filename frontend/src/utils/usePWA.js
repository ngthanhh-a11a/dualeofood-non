import { useState, useEffect } from 'react';

// Biến lưu deferredPrompt ở mức module để không bị mất khi component re-mount
let globalDeferredPrompt = null;

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Kiểm tra xem app có đang chạy ở chế độ standalone (đã cài đặt) không
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true;
      setIsStandalone(isStandaloneMode);
      if (isStandaloneMode) {
        setIsInstalled(true);
      }
    };
    checkStandalone();

    // 2. Kiểm tra xem có phải thiết bị Apple iOS (iPhone/iPad) không
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // 3. Bắt sự kiện beforeinstallprompt của Chrome / Edge / Android
    const handleBeforeInstallPrompt = (e) => {
      // Ngăn banner mặc định thô sơ của trình duyệt
      e.preventDefault();
      globalDeferredPrompt = e;
      setDeferredPrompt(e);
    };

    // 4. Bắt sự kiện cài đặt thành công
    const handleAppInstalled = () => {
      setIsInstalled(true);
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Hàm kích hoạt cài đặt App
  const installPWA = async () => {
    const promptToUse = deferredPrompt || globalDeferredPrompt;
    if (promptToUse) {
      promptToUse.prompt();
      const choiceResult = await promptToUse.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      return { success: true, outcome: choiceResult.outcome };
    }
    return { success: false, isIOS };
  };

  return {
    canInstall: Boolean(deferredPrompt || globalDeferredPrompt) || isIOS,
    isInstalled: isInstalled || isStandalone,
    isIOS,
    isStandalone,
    installPWA
  };
};
