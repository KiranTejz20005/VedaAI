import prisma from '../config/prisma';
import { AIOrchestrator } from './ai/ai-orchestrator.service';
import { retrieveContext } from './rag.service';
import fs from 'fs';
import path from 'path';

export class AITutorService {
  /**
   * Processes a student's message within a Socratic tutoring session.
   */
  static async chat(
    sessionId: string,
    studentId: string,
    organizationId: string,
    userMessage: string,
    modeOverride?: string
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

    const activeMode = modeOverride?.toUpperCase() || session.tutorMode;
    let modeInstructions = "";
    if (activeMode === 'HINT') {
      modeInstructions = "You MUST NOT provide the direct answer. Provide a subtle hint to help the student figure it out on their own. Be brief and encouraging.";
    } else if (activeMode === 'SOCRATIC') {
      modeInstructions = "You MUST use the Socratic method. Do not answer directly. Ask a leading question that guides the student to discover the answer themselves.";
    } else {
      modeInstructions = "You may explain the concept clearly and directly, but still follow up with a question to check understanding.";
    }

    // 4. Construct Socratic Prompt
    const prompt = `
${fs.readFileSync(path.join(process.cwd(), 'tutor_master_prompt.txt'), 'utf8')}

--- DYNAMIC CONTEXT ---
Mode: ${activeMode}
Student Weaknesses: ${weaknesses}
Topic: ${session.subject}

CRITICAL RULES:
1. Direct Answers Allowed: ${allowDirectAnswers}. If false, you MUST use Socratic questioning to guide the student.
2. ${modeInstructions}
3. Use the provided RAG context to ground your explanation.
4. Keep the explanation within a maximum conceptual depth of ${maxDepth}.
5. MULTI-QUESTION HANDLING:
   - If the student's message contains multiple questions (e.g., numbered, bulleted, paragraph-separated, or mixed format), you MUST answer EVERY question.
   - Do NOT stop after the first question.
   - If there are multiple questions, begin your response exactly with: "I found X questions in your message. I'll answer each one separately."
   - Format your response clearly separating each answer like this:
     Question 1
     [Answer]
     ----------------
     Question 2
     [Answer]
6. Output your response ONLY as a JSON object matching this schema:
{
  "message": "string (The formatted markdown response)",
  "suggestedFollowUp": "string",
  "confidenceScore": "number",
  "isDomainViolation": "boolean"
}

Student Message: "${userMessage}"
`;

    // 5. Generate structured response via AI Orchestrator
    const responseFormat = {
      type: "json_object"
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
