import { IsOptional, IsString, Length } from 'class-validator';
import { College } from '@recruit-hub/interfaces';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCollegeDto implements Partial<College> {
  @ApiProperty({
    description: 'The name of the college',
    example: 'Harvard University',
    minLength: 5,
    required: false
  })
  @IsOptional()
  @Length(5)
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'The city where the college is located',
    example: 'Cambridge',
    required: false
  })
  @IsOptional()
  @IsString()
  city?: string;
}
