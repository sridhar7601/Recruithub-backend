import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { JobStatus } from './enums/job-status.enum';
import { EvaluationType } from './enums/evaluation-type.enum';

@Schema()
export class EvaluationStats {
  @Prop({ required: true, type: Number, default: 0 })
  total: number;

  @Prop({ required: true, type: Number, default: 0 })
  completed: number;

  @Prop({ required: true, type: Number, default: 0 })
  failed: number;

  @Prop({ required: true, type: Number, default: 0 })
  success: number;
}

const EvaluationStatsSchema = SchemaFactory.createForClass(EvaluationStats);

@Schema()
export class JobProgress {
  @Prop({ type: EvaluationStatsSchema, required: true, default: () => ({}) })
  github: EvaluationStats;

  @Prop({ type: EvaluationStatsSchema, required: true, default: () => ({}) })
  resume: EvaluationStats;

  @Prop({
    type: {
      percentage: { type: Number, required: true, default: 0 },
      status: { type: String, required: true, default: 'Initializing' }
    },
    required: true,
    default: () => ({ percentage: 0, status: 'Initializing' })
  })
  overall: { percentage: number; status: string };
}

const JobProgressSchema = SchemaFactory.createForClass(JobProgress);

@Schema({ timestamps: true })
export class ProfileEvaluatorJob {
  @Prop({ required: true, type: String })
  jobId: string;

  @Prop({ type: Number, default: 0 })
  version: number; // For optimistic locking

  @Prop({ required: true, type: String })
  driveId: string;

  @Prop({ required: true, type: String, enum: Object.values(EvaluationType) })
  evaluationType: EvaluationType;

  @Prop({ required: true, type: String, enum: Object.values(JobStatus), default: JobStatus.PENDING })
  status: JobStatus;

  @Prop({ type: JobProgressSchema, required: true, default: () => ({}) })
  progress: JobProgress;

  @Prop({ type: String })
  error?: string;
}

export type ProfileEvaluatorJobDocument = ProfileEvaluatorJob & Document;
export const ProfileEvaluatorJobSchema = SchemaFactory.createForClass(ProfileEvaluatorJob);
