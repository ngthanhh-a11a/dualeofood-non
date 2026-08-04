const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        // Xác thực token với Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        // Kiểm tra xem user đã tồn tại chưa
        let user = await User.findOne({ email });

        if (user) {
            // Đã tồn tại -> Account Linking
            if (!user.googleId) {
                user.googleId = googleId;
                if (!user.avatar) user.avatar = picture; // Cập nhật avatar nếu chưa có
                await user.save();
            }
        } else {
            // Chưa tồn tại -> Tạo user mới
            // Tạo một password ngẫu nhiên cực khó đoán để tránh login bằng email thường nếu không qua 'Quên mật khẩu'
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            user = new User({
                name: name,
                email: email,
                password: hashedPassword,
                googleId: googleId,
                avatar: picture,
                isVerified: true // Mặc định verify luôn vì Google đã xác thực email
            });
            await user.save();
        }

        // Tạo JWT Token cho hệ thống của chúng ta
        const ourToken = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'dualeofood_secret',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Đăng nhập Google thành công',
            token: ourToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error("Lỗi xác thực Google:", error);
        res.status(401).json({ message: 'Xác thực Google thất bại' });
    }
};
