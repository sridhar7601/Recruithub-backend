import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

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
export class AIScoreComponents {
  @Prop({ type: Object })
  github: {
    fullStack: number;
    aiml: number;
    contribution: number;
  };

  @Prop({ type: Object })
  resume: {
    fullStack: {
      frontend: number;
      backend: number;
      database: number;
      infrastructure: number;
    };
    aiml: {
      core: number;
      genai: number;
    };
  };

  @Prop({ type: Object })
  wecp: {
    fullStack: number;
    aiml: number;
  };
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
export class AIScore {
  @Prop()
  total: number;

  @Prop({ type: Object })
  components: AIScoreComponents;

  @Prop({ type: Object })
  expertise: {
    fullStack: string;
    aiml: string;
  };
}

export const AIScoreSchema = SchemaFactory.createForClass(AIScore);
