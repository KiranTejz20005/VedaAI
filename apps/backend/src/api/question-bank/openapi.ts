import { OpenAPIV3 } from 'openapi-types';

const questionBankPaths: OpenAPIV3.PathsObject = {
  '/question-bank': {
    get: {
      tags: ['Question Bank'],
      summary: 'List questions (paginated, filtered)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
        { in: 'query', name: 'search', schema: { type: 'string' } },
        { in: 'query', name: 'subject', schema: { type: 'string' } },
        { in: 'query', name: 'difficulty', schema: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'] } },
        { in: 'query', name: 'bloomLevel', schema: { type: 'string', enum: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'] } },
        { in: 'query', name: 'status', schema: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] } },
      ],
      responses: {
        '200': { description: 'Paginated list of questions' },
      },
    },
    post: {
      tags: ['Question Bank'],
      summary: 'Create question',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                content: { type: 'string' },
                options: { type: 'object' },
                answer: { type: 'string' },
                hint: { type: 'string' },
                subject: { type: 'string' },
                topic: { type: 'string' },
                difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'] },
                bloomLevel: { type: 'string', enum: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'] },
                tags: { type: 'array', items: { type: 'string' } },
              },
              required: ['content', 'subject', 'topic', 'difficulty', 'bloomLevel'],
            },
          },
        },
      },
      responses: {
        '201': { description: 'Question created' },
        '400': { description: 'Validation error' },
      },
    },
  },
  '/question-bank/stats': {
    get: {
      tags: ['Question Bank'],
      summary: 'Get question bank stats',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'Question bank statistics' },
      },
    },
  },
  '/question-bank/{id}': {
    get: {
      tags: ['Question Bank'],
      summary: 'Get question by ID',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        '200': { description: 'Question details' },
        '404': { description: 'Not found' },
      },
    },
    put: {
      tags: ['Question Bank'],
      summary: 'Update question',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        content: { 'application/json': { schema: { type: 'object' } } },
      },
      responses: {
        '200': { description: 'Question updated' },
        '404': { description: 'Not found' },
      },
    },
    delete: {
      tags: ['Question Bank'],
      summary: 'Delete question (soft)',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        '204': { description: 'Deleted' },
        '404': { description: 'Not found' },
      },
    },
  },
  '/question-bank/{id}/approve': {
    post: {
      tags: ['Question Bank'],
      summary: 'Approve question (admin)',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        '200': { description: 'Question approved' },
      },
    },
  },
  '/question-bank/{id}/reject': {
    post: {
      tags: ['Question Bank'],
      summary: 'Reject question (admin)',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        '200': { description: 'Question rejected' },
      },
    },
  },
  '/question-bank/versions/{id}': {
    get: {
      tags: ['Question Bank'],
      summary: 'List question versions',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        '200': { description: 'List of versions' },
      },
    },
  },
  '/question-bank/bulk-import': {
    post: {
      tags: ['Question Bank'],
      summary: 'Bulk import questions',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                questions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      content: { type: 'string' },
                      subject: { type: 'string' },
                      topic: { type: 'string' },
                      difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'] },
                      bloomLevel: { type: 'string', enum: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'] },
                    },
                    required: ['content', 'subject', 'topic', 'difficulty', 'bloomLevel'],
                  },
                },
              },
              required: ['questions'],
            },
          },
        },
      },
      responses: {
        '201': { description: 'Bulk import result' },
      },
    },
  },
};

export default questionBankPaths;
