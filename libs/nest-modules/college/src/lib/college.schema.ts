import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type CollegeDocument = HydratedDocument<College>;

/**
 * Mongoose schema for the `College` entity.
 */
@Schema({
  timestamps: { 
    createdAt: 'createdTimestamp', 
    updatedAt: 'updatedTimestamp' 
  },
  toJSON: {
    versionKey: false,
    virtuals: true,
    transform(_, ret) {
      delete ret['_id'];
      return ret;
    },
  },
})
export class College {
  @Prop({ required: true, default: uuidv4 })
  collegeId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  city!: string;

  @Prop({ default: false })
  isDeleted!: boolean;
}

export const CollegeSchema = SchemaFactory.createForClass(College);
