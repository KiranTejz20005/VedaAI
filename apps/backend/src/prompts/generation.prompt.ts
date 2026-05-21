import type { IAssignment } from '../models/Assignment.model';

export const SYSTEM_PROMPT = `You are an expert academic assessment creator. Your ONLY output is valid JSON with no markdown, no explanations, no code blocks, and no conversational text. Output raw JSON only.`;

export function buildGenerationPrompt(assignment: IAssignment, uploadedContent?: string): string {
  const { title, subject, description, totalMarks, questionConfig, additionalInstructions } = assignment;
  const { types, count, difficulty } = questionConfig;

  const typeDescriptions: Record<string, string> = {
    'short-answer': 'Short Answer questions (2–4 sentence responses expected)',
    'long-answer': 'Long Answer / Essay questions (detailed paragraph responses)',
    'mcq': 'Multiple Choice questions with 4 options (A, B, C, D)',
    'true-false': 'True/False questions',
    'fill-blank': 'Fill in the Blank questions (use ___ for blanks)',
  };

  const enabledTypes = types.map((t) => typeDescriptions[t] || t).join(', ');

  const easyCount = Math.round((difficulty.easy / 100) * count);
  const mediumCount = Math.round((difficulty.medium / 100) * count);
  const hardCount = count - easyCount - mediumCount;

  const uploadSection = uploadedContent
    ? `\n\nLEARNING MATERIAL PROVIDED (use this as primary source for question content):\n${uploadedContent.slice(0, 8000)}`
    : '';

  return `Generate a complete academic assessment paper for the following:

Subject: ${subject}
Assessment Title: ${title}
Description: ${description || 'N/A'}
Total Marks: ${totalMarks}
Total Questions: ${count}

Question Types to Include: ${enabledTypes}

Difficulty Distribution:
- Easy: ${easyCount} questions
- Medium: ${mediumCount} questions  
- Hard: ${hardCount} questions

Additional Instructions: ${additionalInstructions || 'None'}
${uploadSection}

Rules:
1. Distribute questions into logical sections (e.g., Section A, Section B based on type)
2. Each question must have a unique UUID for the 'id' field
3. Mark distribution should be proportional to difficulty (easy: 1-3 marks, medium: 4-6, hard: 7-10)
4. Total marks of all questions must equal exactly ${totalMarks}
5. MCQ questions must include exactly 4 options with keys A, B, C, D
6. Fill-blank questions must have ___ placeholders and a 'blanks' count
7. All questions must be academically rigorous and relevant to ${subject}

Output this EXACT JSON structure with NO additional text:
{
  "title": "<assessment title>",
  "totalMarks": <number>,
  "sections": [
    {
      "title": "Section A",
      "instruction": "<section instruction>",
      "questions": [
        {
          "id": "<uuid>",
          "question": "<question text>",
          "type": "<question-type>",
          "difficulty": "<easy|medium|hard>",
          "marks": <number>,
          "options": [{ "key": "A", "text": "..." }],
          "blanks": <number if fill-blank>
        }
      ]
    }
  ]
}`;
}
