import type { IAssignment } from '../models/Assignment.model';
import type { QuestionType } from '../types/assignment.types';

const MAX_UPLOAD_CHARS = 2500;

export const SYSTEM_PROMPT = `You generate academic assessments. Output ONLY valid JSON. No markdown, no explanations, no code fences. Raw JSON only.`;

export interface QuestionTypeBreakdown {
  type: string;
  count: number;
  marksPerQuestion: number;
}

export interface BatchPromptInput {
  batchId: string;
  type: QuestionType;
  count: number;
  marksPerQuestion: number;
  totalMarks: number;
  allowedTypes: QuestionType[];
  sectionTitle: string;
  difficultyHint: 'easy' | 'medium' | 'hard';
}

function extractKeyConcepts(text: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const line of lines) {
    const normalized = line.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(normalized)) continue;
    if (normalized.length < 5) continue;
    seen.add(normalized);
    unique.push(line);
  }
  return unique.join('\n');
}

function summarizeContent(text: string): string {
  let clean = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ').trim();
  clean = extractKeyConcepts(clean);
  if (clean.length <= MAX_UPLOAD_CHARS) return clean;
  const keepFront = Math.floor(MAX_UPLOAD_CHARS * 0.7);
  const keepBack = MAX_UPLOAD_CHARS - keepFront;
  const front = clean.slice(0, keepFront);
  const back = clean.slice(-keepBack);
  return front + '\n[...]\n' + back;
}

export function buildGenerationPrompt(
  assignment: IAssignment,
  uploadedContent?: string,
  typeBreakdown?: QuestionTypeBreakdown[]
): string {
  const { title, subject, totalMarks, questionConfig } = assignment;
  const source = uploadedContent ? `\nSource excerpt: ${summarizeContent(uploadedContent)}` : '';
  const breakdown = typeBreakdown?.length ? `\nType breakdown: ${typeBreakdown.map((t) => `${t.type}:${t.count}`).join(' ')}` : '';

  return `Legacy full-paper generation is disabled. Use the batch generation pipeline instead.
Assignment: ${title} | Subject: ${subject} | Questions: ${questionConfig.count} | Marks: ${totalMarks}${breakdown}${source}`;
}

export function buildBatchGenerationPrompt(
  assignment: IAssignment,
  batch: BatchPromptInput,
  syllabusContext: string
): string {
  const typeList = batch.allowedTypes.join(', ');
  const instructions = assignment.additionalInstructions?.trim() || 'None';

  return `Generate EXACTLY ${batch.count} ${batch.type} questions for one internal generation request.

Topic context:
${syllabusContext}

Requirements:
- Allowed types: ${typeList}
- Marks per question: ${batch.marksPerQuestion}
- Total marks: ${batch.totalMarks}
- Difficulty target: ${batch.difficultyHint}
- Use concise, distinct questions.
- MCQ must use 4 distinct options.
- Return ONLY JSON.
- No markdown, no prose, no extra keys.
- Validation failure if count or marks mismatch.

Assignment context:
Subject: ${assignment.subject}
Title: ${assignment.title}
Instructions: ${instructions}

Schema:
  {"questions":[{"id":"uuid","question":"","type":"${batch.type}","difficulty":"easy|medium|hard","marks":${batch.marksPerQuestion},"options":[{"key":"A","text":""}],"blanks":1}]}
`;
}
