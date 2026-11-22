# HƯỚNG DẪN CHI TIẾT NỘI DUNG BÁO CÁO & TRIỂN KHAI HỆ THỐNG (CĐTN2)

Tài liệu này giải thích chi tiết 5 yêu cầu của Giảng viên hướng dẫn về khía cạnh **Quản trị hệ thống & Triển khai trên Linux**, giúp tất cả thành viên trong nhóm hiểu rõ bản chất kỹ thuật và biết chính xác cần làm gì, chụp ảnh gì để đưa vào cuốn báo cáo cuối kỳ.

---

## 1. VÌ SAO KHÔNG THỂ DÙNG NGUYÊN VERCEL / RENDER?
* **Môn học CĐTN2** có phần lý thuyết và thực hành về **Hệ điều hành Linux & Quản trị hệ thống**.
* Việc deploy tự động bằng cách bấm nút trên Vercel/Render (PaaS) tuy chạy được web nhưng **không thể hiện được kỹ năng quản trị Linux** (cấu hình Web server, Reverse proxy, Tường lửa, Quản lý tiến trình, Tự động hóa sao lưu bằng Cronjob).
* **Mục tiêu:** Cần triển khai hệ thống web trên một môi trường **Linux (Ubuntu Server)** — có thể dùng máy ảo cục bộ (VMware, VirtualBox, WSL2) hoặc VPS thật.

---

## 2. MÔ HÌNH HỆ THỐNG TRÊN LINUX (UBUNTU)

