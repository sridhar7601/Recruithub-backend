import { Controller, Get, Post, Body, Param, Query, Put, Delete, BadRequestException } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { Assignment } from './assignment.schema';

@Controller('assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  async create(@Body() createAssignmentDto: CreateAssignmentDto): Promise<Assignment> {
    try {
      return await this.assignmentService.create(createAssignmentDto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create assignment');
    }
  }

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('studentId') studentId?: string,
    @Query('panelId') panelId?: string,
    @Query('roundNumber') roundNumber?: number,
    @Query('driveId') driveId?: string
  ): Promise<{ assignments: Assignment[]; total: number; page: number; limit: number }> {
    const filters: any = {};
    if (studentId) filters.studentId = studentId;
    if (panelId) filters.panelId = panelId;
    if (roundNumber) filters.roundNumber = parseInt(roundNumber.toString(), 10);
    if (driveId) filters.driveId = driveId;

    return this.assignmentService.findAll(page, limit, filters);
  }

  @Get(':assignmentId')
  async findOne(@Param('assignmentId') assignmentId: string): Promise<Assignment> {
    const assignment = await this.assignmentService.findOne(assignmentId);
    if (!assignment) {
      throw new BadRequestException(`Assignment with ID ${assignmentId} not found`);
    }
    return assignment;
  }

  @Put(':assignmentId')
  async update(
    @Param('assignmentId') assignmentId: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto
  ): Promise<Assignment> {
    try {
      const updatedAssignment = await this.assignmentService.update(assignmentId, updateAssignmentDto);
      if (!updatedAssignment) {
        throw new BadRequestException(`Assignment with ID ${assignmentId} not found`);
      }
      return updatedAssignment;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update assignment');
    }
  }

  @Delete(':assignmentId')
  async remove(@Param('assignmentId') assignmentId: string): Promise<{ message: string }> {
    try {
      await this.assignmentService.remove(assignmentId);
      return { message: 'Assignment removed successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to remove assignment');
    }
  }
}
