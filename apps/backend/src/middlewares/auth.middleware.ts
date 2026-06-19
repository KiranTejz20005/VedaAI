/* eslint-disable @typescript-eslint/no-namespace */
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth.service';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        institutionId?: string | null;
        departmentId?: string | null;
      };
    }
  }
}

/**
 * Authentication middleware that validates JWT token from Authorization header or cookie.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = '';

    // 1. Extract from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // 2. Extract from cookie (if cookie-parser is registered)
    if (!token && req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (token) {
      const decodedPayload = verifyAccessToken(token);
      req.user = {
        id: decodedPayload.userId,
        email: decodedPayload.email,
        role: decodedPayload.role,
        institutionId: decodedPayload.institutionId,
        departmentId: decodedPayload.departmentId,
      };
      return next();
    }

    // 3. Fallback for local development / testing (if enabled)
    const isMockAuthEnabled = process.env.NODE_ENV !== 'production' || process.env.ENABLE_MOCK_AUTH === 'true';
    if (isMockAuthEnabled) {
      const mockRole = (req.headers['x-mock-role'] as string) || 'TEACHER';
      const mockUserId = (req.headers['x-mock-userid'] as string) || 'demo-faculty-id';
      req.user = {
        id: mockUserId,
        email: 'demo@bloomverify.com',
        role: mockRole,
        institutionId: 'demo-inst-id',
        departmentId: 'dept-demo',
      };
      return next();
    }

    return res.status(401).json({ success: false, error: 'Authentication required' });
  } catch (err: any) {
    const isMockAuthEnabled = process.env.NODE_ENV !== 'production' || process.env.ENABLE_MOCK_AUTH === 'true';
    if (isMockAuthEnabled) {
      // Allow bypass on error in dev mode if explicitly requested
      req.user = {
        id: 'demo-faculty-id',
        email: 'demo@bloomverify.com',
        role: 'TEACHER',
        institutionId: 'demo-inst-id',
        departmentId: 'dept-demo',
      };
      return next();
    }
    return res.status(401).json({ success: false, error: err.message || 'Invalid authentication credentials' });
  }
};

/**
 * Middleware to enforce ownership or admin overrides
 */
export const requireOwnership = (_resourceType: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' });
    }

    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN') {
      return next();
    }
    
    // We attach a flag to the request so the controller knows to enforce ownership filtering
    req.body._requireOwnership = true; 
    return next();
  }
};

/**
 * Middleware to enforce institution-level data isolation
 */
export const requireInstitutionScope = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' });
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }
    
    if (!req.user.institutionId) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'User does not belong to an institution' });
    }

    // Attach flag for controllers to filter by institution
    req.body._requireInstitutionScope = req.user.institutionId;
    return next();
  }
};
