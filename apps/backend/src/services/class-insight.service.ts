import prisma from '../config/prisma';
import { AIOrchestrator } from './ai/ai-orchestrator.service';

export class ClassInsightService {
  /**
   * Analyzes an entire class's performance and generates a persistent AcademicReport.
   */
  static async generateProactiveInsights(organizationId: string, userId: string, subject: string) {
    // 1. Pull recent quiz sessions for the organization/subject
    const recentQuizzes = await prisma.quizSession.findMany({
      where: { organizationId, subject },
      take: 20,
      orderBy: { createdAt: 'desc' }
    });

    if (recentQuizzes.length === 0) return null;

    let totalScore = 0;
    const maxPossibleScore = recentQuizzes.length * 100; // Assuming 100 per quiz
    
    recentQuizzes.forEach(q => totalScore += q.score);
    const averageScore = (totalScore / maxPossibleScore) * 100;

    const prompt = `
Analyze the following class performance data and generate an academic insight report.
Subject: ${subject}
Average Score: ${averageScore.toFixed(1)}%
Total Quizzes Evaluated: ${recentQuizzes.length}

CRITICAL RULES:
1. Identify if the class is "On Track", "At Risk", or "Needs Revision".
2. Recommend a specific action for the teacher (e.g., "Schedule a flash revision on Chapter 4").
`;

    const responseFormat = {
      type: "json_schema",
      json_schema: {
        name: "class_insight",
        schema: {
          type: "object",
          properties: {
            classStatus: { type: "string" },
            primaryWeakness: { type: "string" },
            teacherRecommendation: { type: "string" }
          },
          required: ["classStatus", "primaryWeakness", "teacherRecommendation"]
        }
      }
    };

    const insightData = await AIOrchestrator.generate({
      intent: 'GradeAssignment', // Reusing grading/eval intent for analysis
      context: '', 
      taskInstructions: prompt,
      responseFormat
    });

    const report = await prisma.academicReport.create({
      data: {
        userId,
        organizationId,
        title: `Proactive Insights: ${subject}`,
        reportType: 'CLASS_PERFORMANCE',
        content: insightData
      }
    });

    return report;
  }
}
