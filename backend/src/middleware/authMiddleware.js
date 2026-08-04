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

// Giữ lại isAdmin để backward-compatible với các route chưa migrate
// isAdmin bản chất là authorizeRoles('admin')
const isAdmin = authorizeRoles('admin');

module.exports = { verifyToken, authorizeRoles, isAdmin };