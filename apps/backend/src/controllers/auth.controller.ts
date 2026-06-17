import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';

const DEFAULT_USER_ID = 'demo-faculty-id';
const DEFAULT_INST_ID  = 'demo-inst-id';

function getUserId(req: Request): string {
  return (req as any).user?.id || DEFAULT_USER_ID;
}

// Ensure the demo institution + user exist in the database
async function ensureDemoUser(userId: string): Promise<void> {
  try {
    const exists = await prisma.user.findUnique({ where: { id: userId } });
    if (!exists) {
      // Upsert institution first
      const inst = await prisma.institution.upsert({
        where: { id: DEFAULT_INST_ID },
        create: {
          id: DEFAULT_INST_ID,
          name: 'VedaAI Demo School',
          domain: 'vedaai.demo',
        },
        update: {},
      });

      await prisma.user.create({
        data: {
          id: userId,
          email: 'demo@bloomverify.com',
          passwordHash: 'demo-hash',
          firstName: 'Demo',
          lastName: 'Faculty',
          role: 'FACULTY',
          institutionId: inst.id,
        },
      });
    }
  } catch {
    // Non-fatal — user may already exist or institution constraint
  }
}

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

// ── PUT /auth/me ── (update name)
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

// ── PUT /auth/me/preferences ── (save settings toggles)
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

// ── PUT /auth/me/institution ── (save school name / academic year)
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

    // Update institution name if provided
    if (institutionName && user.institutionId) {
      await prisma.institution.update({
        where: { id: user.institutionId },
        data: { name: institutionName },
      });
    }

    // Optionally upsert department
    if (department && user.institutionId) {
      const dept = await prisma.department.upsert({
        where: { id: user.departmentId || 'dept-demo' },
        create: {
          id: 'dept-demo',
          name: department,
          institutionId: user.institutionId,
        },
        update: { name: department },
      });
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
