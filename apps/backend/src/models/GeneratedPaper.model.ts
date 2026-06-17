// Type-only re-exports for backward compatibility.
// All runtime operations now use Prisma (see config/prisma.ts).
export interface IGeneratedPaper {
  id: string;
  assignmentId: string;
  title: string;
  totalMarks: number;
  duration: number;
  sections: any[];
  canonicalMetadata?: any;
  pdfPath: string | null;
  pdfUrl: string | null;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
