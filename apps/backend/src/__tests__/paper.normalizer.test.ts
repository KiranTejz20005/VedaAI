import { describe, expect, it } from 'vitest';
import { parsePaperJson } from '../parsers/paper.parser';

describe('paper normalization pipeline', () => {
  it('repairs malformed AI output into schema-compliant paper', () => {
    const raw = JSON.stringify({
      title: '',
      sections: [
        {
          title: '',
          questions: [
            {
              id: 'not-a-uuid',
              question: 'x',
              type: 'multiple_choice',
              difficulty: 'advanced',
              marks: 0,
              options: [
                { key: 'a', text: '' },
                { key: 'b', text: 'Option 1' },
                { key: 'c', text: 'Option 1' },
              ],
            },
          ],
        },
      ],
    });

    const paper = parsePaperJson(raw);
    expect(paper.title.length).toBeGreaterThan(0);
    expect(paper.sections[0]?.questions[0]?.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(paper.sections[0]?.questions[0]?.type).toBe('mcq');
    expect(paper.sections[0]?.questions[0]?.difficulty).toBe('hard');
    expect(paper.sections[0]?.questions[0]?.marks).toBe(1);
    expect(paper.sections[0]?.questions[0]?.options).toHaveLength(4);
    for (const option of paper.sections[0]?.questions[0]?.options ?? []) {
      expect(option.text.trim().length).toBeGreaterThan(0);
    }
  });
});
