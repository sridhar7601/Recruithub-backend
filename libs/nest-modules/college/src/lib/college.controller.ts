import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  HttpCode, 
  HttpStatus, 
  NotFoundException, 
  Param, 
  Post, 
  Put, 
  Query 
} from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CollegeService } from './college.service';
import { 
  CollegeResponseDto, 
  CreateCollegeDto, 
  PaginatedCollegeResponseDto, 
  UpdateCollegeDto 
} from './dto';

@ApiTags('colleges')
@Controller('colleges')
export class CollegeController {
  constructor(private readonly service: CollegeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new college' })
  @ApiCreatedResponse({ 
    description: 'The college has been successfully created.',
    type: CollegeResponseDto
  })
  async createCollege(@Body() dto: CreateCollegeDto): Promise<CollegeResponseDto> {
    return this.service.createCollege(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of colleges' })
  @ApiOkResponse({ 
    description: 'List of colleges retrieved successfully.',
    type: PaginatedCollegeResponseDto
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'city', required: false, type: String, description: 'Filter by city' })
  async getColleges(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('city') city?: string
  ): Promise<PaginatedCollegeResponseDto> {
    return this.service.getColleges(page, limit, { city });
  }

  @Get(':collegeId')
  @ApiOperation({ summary: 'Get a college by ID' })
  @ApiOkResponse({ 
    description: 'College retrieved successfully.',
    type: CollegeResponseDto
  })
  @ApiNotFoundResponse({ description: 'College not found or has been deleted.' })
  async getCollege(@Param('collegeId') collegeId: string): Promise<CollegeResponseDto> {
    const college = await this.service.getCollege(collegeId);
    if (!college) {
      throw new NotFoundException(`College with ID ${collegeId} not found or has been deleted.`);
    }
    return college;
  }

  @Put(':collegeId')
  @ApiOperation({ summary: 'Update a college' })
  @ApiOkResponse({ 
    description: 'College updated successfully.',
    type: CollegeResponseDto
  })
  @ApiNotFoundResponse({ description: 'College not found or has been deleted.' })
  async updateCollege(
    @Param('collegeId') collegeId: string,
    @Body() dto: UpdateCollegeDto
  ): Promise<CollegeResponseDto> {
    const college = await this.service.updateCollege(collegeId, dto);
    if (!college) {
      throw new NotFoundException(`College with ID ${collegeId} not found or has been deleted.`);
    }
    return college;
  }

  @Delete(':collegeId')
  @ApiOperation({ summary: 'Soft delete a college' })
  @ApiOkResponse({ description: 'College deleted successfully.' })
  @ApiNotFoundResponse({ description: 'College not found or has been deleted.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCollege(@Param('collegeId') collegeId: string): Promise<void> {
    const result = await this.service.deleteCollege(collegeId);
    if (!result) {
      throw new NotFoundException(`College with ID ${collegeId} not found or has been deleted.`);
    }
  }
}
