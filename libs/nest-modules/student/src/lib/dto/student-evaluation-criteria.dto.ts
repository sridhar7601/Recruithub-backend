import { IsString, IsEnum, IsBoolean, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class StudentEvaluationCriteriaDto {
  @IsUUID('4')
  criteriaId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['percentage', 'scale-5', 'scale-10', 'yes-no', 'text'])
  ratingType?: 'percentage' | 'scale-5' | 'scale-10' | 'yes-no' | 'text';

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  value?: number | boolean | string | null;

  @IsOptional()
  @IsString()
  feedback?: string | null;
}
