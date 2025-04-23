import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type DriveDocument = Drive & Document;

@Schema({ _id: false })
class EvaluationCriteria {
  @Prop({ required: true, default: uuidv4 })
  criteriaId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: true, enum: ['percentage', 'scale-5', 'scale-10', 'yes-no', 'text'] })
  ratingType: 'percentage' | 'scale-5' | 'scale-10' | 'yes-no' | 'text';

  @Prop({ required: true, default: true })
  isRequired: boolean;
}

const EvaluationCriteriaSchema = SchemaFactory.createForClass(EvaluationCriteria);

@Schema({ _id: false })
class Round {
  @Prop({ required: true, min: 1, max: 5 })
  roundNumber: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ type: [EvaluationCriteriaSchema], required: true })
  evaluationCriteria: EvaluationCriteria[];
}

const RoundSchema = SchemaFactory.createForClass(Round);

@Schema({ _id: false })
class SecondarySpoc {
  @Prop({ required: true })
  spocId: string;

  @Prop({ required: true })
  spocEmail: string;

  @Prop({ required: true })
  spocName: string;
}

const SecondarySpocSchema = SchemaFactory.createForClass(SecondarySpoc);

@Schema({
  timestamps: { createdAt: 'createdTimestamp', updatedAt: 'updatedTimestamp' },
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      delete ret._id;
      return ret;
    },
  },
})
export class Drive {
  @Prop({ required: true, default: uuidv4 })
  driveId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  collegeId: string;

  @Prop({ required: true })
  collegeName: string;

  @Prop({ required: true, enum: ['Associate Engineer', 'Business Analyst'] })
  role: 'Associate Engineer' | 'Business Analyst';

  @Prop({ required: true, enum: ['Application Development', 'DevOps', 'PMO', 'BaUX'] })
  practice: 'Application Development' | 'DevOps' | 'PMO' | 'BaUX';

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  primarySpocId: string;

  @Prop({ required: true })
  primarySpocEmail: string;

  @Prop({ required: true })
  primarySpocName: string;

  @Prop({ type: [SecondarySpocSchema], required: false })
  secondarySpocs?: SecondarySpoc[];

  @Prop({ default: false })
  isPinned: boolean;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  wecpTestIds: string[];

  @Prop({ type: [RoundSchema], default: [] })
  rounds: Round[];

  createdTimestamp: Date;
  updatedTimestamp: Date;
}

export const DriveSchema = SchemaFactory.createForClass(Drive);

// Create an index on the startDate field for efficient querying of upcoming drives
DriveSchema.index({ startDate: 1 });

// Create an index on rounds.roundNumber for efficient querying of rounds
DriveSchema.index({ 'rounds.roundNumber': 1 });
