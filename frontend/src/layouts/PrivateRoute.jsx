import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  return token ? children : <Navigate to="/" state={{ requireLogin: true, message: "Vui lòng đăng nhập để tiếp tục!" }} replace />;
};

export default PrivateRoute;