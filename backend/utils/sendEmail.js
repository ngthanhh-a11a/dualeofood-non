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
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email đã gửi thành công tới: ${options.email} | MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Lỗi gửi email tới ${options.email}:`, error.message);
    throw new Error(`Không thể gửi email: ${error.message}`);
  }
};

module.exports = sendEmail;