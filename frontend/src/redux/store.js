import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import uiReducer from './uiSlice';

// --- START: LOGIC LƯU GIỎ HÀNG VÀO LOCALSTORAGE ---

// Hàm này sẽ được gọi khi store được khởi tạo để tải giỏ hàng (nếu có)
const loadCartFromStorage = () => {
  try {
    // Mặc định là giỏ hàng của khách vãng lai
    let cartKey = 'cart_anonymous';
    const userInfoJSON = localStorage.getItem('userInfo');

    // Nếu người dùng đã đăng nhập, đổi sang key giỏ hàng của họ
    if (userInfoJSON) {
      const userInfo = JSON.parse(userInfoJSON);
      if (userInfo && userInfo._id) {
        cartKey = `cart_${userInfo._id}`;
      }
    }
    
    const serializedCart = localStorage.getItem(cartKey);
    if (serializedCart) {
      const cart = JSON.parse(serializedCart);
      // **Lớp bảo vệ**: Đảm bảo mọi item trong giỏ hàng tải lên đều có quantity hợp lệ.
      // Điều này sẽ sửa lỗi cho những giỏ hàng cũ đã bị hỏng trong localStorage.
      if (cart && Array.isArray(cart.items)) {
        cart.items = cart.items.map(item => ({
          ...item,
          quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1
        }));
      }
      return cart;
    }

    // Không có gì trong storage, Redux sẽ dùng state mặc định của slice
    return undefined; 
  } catch (e) {
    console.error("Không thể tải giỏ hàng từ localStorage", e);
    return undefined;
  }
};

// Middleware để tự động lưu giỏ hàng vào localStorage mỗi khi state thay đổi
const saveCartToStorageMiddleware = store => next => action => {
  const result = next(action);

  // Chỉ thực hiện lưu khi action thuộc về 'cart' slice để tối ưu hiệu năng
  if (action.type?.startsWith('cart/')) {
    const cartState = store.getState().cart;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const cartKey = (userInfo && userInfo._id) ? `cart_${userInfo._id}` : 'cart_anonymous';
      localStorage.setItem(cartKey, JSON.stringify(cartState));
    } catch (e) {
      console.error("Không thể lưu giỏ hàng vào localStorage", e);
    }
  }

  return result;
};

// --- END: LOGIC LƯU GIỎ HÀNG ---

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    ui: uiReducer,
  },
  // Tải state ban đầu cho giỏ hàng từ localStorage
  preloadedState: { cart: loadCartFromStorage() },
  // Thêm middleware vào store để tự động lưu
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(saveCartToStorageMiddleware),
});
