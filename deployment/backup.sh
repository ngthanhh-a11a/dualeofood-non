#!/usr/bin/env bash
set -e

# ============================================================
# SCRIPT SAO LƯU CƠ SỞ DỮ LIỆU TỰ ĐỘNG (MONGODB DUMP)
# ============================================================

BACKUP_DIR="/mnt/c/Users/ADMIN/Desktop/test-bandoan/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TARGET_DIR="${BACKUP_DIR}/dump_${TIMESTAMP}"
ARCHIVE_NAME="${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz"
RETENTION_DAYS=7

# Lấy MONGO_URI từ file .env nếu có, nếu không thì dùng mặc định
ENV_FILE="/mnt/c/Users/ADMIN/Desktop/test-bandoan/backend/.env"
if [ -f "$ENV_FILE" ]; then
    MONGO_URI=$(grep -E '^MONGO_URI=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi

if [ -z "$MONGO_URI" ]; then
    MONGO_URI="mongodb://localhost:27017/dualeo_food"
fi

echo "[$(date)] Bắt đầu tiến trình sao lưu..."
mkdir -p "$BACKUP_DIR"

# 1. Trích xuất CSDL bằng mongodump
echo "[$(date)] Đang trích xuất dữ liệu CSDL..."
mongodump --uri="$MONGO_URI" --out="$TARGET_DIR" --quiet

# 2. Nén bản sao lưu
echo "[$(date)] Đang nén dữ liệu thành file ${ARCHIVE_NAME}..."
tar -czf "$ARCHIVE_NAME" -C "$BACKUP_DIR" "dump_${TIMESTAMP}"
rm -rf "$TARGET_DIR"

# 3. Dọn dẹp các bản sao lưu cũ hơn RETENTION_DAYS ngày
echo "[$(date)] Dọn dẹp các bản sao lưu cũ hơn ${RETENTION_DAYS} ngày..."
find "$BACKUP_DIR" -type f -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Sao lưu hoàn tất thành công: ${ARCHIVE_NAME}"
