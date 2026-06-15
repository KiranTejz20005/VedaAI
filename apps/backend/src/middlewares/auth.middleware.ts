import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include user context
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        institutionId?: string;
      };
    }
  }
}

// In a real app, this would verify a JWT token
// For MVP/Phase 2, we simulate an authenticated user via a custom header or fallback
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const mockRole = req.headers['x-mock-role'] as string;
  const mockUserId = req.headers['x-mock-userid'] as string;
  
  if (authHeader || mockRole) {
    req.user = {
      id: mockUserId || 'demo-user-id',
      email: 'demo@bloomverify.com',
      role: mockRole || 'FACULTY',
      institutionId: 'demo-inst-id'
    };
    return next();
  }
  
  // For easy local development, if no headers, assume Faculty
  req.user = {
    id: 'demo-faculty-id',
    email: 'faculty@bloomverify.com',
    role: 'FACULTY',
    institutionId: 'demo-inst-id'
  };
  next();
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    if (req.user.role === 'SUPER_ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }
    
    return res.status(403).json({ success: false, error: 'Forbidden: Insufficient role permissions' });
  };
};
