const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Khởi tạo transporter (Hỗ trợ Brevo, SendGrid, Gmail...)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT == 465, // true nếu dùng cổng 465, false nếu dùng cổng 587
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
    connectionTimeout: 10000, // Timeout kết nối: 10 giây
    greetingTimeout: 10000,   // Timeout chờ server phản hồi: 10 giây
    socketTimeout: 10000,     // Timeout socket: 10 giây
  });

  // 2. Thiết lập nội dung email
  const mailOptions = {
    from: `"DUALEOFOOD ADMIN" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html, // Hỗ trợ gửi email bằng code HTML cho đẹp
  };

  // 3. Gửi email với log chi tiết
  try {
    console.log(`📧 Đang gửi email tới: ${options.email} qua ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email đã gửi thành công tới: ${options.email} | MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Lỗi gửi email tới ${options.email}:`, error.message);
    console.error(`❌ Chi tiết: HOST=${process.env.EMAIL_HOST}, PORT=${process.env.EMAIL_PORT}, USER=${process.env.EMAIL_USER}`);
    throw new Error(`Không thể gửi email: ${error.message}`);
  }
};

module.exports = sendEmail;