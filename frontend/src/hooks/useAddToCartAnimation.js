import { useCallback } from 'react';

/**
 * Custom hook để tạo hiệu ứng "bay vào giỏ hàng".
 * @returns {{flyToCart: function}} - Trả về một hàm để kích hoạt animation.
 */
export const useAddToCartAnimation = () => {
  const flyToCart = useCallback((event, imageElementId) => {
    const cartIcon = document.getElementById('cart-icon');
    let productImage = null;

    // Ưu tiên tìm bằng ID (cho trang chi tiết), nếu không có thì tìm từ event (cho card sản phẩm)
    if (imageElementId) {
        productImage = document.getElementById(imageElementId);
    } else if (event?.target) {
        // Tìm ảnh trong card sản phẩm gần nhất
        productImage = event.target.closest('.product-card')?.querySelector('.product-image, img');
    }

    if (!cartIcon || !productImage) {
      return; // Không tìm thấy icon giỏ hàng hoặc ảnh sản phẩm
    }

    const productImageRect = productImage.getBoundingClientRect();
    const cartIconRect = cartIcon.getBoundingClientRect();

    // 1. Tạo một ảnh "nhân bản" để bay
    const flyingImage = productImage.cloneNode(true);
    flyingImage.style.position = 'fixed';
    flyingImage.style.left = `${productImageRect.left}px`;
    flyingImage.style.top = `${productImageRect.top}px`;
    flyingImage.style.width = `${productImageRect.width}px`;
    flyingImage.style.height = `${productImageRect.height}px`;
    flyingImage.style.zIndex = '9999';
    flyingImage.style.borderRadius = '50%';
    flyingImage.style.objectFit = 'cover';
    flyingImage.style.transition = 'transform 0.8s cubic-bezier(0.5, 0, 0.75, 0), opacity 0.8s linear';

    document.body.appendChild(flyingImage);

    // 2. Tính toán khoảng cách di chuyển
    const deltaX = cartIconRect.left - productImageRect.left + (cartIconRect.width / 2);
    const deltaY = cartIconRect.top - productImageRect.top + (cartIconRect.height / 2);

    // 3. Kích hoạt animation
    setTimeout(() => {
      flyingImage.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.1)`;
      flyingImage.style.opacity = '0.5';
    }, 50);

    // 4. Xóa ảnh "nhân bản" sau khi bay xong
    setTimeout(() => {
      if (flyingImage.parentNode) {
        flyingImage.parentNode.removeChild(flyingImage);
      }
    }, 850);
  }, []);

  return { flyToCart };
};