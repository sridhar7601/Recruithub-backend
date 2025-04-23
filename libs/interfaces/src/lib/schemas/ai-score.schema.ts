import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      delete ret['_id'];
      return ret;
    },
  },
})
export class AIScoreComponents {
  @Prop({ type: Object, required: false })
  github?: {
    fullStack: number;
    aiml: number;
    contribution: number;
  };

  @Prop({ type: Object, required: false })
  resume?: {
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

  @Prop({ type: Object, required: false })
  wecp?: {
    fullStack: number;
    aiml: number;
  };
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      delete ret['_id'];
      return ret;
    },
  },
})
export class AIScore {
  @Prop({ required: false })
  total?: number;

  @Prop({ type: Object, required: false })
  components?: AIScoreComponents;

  @Prop({ type: Object, required: false })
  expertise?: {
    fullStack: string;
    aiml: string;
  };
}

export const AIScoreSchema = SchemaFactory.createForClass(AIScore);
