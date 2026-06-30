import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FormulaConfig {
  directWeight: number; // e.g., 0.8
  indirectWeight: number; // e.g., 0.2
  components: {
    assignments: number; // e.g., 0.2
    quizzes: number; // e.g., 0.2
    midterm: number; // e.g., 0.3
    semester: number; // e.g., 0.3
  }
}

const DEFAULT_FORMULA: FormulaConfig = {
  directWeight: 0.8,
  indirectWeight: 0.2,
  components: {
    assignments: 0.2,
    quizzes: 0.2,
    midterm: 0.3,
    semester: 0.3
  }
};

export class AttainmentService {
  
  /**
   * Calculates the overall attainment for a specific Course Outcome.
   * Directs attainment comes from graded submissions, Indirect from survey metrics.
   */
  async calculateCourseOutcomeAttainment(coId: string, courseId: string, formula: FormulaConfig = DEFAULT_FORMULA): Promise<number> {
    // 1. Fetch CO Details
    const co = await prisma.courseOutcome.findUnique({ where: { id: coId } });
    if (!co) throw new Error('Course Outcome not found');

    // 2. Mock Direct Attainment Calculation
    // In production, this would query all Assignments and Quizzes mapped to this CO,
    // fetch the Student Submissions, and calculate the weighted average of their scores.
    const directAttainment = this.aggregateDirectScores(courseId);

    // 3. Mock Indirect Attainment Calculation
    // In production, this would query Course Exit Surveys and Student Feedback mapped to this CO.
    const indirectAttainment = this.aggregateIndirectScores(courseId);

    // 4. Combine based on Formula
    const overallAttainment = (directAttainment * formula.directWeight) + (indirectAttainment * formula.indirectWeight);

    // 5. CQI Orchestration: Check if attainment is below threshold (e.g. 70%)
    if (overallAttainment < 70) {
      await this.flagForCQI(coId, overallAttainment);
    }

    return parseFloat(overallAttainment.toFixed(2));
  }

  /**
   * Calculates attainment for a Program Outcome based on the CoPoMapping weights.
   */
  async calculateProgramOutcomeAttainment(poId: string, organizationId: string): Promise<number> {
    // 1. Fetch all CO mappings for this PO
    const mappings = await prisma.coPoMapping.findMany({
      where: { poId }
    });

    if (mappings.length === 0) return 0;

    let totalWeight = 0;
    let weightedAttainmentSum = 0;

    // 2. Calculate weighted average of associated COs
    for (const mapping of mappings) {
      const coAttainment = await this.calculateCourseOutcomeAttainment(mapping.coId, 'mock-course-id');
      weightedAttainmentSum += coAttainment * mapping.weightage;
      totalWeight += mapping.weightage;
    }

    const poAttainment = totalWeight > 0 ? (weightedAttainmentSum / totalWeight) : 0;
    return parseFloat(poAttainment.toFixed(2));
  }

  private aggregateDirectScores(courseId: string): number {
    // Simulated DB aggregation over assessments
    // SELECT AVG(score) FROM Submission s JOIN Assessment a ON s.assessmentId = a.id WHERE a.courseId = courseId
    return Math.random() * (95 - 65) + 65; // Random between 65 and 95
  }

  private aggregateIndirectScores(courseId: string): number {
    // Simulated DB aggregation over surveys
    return Math.random() * (90 - 70) + 70; // Random between 70 and 90
  }

  private async flagForCQI(coId: string, attainment: number) {
    // Create an actionable alert for the Teacher/Department Head
    console.log(`[CQI Alert] CO ${coId} has dropped below target threshold to ${attainment}%. Triggering Action Taken Report workflow.`);
    // In production: Create a notification record in the DB
  }
}

export const attainmentService = new AttainmentService();
