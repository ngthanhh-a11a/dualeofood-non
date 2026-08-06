const sendEmail = async (options) => {
  // Sử dụng Brevo HTTP API thay vì SMTP (vì Render chặn SMTP port 587/465)
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.error('❌ Thiếu BREVO_API_KEY trong biến môi trường!');
    throw new Error('Chưa cấu hình API Key gửi email. Vui lòng liên hệ Admin.');
  }

  const emailData = {
    sender: {
      name: 'DUALEOFOOD ADMIN',
      email: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'nguynducthanh555@gmail.com',
    },
    to: [{ email: options.email }],
    subject: options.subject,
    htmlContent: options.html,
  };

  try {
    console.log(`📧 Đang gửi email tới: ${options.email} qua Brevo HTTP API...`);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`❌ Brevo API lỗi:`, JSON.stringify(result));
      throw new Error(result.message || 'Gửi email thất bại');
    }

    console.log(`✅ Email đã gửi thành công tới: ${options.email} | MessageId: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`❌ Lỗi gửi email tới ${options.email}:`, error.message);
    throw new Error(`Không thể gửi email: ${error.message}`);
  }
};

module.exports = sendEmail;