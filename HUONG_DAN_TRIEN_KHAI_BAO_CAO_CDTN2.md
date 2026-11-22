# HƯỚNG DẪN CHI TIẾT NỘI DUNG BÁO CÁO & TRIỂN KHAI HỆ THỐNG TRÊN LINUX (WSL2 / UBUNTU) - CĐTN2

Tài liệu này chuẩn hóa toàn bộ quy trình triển khai thực tế trên môi trường **Linux (WSL2 Ubuntu)** và cung cấp số liệu thực nghiệm, kết quả đo kiểm, cùng dàn ý 5 mục báo cáo cho môn Chuyên đề tốt nghiệp 2 (CĐTN2).

---

## 1. THÔNG SỐ HẠ TẦNG VÀ MÔI TRƯỜNG THỰC TẾ

| Thành phần | Phiên bản thực tế | Ghi chú kỹ thuật |
| :--- | :--- | :--- |
| **Hệ điều hành** | Ubuntu 26.04 LTS (x86_64) | Chạy trên nhân Linux 6.18 Microsoft WSL2, đã kích hoạt `systemd` |
| **Web Server** | Nginx 1.28.3 | Đóng vai trò Web Server phục vụ SPA và Reverse Proxy cho API |
| **Runtime** | Node.js v20.20.2 (LTS) & npm 10.8.2 / pnpm 10.4.1 | Chạy nền tảng JavaScript phía máy chủ |
| **Process Manager** | PM2 7.1.2 | Quản lý tiến trình Backend dạng Cluster (12 instances tương ứng 12 vCPUs) |
| **Database** | MongoDB Atlas (Cluster M0) | Kết nối bảo mật qua giao thức TLS/SRV |
| **Database Tools**| MongoDB Tools 100.9.4 | Hỗ trợ tiện ích `mongodump` và `mongorestore` |
| **Tường lửa** | UFW (Uncomplicated Firewall) | Đã cấu hình và kích hoạt mở các cổng 22, 80, 443 |

---

## 2. KIẾN TRÚC HỆ THỐNG TRIỂN KHAI THỰC TẾ

```
[ Trình duyệt / Client (Windows / Cùng mạng) ]
                       │
                       │ (HTTP - Port 80)
                       ▼
┌────────────────────────────────────────────────────────┐
│ MÁY CHỦ LINUX (WSL2 UBUNTU)                            │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ NGINX 1.28.3 (Web Server & Reverse Proxy)        │  │
│  │  - Static Root: /frontend/dist (Vite React SPA)  │  │
│  │  - Proxy: /api/* -> http://127.0.0.1:5000/api/   │  │
│  │  - Proxy: /socket.io/* -> WS 127.0.0.1:5000      │  │
│  │  - Bật Gzip compression, Header Forwarding       │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         │                              │
│                         ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ BACKEND NODE.JS (Quản lý bởi PM2 Cluster 7.1.2)  │  │
│  │  - File thực thi: backend/server.js              │  │
│  │  - 12 instances chạy tải cân bằng tại Port 5000  │  │
│  │  - Tự động restart khi crash / RAM > 500MB       │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         │                              │
│                         ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ DATABASE MONGODB ATLAS (Cloud Cluster)           │  │
│  │  - Kết nối bảo mật TLS qua chuỗi srv connection  │  │
│  └──────────────────────────────────────────────────┘  │
│                         ▲                              │
│                         │                              │
│  ┌──────────────────────┴───────────────────────────┐  │
│  │ CRONJOB + BASH SCRIPT (Sao lưu tự động)          │  │
│  │  - Lập lịch tự động 02:00 sáng hàng ngày         │  │
│  │  - mongodump xuất dữ liệu -> nén backup_*.tar.gz │  │
│  │  - Tự động thanh lọc bản ghi cũ quá 7 ngày       │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 3. BẢNG BIẾN MÔI TRƯỜNG HỆ THỐNG (`.env`)

> [!CAUTION]
> **Quy tắc an toàn thông tin đồ án:** Tuyệt đối che mờ (`***`) các chuỗi bí mật, mật khẩu và token xác thực trong báo cáo.

| Tên biến | Kiểu dữ liệu | Giá trị hiển thị trong báo cáo | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `PORT` | Number | `5000` | Cổng nội bộ Backend Node.js lắng nghe |
| `MONGO_URI` | String | `mongodb+srv://admin_user:****************@cluster0.mongodb.net/dualeo_food` | Chuỗi kết nối bảo mật tới MongoDB Atlas |
| `JWT_SECRET` | String | `********************************` | Khóa bí mật ký và xác thực JSON Web Token |
| `JWT_EXPIRES_IN`| String | `7d` | Thời gian sống của phiên đăng nhập người dùng |
| `NODE_ENV` | String | `production` | Chế độ vận hành tối ưu hiệu năng |
| `CLIENT_URL` | String | `http://localhost` | Địa chỉ nguồn Client được phép truy vấn CORS |

