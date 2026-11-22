# KỊCH BẢN THUYẾT TRÌNH VÀ DEMO HỆ THỐNG THỰC TẾ (CĐTN2)
**Thời lượng dự kiến:** 8 - 10 phút  
**Hình thức trình bày:** Vừa thao tác trực tiếp trên màn hình vừa thuyết minh (Live Demo)

---

## 1. CHUẨN BỊ TRƯỚC KHI BẮT ĐẦU BUỔI BẢO VỆ

1. **Giao diện 1 (Trình duyệt):** Mở sẵn 2 tab:
   * Tab 1: `http://localhost` (Giao diện người dùng Web Dưa Leo Food).
   * Tab 2: `http://localhost/api/products` (Kiểm tra trả dữ liệu API).
2. **Giao diện 2 (Terminal Linux / Windows Terminal):** Bật sẵn cửa sổ Ubuntu WSL2 chia làm 2 ô (Split screen nếu dùng Windows Terminal):
   * Ô 1: Sẵn sàng gõ lệnh quản trị (`pm2`, `nginx`, `curl`).
   * Ô 2: Sẵn sàng xem log (`tail -f /var/log/nginx/access.log` hoặc `pm2 monit`).

---

## 2. KỊCH BẢN CHI TIẾT (TỪNG PHÚT - THAO TÁC & LỜI NÓI)

### PHẦN 1: MỞ ĐẦU & TỔNG QUAN KIẾN TRÚC HỆ THỐNG (1 Phút)

* **[THAO TÁC TRÊN MÀN HÌNH]:** 
  * Chiếu slide hoặc mở sơ đồ kiến trúc hệ thống 3 lớp trong file tài liệu.
* **[LỜI THUYẾT TRÌNH]:**
  > "Kính thưa Thầy Cô trong Hội đồng, hôm nay nhóm em xin trình bày kết quả triển khai và vận hành hệ thống Website Bán đồ ăn trực tuyến cho môn Chuyên đề tốt nghiệp 2.
  >
  > Thay vì chỉ triển khai đóng gói tự động trên các nền tảng PaaS, toàn bộ hệ thống của nhóm em được triển khai thực tế trên nền tảng **Hệ điều hành Linux (Ubuntu 26.04 LTS)** nhằm đáp ứng trọn vẹn yêu cầu về Quản trị hệ thống. 
  > 
  > Kiến trúc gồm 4 thành phần chính:
  > 1. **Nginx 1.28.3:** Đóng vai trò Web Server phục vụ Frontend tĩnh (Vite React SPA) và Reverse Proxy chuyển tiếp request.
  > 2. **Backend Node.js:** Được quản lý bởi **PM2 7.1.2** vận hành ở chế độ **Cluster Mode** trên 12 nhân CPU.
  > 3. **Database:** Cơ sở dữ liệu đám mây MongoDB Atlas kết nối qua TLS.
  > 4. **Hệ thống sao lưu tự động:** Sử dụng Bash Script kết hợp Cronjob định kỳ hàng ngày. Sau đây em xin phép đi vào phần Live Demo chi tiết từng phân hệ."

---

### PHẦN 2: DEMO WEBSITE VÀ REVERSE PROXY NGINX (2 Phút)

* **[THAO TÁC TRÊN MÀN HÌNH]:**
  1. Chuyển sang trình duyệt tại địa chỉ `http://localhost`.
  2. Bấm lướt menu, click vào chi tiết 1 món ăn, thêm vào giỏ hàng.
  3. Bấm `F5` tải lại trang tại một đường link con (ví dụ: `http://localhost/cart` hoặc `/menu`).
  4. Chuyển sang Tab `http://localhost/api/products` để hiển thị dữ liệu JSON.
* **[LỜI THUYẾT TRÌNH]:**
  > "Đầu tiên, hệ thống web đang chạy tại cổng 80 chuẩn HTTP thông qua Nginx Web Server.
  >
  > Khi em truy cập vào các đường dẫn con của ứng dụng Single Page Application và bấm F5 tải lại trang, trang web vẫn nạp bình thường và không hề bị lỗi 404. Điều này đạt được nhờ nhóm đã cấu hình chỉ thị `try_files $uri $uri/ /index.html;` trong file Virtual Host của Nginx.
  >
  > Đồng thời, toàn bộ các truy vấn dữ liệu bắt đầu bằng `/api/` không gọi trực tiếp cổng 5000 mà được Nginx làm **Reverse Proxy** chuyển tiếp an toàn vào Backend nội bộ. Điều này giúp giấu cổng thực tế của Backend, bảo vệ hệ thống trước các cuộc tấn công dò quét cổng."

