// Type-only for backward compatibility.
// All runtime operations now use Prisma (see config/prisma.ts).
export interface IAssignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: Date;
  duration: number;
  totalMarks: number;
  questionConfig: {
    types: string[];
    count: number;
    difficulty: { easy: number; medium: number; hard: number };
  };
  uploadedFiles: Array<{
    originalName: string;
    storedName: string;
    mimeType: string;
    size: number;
    path: string;
  }>;
  additionalInstructions: string;
  typeBreakdown?: string;
  status: string;
  generationMeta?: any;
  generationSeq: number;
  activeGenerationJobId?: string;
  finalizedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  className?: string;
  schoolName?: string;
}
