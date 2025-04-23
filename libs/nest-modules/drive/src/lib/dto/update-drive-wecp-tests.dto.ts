import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class UpdateDriveWecpTestsDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  wecpTestIds: string[];
}
