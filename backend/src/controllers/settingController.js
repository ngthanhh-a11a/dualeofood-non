const Setting = require('../models/Setting');

const SETTING_KEY = 'orderSettings';

// Lấy cài đặt hiện tại
exports.getOrderSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne({ key: SETTING_KEY });

        // Nếu chưa có cài đặt, tạo một cài đặt mặc định
        if (!settings) {
            settings = new Setting({
                key: SETTING_KEY,
                value: {
                    autoDelete: {
                        enabled: false,
                        deleteAfterDays: 90
                    }
                }
            });
            await settings.save();
        }
        res.status(200).json(settings);
    } catch (error) {
        throw error;
    }
};

// Cập nhật cài đặt
exports.updateOrderSettings = async (req, res) => {
    try {
        const updatedSettings = await Setting.findOneAndUpdate(
            { key: SETTING_KEY },
            { value: req.body },
            { new: true, upsert: true } // `upsert: true` sẽ tạo mới nếu chưa tồn tại
        );
        res.status(200).json(updatedSettings);
    } catch (error) {
        throw error;
    }
};