const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load biến môi trường (để lấy đường dẫn MONGO_URI)
dotenv.config();

// Load Model User của bạn
const User = require('./src/models/User');

const createAdminAccount = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ Lỗi: Không tìm thấy biến môi trường MONGO_URI. Vui lòng kiểm tra tệp .env của bạn.');
      process.exit(1);
    }

    // 1. Kết nối vào Database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🟢 Đã kết nối Database. Đang kiểm tra tài khoản Admin...');

    // 2. Kiểm tra xem Admin đã tồn tại chưa
    const adminExists = await User.findOne({ email: 'boss@dualeofood.com' });
    if (adminExists) {
      console.log('⚠️ Tài khoản Admin đã tồn tại trong hệ thống!');
      process.exit();
    }

    // 3. Mã hóa mật khẩu cho Admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);

    // 4. Tạo tài khoản Admin với quyền cao nhất và bỏ qua OTP (isVerified: true)
    const adminUser = new User({
      name: 'Super Admin',
      email: 'boss@dualeofood.com',
      password: hashedPassword,
      phone: '0999999999',
      address: 'Trụ sở DUALEOFOOD',
      role: 'admin', // Cấp quyền Admin
      isVerified: true // Đã xác thực, đăng nhập thẳng
    });

    await adminUser.save();
    console.log('✅ Đã tạo thành công tài khoản Admin!');
    console.log('-----------------------------------');
    console.log('📧 Email: boss@dualeofood.com');
    console.log('🔑 Mật khẩu: Admin@123');
    console.log('-----------------------------------');
    
    // Đóng kết nối
    process.exit();

  } catch (error) {
    console.error('❌ Lỗi khi tạo Admin:', error);
    process.exit(1);
  }
};

createAdminAccount();