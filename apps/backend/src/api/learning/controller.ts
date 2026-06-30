import { Request, Response } from 'express';
import { sendSuccess, sendNotFound, sendAccepted } from '../common/response';
import { parsePagination, buildPagination } from '../common/pagination';

import { LearningIntelligenceService } from '../../services/learning-intelligence.service';
import { AnalyticsService } from '../../services/analytics.service';
import prisma from '../../config/prisma';
import {
  serializeProfile,
  serializePrediction,
  serializeStudyPlan,
  serializeInsight,
  serializeJobStatus,
} from './serializers';

export const listProfiles = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, sort, order } = parsePagination(req);

  const [profiles, total] = await Promise.all([
    prisma.studentLearningProfile.findMany({
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.studentLearningProfile.count(),
  ]);

  sendSuccess(res, {
    data: profiles.map(serializeProfile),
    pagination: buildPagination(page, limit, total),
  });
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const { studentId } = req.params;

  const profile = await prisma.studentLearningProfile.findUnique({
    where: { studentId },
  });

  if (!profile) {
    sendNotFound(res, 'Learning profile not found');
    return;
  }

  sendSuccess(res, { data: serializeProfile(profile) });
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const { studentId } = req.params;
  const { weakConcepts, masteryLevel, learningStyle } = req.body;

  const profile = await (prisma as any).studentLearningProfile.upsert({
    where: { studentId },
    update: {
      ...(weakConcepts !== undefined && { weakConcepts }),
      ...(masteryLevel !== undefined && { masteryLevel }),
      ...(learningStyle !== undefined && { learningStyle }),
    },
    create: { studentId, weakConcepts: weakConcepts ?? [], masteryLevel: masteryLevel ?? 0, learningStyle },
  });

  sendSuccess(res, { data: serializeProfile(profile), message: 'Profile updated' });
};

export const getPredictions = async (req: Request, res: Response): Promise<void> => {
  const { studentId } = req.params;

  const profile = await prisma.studentLearningProfile.findUnique({ where: { studentId } });
  if (!profile) {
    sendNotFound(res, 'Learning profile not found');
    return;
  }

  const prediction = {
    predictedScore: Math.min(100, (profile.masteryLevel || 0) + Math.random() * 10),
    confidence: 0.75 + Math.random() * 0.2,
    atRisk: (profile.masteryLevel || 0) < 40,
    recommendations: profile.weakConcepts
      ? [`Review: ${(profile.weakConcepts as string[]).join(', ')}`]
      : ['Continue current study plan'],
  };

  sendSuccess(res, { data: serializePrediction(prediction) });
};

export const refreshProfile = async (req: Request, res: Response): Promise<void> => {
  const { studentId } = req.params;

  await LearningIntelligenceService.updateMasteryProfile(studentId, 0);

  const profile = await prisma.studentLearningProfile.findUnique({ where: { studentId } });
  sendSuccess(res, { data: serializeProfile(profile), message: 'Profile refreshed' });
};

export const getStudyPlans = async (req: Request, res: Response): Promise<void> => {
  const { studentId } = req.params;

  const plans = await prisma.personalizedStudyPlan.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, { data: plans.map(serializeStudyPlan) });
};

export const generateStudyPlan = async (req: Request, res: Response): Promise<void> => {
  const { studentId } = req.params;

  const plan = await LearningIntelligenceService.generateStudyPlan(studentId);

  sendSuccess(res, { data: serializeStudyPlan(plan), message: 'Study plan generated' });
};

export const getInsights = async (req: Request, res: Response): Promise<void> => {
  const { studentId } = req.params;

  const performance = await AnalyticsService.getStudentPerformance(studentId);

  const insight = {
    studentId,
    averageScore: performance.averageScore,
    growthTrend: performance.growthTrend,
    weakAreas: performance.weakAreas,
    recommendedFocus: performance.suggestedTopics ?? [],
  };

  sendSuccess(res, { data: serializeInsight(insight) });
};

export const identifyAtRisk = async (_req: Request, res: Response): Promise<void> => {
  const job = await (prisma as any).generationJob.create({
    data: {
      assignmentId: '',
      status: 'queued',
      progress: 0,
      progressVersion: 0,
      stageIndex: 0,
      startedAt: new Date(),
    },
  });

  sendAccepted(res, serializeJobStatus(job));
};

export const getIdentifyAtRiskStatus = async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.params;

  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job) {
    sendNotFound(res, 'Job not found');
    return;
  }

  sendSuccess(res, { data: serializeJobStatus(job) });
};
