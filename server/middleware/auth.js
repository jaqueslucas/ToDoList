import jwt from 'jsonwebtoken';
import { db } from '../database/init.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Verify JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Check user role permissions
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (roles.includes(req.user.role)) {
      next();
    } else {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }
  };
};

// Check if user can access resource (own or admin/manager)
export const canAccessUser = (req, res, next) => {
  const targetUserId = parseInt(req.params.id || req.params.userId);
  const currentUser = req.user;

  // Admin and managers can access any user
  if (currentUser.role === 'admin' || currentUser.role === 'manager') {
    return next();
  }

  // Users can only access their own data
  if (currentUser.id === targetUserId) {
    return next();
  }

  return res.status(403).json({ 
    message: 'You can only access your own data' 
  });
};

// Check if user can manage tasks
export const canManageTasks = (req, res, next) => {
  const currentUser = req.user;

  // Admin and managers can manage all tasks
  if (currentUser.role === 'admin' || currentUser.role === 'manager') {
    return next();
  }

  // Readers can only manage their own tasks
  const taskUserId = parseInt(req.body.user_id || req.params.userId);
  if (currentUser.id === taskUserId) {
    return next();
  }

  return res.status(403).json({ 
    message: 'You can only manage your own tasks' 
  });
};
