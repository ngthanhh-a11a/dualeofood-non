const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../../utils/sendEmail');
const crypto = require('crypto'); // Import module crypto của Node.js

// Hàm tạo mã Token JWT dùng chung
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'dualeofood_secret', { expiresIn: '30d' });
};

// ================= 1. ĐĂNG KÝ TÀI KHOẢN & GỬI OTP =================
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email này đã được sử dụng!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo mã OTP 6 số và đặt hạn 10 phút
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      otp,
      otpExpires,
      isVerified: false // Tài khoản mới tạo ở trạng thái chưa xác thực
    });

    // Mẫu thư HTML gửi cho khách
    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #0ea5e9; padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0; letter-spacing: 2px;">DUALEOFOOD</h2>
        </div>
        <div style="padding: 20px; color: #333; line-height: 1.6;">
          <p>Chào <strong>${name}</strong>,</p>
          <p>Cảm ơn bạn đã đăng ký mua sắm tại cửa hàng chúng tôi. Mã OTP xác thực tài khoản của bạn là:</p>
          <div style="text-align: center; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #0ea5e9; letter-spacing: 5px; border: 2px dashed #0ea5e9; padding: 10px 20px; rounded-lg: 8px;">${otp}</span>
          </div>
          <p style="color: #ef4444; font-size: 13px; font-weight: bold;">* Mã này có giá trị trong vòng 10 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
        </div>
      </div>
    `;

    await sendEmail({
      email,
      subject: 'DUALEOFOOD - Mã xác thực tài khoản',
      html: emailTemplate
    });

    res.status(201).json({ message: 'Vui lòng kiểm tra email để lấy mã OTP!' });

  } catch (error) {
    throw error;
  }
});

// ================= 2. XÁC THỰC MÃ OTP ĐỂ KÍCH HOẠT TÀI KHOẢN =================
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
    if (user.isVerified) return res.status(400).json({ message: 'Tài khoản này đã được xác thực trước đó!' });
    if (user.otp !== otp) return res.status(400).json({ message: 'Mã OTP không chính xác!' });
    if (user.otpExpires < new Date()) return res.status(400).json({ message: 'Mã OTP đã hết hạn!' });

    // Cập nhật trạng thái kích hoạt và xóa thông tin OTP tạm trong DB
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({
      message: 'Xác thực tài khoản thành công!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role, // Trả về quyền customer hoặc admin
        avatar: user.avatar,
      },
      token: generateToken(user._id, user.role), // Cấp token để đăng nhập luôn
    });

  } catch (error) {
    throw error;
  }
});

// ================= 3. ĐĂNG NHẬP (LOGIN) THƯỜNG BẰNG MẬT KHẨU =================
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không đúng!' });
    }

    // Nếu tài khoản chưa xác thực OTP, chặn không cho đăng nhập
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Tài khoản chưa được xác thực OTP. Vui lòng xác thực trước!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không đúng!' });
    }

    res.status(200).json({
      message: 'Đăng nhập thành công!',
      user: { 
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token: generateToken(user._id, user.role),
    });

  } catch (error) {
    throw error;
  }
});

// ================= 4. QUÊN MẬT KHẨU - GỬI MÃ OTP =================
const sendPasswordResetOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    // Để bảo mật, không báo lỗi "Không tìm thấy user"
    return res.status(200).json({ message: 'Nếu email tồn tại, bạn sẽ nhận được mã OTP.' });
  }

  // 1. Tạo mã OTP 6 số và đặt hạn 10 phút
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  // 2. Gửi email chứa mã OTP
  const emailTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #0ea5e9; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0; letter-spacing: 2px;">DUALEOFOOD</h2>
      </div>
      <div style="padding: 20px; color: #333; line-height: 1.6;">
        <p>Chào bạn,</p>
        <p>Bạn đã yêu cầu khôi phục mật khẩu. Mã OTP để đặt lại mật khẩu của bạn là:</p>
        <div style="text-align: center; margin: 25px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #0ea5e9; letter-spacing: 5px; border: 2px dashed #0ea5e9; padding: 10px 20px; border-radius: 8px;">${otp}</span>
        </div>
        <p style="color: #ef4444; font-size: 13px; font-weight: bold;">* Mã này có giá trị trong vòng 10 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
      </div>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject: 'DUALEOFOOD - Yêu cầu khôi phục mật khẩu',
    html: emailTemplate
  });

  res.status(200).json({ message: 'Đã gửi mã OTP qua email của bạn.' });
});

// ================= 5. XÁC THỰC OTP & ĐẶT LẠI MẬT KHẨU MỚI =================
const verifyPasswordResetOTP = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
  if (user.otp !== otp) return res.status(400).json({ message: 'Mã OTP không chính xác!' });
  if (user.otpExpires < new Date()) return res.status(400).json({ message: 'Mã OTP đã hết hạn!' });

  // Cập nhật mật khẩu mới và xóa thông tin OTP
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  res.status(200).json({ message: 'Cập nhật mật khẩu thành công!' });
});

module.exports = { register, verifyOTP, login, sendPasswordResetOTP, verifyPasswordResetOTP };