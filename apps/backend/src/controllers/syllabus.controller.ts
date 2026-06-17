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
  // CLASS 10
  {
    id: 'syl-c10-math',
    title: 'Class 10 Mathematics',
    subject: 'Mathematics',
    grade: 'Class 10',
    status: 'active',
    topics: [
      { id: 'c10m-1', title: 'Real Numbers', duration: 360, completed: true, subtopics: [{ id: 'st1', title: 'Fundamental Theorem of Arithmetic', completed: true }, { id: 'st2', title: 'Rational and Irrational Numbers Proofs', completed: true }] },
      { id: 'c10m-2', title: 'Polynomials', duration: 300, completed: true, subtopics: [{ id: 'st3', title: 'Geometrical Meaning of Zeroes', completed: true }, { id: 'st4', title: 'Relationship between Zeroes & Coefficients', completed: true }] },
      { id: 'c10m-3', title: 'Pair of Linear Equations in Two Variables', duration: 480, completed: false, subtopics: [{ id: 'st5', title: 'Graphical Method of Solution', completed: false }, { id: 'st6', title: 'Algebraic Methods (Substitution, Elimination)', completed: false }] },
      { id: 'c10m-4', title: 'Quadratic Equations', duration: 420, completed: false, subtopics: [{ id: 'st7', title: 'Solution by Factorisation', completed: false }, { id: 'st8', title: 'Quadratic Formula and Nature of Roots', completed: false }] },
      { id: 'c10m-5', title: 'Arithmetic Progressions', duration: 360, completed: false, subtopics: [{ id: 'st9', title: 'nth Term of an AP', completed: false }, { id: 'st10', title: 'Sum of First n Terms of an AP', completed: false }] },
      { id: 'c10m-6', title: 'Introduction to Trigonometry', duration: 480, completed: false, subtopics: [{ id: 'st11', title: 'Trigonometric Ratios of Acute Angles', completed: false }, { id: 'st12', title: 'Trigonometric Identities', completed: false }] }
    ],
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-06-16T12:00:00Z',
  },
  {
    id: 'syl-c10-physics',
    title: 'Class 10 Physics',
    subject: 'Physics',
    grade: 'Class 10',
    status: 'active',
    topics: [
      { id: 'c10p-1', title: 'Light – Reflection and Refraction', duration: 540, completed: true, subtopics: [{ id: 'st13', title: 'Spherical Mirrors and Mirror Formula', completed: true }, { id: 'st14', title: 'Refraction through Glass Lenses', completed: true }] },
      { id: 'c10p-2', title: 'The Human Eye and the Colorful World', duration: 360, completed: false, subtopics: [{ id: 'st15', title: 'Structure of Human Eye and Defects of Vision', completed: false }, { id: 'st16', title: 'Dispersion and Atmospheric Refraction', completed: false }] },
      { id: 'c10p-3', title: 'Electricity', duration: 480, completed: false, subtopics: [{ id: 'st17', title: 'Ohm\'s Law and Resistance', completed: false }, { id: 'st18', title: 'Heating Effects of Electric Current', completed: false }] }
    ],
    createdAt: '2026-01-12T00:00:00Z',
    updatedAt: '2026-06-15T10:00:00Z',
  },
  {
    id: 'syl-c10-chemistry',
    title: 'Class 10 Chemistry',
    subject: 'Chemistry',
    grade: 'Class 10',
    status: 'active',
    topics: [
      { id: 'c10c-1', title: 'Chemical Reactions and Equations', duration: 360, completed: true, subtopics: [{ id: 'st19', title: 'Balanced Chemical Equations', completed: true }, { id: 'st20', title: 'Types of Chemical Reactions', completed: true }] },
      { id: 'c10c-2', title: 'Acids, Bases and Salts', duration: 420, completed: false, subtopics: [{ id: 'st21', title: 'pH Scale and Indicators', completed: false }, { id: 'st22', title: 'Preparation and Uses of Bleaching Powder, Baking Soda', completed: false }] },
      { id: 'c10c-3', title: 'Metals and Non-Metals', duration: 480, completed: false, subtopics: [{ id: 'st23', title: 'Physical and Chemical Properties', completed: false }, { id: 'st24', title: 'Extraction of Metals (Metallurgy)', completed: false }] }
    ],
    createdAt: '2026-01-14T00:00:00Z',
    updatedAt: '2026-06-14T08:00:00Z',
  },

  // CLASS 9
  {
    id: 'syl-c9-math',
    title: 'Class 9 Mathematics',
    subject: 'Mathematics',
    grade: 'Class 9',
    status: 'active',
    topics: [
      { id: 'c9m-1', title: 'Number Systems', duration: 420, completed: true, subtopics: [{ id: 'st25', title: 'Irrational Numbers Representation', completed: true }, { id: 'st26', title: 'Real Numbers and Decimal Expansions', completed: true }] },
      { id: 'c9m-2', title: 'Polynomials', duration: 480, completed: false, subtopics: [{ id: 'st27', title: 'Remainder Theorem & Factor Theorem', completed: false }, { id: 'st28', title: 'Algebraic Identities', completed: false }] },
      { id: 'c9m-3', title: 'Lines and Angles', duration: 360, completed: false, subtopics: [{ id: 'st29', title: 'Parallel Lines and Transversal Properties', completed: false }] }
    ],
    createdAt: '2026-02-10T00:00:00Z',
    updatedAt: '2026-06-10T11:00:00Z',
  },
  {
    id: 'syl-c9-biology',
    title: 'Class 9 Biology',
    subject: 'Biology',
    grade: 'Class 9',
    status: 'active',
    topics: [
      { id: 'c9b-1', title: 'Cell: The Unit of Life', duration: 300, completed: true, subtopics: [{ id: 'st30', title: 'Cell Organelles Structure and Function', completed: true }] },
      { id: 'c9b-2', title: 'Tissues', duration: 360, completed: false, subtopics: [{ id: 'st31', title: 'Plant Tissues (Meristematic vs Permanent)', completed: false }, { id: 'st32', title: 'Animal Tissues (Epithelial, Connective)', completed: false }] }
    ],
    createdAt: '2026-02-12T00:00:00Z',
    updatedAt: '2026-06-11T09:00:00Z',
  },

  // CLASS 11
  {
    id: 'syl-c11-physics',
    title: 'Class 11 Physics',
    subject: 'Physics',
    grade: 'Class 11',
    status: 'active',
    topics: [
      { id: 'c11p-1', title: 'Units and Measurements', duration: 240, completed: true, subtopics: [{ id: 'st33', title: 'Dimensional Analysis and Applications', completed: true }] },
      { id: 'c11p-2', title: 'Motion in a Straight Line', duration: 360, completed: true, subtopics: [{ id: 'st34', title: 'Uniformly Accelerated Motion Equations', completed: true }] },
      { id: 'c11p-3', title: 'Laws of Motion', duration: 480, completed: false, subtopics: [{ id: 'st35', title: 'Newton\'s Laws and Circular Motion', completed: false }] }
    ],
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-06-05T07:00:00Z',
  },
  {
    id: 'syl-c11-chemistry',
    title: 'Class 11 Chemistry',
    subject: 'Chemistry',
    grade: 'Class 11',
    status: 'active',
    topics: [
      { id: 'c11c-1', title: 'Some Basic Concepts of Chemistry', duration: 360, completed: true, subtopics: [{ id: 'st36', title: 'Mole Concept and Stoichiometry', completed: true }] },
      { id: 'c11c-2', title: 'Structure of Atom', duration: 420, completed: false, subtopics: [{ id: 'st37', title: 'Bohr\'s Model and Quantum Numbers', completed: false }] }
    ],
    createdAt: '2026-03-03T00:00:00Z',
    updatedAt: '2026-06-04T12:00:00Z',
  },

  // CLASS 12
  {
    id: 'syl-c12-math',
    title: 'Class 12 Mathematics',
    subject: 'Mathematics',
    grade: 'Class 12',
    status: 'active',
    topics: [
      { id: 'c12m-1', title: 'Matrices', duration: 360, completed: true, subtopics: [{ id: 'st38', title: 'Types of Matrices and Operations', completed: true }] },
      { id: 'c12m-2', title: 'Determinants', duration: 420, completed: true, subtopics: [{ id: 'st39', title: 'Adjoint and Inverse of a Matrix', completed: true }] },
      { id: 'c12m-3', title: 'Continuity and Differentiability', duration: 540, completed: false, subtopics: [{ id: 'st40', title: 'Chain Rule and Logarithmic Differentiation', completed: false }] }
    ],
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-06-01T14:00:00Z',
  },
  {
    id: 'syl-c12-physics',
    title: 'Class 12 Physics',
    subject: 'Physics',
    grade: 'Class 12',
    status: 'active',
    topics: [
      { id: 'c12p-1', title: 'Electric Charges and Fields', duration: 480, completed: true, subtopics: [{ id: 'st41', title: 'Coulomb\'s Law and Gauss\'s Theorem', completed: true }] },
      { id: 'c12p-2', title: 'Electrostatic Potential and Capacitance', duration: 420, completed: false, subtopics: [{ id: 'st42', title: 'Capacitance of Parallel Plate Capacitor', completed: false }] }
    ],
    createdAt: '2026-04-05T00:00:00Z',
    updatedAt: '2026-06-02T10:00:00Z',
  }
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
