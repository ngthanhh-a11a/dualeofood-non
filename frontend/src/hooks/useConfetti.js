import { useCallback } from 'react';
import confetti from 'canvas-confetti';

/**
 * Custom hook để tạo hiệu ứng pháo hoa giấy.
 * @returns {Object} Các hàm để bắn pháo hoa
 */
export const useConfetti = () => {
  const fire = useCallback((origin, colors) => {
    const shoot = (particleRatio, opts) => {
      confetti({
        ...opts,
        origin,
        particleCount: Math.floor(200 * particleRatio),
        angle: 90,
        spread: 120,
        startVelocity: 45,
        gravity: 1,
        drift: 0,
        ticks: 200,
        colors: colors || ['#0ea5e9', '#facc15', '#ec4899', '#22c55e', '#ffffff'],
        shapes: ['square', 'circle'],
        scalar: 0.8,
        zIndex: 9999
      });
    };

    setTimeout(() => shoot(0.25, { spread: 26, startVelocity: 55 }), 0);
    setTimeout(() => shoot(0.2, { spread: 60 }), 100);
    setTimeout(() => shoot(0.35, { spread: 100, decay: 0.91, scalar: 1 }), 200);
  }, []);

  const fireFromElement = (element, specificColors = null) => {
    // --- PHÁT ÂM THANH TING ---
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/947/947-preview.mp3');
      audio.volume = 0.6;
      audio.play().catch(() => {});
    } catch (error) {}

    const rect = element.getBoundingClientRect();
    const origin = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    };
    fire(origin, specificColors);
  };

  const fireJackpot = () => {
    // --- PHÁT ÂM THANH TRÚNG THƯỞNG ---
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'); // Tiếng trúng thưởng/Win
      audio.volume = 0.8;
      audio.play().catch(() => {});
    } catch (error) {}

    // Bắn từ 2 mép màn hình vào giữa liên tục
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#ee82ee'],
        zIndex: 9999
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#ee82ee'],
        zIndex: 9999
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  return { fireFromElement, fireJackpot };
};