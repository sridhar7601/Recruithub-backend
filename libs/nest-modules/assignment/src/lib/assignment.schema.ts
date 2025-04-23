import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

class PanelMember {
  @Prop({ required: true })
  employeeId: string;

  @Prop({ required: true })
  emailId: string;

  @Prop({ required: true })
  name: string;
}

class AssignedBy {
  @Prop({ required: true })
  employeeId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  emailId: string;
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      delete ret._id;
      return ret;
    },
  },
})
export class Assignment extends Document {
  @Prop({ default: uuidv4, unique: true, required: false })
  assignmentId?: string;

  @Prop({ required: true })
  studentId: string;

  @Prop({ required: true })
  studentName: string;

  @Prop({ required: true })
  registrationNumber: string;

  @Prop({ required: true })
  emailId: string;

  @Prop({ required: true })
  collegeId: string;

  @Prop({ required: true })
  collegeName: string;

  @Prop({ required: true })
  driveId: string;

  @Prop({ required: true })
  driveName: string;

  @Prop({ required: true })
  panelId: string;

  @Prop({ type: PanelMember, required: true })
  primaryPanelMember: PanelMember;

  @Prop({ type: [PanelMember] })
  additionalPanelMembers: PanelMember[];

  @Prop({ required: true })
  roundNumber: number;

  @Prop({ type: AssignedBy, required: true })
  assignedBy: AssignedBy;

  @Prop({ required: true })
  assignedTimestamp: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);

AssignmentSchema.pre('save', function(next) {
  if (!this.assignmentId) {
    this.assignmentId = uuidv4();
  }
  next();
});

AssignmentSchema.index({ studentId: 1, roundNumber: 1 }, { unique: true });
AssignmentSchema.index({ panelId: 1 });
AssignmentSchema.index({ driveId: 1 });