---

## 4. DÀN Ý 5 MỤC CHUẨN ĐỒ ÁN KÈM SỐ LIỆU ĐO KIỂM THỰC TẾ

### MỤC 1: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG
1. **Kiến trúc phân tầng:** Mô hình 3 lớp (Client Layer $\rightarrow$ Application/Proxy Layer $\rightarrow$ Database Layer).
2. **Thiết kế CSDL (Collections):** 
   * `users`: Phân quyền RBAC (`user`, `staff`, `admin`).
   * `products`, `categories`: Quản lý danh mục và thực đơn món ăn.
   * `orders`: Lưu trữ đơn hàng, phương thức thanh toán, tọa độ giao nhận.
   * `settings`: Cấu hình cửa hàng và cơ chế xóa đơn tự động.
3. **Luồng dữ liệu thời gian thực:** Giao tiếp qua WebSocket (`socket.io`) đồng bộ trạng thái đơn hàng giữa Thu ngân - Bếp - Khách hàng.

---

### MỤC 2: CÀI ĐẶT VÀ CẤU HÌNH MÔI TRƯỜNG LINUX
1. **Hạ tầng máy chủ:** Trình bày về hệ điều hành Ubuntu 26.04 LTS trên WSL2 với `systemd=true`.
2. **Cấu hình an ninh tường lửa UFW:**
   * Trạng thái thực tế: `Status: active`.
   * Cổng mở: 22/tcp (SSH), 80/tcp (HTTP), 443/tcp (HTTPS).
   * Chính sách mặc định: Chặn toàn bộ luồng vào không mong muốn (`Default: deny (incoming)`), cho phép luồng ra (`Default: allow (outgoing)`).

> **[CHÈN ẢNH MINH CHỨNG 1]**: Ảnh chụp terminal gõ lệnh:
> ```bash
> node -v && nginx -v && pm2 -v
> ```
> *Kết quả mong đợi: Hiển thị Node.js v20.20.2, Nginx 1.28.3, PM2 7.1.2.*

> **[CHÈN ẢNH MINH CHỨNG 2]**: Ảnh chụp terminal gõ lệnh:
> ```bash
> sudo ufw status verbose
> ```
> *Kết quả mong đợi: Status: active, các cổng 22, 80, 443 ALLOW IN.*

---

### MỤC 3: TRIỂN KHAI WEBSITE (DEPLOYMENT)
1. **Quy trình triển khai Frontend (Vite SPA):**
   * Đóng gói tĩnh bằng `pnpm run build` sinh thư mục `frontend/dist`.
   * Cấu hình Nginx phục vụ tĩnh tại đường dẫn `/mnt/c/Users/ADMIN/Desktop/test-bandoan/frontend/dist`.
   * Xử lý định tuyến SPA bằng chỉ thị `try_files $uri $uri/ /index.html;` khắc phục triệt để lỗi 404 khi tải lại trang con.
2. **Quy trình triển khai Backend (Node.js & PM2):**
   * Sử dụng cấu hình `deployment/ecosystem.config.js` khởi chạy file gốc `backend/server.js`.
   * Cơ chế Cluster Mode tận dụng tối đa 12 nhân vCPU giúp tăng thông lượng xử lý.
3. **Cấu hình Nginx Reverse Proxy:**
   * Định tuyến toàn bộ tiền tố `/api/` về Backend tại `http://127.0.0.1:5000/api/`.
   * Hỗ trợ Header chuyển tiếp nâng cao (`X-Real-IP`, `X-Forwarded-For`, `Upgrade WebSocket`).

> **[CHÈN ẢNH MINH CHỨNG 3]**: Ảnh chụp file cấu hình Nginx:
> ```bash
> cat /etc/nginx/sites-available/food-app
> ```

