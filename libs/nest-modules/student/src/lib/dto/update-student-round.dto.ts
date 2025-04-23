import { IsString, IsEnum, IsOptional, IsNumber, IsDate, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { StudentEvaluationCriteriaDto } from './student-evaluation-criteria.dto';
import { StudentRoundEvaluatorDto } from './student-round-evaluator.dto';

export class UpdateStudentRoundDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => StudentEvaluationCriteriaDto)
  @ArrayMinSize(1)
  evaluationCriteria?: StudentEvaluationCriteriaDto[];

  @IsOptional()
  @IsNumber()
  overallRating?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SUBMITTED'])
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SUBMITTED';

  @IsOptional()
  @ValidateNested()
  @Type(() => StudentRoundEvaluatorDto)
  evaluatedBy?: StudentRoundEvaluatorDto;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  evaluationStartTime?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  evaluationEndTime?: Date;
}
