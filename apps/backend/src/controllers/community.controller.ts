import { Request, Response } from 'express';
import { CommunityService } from '../services/community.service';
import { z } from 'zod';

const createPostSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1),
  type: z.enum(['DISCUSSION', 'QUESTION', 'PROJECT', 'ANNOUNCEMENT']).default('DISCUSSION'),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'ORG_ONLY']).default('PUBLIC'),
  attachments: z.array(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

const createGroupSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  type: z.enum(['PUBLIC', 'PRIVATE', 'INVITE_ONLY']).default('PUBLIC'),
});

export const createPost = async (req: Request, res: Response) => {
  const data = createPostSchema.parse(req.body);
  const post = await CommunityService.createPost(
    req.user!.id,
    data.content,
    data.type,
    data.visibility,
    data.attachments,
    req.user!.organizationId ? req.user!.organizationId : undefined,
    data.title,
    data.tags
  );
  res.status(201).json({ status: 'success', data: post });
};

export const getFeed = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const cursor = req.query.cursor as string;
  const posts = await CommunityService.getFeed(req.user!.organizationId ? req.user!.organizationId : undefined, limit, cursor);
  res.status(200).json({ status: 'success', data: posts });
};

export const getGroups = async (req: Request, res: Response) => {
  const groups = await CommunityService.getGroups(
    req.user!.organizationId ? req.user!.organizationId : undefined,
    req.user!.id
  );
  res.status(200).json({ status: 'success', data: groups });
};

export const createGroup = async (req: Request, res: Response) => {
  const data = createGroupSchema.parse(req.body);
  const group = await CommunityService.createGroup(
    req.user!.id,
    data.name,
    data.description || '',
    data.type,
    req.user!.organizationId ?? undefined
  );
  res.status(201).json({ status: 'success', data: group });
};

export const joinGroup = async (req: Request, res: Response) => {
  const groupId = req.params.groupId;
  const membership = await CommunityService.joinGroup(groupId, req.user!.id);
  res.status(200).json({ status: 'success', data: membership });
};
