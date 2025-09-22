
const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user exists in request (should be added by auth middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if user role is allowed
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in role verification'
      });
    }
  };
};

// Specific role middlewares
const studentOnly = roleCheck('student');
const facultyOnly = roleCheck('faculty');
const adminOnly = roleCheck('admin');
const facultyOrAdmin = roleCheck('faculty', 'admin');

module.exports = {
  roleCheck,
  studentOnly,
  facultyOnly,
  adminOnly,
  facultyOrAdmin
};