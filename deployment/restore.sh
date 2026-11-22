#!/usr/bin/env bash
set -e

# ============================================================
# SCRIPT PHỤC HỒI CƠ SỞ DỮ LIỆU TỪ BẢN SAO LƯU (MONGODB RESTORE)
# Cách dùng: ./restore.sh <đường_dẫn_file_backup.tar.gz>
# ============================================================

BACKUP_FILE="$1"
BACKUP_DIR="/mnt/c/Users/ADMIN/Desktop/test-bandoan/backups"
TEMP_RESTORE_DIR="${BACKUP_DIR}/temp_restore"

if [ -z "$BACKUP_FILE" ]; then
    echo "Lỗi: Vui lòng truyền đường dẫn file sao lưu cần phục hồi."
    echo "Ví dụ: ./restore.sh /mnt/c/Users/ADMIN/Desktop/test-bandoan/backups/backup_20261122.tar.gz"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Lỗi: Không tìm thấy file sao lưu tại $BACKUP_FILE"
    exit 1
fi

ENV_FILE="/mnt/c/Users/ADMIN/Desktop/test-bandoan/backend/.env"
if [ -f "$ENV_FILE" ]; then
    MONGO_URI=$(grep -E '^MONGO_URI=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi

if [ -z "$MONGO_URI" ]; then
    MONGO_URI="mongodb://localhost:27017/dualeo_food"
fi

echo "[$(date)] Đang giải nén file sao lưu..."
mkdir -p "$TEMP_RESTORE_DIR"
tar -xzf "$BACKUP_FILE" -C "$TEMP_RESTORE_DIR"

DUMP_FOLDER=$(find "$TEMP_RESTORE_DIR" -mindepth 1 -maxdepth 2 -type d -name "dump_*" | head -n 1)

if [ -z "$DUMP_FOLDER" ]; then
    DUMP_FOLDER="$TEMP_RESTORE_DIR"
fi

echo "[$(date)] Đang phục hồi dữ liệu vào MongoDB bằng mongorestore..."
mongorestore --uri="$MONGO_URI" --drop "$DUMP_FOLDER"

# Dọn dẹp thư mục tạm
rm -rf "$TEMP_RESTORE_DIR"

echo "[$(date)] Phục hồi cơ sở dữ liệu hoàn tất thành công!"
