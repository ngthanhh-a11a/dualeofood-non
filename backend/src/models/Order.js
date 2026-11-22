const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // Dòng này rất quan trọng để biết ai đặt hàng:
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    
    items: [{
        // Dòng này để biết khách đặt món gì:
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, 
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true }, // Giá lúc khách bấm mua (đã gồm size & topping)
        size: {
            name: { type: String, default: null },
            priceOffset: { type: Number, default: 0 }
        },
        toppings: [{
            name: { type: String },
            price: { type: Number }
        }],
        note: { type: String, default: '' }
    }],
    totalAmount: { type: Number, required: true }, 
    discountAmount: { type: Number, default: 0 }, 
    shippingFee: { type: Number, default: 0 }, 
    distanceKm: { type: Number, default: 0 }, // Khoảng cách giao hàng tính bằng km
    finalAmount: { type: Number, required: true }, 
    paymentMethod: { type: String, enum: ['CASH', 'QR_CODE'], required: true },
    customerInfo: {
        name: { type: String },
        phone: { type: String },
        address: { type: String },
        note: { type: String },
        location: {
            lat: { type: Number, default: null },
            lng: { type: Number, default: null }
        }
    },
    status: { 
        type: String, 
        enum: ['PENDING', 'PROCESSING', 'DELIVERING', 'COMPLETED', 'CANCELLED', 'AWAITING_PAYMENT'], 
        default: 'PENDING' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);