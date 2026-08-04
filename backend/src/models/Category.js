const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: [true, 'Vui lòng nhập tên danh mục'],
            unique: true 
        },
        slug: { 
            type: String, 
            required: true,
            unique: true 
        },
        image: { 
            type: String, 
            default: '' 
        },
        isActive: { 
            type: Boolean, 
            default: true 
        }
    },
    { timestamps: true } // Tự động tạo createdAt và updatedAt
);

module.exports = mongoose.model('Category', categorySchema);