---

### PHẦN 3: DEMO QUẢN TRỊ TIẾN TRÌNH VỚI PM2 CLUSTER (2 Phút)

* **[THAO TÁC TRÊN MÀN HÌNH]:**
  1. Chuyển sang Terminal Linux, gõ lệnh:
     ```bash
     pm2 status
     ```
  2. Gõ tiếp lệnh để mở giao diện giám sát thời gian thực:
     ```bash
     pm2 monit
     ```
* **[LỜI THUYẾT TRÌNH]:**
  > "Tiếp theo là phần Quản trị Backend. Như Thầy Cô thấy trên màn hình bảng `pm2 status`, Backend không chạy dưới dạng một tiến trình đơn lẻ thông thường mà đang chạy ở chế độ **Cluster Mode** với **12 workers** tương ứng 12 nhân vCPU của máy chủ.
  >
  > Ưu điểm của mô hình này là:
  > - Tự động cân bằng tải (Load Balancing) giữa các nhân CPU.
  > - Cơ chế **Zero-Downtime**: Khi nhóm em cần cập nhật code (reload), PM2 sẽ khởi động lại từng worker nối tiếp nhau, đảm bảo người dùng không bị gián đoạn dịch vụ.
  > - Tự động phục hồi (Auto-restart): Nếu một worker gặp lỗi crash hoặc tiêu thụ bộ nhớ vượt ngưỡng 500MB, PM2 sẽ tự động giải phóng và khởi chạy lại tiến trình đó ngay lập tức mà 11 worker còn lại vẫn phục vụ khách hàng bình thường."
* **[THAO TÁC TRÊN MÀN HÌNH]:**
  * Bấm phím `q` trên terminal để thoát khỏi `pm2 monit`.

---

### PHẦN 4: DEMO CHỊU TẢI (STRESS TEST) & QUẢN TRỊ LOG (2 Phút)

* **[THAO TÁC TRÊN MÀN HÌNH]:**
  1. Trên Terminal, gõ lệnh gửi đồng thời 50 requests vào hệ thống:
     ```bash
     for i in {1..50}; do curl -s -o /dev/null -w "%{http_code} " http://localhost/api/products & done; wait; echo ""
     ```
  2. Chờ 1-2 giây để terminal in ra một hàng 50 mã `200`.
  3. Gõ lệnh kiểm tra lại trạng thái PM2:
     ```bash
     pm2 status
     ```
  4. Mở xem log truy cập Nginx:
     ```bash
     tail -n 10 /var/log/nginx/access.log
     ```
* **[LỜI THUYẾT TRÌNH]:**
  > "Bây giờ em sẽ thực hiện bài kiểm tra độ ổn định và chịu tải tức thời bằng cách phát sinh **50 request đồng thời** vào API lấy danh sách sản phẩm.
  >
  > Kết quả trả về: Toàn bộ 50 request đều phản hồi mã **HTTP 200 OK** thành công 100%.
  >
  > Khi kiểm tra lại bảng `pm2 status`, chỉ số khởi động lại ở cột `↺` vẫn duy trì bằng **0**, mức tiêu thụ RAM ổn định ở mức ~94MB mỗi tiến trình, không có hiện tượng rò rỉ bộ nhớ (Memory Leak).
  >
  > Đồng thời, file `access.log` của Nginx ghi nhận chi tiết thời gian, địa chỉ IP và mã trạng thái của các request vừa gửi, giúp quản trị viên có thể truy vết lưu lượng khi cần audit hệ thống."

---

### PHẦN 5: DEMO BẢO MẬT TƯỜNG LỬA & SAO LƯU DỮ LIỆU (2 Phút)

* **[THAO TÁC TRÊN MÀN HÌNH]:**
  1. Kiểm tra trạng thái tường lửa:
     ```bash
     sudo ufw status verbose
     ```
  2. Chạy thử nghiệm sao lưu CSDL ngay tại chỗ:
     ```bash
     bash deployment/backup.sh
     ```
  3. Liệt kê file sao lưu vừa tạo:
     ```bash
     ls -lh backups/
     ```
  4. Mở xem lịch sao lưu tự động Cronjob:
     ```bash
     crontab -l
     ```