> **[CHÈN ẢNH MINH CHỨNG 4]**: Ảnh kiểm tra cú pháp Nginx:
> ```bash
> sudo nginx -t
> ```
> *Kết quả mong đợi: syntax is ok, test is successful.*

> **[CHÈN ẢNH MINH CHỨNG 5]**: Ảnh chụp bảng quản lý tiến trình PM2:
> ```bash
> pm2 status
> ```
> *Kết quả mong đợi: 12 instances food-backend đều hiển thị online, ↺ = 0.*

> **[CHÈN ẢNH MINH CHỨNG 6]**: Ảnh chụp màn hình trình duyệt:
> Truy cập `http://localhost` hiển thị đầy đủ giao diện trang chủ website.

---

### MỤC 4: KIỂM THỬ VÀ QUẢN TRỊ HỆ THỐNG (SỐ LIỆU ĐO KIỂM THỰC TẾ)

#### 1. Bảng số liệu kiểm thử phản hồi Endpoint (Health Check & API Testing)

| Endpoint | Giao thức / Cổng | HTTP Status | Thời gian phản hồi thực tế | Đánh giá |
| :--- | :--- | :--- | :--- | :--- |
| `http://localhost/` | HTTP / 80 (Nginx Frontend) | `200 OK` | `0.002s` (< 5ms) | Đạt (Tải trang tức thì) |
| `http://localhost/api/products` | HTTP / 80 -> Proxy 5000 | `200 OK` | `0.272s` | Đạt (Trả về danh sách món ăn JSON) |
| `http://localhost/api/categories` | HTTP / 80 -> Proxy 5000 | `200 OK` | `0.071s` | Đạt (Tốc độ xử lý CSDL tối ưu) |
| `http://localhost/api/settings/public` | HTTP / 80 -> Proxy 5000 | `200 OK` | `0.064s` | Đạt (Dữ liệu cấu hình cửa hàng) |

#### 2. Kết quả kiểm thử chịu tải đồng thời (Stress Test 50 Requests Concurrent)
* **Số lượng request gửi đồng thời:** 50 requests vào endpoint `/api/products`.
* **Tỷ lệ thành công:** **100% (50/50 requests trả về HTTP 200 OK)**, không có request nào bị timeout hay drop connection.
* **Mức tiêu thụ tài nguyên máy chủ:**
  * CPU: Giao động từ `0%` (idle) lên tối đa `4.1%` khi chịu tải đỉnh.
  * RAM: Trung bình mỗi worker PM2 chiếm `~93MB - 96MB` (tổng tải RAM hệ thống ở mức `18.8%`).
  * Trạng thái tiến trình: Cột restart (`↺`) giữ nguyên số `0`, chứng minh Backend không bị crash hay tràn bộ nhớ.
* **Nhật ký Nginx (`/var/log/nginx/error.log`):** Không phát sinh lỗi `502 Bad Gateway` hay `504 Gateway Timeout`.

> **[CHÈN ẢNH MINH CHỨNG 7]**: Ảnh kiểm thử gọi API qua lệnh terminal:
> ```bash
> curl -s -o /dev/null -w "Status: %{http_code} | Time: %{time_total}s\n" http://localhost/api/products
> ```

> **[CHÈN ẢNH MINH CHỨNG 8]**: Ảnh chụp màn hình giám sát thời gian thực:
> ```bash
> pm2 monit
> ```
> *Hiển thị đồ thị CPU và mức tiêu thụ Memory của các instances.*

> **[CHÈN ẢNH MINH CHỨNG 9]**: Ảnh chụp công cụ quản trị tài nguyên toàn máy chủ:
> ```bash
> htop
> ```

> **[CHÈN ẢNH MINH CHỨNG 10]**: Ảnh xem nhật ký truy cập Nginx:
> ```bash
> tail -n 20 /var/log/nginx/access.log
> ```
> *Ghi nhận địa chỉ IP Client, mã 200 và chuỗi User-Agent.*

---

### MỤC 5: SAO LƯU VÀ PHỤC HỒI HỆ THỐNG (BACKUP & RECOVERY)

