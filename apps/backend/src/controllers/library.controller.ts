import { Request, Response } from 'express';
import prisma from '../config/prisma';
import fs from 'fs';
import path from 'path';

function getOrgId(req: Request): string | null {
  return (req.user?.activeOrganizationId || req.user?.organizationId) ?? null;
}

export const uploadResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const organizationId = getOrgId(req);
    if (!userId || !organizationId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { title, description, resourceType, subject, className } = req.body;
    const file = req.file;

    if (!title || !resourceType) {
      res.status(400).json({ success: false, error: 'Title and resource type are required' });
      return;
    }

    if (!file) {
      res.status(400).json({ success: false, error: 'File is required' });
      return;
    }

    const fileUrl = `/uploads/${file.filename}`;
    const fileSize = file.size;

    const resource = await prisma.libraryResource.create({
      data: {
        title,
        description,
        resourceType,
        subject,
        className,
        fileUrl,
        fileSize,
        uploadedById: userId,
        organizationId,
      },
    });

    res.status(201).json({ success: true, data: resource });
  } catch (error: any) {
    console.error('Error uploading resource:', error);
    res.status(500).json({ success: false, error: 'Failed to upload resource' });
  }
};

export const getResources = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const organizationId = getOrgId(req);
    if (!userId || !organizationId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { subject, className, resourceType, search } = req.query;

    const where: any = {
      organizationId,
      uploadedById: userId,
    };

    if (subject && subject !== 'All') {
      where.subject = String(subject);
    }
    if (className && className !== 'All') {
      where.className = String(className);
    }
    if (resourceType && resourceType !== 'All') {
      where.resourceType = String(resourceType);
    }
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { subject: { contains: String(search), mode: 'insensitive' } },
        { resourceType: { contains: String(search), mode: 'insensitive' } },
        { className: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    let resources: any[] = [];
    try {
      resources = await prisma.libraryResource.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: { select: { firstName: true, lastName: true } },
        },
      });
    } catch (err) {
      console.warn('LibraryResource query warning:', err);
    }

    const unifiedResources = [...resources];

    // Fetch Assignments
    if (!resourceType || resourceType === 'All' || resourceType === 'Assignment') {
      const assignmentWhere: any = { organizationId, createdById: userId };
      if (subject && subject !== 'All') assignmentWhere.subject = String(subject);
      if (search) {
        assignmentWhere.OR = [
          { title: { contains: String(search), mode: 'insensitive' } },
          { subject: { contains: String(search), mode: 'insensitive' } },
        ];
      }
      
      const assignments = await prisma.assignment.findMany({
        where: assignmentWhere,
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { firstName: true, lastName: true } }, class: { select: { grade: true, section: true } } }
      });
      
      const assignmentResources = assignments.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description || 'Generated Assignment',
        resourceType: 'Assignment',
        subject: a.subject,
        className: a.class ? `${a.class.grade} - ${a.class.section}` : 'General',
        fileUrl: `/dashboard/teacher/assignments/${a.id}`,
        fileSize: 0,
        uploadedById: a.createdById || '',
        uploadedBy: a.createdBy || { firstName: 'System', lastName: '' },
        organizationId: a.organizationId,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      }));
      
      unifiedResources.push(...assignmentResources);
    }

    // Fetch KnowledgeDocuments
    if (!resourceType || resourceType === 'All' || resourceType === 'Document' || resourceType === 'PDF') {
      const docWhere: any = { organizationId };
      if (search) {
        docWhere.OR = [
          { filename: { contains: String(search), mode: 'insensitive' } },
        ];
      }
      
      const docs = await prisma.knowledgeDocument.findMany({
        where: docWhere,
        orderBy: { createdAt: 'desc' }
      });
      
      const docResources = docs.map(d => ({
        id: d.id,
        title: d.filename,
        description: 'Uploaded Material',
        resourceType: 'Document',
        subject: 'General',
        className: 'General',
        fileUrl: d.fileUrl,
        fileSize: 0,
        uploadedById: '',
        uploadedBy: { firstName: 'Faculty', lastName: 'Member' },
        organizationId: d.organizationId,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
      }));
      
      unifiedResources.push(...docResources);
    }

    // Sort all by createdAt desc safely
    unifiedResources.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, data: unifiedResources });
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch resources' });
  }
};

export const updateResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { title, description, resourceType, subject, className } = req.body;

    const existing = await prisma.libraryResource.findUnique({ where: { id } });
    if (!existing || existing.uploadedById !== userId) {
      res.status(403).json({ success: false, error: 'Resource not found or unauthorized' });
      return;
    }

    const updated = await prisma.libraryResource.update({
      where: { id },
      data: {
        title,
        description,
        resourceType,
        subject,
        className,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating resource:', error);
    res.status(500).json({ success: false, error: 'Failed to update resource' });
  }
};

export const deleteResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const existing = await prisma.libraryResource.findUnique({ where: { id } });
    if (!existing || existing.uploadedById !== userId) {
      res.status(403).json({ success: false, error: 'Resource not found or unauthorized' });
      return;
    }

    if (existing.fileUrl?.startsWith('/uploads/')) {
      const filename = existing.fileUrl.replace('/uploads/', '');
      const filePath = path.join(process.cwd(), 'uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.libraryResource.delete({ where: { id } });

    res.json({ success: true, message: 'Resource deleted' });
  } catch (error: any) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ success: false, error: 'Failed to delete resource' });
  }
};

export const downloadResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const resource = await prisma.libraryResource.findUnique({ where: { id } });

    if (!resource) {
      res.status(404).json({ success: false, error: 'Resource not found' });
      return;
    }

    if (!resource.fileUrl) {
      res.status(404).json({ success: false, error: 'File not found' });
      return;
    }

    if (resource.fileUrl.startsWith('/uploads/')) {
      const filename = resource.fileUrl.replace('/uploads/', '');
      const filePath = path.join(process.cwd(), 'uploads', filename);
      if (fs.existsSync(filePath)) {
        res.download(filePath, resource.title);
      } else {
        res.status(404).json({ success: false, error: 'File missing from server' });
      }
    } else {
      res.redirect(resource.fileUrl);
    }
  } catch (error: any) {
    console.error('Error downloading resource:', error);
    res.status(500).json({ success: false, error: 'Failed to download resource' });
  }
};

export const viewResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const resource = await prisma.libraryResource.findUnique({ where: { id } });

    if (!resource) {
      res.status(404).json({ success: false, error: 'Resource not found' });
      return;
    }

    if (!resource.fileUrl) {
      res.status(404).json({ success: false, error: 'File not found' });
      return;
    }

    if (resource.fileUrl.startsWith('/uploads/')) {
      const filename = resource.fileUrl.replace('/uploads/', '');
      const filePath = path.join(process.cwd(), 'uploads', filename);
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        res.status(404).json({ success: false, error: 'File missing from server' });
      }
    } else {
      res.redirect(resource.fileUrl);
    }
  } catch (error: any) {
    console.error('Error viewing resource:', error);
    res.status(500).json({ success: false, error: 'Failed to view resource' });
  }
};
