import { Request, Response } from 'express';

interface SyllabusTopic {
  id: string;
  title: string;
  description?: string;
  duration: number;
  completed: boolean;
  subtopics?: { id: string; title: string; completed: boolean }[];
}

interface Syllabus {
  id: string;
  title: string;
  subject: string;
  grade: string;
  topics: SyllabusTopic[];
  status: 'active' | 'archived' | 'draft';
  createdAt: string;
  updatedAt: string;
}

const MOCK_SYLLABUSES: Syllabus[] = [
  {
    id: 'syl-1',
    title: 'Class 10 Mathematics',
    subject: 'Mathematics',
    grade: 'Grade 10',
    status: 'active',
    topics: [
      { id: 't1', title: 'Real Numbers', duration: 6, completed: true, subtopics: [{ id: 'st1', title: 'Euclid\'s Division Lemma', completed: true }, { id: 'st2', title: 'Fundamental Theorem of Arithmetic', completed: true }] },
      { id: 't2', title: 'Polynomials', duration: 5, completed: true },
      { id: 't3', title: 'Pair of Linear Equations', duration: 8, completed: false },
      { id: 't4', title: 'Quadratic Equations', duration: 7, completed: false },
      { id: 't5', title: 'Arithmetic Progressions', duration: 6, completed: false },
      { id: 't6', title: 'Triangles', duration: 8, completed: false },
    ],
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-06-10T00:00:00Z',
  },
  {
    id: 'syl-2',
    title: 'Class 11 Physics',
    subject: 'Physics',
    grade: 'Grade 11',
    status: 'active',
    topics: [
      { id: 't7', title: 'Physical World & Measurement', duration: 4, completed: true },
      { id: 't8', title: 'Kinematics', duration: 10, completed: true },
      { id: 't9', title: 'Laws of Motion', duration: 8, completed: false },
      { id: 't10', title: 'Work, Energy & Power', duration: 6, completed: false },
      { id: 't11', title: 'Motion of System of Particles', duration: 8, completed: false },
    ],
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-06-08T00:00:00Z',
  },
  {
    id: 'syl-3',
    title: 'Class 9 Biology',
    subject: 'Biology',
    grade: 'Grade 9',
    status: 'draft',
    topics: [
      { id: 't12', title: 'Cell: The Unit of Life', duration: 5, completed: false },
      { id: 't13', title: 'Tissues', duration: 6, completed: false },
      { id: 't14', title: 'Diversity in Living Organisms', duration: 8, completed: false },
    ],
    createdAt: '2025-03-10T00:00:00Z',
    updatedAt: '2025-05-20T00:00:00Z',
  },
];

export const getSyllabuses = async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true, data: MOCK_SYLLABUSES });
};

export const getSyllabus = async (req: Request, res: Response): Promise<void> => {
  const syllabus = MOCK_SYLLABUSES.find((s) => s.id === req.params.id);
  if (!syllabus) {
    res.status(404).json({ success: false, error: 'Syllabus not found' });
    return;
  }
  res.json({ success: true, data: syllabus });
};

export const createSyllabus = async (req: Request, res: Response): Promise<void> => {
  const { title, subject, grade } = req.body;
  if (!title || !subject || !grade) {
    res.status(400).json({ success: false, error: 'title, subject, and grade are required' });
    return;
  }
  const newSyllabus: Syllabus = {
    id: `syl-${Date.now()}`,
    title,
    subject,
    grade,
    status: 'draft',
    topics: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  MOCK_SYLLABUSES.unshift(newSyllabus);
  res.status(201).json({ success: true, data: newSyllabus, message: 'Syllabus created' });
};

export const updateSyllabus = async (req: Request, res: Response): Promise<void> => {
  const idx = MOCK_SYLLABUSES.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Syllabus not found' });
    return;
  }
  MOCK_SYLLABUSES[idx] = { ...MOCK_SYLLABUSES[idx], ...req.body, updatedAt: new Date().toISOString() };
  res.json({ success: true, data: MOCK_SYLLABUSES[idx], message: 'Syllabus updated' });
};

export const deleteSyllabus = async (req: Request, res: Response): Promise<void> => {
  const idx = MOCK_SYLLABUSES.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Syllabus not found' });
    return;
  }
  MOCK_SYLLABUSES.splice(idx, 1);
  res.json({ success: true, message: 'Syllabus deleted' });
};
