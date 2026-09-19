# 🍔 DuaLeoFood - Frontend (Giao Diện Website Đặt Đồ Ăn)

Hệ thống giao diện người dùng (Frontend) cho website đặt món ăn trực tuyến **DuaLeoFood**, được xây dựng trên nền tảng **React 19** và bộ công cụ đóng gói **Vite**, kết hợp phong cách thiết kế hiện đại bằng **Tailwind CSS**.

---

## 📌 Mục Lục
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Yêu Cầu Môi Trường](#-yêu-cầu-môi-trường)
- [Hướng Dẫn Cài Đặt & Chạy Dự Án](#-hướng-dẫn-cài-đặt--chạy-dự-án)
- [Cấu Hình Biến Môi Trường (.env)](#-cấu-hình-biến-môi-trường-env)
- [Danh Sách Trang & Chức Năng](#-danh-sách-trang--chức-năng)
- [Cấu Trúc Thư Mục Source Code](#-cấu-trúc-thư-mục-source-code)
- [Các Lệnh Thường Dùng (Scripts)](#-các-lệnh-thường-dùng-scripts)

---

## 🚀 Công Nghệ Sử Dụng

* **Core & Build Tool:** React 19, Vite 8
* **Styling:** Tailwind CSS 3, PostCSS, Autoprefixer
* **Định tuyến (Routing):** React Router DOM v7 (hỗ trợ phân quyền Route động)
* **Quản lý trạng thái (State Management):** 
  * Redux Toolkit & React-Redux (quản lý giỏ hàng, thông tin xác thực)
  * TanStack React Query v5 (quản lý server cache và fetch dữ liệu tối ưu)
* **Giao tiếp API & Real-time:** 
  * Axios (đã thiết lập Interceptor tự đính kèm JWT token)
  * Socket.io-client (hỗ trợ live chat và nhận thông báo đơn hàng tức thì)
* **Xác thực:** Google OAuth (`@react-oauth/google`), JWT Token
* **Tiện ích & Giao diện:**
  * Biểu đồ doanh thu: `recharts`
  * Thông báo giao diện: `react-hot-toast`, `react-toastify`
  * Xuất báo cáo & hóa đơn: `exceljs`, `xlsx`, `file-saver`, `jspdf`, `html2canvas`
  * Soạn thảo tin tức: `react-quill-new`
  * Icon: `react-icons`
  * Hiệu ứng: `canvas-confetti`

---

## 💻 Yêu Cầu Môi Trường

Trước khi bắt đầu, máy tính của bạn cần được cài đặt:
* **Node.js:** Phiên bản `>= 18.x` (khuyến nghị `20.x` LTS trở lên).
* **Trình quản lý gói:** `npm` (đi kèm Node.js) hoặc `yarn` / `pnpm`.
* **Backend:** Server backend Node.js/Express đang chạy (mặc định tại cổng `5000`).

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Dự Án

### 1. Di chuyển vào thư mục Frontend
Mở terminal tại thư mục gốc của dự án và chạy:
```bash
cd frontend
```

### 2. Cài đặt các thư viện phụ thuộc (Dependencies)
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo hoặc kiểm tra file `.env` tại thư mục `frontend/` (xem chi tiết mục [Cấu hình .env](#-cấu-hình-biến-môi-trường-env)).

### 4. Khởi chạy môi trường phát triển (Development)
```bash
npm run dev
```
Sau khi chạy lệnh, trình duyệt sẽ mở ứng dụng tại địa chỉ:
👉 **`http://localhost:5173`** (hoặc cổng hiển thị trên terminal).

---

## ⚙️ Cấu Hình Biến Môi Trường (.env)

Tạo file `.env` trong thư mục `frontend/` với các tham số mẫu sau:

```env
# Địa chỉ Backend Server (nếu không khai báo mặc định là http://localhost:5000)
VITE_API_URL=http://localhost:5000

# Client ID đăng nhập Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

---

## 📋 Danh Sách Trang & Chức Năng

Hệ thống được chia làm 3 phân hệ chính với hệ thống kiểm soát quyền nghiêm ngặt:

### 1. Phân hệ Khách hàng & Công khai (Public / User)
| Đường dẫn (Route) | Trang | Chức năng chính |
| :--- | :--- | :--- |
| `/` | **Trang chủ (Home)** | Banner quảng cáo, món ăn bán chạy, combo khuyến mãi hot |
| `/menu` | **Thực đơn (Menu)** | Lọc món ăn theo danh mục, tìm kiếm, sắp xếp theo giá |
| `/product/:id` | **Chi tiết món ăn** | Chọn kích cỡ, topping, số lượng, xem và gửi đánh giá món |
| `/cart` | **Giỏ hàng (Cart)** | Quản lý món đã chọn, tính tổng tiền, chuyển sang thanh toán |
| `/promotions` | **Khuyến mãi** | Danh sách voucher, mã giảm giá hiện có |
| `/blog`, `/blog/:slug` | **Tin tức & Blog** | Bài viết ẩm thực, cẩm nang ăn uống |
| `/checkout` | **Thanh toán** *(Cần đăng nhập)* | Nhập địa chỉ nhận món, áp mã coupon, chọn hình thức thanh toán |
| `/my-orders` | **Đơn hàng của tôi** *(Cần đăng nhập)* | Theo dõi tiến độ đơn hàng thời gian thực, xem lịch sử đặt |
| `/profile` | **Thông tin cá nhân** *(Cần đăng nhập)* | Xem và cập nhật họ tên, avatar, số điện thoại |
| `/my-addresses` | **Sổ địa chỉ** *(Cần đăng nhập)* | Lưu trữ nhiều địa chỉ giao hàng tiện lợi |
| `/wallet` | **Ví thưởng** *(Cần đăng nhập)* | Quản lý số dư, điểm tích lũy thành viên |
| **Bong bóng Chat** | **Live Chat** | Trò chuyện trực tiếp với nhân viên hỗ trợ góc màn hình |

---

### 2. Phân hệ Nhân viên (Staff) - Quyền: `staff` hoặc `admin`
Truy cập qua tiền tố `/staff`:
* **`/staff` (Đơn hàng):** Theo dõi danh sách đơn đặt, cập nhật trạng thái đơn (chế biến, giao hàng).
* **`/staff/live-chat` & `/staff/messages`:** Trực tiếp tiếp nhận và trả lời thắc mắc của khách hàng qua khung chat.
* **`/staff/banners` & `/staff/articles`:** Cập nhật tin tức khuyến mãi và hình ảnh banner.

---

### 3. Phân hệ Quản trị viên (Admin) - Quyền: `admin`
Truy cập qua tiền tố `/admin`:
* **`/admin` (Dashboard):** Biểu đồ doanh thu ngày/tháng/năm, thống kê số lượng đơn hàng, món ăn bán chạy nhất.
* **`/admin/products`:** Thêm, sửa, xóa món ăn, bật/tắt trạng thái còn hàng/hết hàng.
* **`/admin/categories`:** Quản lý danh mục món ăn (Đồ ăn nhanh, Nước uống, Tráng miệng,...).
* **`/admin/coupons`:** Quản lý mã giảm giá, thiết lập % giảm, giá trị đơn tối thiểu và hạn dùng.
* **`/admin/orders`:** Quản lý toàn diện đơn hàng, in hóa đơn xuất ra file PDF và xuất báo cáo file Excel.
* **`/admin/users`:** Quản lý danh sách tài khoản, phân quyền Role (User, Staff, Admin), khóa/mở tài khoản.
* **`/admin/broadcast`:** Gửi thông báo toàn hệ thống đến người dùng.
* **`/admin/reviews`:** Quản lý và duyệt đánh giá, phản hồi của khách hàng.
* **`/admin/settings`:** Cài đặt thông tin cửa hàng, thời gian mở cửa, cấu hình hệ thống.

---

## 📂 Cấu Trúc Thư Mục Source Code

```text
frontend/
├── public/                 # Tài nguyên tĩnh công khai
├── src/
│   ├── assets/             # Hình ảnh tĩnh, icon, biểu trưng
│   ├── components/         
│   │   ├── auth/           # Modal đăng nhập / đăng ký toàn cục (AuthModal)
│   │   ├── common/         # Component dùng chung (Header, Footer, Button, StarRating,...)
│   │   └── features/       # Component nghiệp vụ (Chat Widget, Order Tracker, Receipt,...)
│   ├── contexts/           # React Context chia sẻ dữ liệu toàn cục
│   ├── hooks/              # Custom Hooks tái sử dụng logic
│   ├── layouts/            # Layout bọc (AdminLayout, StaffLayout, PrivateRoute,...)
│   ├── pages/              
│   │   ├── admin/          # Các trang quản trị của Admin
│   │   ├── auth/           # Trang xác thực và quên mật khẩu
│   │   ├── checkout/       # Thanh toán và thông báo đặt hàng thành công
│   │   ├── public/         # Các trang dành cho khách vãng lai
│   │   ├── staff/          # Các trang xử lý của Nhân viên
│   │   └── user/           # Các trang thông tin cá nhân khách hàng
│   ├── redux/              # Store Redux Toolkit & các Slices (cartSlice, uiSlice,...)
│   ├── utils/              # Tiện ích bổ trợ (axiosConfig.js, formatCurrency, getImageUrl,...)
│   ├── App.jsx             # Cấu hình Router tổng và bảo vệ phân quyền
│   ├── main.jsx            # Điểm khởi chạy ứng dụng
│   └── index.css           # Cấu hình CSS toàn cục với Tailwind CSS
├── .env                    # Biến môi trường
├── package.json            # Danh sách thư viện và scripts
├── tailwind.config.js      # Cấu hình giao diện Tailwind
└── vite.config.js          # Cấu hình trình đóng gói Vite
```

---

## 📜 Các Lệnh Thường Dùng (Scripts)

| Lệnh | Ý nghĩa |
| :--- | :--- |
| `npm run dev` | Khởi động server phát triển tại máy cục bộ (HMR tức thì) |
| `npm run build` | Biên dịch mã nguồn tối ưu hóa cho môi trường Production (thư mục `/dist`) |
| `npm run preview` | Chạy thử bản build Production tại máy cục bộ để kiểm tra trước khi deploy |
| `npm run lint` | Chạy công cụ ESLint kiểm tra cú pháp và lỗi tiềm ẩn trong code |
