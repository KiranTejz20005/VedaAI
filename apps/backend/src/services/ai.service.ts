import type { Job } from 'bullmq';
import { logger } from '../utils/logger';
import { AIOrchestrator } from './ai/ai-orchestrator.service';
import { retrieveContext } from './rag.service';
import { validatePaperOrThrow, type ValidatedPaper } from '../validators/paper.validator';
import type { IAssignment } from '../types/models.types';
import type { GenerationJobData } from '../types/queue.types';
import type { GenerationStage } from '../types/socket.types';
import type { QuestionTypeBreakdown } from '../prompts/generation.prompt';

export interface GenerationOutcome {
  paper: ValidatedPaper;
  warnings?: string[];
  metrics?: Record<string, any>;
  retries?: number;
}

export async function generatePaper(
  assignment: IAssignment,
  uploadedContent?: string,
  typeBreakdown?: QuestionTypeBreakdown[],
  job?: Job<GenerationJobData>,
  onStage?: (stage: GenerationStage, progress: number, message: string) => Promise<void>,
  signal?: AbortSignal
): Promise<GenerationOutcome> {
  if (signal?.aborted) throw new Error('Generation cancelled');

  const reportProgress = async (stage: GenerationStage, progress: number, msg: string) => {
    if (signal?.aborted) throw new Error('Generation cancelled');
    if (onStage) await onStage(stage, progress, msg);
    if (job) await job.updateProgress(progress).catch(() => {});
  };

  await reportProgress('extracting_content', 10, 'Retrieving institutional context...');

  // 1. Hybrid RAG Context Retrieval
  let ragContext = '';
  try {
    // If organizationId isn't on IAssignment, we pass '' for now
    ragContext = await retrieveContext(assignment.title || 'General Examination', '', 10);
  } catch (e) {
    logger.warn(`Failed to retrieve RAG context for paper generation: ${e}`);
  }

  const combinedContext = [uploadedContent, ragContext].filter(Boolean).join('\n\n');

  await reportProgress('generation_planning', 30, 'Planning paper generation via AI Orchestrator...');

  // 2. Strict JSON Schema for Paper Generation
  const responseFormat = {
    type: "json_schema",
    json_schema: {
      name: "generated_paper",
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          totalMarks: { type: "number" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                marks: { type: "number" },
                instructions: { type: "string" },
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      type: { type: "string" },
                      question: { type: "string" },
                      marks: { type: "number" },
                      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                      bloomLevel: { type: "string", enum: ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"] },
                      options: { type: "array", items: { type: "string" } },
                      hint: { type: "string" }
                    },
                    required: ["id", "type", "question", "marks", "difficulty", "bloomLevel"]
                  }
                }
              },
              required: ["title", "marks", "instructions", "questions"]
            }
          }
        },
        required: ["title", "totalMarks", "sections"]
      }
    }
  };

  const taskInstructions = `
You are an Expert Question Paper Setter. Generate a complete examination paper.
Assignment Title: ${assignment.title}
Total Marks: ${assignment.totalMarks}

CRITICAL RULES:
1. Return EXACTLY the JSON schema requested.
2. Distribute questions appropriately into sections (e.g. Section A, Section B).
3. The sum of all question marks must equal exactly ${assignment.totalMarks}.
4. Map EVERY question to a valid Bloom's Taxonomy level and Difficulty level.
5. Use the provided context to ensure questions are grounded in the actual syllabus.
6. Avoid semantic duplicates. Ensure all questions are unique.
${typeBreakdown ? `7. Adhere to this breakdown: ${JSON.stringify(typeBreakdown)}` : ''}
`;

  await reportProgress('batch_generating', 50, 'Generating paper sections and validating constraints...');

  // 3. Execution via AI Orchestrator (Provider Agnostic with proactive failover)
  const generatedData = await AIOrchestrator.generate({
    intent: 'GenerateQuestionPaper',
    context: combinedContext,
    taskInstructions,
    responseFormat,
    signal,
  });

  await reportProgress('validating', 80, 'Validating generated paper format...');

  // Validate the resulting JSON against our internal Zod validator
  const validatedPaper = validatePaperOrThrow(generatedData);

  await reportProgress('completed', 100, 'Paper generation successful.');

  return {
    paper: validatedPaper,
    warnings: [],
    metrics: { method: 'AIOrchestrator', length: combinedContext.length }
  };
}


export async function generateAnswersForPaper(paper: ValidatedPaper, signal?: AbortSignal): Promise<ValidatedPaper> {
  if (signal?.aborted) throw new Error('Answer generation cancelled');
  const responseFormat = {
    type: "json_schema",
    json_schema: {
      name: "generated_answers_and_rubric",
      schema: {
        type: "object",
        properties: {
          answers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                questionId: { type: "string" },
                answer: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    explanation: { type: "string" },
                    expectedConcepts: { type: "array", items: { type: "string" } },
                    rubricCriteria: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          marks: { type: "number" },
                          description: { type: "string" }
                        },
                        required: ["name", "marks", "description"]
                      }
                    }
                  },
                  required: ["text", "expectedConcepts", "rubricCriteria"]
                }
              },
              required: ["questionId", "answer"]
            }
          }
        },
        required: ["answers"]
      }
    }
  };

  const questionsJson = JSON.stringify(paper.sections.map(s => s.questions).flat().map(q => ({ id: q.id, question: q.question, marks: q.marks })));

  const taskInstructions = `
Generate comprehensive answer keys, expected concepts, and grading rubrics for the following questions:
${questionsJson}

CRITICAL RULES:
1. Provide a detailed answer for each question.
2. Provide 'expectedConcepts' indicating exactly what concepts must be present for full marks.
3. Provide 'rubricCriteria' breaking down the question's total marks into specific actionable criteria for the AI Grader.
`;

  const generatedData = await AIOrchestrator.generate({
    intent: 'GenerateQuestionPaper',
    context: '',
    taskInstructions,
    responseFormat,
    signal,
  });

  // Merge the generated answers back into the paper
  const answerMap = new Map();
  if (generatedData.answers) {
    for (const ans of generatedData.answers) {
      answerMap.set(ans.questionId, ans.answer);
    }
  }

  const updatedPaper = { ...paper, sections: [...paper.sections] };
  for (const section of updatedPaper.sections) {
    for (const question of section.questions) {
      if (answerMap.has(question.id)) {
        question.answer = answerMap.get(question.id);
      }
    }
  }

  return updatedPaper;
}

export function getProviderHealthSnapshot() {
  return AIOrchestrator.getHealthSnapshot();
}
