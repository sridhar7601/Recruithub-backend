import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Student, StudentRound, StudentEvaluationCriteria } from './student.schema';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PaginatedStudentResponseDto } from './dto/paginated-student-response.dto';
import { UpdateStudentRoundDto } from './dto/update-student-round.dto';
import { v4 as uuidv4 } from 'uuid';
import { CollegeService } from '../../../college/src/lib/college.service';
import { DriveService } from '../../../drive/src/lib/drive.service';
import { Express } from 'express';
import * as XLSX from 'xlsx';
import { StudentExportService } from './services/student-export.service';

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

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}

@Injectable()
export class StudentService {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<Student>,
    private readonly collegeService: CollegeService,
    private readonly driveService: DriveService,
    private readonly studentExportService: StudentExportService
  ) {}

  async validateIds(collegeId: string, driveId: string): Promise<{ collegeExists: boolean, driveExists: boolean }> {
    console.log('Starting ID validation process');
    const result = { collegeExists: false, driveExists: false };

    try {
      console.log('Validating collegeId:', collegeId);
      const college = await this.collegeService.getCollege(collegeId);
      result.collegeExists = !!college;
      console.log('College exists:', result.collegeExists);

      console.log('Validating driveId:', driveId);
      const drive = await this.driveService.getDriveById(driveId);
      result.driveExists = !!drive;
      console.log('Drive exists:', result.driveExists);

    } catch (error) {
      console.error('Validation error:', error);
      throw new InternalServerErrorException('Failed to validate IDs');
    }

    return result;
  }

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    try {
      const validationResult = await this.validateIds(createStudentDto.collegeId, createStudentDto.driveId);

      if (!validationResult.collegeExists || !validationResult.driveExists) {
        throw new BadRequestException('Validation failed. College or Drive does not exist.');
      }

      // Get drive to initialize rounds
      const drive = await this.driveService.getDriveById(createStudentDto.driveId);
      
      const createdStudent = new this.studentModel({
        ...createStudentDto,
        studentId: uuidv4(),
      });
      
      // Initialize rounds based on drive configuration
      if (drive.rounds && drive.rounds.length > 0) {
        createdStudent.rounds = this.initializeStudentRounds(drive.rounds);
      }
      
      return await createdStudent.save();
    } catch (error: unknown) {
      console.error('Student creation error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      } else if (
        typeof error === 'object' && 
        error !== null && 
        'name' in error && 
        error.name === 'ValidationError' &&
        'message' in error &&
        typeof error.message === 'string'
      ) {
        throw new BadRequestException(error.message);
      } else {
        throw new InternalServerErrorException('Failed to create student');
      }
    }
  }
  
  /**
   * Initialize student rounds based on drive configuration
   */
  private initializeStudentRounds(driveRounds: any[]): StudentRound[] {
    return driveRounds.map(round => ({
      roundNumber: round.roundNumber,
      name: round.name,
      evaluationCriteria: round.evaluationCriteria.map(criteria => ({
        criteriaId: criteria.criteriaId,
        name: criteria.name,
        description: criteria.description || '',
        ratingType: criteria.ratingType,
        isRequired: criteria.isRequired,
        value: null,
        feedback: null
      })),
      status: 'NOT_STARTED',
      notes: null,
      overallRating: null,
      evaluatedBy: null,
      evaluationStartTime: null,
      evaluationEndTime: null
    }));
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters: any = {},
    getAllRecords: boolean = false
  ): Promise<PaginatedStudentResponseDto> {
    if (getAllRecords) {
      const [data, total] = await Promise.all([
        this.studentModel
          .find(filters)
          .sort({ registrationNumber: 1 })
          .exec(),
        this.studentModel.countDocuments(filters).exec(),
      ]);
      
      return {
        data,
        total,
        page: 1,
        limit: total,
      };
    }
    
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.studentModel
        .find(filters)
        .sort({ registrationNumber: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.studentModel.countDocuments(filters).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(studentId: string): Promise<Student> {
    const student = await this.studentModel.findOne({ studentId }).exec();
    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }
    return student;
  }

  async update(studentId: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    
    // Find the student first
    const student = await this.studentModel.findOne({ studentId }).exec();
    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }
    
    // Explicitly set githubEvaluated if provided
    if (updateStudentDto.githubEvaluated !== undefined) {
      student.githubEvaluated = updateStudentDto.githubEvaluated;
    }
    
    // Update other fields
    if (updateStudentDto.githubDetails) {
      student.githubDetails = {
        ...student.githubDetails,
        ...updateStudentDto.githubDetails
      };
    }
    
    // Update all other fields
    Object.keys(updateStudentDto).forEach(key => {
      if (key !== 'githubEvaluated' && key !== 'githubDetails') {
        student[key] = updateStudentDto[key];
      }
    });
    
    // Save the updated student
    const updatedStudent = await student.save();
    
    return updatedStudent;
  }

  async remove(studentId: string): Promise<void> {
    const result = await this.studentModel.findOneAndUpdate(
      { studentId },
      { isActive: false },
      { new: true }
    ).exec();
    if (!result) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }
  }

  async exportToExcel(driveId: string): Promise<Buffer> {
    const { data: students } = await this.findAll(1, 0, { driveId }, true);
    return this.studentExportService.exportToExcel(students);
  }

  async bulkImport(driveId: string, file: Express.Multer.File): Promise<DetailedImportResult> {
    console.log('Received file:', file.originalname, 'for drive:', driveId);
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded or file is empty');
    }

    // Get drive details
    const drive = await this.driveService.getDriveById(driveId);
    if (!drive) {
      throw new BadRequestException(`Drive with ID ${driveId} not found`);
    }

    // Extract college information from drive
    const collegeId = drive.collegeId;
    const collegeName = drive.collegeName;

    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      console.log('Workbook read successfully');

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new BadRequestException('Excel file is empty or invalid');
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      let data;
      try {
        // Use defval to ensure empty cells are included as null and skip blank rows
        data = XLSX.utils.sheet_to_json(sheet, { 
          header: 1, 
          defval: null,
          blankrows: false // Skip completely blank rows
        });
        console.log('Parsed data successfully');
      } catch (parseError) {
        console.error('Error parsing Excel sheet:', parseError);
        throw new BadRequestException('Failed to parse Excel file. Please check the file format.');
      }
      
      // Validate data structure
      if (!Array.isArray(data) || data.length < 2) {
        throw new BadRequestException('Excel file does not have the expected format. Please use the provided template.');
      }

      // Skip the first two rows (college name and headers)
      const allRows = data.slice(2);
      
      // Filter out rows that only contain borders (no actual data)
      const rows = allRows.filter((row, idx) => {
        // Check if row is an array first
        if (!Array.isArray(row)) {
          console.log(`Skipping non-array row at index ${idx + 2}`);
          return false;
        }
        
        const isValid = this.isValidRow(row);
        if (!isValid) {
          console.log(`Skipping empty row at index ${idx + 2} (likely just borders)`);
        }
        return isValid;
      });
      
      console.log(`Found ${rows.length} valid data rows out of ${allRows.length} total rows`);
      
      const result: DetailedImportResult = {
        totalInserted: 0,
        skippedEntries: {
          duplicates: { count: 0, details: [] },
          invalidData: { count: 0, details: [] }
        }
      };

      for (const [index, row] of rows.entries()) {
        try {
          // Ensure row is an array with required data
          if (!Array.isArray(row)) {
            throw new Error('Invalid row format');
          }
          
          // Check if required fields are present
          if (!row[1] || !row[3]) { // Registration number and email are required
            throw new Error('Missing required fields: Registration Number or Email');
          }
          
          const studentDto = this.mapRowToCreateStudentDto(row, collegeId, collegeName, driveId, drive.name);
          
          const existingStudent = await this.studentModel.findOne({
            registrationNumber: studentDto.registrationNumber,
          });

          if (existingStudent) {
            result.skippedEntries.duplicates.count++;
            result.skippedEntries.duplicates.details.push({
              registrationNumber: studentDto.registrationNumber,
              reason: 'Duplicate registration number'
            });
            continue;
          }

          const createdStudent = new this.studentModel({
            ...studentDto,
            studentId: uuidv4(),
          });
          
          // Initialize rounds based on drive configuration
          if (drive.rounds && drive.rounds.length > 0) {
            createdStudent.rounds = this.initializeStudentRounds(drive.rounds);
          }
          
          await createdStudent.save();
          result.totalInserted++;
        } catch (error: unknown) {
          result.skippedEntries.invalidData.count++;
          result.skippedEntries.invalidData.details.push({
            row: index + 3, // +3 because Excel rows start at 1, we have a college name row and a header row
            errors: [typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string' 
              ? error.message 
              : 'Unknown error']
          });
        }
      }

      return result;
    } catch (error: unknown) {
      console.error('Error processing file:', error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
        ? error.message
        : 'Unknown error';
      throw new InternalServerErrorException('Error processing file: ' + errorMessage);
    }
  }

  /**
   * Checks if a row has actual data or if it's just empty cells with borders
   * @param row The row to check
   * @returns true if the row has at least one non-null value
   */
  private isValidRow(row: any[]): boolean {
    if (!Array.isArray(row)) {
      return false;
    }
    
    // Check if row has at least one non-null, non-empty value
    return row.some(cell => {
      if (cell === null || cell === undefined) {
        return false;
      }
      
      // Convert to string and check if it's empty
      if (typeof cell === 'string' && cell.trim() === '') {
        return false;
      }
      
      return true;
    });
  }

  private mapRowToCreateStudentDto(
    row: any[], 
    collegeId: string, 
    collegeName: string, 
    driveId: string, 
    driveName: string
  ): CreateStudentDto {
    // Map Excel columns to student properties
    // Based on the provided Excel format
    const [
      sNo,                    // 0
      registrationNumber,     // 1
      studentName,            // 2
      email,                  // 3
      phoneNumber,            // 4
      degreeSpecialization,   // 5
      gender,                 // 6
      dateOfBirth,            // 7
      githubProfileUrl,       // 8
      linkedInProfileUrl,     // 9
      resumeDriveUrl,         // 10
      leetCodeUrl,            // 11
      tenthMarks,             // 12
      twelfthMarks,           // 13
      diplomaMarks,           // 14
      ugMarks,                // 15
      pgMarks,                // 16
      backlogHistory,         // 17
      currentBacklogs         // 18
    ] = row;

    // Extract department from degree specialization
    const degree = String(degreeSpecialization || '');
    const department = degree.includes('-') ? 
      degree.split('-')[1]?.trim() || 'Unknown' : 
      'Unknown';

    // Parse currentBacklogs as number or default to 0
    const parsedBacklogs = currentBacklogs !== null && currentBacklogs !== undefined ? 
      Number(currentBacklogs) : 0;

    // Create a student DTO with all the fields from the Excel sheet
    const studentDto: CreateStudentDto = {
      registrationNumber: String(registrationNumber || ''),
      emailId: String(email || ''),
      name: String(studentName || ''),
      phoneNumber: String(phoneNumber || ''),
      degree,
      department,
      gender: String(gender || ''),
      dateOfBirth: String(dateOfBirth || ''),
      githubProfile: String(githubProfileUrl || ''),
      linkedInProfile: String(linkedInProfileUrl || ''),
      resumeUrl: String(resumeDriveUrl || ''),
      onlineCodingPlatformUrls: String(leetCodeUrl || ''),
      academicDetails: {
        tenthMarks: String(tenthMarks || ''),
        twelfthMarks: String(twelfthMarks || ''),
        diplomaMarks: String(diplomaMarks || ''),
        ugMarks: String(ugMarks || ''),
        pgMarks: String(pgMarks || '')
      },
      backlogHistory: String(backlogHistory || ''),
      currentBacklogs: parsedBacklogs,
      testBatch: 'Default', // Default value, can be updated later
      collegeId,
      collegeName,
      driveId,
      driveName,
      aiScore: {
        total: 0,
        components: {
          github: { fullStack: 0, aiml: 0, contribution: 0 },
          resume: {
            fullStack: { frontend: 0, backend: 0, database: 0, infrastructure: 0 },
            aiml: { core: 0, genai: 0 }
          }
        },
        expertise: { fullStack: 'LOW', aiml: 'LOW' }
      }, // Default value, can be updated later
      wecpTestScore: 0, // Default value, can be updated later
    };

    // Log the mapped student data for debugging
    console.log('Mapped student data:', studentDto);

    return studentDto;
  }
  
  /**
   * Get all rounds for a student
   */
  async getStudentRounds(studentId: string, status?: string): Promise<StudentRound[]> {
    const student = await this.findOne(studentId);
    
    if (!student.rounds || student.rounds.length === 0) {
      return [];
    }
    
    // Filter by status if provided
    if (status) {
      return student.rounds.filter(round => round.status === status);
    }
    
    return student.rounds;
  }
  
  /**
   * Get a specific round for a student
   */
  async getStudentRoundByNumber(studentId: string, roundNumber: number): Promise<StudentRound> {
    const student = await this.findOne(studentId);
    
    if (!student.rounds || student.rounds.length === 0) {
      throw new NotFoundException(`No rounds found for student with ID ${studentId}`);
    }
    
    const round = student.rounds.find(r => r.roundNumber === roundNumber);
    if (!round) {
      throw new NotFoundException(`Round ${roundNumber} not found for student with ID ${studentId}`);
    }
    
    return round;
  }
  
  /**
   * Update a specific round for a student
   */
  async updateStudentRound(studentId: string, roundNumber: number, updateDto: UpdateStudentRoundDto): Promise<Student> {
    const student = await this.findOne(studentId);
    
    if (!student.rounds || student.rounds.length === 0) {
      throw new NotFoundException(`No rounds found for student with ID ${studentId}`);
    }
    
    const roundIndex = student.rounds.findIndex(r => r.roundNumber === roundNumber);
    if (roundIndex === -1) {
      throw new NotFoundException(`Round ${roundNumber} not found for student with ID ${studentId}`);
    }
    
    const round = student.rounds[roundIndex];
    
    // Validate status transition
    if (updateDto.status) {
      this.validateStatusTransition(round.status, updateDto.status);
      
      // If transitioning to COMPLETED or SUBMITTED, validate required criteria
      if (['COMPLETED', 'SUBMITTED'].includes(updateDto.status)) {
        this.validateRequiredCriteria(round.evaluationCriteria, updateDto.evaluationCriteria);
      }
    }
    
    // Update basic properties
    if (updateDto.name) round.name = updateDto.name;
    if (updateDto.notes) round.notes = updateDto.notes;
    if (updateDto.status) round.status = updateDto.status;
    if (updateDto.evaluatedBy) round.evaluatedBy = updateDto.evaluatedBy;
    
    // Update timestamps
    if (updateDto.evaluationStartTime) round.evaluationStartTime = updateDto.evaluationStartTime;
    if (updateDto.evaluationEndTime) round.evaluationEndTime = updateDto.evaluationEndTime;
    
    // Update evaluation criteria if provided
    if (updateDto.evaluationCriteria && updateDto.evaluationCriteria.length > 0) {
      updateDto.evaluationCriteria.forEach(criteriaUpdate => {
        const criteriaIndex = round.evaluationCriteria.findIndex(c => c.criteriaId === criteriaUpdate.criteriaId);
        if (criteriaIndex !== -1) {
          // Update only the value and feedback
          if (criteriaUpdate.value !== undefined) {
            round.evaluationCriteria[criteriaIndex].value = criteriaUpdate.value;
          }
          if (criteriaUpdate.feedback !== undefined) {
            round.evaluationCriteria[criteriaIndex].feedback = criteriaUpdate.feedback;
          }
        }
      });
    }
    
    // Calculate overall rating if criteria values are provided
    if (updateDto.evaluationCriteria) {
      round.overallRating = this.calculateOverallRating(round.evaluationCriteria);
    } else if (updateDto.overallRating !== undefined) {
      round.overallRating = updateDto.overallRating;
    }
    
    // Save the updated student
    return await student.save();
  }
  
  /**
   * Sync student rounds with drive configuration
   */
  async syncStudentRounds(studentId: string): Promise<Student> {
    const student = await this.findOne(studentId);
    
    // Get drive configuration
    const drive = await this.driveService.getDriveById(student.driveId);
    if (!drive) {
      throw new NotFoundException(`Drive with ID ${student.driveId} not found`);
    }
    
    if (!drive.rounds || drive.rounds.length === 0) {
      return student; // No rounds to sync
    }
    
    // Initialize rounds array if it doesn't exist
    if (!student.rounds) {
      student.rounds = [];
    }
    
    // For each drive round, check if it exists in student rounds
    for (const driveRound of drive.rounds) {
      const existingRoundIndex = student.rounds.findIndex(r => r.roundNumber === driveRound.roundNumber);
      
      if (existingRoundIndex === -1) {
        // Round doesn't exist, add it
        student.rounds.push({
          roundNumber: driveRound.roundNumber,
          name: driveRound.name,
          evaluationCriteria: driveRound.evaluationCriteria.map(criteria => ({
            criteriaId: criteria.criteriaId,
            name: criteria.name,
            description: criteria.description || '',
            ratingType: criteria.ratingType,
            isRequired: criteria.isRequired,
            value: null,
            feedback: null
          })),
          status: 'NOT_STARTED',
          notes: null,
          overallRating: null,
          evaluatedBy: null,
          evaluationStartTime: null,
          evaluationEndTime: null
        });
      } else {
        // Round exists, update name and sync criteria
        const existingRound = student.rounds[existingRoundIndex];
        existingRound.name = driveRound.name;
        
        // For each drive criteria, check if it exists in student criteria
        for (const driveCriteria of driveRound.evaluationCriteria) {
          const existingCriteriaIndex = existingRound.evaluationCriteria.findIndex(
            c => c.criteriaId === driveCriteria.criteriaId
          );
          
          if (existingCriteriaIndex === -1) {
            // Criteria doesn't exist, add it
            existingRound.evaluationCriteria.push({
              criteriaId: driveCriteria.criteriaId,
              name: driveCriteria.name,
              description: driveCriteria.description || '',
              ratingType: driveCriteria.ratingType,
              isRequired: driveCriteria.isRequired,
              value: null,
              feedback: null
            });
          } else {
            // Criteria exists, update metadata (not value or feedback)
            const existingCriteria = existingRound.evaluationCriteria[existingCriteriaIndex];
            existingCriteria.name = driveCriteria.name;
            existingCriteria.description = driveCriteria.description || '';
            existingCriteria.ratingType = driveCriteria.ratingType;
            existingCriteria.isRequired = driveCriteria.isRequired;
          }
        }
      }
    }
    
    // Sort rounds by roundNumber
    student.rounds.sort((a, b) => a.roundNumber - b.roundNumber);
    
    // Save the updated student
    return await student.save();
  }
  
  /**
   * Sync all students in a drive with the drive configuration
   */
  async syncAllStudentsInDrive(driveId: string): Promise<{ total: number; updated: number }> {
    // Get drive configuration
    const drive = await this.driveService.getDriveById(driveId);
    if (!drive) {
      throw new NotFoundException(`Drive with ID ${driveId} not found`);
    }
    
    // Get all students in the drive
    const { data: students, total } = await this.findAll(1, 0, { driveId }, true);
    
    let updated = 0;
    
    // Sync each student
    for (const student of students) {
      try {
        await this.syncStudentRounds(student.studentId);
        updated++;
      } catch (error) {
        console.error(`Failed to sync rounds for student ${student.studentId}:`, error);
      }
    }
    
    return { total, updated };
  }
  
  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    const statusOrder = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SUBMITTED'];
    
    const currentIndex = statusOrder.indexOf(currentStatus);
    const newIndex = statusOrder.indexOf(newStatus);
    
    // Cannot go back from SUBMITTED
    if (currentStatus === 'SUBMITTED' && newStatus !== 'SUBMITTED') {
      throw new ForbiddenException('Cannot change status once it has been submitted');
    }
    
    // Cannot skip statuses (except for NOT_STARTED to COMPLETED which is allowed)
    if (newIndex > currentIndex + 1 && !(currentStatus === 'NOT_STARTED' && newStatus === 'COMPLETED')) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }
  
  /**
   * Validate required criteria have values
   */
  private validateRequiredCriteria(existingCriteria: StudentEvaluationCriteria[], updatedCriteria?: any[]): void {
    // If no updates provided, check existing criteria
    if (!updatedCriteria) {
      const missingRequired = existingCriteria
        .filter(c => c.isRequired && (c.value === null || c.value === undefined))
        .map(c => c.name);
      
      if (missingRequired.length > 0) {
        throw new BadRequestException(`Required criteria missing values: ${missingRequired.join(', ')}`);
      }
      return;
    }
    
    // Create a map of updated criteria
    const updatedCriteriaMap = new Map();
    updatedCriteria.forEach(c => {
      updatedCriteriaMap.set(c.criteriaId, c.value);
    });
    
    // Check each required criteria
    const missingRequired = existingCriteria
      .filter(c => {
        if (!c.isRequired) return false;
        
        // If criteria is being updated, check the updated value
        if (updatedCriteriaMap.has(c.criteriaId)) {
          const updatedValue = updatedCriteriaMap.get(c.criteriaId);
          return updatedValue === null || updatedValue === undefined;
        }
        
        // Otherwise check the existing value
        return c.value === null || c.value === undefined;
      })
      .map(c => c.name);
    
    if (missingRequired.length > 0) {
      throw new BadRequestException(`Required criteria missing values: ${missingRequired.join(', ')}`);
    }
  }
  
  /**
   * Calculate overall rating based on criteria values
   */
  private calculateOverallRating(criteria: StudentEvaluationCriteria[]): number {
    // Filter criteria with numeric values
    const numericCriteria = criteria.filter(c => {
      if (c.value === null || c.value === undefined) return false;
      
      if (c.ratingType === 'text') return false;
      
      if (c.ratingType === 'yes-no') {
        return typeof c.value === 'boolean';
      }
      
      return typeof c.value === 'number';
    });
    
    if (numericCriteria.length === 0) {
      return null;
    }
    
    // Calculate sum of normalized values
    let sum = 0;
    let count = 0;
    
    for (const criterion of numericCriteria) {
      let normalizedValue: number;
      
      switch (criterion.ratingType) {
        case 'percentage':
          // Normalize percentage to 0-5 scale
          normalizedValue = (criterion.value as number) / 20;
          break;
        case 'scale-5':
          normalizedValue = criterion.value as number;
          break;
        case 'scale-10':
          // Normalize scale-10 to 0-5 scale
          normalizedValue = (criterion.value as number) / 2;
          break;
        case 'yes-no':
          // Yes = 5, No = 0
          normalizedValue = (criterion.value as boolean) ? 5 : 0;
          break;
        default:
          continue;
      }
      
      sum += normalizedValue;
      count++;
    }
    
    // Return average rounded to 1 decimal place
    return Math.round((sum / count) * 10) / 10;
  }
}
