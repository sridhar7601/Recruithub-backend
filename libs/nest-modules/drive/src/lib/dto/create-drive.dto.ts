import { IsString, IsUUID, IsEnum, IsDate, IsEmail, IsBoolean, IsOptional, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { RoundDto } from './round.dto';

export class SecondarySpocDto {
  @IsUUID('4')
  spocId: string;

  @IsEmail()
  spocEmail: string;

  @IsString()
  spocName: string;
}

export class CreateDriveDto {
  @IsString()
  name: string;

  @IsUUID('4')
  collegeId: string;

  @IsString()
  collegeName: string;

  @IsEnum(['Associate Engineer', 'Business Analyst'])
  role: 'Associate Engineer' | 'Business Analyst';

  @IsEnum(['Application Development', 'DevOps', 'PMO', 'BaUX'])
  practice: 'Application Development' | 'DevOps' | 'PMO' | 'BaUX';

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsUUID('4')
  primarySpocId: string;

  @IsEmail()
  primarySpocEmail: string;

  @IsString()
  primarySpocName: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SecondarySpocDto)
  @ArrayMinSize(0)
  @ArrayMaxSize(5)
  secondarySpocs?: SecondarySpocDto[];

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoundDto)
  @ArrayMinSize(0)
  @ArrayMaxSize(5)
  rounds?: RoundDto[];
}
