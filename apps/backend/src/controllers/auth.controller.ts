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
import { validateInvitationToken } from '../services/invitation.service';

const REFRESH_COOKIE_NAME = 'refresh_token';

function getUserId(req: Request): string {
  const userId = (req as any).user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
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

// ── POST /auth/signup ──
export const signup = async (_req: Request, res: Response): Promise<void> => {
  // Disabling direct signup in favor of the new Invitation flow.
  res.status(403).json({ success: false, error: 'Direct registration is disabled. Please contact your organization administrator for an invitation.' });
  return;
};

// ── POST /auth/accept-invite ──
export const acceptInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password, firstName, lastName } = req.body;

    if (!token || !password || !firstName || !lastName) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const invitation = await validateInvitationToken(token);

    const pwdHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: invitation.email,
        passwordHash: pwdHash,
        firstName,
        lastName,
        role: invitation.role,
        organizationId: invitation.organizationId,
        hasCompletedOnboarding: false,
      },
    });

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        action: 'INVITATION_ACCEPTED',
        entity: 'User',
        entityId: user.id,
        userId: user.id,
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown',
      }
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { id: user.id, email: user.email },
    });
  } catch (error: any) {
    logger.error(`[acceptInvite] ${error}`);
    res.status(400).json({ success: false, error: error.message || 'Failed to accept invitation' });
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
      organizationId: user.organizationId,
      activeOrganizationId: user.activeOrganizationId,
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
          hasCompletedOnboarding: user.hasCompletedOnboarding,
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true, department: true },
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
        organizationId: user.organizationId,
        activeOrganizationId: user.activeOrganizationId,
        organizationName: user.organization?.name || null,
        departmentName: user.department?.name || null,
        preferences: user.preferences || {},
        hasCompletedOnboarding: user.hasCompletedOnboarding,
      },
    });
  } catch (error) {
    logger.error(`[getMe] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
};

// ── POST /auth/onboarding/complete ──
export const completeOnboarding = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        hasCompletedOnboarding: true,
        onboardingCompletedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        hasCompletedOnboarding: user.hasCompletedOnboarding,
      },
    });
  } catch (error) {
    logger.error(`[completeOnboarding] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to complete onboarding' });
  }
};

// ── PUT /auth/me ──
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { firstName, lastName, email } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
      },
      include: { organization: true },
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationName: user.organization?.name || '',
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

// ── GET /auth/me/organizations ──
export const getAvailableOrganizations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, organizationId: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    let orgs: { id: string; name: string; code: string }[] = [];
    if (user.role === 'SUPER_ADMIN') {
      orgs = await prisma.organization.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, code: true },
      });
    } else if (user.organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: { id: true, name: true, code: true },
      });
      if (org) orgs = [org];
    }

    res.json({
      success: true,
      data: orgs.map((org) => ({
        id: org.id,
        name: org.name,
        code: org.code,
        role: user.role,
      })),
    });
  } catch (error) {
    logger.error(`[getAvailableOrganizations] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch organizations' });
  }
};

// ── POST /auth/me/switch-organization ──
export const switchOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { organizationId } = req.body;

    if (!organizationId) {
      res.status(400).json({ success: false, error: 'organizationId is required' });
      return;
    }

    // Verify user belongs to this organization (or is SUPER_ADMIN)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (user.role !== 'SUPER_ADMIN') {
      // Regular users can only switch to organizations they belong to
      const org = await prisma.organization.findFirst({
        where: {
          id: organizationId,
          users: { some: { id: userId } }
        }
      });
      if (!org) {
        res.status(403).json({ success: false, error: 'Access denied to this organization' });
        return;
      }
    }

    // Update active organization
    await prisma.user.update({
      where: { id: userId },
      data: { activeOrganizationId: organizationId }
    });

    res.json({
      success: true,
      message: 'Organization switched successfully',
      data: { activeOrganizationId: organizationId }
    });
  } catch (error) {
    logger.error(`[switchOrganization] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to switch organization' });
  }
};

// ── PUT /auth/me/organization ──
export const updateOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);

    const { organizationName, academicYear, department } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (organizationName) {
      if (user.organizationId) {
        await prisma.organization.update({
          where: { id: user.organizationId },
          data: { name: organizationName },
        });
      } else {
        const org = await prisma.organization.create({
          data: {
            name: organizationName,
            code: organizationName.substring(0, 4).toUpperCase(),
            email: user.email,
          },
        });
        await prisma.user.update({
          where: { id: userId },
          data: { organizationId: org.id },
        });
        user.organizationId = org.id;
      }
    }

    if (department && user.organizationId) {
      let dept = await prisma.department.findFirst({
        where: { name: department, organizationId: user.organizationId },
      });
      if (!dept) {
        dept = await prisma.department.create({
          data: {
            name: department,
            organizationId: user.organizationId,
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
      message: 'Organization settings updated',
      data: { organizationName, department, academicYear },
    });
  } catch (error) {
    logger.error(`[updateOrganization] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to update organization' });
  }
};
