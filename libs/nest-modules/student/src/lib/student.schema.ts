import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AIScore, AIScoreSchema } from '../../../../interfaces/src';
import { SchemaTypes } from 'mongoose';

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
export class AcademicDetails {
  @Prop()
  tenthMarks?: string;

  @Prop()
  twelfthMarks?: string;

  @Prop()
  diplomaMarks?: string;

  @Prop()
  ugMarks?: string;

  @Prop()
  pgMarks?: string;
}

const AcademicDetailsSchema = SchemaFactory.createForClass(AcademicDetails);

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
export class GitHubDetails {
  @Prop()
  totalScore?: number;

  @Prop()
  domainScore?: number;

  @Prop()
  contributionScore?: number;

  @Prop()
  domains?: string;

  @Prop()
  technologies?: string;

  @Prop()
  consideration?: boolean;
  
  @Prop()
  error?: string;
  
  @Prop()
  lastAttempt?: Date;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop({ default: false })
  isProcessing: boolean;
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
export class BackgroundBonus {
  @Prop()
  points: number;
  
  @Prop({ type: Object })
  breakdown: {
    fullStackProficiency: number;
    additionalSkills: number;
  };
  
  @Prop()
  justification: string;
}

const BackgroundBonusSchema = SchemaFactory.createForClass(BackgroundBonus);

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
export class StackAnalysis {
  @Prop({ type: Object })
  frontend: {
    score: number;
    technologies: string[];
    expertise: string;
  };
  
  @Prop({ type: Object })
  backend: {
    score: number;
    technologies: string[];
    expertise: string;
  };
  
  @Prop({ type: Object })
  database: {
    score: number;
    technologies: string[];
    expertise: string;
  };
  
  @Prop({ type: Object })
  infrastructure: {
    score: number;
    technologies: string[];
    expertise: string;
  };
  
  @Prop({ type: Object, required: false })
  aiMl?: {
    score: number;
    technologies: string[];
    expertise: string;
    frameworks: string[];
    modelTypes: string[];
  };
  
  @Prop({ type: Object, required: false })
  genAi?: {
    score: number;
    technologies: string[];
    expertise: string;
    implementations: string[];
  };
  
  @Prop({ type: Object, required: false })
  domainSpecific?: {
    background: string;
    relevantSkills: string[];
    crossDomainApplications: string[];
  };
}

const StackAnalysisSchema = SchemaFactory.createForClass(StackAnalysis);

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
export class ProjectHighlights {
  @Prop({ type: [String] })
  bestProjects: string[];
  
  @Prop()
  technicalComplexity: string;
  
  @Prop({ type: [String] })
  architecturalPatterns: string[];
  
  @Prop({ type: [String], required: false })
  aiMlComponents?: string[];
  
  @Prop({ type: [String], required: false })
  domainInfluence?: string[];
  
  @Prop({ type: [String], required: false })
  uniquePerspectives?: string[];
}

const ProjectHighlightsSchema = SchemaFactory.createForClass(ProjectHighlights);

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
export class CareerReadiness {
  @Prop()
  level: string;
  
  @Prop({ type: [String] })
  strengths: string[];
  
  @Prop({ type: [String] })
  areasForImprovement: string[];
  
  @Prop({ required: false })
  backgroundLeverage?: string;
  
  @Prop({ required: false })
  aiIntegrationCapability?: string;
}

const CareerReadinessSchema = SchemaFactory.createForClass(CareerReadiness);

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
export class ResumeScore {
  @Prop()
  totalScore?: number;
  
  @Prop()
  baseScore?: number;
  
  @Prop({ type: BackgroundBonusSchema })
  backgroundBonus?: BackgroundBonus;
  
  @Prop()
  technicalFoundationScore?: number;
  
  @Prop()
  projectsPracticalExperienceScore?: number;
  
  @Prop()
  learningAdaptabilityScore?: number;
  
  @Prop()
  summary?: string;
  
  @Prop()
  standoutFactors?: string;
  
  @Prop({ type: StackAnalysisSchema })
  stackAnalysis?: StackAnalysis;
  
  @Prop({ type: ProjectHighlightsSchema })
  projectHighlights?: ProjectHighlights;
  
  @Prop({ type: CareerReadinessSchema })
  careerReadiness?: CareerReadiness;
  
  @Prop({ type: [String] })
  recommendedRoles?: string[];
  
  @Prop()
  growthPotential?: string;
  
  @Prop()
  error?: string;

  @Prop({ default: 0 })
  retryCount?: number;

