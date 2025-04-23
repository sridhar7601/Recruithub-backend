import { IsString, IsOptional, IsNumber, IsEmail, IsUUID, ValidateNested, IsDate, IsBoolean, IsArray, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { BackgroundBonus, CareerReadiness, ProjectHighlights, ResumeScore, StackAnalysis } from '../student.schema';
import { AIScoreDto } from './ai-score.dto';

export class AcademicDetailsDto {
  @IsOptional()
  @IsString()
  tenthMarks?: string;

  @IsOptional()
  @IsString()
  twelfthMarks?: string;

  @IsOptional()
  @IsString()
  diplomaMarks?: string;

  @IsOptional()
  @IsString()
  ugMarks?: string;

  @IsOptional()
  @IsString()
  pgMarks?: string;
}

export class GitHubDetailsDto {
  @IsOptional()
  @IsNumber()
  totalScore?: number;

  @IsOptional()
  @IsNumber()
  domainScore?: number;

  @IsOptional()
  @IsNumber()
  contributionScore?: number;

  @IsOptional()
  @IsString()
  domains?: string;

  @IsOptional()
  @IsString()
  technologies?: string;

  @IsOptional()
  @IsBoolean()
  consideration?: boolean;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsDate()
  lastAttempt?: Date;

  @IsOptional()
  @IsNumber()
  retryCount?: number;

  @IsOptional()
  @IsBoolean()
  isProcessing?: boolean;
}

export class ResumeScoreDto {
  @IsOptional()
  @IsNumber()
  totalScore?: number;

  @IsOptional()
  @IsNumber()
  baseScore?: number;

  @IsOptional()
  backgroundBonus?: BackgroundBonus;

  @IsOptional()
  @IsNumber()
  technicalFoundationScore?: number;

  @IsOptional()
  @IsNumber()
  projectsPracticalExperienceScore?: number;

  @IsOptional()
  @IsNumber()
  learningAdaptabilityScore?: number;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  standoutFactors?: string;

  @IsOptional()
  stackAnalysis?: StackAnalysis;

  @IsOptional()
  projectHighlights?: ProjectHighlights;

  @IsOptional()
  careerReadiness?: CareerReadiness;

  @IsOptional()
  @IsArray()
  recommendedRoles?: string[];

  @IsOptional()
  @IsString()
  growthPotential?: string;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsNumber()
  retryCount?: number;

  @IsOptional()
  @IsBoolean()
  isProcessing?: boolean;
}

export class WeCPDataDto {
  @IsOptional()
  @IsString()
  candidateId?: string;

  @IsOptional()
  @IsNumber()
  percentage?: number;

  @IsOptional()
  @IsArray()
  programmingLanguagesUsed?: string[];

  @IsOptional()
  testStartTime?: Date;

  @IsOptional()
  @IsString()
  testDuration?: string;

  @IsOptional()
  @IsBoolean()
  testFinished?: boolean;

  @IsOptional()
  @IsString()
  reportLink?: string;

  @IsOptional()
  @IsObject()
  raw?: any;
}

export class CreateStudentDto {
  @IsString()
  registrationNumber: string;

  @IsEmail()
  emailId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  degree?: string;

  @IsString()
  department: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  githubProfile?: string;

  @IsOptional()
  @IsString()
  linkedInProfile?: string;

  @IsOptional()
  @IsString()
  resumeUrl?: string;

  @IsOptional()
  @IsString()
  onlineCodingPlatformUrls?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AcademicDetailsDto)
  academicDetails?: AcademicDetailsDto;

  @IsOptional()
  @IsString()
  backlogHistory?: string;

  @IsOptional()
  @IsNumber()
  currentBacklogs?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => AIScoreDto)
  aiScore?: AIScoreDto;

  @IsOptional()
  @IsNumber()
  wecpTestScore?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => GitHubDetailsDto)
  githubDetails?: GitHubDetailsDto;
  
  @IsOptional()
  @IsBoolean()
  githubEvaluated?: boolean;
  
  @IsOptional()
  @IsBoolean()
  resumeEvaluated?: boolean;
  
  @IsOptional()
  lastResumeEvaluation?: Date;

  @IsOptional()
  @ValidateNested()
  @Type(() => WeCPDataDto)
  wecpData?: WeCPDataDto;
  
  @IsOptional()
  @ValidateNested()
  @Type(() => ResumeScoreDto)
  resumeScore?: ResumeScoreDto;

  @IsString()
  testBatch: string;

  @IsUUID()
  collegeId: string;

  @IsString()
  collegeName: string;

  @IsUUID()
  driveId: string;

  @IsString()
  driveName: string;
}
