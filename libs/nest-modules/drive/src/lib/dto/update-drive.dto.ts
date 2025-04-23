import { IsString, IsUUID, IsEnum, IsDate, IsEmail, IsBoolean, IsOptional, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { SecondarySpocDto } from './create-drive.dto';
import { RoundDto } from './round.dto';

export class UpdateDriveDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  collegeId?: string;

  @IsOptional()
  @IsString()
  collegeName?: string;

  @IsOptional()
  @IsEnum(['Associate Engineer', 'Business Analyst'])
  role?: 'Associate Engineer' | 'Business Analyst';

  @IsOptional()
  @IsEnum(['Application Development', 'DevOps', 'PMO', 'BaUX'])
  practice?: 'Application Development' | 'DevOps' | 'PMO' | 'BaUX';

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsUUID()
  primarySpocId?: string;

  @IsOptional()
  @IsEmail()
  primarySpocEmail?: string;

  @IsOptional()
  @IsString()
  primarySpocName?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SecondarySpocDto)
  @ArrayMinSize(0)
  @ArrayMaxSize(5)
  secondarySpocs?: SecondarySpocDto[];

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoundDto)
  @ArrayMinSize(0)
  @ArrayMaxSize(5)
  rounds?: RoundDto[];
}