```
[ Trình duyệt / Client ]
           │
           │ (Cổng 80 - HTTP)
           ▼
┌────────────────────────────────────────────────────────┐
│ MÁY CHỦ LINUX (UBUNTU)                                 │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ NGINX (Web Server & Reverse Proxy)               │  │
│  │  - Phục vụ Frontend tĩnh: /var/www/html/dist     │  │
│  │  - Chuyển tiếp /api/* -> http://localhost:5000   │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         │                              │
│                         ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ BACKEND NODE.JS (Quản lý bởi PM2)                │  │
│  │  - Chạy ngầm tại cổng nội bộ 5000                │  │
│  │  - Tự động restart khi crash / reboot            │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         │                              │
│                         ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ DATABASE MONGODB (Local hoặc MongoDB Atlas)      │  │
│  └──────────────────────────────────────────────────┘  │
│                         ▲                              │
│                         │                              │
│  ┌──────────────────────┴───────────────────────────┐  │
│  │ CRONJOB + BASH SCRIPT (Sao lưu tự động)          │  │
│  │  - Tự động chạy mongodump lúc 02:00 sáng         │  │
│  │  - Nén file backup lưu vào thư mục an toàn       │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 3. CHI TIẾT 5 MỤC YÊU CẦU CỦA BÁO CÁO

### MỤC 1: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG
* **Mục tiêu:** Trình bày cấu trúc và kiến trúc phần mềm trước khi đưa vào cài đặt.
* **Nội dung cần viết vào báo cáo:**
  1. **Sơ đồ kiến trúc tổng thể:** Mô hình 3 lớp (Client Layer $\rightarrow$ Application Layer $\rightarrow$ Database Layer).
  2. **Thiết kế Cơ sở dữ liệu (ERD / Schema):** Danh sách các Collection trong MongoDB (`users`, `products`, `orders`, `categories`,...), giải thích các trường dữ liệu quan trọng và quan hệ giữa chúng.
  3. **Sơ đồ luồng xử lý (Data Flow / Sequence Diagram):**
     * Luồng Đăng nhập / Xác thực (sử dụng JWT).
     * Luồng Đặt hàng và xử lý đơn hàng.

---

### MỤC 2: CÀI ĐẶT VÀ CẤU HÌNH MÔI TRƯỜNG
* **Mục tiêu:** Chứng minh các bước chuẩn bị hạ tầng từ đầu trên hệ điều hành Linux.
* **Nội dung cần viết vào báo cáo:**
  1. **Thông tin môi trường:**
     * Hệ điều hành: Ubuntu 22.04 LTS / 24.04 LTS.
     * Phiên bản phần mềm: Node.js (v20+), Nginx (v1.18+), Git, PM2.
  2. **Các lệnh cài đặt môi trường đã thực thi:**
     * Cập nhật hệ thống: `sudo apt update && sudo apt upgrade -y`.
     * Cài đặt Nginx: `sudo apt install nginx -y`.
     * Cài đặt Node.js & npm/pnpm.
     * Cài đặt PM2 toàn cục: `sudo npm install -g pm2`.
  3. **Cấu hình bảo mật tường lửa (UFW):**
     * Kích hoạt tường lửa và chỉ mở các cổng cho phép: Cổng 22 (SSH), Cổng 80 (HTTP), Cổng 443 (HTTPS).
  4. **Cấu hình biến môi trường (`.env`):**
     * Liệt kê bảng giải thích các biến: `PORT`, `MONGO_URI`, `JWT_SECRET`,... (che mờ chuỗi mật khẩu trong báo cáo).

---

### MỤC 3: TRIỂN KHAI WEBSITE (DEPLOYMENT)
* **Mục tiêu:** Trình bày quy trình đưa mã nguồn lên máy chủ và kích hoạt ứng dụng chạy thực tế.
* **Nội dung cần viết vào báo cáo:**
  1. **Triển khai Backend:**
     * Kéo mã nguồn về thư mục làm việc (vd: `/var/www/backend`).
     * Cài đặt dependencies: `pnpm install --prod`.
     * Cấu hình quản lý tiến trình bằng **PM2**:
       * Lệnh khởi chạy: `pm2 start index.js --name "food-backend"`.
       * Lưu trạng thái tự khởi động cùng hệ điều hành: `pm2 startup` và `pm2 save`.
  2. **Triển khai Frontend:**
     * Build mã nguồn thành file tĩnh: `pnpm run build` (tạo thư mục `dist`).
     * Đưa thư mục build vào thư mục phục vụ web của Linux: `/var/www/frontend`.
  3. **Cấu hình Nginx (Web Server & Reverse Proxy):**
     * Tạo file cấu hình tại `/etc/nginx/sites-available/food-app`.
     * **Cấu hình phục vụ Frontend (SPA):** Trỏ root về `/var/www/frontend`, cấu hình `try_files $uri $uri/ /index.html;` để tránh lỗi 404 khi người dùng tải lại trang.
     * **Cấu hình Reverse Proxy cho Backend:** Mọi request có tiền tố `/api/` sẽ được Nginx đẩy ngầm về `http://127.0.0.1:5000`.
     * Kích hoạt site (`ln -s`) và kiểm tra cú pháp (`nginx -t`), reload Nginx (`systemctl reload nginx`).

---

### MỤC 4: KIỂM THỬ VÀ QUẢN TRỊ HỆ THỐNG
* **Mục tiêu:** Đánh giá độ ổn định của hệ thống và các công cụ dùng để theo dõi, vận hành.
* **Nội dung cần viết vào báo cáo:**
  1. **Kiểm thử hệ thống (System Testing):**
     * **Kiểm thử chức năng (Functional Testing):** Bảng Test Case các luồng chính (Đăng ký, Đăng nhập, Thêm món vào giỏ, Đặt hàng, Quản lý đơn hàng của Admin). Kết quả: Đạt (Pass) / Không đạt (Fail).
     * **Kiểm thử API:** Dùng Postman hoặc lệnh `curl -I http://localhost/api/...` để kiểm tra mã trạng thái trả về (200 OK, 401 Unauthorized, 404 Not Found).
     * **Kiểm thử hiệu năng:** Đánh giá điểm số bằng Google Lighthouse (Performance, PWA, SEO).
  2. **Quản trị hệ thống (System Administration):**
     * **Giám sát tiến trình:** Chụp màn hình bảng trạng thái `pm2 status`, `pm2 monit` (hiển thị CPU, RAM của backend).
     * **Giám sát tài nguyên máy chủ:** Chụp màn hình lệnh `htop` hoặc `top` trên Linux.
     * **Quản trị Logs:** Cách kiểm tra log truy cập và log lỗi khi hệ thống gặp sự cố:
       * Log Nginx: `tail -f /var/log/nginx/access.log` và `/var/log/nginx/error.log`.
       * Log Backend: `pm2 logs food-backend --lines 50`.

