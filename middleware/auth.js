// server/middleware/auth.js

// Thêm middleware kiểm tra quyền của admin
const checkAdminRole = (requiredRole) => {
    return (req, res, next) => {
      // Đảm bảo người dùng đã đăng nhập và là admin
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập. Chỉ admin mới có thể truy cập.'
        });
      }
  
      // Kiểm tra admin_type
      if (requiredRole && req.user.role !== requiredRole) {
        return res.status(403).json({
          success: false,
          message: `Không có quyền truy cập. Chỉ ${requiredRole} mới được phép.`
        });
      }
  
      next();
    };
  };
  
  module.exports = {
    authenticateToken, // Giữ middleware hiện có
    checkAdminRole,
    ADMIN_TYPES: {
      SUPER_ADMIN: 'admin',   // Admin Tổng
      BRANCH_ADMIN: 'branch_admin'  // Admin Chi Nhánh
    }
  };