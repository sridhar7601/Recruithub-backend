import { IsString, IsEnum, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class EvaluationCriteriaDto {
  @IsUUID('4')
  @IsOptional()
  criteriaId?: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['percentage', 'scale-5', 'scale-10', 'yes-no', 'text'])
  ratingType: 'percentage' | 'scale-5' | 'scale-10' | 'yes-no' | 'text';

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;
}
