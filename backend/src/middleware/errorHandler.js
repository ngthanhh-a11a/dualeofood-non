const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || 'Lỗi Server Nội Bộ';

    // Xử lý lỗi trùng lặp dữ liệu của MongoDB (Mongoose)
    if (err.code === 11000) {
        message = 'Dữ liệu này đã tồn tại trong hệ thống.';
        statusCode = 400;
    }

    // Xử lý lỗi Validation của Mongoose
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(val => val.message);
        message = `Lỗi dữ liệu: ${errors.join(', ')}`;
        statusCode = 400;
    }
    
    // Ghi log lỗi vào console
    console.error(`[Error] ${message}`);
    
    res.status(statusCode).json({
        success: false,
        message: message,
        // Chỉ hiển thị chi tiết stack trace khi ở môi trường development
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

const notFound = (req, res, next) => {
    const error = new Error(`Route không tồn tại - ${req.originalUrl}`);
    res.status(404);
    next(error); // Chuyển sang middleware errorHandler
};

module.exports = { errorHandler, notFound };
