import { Request, Response } from 'express';
import { callAI } from '../services/question-generation.service';

export const generateRubric = async (req: Request, res: Response): Promise<void> => {
  const { title } = req.body;
  if (!title) {
    res.status(400).json({ success: false, error: 'Rubric title is required' });
    return;
  }
  const criteria = [
    { name: 'Knowledge & Understanding', description: 'Demonstrates comprehensive understanding of concepts', levels: [
      { label: 'Below Expectation', points: 1, description: 'Limited understanding' },
      { label: 'Approaching', points: 2, description: 'Partial understanding with gaps' },
      { label: 'Meeting', points: 3, description: 'Good understanding' },
      { label: 'Exceeding', points: 4, description: 'Exceptional depth of understanding' },
    ]},
    { name: 'Critical Thinking', description: 'Analyses and evaluates information effectively', levels: [
      { label: 'Below Expectation', points: 1, description: 'Little analysis' },
      { label: 'Approaching', points: 2, description: 'Some analysis' },
      { label: 'Meeting', points: 3, description: 'Clear critical analysis' },
      { label: 'Exceeding', points: 4, description: 'Insightful evaluation' },
    ]},
    { name: 'Organization', description: 'Structures work logically and coherently', levels: [
      { label: 'Below Expectation', points: 1, description: 'Disorganised' },
      { label: 'Approaching', points: 2, description: 'Some structure' },
      { label: 'Meeting', points: 3, description: 'Well organised' },
      { label: 'Exceeding', points: 4, description: 'Exceptionally clear structure' },
    ]},
    { name: 'Presentation', description: 'Professional formatting and clarity', levels: [
      { label: 'Below Expectation', points: 1, description: 'Poor presentation' },
      { label: 'Approaching', points: 2, description: 'Adequate presentation' },
      { label: 'Meeting', points: 3, description: 'Clean presentation' },
      { label: 'Exceeding', points: 4, description: 'Publication quality' },
    ]},
  ];
  res.json({ success: true, data: { title, criteria } });
};

export const generateLessonPlan = async (req: Request, res: Response): Promise<void> => {
  const { topic, subject, grade, duration } = req.body;
  if (!topic || !subject || !grade) {
    res.status(400).json({ success: false, error: 'topic, subject, and grade are required' });
    return;
  }
  const plan = {
    title: topic,
    subject,
    grade,
    duration: `${duration || 45} minutes`,
    objectives: [
      `Understand and explain key concepts of ${topic}`,
      `Apply learned principles to solve related problems`,
      `Analyse and evaluate real-world applications of ${topic}`,
      `Create original solutions using knowledge of ${topic}`,
    ],
    materials: ['Textbook', 'Handout worksheets', 'Presentation slides', 'Online resources', 'Assessment rubric'],
    sections: [
      { title: 'Introduction & Hook', duration: '5 min', content: `Begin with a thought-provoking question about ${topic}. Show a real-world example to spark curiosity and activate prior knowledge.` },
      { title: 'Direct Instruction', duration: `${Math.max(10, Math.floor((parseInt(duration) || 45) * 0.35))} min`, content: `Present core concepts of ${topic} using structured slides. Define key terms, explain theoretical framework, and illustrate with examples.` },
      { title: 'Guided Practice', duration: `${Math.max(8, Math.floor((parseInt(duration) || 45) * 0.2))} min`, content: `Work through example problems as a class. Use think-aloud strategies and scaffold questioning to build understanding.` },
      { title: 'Group Activity', duration: `${Math.max(8, Math.floor((parseInt(duration) || 45) * 0.2))} min`, content: `Students collaborate in small groups to solve problems or discuss case studies related to ${topic}. Provide differentiated tasks.` },
      { title: 'Independent Practice', duration: `${Math.max(5, Math.floor((parseInt(duration) || 45) * 0.15))} min`, content: `Students complete a short task individually to consolidate learning. Circulate and provide individual support.` },
      { title: 'Assessment & Wrap-up', duration: '5 min', content: `Quick formative assessment (exit ticket). Recap key takeaways and preview next lesson.` },
    ],
    assessment: `Exit ticket with 3-5 questions covering ${topic}. Review independent practice work and provide feedback in next session.`,
  };
  res.json({ success: true, data: plan });
};

