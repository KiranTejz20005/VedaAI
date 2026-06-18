import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import prisma from '../config/prisma';
import { callAI } from './question-generation.service';
import { logger } from '../utils/logger';

export async function extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    const buffer = await fs.readFile(filePath);
    const parsed = await pdfParse(buffer);
    return parsed.text || '';
  } else if (mimeType === 'text/plain') {
    return await fs.readFile(filePath, 'utf-8');
  }
  // Fallback for DOCX/other types
  return await fs.readFile(filePath, 'utf-8').catch(() => '');
}

export async function evaluateSubmission(submissionId: string): Promise<any> {
  const submission = await prisma.studentSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    throw new Error('Submission not found');
  }

  // Get Assignment config
  const config = await prisma.assignmentGradingConfig.findUnique({
    where: { assignmentId: submission.assignmentId },
    include: { rubric: { include: { criteria: true } } },
  });

  if (!config) {
    throw new Error('Grading configuration not found for this assignment');
  }

  const studentAnswerText = await extractTextFromFile(submission.fileUrl, submission.fileType);

  const rubricPrompt = config.rubric
    ? `Use the following Rubric Criteria to evaluate the student's submission:\n` +
      config.rubric.criteria.map((c) => `- ${c.name} (Max Marks: ${c.maxMarks}): ${c.description}`).join('\n')
    : 'No rubric provided. Evaluate overall correctness.';

  const systemPrompt = `You are an expert AI Assignment Grader. Your task is to evaluate a student's submission against an answer key and optionally a rubric.

Rules:
- Be fair and detailed.
- Check accuracy, completeness, structure, and grammar.
- Provide a score and explanation for each rubric criterion.
- Output ONLY valid JSON containing a score, total marks, general feedback, and criterion-by-criterion breakdown.
- Output format:
{
  "score": 85,
  "totalMarks": 100,
  "generalFeedback": "Excellent work overall...",
  "criteriaGrades": [
    {
      "criteriaId": "some-id",
      "name": "Accuracy",
      "score": 25,
      "explanation": "Correct use of concepts..."
    }
  ]
}`;

  const prompt = `
Answer Key:
${config.answerKeyText}

Rubric:
${rubricPrompt}

Student Submission:
${studentAnswerText}

Evaluate the submission and return the structured JSON.`;

  logger.info({ submissionId }, 'AI Assignment Evaluation started');

  try {
    const rawResult = await callAI(prompt, systemPrompt);
    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON output returned by LLM');
    }
    const data = JSON.parse(jsonMatch[0]);

    // Save evaluation to database
    const evaluation = await prisma.submissionEvaluation.upsert({
      where: { submissionId },
      create: {
        submissionId,
        score: Number(data.score) || 0,
        totalMarks: Number(data.totalMarks) || 100,
        generalFeedback: data.generalFeedback || '',
        criteriaGrades: data.criteriaGrades || [],
      },
      update: {
        score: Number(data.score) || 0,
        totalMarks: Number(data.totalMarks) || 100,
        generalFeedback: data.generalFeedback || '',
        criteriaGrades: data.criteriaGrades || [],
      },
    });

    await prisma.studentSubmission.update({
      where: { id: submissionId },
      data: { status: 'GRADED' },
    });

    logger.info({ submissionId, score: evaluation.score }, 'AI Assignment Evaluation completed');
    return evaluation;
  } catch (error) {
    logger.error(error, `AI Assignment Evaluation failed for submissionId: ${submissionId}`);
    throw error;
  }
}
