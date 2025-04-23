import { IsString, IsUUID, IsNumber, IsDate, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class PanelMemberDto {
  @IsString()
  employeeId: string;

  @IsString()
  emailId: string;

  @IsString()
  name: string;
}

class AssignedByDto {
  @IsString()
  employeeId: string;

  @IsString()
  name: string;

  @IsString()
  emailId: string;
}

export class CreateAssignmentDto {
  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @IsUUID()
  studentId: string;

  @IsString()
  studentName: string;

  @IsString()
  registrationNumber: string;

  @IsString()
  emailId: string;

  @IsUUID()
  collegeId: string;

  @IsString()
  collegeName: string;

  @IsUUID()
  driveId: string;

  @IsString()
  driveName: string;

  @IsUUID()
  panelId: string;

  @ValidateNested()
  @Type(() => PanelMemberDto)
  primaryPanelMember: PanelMemberDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PanelMemberDto)
  additionalPanelMembers?: PanelMemberDto[];

  @IsNumber()
  roundNumber: number;

  @ValidateNested()
  @Type(() => AssignedByDto)
  assignedBy: AssignedByDto;

  @IsDate()
  @Type(() => Date)
  assignedTimestamp: Date;
}
