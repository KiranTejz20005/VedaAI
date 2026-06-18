export interface GenerationJobData {
  assignmentId: string;
  jobRecordId: string;
  userId?: string;
  institutionId?: string;
}

export interface PdfJobData {
  assignmentId: string;
  paperId: string;
  jobRecordId: string;
}
