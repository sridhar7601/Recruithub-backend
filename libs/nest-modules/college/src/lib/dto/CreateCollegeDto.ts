import { IsNotEmpty, IsString, Length } from 'class-validator';
import { College } from '@recruit-hub/interfaces';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCollegeDto implements Partial<College> {
  @ApiProperty({
    description: 'The name of the college',
    example: 'Harvard University',
    minLength: 5
  })
  @IsNotEmpty()
  @Length(5)
  name!: string;

  @ApiProperty({
    description: 'The city where the college is located',
    example: 'Cambridge'
  })
  @IsNotEmpty()
  @IsString()
  city!: string;
}
