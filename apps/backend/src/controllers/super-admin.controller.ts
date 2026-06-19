import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';
import { hashPassword } from '../services/auth.service';

// ── CREATE INSTITUTION ──
export const createInstitution = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, email, phone, address } = req.body;

    const existing = await prisma.institution.findUnique({ where: { code } });
    if (existing) {
      res.status(400).json({ success: false, error: 'Institution code already in use.' });
      return;
    }

    const institution = await prisma.institution.create({
      data: {
        name,
        code,
        email,
        phone,
        address,
        status: 'ACTIVE',
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'INSTITUTION_CREATED',
        entity: 'Institution',
        entityId: institution.id,
        userId: req.user?.id,
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown',
      }
    });

    res.status(201).json({ success: true, data: institution });
  } catch (error) {
    logger.error(`[SuperAdmin - createInstitution] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to create institution.' });
  }
};

// ── GET ALL INSTITUTIONS ──
export const getInstitutions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const institutions = await prisma.institution.findMany({
      include: {
        _count: {
          select: { users: true, classrooms: true, assignments: true },
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: institutions });
  } catch (error) {
    logger.error(`[SuperAdmin - getInstitutions] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch institutions.' });
  }
};

// ── GET INSTITUTION BY ID ──
export const getInstitutionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const institution = await prisma.institution.findUnique({
      where: { id: req.params.id },
      include: {
        users: {
          where: { role: 'ADMIN' },
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!institution) {
      res.status(404).json({ success: false, error: 'Institution not found.' });
      return;
    }

    res.json({ success: true, data: institution });
  } catch (error) {
    logger.error(`[SuperAdmin - getInstitutionById] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch institution.' });
  }
};

// ── UPDATE INSTITUTION ──
export const updateInstitution = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, address, status } = req.body;

    const institution = await prisma.institution.update({
      where: { id: req.params.id },
      data: { name, email, phone, address, status }
    });

    await prisma.auditLog.create({
      data: {
        action: 'INSTITUTION_UPDATED',
        entity: 'Institution',
        entityId: institution.id,
        userId: req.user?.id,
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown',
      }
    });

    res.json({ success: true, data: institution });
  } catch (error) {
    logger.error(`[SuperAdmin - updateInstitution] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to update institution.' });
  }
};

// ── DELETE INSTITUTION ──
export const deleteInstitution = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.institution.delete({
      where: { id: req.params.id }
    });

    await prisma.auditLog.create({
      data: {
        action: 'INSTITUTION_DELETED',
        entity: 'Institution',
        entityId: req.params.id,
        userId: req.user?.id,
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown',
      }
    });

    res.json({ success: true, message: 'Institution deleted successfully.' });
  } catch (error) {
    logger.error(`[SuperAdmin - deleteInstitution] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to delete institution.' });
  }
};

// ── SUSPEND INSTITUTION ──
export const suspendInstitution = async (req: Request, res: Response): Promise<void> => {
  try {
    const institution = await prisma.institution.update({
      where: { id: req.params.id },
      data: { status: 'SUSPENDED' }
    });

    await prisma.auditLog.create({
      data: {
        action: 'INSTITUTION_SUSPENDED',
        entity: 'Institution',
        entityId: institution.id,
        userId: req.user?.id,
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown',
      }
    });

    res.json({ success: true, message: 'Institution suspended successfully.', data: institution });
  } catch (error) {
    logger.error(`[SuperAdmin - suspendInstitution] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to suspend institution.' });
  }
};

// ── ASSIGN ADMIN ──
export const assignInstitutionAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const institutionId = req.params.id;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, error: 'User with this email already exists.' });
      return;
    }

    const pwdHash = await hashPassword(password);

    const admin = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash: pwdHash,
        role: 'ADMIN',
        institutionId,
        hasCompletedOnboarding: true, // Auto-complete for manually assigned admins
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_ASSIGNED',
        entity: 'User',
        entityId: admin.id,
        userId: req.user?.id,
        institutionId,
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown',
      }
    });

    res.json({ success: true, data: admin, message: 'Admin assigned successfully.' });
  } catch (error) {
    logger.error(`[SuperAdmin - assignAdmin] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to assign admin.' });
  }
};

// ── PLATFORM ANALYTICS ──
export const getPlatformAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalInstitutions = await prisma.institution.count();
    const totalUsers = await prisma.user.count();
    const totalAssignments = await prisma.assignment.count();
    const totalGeneratedPapers = await prisma.generatedPaper.count();

    const activeInstitutions = await prisma.institution.count({ where: { status: 'ACTIVE' } });

    res.json({
      success: true,
      data: {
        totalInstitutions,
        activeInstitutions,
        totalUsers,
        totalAssignments,
        totalGeneratedPapers
      }
    });
  } catch (error) {
    logger.error(`[SuperAdmin - getAnalytics] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch platform analytics.' });
  }
};
