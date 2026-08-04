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
    quantity += item.quantity;
    total += item.quantity * item.price;
  });
  state.totalQuantity = quantity;
  state.totalPrice = total;
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

    // Action để thêm một sản phẩm vào giỏ
    addToCart: (state, action) => {
      const newItem = action.payload;
      const quantityToAdd = newItem.quantity || 1; // Luôn đảm bảo có số lượng, mặc định là 1
      const existingItem = state.items.find(item => item.id === newItem.id);
      if (existingItem) {
        // **Lớp bảo vệ**: Đảm bảo quantity hiện tại là một số trước khi cộng dồn.
        existingItem.quantity = (Number(existingItem.quantity) || 0) + quantityToAdd;
      } else {
        state.items.push({ ...newItem, quantity: quantityToAdd });
      }
      calculateTotals(state);
      toast.success(`${newItem.name} đã được thêm vào giỏ hàng!`);
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
    
    // Action CÒN THIẾU để cập nhật số lượng từ ô input
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