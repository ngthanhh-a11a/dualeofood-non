const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Khởi tạo transporter với cấu hình linh hoạt (Hỗ trợ Gmail, Brevo, SendGrid...)
  const transporter = nodemailer.createTransport({
    service: (process.env.EMAIL_HOST || '').includes('gmail') ? 'gmail' : undefined,
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
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

  // 3. Gửi email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;