* **[LỜI THUYẾT TRÌNH]:**
  > "Về khía cạnh An toàn và Phục hồi dữ liệu:
  > 
  > 1. **Về an ninh:** Tường lửa **UFW** trên Linux đang ở trạng thái kích hoạt (`active`). Mặc định từ chối toàn bộ kết nối đi vào (`Default: deny incoming`), chỉ mở đúng 3 cổng được kiểm soát: Cổng 22 cho SSH, Cổng 80 cho HTTP và Cổng 443 cho HTTPS.
  >
  > 2. **Về sao lưu tự động:** Nhóm em đã xây dựng script tự động hóa `backup.sh`. Khi em vừa thực thi lệnh, script đã kết nối MongoDB Atlas bằng công cụ `mongodump`, xuất toàn bộ CSDL và nén thành file `tar.gz` dung lượng chỉ **28KB** trong vòng 3 giây. Script này cũng tích hợp cơ chế tự động dọn dẹp các bản sao lưu cũ quá 7 ngày để tối ưu dung lượng đĩa cứng.
  >
  > 3. **Về lập lịch:** Qua lệnh `crontab -l`, hệ thống được cấu hình tự động chạy bản backup này vào lúc **02:00 sáng mỗi ngày** và ghi log đầy đủ, đảm bảo mục tiêu RPO (Recovery Point Objective) an toàn dữ liệu trong vòng 24h.
  >
  > Khi xảy ra sự cố thảm họa, nhóm có sẵn script `restore.sh` cho phép giải nén và nạp lại toàn bộ CSDL bằng lệnh `mongorestore` chỉ trong vài giây."

---

### PHẦN 6: KẾT LUẬN & SẴN SÀNG HỎI ĐÁP (1 Phút)

* **[THAO TÁC TRÊN MÀN HÌNH]:**
  * Dừng màn hình ở terminal hiển thị `pm2 status` hoặc trang chủ website.
* **[LỜI THUYẾT TRÌNH]:**
  > "Dạ thưa Thầy Cô, phần trình bày của nhóm em đã chứng minh hệ thống hoạt động ổn định, đạt đầy đủ 5 tiêu chí về Kiến trúc, Cấu hình môi trường, Triển khai thực tế trên Linux, Giám sát vận hành và Sao lưu phục hồi thảm họa.
  > 
  > Em xin chân thành cảm ơn Thầy Cô đã lắng nghe và nhóm em rất mong nhận được những câu hỏi góp ý từ Hội đồng ạ!"

---

## 3. CÂU HỎI THƯỜNG GẶP CỦA HỘI ĐỒNG & CÁCH TRẢ LỜI TỰ TIN

| Câu hỏi của Giảng viên | Bản chất câu hỏi | Câu trả lời chuẩn xác |
| :--- | :--- | :--- |
| **1. Tại sao dùng WSL2 mà không thuê VPS thật?** | Kiểm tra hiểu biết về ảo hóa & tính tương đương. | *"Dạ thưa Thầy, WSL2 sử dụng nhân Linux thật (Real Linux Kernel) chạy trên Hyper-V của Microsoft, có đầy đủ systemd, Nginx, UFW và PM2 tương đương 100% với một máy chủ VPS Ubuntu. Nhóm dùng WSL2 để chủ động môi trường thực hành nội bộ mà không phát sinh chi phí duy trì hàng tháng."* |
| **2. Nếu máy chủ bị cúp điện hoặc khởi động lại thì PM2 có tự chạy lại không?** | Kiểm tra kỹ năng Startup script của PM2. | *"Dạ có. Nhóm đã cấu hình lệnh `pm2 startup` để đăng ký service với systemd của Ubuntu và chạy `pm2 save` để lưu snapshot tiến trình. Khi máy chủ khởi động lại, systemd sẽ tự động phục hồi toàn bộ 12 workers của Backend."* |
| **3. Nginx Reverse Proxy có ưu điểm gì so với việc mở trực tiếp cổng 5000 cho Client gọi?** | Kiểm tra kiến thức mạng & bảo mật. | *"Dạ thứ nhất là về bảo mật: Không làm lộ cổng nội bộ của ứng dụng ra Internet. Thứ hai là hiệu năng: Nginx xử lý các kết nối tĩnh, nén Gzip và đệm request nhanh hơn rất nhiều so với Node.js. Thứ ba là dễ dàng mở rộng cấu hình SSL HTTPS tập trung tại Nginx."* |
| **4. Nếu hacker tấn công làm sập 1 worker trong PM2 thì website có bị ngưng hoạt động không?** | Kiểm tra hiểu biết về Cluster Mode & High Availability. | *"Dạ không. Nhóm cấu hình 12 workers độc lập. Khi 1 worker gặp lỗi ngoại lệ (uncaught exception) và dừng lại, PM2 sẽ kích hoạt cơ chế autorestart trong vài mili-giây, trong khi 11 workers còn lại vẫn tiếp tục phục vụ các kết nối của người dùng mà không gây gián đoạn."* |
