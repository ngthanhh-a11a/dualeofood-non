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

const DEFAULT_SHIPPING_CONFIG = {
    enabled: true,
    restaurantLocation: {
        address: "123 Đường Bánh Mì, Quận Gà Rán, TP. HCM",
        lat: 10.776889,
        lng: 106.700806
    },
    baseDistanceKm: 3,
    baseFee: 0,
    startFeeAfterBase: 10000,
    pricePerKm: 5000,
    maxDistanceKm: 25
};

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
                        address: "123 Đường Bánh Mì, Quận Gà Rán, TP. HCM",
                        phone: "1900 1234",
                        email: "support@dualeofood.com"
                    },
                    operationalAreas: ["Hà Nội", "TP. Hồ Chí Minh"],
                    shippingConfig: DEFAULT_SHIPPING_CONFIG,
                    paymentGateways: {
                        vnpay: { enabled: false, terminalId: "", secretKey: "" },
                        momo: { enabled: false, partnerCode: "", accessKey: "", secretKey: "" }
                    }
                }
            });
            await settings.save();
        } else if (!settings.value.shippingConfig) {
            // Nâng cấp tự động cho dữ liệu đã có từ trước
            settings.value = {
                ...settings.value,
                shippingConfig: DEFAULT_SHIPPING_CONFIG
            };
            settings.markModified('value');
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
        const val = settings?.value || {};
        
        res.status(200).json({
            storeInfo: val.storeInfo || { 
                name: "Dualeo Food",
                address: '123 Đường Bánh Mì, Quận Gà Rán, TP. HCM', 
                phone: '1900 1234', 
                email: 'support@dualeofood.com' 
            },
            operationalAreas: val.operationalAreas || [],
            shippingConfig: {
                ...DEFAULT_SHIPPING_CONFIG,
                ...(val.shippingConfig || {})
            }
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

        // Bắn tín hiệu realtime qua Socket.io để các client (Checkout, v.v.) lập tức đồng bộ cước phí
        if (req.io) {
            if (req.body.shippingConfig) {
                req.io.emit('shipping_config_updated', req.body.shippingConfig);
            }
            req.io.emit('settings_updated', req.body);
        }

        res.status(200).json(updatedSettings);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi cập nhật cài đặt chung", error: error.message });
    }
};