import prisma from '../config/prisma';
import { AIOrchestrator } from './ai/ai-orchestrator.service';
import { retrieveContext } from './rag.service';

export class AITutorService {
  /**
   * Processes a student's message within a Socratic tutoring session.
   */
  static async chat(
    sessionId: string,
    studentId: string,
    organizationId: string,
    userMessage: string
  ) {
    // 1. Validate Session & Retrieve Learning Profile
    const session = await prisma.tutorSession.findUnique({
      where: { id: sessionId },
      include: { messages: { take: 10, orderBy: { createdAt: 'desc' } } }
    });

    if (!session) throw new Error("Tutor session not found");

    const profile = await prisma.studentLearningProfile.findUnique({
      where: { studentId }
    });

    const weaknesses = profile?.weakConcepts ? JSON.stringify(profile.weakConcepts) : "None specifically identified.";
    
    // 2. Enforce Organization Config (or use defaults)
    let allowDirectAnswers = false;
    let maxDepth = 3;
    
    if (organizationId) {
      const config = await prisma.teacherTutorConfig.findUnique({
        where: { organizationId }
      });
      if (config) {
        allowDirectAnswers = config.allowDirectAnswers;
        maxDepth = config.maxExplanationDepth;
      }
    }

    // 3. Hybrid RAG Context Retrieval
    const ragContext = await retrieveContext(userMessage, organizationId, 5);

    // 4. Construct Socratic Prompt
    const prompt = `
You are an AI Education Tutor.
Mode: ${session.tutorMode}
Student Weaknesses: ${weaknesses}
Topic: ${session.subject}

CRITICAL RULES:
1. NEVER leave the education domain. Reject questions about medical, legal, or non-academic topics.
2. Direct Answers Allowed: ${allowDirectAnswers}. If false, you MUST use Socratic questioning to guide the student.
3. Use the provided RAG context to ground your explanation.
4. Keep the explanation within a maximum conceptual depth of ${maxDepth}.
5. Provide a follow-up question to check understanding.

Student Message: "${userMessage}"
`;

    // 5. Generate structured response via AI Orchestrator
    const responseFormat = {
      type: "json_schema",
      json_schema: {
        name: "tutor_response",
        schema: {
          type: "object",
          properties: {
            message: { type: "string" },
            suggestedFollowUp: { type: "string" },
            confidenceScore: { type: "number" },
            isDomainViolation: { type: "boolean" }
          },
          required: ["message", "suggestedFollowUp", "confidenceScore", "isDomainViolation"]
        }
      }
    };

    const tutorReply = await AIOrchestrator.generate({
      intent: 'GenerateQuestionExplanation', 
      context: ragContext,
      taskInstructions: prompt,
      responseFormat
    });

    if (tutorReply.isDomainViolation) {
      tutorReply.message = "I'm sorry, but I can only assist with educational and academic topics related to your coursework.";
      tutorReply.suggestedFollowUp = "Is there a concept from your syllabus you'd like to review?";
    }

    // 6. Persist Messages
    await prisma.tutorMessage.create({
      data: {
        sessionId,
        role: "USER",
        content: userMessage
      }
    });

    const assistantMsg = await prisma.tutorMessage.create({
      data: {
        sessionId,
        role: "ASSISTANT",
        content: tutorReply.message,
        ragReferences: { source: "rag_engine", contextRetrieved: true }, // Simplified
        confidence: tutorReply.confidenceScore
      }
    });

    return {
      message: tutorReply.message,
      followUp: tutorReply.suggestedFollowUp,
      messageId: assistantMsg.id
    };
  }
}
