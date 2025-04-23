import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class PanelMemberDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  emailId: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreatePanelDto {
  @ValidateNested()
  @Type(() => PanelMemberDto)
  @IsNotEmpty()
  primaryPanelMember: PanelMemberDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PanelMemberDto)
  @IsOptional()
  additionalPanelMembers?: PanelMemberDto[];

  @IsString()
  @IsOptional()
  name?: string;
}
