# HƯỚNG DẪN CHI TIẾT NỘI DUNG BÁO CÁO & TRIỂN KHAI HỆ THỐNG TRÊN LINUX (WSL2 / UBUNTU) - CĐTN2

Tài liệu này chuẩn hóa toàn bộ quy trình triển khai thực tế trên môi trường **Linux (WSL2 Ubuntu)** và hướng dẫn chi tiết 5 mục báo cáo cho môn Chuyên đề tốt nghiệp 2 (CĐTN2), phục vụ việc lấy số liệu và ảnh chụp minh chứng cho cuốn báo cáo.

---

## 1. VÌ SAO PHẢI TRIỂN KHAI TRÊN LINUX (THAY VÌ CHỈ DÙNG VERCEL / RENDER)?
* Môn học CĐTN2 yêu cầu sinh viên nắm vững kỹ năng **Quản trị hệ thống (System Administration)** trên nền tảng Linux.
* Việc deploy tự động bằng giao diện bấm nút trên Vercel/Render (PaaS) không thể hiện được các kỹ năng:
  * Cấu hình Web Server và Reverse Proxy (Nginx).
  * Quản trị tiến trình nền và phân bổ tài nguyên CPU/RAM (PM2).
  * Quản lý an ninh mạng và tường lửa (UFW).
  * Tự động hóa tác vụ định kỳ bằng Shell Script và Cronjob (Sao lưu và phục hồi thảm họa).
* **Môi trường thực thi trong dự án:** Sử dụng **WSL2 (Ubuntu)** ngay trên máy Windows, cho phép chạy nhân Linux thật, thao tác hoàn toàn qua dòng lệnh (CLI).

---

## 2. KIẾN TRÚC HỆ THỐNG TRIỂN KHAI