  @Prop({ default: false })
  isProcessing?: boolean;
}

const ResumeScoreSchema = SchemaFactory.createForClass(ResumeScore);

const GitHubDetailsSchema = SchemaFactory.createForClass(GitHubDetails);

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
export class WeCPData {
  @Prop()
  candidateId?: string;

  @Prop()
  percentage?: number;

  @Prop({ type: [String] })
  programmingLanguagesUsed?: string[];

  @Prop()
  testStartTime?: Date;

  @Prop()
  testDuration?: string;

  @Prop()
  testFinished?: boolean;

  @Prop()
  reportLink?: string;

  @Prop({ type: Object })
  raw?: any;
}

const WeCPDataSchema = SchemaFactory.createForClass(WeCPData);

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
export class StudentEvaluationCriteria {
  @Prop({ required: true })
  criteriaId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true, enum: ['percentage', 'scale-5', 'scale-10', 'yes-no', 'text'] })
  ratingType: 'percentage' | 'scale-5' | 'scale-10' | 'yes-no' | 'text';

  @Prop({ required: true })
  isRequired: boolean;

  @Prop({ type: SchemaTypes.Mixed, default: null })
  value: number | boolean | string | null;

  @Prop({ type: String, default: null })
  feedback: string | null;
}

const StudentEvaluationCriteriaSchema = SchemaFactory.createForClass(StudentEvaluationCriteria);

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
export class StudentRoundEvaluator {
  @Prop()
  employeeId: string;

  @Prop()
  name: string;

  @Prop()
  emailId: string;
}

const StudentRoundEvaluatorSchema = SchemaFactory.createForClass(StudentRoundEvaluator);

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
export class StudentRound {
  @Prop({ required: true })
  roundNumber: number;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [StudentEvaluationCriteriaSchema], required: true })
  evaluationCriteria: StudentEvaluationCriteria[];

  @Prop()
  overallRating?: number;

  @Prop()
  notes?: string;

  @Prop({ enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SUBMITTED'], default: 'NOT_STARTED' })
  status: string;

  @Prop({ type: StudentRoundEvaluatorSchema })
  evaluatedBy?: StudentRoundEvaluator;

  @Prop()
  evaluationStartTime?: Date;

  @Prop()
  evaluationEndTime?: Date;
}

const StudentRoundSchema = SchemaFactory.createForClass(StudentRound);

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
export class Student extends Document {
  @Prop({ required: true, unique: true })
  studentId: string;

  @Prop({ required: true })
  registrationNumber: string;

  @Prop({ required: true, unique: true })
  emailId: string;

  @Prop()
  name?: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  degree?: string;

  @Prop({ required: true })
  department: string;

  @Prop()
  gender?: string;

  @Prop()
  dateOfBirth?: string;

  @Prop()
  githubProfile?: string;

  @Prop()
  linkedInProfile?: string;

  @Prop()
  resumeUrl?: string;

  @Prop()
  onlineCodingPlatformUrls?: string;

  @Prop({ type: AcademicDetailsSchema })
  academicDetails?: AcademicDetails;

  @Prop()
  backlogHistory?: string;

  @Prop()
  currentBacklogs?: number;

  @Prop({ type: SchemaTypes.Mixed })
  aiScore?: AIScore;

  @Prop()
  wecpTestScore?: number;

  @Prop({ type: GitHubDetailsSchema })
  githubDetails?: GitHubDetails;
  
  @Prop({ default: false, type: Boolean })
  githubEvaluated: boolean;
  
  @Prop({ default: false, type: Boolean })
  resumeEvaluated: boolean;
  
  @Prop()
  lastResumeEvaluation?: Date;

  @Prop({ type: WeCPDataSchema })
  wecpData?: WeCPData;
  
  @Prop({ type: ResumeScoreSchema })
  resumeScore?: ResumeScore;

  @Prop({ required: true })
  testBatch: string;

  @Prop({ required: true })
  collegeId: string;

  @Prop({ required: true })
  collegeName: string;

  @Prop({ required: true })
  driveId: string;

  @Prop({ required: true })
  driveName: string;

  @Prop({ default: true })
  isActive: boolean;
  
  @Prop({ type: [StudentRoundSchema], default: [] })
  rounds: StudentRound[];
}

export const StudentSchema = SchemaFactory.createForClass(Student);

StudentSchema.index({ emailId: 1 });
StudentSchema.index({ registrationNumber: 1 });
StudentSchema.index({ collegeId: 1 });
StudentSchema.index({ driveId: 1 });
StudentSchema.index({ 'rounds.roundNumber': 1 });
