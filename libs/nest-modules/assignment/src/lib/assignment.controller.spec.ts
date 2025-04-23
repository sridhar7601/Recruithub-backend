import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { Assignment } from './assignment.schema';

describe('AssignmentController', () => {
  let controller: AssignmentController;
  let mockAssignmentService: any;

  beforeEach(async () => {
    mockAssignmentService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentController],
      providers: [
        {
          provide: AssignmentService,
          useValue: mockAssignmentService,
        },
      ],
    }).compile();

    controller = module.get<AssignmentController>(AssignmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an assignment', async () => {
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

      const mockCreatedAssignment = {
        assignmentId: 'assignment-id',
        ...dto,
        isActive: true,
      };

      mockAssignmentService.create.mockResolvedValue(mockCreatedAssignment);

      // Act
      const result = await controller.create(dto);

      // Assert
      expect(mockAssignmentService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockCreatedAssignment);
    });

    it('should propagate BadRequestException from service', async () => {
      // Arrange
      const dto: CreateAssignmentDto = {
        studentId: 'student-id',
        studentName: 'Test Student',
        registrationNumber: 'REG123',
        emailId: 'student@example.com',
        collegeId: 'invalid-college-id',
        collegeName: 'Test College',
        driveId: 'invalid-drive-id',
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

      mockAssignmentService.create.mockRejectedValue(new BadRequestException('Validation failed'));

      // Act & Assert
      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated assignments with no filters', async () => {
      // Arrange
      const page = 1;
      const limit = 10;
      const mockAssignments = [
        { assignmentId: 'assignment-id-1', studentName: 'Student 1' },
        { assignmentId: 'assignment-id-2', studentName: 'Student 2' },
      ] as Assignment[];
      const mockResponse = {
        assignments: mockAssignments,
        total: 2,
        page,
        limit,
      };

      mockAssignmentService.findAll.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.findAll(page, limit);

      // Assert
      expect(mockAssignmentService.findAll).toHaveBeenCalledWith(page, limit, {});
      expect(result).toEqual(mockResponse);
    });

    it('should return paginated assignments with filters', async () => {
      // Arrange
      const page = 1;
      const limit = 10;
      const studentId = 'student-id';
      const panelId = 'panel-id';
      const roundNumber = 1;
      const driveId = 'drive-id';
      const mockAssignments = [
        {
          assignmentId: 'assignment-id-1',
          studentName: 'Student 1',
          studentId,
          panelId,
          roundNumber,
          driveId,
        },
      ] as Assignment[];
      const mockResponse = {
        assignments: mockAssignments,
        total: 1,
        page,
        limit,
      };

      mockAssignmentService.findAll.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.findAll(page, limit, studentId, panelId, roundNumber, driveId);

      // Assert
      expect(mockAssignmentService.findAll).toHaveBeenCalledWith(page, limit, {
        studentId,
        panelId,
        roundNumber,
        driveId,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findOne', () => {
    it('should return an assignment by ID', async () => {
      // Arrange
      const assignmentId = 'assignment-id';
      const mockAssignment = { assignmentId, studentName: 'Test Student' } as Assignment;

      mockAssignmentService.findOne.mockResolvedValue(mockAssignment);

      // Act
      const result = await controller.findOne(assignmentId);

      // Assert
      expect(mockAssignmentService.findOne).toHaveBeenCalledWith(assignmentId);
      expect(result).toEqual(mockAssignment);
    });

    it('should throw BadRequestException when assignment not found', async () => {
      // Arrange
      const assignmentId = 'non-existent-id';

      mockAssignmentService.findOne.mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(controller.findOne(assignmentId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update an assignment by ID', async () => {
      // Arrange
      const assignmentId = 'assignment-id';
      const dto: UpdateAssignmentDto = { additionalPanelMembers: [] };
      const mockUpdatedAssignment = {
        assignmentId,
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
        isActive: true,
      } as unknown as Assignment;

      mockAssignmentService.update.mockResolvedValue(mockUpdatedAssignment);

      // Act
      const result = await controller.update(assignmentId, dto);

      // Assert
      expect(mockAssignmentService.update).toHaveBeenCalledWith(assignmentId, dto);
      expect(result).toEqual(mockUpdatedAssignment);
    });

    it('should throw BadRequestException when assignment not found', async () => {
      // Arrange
      const assignmentId = 'non-existent-id';
      const dto: UpdateAssignmentDto = { additionalPanelMembers: [] };

      mockAssignmentService.update.mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(controller.update(assignmentId, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove an assignment by ID', async () => {
      // Arrange
      const assignmentId = 'assignment-id';

      mockAssignmentService.remove.mockResolvedValue(undefined);

      // Act
      const result = await controller.remove(assignmentId);

      // Assert
      expect(mockAssignmentService.remove).toHaveBeenCalledWith(assignmentId);
      expect(result).toEqual({ message: 'Assignment removed successfully' });
    });

    it('should throw BadRequestException when assignment not found', async () => {
      // Arrange
      const assignmentId = 'non-existent-id';

      mockAssignmentService.remove.mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(controller.remove(assignmentId)).rejects.toThrow(BadRequestException);
    });
  });
});
