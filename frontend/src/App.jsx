import { useEffect } from 'react';
import { Routes, Route, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { openAuthModal } from './redux/uiSlice';
import { Toaster } from 'react-hot-toast';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Home from './pages/public/Home';
import About from './pages/public/About';
import Menu from './pages/public/Menu';
import ProductDetail from './pages/public/ProductDetail';
import Cart from './pages/public/Cart';
import Contact from './pages/public/Contact';
import Checkout from './pages/checkout/Checkout';
import OrderSuccess from './pages/checkout/OrderSuccess';
import MyOrders from './pages/user/MyOrders';
import Profile from './pages/user/Profile';
import MyReviews from './pages/user/MyReviews';
import MyAddresses from './pages/user/MyAddresses';
import PrivateRoute from './layouts/PrivateRoute';
import RoleBasedRoute from './layouts/RoleBasedRoute'; // Import component phân quyền route
import Promotions from './pages/public/Promotions';
import Wallet from './pages/user/Wallet';
import ResetPassword from './pages/public/ResetPassword';
import Blog from './pages/public/Blog';
import BlogDetail from './pages/public/BlogDetail';
import CustomerChatWidget from './components/features/CustomerChatWidget';
import PrivacyPolicy from './pages/public/policies/PrivacyPolicy';
import TermsOfService from './pages/public/policies/TermsOfService';
import ReturnPolicy from './pages/public/policies/ReturnPolicy';
import ShoppingGuide from './pages/public/policies/ShoppingGuide';

// Nhúng các component Admin
import AuthModal from './components/auth/AuthModal';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminOrders from './pages/admin/AdminOrders';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMessages from './pages/admin/AdminMessages';
import AdminLiveChat from './pages/admin/AdminLiveChat';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminProducts from './pages/admin/AdminProducts';
import AdminBroadcast from './pages/admin/AdminBroadcast';
import BannerManager from './pages/admin/BannerManager';
import ArticleManager from './pages/admin/ArticleManager';
import AdminSettings from './pages/admin/AdminSettings';
import ReviewManager from './pages/admin/ReviewManager';

// === NHÚNG CÁC COMPONENT STAFF (MỚI) ===
import StaffLayout from './layouts/StaffLayout';
import StaffOrders from './pages/staff/StaffOrders';
import StaffMessages from './pages/staff/StaffMessages';
import StaffLiveChat from './pages/staff/StaffLiveChat';

// Layout chung cho các trang public
const PublicLayout = () => (
  <>
    <Header />
    <main className="pt-24">
      <Outlet />
    </main>
    <Footer />
  </>
);

function App() {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Bắt sự kiện requireLogin từ PrivateRoute để bật modal
  useEffect(() => {
    if (location.state?.requireLogin) {
      dispatch(openAuthModal());
      // Xóa state để tránh vòng lặp bật liên tục khi reload
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, dispatch, navigate, location.pathname]);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Auth Modal toàn cục */}
      <AuthModal />
      
      {/* Container để hiển thị các thông báo toast từ react-hot-toast */}
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* Hiển thị Bong bóng chat toàn cục cho người dùng */}
      <CustomerChatWidget />

      <Routes>
        
        {/* ================= ROUTES CÔNG KHAI (Sử dụng PublicLayout) ================= */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="menu" element={<Menu />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="contact" element={<Contact />} />
          <Route path="cart" element={<Cart />} />
          <Route path="promotions" element={<Promotions />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<BlogDetail />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="terms-of-service" element={<TermsOfService />} />
          <Route path="return-policy" element={<ReturnPolicy />} />
          <Route path="shopping-guide" element={<ShoppingGuide />} />
          {/* Các route cần đăng nhập */}
          <Route path="checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
          <Route path="order-success" element={<PrivateRoute><OrderSuccess /></PrivateRoute>} />
          <Route path="my-orders" element={<PrivateRoute><MyOrders /></PrivateRoute>} />
          <Route path="my-reviews" element={<PrivateRoute><MyReviews /></PrivateRoute>} />
          <Route path="profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="my-addresses" element={<PrivateRoute><MyAddresses /></PrivateRoute>} />
          <Route path="wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
        </Route>

        {/* ================= ROUTES ĐỘC LẬP (Không dùng layout chung) ================= */}
        {/* Đã xóa route /login vì dùng AuthModal */}
        <Route path="/login" element={<Navigate to="/" state={{ requireLogin: true }} replace />} /> 
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* ================= ROUTES CHO ADMIN (Chỉ role 'admin' mới truy cập) ================= */}
        <Route path="/admin" element={
          <RoleBasedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </RoleBasedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="coupons" element={<AdminCoupons />} />         
          <Route path="orders" element={<AdminOrders />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="live-chat" element={<AdminLiveChat />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="broadcast" element={<AdminBroadcast />} />
          <Route path="banners" element={<BannerManager />} />
          <Route path="articles" element={<ArticleManager />} />
          <Route path="reviews" element={<ReviewManager />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* ================= ROUTES CHO STAFF (Role 'staff' hoặc 'admin') ================= */}
        <Route path="/staff" element={
          <RoleBasedRoute allowedRoles={['staff', 'admin']}>
            <StaffLayout />
          </RoleBasedRoute>
        }>
          <Route index element={<StaffOrders />} />
          <Route path="banners" element={<BannerManager />} />
          <Route path="articles" element={<ArticleManager />} />
          <Route path="messages" element={<StaffMessages />} />
          <Route path="live-chat" element={<StaffLiveChat />} />
        </Route>

      </Routes>
    </div>
  );
}

export default App;