---

### MỤC 5: SAO LƯU VÀ PHỤC HỒI HỆ THỐNG (BACKUP & RECOVERY)
* **Mục tiêu:** Chứng minh có phương án đảm bảo an toàn dữ liệu khi có sự cố thảm họa.
* **Nội dung cần viết vào báo cáo:**
  1. **Chiến lược sao lưu (Backup Strategy):**
     * Tự động sao lưu cơ sở dữ liệu MongoDB định kỳ mỗi ngày 1 lần vào lúc 02:00 sáng (thời điểm ít người truy cập).
     * Bản sao lưu được lưu trữ dưới dạng nén `.tar.gz` kèm mốc thời gian (Timestamp).
  2. **Viết Script tự động hóa (`backup.sh`):**
     * Dùng lệnh `mongodump` để trích xuất dữ liệu CSDL.
     * Nén thư mục dữ liệu thành file dạng `backup_YYYY-MM-DD.tar.gz`.
     * Thiết lập tự động xóa các bản sao lưu cũ quá 7 ngày để tiết kiệm dung lượng ổ cứng.
  3. **Lập lịch tự động bằng Cronjob:**
     * Mở cấu hình cron: `crontab -e`.
     * Thêm tác vụ: `0 2 * * * /bin/bash /var/scripts/backup.sh`.
  4. **Quy trình phục hồi dữ liệu (Disaster Recovery):**
     * Giả lập tình huống: Dữ liệu bị xóa nhầm hoặc database bị lỗi.
     * Giải nén file backup gần nhất: `tar -xvf backup_YYYY-MM-DD.tar.gz`.
     * Chạy lệnh phục hồi: `mongorestore --uri="<MONGO_URI>" ./dump/`.
     * Kiểm tra lại dữ liệu trên giao diện web.

---

## 4. DANH SÁCH ẢNH CHỤP MINH CHỨNG CẦN CÓ TRONG BÁO CÁO

| STT | Tên mục | Nội dung ảnh chụp cần đưa vào báo cáo |
| :--- | :--- | :--- |
| 1 | Môi trường | Terminal lệnh `node -v`, `npm -v`, `nginx -v`, `git --version` trên Ubuntu. |
| 2 | Môi trường | Trạng thái tường lửa `sudo ufw status verbose` (hiển thị cổng 22, 80, 443). |
| 3 | Triển khai | File cấu hình Nginx trong `/etc/nginx/sites-available/`. |
| 4 | Triển khai | Kết quả kiểm tra file cấu hình Nginx: `sudo nginx -t`. |
| 5 | Triển khai | Bảng trạng thái `pm2 status` và lệnh `pm2 startup`. |
| 6 | Quản trị | Màn hình `pm2 monit` hiển thị thời gian thực mức tiêu thụ tài nguyên Backend. |
| 7 | Quản trị | Màn hình `htop` hiển thị tổng thể RAM/CPU của hệ điều hành Ubuntu. |
| 8 | Quản trị | File log Nginx (`access.log`) ghi nhận request từ Client. |
| 9 | Kiểm thử | Kết quả chạy Test API trên Postman hoặc Swagger. |
| 10 | Sao lưu | Nội dung file script `backup.sh` và bảng cấu hình `crontab -l`. |
| 11 | Sao lưu | Thư mục chứa các file backup `.tar.gz` đã được sinh ra. |
| 12 | Phục hồi | Terminal chạy lệnh `mongorestore` thành công kèm thông báo restored. |
