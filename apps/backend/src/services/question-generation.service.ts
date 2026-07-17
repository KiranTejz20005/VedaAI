import { retrieveContext } from './rag.service';
import { logger } from '../utils/logger';
import { AIOrchestrator } from './ai/ai-orchestrator.service';

export interface GeneratedQuestion {
  id: string;
  question_text: string;
  options: string[];
  answer: string;
  difficulty: string;
  bloomLevel: string;
  ai_confidence_score: number;
  hint?: string;
}

export class ImageRefError extends Error {
  constructor() { super('Uploaded content contained image references which were removed. Please use text-only content.'); }
}

export async function generateSingleQuestion(params: {
  topic: string;
  subject: string;
  difficulty: string;
  bloomLevel: string;
  context?: string;
  organizationId?: string;
}): Promise<GeneratedQuestion> {

  let ragContext = '';
  if (params.organizationId) {
    try {
      // The retriever automatically handles Hybrid Search & Context Expansion
      ragContext = await retrieveContext(params.topic, params.organizationId, 5);
    } catch (e) {
      logger.warn(`Failed to retrieve RAG context for question gen: ${e}`);
    }
  }

  // Define structured JSON schema for the AI output
  const responseFormat = { type: "json_object" };

  const taskInstructions = [
    `Topic: ${params.topic}`,
    `Subject: ${params.subject}`,
    `Difficulty: ${params.difficulty}`,
    `Bloom's Taxonomy Level: ${params.bloomLevel}`,
    'Task: Generate one high-quality, unique multiple-choice question.',
    'Rules:',
    '- Include exactly 4 plausible options (A, B, C, D)',
    '- Mark the correct answer clearly as exactly "A", "B", "C", or "D"',
    '- Include a helpful, subtle hint (max 1 sentence)',
    '- Return ONLY valid JSON matching this exact structure: { "question_text": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A", "explanation": "...", "hint": "...", "ai_confidence_score": 0.95 }'
  ].join('\n');

  let parsed: any = { options: [], answer: 'A', question_text: '' };
  try {
    const aiPromise = AIOrchestrator.generate({
      intent: 'GenerateQuestionPaper', // Routes to deeper reasoning models
      context: [params.context, ragContext].filter(Boolean).join('\n\n'),
      taskInstructions,
      responseFormat
    });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("AI generation timed out")), 60000));
    parsed = await Promise.race([aiPromise, timeoutPromise]);
  } catch (err) {
    logger.warn(`AI Generation failed for single question, falling back. Error: ${err}`);
  }

  const options = (parsed.options as string[]) ?? ['A. Option A', 'B. Option B', 'C. Option C', 'D. Option D'];
  const answer = (parsed.answer as string) ?? 'A';

  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    question_text: (parsed.question_text as string) ?? `Question about ${params.topic}`,
    options,
    answer,
    difficulty: params.difficulty,
    bloomLevel: params.bloomLevel,
    ai_confidence_score: (parsed.ai_confidence_score as number) ?? 0.85,
    hint: (parsed.hint as string) || undefined,
  };
}

export interface BlueprintSlot {
  id: string;
  coId: string;
  title: string;
  marks: number;
  bloomLevel: string;
  topic?: string;
  itemType: string;
}

export interface BlueprintGenerationResult {
  slotId: string;
  questions: GeneratedQuestion[];
  coId: string;
  bloomLevel: string;
  marks: number;
}

export async function generateFromBlueprint(params: {
  blueprintId: string;
  slots: BlueprintSlot[];
  subject: string;
  difficulty: string;
  context?: string;
  organizationId?: string;
  excludeQuestionIds?: string[];
}): Promise<BlueprintGenerationResult[]> {
  const results: BlueprintGenerationResult[] = [];

  for (const slot of params.slots) {
    const slotQuestions = await generateMultipleQuestions({
      topic: slot.topic || slot.title,
      subject: params.subject,
      difficulty: params.difficulty,
      bloomLevel: slot.bloomLevel,
      context: params.context,
      organizationId: params.organizationId,
      count: Math.max(1, Math.ceil(slot.marks / 5)),
    });

    results.push({
      slotId: slot.id,
      questions: slotQuestions,
      coId: slot.coId,
      bloomLevel: slot.bloomLevel,
      marks: slot.marks,
    });
  }

  return results;
}

export async function generateMultipleQuestions(params: {
  topic: string;
  subject: string;
  difficulty: string;
  bloomLevel: string;
  context?: string;
  organizationId?: string;
  count: number;
}): Promise<GeneratedQuestion[]> {

  let ragContext = '';
  if (params.organizationId) {
    try {
      ragContext = await retrieveContext(params.topic, params.organizationId, 5);
    } catch (e) {
      logger.warn(`Failed to retrieve RAG context for question gen: ${e}`);
    }
  }

  const responseFormat = { type: "json_object" };

  const taskInstructions = [
    `Topic: ${params.topic}`,
    `Subject: ${params.subject}`,
    `Difficulty: ${params.difficulty}`,
    `Bloom's Taxonomy Level: ${params.bloomLevel}`,
    `Task: Generate exactly ${params.count} high-quality, completely distinct multiple-choice questions.`,
    'Rules:',
    '- No two questions should test the exact same concept or have similar phrasing.',
    '- Include exactly 4 plausible options (A, B, C, D) per question.',
    '- Mark the correct answer clearly as exactly "A", "B", "C", or "D".',
    '- Include a helpful, subtle hint (max 1 sentence) per question.',
    '- Return ONLY valid JSON matching this exact structure: { "questions": [ { "question_text": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A", "explanation": "...", "hint": "...", "ai_confidence_score": 0.95 } ] }'
  ].join('\n');

  let parsed: any = { questions: [] };
  try {
    const aiPromise = AIOrchestrator.generate({
      intent: 'GenerateQuestionPaper', 
      context: [params.context, ragContext].filter(Boolean).join('\n\n'),
      taskInstructions,
      responseFormat
    });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("AI generation timed out")), 60000));
    parsed = await Promise.race([aiPromise, timeoutPromise]);
  } catch (err) {
    logger.warn(`AI Generation failed, falling back to mock questions. Error: ${err}`);
    // Mock fallback
    parsed = {
      questions: Array.from({ length: params.count }).map((_, i) => ({
        question_text: `[Mock] What is a key concept in ${params.topic}? (${i + 1})`,
        options: ['A. It is fundamental', 'B. It is irrelevant', 'C. It is deprecated', 'D. None of the above'],
        answer: 'A',
        explanation: 'This is a mocked explanation since the AI provider was unavailable.',
        hint: 'Think about the basics.',
        ai_confidence_score: 0.99
      }))
    };
  }

  const questionsList = (parsed.questions as any[]) ?? [];

  return questionsList.map((item, index) => {
    const options = (item.options as string[]) ?? ['A. Option A', 'B. Option B', 'C. Option C', 'D. Option D'];
    const answer = (item.answer as string) ?? 'A';
    return {
      id: `q-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      question_text: (item.question_text as string) ?? `Question about ${params.topic}`,
      options,
      answer,
      difficulty: params.difficulty,
      bloomLevel: params.bloomLevel,
      ai_confidence_score: (item.ai_confidence_score as number) ?? 0.85,
      hint: (item.hint as string) || undefined,
    };
  });
}
