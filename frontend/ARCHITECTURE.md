# Kiến trúc Frontend (Frontend Architecture)

Dự án này sử dụng mô hình **Role-based Architecture (Kiến trúc phân quyền)** kết hợp với **Feature-based Components**. Cấu trúc này giúp phân tách rõ ràng luồng nghiệp vụ giữa khách hàng, nhân viên và quản trị viên, giúp dễ dàng bảo trì và phát triển tính năng mới.

## Cấu trúc thư mục (Directory Structure)

```text
src/
├── assets/          # Hình ảnh, logo tĩnh (logo.png, hero.png,...)
├── components/      # Các thành phần giao diện (UI) dùng chung và tái sử dụng
│   ├── common/      # Chứa UI thuần túy: Header, Footer, StarRating,...
│   └── features/    # Chứa Component gắn với nghiệp vụ (Modal, Banner, Tracker,...)
├── hooks/           # Custom React Hooks (useConfetti, useAddToCartAnimation,...)
├── layouts/         # Các Wrapper cho từng Role
│   ├── AdminLayout.jsx     # Bọc các trang của Admin
│   ├── StaffLayout.jsx     # Bọc các trang của Staff
│   ├── PrivateRoute.jsx    # Bảo vệ các route cần đăng nhập
│   └── RoleBasedRoute.jsx  # Bảo vệ các route theo Role (admin, staff, user)
├── pages/           # Chứa toàn bộ các trang (Pages) của hệ thống
│   ├── admin/       # Chỉ dành cho Admin (Quản lý User, Product, Category,...)
│   ├── auth/        # Đăng nhập, Đăng ký
│   ├── checkout/    # Giỏ hàng và Thanh toán
│   ├── public/      # Mọi người đều xem được (Home, Menu, ProductDetail,...)
│   ├── staff/       # Dành cho nhân viên (Quản lý đơn hàng kéo thả Kanban)
│   └── user/        # Dành cho khách đã đăng nhập (Hồ sơ, Ví, Đơn hàng của tôi)
├── redux/           # Quản lý State toàn cục bằng Redux Toolkit (cartSlice.js, store.js)
├── styles/          # File CSS bổ trợ (datepicker.css,...)
├── utils/           # Các hàm tiện ích (axiosConfig.js xử lý interceptor, JWT token)
├── App.jsx          # File khai báo Router tổng (React Router v6)
├── index.css        # File cấu hình TailwindCSS toàn cục
└── main.jsx         # Điểm khởi chạy của ứng dụng React
```

## Các luồng chính (Main Flows)

### 1. Phân quyền và Bảo mật (Routing & Security)
Bất cứ người dùng nào truy cập vào một URL, `App.jsx` sẽ kiểm tra thông qua `RoleBasedRoute.jsx`. 
- Nếu truy cập `/admin/*`, hệ thống kiểm tra token và đảm bảo Role là `admin`.
- Nếu truy cập `/staff/*`, hệ thống cho phép `staff` hoặc `admin`.
- Việc cấu hình JWT token được thực hiện tự động ở mỗi Request qua interceptor trong `utils/axiosConfig.js`.

### 2. Quản lý trạng thái (State Management)
- **Giỏ hàng (Cart)**: Được lưu trong Redux Toolkit (`redux/cartSlice.js`) và đồng bộ hóa với LocalStorage, giúp khách hàng không mất giỏ hàng khi tải lại trang.
- **Dữ liệu động**: Được lấy từ API bằng Axios và quản lý State cục bộ bằng `useState`, `useEffect`. Các thao tác có độ trễ đều có hiệu ứng loading.

### 3. Tổ chức Component (Component Organization)
Để đảm bảo nguyên tắc DRY (Don't Repeat Yourself), mọi khối giao diện xuất hiện từ 2 nơi trở lên đều phải đưa vào `components/`:
- `components/common`: Chỉ làm nhiệm vụ hiển thị (Dumb Components). Không gọi API phức tạp bên trong này.
- `components/features`: Gắn liền với một chức năng cụ thể (Ví dụ: `OrderReceipt` dùng để render Hóa đơn ẩn lúc in ấn, `ReviewModal` để khách hàng đánh giá).

## Hướng dẫn bảo trì (Maintenance Guide)

- **Khi muốn thêm một trang quản lý mới cho Admin:**
  1. Tạo file `.jsx` trong `pages/admin/`.
  2. Khai báo Route mới vào khối `Routes CHO ADMIN` trong file `App.jsx`.
  3. Thêm link vào Sidebar của `AdminLayout.jsx`.

- **Khi muốn tạo thêm một Role mới (vd: Shipper):**
  1. Thêm folder `pages/shipper/`.
  2. Tạo `ShipperLayout.jsx` tương tự như `StaffLayout.jsx`.
  3. Thêm `<Route path="/shipper" element={<RoleBasedRoute allowedRoles={['shipper']}>...}>` vào `App.jsx`.
