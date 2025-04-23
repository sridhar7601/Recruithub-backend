import { IsNumber, IsObject, IsString, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AIScoreComponentsDto {
  @IsObject()
  @IsOptional()
  github?: {
    fullStack: number;
    aiml: number;
    contribution: number;
  };

  @IsObject()
  @IsOptional()
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
}

export class AIScoreDto {
  @IsNumber()
  @IsOptional()
  total?: number;

  @ValidateNested()
  @Type(() => AIScoreComponentsDto)
  @IsOptional()
  components?: AIScoreComponentsDto;

  @IsObject()
  @IsOptional()
  expertise?: {
    fullStack: string;
    aiml: string;
  };
}
