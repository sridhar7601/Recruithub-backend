import { IsString, IsNumber, IsDate, ValidateNested, ArrayMinSize, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { EvaluationCriteriaDto } from './evaluation-criteria.dto';

export class RoundDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  roundNumber: number;

  @IsString()
  name: string;

  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @IsDate()
  @Type(() => Date)
  endTime: Date;

  @ValidateNested({ each: true })
  @Type(() => EvaluationCriteriaDto)
  @ArrayMinSize(1)
  evaluationCriteria: EvaluationCriteriaDto[];
}

export class CreateRoundDto extends RoundDto {}

export class UpdateRoundDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startTime?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endTime?: Date;

  @ValidateNested({ each: true })
  @Type(() => EvaluationCriteriaDto)
  @ArrayMinSize(1)
  @IsOptional()
  evaluationCriteria?: EvaluationCriteriaDto[];
}
