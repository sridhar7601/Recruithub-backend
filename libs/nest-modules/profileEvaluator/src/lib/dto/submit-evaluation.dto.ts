import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { EvaluationType } from '../enums/evaluation-type.enum';

/**
 * DTO for submitting an evaluation job
 */
export class SubmitEvaluationDto {
  /**
   * The type of evaluation to perform
   * @example "PreScreening"
   */
  @IsEnum(EvaluationType)
  @IsNotEmpty()
  evaluationType: EvaluationType;
}
