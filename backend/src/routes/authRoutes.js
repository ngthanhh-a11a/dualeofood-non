const express = require('express');
const router = express.Router();
const { register, verifyOTP, login, sendPasswordResetOTP, verifyPasswordResetOTP } = require('../controllers/authController');
const { googleLogin } = require('../controllers/authGoogleController');

// Đường dẫn: /api/auth/register
router.post('/register', register);

// Đường dẫn: /api/auth/verify-otp
router.post('/verify-otp', verifyOTP);

// Đường dẫn: /api/auth/login
router.post('/login', login);

// Đường dẫn: /api/auth/google-login
router.post('/google-login', googleLogin);

// === CÁC ROUTE MỚI CHO QUÊN MẬT KHẨU BẰNG OTP ===
router.post('/forgot-password-otp', sendPasswordResetOTP);
router.post('/reset-password-otp', verifyPasswordResetOTP);

module.exports = router;