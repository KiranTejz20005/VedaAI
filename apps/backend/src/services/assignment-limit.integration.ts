/**
 * Integration code to add to assignment.service.ts
 * This file shows what needs to be added to the existing service
 */

import { getRedisClient } from '../config/redis';
import { DailyLimitService } from './daily-limit.service';

const dailyLimitService = new DailyLimitService(getRedisClient());

/**
 * After successful assignment creation, track usage
 * Call this in the createAssignment() method after assignment is saved
 */
export async function trackAssignmentCreation(userId: string, role: string): Promise<void> {
  try {
    // For teachers and faculty, track assignment creation
    if (role === 'TEACHER' || role === 'FACULTY') {
      await dailyLimitService.incrementUsage(userId, 'assignment');
    }
  } catch (error) {
    console.error('[AssignmentLimit] Failed to track assignment creation', error);
    // Don't throw - just log the error to avoid breaking the flow
  }
}

/**
 * After successful paper generation, track usage
 * Call this in the aiGeneration.worker.ts after paper is successfully generated
 */
export async function trackPaperGeneration(userId: string, role: string): Promise<void> {
  try {
    // For teachers and faculty, track paper generation
    if (role === 'TEACHER' || role === 'FACULTY') {
      await dailyLimitService.incrementUsage(userId, 'paper');
    }
  } catch (error) {
    console.error('[PaperLimit] Failed to track paper generation', error);
    // Don't throw - just log the error to avoid breaking the flow
  }
}

/**
 * After successful quiz generation, track usage
 * Call this in the generation.controller.ts after quiz is successfully created
 */
export async function trackQuizGeneration(userId: string, role: string): Promise<void> {
  try {
    // For students and all users, track quiz generation
    if (role === 'STUDENT' || role === 'TEACHER' || role === 'FACULTY') {
      await dailyLimitService.incrementUsage(userId, 'quiz');
    }
  } catch (error) {
    console.error('[QuizLimit] Failed to track quiz generation', error);
    // Don't throw - just log the error to avoid breaking the flow
  }
}
