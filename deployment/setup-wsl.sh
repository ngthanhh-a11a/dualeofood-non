#!/usr/bin/env bash
set -e

# ============================================================
# SCRIPT CÀI ĐẶT MÔI TRƯỜNG & KHỞI CHẠY HỆ THỐNG TRÊN WSL2 UBUNTU
# ============================================================

echo "=== 1. Cập nhật hệ thống Ubuntu ==="
sudo apt update && sudo apt upgrade -y

echo "=== 2. Cài đặt các gói công cụ cần thiết ==="
sudo apt install -y curl wget git nginx ufw htop tar

echo "=== 3. Cài đặt Node.js LTS (v20) & PM2 ==="
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
sudo npm install -g pm2 pnpm

echo "=== 4. Cài đặt MongoDB Database Tools (mongodump, mongorestore) ==="
if ! command -v mongodump &> /dev/null; then
    sudo apt install -y mongo-tools || {
        wget -q https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2204-x86_64-100.9.4.deb
        sudo dpkg -i mongodb-database-tools-ubuntu2204-x86_64-100.9.4.deb || sudo apt -f install -y
        rm -f mongodb-database-tools-ubuntu2204-x86_64-100.9.4.deb
    }
fi

echo "=== 5. Cấu hình Nginx ==="
sudo cp /mnt/c/Users/ADMIN/Desktop/test-bandoan/deployment/nginx.conf /etc/nginx/sites-available/food-app
sudo ln -sf /etc/nginx/sites-available/food-app /etc/nginx/sites-enabled/food-app
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx || sudo service nginx restart

echo "=== 6. Cấp quyền thực thi cho các script ==="
chmod +x /mnt/c/Users/ADMIN/Desktop/test-bandoan/deployment/*.sh

echo "============================================================"
echo "CÀI ĐẶT HOÀN TẤT!"
echo "Node.js: $(node -v)"
echo "Nginx: $(nginx -v 2>&1)"
echo "PM2: $(pm2 -v)"
echo "============================================================"
