# GHI CHÚ KỸ THUẬT VÀ CẨM NANG VẬN HÀNH HỆ THỐNG (WSL2 LINUX)

Tài liệu này lưu trữ các sự cố thực tế đã khắc phục, đặc thù vận hành của WSL2 Ubuntu, và hướng dẫn quy trình vận hành hệ thống hàng ngày.

---

## 1. CÁC SỰ CỐ ĐÃ KHẮC PHỤC TRONG THỰC TẾ

### 1.1. Lỗi Nginx `404 Not Found` khi truy cập `http://localhost`
* **Nguyên nhân:** 
  1. Thư mục `frontend/dist` chưa được build hoặc trước đó lệnh `pnpm install` bị treo do cảnh báo `ERR_PNPM_IGNORED_BUILDS` với gói `core-js`.
  2. Nginx trỏ vào thư mục mặc định `/var/www/html` thay vì thư mục build tĩnh của React/Vite.
* **Cách đã xử lý:**
  * Build hoàn chỉnh `pnpm run build` trên thư mục `frontend/` sinh đầy đủ `dist/index.html`.
  * Cấu hình lại file `/etc/nginx/sites-available/food-app` trỏ `root` chính xác tới `/mnt/c/Users/ADMIN/Desktop/test-bandoan/frontend/dist`.
  * Thêm chỉ thị `try_files $uri $uri/ /index.html;` để các route React Router (SPA) không bị trả về 404 khi người dùng F5 tải lại trang.

### 1.2. Sai lệch đường dẫn khởi chạy Backend trong PM2
* **Nguyên nhân:** File cấu hình khởi chạy ban đầu trỏ vào `./src/index.js` trong khi cấu trúc mã nguồn thực tế của dự án sử dụng `backend/server.js` (nơi khởi tạo Socket.IO và nạp các route chính).
* **Cách đã xử lý:** Cập nhật lại `deployment/ecosystem.config.js` với `script: './server.js'` và `cwd: '/mnt/c/Users/ADMIN/Desktop/test-bandoan/backend'`.

### 1.3. Khả năng tương thích thư viện mã hóa `bcrypt` trên Linux
* **Nguyên nhân:** Thư viện `bcrypt` gốc cần biên dịch C++ native qua `node-gyp`. Nếu môi trường thiếu `python` hoặc `build-essential` sẽ gây crash tiến trình khi deploy.
* **Cách đã xử lý:** Dự án sử dụng `bcryptjs` (Pure JavaScript) trong `authController.js` và `userController.js`, loại bỏ hoàn toàn sự phụ thuộc vào trình biên dịch C++ native, đảm bảo chạy trơn tru 100% trên mọi bản phân phối Linux mà không bị lỗi module version mismatch.

---

## 2. ĐẶC THÙ VẬN HÀNH TRÊN WSL2 (UBUNTU)

1. **Cơ chế mạng localhost forwarding:**
   * WSL2 chia sẻ cổng mạng với Windows qua cơ chế `localhost forwarding`. 
   * Do đó, khi Nginx chạy trên cổng `80` trong WSL2, trên Windows bạn chỉ cần mở trình duyệt và gõ `http://localhost` là truy cập được ngay lập tức mà không cần tìm địa chỉ IP ảo của WSL.
2. **Kích hoạt `systemd`:**
   * WSL2 hiện đại đã hỗ trợ `systemd=true` trong `/etc/wsl.conf`.
   * Các lệnh quản trị dịch vụ tiêu chuẩn như `sudo systemctl start/stop/restart/status nginx` hoạt động chuẩn xác như một máy chủ Linux độc lập.
3. **Hành vi khi tắt máy Windows hoặc chạy `wsl --shutdown`:**
   * Khi máy tính Windows bị tắt hoặc khởi động lại, máy ảo WSL2 sẽ tạm dừng (`Stopped`).
   * Để hệ thống hoạt động trở lại bình thường, chỉ cần thực hiện 2 thao tác nhanh trong mục 3 dưới đây.

---

## 3. QUY TRÌNH BẬT / TẮT HỆ THỐNG AN TOÀN

### Khi muốn bật hệ thống để kiểm tra hoặc chấm điểm:
Mở PowerShell trên Windows và chạy lệnh sau (chỉ 1 dòng duy nhất):
```powershell
wsl -d Ubuntu -e bash -c "sudo systemctl start nginx; pm2 resurrect || pm2 start /mnt/c/Users/ADMIN/Desktop/test-bandoan/deployment/ecosystem.config.js"
```
* **Giải thích:** Lệnh trên sẽ tự động đánh thức WSL2, kích hoạt Nginx và khôi phục toàn bộ tiến trình Backend PM2 về trạng thái chạy ngầm.

### Khi muốn tắt hệ thống để tiết kiệm tài nguyên máy tính:
Mở PowerShell và chạy:
```powershell
wsl -d Ubuntu -e bash -c "pm2 stop all; sudo systemctl stop nginx"
wsl --shutdown
```

---

## 4. HƯỚNG DẪN TỰ CHỤP ĐỦ 13 ẢNH MINH CHỨNG CHO CUỐN BÁO CÁO

Để lấy đầy đủ ảnh dán vào báo cáo Word/Docs, bạn chỉ cần mở **Windows Terminal** (hoặc gõ `wsl -d Ubuntu`), chạy từng lệnh tương ứng dưới đây và dùng phím tắt `Windows + Shift + S` để chụp lại vùng terminal:

### Nhóm 1: Môi trường & Tường lửa (Mục 2 Báo cáo)
* **Ảnh 1 (Phiên bản phần mềm):**
  ```bash
  node -v && nginx -v && pm2 -v
  ```
* **Ảnh 2 (Tường lửa UFW):**
  ```bash
  sudo ufw status verbose
  ```

### Nhóm 2: Triển khai Website (Mục 3 Báo cáo)
* **Ảnh 3 (Cấu hình Nginx):**
  ```bash
  cat /etc/nginx/sites-available/food-app
  ```
* **Ảnh 4 (Kiểm tra cú pháp Nginx):**
  ```bash
  sudo nginx -t
  ```
* **Ảnh 5 (Trạng thái PM2 Cluster):**
  ```bash
  pm2 status
  ```
* **Ảnh 6 (Giao diện Web hoạt động):**
  Mở trình duyệt Chrome/Edge truy cập `http://localhost`, chụp toàn bộ giao diện trang chủ website.

### Nhóm 3: Kiểm thử & Quản trị hệ thống (Mục 4 Báo cáo)
* **Ảnh 7 (Kiểm thử gọi API):**
  ```bash
  curl -i http://localhost/api/products | head -n 20
  ```
* **Ảnh 8 (Giám sát PM2 thời gian thực):**
  ```bash
  pm2 monit
  ```
  *(Bấm `q` để thoát sau khi chụp)*
* **Ảnh 9 (Giám sát tài nguyên Linux htop):**
  ```bash
  htop
  ```
  *(Bấm `q` để thoát sau khi chụp)*
* **Ảnh 10 (Nhật ký truy cập Nginx):**
  ```bash
  tail -n 20 /var/log/nginx/access.log
  ```

### Nhóm 4: Sao lưu & Phục hồi CSDL (Mục 5 Báo cáo)
* **Ảnh 11 (Chạy sao lưu CSDL):**
  ```bash
  bash deployment/backup.sh && ls -lh backups/
  ```
* **Ảnh 12 (Lập lịch tự động Cronjob):**
  ```bash
  crontab -l
  ```
* **Ảnh 13 (Mã nguồn script phục hồi):**
  ```bash
  cat deployment/restore.sh
  ```
