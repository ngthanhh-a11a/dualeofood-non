const jwt = require('jsonwebtoken');

/**
 * Middleware xác thực JWT Token.
 * Giải mã token và gắn thông tin user (id, role) vào req.user
 * để các middleware/controller phía sau sử dụng.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Không có token, từ chối truy cập!' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dualeofood_secret');
    req.user = decoded; // Gán thông tin giải mã (id, role) vào req
    if (decoded.id && !req.user._id) {
      req.user._id = decoded.id;
    }
    if (decoded._id && !req.user.id) {
      req.user.id = decoded._id;
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

/**
 * Middleware phân quyền linh hoạt (RBAC - Role-Based Access Control).
 * Nhận vào danh sách các vai trò được phép truy cập resource.
 * 
 * @param  {...string} allowedRoles - Các vai trò được phép (VD: 'admin', 'staff')
 * @returns {Function} Express middleware
 * 
 * @example
 * // Chỉ Admin mới truy cập được
 * router.get('/stats', verifyToken, authorizeRoles('admin'), getStats);
 * 
 * // Cả Admin và Staff đều truy cập được
 * router.get('/orders', verifyToken, authorizeRoles('admin', 'staff'), getAllOrders);
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Kiểm tra xem role của user hiện tại có nằm trong danh sách cho phép không
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      console.log(`❌ BỊ CHẶN: Role "${req.user?.role}" không nằm trong danh sách [${allowedRoles.join(', ')}]`);
      return res.status(403).json({ 
        message: 'Bạn không có quyền thực hiện hành động này!' 
      });
    }
    next();
  };
};

/**
 * Middleware xác thực JWT Token tùy chọn.
 * Dành cho các route công khai nhưng có thể phân cấp hiển thị nếu có user đăng nhập.
 * Nếu có token hợp lệ -> gán req.user.
 * Nếu không có token HOẶC token hết hạn/lỗi -> bỏ qua, không chặn request (req.user = null).
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dualeofood_secret');
        req.user = decoded;
        if (decoded.id && !req.user._id) {
          req.user._id = decoded.id;
        }
        if (decoded._id && !req.user.id) {
          req.user.id = decoded._id;
        }
      } catch (error) {
        // Token hết hạn hoặc không hợp lệ: bỏ qua và tiếp tục như khách vãng lai
        req.user = null;
      }
    }
  }
  next();
};

// Giữ lại isAdmin để backward-compatible với các route chưa migrate
// isAdmin bản chất là authorizeRoles('admin')
const isAdmin = authorizeRoles('admin');

module.exports = { verifyToken, authorizeRoles, isAdmin, optionalAuth };