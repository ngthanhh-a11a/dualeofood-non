const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Khởi tạo transporter với cấu hình linh hoạt (Hỗ trợ Gmail, Brevo, SendGrid...)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT == 465, // true nếu dùng cổng 465, false nếu dùng cổng 587
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
  });

  // 2. Thiết lập nội dung email
  const mailOptions = {
    from: `"DUALEOFOOD ADMIN" <nguynducthanh555@gmail.com>`, // Bắt buộc phải là email đã verify trên Brevo
    to: options.email,
    subject: options.subject,
    html: options.html, // Hỗ trợ gửi email bằng code HTML cho đẹp
  };

  // 3. Gửi email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;