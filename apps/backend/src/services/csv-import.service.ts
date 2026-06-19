import { createInvitation } from './invitation.service';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';
import { SystemRole } from '@prisma/client';

export interface CsvImportReport {
  created: number;
  skipped: number;
  duplicates: number;
  invalidEmails: number;
  errors: Array<{ row: number; email: string; error: string }>;
}

export const processCsvImport = async (csvData: string, organizationId: string, createdById: string): Promise<CsvImportReport> => {
  const lines = csvData.split('\n').filter(line => line.trim() !== '');
  const report: CsvImportReport = {
    created: 0,
    skipped: 0,
    duplicates: 0,
    invalidEmails: 0,
    errors: []
  };

  if (lines.length < 2) return report; // No data rows

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  const emailIdx = headers.indexOf('email');
  const roleIdx = headers.indexOf('role');

  if (emailIdx === -1 || roleIdx === -1) {
    throw new Error('CSV must contain "email" and "role" columns.');
  }

  // Pre-fetch existing emails to quickly check duplicates
  const existingUsers = await prisma.user.findMany({ select: { email: true } });
  const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

  const pendingInvitations = await prisma.invitation.findMany({ where: { status: 'PENDING' }, select: { email: true } });
  const pendingEmails = new Set(pendingInvitations.map(i => i.email.toLowerCase()));

  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(',').map(col => col.trim());
    if (columns.length < headers.length) continue;

    const email = columns[emailIdx].toLowerCase();
    const roleStr = columns[roleIdx].toUpperCase();

    // Basic email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      report.invalidEmails++;
      report.errors.push({ row: i, email, error: 'Invalid email format' });
      continue;
    }

    if (existingEmails.has(email)) {
      report.duplicates++;
      report.errors.push({ row: i, email, error: 'User already exists' });
      continue;
    }

    if (!['TEACHER', 'STUDENT', 'ADMIN'].includes(roleStr)) {
      report.skipped++;
      report.errors.push({ row: i, email, error: `Invalid role: ${roleStr}` });
      continue;
    }

    try {
      await createInvitation({
        email,
        role: roleStr as SystemRole,
        organizationId,
        createdById
      });
      report.created++;
      pendingEmails.add(email);
    } catch (err: any) {
      report.skipped++;
      report.errors.push({ row: i, email, error: err.message });
      logger.error(`[CSV Import] Error creating invite for ${email}: ${err.message}`);
    }
  }

  return report;
};
