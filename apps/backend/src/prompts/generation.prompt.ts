import type { IAssignment } from '../models/Assignment.model';

export const SYSTEM_PROMPT = `You are an expert academic assessment creator. Output ONLY valid JSON. No markdown, no explanations, no code fences, no conversational text. Raw JSON only.`;

export interface QuestionTypeBreakdown {
  type: string;
  count: number;
  marksPerQuestion: number;
}

export function buildGenerationPrompt(
  assignment: IAssignment,
  uploadedContent?: string,
  typeBreakdown?: QuestionTypeBreakdown[]
): string {
  const { title, subject, description, totalMarks, questionConfig, additionalInstructions } = assignment;
  const { types, count, difficulty } = questionConfig;

  const typeDescriptions: Record<string, string> = {
    'short-answer': 'short-answer',
    'long-answer': 'long-answer',
    'mcq': 'mcq',
    'true-false': 'true-false',
    'fill-blank': 'fill-blank',
  };

  const enabledTypes = types.map((t) => typeDescriptions[t] || t).join(', ');

  const easyCount = Math.round((difficulty.easy / 100) * count);
  const mediumCount = Math.round((difficulty.medium / 100) * count);
  const hardCount = count - easyCount - mediumCount;

  let breakdownSection = '';
  if (typeBreakdown && typeBreakdown.length > 0) {
    breakdownSection = `\nPer-Type Breakdown:\n${typeBreakdown.map((t) => `- ${t.type}: ${t.count} questions @ ${t.marksPerQuestion} marks each`).join('\n')}`;
  }

  const uploadSection = uploadedContent
    ? `\n---SOURCE MATERIAL---\n${uploadedContent.slice(0, 8000)}`
    : '';

  return `Generate an academic assessment paper.

Subject: ${subject}
Title: ${title}
Description: ${description || 'N/A'}
Total Marks: ${totalMarks}
Total Questions: ${count}
Types: ${enabledTypes}
Difficulty: Easy=${easyCount}, Medium=${mediumCount}, Hard=${hardCount}
${breakdownSection}
Instructions: ${additionalInstructions || 'None'}
${uploadSection}

Rules:
- Use uuid for question id
- Easy=1-3m, Medium=4-6m, Hard=7-10m
- Total marks = ${totalMarks}
- MCQ: exactly 4 options (A,B,C,D)
- Fill-blank: use ___ with blanks count
- Group into sections by type

Output JSON:
{"title":"...","totalMarks":N,"sections":[{"title":"...","instruction":"...","questions":[{"id":"uuid","question":"...","type":"...","difficulty":"easy|medium|hard","marks":N,"options":[{"key":"A","text":"..."}],"blanks":N}]}]}`;
}
