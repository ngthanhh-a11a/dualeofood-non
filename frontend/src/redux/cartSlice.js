import { createSlice } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';

const initialState = {
  items: [],
  totalPrice: 0,
  totalQuantity: 0,
};

// Hàm tiện ích để tính toán lại tổng số lượng và tổng tiền
const calculateTotals = (state) => {
  let quantity = 0;
  let total = 0;
  state.items.forEach(item => {
    quantity += Number(item.quantity) || 0;
    total += (Number(item.quantity) || 0) * (Number(item.price) || 0);
  });
  state.totalQuantity = quantity;
  state.totalPrice = total;
};

// Hàm tạo định danh duy nhất cho từng dòng trong giỏ hàng
export const generateCartItemId = (productId, size, toppings = [], note = '') => {
  const sizeKey = size?.name ? size.name.trim() : 'standard';
  const toppingKey = (toppings || [])
    .map(t => (typeof t === 'string' ? t : t.name).trim())
    .sort()
    .join('_');
  const noteKey = (note || '').trim();
  return `${productId}-${sizeKey}-${toppingKey || 'notopping'}-${noteKey || 'nonote'}`;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Action để thiết lập toàn bộ giỏ hàng (dùng khi đăng nhập)
    setCart: (state, action) => {
      state.items = action.payload.items || [];
      calculateTotals(state);
    },

    // Action để thêm một sản phẩm vào giỏ (hỗ trợ phân biệt Size / Topping / Ghi chú)
    addToCart: (state, action) => {
      const payload = action.payload;
      const quantityToAdd = Number(payload.quantity) || 1;
      const productId = payload.productId || payload.id;

      // Tạo cartItemId nếu chưa có
      const cartItemId = payload.cartItemId || generateCartItemId(
        productId,
        payload.size,
        payload.toppings,
        payload.note
      );

      const existingItem = state.items.find(item => item.id === cartItemId);
      if (existingItem) {
        existingItem.quantity = (Number(existingItem.quantity) || 0) + quantityToAdd;
      } else {
        state.items.push({
          ...payload,
          id: cartItemId,
          productId: productId,
          quantity: quantityToAdd
        });
      }
      calculateTotals(state);
      toast.success(`${payload.name} đã được thêm vào giỏ hàng!`);
    },

    // Action để xóa một sản phẩm khỏi giỏ
    removeFromCart: (state, action) => {
      const idToRemove = action.payload;
      const itemToRemove = state.items.find(item => item.id === idToRemove);
      if (itemToRemove) {
        state.items = state.items.filter(item => item.id !== idToRemove);
        calculateTotals(state);
        toast.success(`Đã xóa ${itemToRemove.name} khỏi giỏ hàng.`);
      }
    },

    // Action để xóa toàn bộ giỏ hàng
    clearCart: (state) => {
      state.items = [];
      state.totalQuantity = 0;
      state.totalPrice = 0;
    },
    
    // Action cập nhật số lượng từ ô input
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const itemToUpdate = state.items.find(item => item.id === id);
      if (itemToUpdate && quantity > 0) {
        itemToUpdate.quantity = quantity;
        calculateTotals(state);
      }
    },
  }
});

// Đảm bảo export đầy đủ các actions
export const { setCart, addToCart, removeFromCart, clearCart, updateQuantity } = cartSlice.actions;

export default cartSlice.reducer;