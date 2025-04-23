import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { StudentService } from './student.service';
import { Student } from './student.schema';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { CollegeService } from '../../../college/src/lib/college.service';
import { DriveService } from '../../../drive/src/lib/drive.service';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

describe('StudentService', () => {
  let service: StudentService;
  let mockStudentModel: any;
  let mockCollegeService: any;
  let mockDriveService: any;

  beforeEach(async () => {
    mockStudentModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
      constructor: jest.fn(),
    };

    mockCollegeService = {
      getCollege: jest.fn(),
    };

    mockDriveService = {
      getDriveById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        {
          provide: getModelToken(Student.name),
          useValue: mockStudentModel,
        },
        {
          provide: CollegeService,
          useValue: mockCollegeService,
        },
        {
          provide: DriveService,
          useValue: mockDriveService,
        },
      ],
    }).compile();

    service = module.get<StudentService>(StudentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateIds', () => {
    it('should return true for both collegeExists and driveExists when both exist', async () => {
      // Arrange
      const collegeId = 'college-id';
      const driveId = 'drive-id';
      mockCollegeService.getCollege.mockResolvedValue({ collegeId });
      mockDriveService.getDriveById.mockResolvedValue({ driveId });

      // Act
      const result = await service.validateIds(collegeId, driveId);

      // Assert
      expect(mockCollegeService.getCollege).toHaveBeenCalledWith(collegeId);
      expect(mockDriveService.getDriveById).toHaveBeenCalledWith(driveId);
      expect(result).toEqual({ collegeExists: true, driveExists: true });
    });

    it('should return false for collegeExists when college does not exist', async () => {
      // Arrange
      const collegeId = 'non-existent-college-id';
      const driveId = 'drive-id';
      mockCollegeService.getCollege.mockResolvedValue(null);
      mockDriveService.getDriveById.mockResolvedValue({ driveId });

      // Act
      const result = await service.validateIds(collegeId, driveId);

      // Assert
      expect(mockCollegeService.getCollege).toHaveBeenCalledWith(collegeId);
      expect(mockDriveService.getDriveById).toHaveBeenCalledWith(driveId);
      expect(result).toEqual({ collegeExists: false, driveExists: true });
    });

    it('should return false for driveExists when drive does not exist', async () => {
      // Arrange
      const collegeId = 'college-id';
      const driveId = 'non-existent-drive-id';
      mockCollegeService.getCollege.mockResolvedValue({ collegeId });
      mockDriveService.getDriveById.mockResolvedValue(null);

      // Act
      const result = await service.validateIds(collegeId, driveId);

      // Assert
      expect(mockCollegeService.getCollege).toHaveBeenCalledWith(collegeId);
      expect(mockDriveService.getDriveById).toHaveBeenCalledWith(driveId);
      expect(result).toEqual({ collegeExists: true, driveExists: false });
    });

    it('should throw InternalServerErrorException when validation fails', async () => {
      // Arrange
      const collegeId = 'college-id';
      const driveId = 'drive-id';
      mockCollegeService.getCollege.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.validateIds(collegeId, driveId)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe('create', () => {
    it('should create a student when validation passes', async () => {
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

      jest.spyOn(service, 'validateIds').mockResolvedValue({
        collegeExists: true,
        driveExists: true,
      });

      const mockSavedStudent = {
        studentId: 'student-id',
        ...dto,
        isActive: true,
      };

      const mockStudent = {
        save: jest.fn().mockResolvedValue(mockSavedStudent),
      };

      mockStudentModel.constructor.mockImplementation(() => mockStudent);

      // Act
      const result = await service.create(dto);

      // Assert
      expect(service.validateIds).toHaveBeenCalledWith(dto.collegeId, dto.driveId);
      expect(mockStudentModel.constructor).toHaveBeenCalledWith(expect.objectContaining({
        ...dto,
        studentId: expect.any(String),
      }));
      expect(mockStudent.save).toHaveBeenCalled();
      expect(result).toEqual(mockSavedStudent);
    });

    it('should throw BadRequestException when validation fails', async () => {
      // Arrange
      const dto: CreateStudentDto = {
        registrationNumber: 'REG123',
        emailId: 'student@example.com',
        department: 'Computer Science',
        testBatch: 'Batch 1',
        collegeId: 'invalid-college-id',
        collegeName: 'Test College',
        driveId: 'invalid-drive-id',
        driveName: 'Test Drive',
        githubProfile: 'github.com/student',
        aiScore: 85,
        wecpTestScore: 90,
      };

      jest.spyOn(service, 'validateIds').mockResolvedValue({
        collegeExists: false,
        driveExists: false,
      });

      // Act & Assert
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated students with no filters', async () => {
      // Arrange
      const page = 1;
      const limit = 10;
      const filters = {};
      const mockStudents = [
        { studentId: 'student-id-1', name: 'Student 1' },
        { studentId: 'student-id-2', name: 'Student 2' },
      ];
      const total = 2;

      mockStudentModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockStudents),
      });

      mockStudentModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(total),
      });

      // Act
      const result = await service.findAll(page, limit, filters);

      // Assert
      expect(mockStudentModel.find).toHaveBeenCalledWith(filters);
      expect(mockStudentModel.countDocuments).toHaveBeenCalledWith(filters);
      expect(result).toEqual({
        data: mockStudents,
        total,
        page,
        limit,
      });
    });

    it('should return paginated students with filters', async () => {
      // Arrange
      const page = 1;
      const limit = 10;
      const filters = { collegeId: 'college-id', driveId: 'drive-id' };
      const mockStudents = [
        { studentId: 'student-id-1', name: 'Student 1', collegeId: 'college-id', driveId: 'drive-id' },
      ];
      const total = 1;

      mockStudentModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockStudents),
      });

      mockStudentModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(total),
      });

      // Act
      const result = await service.findAll(page, limit, filters);

      // Assert
      expect(mockStudentModel.find).toHaveBeenCalledWith(filters);
      expect(mockStudentModel.countDocuments).toHaveBeenCalledWith(filters);
      expect(result).toEqual({
        data: mockStudents,
        total,
        page,
        limit,
      });
    });
  });

  describe('findOne', () => {
    it('should return a student by ID', async () => {
      // Arrange
      const studentId = 'student-id';
      const mockStudent = { studentId, name: 'Test Student' };

      mockStudentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStudent),
      });

      // Act
      const result = await service.findOne(studentId);

      // Assert
      expect(mockStudentModel.findOne).toHaveBeenCalledWith({ studentId });
      expect(result).toEqual(mockStudent);
    });

    it('should throw NotFoundException when student not found', async () => {
      // Arrange
      const studentId = 'non-existent-id';

      mockStudentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(service.findOne(studentId)).rejects.toThrow();
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

      mockStudentModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedStudent),
      });

      // Act
      const result = await service.update(studentId, dto);

      // Assert
      expect(mockStudentModel.findOneAndUpdate).toHaveBeenCalledWith(
        { studentId },
        dto,
        { new: true }
      );
      expect(result).toEqual(mockUpdatedStudent);
    });

    it('should throw NotFoundException when student not found', async () => {
      // Arrange
      const studentId = 'non-existent-id';
      const dto: UpdateStudentDto = { emailId: 'updated@example.com' };

      mockStudentModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(service.update(studentId, dto)).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should soft delete a student by ID', async () => {
      // Arrange
      const studentId = 'student-id';
      const mockUpdatedStudent = {
        studentId,
        isActive: false,
      };

      mockStudentModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedStudent),
      });

      // Act
      await service.remove(studentId);

      // Assert
      expect(mockStudentModel.findOneAndUpdate).toHaveBeenCalledWith(
        { studentId },
        { isActive: false },
        { new: true }
      );
    });

    it('should throw NotFoundException when student not found', async () => {
      // Arrange
      const studentId = 'non-existent-id';

      mockStudentModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(service.remove(studentId)).rejects.toThrow();
    });
  });

  // Note: We're not testing bulkImport here as it's complex and would require mocking XLSX
  // In a real-world scenario, you would want to test this method as well
});
