import { Controller, Get, Post, Body, Param, Query, Put, Delete, UseInterceptors, UploadedFile, Logger, Res, ParseIntPipe, ParseBoolPipe, DefaultValuePipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PaginatedStudentResponseDto } from './dto/paginated-student-response.dto';
import { Student, StudentRound } from './student.schema';
import { UpdateStudentRoundDto } from './dto/update-student-round.dto';
import { Express, Response } from 'express';
import { memoryStorage } from 'multer';

interface DetailedImportResult {
  totalInserted: number;
  skippedEntries: {
    duplicates: {
      count: number;
      details: Array<{ registrationNumber: string; reason: string }>;
    };
    invalidData: {
      count: number;
      details: Array<{ row: number; errors: string[] }>;
    };
  };
}

@Controller('students')
export class StudentController {
  private readonly logger = new Logger(StudentController.name);

  constructor(private readonly studentService: StudentService) {}

  @Post()
  create(@Body() createStudentDto: CreateStudentDto): Promise<Student> {
    return this.studentService.create(createStudentDto);
  }

  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('collegeId') collegeId?: string,
    @Query('driveId') driveId?: string,
    @Query('department') department?: string,
    @Query('testBatch') testBatch?: string
  ): Promise<PaginatedStudentResponseDto> {
    const filters: any = {};
    if (collegeId) filters.collegeId = collegeId;
    if (driveId) filters.driveId = driveId;
    if (department) filters.department = department;
    if (testBatch) filters.testBatch = testBatch;

    return this.studentService.findAll(page, limit, filters);
  }

  @Get(':studentId')
  findOne(@Param('studentId') studentId: string): Promise<Student> {
    return this.studentService.findOne(studentId);
  }

  @Put(':studentId')
  update(@Param('studentId') studentId: string, @Body() updateStudentDto: UpdateStudentDto): Promise<Student> {
    return this.studentService.update(studentId, updateStudentDto);
  }

  @Delete(':studentId')
  remove(@Param('studentId') studentId: string): Promise<void> {
    return this.studentService.remove(studentId);
  }

  @Get('export/:driveId')
  @ApiOperation({ summary: 'Export students to Excel by drive ID' })
  @ApiResponse({ status: 200, description: 'Excel file containing student data' })
  async exportToExcel(@Param('driveId') driveId: string, @Res() res: Response) {
    const buffer = await this.studentService.exportToExcel(driveId);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="students-${driveId}.xlsx"`,
      'Content-Length': buffer.length,
    });
    
    res.send(buffer);
  }

  @Post('import/:driveId')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage()
  }))
  async bulkImport(
    @Param('driveId') driveId: string,
    @UploadedFile() file: Express.Multer.File
  ): Promise<DetailedImportResult> {
    this.logger.log(`Received file: ${file?.originalname} for drive: ${driveId}`);
    if (!file) {
      this.logger.error('No file uploaded');
      throw new Error('No file uploaded');
    }
    const result = await this.studentService.bulkImport(driveId, file);
    this.logger.log(`Import result: ${JSON.stringify(result)}`);
    return result;
  }

  // Student Rounds Management

  @Get(':studentId/rounds')
  @ApiOperation({ summary: 'Get all rounds for a student' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (NOT_STARTED, IN_PROGRESS, COMPLETED, SUBMITTED)' })
  async getStudentRounds(
    @Param('studentId') studentId: string,
    @Query('status') status?: string
  ): Promise<StudentRound[]> {
    return this.studentService.getStudentRounds(studentId, status);
  }

  @Get(':studentId/rounds/:roundNumber')
  @ApiOperation({ summary: 'Get a specific round for a student' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiParam({ name: 'roundNumber', description: 'Round number' })
  async getStudentRoundByNumber(
    @Param('studentId') studentId: string,
    @Param('roundNumber', ParseIntPipe) roundNumber: number
  ): Promise<StudentRound> {
    return this.studentService.getStudentRoundByNumber(studentId, roundNumber);
  }

  @Put(':studentId/rounds/:roundNumber')
  @ApiOperation({ summary: 'Update a specific round for a student' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiParam({ name: 'roundNumber', description: 'Round number' })
  async updateStudentRound(
    @Param('studentId') studentId: string,
    @Param('roundNumber', ParseIntPipe) roundNumber: number,
    @Body() updateDto: UpdateStudentRoundDto
  ): Promise<Student> {
    return this.studentService.updateStudentRound(studentId, roundNumber, updateDto);
  }

  @Post(':studentId/rounds/sync')
  @ApiOperation({ summary: 'Sync student rounds with drive configuration' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  async syncStudentRounds(
    @Param('studentId') studentId: string
  ): Promise<Student> {
    return this.studentService.syncStudentRounds(studentId);
  }
}

@Controller('drives')
@ApiTags('Drives - Student Rounds')
export class DriveStudentRoundsController {
  constructor(private readonly studentService: StudentService) {}

  @Post(':driveId/students/rounds/sync')
  @ApiOperation({ summary: 'Sync all students in a drive with the drive configuration' })
  @ApiParam({ name: 'driveId', description: 'Drive ID' })
  async syncAllStudentsInDrive(
    @Param('driveId') driveId: string
  ): Promise<{ total: number; updated: number }> {
    return this.studentService.syncAllStudentsInDrive(driveId);
  }
}
