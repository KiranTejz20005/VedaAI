import prisma from '../config/prisma';
import { AIOrchestrator } from './ai/ai-orchestrator.service';
import { retrieveContext } from './rag.service';

export class TeacherCopilotService {
  /**
   * Generates a structured lesson plan backed by Hybrid RAG institutional knowledge.
   */
  static async generateLessonPlan(
    userId: string,
    organizationId: string,
    subject: string,
    topic: string,
    duration: string,
    learningOutcomes: string[]
  ) {
    // 1. Retrieve explicitly approved institutional knowledge for the topic
    const ragContext = await retrieveContext(`Lesson plan materials for ${subject}: ${topic}`, organizationId, 8);

    const prompt = `
Generate a structured Lesson Plan.
Subject: ${subject}
Topic: ${topic}
Duration: ${duration}
Learning Outcomes: ${learningOutcomes.join(', ')}

CRITICAL RULES:
1. ONLY generate content that aligns with the provided context.
2. Provide a sequential flow of activities.
3. Suggest an assessment methodology at the end.
4. Output your response ONLY as a JSON object matching this schema:
{
  "objectives": "string",
  "activities": ["string"],
  "assessments": ["string"],
  "content": "string"
}
`;

    const responseFormat = {
      type: "json_object"
    };

    const planData = await AIOrchestrator.generate({
      intent: 'GenerateQuestionPaper', // Resusing complex reasoning intent
      context: ragContext,
      taskInstructions: prompt,
      responseFormat
    });

    const lessonPlan = await prisma.lessonPlan.create({
      data: {
        userId,
        organizationId,
        title: `${subject} - ${topic}`,
        subject,
        grade: "Not Specified",
        duration: String(duration),
        objectives: planData.objectives,
        activities: planData.activities,
        assessments: planData.assessments,
        content: planData.content,
        referenceMaterials: { source: "rag_engine", contextRetrieved: true }
      }
    });

    return lessonPlan;
  }

  /**
   * Automates an academic workflow consisting of multiple tasks.
   * e.g., Generate Lesson Plan -> Generate Practice Quiz -> Create Rubric
   */
  static async executeWorkflow(
    userId: string,
    organizationId: string,
    workflowName: string,
    tasks: string[] // List of task identifiers or descriptions
  ) {
    // In a real system, this would queue up jobs in BullMQ and execute them sequentially,
    // pausing for teacher approval where required.
    
    const workflow = await prisma.copilotWorkflow.create({
      data: {
        userId,
        organizationId,
        workflowName,
        status: 'PENDING',
        tasks: tasks.map(t => ({ taskName: t, status: 'QUEUED' }))
      }
    });

    return workflow;
  }
}