```
[ Trình duyệt / Client ]
           │
           │ (HTTP - Port 80)
           ▼
┌────────────────────────────────────────────────────────┐
│ MÁY CHỦ LINUX (WSL2 UBUNTU)                            │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ NGINX (Web Server & Reverse Proxy)               │  │
│  │  - Phục vụ Frontend tĩnh: frontend/dist          │  │
│  │  - Chuyển tiếp /api/* -> 127.0.0.1:5000          │  │
│  │  - Chuyển tiếp /socket.io/* -> 127.0.0.1:5000    │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         │                              │
│                         ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ BACKEND NODE.JS (Quản lý bởi PM2)                │  │
│  │  - Chạy ngầm tại cổng nội bộ 5000                │  │
│  │  - Cluster mode, tự khởi động lại khi crash      │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         │                              │
│                         ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ DATABASE MONGODB (MongoDB Atlas / Local)         │  │
│  └──────────────────────────────────────────────────┘  │
│                         ▲                              │
│                         │                              │
│  ┌──────────────────────┴───────────────────────────┐  │
│  │ CRONJOB + BASH SCRIPT (Sao lưu tự động)          │  │
│  │  - Tự động chạy mongodump lúc 02:00 sáng         │  │
│  │  - Nén file tar.gz & xóa bản cũ sau 7 ngày       │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 3. CÁC FILE CẤU HÌNH & SCRIPT TỰ ĐỘNG HÓA TRONG THƯ MỤC `deployment/`

Dự án đã được tích hợp sẵn bộ script chuẩn hóa tại thư mục `deployment/`:

1. **`deployment/setup-wsl.sh`**: Script tự động cài đặt Node.js LTS (v20), Nginx, PM2, pnpm, MongoDB Database Tools và áp dụng cấu hình hệ thống chỉ bằng 1 câu lệnh.
2. **`deployment/nginx.conf`**: Cấu hình Virtual Host của Nginx:
   * Phục vụ Frontend React/Vite SPA (`try_files $uri $uri/ /index.html;`).
   * Reverse Proxy định tuyến `/api/` về Backend chạy cổng `5000`.
   * Hỗ trợ WebSocket (`/socket.io/`) và nén Gzip tăng tốc độ tải trang.
3. **`deployment/ecosystem.config.js`**: Cấu hình tiến trình PM2 cho Backend chạy chế độ `cluster`, tự khởi động lại khi RAM vượt quá 500MB hoặc khi tiến trình gặp lỗi.
4. **`deployment/backup.sh`**: Script tự động xuất CSDL bằng `mongodump`, nén thành file `backup_YYYYMMDD_HHMMSS.tar.gz` và tự dọn dẹp các bản sao lưu cũ quá 7 ngày.
5. **`deployment/restore.sh`**: Script phục hồi toàn diện cơ sở dữ liệu từ file sao lưu nén bằng `mongorestore`.

---

## 4. QUY TRÌNH THỰC THI THỰC TẾ TRÊN WSL2 (TỪNG BƯỚC)

### Bước 1: Khởi động môi trường Linux (WSL2 Ubuntu)
Mở PowerShell hoặc Windows Terminal:
```bash
wsl -d Ubuntu
```

### Bước 2: Di chuyển vào thư mục dự án
Trong terminal Ubuntu:
```bash
cd /mnt/c/Users/ADMIN/Desktop/test-bandoan
```

### Bước 3: Chạy script cài đặt môi trường tự động
```bash
bash deployment/setup-wsl.sh
```
*Script sẽ tự động cài đặt các công cụ, liên kết file cấu hình Nginx và khởi chạy service.*  
> **[ẢNH MINH CHỨNG 1 & 2]**: Chụp terminal hiển thị phiên bản `node -v`, `nginx -v`, `pm2 -v` và dòng chữ `CÀI ĐẶT HOÀN TẤT!`.

### Bước 4: Triển khai Frontend & Backend
1. **Build mã nguồn Frontend:**
   ```bash
   cd frontend
   pnpm install
   pnpm run build
   cd ..
   ```
2. **Khởi chạy Backend với PM2:**
   ```bash
   pm2 start deployment/ecosystem.config.js
   pm2 save
   ```
> **[ẢNH MINH CHỨNG 3 & 4]**: Chụp màn hình bảng trạng thái `pm2 status` (trạng thái `online`) và giao diện giám sát tài nguyên `pm2 monit`.

### Bước 5: Kiểm tra hoạt động hệ thống
Mở trình duyệt trên Windows:
* Truy cập `http://localhost`: Giao diện Web hiển thị thông qua Nginx.
* Truy cập `http://localhost/api/products`: Trả về dữ liệu JSON của API (chứng minh Reverse Proxy hoạt động chính xác).
> **[ẢNH MINH CHỨNG 5 & 6]**: Chụp màn hình trình duyệt hiển thị trang web tại `http://localhost` và kết quả gọi API.

### Bước 6: Kiểm tra quản trị và giám sát hệ thống
1. **Kiểm tra trạng thái Nginx và đọc Log:**
   ```bash
   sudo systemctl status nginx
   tail -n 20 /var/log/nginx/access.log
   ```
2. **Xem mức tiêu thụ tài nguyên phần cứng Linux:**
   ```bash
   htop
   ```
> **[ẢNH MINH CHỨNG 7 & 8]**: Chụp file log Nginx ghi nhận request và màn hình lệnh `htop`.

### Bước 7: Thực hiện sao lưu & Lập lịch tự động (Cronjob)
1. **Chạy thử nghiệm sao lưu thủ công:**
   ```bash
   bash deployment/backup.sh
   ls -lh backups/
   ```
2. **Cấu hình lập lịch sao lưu định kỳ:**
   ```bash
   crontab -e
   ```
   Thêm dòng sau vào cuối file để tự động sao lưu vào lúc 02:00 sáng mỗi ngày:
   ```text
   0 2 * * * /bin/bash /mnt/c/Users/ADMIN/Desktop/test-bandoan/deployment/backup.sh >> /mnt/c/Users/ADMIN/Desktop/test-bandoan/backups/backup.log 2>&1
   ```
   Kiểm tra lại lịch trình đã lưu:
   ```bash
   crontab -l
   ```
