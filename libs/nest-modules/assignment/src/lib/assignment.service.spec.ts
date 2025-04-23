import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { Assignment } from './assignment.schema';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { StudentService } from '../../../student/src/lib/student.service';
import { PanelService } from '../../../panel/src/lib/panel.service';
import { CollegeService } from '../../../college/src/lib/college.service';
import { DriveService } from '../../../drive/src/lib/drive.service';

describe('AssignmentService', () => {
  let service: AssignmentService;
  let mockAssignmentModel: any;
  let mockStudentService: any;
  let mockPanelService: any;
  let mockCollegeService: any;
  let mockDriveService: any;

  beforeEach(async () => {
    mockAssignmentModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
      countDocuments: jest.fn(),
      constructor: jest.fn(),
    };

    mockStudentService = {
      findOne: jest.fn(),
    };

    mockPanelService = {
      findOne: jest.fn(),
    };

    mockCollegeService = {
      getCollege: jest.fn(),
    };

    mockDriveService = {
      getDriveById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentService,
        {
          provide: getModelToken(Assignment.name),
          useValue: mockAssignmentModel,
        },
        {
          provide: StudentService,
          useValue: mockStudentService,
        },
        {
          provide: PanelService,
          useValue: mockPanelService,
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

    service = module.get<AssignmentService>(AssignmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateEntity', () => {
    it('should not throw when entity exists', async () => {
      // Arrange
      const id = 'entity-id';
      const mockEntity = { id };
      const findFunction = jest.fn().mockResolvedValue(mockEntity);

      // Act & Assert
      await expect(service['validateEntity'](findFunction, id, 'Entity')).resolves.not.toThrow();
      expect(findFunction).toHaveBeenCalledWith(id);
    });

    it('should throw BadRequestException when entity not found', async () => {
      // Arrange
      const id = 'non-existent-id';
      const findFunction = jest.fn().mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(service['validateEntity'](findFunction, id, 'Entity')).rejects.toThrow(BadRequestException);
      expect(findFunction).toHaveBeenCalledWith(id);
    });

    it('should throw BadRequestException for other errors', async () => {
      // Arrange
      const id = 'entity-id';
      const findFunction = jest.fn().mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service['validateEntity'](findFunction, id, 'Entity')).rejects.toThrow(BadRequestException);
      expect(findFunction).toHaveBeenCalledWith(id);
    });
  });

  describe('validateIds', () => {
    it('should not throw when college and drive exist', async () => {
      // Arrange
      const collegeId = 'college-id';
      const driveId = 'drive-id';
      const mockCollege = { collegeId };
      const mockDrive = { driveId };

      mockCollegeService.getCollege.mockResolvedValue(mockCollege);
      mockDriveService.getDriveById.mockResolvedValue(mockDrive);

      // Act & Assert
      await expect(service['validateIds'](collegeId, driveId)).resolves.not.toThrow();
      expect(mockCollegeService.getCollege).toHaveBeenCalledWith(collegeId);
      expect(mockDriveService.getDriveById).toHaveBeenCalledWith(driveId);
    });

    it('should throw BadRequestException when college does not exist', async () => {
      // Arrange
      const collegeId = 'non-existent-college-id';
      const driveId = 'drive-id';

      mockCollegeService.getCollege.mockResolvedValue(null);
      mockDriveService.getDriveById.mockResolvedValue({ driveId });

      // Act & Assert
      await expect(service['validateIds'](collegeId, driveId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when drive does not exist', async () => {
      // Arrange
      const collegeId = 'college-id';
      const driveId = 'non-existent-drive-id';

      mockCollegeService.getCollege.mockResolvedValue({ collegeId });
      mockDriveService.getDriveById.mockResolvedValue(null);

      // Act & Assert
      await expect(service['validateIds'](collegeId, driveId)).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      // Arrange
      const collegeId = 'college-id';
      const driveId = 'drive-id';

      mockCollegeService.getCollege.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service['validateIds'](collegeId, driveId)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('validateAssignmentData', () => {
    it('should not throw when all validations pass', async () => {
      // Arrange
      const dto: CreateAssignmentDto = {
        studentId: 'student-id',
        studentName: 'Test Student',
        registrationNumber: 'REG123',
        emailId: 'student@example.com',
        collegeId: 'college-id',
        collegeName: 'Test College',
        driveId: 'drive-id',
        driveName: 'Test Drive',
        panelId: 'panel-id',
        primaryPanelMember: {
          employeeId: 'emp-id',
          emailId: 'panel@example.com',
          name: 'Test Panel Member',
        },
        additionalPanelMembers: [],
        roundNumber: 1,
        assignedBy: {
          employeeId: 'emp-id-2',
          name: 'Test Assigner',
          emailId: 'assigner@example.com',
        },
        assignedTimestamp: new Date(),
      };

      jest.spyOn(service, 'validateEntity' as any).mockResolvedValue(undefined);
      jest.spyOn(service, 'validateIds' as any).mockResolvedValue(undefined);

      mockAssignmentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(service['validateAssignmentData'](dto)).resolves.not.toThrow();
      expect(service['validateEntity']).toHaveBeenCalledTimes(2);
      expect(service['validateIds']).toHaveBeenCalledWith(dto.collegeId, dto.driveId);
      expect(mockAssignmentModel.findOne).toHaveBeenCalledWith({
        studentId: dto.studentId,
        roundNumber: dto.roundNumber,
      });
    });

    it('should throw BadRequestException when student is already assigned in the same round', async () => {
      // Arrange
      const dto: CreateAssignmentDto = {
        studentId: 'student-id',
        studentName: 'Test Student',
        registrationNumber: 'REG123',
        emailId: 'student@example.com',
        collegeId: 'college-id',
        collegeName: 'Test College',
        driveId: 'drive-id',
        driveName: 'Test Drive',
        panelId: 'panel-id',
        primaryPanelMember: {
          employeeId: 'emp-id',
          emailId: 'panel@example.com',
          name: 'Test Panel Member',
        },
        additionalPanelMembers: [],
        roundNumber: 1,
        assignedBy: {
          employeeId: 'emp-id-2',
          name: 'Test Assigner',
          emailId: 'assigner@example.com',
        },
        assignedTimestamp: new Date(),
      };

      jest.spyOn(service, 'validateEntity' as any).mockResolvedValue(undefined);
      jest.spyOn(service, 'validateIds' as any).mockResolvedValue(undefined);

      const existingAssignment = {
        assignmentId: 'existing-assignment-id',
        studentId: dto.studentId,
        roundNumber: dto.roundNumber,
      };

      mockAssignmentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingAssignment),
      });

      // Act & Assert
      await expect(service['validateAssignmentData'](dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('create', () => {
    it('should create an assignment when validation passes', async () => {
      // Arrange
      const dto: CreateAssignmentDto = {
        studentId: 'student-id',
        studentName: 'Test Student',
        registrationNumber: 'REG123',
        emailId: 'student@example.com',
        collegeId: 'college-id',
        collegeName: 'Test College',
        driveId: 'drive-id',
        driveName: 'Test Drive',
        panelId: 'panel-id',
        primaryPanelMember: {
          employeeId: 'emp-id',
          emailId: 'panel@example.com',
          name: 'Test Panel Member',
        },
        additionalPanelMembers: [],
        roundNumber: 1,
        assignedBy: {
          employeeId: 'emp-id-2',
          name: 'Test Assigner',
          emailId: 'assigner@example.com',
        },
        assignedTimestamp: new Date(),
      };

      jest.spyOn(service, 'validateAssignmentData' as any).mockResolvedValue(undefined);

      const mockSavedAssignment = {
        assignmentId: 'assignment-id',
        ...dto,
        isActive: true,
      };

      const mockAssignment = {
        save: jest.fn().mockResolvedValue(mockSavedAssignment),
      };

      mockAssignmentModel.constructor.mockImplementation(() => mockAssignment);

      // Act
      const result = await service.create(dto);

      // Assert
      expect(service['validateAssignmentData']).toHaveBeenCalledWith(dto);
      expect(mockAssignmentModel.constructor).toHaveBeenCalledWith(expect.objectContaining({
        ...dto,
      }));
      expect(mockAssignment.save).toHaveBeenCalled();
      expect(result).toEqual(mockSavedAssignment);
    });

    it('should throw BadRequestException when validation fails', async () => {
      // Arrange
      const dto: CreateAssignmentDto = {
        studentId: 'student-id',
        studentName: 'Test Student',
        registrationNumber: 'REG123',
        emailId: 'student@example.com',
        collegeId: 'college-id',
        collegeName: 'Test College',
        driveId: 'drive-id',
        driveName: 'Test Drive',
        panelId: 'panel-id',
        primaryPanelMember: {
          employeeId: 'emp-id',
          emailId: 'panel@example.com',
          name: 'Test Panel Member',
        },
        additionalPanelMembers: [],
        roundNumber: 1,
        assignedBy: {
          employeeId: 'emp-id-2',
          name: 'Test Assigner',
          emailId: 'assigner@example.com',
        },
        assignedTimestamp: new Date(),
      };

      jest.spyOn(service, 'validateAssignmentData' as any).mockRejectedValue(new BadRequestException('Validation failed'));

      // Act & Assert
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated assignments with no filters', async () => {
      // Arrange
      const page = 1;
      const limit = 10;
      const filters = {};
      const mockAssignments = [
        { assignmentId: 'assignment-id-1', studentName: 'Student 1' },
        { assignmentId: 'assignment-id-2', studentName: 'Student 2' },
      ];
      const total = 2;

      mockAssignmentModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockAssignments),
      });

      mockAssignmentModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(total),
      });

      // Act
      const result = await service.findAll(page, limit, filters);

      // Assert
      expect(mockAssignmentModel.find).toHaveBeenCalledWith(filters);
      expect(mockAssignmentModel.countDocuments).toHaveBeenCalledWith(filters);
      expect(result).toEqual({
        assignments: mockAssignments,
        total,
        page,
        limit,
      });
    });

    it('should return paginated assignments with filters', async () => {
      // Arrange
      const page = 1;
      const limit = 10;
      const filters = { studentId: 'student-id', panelId: 'panel-id' };
      const mockAssignments = [
        { assignmentId: 'assignment-id-1', studentName: 'Student 1', studentId: 'student-id', panelId: 'panel-id' },
      ];
      const total = 1;

      mockAssignmentModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockAssignments),
      });

      mockAssignmentModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(total),
      });

      // Act
      const result = await service.findAll(page, limit, filters);

      // Assert
      expect(mockAssignmentModel.find).toHaveBeenCalledWith(filters);
      expect(mockAssignmentModel.countDocuments).toHaveBeenCalledWith(filters);
      expect(result).toEqual({
        assignments: mockAssignments,
        total,
        page,
        limit,
      });
    });
  });

  describe('findOne', () => {
    it('should return an assignment by ID', async () => {
      // Arrange
      const assignmentId = 'assignment-id';
      const mockAssignment = { assignmentId, studentName: 'Test Student' };

      mockAssignmentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAssignment),
      });

      // Act
      const result = await service.findOne(assignmentId);

      // Assert
      expect(mockAssignmentModel.findOne).toHaveBeenCalledWith({ assignmentId });
      expect(result).toEqual(mockAssignment);
    });

    it('should throw NotFoundException when assignment not found', async () => {
      // Arrange
      const assignmentId = 'non-existent-id';

      mockAssignmentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(service.findOne(assignmentId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an assignment by ID', async () => {
      // Arrange
      const assignmentId = 'assignment-id';
      const dto: UpdateAssignmentDto = { additionalPanelMembers: [] };
      const mockUpdatedAssignment = {
        assignmentId,
        studentName: 'Test Student',
        additionalPanelMembers: [],
      };

      mockAssignmentModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedAssignment),
      });

      // Act
      const result = await service.update(assignmentId, dto);

      // Assert
      expect(mockAssignmentModel.findOneAndUpdate).toHaveBeenCalledWith(
        { assignmentId },
        dto,
        { new: true }
      );
      expect(result).toEqual(mockUpdatedAssignment);
    });

    it('should throw NotFoundException when assignment not found', async () => {
      // Arrange
      const assignmentId = 'non-existent-id';
      const dto: UpdateAssignmentDto = { additionalPanelMembers: [] };

      mockAssignmentModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(service.update(assignmentId, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an assignment by ID', async () => {
      // Arrange
      const assignmentId = 'assignment-id';

      mockAssignmentModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      // Act
      await service.remove(assignmentId);

      // Assert
      expect(mockAssignmentModel.deleteOne).toHaveBeenCalledWith({ assignmentId });
    });

    it('should throw NotFoundException when assignment not found', async () => {
      // Arrange
      const assignmentId = 'non-existent-id';

      mockAssignmentModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      });

      // Act & Assert
      await expect(service.remove(assignmentId)).rejects.toThrow(NotFoundException);
    });
  });
});
