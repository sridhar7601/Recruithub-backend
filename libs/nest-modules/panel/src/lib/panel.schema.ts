import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema()
export class PanelMember {
  @Prop({ type: String, required: true })
  employeeId!: string;

  @Prop({ type: String, required: true })
  emailId!: string;

  @Prop({ type: String, required: true })
  name!: string;
}

export const PanelMemberSchema = SchemaFactory.createForClass(PanelMember);

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
export class Panel {
  @Prop({ type: String, default: uuidv4, unique: true })
  panelId!: string;

  @Prop({ type: PanelMemberSchema, required: true })
  primaryPanelMember!: PanelMember;

  @Prop({ type: [PanelMemberSchema], default: [] })
  additionalPanelMembers!: PanelMember[];

  @Prop({ type: String, required: false })
  name?: string;
}

export type PanelDocument = Panel & Document;
export const PanelSchema = SchemaFactory.createForClass(Panel);

PanelSchema.index({ 'primaryPanelMember.employeeId': 1 }, { unique: true });
