import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class PanelMemberDto {
  @IsString()
  @IsOptional()
  employeeId?: string;

  @IsString()
  @IsOptional()
  emailId?: string;

  @IsString()
  @IsOptional()
  name?: string;
}

export class UpdatePanelDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PanelMemberDto)
  @IsOptional()
  additionalPanelMembers?: PanelMemberDto[];

  @IsString()
  @IsOptional()
  name?: string;
}