> **[ẢNH MINH CHỨNG 9 & 10]**: Chụp danh sách file nén trong thư mục `backups/` và nội dung lệnh `crontab -l`.

### Bước 8: Thử nghiệm kịch bản phục hồi dữ liệu (Disaster Recovery)
Khi cần khôi phục lại dữ liệu từ một bản backup:
```bash
bash deployment/restore.sh /mnt/c/Users/ADMIN/Desktop/test-bandoan/backups/<TEN_FILE_BACKUP>.tar.gz
```
> **[ẢNH MINH CHỨNG 11]**: Chụp màn hình lệnh `restore.sh` chạy hoàn tất với thông báo `done restoring`.

---

## 5. DÀN Ý CHI TIẾT 5 MỤC TRONG CUỐN BÁO CÁO CUỐI KỲ

### CHƯƠNG / MỤC 1: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG
1. **Kiến trúc tổng thể hệ thống:** Trình bày mô hình 3 lớp (Client Layer $\rightarrow$ Application Layer $\rightarrow$ Database Layer). Đưa sơ đồ kiến trúc tại Mục 2 vào báo cáo.
2. **Thiết kế Cơ sở dữ liệu (Database Schema):** Danh sách các collection chính (`users`, `products`, `orders`, `categories`,...), kiểu dữ liệu từng trường và quan hệ giữa các collection.
3. **Sơ đồ luồng dữ liệu (Data Flow / Sequence Diagram):**
   * Quy trình xác thực phân quyền qua JWT Token (User, Staff, Admin).
   * Quy trình tạo đơn hàng, trừ tồn kho và cập nhật trạng thái đơn hàng thời gian thực qua Socket.IO.

### CHƯƠNG / MỤC 2: CÀI ĐẶT VÀ CẤU HÌNH MÔI TRƯỜNG
1. **Hạ tầng máy chủ:** Trình bày về hệ điều hành Linux (Ubuntu 22.04 LTS chạy trên nền tảng WSL2/Virtualization).
2. **Các gói phần mềm nền tảng:**
   * Node.js v20 (LTS) & Trình quản lý gói pnpm.
   * Nginx v1.18+ (High-Performance Web Server).
   * PM2 (Node.js Production Process Manager).
   * MongoDB Database Tools (`mongodump`, `mongorestore`).
