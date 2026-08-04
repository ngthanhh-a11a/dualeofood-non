const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load biến môi trường (để lấy đường dẫn MONGO_URI)
dotenv.config();

// Load Model User
const User = require('./src/models/User');

const createStaffAccount = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ Lỗi: Không tìm thấy biến môi trường MONGO_URI. Vui lòng kiểm tra tệp .env của bạn.');
      process.exit(1);
    }

    // 1. Kết nối vào Database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🟢 Đã kết nối Database. Đang kiểm tra tài khoản Staff...');

    // 2. Kiểm tra xem Staff mẫu đã tồn tại chưa
    const staffExists = await User.findOne({ email: 'staff@dualeofood.com' });
    if (staffExists) {
      console.log('⚠️ Tài khoản Staff mẫu đã tồn tại trong hệ thống!');
      process.exit();
    }

    // 3. Mã hóa mật khẩu cho Staff
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Staff@123', salt);

    // 4. Tạo tài khoản Staff với vai trò nhân viên
    const staffUser = new User({
      name: 'Nhân Viên Mẫu',
      email: 'staff@dualeofood.com',
      password: hashedPassword,
      role: 'staff',         // Cấp quyền Staff (Nhân viên)
      isVerified: true,      // Đã xác thực, đăng nhập thẳng
      isActive: true,        // Tài khoản đang hoạt động
      hiredAt: new Date()    // Ngày được bổ nhiệm
    });

    await staffUser.save();
    console.log('✅ Đã tạo thành công tài khoản Staff!');
    console.log('-----------------------------------');
    console.log('📧 Email: staff@dualeofood.com');
    console.log('🔑 Mật khẩu: Staff@123');
    console.log('👤 Vai trò: Nhân viên (Staff)');
    console.log('-----------------------------------');
    
    // Đóng kết nối
    process.exit();

  } catch (error) {
    console.error('❌ Lỗi khi tạo Staff:', error);
    process.exit(1);
  }
};

createStaffAccount();
