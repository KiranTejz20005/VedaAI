import type { IAssignment } from '../models/Assignment.model';

const MAX_UPLOAD_CHARS = 2500;

export const SYSTEM_PROMPT = `You generate academic assessments. Output ONLY valid JSON. No markdown, no explanations, no code fences. Raw JSON only.`;

export interface QuestionTypeBreakdown {
  type: string;
  count: number;
  marksPerQuestion: number;
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
  const { title, subject, description, totalMarks, questionConfig, additionalInstructions } = assignment;
  const { types, count, difficulty } = questionConfig;

  const easyCount = Math.round((difficulty.easy / 100) * count);
  const mediumCount = Math.round((difficulty.medium / 100) * count);
  const hardCount = count - easyCount - mediumCount;

  const typeList = types.join(', ');

  let breakdownStr = '';
  if (typeBreakdown && typeBreakdown.length > 0) {
    breakdownStr = typeBreakdown.map(t => `${t.type}:${t.count}x${t.marksPerQuestion}m`).join(' ');
  }

  let sourceStr = '';
  if (uploadedContent) {
    const summarized = summarizeContent(uploadedContent);
    sourceStr = `\nSource: ${summarized}`;
  }

  return `Subject=${subject} Title=${title} Desc=${description || 'N/A'} Total=${totalMarks} Qs=${count} Types=${typeList} Easy=${easyCount} Med=${mediumCount} Hard=${hardCount}${breakdownStr ? ' Breakdown=' + breakdownStr : ''} Instr=${additionalInstructions || 'None'}${sourceStr}

Hard constraints (mandatory):
- Return EXACTLY ${count} questions. NO MORE. NO LESS.
- Return total marks EXACTLY ${totalMarks}.
- Include only these question types: ${typeList}.
- Difficulty targets: easy=${easyCount}, medium=${mediumCount}, hard=${hardCount}.
${breakdownStr ? `- Type quotas and marks must match exactly: ${breakdownStr}.` : ''}
- Every question must be substantive and unique.
- MCQ must have exactly 4 distinct options (A-D).
- fill-blank questions must use ___ placeholders.
- IDs must be valid UUIDs.

Validation reminder:
Response will be rejected if question count, marks, or type quotas mismatch.

Output contract:
- Output ONLY strict JSON object.
- Do not output markdown/code fences/explanations.
- Use this exact shape:
{"title":"","totalMarks":N,"sections":[{"title":"","instruction":"","questions":[{"id":"uuid","question":"","type":"short-answer|long-answer|mcq|true-false|fill-blank","difficulty":"easy|medium|hard","marks":N,"options":[{"key":"A","text":""}],"blanks":N}]}]}`;
}