3. **Cấu hình biến môi trường (`.env`):** Lập bảng giải thích các tham số cấu hình hệ thống: `PORT`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`.
4. **Cấu hình an ninh & Tường lửa:** Thiết lập phân quyền truy cập cổng mạng qua UFW (`ufw allow 80`, `ufw allow 443`).

### CHƯƠNG / MỤC 3: TRIỂN KHAI WEBSITE
1. **Triển khai ứng dụng Frontend:**
   * Tối ưu hóa đóng gói mã nguồn tĩnh bằng Vite (`pnpm run build`).
   * Phục vụ ứng dụng đơn trang (SPA) qua Nginx Web Server.
2. **Triển khai ứng dụng Backend:**
   * Cấu hình tiến trình bằng PM2 Cluster Mode giúp tận dụng đa nhân CPU.
   * Cơ chế tự phục hồi (Auto-restart) khi tiến trình crash hoặc vượt giới hạn bộ nhớ.
3. **Cấu hình Nginx Reverse Proxy:**
   * Phân tích nội dung file cấu hình `/etc/nginx/sites-available/food-app`.
   * Định tuyến request: Phục vụ Frontend tại `/` và ủy quyền các request `/api/`, `/socket.io/` về Backend cổng `5000`.

### CHƯƠNG / MỤC 4: KIỂM THỬ VÀ QUẢN TRỊ HỆ THỐNG
1. **Kiểm thử hệ thống (System Testing):**
   * **Kiểm thử chức năng:** Bảng Test Case các chức năng cốt lõi (Đăng ký/Đăng nhập, Quản lý giỏ hàng, Thanh toán, Quản lý đơn hàng).
   * **Kiểm thử API:** Kiểm tra các HTTP Status Code trả về (200, 201, 400, 401, 403, 500) qua Postman.
   * **Đánh giá hiệu năng:** Đo lường chỉ số Google Lighthouse (Performance, PWA, SEO).
2. **Quản trị và giám sát hệ thống:**
   * Giám sát tiến trình thời gian thực qua `pm2 status` và `pm2 monit`.
   * Giám sát tài nguyên máy chủ (CPU, RAM, Load Average) bằng `htop`.
   * Phân tích và quản lý nhật ký hệ thống qua file log Nginx (`access.log`, `error.log`).

### CHƯƠNG / MỤC 5: SAO LƯU VÀ PHỤC HỒI HỆ THỐNG
1. **Chiến lược an toàn dữ liệu:**
   * Kế hoạch sao lưu định kỳ tự động hàng ngày lúc 02:00 sáng.
   * Chính sách lưu trữ và tự động dọn dẹp các bản sao lưu quá 7 ngày nhằm tối ưu dung lượng đĩa cứng.
2. **Tự động hóa sao lưu:**
   * Trình bày thuật toán và mã nguồn script `backup.sh`.
   * Thiết lập tác vụ định kỳ tự động thông qua Linux Daemon Cronjob (`crontab`).
3. **Quy trình phục hồi sau thảm họa (Disaster Recovery):**
   * Kịch bản xử lý sự cố khi mất mát dữ liệu hoặc hỏng CSDL.
   * Các bước trích xuất và nạp lại dữ liệu bằng script `restore.sh`.

---

## 6. CHECKLIST ẢNH CHỤP MINH CHỨNG CẦN LỒNG VÀO BÁO CÁO

| STT | Mục báo cáo | Lệnh thực thi / Màn hình chụp | Ý nghĩa kỹ thuật |
| :--- | :--- | :--- | :--- |
| 1 | Mục 2 | `node -v && nginx -v && pm2 -v` | Chứng minh các phần mềm đã cài đặt trên Linux |
| 2 | Mục 2 | `sudo ufw status` | Trạng thái tường lửa và các cổng được mở |
| 3 | Mục 3 | `cat /etc/nginx/sites-available/food-app` | File cấu hình Nginx Reverse Proxy |
| 4 | Mục 3 | `sudo nginx -t` | Cú pháp cấu hình Nginx hợp lệ |
| 5 | Mục 3 | `pm2 status` | Backend đang chạy ổn định ở chế độ cluster |
| 6 | Mục 3 | Trình duyệt: `http://localhost` | Frontend chạy thực tế qua Nginx |
| 7 | Mục 4 | Postman / `curl -I http://localhost/api/products` | Kiểm thử endpoint API qua Nginx Reverse Proxy |
| 8 | Mục 4 | `pm2 monit` | Giám sát CPU/RAM của backend theo thời gian thực |
| 9 | Mục 4 | `htop` | Giám sát toàn bộ tài nguyên của hệ điều hành Linux |
| 10 | Mục 4 | `tail -n 20 /var/log/nginx/access.log` | Nhật ký truy cập của người dùng trên Web Server |
| 11 | Mục 5 | `bash deployment/backup.sh` & `ls -lh backups/` | Thực thi sao lưu CSDL thành công ra file `.tar.gz` |
| 12 | Mục 5 | `crontab -l` | Lập lịch tự động sao lưu định kỳ trên Linux |
| 13 | Mục 5 | `bash deployment/restore.sh <file>` | Phục hồi thành công dữ liệu CSDL từ bản sao lưu |
