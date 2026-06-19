export interface GenerationJobData {
  assignmentId: string;
  jobRecordId: string;
  userId?: string;
  organizationId?: string;
}

export interface PdfJobData {
  assignmentId: string;
  paperId: string;
  jobRecordId: string;
}
