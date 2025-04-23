import { ApiProperty } from '@nestjs/swagger';
import { College } from '@recruit-hub/interfaces';

export class CollegeResponseDto implements College {
  @ApiProperty({
    description: 'The unique identifier for the college',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  collegeId!: string;

  @ApiProperty({
    description: 'The name of the college',
    example: 'Harvard University'
  })
  name!: string;

  @ApiProperty({
    description: 'The city where the college is located',
    example: 'Cambridge'
  })
  city!: string;

  @ApiProperty({
    description: 'Indicates whether the college has been soft deleted',
    example: false
  })
  isDeleted!: boolean;

  @ApiProperty({
    description: 'The timestamp when the college was created',
    example: '2025-03-25T07:00:00.000Z'
  })
  createdTimestamp!: Date;

  @ApiProperty({
    description: 'The timestamp when the college was last updated',
    example: '2025-03-25T07:00:00.000Z'
  })
  updatedTimestamp!: Date;
}