export const generateFeedback = async (req: Request, res: Response): Promise<void> => {
  const { studentName, assignmentTitle, strengths, improvements, tone, customNotes } = req.body;
  if (!studentName) {
    res.status(400).json({ success: false, error: 'studentName is required' });
    return;
  }
  const tonePrefix = tone === 'Encouraging' ? 'Great work this term!' :
    tone === 'Constructive' ? 'Here are some areas to focus on:' :
    tone === 'Professional' ? 'Student Performance Assessment:' : 'Quick feedback update:';
  const selectedStrengths = strengths?.length > 0 ? strengths : ['Shows good understanding of key concepts', 'Completes work on time'];
  const selectedImprovements = improvements?.length > 0 ? improvements : ['Provide more detailed explanations', 'Review fundamental concepts'];
  const feedback = [
    tonePrefix,
    '',
    `Dear ${studentName},`,
    assignmentTitle ? `\nRegarding your submission for "${assignmentTitle}":` : '',
    '\nStrengths:',
    ...selectedStrengths.map((s: string) => `  • ${s}`),
    '\nAreas for Improvement:',
    ...selectedImprovements.map((s: string) => `  • ${s}`),
    customNotes ? `\nAdditional Notes: ${customNotes}` : '',
    '\nKeep up the good work and continue striving for excellence!',
  ].filter(Boolean).join('\n');
  res.json({ success: true, data: { feedback, studentName, tone } });
};

export const generateDiagram = async (req: Request, res: Response): Promise<void> => {
  const { topic, type } = req.body;
  if (!topic || !type) {
    res.status(400).json({ success: false, error: 'topic and type are required' });
    return;
  }
  try {
    const prompt = `You are an expert technical illustrator. Generate a clean and correct Mermaid.js diagram of type "${type}" for the topic: "${topic}".

Rules:
- Do not write any markdown code blocks (e.g. \`\`\`mermaid or \`\`\`).
- Output ONLY valid Mermaid.js syntax.
- Keep the diagram clean, labeled, and easy to read.
- For flowchart, use standard 'graph TD' or 'graph LR' syntax.
- For venn, since Mermaid doesn't support Venn directly, render it as a clean Mindmap or a Class/Flowchart diagram that represents Venn logic.
- For cycle, use a loop flowchart structure.
- For timeline, use 'timeline' diagram type if supported, or a standard linear flowchart.
- For pyramid, render it using a flowchart with layered nodes.
- For network, render it using standard graph layout connections.

Mermaid code:`;

    let diagram = await callAI(prompt);
    // Strip code fences if the model still generated them
    diagram = diagram.replace(/```mermaid/g, '').replace(/```/g, '').trim();

    res.json({ success: true, data: { topic, type, diagram } });
  } catch (error) {
    // Fallback to static diagrams if AI generation fails
    const diagrams: Record<string, string> = {
      flowchart: `graph TD\n  Start([Start]) --> Input[Input: ${topic}] --> Process[Process] --> End([End])`,
      venn: `graph TD\n  subgraph Venn Diagram\n    A[Concept A] --- Both[Overlap Area] --- B[Concept B]\n  end`,
      cycle: `graph LR\n  Stage1[Stage 1] --> Stage2[Stage 2] --> Stage3[Stage 3] --> Stage1`,
      timeline: `graph LR\n  Start --> M1[Milestone 1] --> M2[Milestone 2] --> End`,
      pyramid: `graph TD\n  Top[Top Level] --> Mid[Middle Level] --> Base[Foundation Level]`,
      network: `graph TD\n  A --- B --- C\n  A --- D\n  B --- E`,
    };
    const fallback = diagrams[type] || diagrams.flowchart;
    res.json({ success: true, data: { topic, type, diagram: fallback } });
  }
};
