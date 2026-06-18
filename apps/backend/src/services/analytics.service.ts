import prisma from '../config/prisma';
import { env } from '../config/env';
import OpenAI from 'openai';

let nvidiaClient: OpenAI | null = null;
function getNvidia(): OpenAI {
  if (!nvidiaClient) {
    nvidiaClient = new OpenAI({
      apiKey: env.NVIDIA_API_KEY || 'dummy-key',
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });
  }
  return nvidiaClient;
}

export const getStudentPerformance = async (studentId: string) => {
  // Find submissions and evaluations
  const submissions = await prisma.studentSubmission.findMany({
    where: { studentId },
    include: {
      evaluations: true,
    },
    orderBy: { submittedAt: 'asc' },
  });

  const scores = submissions
    .map(s => {
      const evaluation = s.evaluations[0];
      if (!evaluation) return null;
      return {
        assignmentId: s.assignmentId,
        score: evaluation.score,
        totalMarks: evaluation.totalMarks,
        percentage: (evaluation.score / evaluation.totalMarks) * 100,
        date: s.submittedAt,
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  const averageScore = scores.length > 0
    ? scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length
    : 0;

  // Compute topic mastery from RubricCriteria grades
  const topicScores: Record<string, { totalEarned: number; totalMax: number }> = {};
  
  submissions.forEach(s => {
    const evalObj = s.evaluations[0];
    if (evalObj && typeof evalObj.criteriaGrades === 'object' && Array.isArray(evalObj.criteriaGrades)) {
      const grades = evalObj.criteriaGrades as any[];
      grades.forEach(g => {
        const name = g.name || 'General';
        if (!topicScores[name]) {
          topicScores[name] = { totalEarned: 0, totalMax: 0 };
        }
        // If criteria has maxMarks, otherwise default to 10
        const max = g.maxMarks || 10;
        topicScores[name].totalEarned += g.score || 0;
        topicScores[name].totalMax += max;
      });
    }
  });

  const topicMastery = Object.entries(topicScores).map(([topic, data]) => ({
    topic,
    mastery: data.totalMax > 0 ? (data.totalEarned / data.totalMax) * 100 : 0,
  }));

  const weakAreas = topicMastery.filter(t => t.mastery < 65).map(t => t.topic);

  // Growth: comparison of last 2 scores vs first 2 scores
  let growthTrend = 'STABLE';
  if (scores.length >= 2) {
    const firstScore = scores[0].percentage;
    const lastScore = scores[scores.length - 1].percentage;
    if (lastScore > firstScore + 5) {
      growthTrend = 'UPWARD';
    } else if (lastScore < firstScore - 5) {
      growthTrend = 'DOWNWARD';
    }
  }

  // Get recommendations
  const recommendation = await prisma.aIRecommendation.findFirst({
    where: { studentId, type: 'STUDENT' },
    orderBy: { createdAt: 'desc' },
  });

  return {
    studentId,
    averageScore,
    growthTrend,
    scoresHistory: scores,
    topicMastery,
    weakAreas,
    recommendation: recommendation?.content || null,
    suggestedTopics: recommendation?.suggestedTopics || [],
  };
};

export const getGroupPerformance = async (groupId: string) => {
  const students = await prisma.student.findMany({
    where: { groupId },
  });

  const studentIds = students.map(s => s.id);

  // Find all submissions for these students
  const submissions = await prisma.studentSubmission.findMany({
    where: { studentId: { in: studentIds } },
    include: { evaluations: true },
  });

  const evaluations = submissions
    .flatMap(s => s.evaluations)
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const averageScore = evaluations.length > 0
    ? (evaluations.reduce((sum, e) => sum + (e.score / e.totalMarks) * 100, 0) / evaluations.length)
    : 70; // fallback default

  // Compute distribution
  const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  evaluations.forEach(e => {
    const pct = (e.score / e.totalMarks) * 100;
    if (pct >= 90) distribution.A++;
    else if (pct >= 80) distribution.B++;
    else if (pct >= 70) distribution.C++;
    else if (pct >= 60) distribution.D++;
    else distribution.F++;
  });

  // Calculate top performers
  const studentScores: Record<string, { totalPct: number; count: number; name: string }> = {};
  students.forEach(st => {
    studentScores[st.id] = { totalPct: 0, count: 0, name: st.name };
  });

  submissions.forEach(sub => {
    const ev = sub.evaluations[0];
    if (ev && studentScores[sub.studentId]) {
      studentScores[sub.studentId].totalPct += (ev.score / ev.totalMarks) * 100;
      studentScores[sub.studentId].count++;
    }
  });

  const rankedStudents = Object.values(studentScores)
    .filter(s => s.count > 0)
    .map(s => ({
      name: s.name,
      avg: s.totalPct / s.count,
    }))
    .sort((a, b) => b.avg - a.avg);

  const recommendation = await prisma.aIRecommendation.findFirst({
    where: { groupId, type: 'CLASS' },
    orderBy: { createdAt: 'desc' },
  });

  return {
    groupId,
    averageScore,
    distribution,
    topStudents: rankedStudents.slice(0, 5),
    weakPerformers: rankedStudents.slice(-3).reverse(),
    recommendation: recommendation?.content || null,
  };
};

export const generateAIRecommendations = async (targetId: string, type: 'STUDENT' | 'CLASS') => {
  let promptText = '';
  
  if (type === 'STUDENT') {
    const stats = await getStudentPerformance(targetId);
    promptText = `You are an expert educational tutor. Review the following student analytics performance:
- Average score percentage: ${stats.averageScore.toFixed(1)}%
- Performance trend: ${stats.growthTrend}
- Topic mastery scores: ${JSON.stringify(stats.topicMastery)}
- Weak areas: ${stats.weakAreas.join(', ') || 'None'}

Provide a detailed structured markdown study plan and recommendation for this student. Output JSON containing:
{
  "recommendations": "markdown study guide",
  "suggestedTopics": ["list", "of", "weak", "topics", "to", "review"]
}`;
  } else {
    const stats = await getGroupPerformance(targetId);
    promptText = `You are an expert curriculum supervisor. Review the following class-wide analytics performance:
- Average score: ${stats.averageScore.toFixed(1)}%
- Grade distribution: ${JSON.stringify(stats.distribution)}
- Top performing students: ${JSON.stringify(stats.topStudents)}

Provide a detailed structured markdown lesson review plan and group recommendations. Output JSON containing:
{
  "recommendations": "markdown lesson guide",
  "suggestedTopics": ["list", "of", "topics", "needing", "re-teaching"]
}`;
  }

  let finalContent = 'Please review key concepts and practice weak areas.';
  let suggested: string[] = [];

  try {
    const response = await getNvidia().chat.completions.create({
      model: 'meta/llama-3.1-8b-instruct',
      messages: [
        { role: 'system', content: 'You are an educational AI analytics agent. Always return valid JSON only.' },
        { role: 'user', content: promptText },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    });

    const text = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(text.replace(/```json|```/gi, '').trim());
    finalContent = parsed.recommendations || finalContent;
    suggested = parsed.suggestedTopics || [];
  } catch (err) {
    // Fallback recommendation
    finalContent = `### Revision Plan
Review topics where scores fall below 65%. Practice active recall and space repetition exercises.`;
    suggested = type === 'STUDENT' ? ['Mathematics', 'Science'] : ['Core Units'];
  }

  // Save to DB
  const rec = await prisma.aIRecommendation.create({
    data: {
      studentId: type === 'STUDENT' ? targetId : null,
      groupId: type === 'CLASS' ? targetId : null,
      type,
      content: finalContent,
      suggestedTopics: suggested,
    },
  });

  return rec;
};
