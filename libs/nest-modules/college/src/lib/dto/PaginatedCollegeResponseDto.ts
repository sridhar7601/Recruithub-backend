import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse } from '@recruit-hub/interfaces';
import { CollegeResponseDto } from './CollegeResponseDto';

export class PaginationMetaDto {
  @ApiProperty({
    description: 'The total number of items across all pages',
    example: 100
  })
  totalItems!: number;

  @ApiProperty({
    description: 'The number of items per page',
    example: 10
  })
  itemsPerPage!: number;

  @ApiProperty({
    description: 'The current page number',
    example: 1
  })
  currentPage!: number;

  @ApiProperty({
    description: 'The total number of pages',
    example: 10
  })
  totalPages!: number;
}

export class PaginatedCollegeResponseDto implements PaginatedResponse<CollegeResponseDto> {
  @ApiProperty({
    description: 'The array of college items for the current page',
    type: [CollegeResponseDto]
  })
  items!: CollegeResponseDto[];

  @ApiProperty({
    description: 'Metadata about the pagination',
    type: PaginationMetaDto
  })
  meta!: PaginationMetaDto;
}