#### 1. Thực nghiệm sao lưu tự động bằng Bash Script
* Script vận hành: `deployment/backup.sh`.
* Công cụ cốt lõi: `mongodump` kết nối trực tiếp chuỗi bảo mật MongoDB Atlas.
* Kết quả trích xuất thực tế:
  * Thư mục dump được đóng gói và nén định dạng: `backup_YYYYMMDD_HHMMSS.tar.gz`.
  * **Dung lượng file backup thực tế đo được:** **`28KB`** (đã nén toàn bộ collections `users`, `products`, `orders`, `settings`).
  * Thời gian hoàn thành sao lưu: **`~3 giây`**.
  * Chính sách dọn dẹp: Tự động xóa các file backup có tuổi thọ lớn hơn 7 ngày (`find -mtime +7 -delete`).

#### 2. Lập lịch tự động bằng Linux Cronjob
* Cấu hình cronjob tự động chạy hàng ngày lúc 02:00 sáng:
  ```text
  0 2 * * * /bin/bash /mnt/c/Users/ADMIN/Desktop/test-bandoan/deployment/backup.sh >> /mnt/c/Users/ADMIN/Desktop/test-bandoan/backups/backup.log 2>&1
  ```

#### 3. Quy trình phục hồi dữ liệu từ bản sao lưu (Disaster Recovery)
* Script vận hành: `deployment/restore.sh`.
* Lệnh phục hồi thực tế:
  ```bash
  bash deployment/restore.sh /mnt/c/Users/ADMIN/Desktop/test-bandoan/backups/backup_20261123_004818.tar.gz
  ```
* Cơ chế: Giải nén file nén tạm thời, gọi `mongorestore --drop` để làm sạch dữ liệu lỗi và tái thiết lập toàn bộ collections về trạng thái an toàn, sau đó xóa thư mục tạm để bảo mật.

> **[CHÈN ẢNH MINH CHỨNG 11]**: Ảnh thực thi script backup thành công:
> ```bash
> bash deployment/backup.sh && ls -lh backups/
> ```
> *Hiển thị file `backup_*.tar.gz` dung lượng 28K.*

> **[CHÈN ẢNH MINH CHỨNG 12]**: Ảnh hiển thị cấu hình lịch trình định kỳ:
> ```bash
> crontab -l
> ```

> **[CHÈN ẢNH MINH CHỨNG 13]**: Ảnh kiểm tra cú pháp script phục hồi:
> ```bash
> bash -n deployment/restore.sh
> ```

---

## 5. TỔNG KẾT BẢNG 13 ẢNH MINH CHỨNG

| Mã ảnh | Mục báo cáo | Lệnh Terminal chụp minh chứng | Kết quả quan trọng cần hiển thị |
| :--- | :--- | :--- | :--- |
| **Ảnh 1** | Mục 2 | `node -v && nginx -v && pm2 -v` | Node v20.20.2, Nginx 1.28.3, PM2 7.1.2 |
| **Ảnh 2** | Mục 2 | `sudo ufw status verbose` | Status: active, cổng 22, 80, 443 |
| **Ảnh 3** | Mục 3 | `cat /etc/nginx/sites-available/food-app` | File cấu hình Nginx reverse proxy |
| **Ảnh 4** | Mục 3 | `sudo nginx -t` | syntax is ok, test is successful |
| **Ảnh 5** | Mục 3 | `pm2 status` | 12 instances online, 0 restart |
| **Ảnh 6** | Mục 3 | Trình duyệt `http://localhost` | Giao diện trang chủ ứng dụng Web |
| **Ảnh 7** | Mục 4 | `curl -I http://localhost` & test API | HTTP/1.1 200 OK |
| **Ảnh 8** | Mục 4 | `pm2 monit` | Biểu đồ tiêu thụ CPU & RAM của PM2 |
| **Ảnh 9** | Mục 4 | `htop` | Tổng thể tài nguyên phần cứng Linux |
| **Ảnh 10**| Mục 4 | `tail -n 20 /var/log/nginx/access.log` | Nhật ký truy cập các request 200 |
| **Ảnh 11**| Mục 5 | `bash deployment/backup.sh; ls -lh backups/` | File backup .tar.gz (28KB) |
| **Ảnh 12**| Mục 5 | `crontab -l` | Dòng tác vụ cron sao lưu lúc 02:00 sáng |
| **Ảnh 13**| Mục 5 | `cat deployment/restore.sh` | Mã nguồn kịch bản phục hồi dữ liệu CSDL |
