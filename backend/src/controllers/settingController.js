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
            { returnDocument: 'after', upsert: true } // `upsert: true` sẽ tạo mới nếu chưa tồn tại
        );
        res.status(200).json(updatedSettings);
    } catch (error) {
        throw error;
    }
};

const GENERAL_SETTING_KEY = 'generalSettings';

// Lấy cài đặt chung
exports.getGeneralSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne({ key: GENERAL_SETTING_KEY });

        if (!settings) {
            settings = new Setting({
                key: GENERAL_SETTING_KEY,
                value: {
                    storeInfo: {
                        name: "Dualeo Food",
                        address: "",
                        phone: "",
                        email: ""
                    },
                    shippingFees: [
                        { id: 1, area: "Nội thành", fee: 15000 },
                        { id: 2, area: "Ngoại thành", fee: 30000 }
                    ],
                    operationalAreas: ["Hà Nội"],
                    paymentGateways: {
                        vnpay: { enabled: false, terminalId: "", secretKey: "" },
                        momo: { enabled: false, partnerCode: "", accessKey: "", secretKey: "" }
                    }
                }
            });
            await settings.save();
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy cài đặt chung", error: error.message });
    }
};

// Lấy cài đặt công khai (không có API keys)
exports.getPublicSettings = async (req, res) => {
    try {
        const settings = await Setting.findOne({ key: GENERAL_SETTING_KEY });
        if (!settings || !settings.value) {
            return res.status(200).json({
                storeInfo: { address: '123 Đường Bánh Mì, Quận Gà Rán, TP. HCM', phone: '1900 1234', email: 'support@dualeofood.com' },
                shippingFees: [],
                operationalAreas: []
            });
        }
        // Trả về thông tin an toàn
        res.status(200).json({
            storeInfo: settings.value.storeInfo,
            shippingFees: settings.value.shippingFees,
            operationalAreas: settings.value.operationalAreas
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy cài đặt công khai", error: error.message });
    }
};

// Cập nhật cài đặt chung
exports.updateGeneralSettings = async (req, res) => {
    try {
        const updatedSettings = await Setting.findOneAndUpdate(
            { key: GENERAL_SETTING_KEY },
            { value: req.body },
            { returnDocument: 'after', upsert: true }
        );
        res.status(200).json(updatedSettings);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi cập nhật cài đặt chung", error: error.message });
    }
};