import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Component bảo vệ route theo vai trò (RBAC - Role-Based Access Control).
 * Kiểm tra token đăng nhập và role từ localStorage.
 * 
 * @param {string[]} allowedRoles - Mảng các role được phép truy cập (VD: ['admin'], ['admin', 'staff'])
 * @param {React.ReactNode} children - Nội dung được render nếu có đủ quyền
 * 
 * @example
 * // Chỉ Admin
 * <RoleBasedRoute allowedRoles={['admin']}><AdminDashboard /></RoleBasedRoute>
 * // Admin hoặc Staff
 * <RoleBasedRoute allowedRoles={['admin', 'staff']}><StaffLayout /></RoleBasedRoute>
 */
const RoleBasedRoute = ({ allowedRoles, children }) => {
  const token = localStorage.getItem('token');
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  // Chưa đăng nhập → chuyển về trang login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Đã đăng nhập nhưng không đủ quyền → chuyển về trang chủ
  if (!allowedRoles.includes(userInfo.role)) {
    return <Navigate to="/" replace />;
  }

  // Đủ quyền → render nội dung con
  return children;
};

export default RoleBasedRoute;
