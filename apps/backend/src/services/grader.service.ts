import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import prisma from '../config/prisma';
import { AIOrchestrator } from './ai/ai-orchestrator.service';
import { logger } from '../utils/logger';
import { retrieveContext } from './rag.service';
import { invalidateCache } from '../api/common/cache';

export async function extractTextFromFile(filePath: string, fileType: string): Promise<string> {
  try {
    const isPdf = fileType === 'PDF' || fileType === 'application/pdf';
    const isImage = fileType.startsWith('image/') || ['.png', '.jpg', '.jpeg'].includes(path.extname(filePath).toLowerCase());
    
    if (isPdf) {
      const buffer = await fs.readFile(filePath);
      const parsed = await pdfParse(buffer);
      return parsed.text || '';
    }

    if (isImage) {
      const buffer = await fs.readFile(filePath);
      const base64Image = buffer.toString('base64');
      const mediaType = fileType === 'image/png' || filePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      
      const result = await AIOrchestrator.generate({
        intent: 'OCRPostProcessing',
        context: '',
        taskInstructions: 'Please transcribe all the handwritten or printed text in this image accurately. Do not add any extra commentary, just return the text exactly as it appears.',
        media: [
          {
            type: 'image_url',
            url: `data:${mediaType};base64,${base64Image}`
          }
        ]
      });
      return result || '';
    }
    
    // Fallback for TXT/DOCX/other types
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    logger.error({ error, filePath, fileType }, 'Failed to extract text from file');
    return '';
  }
}

export async function evaluateSubmission(submissionId: string): Promise<any> {
  const submission = await prisma.studentSubmission.findUnique({
    where: { id: submissionId },
    include: { assignment: true },
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
    ? `Use the following AI-Structured Rubric Criteria to evaluate the student's submission.
       EVALUATE EVERY CRITERION INDEPENDENTLY.
       For each criterion:
       - Check for Semantic matches (synonyms, equivalent logic, conceptual understanding). DO NOT use strict keyword matching.
       - Use intelligent partial marking if the core concept or logic exists.
       - Provide an explicit "explanation" detailing exactly why marks were awarded, why they were deducted, what concepts were missing, and the evidence found in the answer.

       Rubric Criteria:
` +
      config.rubric.criteria.map((c: any) => 
        `- ${c.name} (ID: ${c.id}) 
         Max Marks: ${c.maxMarks}
         Description: ${c.description}
         Expected Concepts: ${c.expectedConcepts ? JSON.stringify(c.expectedConcepts) : 'N/A'}
         Teacher Notes: ${c.teacherNotes ? c.teacherNotes : 'N/A'}`
      ).join('\n\n')
    : 'No rubric provided. Evaluate overall correctness.';


  let ragContext = '';
  if (submission.assignment.organizationId) {
    try {
      ragContext = await retrieveContext(studentAnswerText.substring(0, 1000), submission.assignment.organizationId, 3);
    } catch (e) {
      logger.warn(`Failed to retrieve RAG context: ${e}`);
    }
  }

  const prompt = [
    'Answer Key:',
    config.answerKeyText,
    '',
    'Rubric with Semantic Expectations & Policies:',
    rubricPrompt,
    '',
    'Student Submission:',
    studentAnswerText,
    '',
    'Task: Evaluate the submission. You MUST return a structured JSON object containing a total score, general feedback, and an array of criteria grades. Each criterion grade must contain the criterion ID, score, and a detailed EXPLAINABLE reason highlighting missing concepts and matched evidence.'
  ].join('\n');


  logger.info({ submissionId }, 'AI Assignment Evaluation started');

  try {
    const data = await AIOrchestrator.generate({
      intent: 'EvaluateAssignment',
      context: ragContext,
      taskInstructions: prompt,
      responseFormat: { type: 'json_object' }
    });

    const correctTotalMarks = config.rubric 
      ? config.rubric.criteria.reduce((sum, c) => sum + c.maxMarks, 0)
      : submission.assignment.totalMarks;

    // Save evaluation to database
    const evaluation = await prisma.submissionEvaluation.upsert({
      where: { submissionId },
      create: {
        submissionId,
        score: Number(data.score) || 0,
        totalMarks: correctTotalMarks,
        generalFeedback: data.generalFeedback || '',
        criteriaGrades: data.criteriaGrades || [],
      },
      update: {
        score: Number(data.score) || 0,
        totalMarks: correctTotalMarks,
        generalFeedback: data.generalFeedback || '',
        criteriaGrades: data.criteriaGrades || [],
      },
    });

    await prisma.studentSubmission.update({
      where: { id: submissionId },
      data: { status: 'GRADED' },
    });

    // Invalidate cached student-performance analytics so fresh scores are reflected
    await invalidateCache(`analytics:student:${submission.studentId}`).catch(() => {});

    logger.info({ submissionId, score: evaluation.score }, 'AI Assignment Evaluation completed');
    return evaluation;
  } catch (error) {
    logger.error(error, `AI Assignment Evaluation failed for submissionId: ${submissionId}`);
    throw error;
  }
}
