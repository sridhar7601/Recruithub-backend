import { Test, TestingModule } from '@nestjs/testing';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PaginatedStudentResponseDto } from './dto/paginated-student-response.dto';
import { Student } from './student.schema';
import { Logger } from '@nestjs/common';

describe('StudentController', () => {
  let controller: StudentController;
  let mockStudentService: any;

  beforeEach(async () => {
    mockStudentService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      bulkImport: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentController],
      providers: [
        {
          provide: StudentService,
          useValue: mockStudentService,
        },
        Logger,
      ],
    }).compile();

    controller = module.get<StudentController>(StudentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a student', async () => {
      // Arrange
      const dto: CreateStudentDto = {
        registrationNumber: 'REG123',
        emailId: 'student@example.com',
        department: 'Computer Science',
        testBatch: 'Batch 1',
        collegeId: 'college-id',
        collegeName: 'Test College',
        driveId: 'drive-id',
        driveName: 'Test Drive',
        githubProfile: 'github.com/student',
        aiScore: 85,
        wecpTestScore: 90,
      };

      const mockCreatedStudent = {
        studentId: 'student-id',
        ...dto,
        isActive: true,
      };

      mockStudentService.create.mockResolvedValue(mockCreatedStudent);

      // Act
      const result = await controller.create(dto);

      // Assert
      expect(mockStudentService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockCreatedStudent);
    });
  });

  describe('findAll', () => {
    it('should return paginated students with no filters', async () => {
      // Arrange
      const page = 1;
      const limit = 10;
      const mockResponse: PaginatedStudentResponseDto = {
        data: [
          { studentId: 'student-id-1', name: 'Student 1' } as unknown as Student,
          { studentId: 'student-id-2', name: 'Student 2' } as unknown as Student,
        ],
        total: 2,
        page: 1,
        limit: 10,
      };

      mockStudentService.findAll.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.findAll(page, limit);

      // Assert
      expect(mockStudentService.findAll).toHaveBeenCalledWith(page, limit, {});
      expect(result).toEqual(mockResponse);
    });

    it('should return paginated students with filters', async () => {
      // Arrange
      const page = 1;
      const limit = 10;
      const collegeId = 'college-id';
      const driveId = 'drive-id';
      const department = 'Computer Science';
      const testBatch = 'Batch 1';

      const mockResponse: PaginatedStudentResponseDto = {
        data: [
          {
            studentId: 'student-id-1',
            collegeId,
            driveId,
            department,
            testBatch,
          } as unknown as Student,
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockStudentService.findAll.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.findAll(page, limit, collegeId, driveId, department, testBatch);

      // Assert
      expect(mockStudentService.findAll).toHaveBeenCalledWith(page, limit, {
        collegeId,
        driveId,
        department,
        testBatch,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findOne', () => {
    it('should return a student by ID', async () => {
      // Arrange
      const studentId = 'student-id';
      const mockStudent = { studentId, name: 'Test Student' };

      mockStudentService.findOne.mockResolvedValue(mockStudent);

      // Act
      const result = await controller.findOne(studentId);

      // Assert
      expect(mockStudentService.findOne).toHaveBeenCalledWith(studentId);
      expect(result).toEqual(mockStudent);
    });
  });

  describe('update', () => {
    it('should update a student by ID', async () => {
      // Arrange
      const studentId = 'student-id';
      const dto: UpdateStudentDto = { emailId: 'updated@example.com' };
      const mockUpdatedStudent = {
        studentId,
        emailId: 'updated@example.com',
        name: 'Test Student',
      };

      mockStudentService.update.mockResolvedValue(mockUpdatedStudent);

      // Act
      const result = await controller.update(studentId, dto);

      // Assert
      expect(mockStudentService.update).toHaveBeenCalledWith(studentId, dto);
      expect(result).toEqual(mockUpdatedStudent);
    });
  });

  describe('remove', () => {
    it('should remove a student by ID', async () => {
      // Arrange
      const studentId = 'student-id';

      mockStudentService.remove.mockResolvedValue(undefined);

      // Act
      await controller.remove(studentId);

      // Assert
      expect(mockStudentService.remove).toHaveBeenCalledWith(studentId);
    });
  });

  describe('bulkImport', () => {
    it('should import students from file', async () => {
      // Arrange
      const mockFile = {
        originalname: 'students.xlsx',
        buffer: Buffer.from('mock file content'),
      } as Express.Multer.File;

      const mockImportResult = {
        totalInserted: 2,
        skippedEntries: {
          duplicates: { count: 1, details: [] },
          invalidData: { count: 0, details: [] },
        },
      };

      mockStudentService.bulkImport.mockResolvedValue(mockImportResult);

      // Act
      const result = await controller.bulkImport(mockFile);

      // Assert
      expect(mockStudentService.bulkImport).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockImportResult);
    });
  });
});
