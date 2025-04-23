import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DriveController } from './drive.controller';
import { DriveService } from './drive.service';
import { CreateDriveDto } from './dto/create-drive.dto';
import { UpdateDriveDto } from './dto/update-drive.dto';

describe('DriveController', () => {
  let controller: DriveController;
  let mockDriveService: any;

  beforeEach(async () => {
    mockDriveService = {
      createDrive: jest.fn(),
      getDrives: jest.fn(),
      getDriveById: jest.fn(),
      updateDrive: jest.fn(),
      deleteDrive: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriveController],
      providers: [
        {
          provide: DriveService,
          useValue: mockDriveService,
        },
      ],
    }).compile();

    controller = module.get<DriveController>(DriveController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createDrive', () => {
    it('should create a drive', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dto: CreateDriveDto = {
        name: 'Test Drive',
        collegeId: 'college-id',
        collegeName: 'Test College',
        role: 'Associate Engineer',
        practice: 'Application Development',
        startDate: tomorrow,
        primarySpocId: 'spoc-id',
        primarySpocEmail: 'spoc@example.com',
        primarySpocName: 'Test SPOC',
      };

      const mockCreatedDrive = {
        driveId: 'drive-id',
        ...dto,
        isPinned: false,
        isCompleted: false,
        isActive: true,
      };

      mockDriveService.createDrive.mockResolvedValue(mockCreatedDrive);

      // Act
      const result = await controller.createDrive(dto);

      // Assert
      expect(mockDriveService.createDrive).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockCreatedDrive);
    });

    it('should propagate BadRequestException from service', async () => {
      // Arrange
      const dto: CreateDriveDto = {
        name: 'Test Drive',
        collegeId: 'invalid-college-id',
        collegeName: 'Test College',
        role: 'Associate Engineer',
        practice: 'Application Development',
        startDate: new Date(),
        primarySpocId: 'spoc-id',
        primarySpocEmail: 'spoc@example.com',
        primarySpocName: 'Test SPOC',
      };

      mockDriveService.createDrive.mockRejectedValue(new BadRequestException('Validation failed'));

      // Act & Assert
      await expect(controller.createDrive(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDrives', () => {
    it('should return paginated drives with no filters', async () => {
      // Arrange
      const page = '1';
      const limit = '10';
      const filters = {};
      const mockDrives = [
        { driveId: 'drive-id-1', name: 'Drive 1' },
        { driveId: 'drive-id-2', name: 'Drive 2' },
      ];
      const mockResponse = {
        drives: mockDrives,
        total: 2,
      };

      mockDriveService.getDrives.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getDrives(page, limit, {});

      // Assert
      expect(mockDriveService.getDrives).toHaveBeenCalledWith(1, 10, {});
      expect(result).toEqual({
        drives: mockDrives,
        total: 2,
        page: 1,
        limit: 10,
      });
    });

    it('should throw BadRequestException for invalid page or limit', async () => {
      // Arrange
      const page = 'invalid';
      const limit = '10';

      // Act & Assert
      await expect(controller.getDrives(page, limit, {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDriveById', () => {
    it('should return a drive by ID', async () => {
      // Arrange
      const driveId = 'drive-id';
      const mockDrive = { driveId, name: 'Test Drive' };

      mockDriveService.getDriveById.mockResolvedValue(mockDrive);

      // Act
      const result = await controller.getDriveById(driveId);

      // Assert
      expect(mockDriveService.getDriveById).toHaveBeenCalledWith(driveId);
      expect(result).toEqual(mockDrive);
    });

    it('should throw NotFoundException when drive not found', async () => {
      // Arrange
      const driveId = 'non-existent-id';

      mockDriveService.getDriveById.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.getDriveById(driveId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateDrive', () => {
    it('should update a drive by ID', async () => {
      // Arrange
      const driveId = 'drive-id';
      const dto: UpdateDriveDto = { name: 'Updated Drive' };
      const mockUpdatedDrive = {
        driveId,
        name: 'Updated Drive',
      };

      mockDriveService.updateDrive.mockResolvedValue(mockUpdatedDrive);

      // Act
      const result = await controller.updateDrive(driveId, dto);

      // Assert
      expect(mockDriveService.updateDrive).toHaveBeenCalledWith(driveId, dto);
      expect(result).toEqual(mockUpdatedDrive);
    });

    it('should throw NotFoundException when drive not found', async () => {
      // Arrange
      const driveId = 'non-existent-id';
      const dto: UpdateDriveDto = { name: 'Updated Drive' };

      mockDriveService.updateDrive.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.updateDrive(driveId, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteDrive', () => {
    it('should delete a drive by ID', async () => {
      // Arrange
      const driveId = 'drive-id';

      mockDriveService.deleteDrive.mockResolvedValue(true);

      // Act
      const result = await controller.deleteDrive(driveId);

      // Assert
      expect(mockDriveService.deleteDrive).toHaveBeenCalledWith(driveId);
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException when drive not found', async () => {
      // Arrange
      const driveId = 'non-existent-id';

      mockDriveService.deleteDrive.mockResolvedValue(false);

      // Act & Assert
      await expect(controller.deleteDrive(driveId)).rejects.toThrow(NotFoundException);
    });
  });
});
