import { describe, it, expect, vi } from 'vitest';
import { generateMultipleQuestions } from '../services/question-generation.service';

vi.mock('../config/env', () => ({
  env: {
    NVIDIA_API_KEY: 'test-key',
  },
}));

vi.mock('openai', () => {
  const mockCreate = vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            questions: [
              {
                question_text: 'What is 2+2?',
                options: ['A. 3', 'B. 4', 'C. 5', 'D. 6'],
                answer: 'B',
                hint: 'Think about basic math',
              },
              {
                question_text: 'What is 3+3?',
                options: ['A. 5', 'B. 6', 'C. 7', 'D. 8'],
                answer: 'B',
                hint: 'Think about basic math again',
              },
            ],
          }),
        },
      },
    ],
  });

  class MockOpenAI {
    chat = {
      completions: {
        create: mockCreate,
      },
    };
  }

  return {
    default: MockOpenAI,
    OpenAI: MockOpenAI,
  };
});

describe('generateMultipleQuestions', () => {
  it('should request exactly count questions and parse the json response', async () => {
    const result = await generateMultipleQuestions({
      topic: 'Math',
      subject: 'Arithmetic',
      difficulty: 'EASY',
      bloomLevel: 'REMEMBER',
      count: 2,
    });

    expect(result).toHaveLength(2);
    expect(result[0]?.question_text).toBe('What is 2+2?');
    expect(result[1]?.question_text).toBe('What is 3+3?');
    expect(result[0]?.answer).toBe('B');
  });
});
