import { JobStatus } from '../enums/job-status.enum';
import { EvaluationType } from '../enums/evaluation-type.enum';

export interface JobProgress {
  total: number;
  completed: number;
}

export interface JobStatusDetails {
  jobId: string;
  driveId: string;
  evaluationType: EvaluationType;
  status: JobStatus;
  progress?: JobProgress;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
