import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';
import {
  hashPassword,
  verifyPassword,
  createRefreshToken,
  generateAccessToken,
  rotateRefreshToken,
  revokeSession,
} from '../services/auth.service';

const DEFAULT_USER_ID = 'demo-faculty-id';
const DEFAULT_INST_ID  = 'demo-inst-id';
const REFRESH_COOKIE_NAME = 'refresh_token';

function getUserId(req: Request): string {
  return (req as any).user?.id || DEFAULT_USER_ID;
}

// Helper to set HttpOnly secure cookie
function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
}

// Clear refresh token cookie
function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
}

// Ensure the demo institution + user exist in the database (fallback helper)
async function ensureDemoUser(userId: string): Promise<void> {
  try {
    const exists = await prisma.user.findUnique({ where: { id: userId } });
    if (!exists) {
      const inst = await prisma.institution.upsert({
        where: { id: DEFAULT_INST_ID },
        create: {
          id: DEFAULT_INST_ID,
          name: 'VedaAI Demo School',
          domain: 'vedaai.demo',
        },
        update: {},
      });

      const pwdHash = await hashPassword('demo-password');
      await prisma.user.create({
        data: {
          id: userId,
          email: 'demo@bloomverify.com',
          passwordHash: pwdHash,
          firstName: 'Demo',
          lastName: 'Faculty',
          role: 'FACULTY',
          institutionId: inst.id,
        },
      });
    }
  } catch {
    // Non-fatal
  }
}

// ── POST /auth/signup ──
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role, institutionName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ success: false, error: 'Missing required signup fields' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, error: 'Email already registered' });
      return;
    }

    // Create or find default institution
    let instId = DEFAULT_INST_ID;
    if (institutionName) {
      const inst = await prisma.institution.create({
        data: {
          name: institutionName,
          domain: email.split('@')[1] || null,
        },
      });
      instId = inst.id;
    } else {
      await ensureDemoUser(DEFAULT_USER_ID);
    }

    const pwdHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: pwdHash,
        firstName,
        lastName,
        role: role || 'FACULTY',
        institutionId: instId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { id: user.id, email: user.email },
    });
  } catch (error) {
    logger.error(`[signup] ${error}`);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
};

// ── POST /auth/login ──
export const login = async (req: Request, res: Response): Promise<void> => {
  const ipAddress = req.ip || '0.0.0.0';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      // Record login failure
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          ipAddress,
          userAgent,
          status: 'FAILED_PASSWORD',
        },
      });
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
      departmentId: user.departmentId,
    });

    const refreshToken = await createRefreshToken(user.id);

    // Save success history
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent,
        status: 'SUCCESS',
      },
    });

    // Create session record
    const sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + 30);
    await prisma.session.create({
      data: {
        userId: user.id,
        userAgent,
        ipAddress,
        expiresAt: sessionExpiry,
      },
    });

    setRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
    });
  } catch (error) {
    logger.error(`[login] ${error}`);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};

// ── POST /auth/refresh ──
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawToken = req.cookies[REFRESH_COOKIE_NAME];
    if (!rawToken) {
      res.status(401).json({ success: false, error: 'Refresh token missing' });
      return;
    }

    const { accessToken, newRefreshToken } = await rotateRefreshToken(rawToken);
    setRefreshCookie(res, newRefreshToken);

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error: any) {
    logger.error(`[refresh] ${error.message}`);
    clearRefreshCookie(res);
    res.status(error.status || 401).json({ success: false, error: error.message || 'Token refresh failed' });
  }
};

// ── POST /auth/logout ──
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawToken = req.cookies[REFRESH_COOKIE_NAME];
    if (rawToken) {
      await revokeSession(rawToken);
    }
    clearRefreshCookie(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error(`[logout] ${error}`);
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
};

// ── GET /auth/me ──
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    await ensureDemoUser(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { institution: true, department: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        institutionId: user.institutionId,
        institutionName: user.institution?.name || 'VedaAI Demo School',
        departmentName: user.department?.name || null,
        preferences: user.preferences || {},
      },
    });
  } catch (error) {
    logger.error(`[getMe] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
};

// ── PUT /auth/me ──
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { firstName, lastName, email } = req.body;
    await ensureDemoUser(userId);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
      },
      include: { institution: true },
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        institutionName: user.institution?.name || '',
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    logger.error(`[updateProfile] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};

// ── PUT /auth/me/preferences ──
export const updatePreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { preferences } = req.body;
    await ensureDemoUser(userId);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { preferences: preferences as any },
    });

    res.json({
      success: true,
      data: { preferences: user.preferences },
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    logger.error(`[updatePreferences] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to update preferences' });
  }
};

// ── PUT /auth/me/institution ──
export const updateInstitution = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    await ensureDemoUser(userId);

    const { institutionName, academicYear, department } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { institution: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (institutionName) {
      if (user.institutionId && user.institutionId !== DEFAULT_INST_ID) {
        await prisma.institution.update({
          where: { id: user.institutionId },
          data: { name: institutionName },
        });
      } else {
        const inst = await prisma.institution.create({
          data: {
            name: institutionName,
            domain: user.email.split('@')[1] || null,
          },
        });
        await prisma.user.update({
          where: { id: userId },
          data: { institutionId: inst.id },
        });
        user.institutionId = inst.id;
      }
    }

    if (department && user.institutionId) {
      let dept = await prisma.department.findFirst({
        where: { name: department, institutionId: user.institutionId },
      });
      if (!dept) {
        dept = await prisma.department.create({
          data: {
            name: department,
            institutionId: user.institutionId,
          },
        });
      }
      await prisma.user.update({
        where: { id: userId },
        data: { departmentId: dept.id },
      });
    }

    res.json({
      success: true,
      message: 'Institution settings updated',
      data: { institutionName, department, academicYear },
    });
  } catch (error) {
    logger.error(`[updateInstitution] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to update institution' });
  }
};
