import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { mock, mockReset } from 'jest-mock-extended';
import { Model } from 'mongoose';
import { DriveService } from './drive.service';
import { Drive, DriveDocument } from './drive.schema';
import { CreateDriveDto } from './dto/create-drive.dto';
import { UpdateDriveDto } from './dto/update-drive.dto';
import { CollegeService } from '../../../college/src/lib/college.service';

describe('DriveService', () => {
  let service: DriveService;
  let mockDriveModel: any;
  let mockCollegeService: any;

  beforeEach(async () => {
    mockDriveModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
      constructor: jest.fn(),
    };

    mockCollegeService = {
      getCollege: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriveService,
        {
          provide: getModelToken(Drive.name),
          useValue: mockDriveModel,
        },
        {
          provide: CollegeService,
          useValue: mockCollegeService,
        },
      ],
    }).compile();

    service = module.get<DriveService>(DriveService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDrive', () => {
    it('should create a drive when validation passes', async () => {
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

      const mockCollege = {
        collegeId: 'college-id',
        name: 'Test College',
      };

      mockCollegeService.getCollege.mockResolvedValue(mockCollege);

      const mockSavedDrive = {
        driveId: 'drive-id',
        ...dto,
        isPinned: false,
        isCompleted: false,
        isActive: true,
      };

      const mockDrive = {
        save: jest.fn().mockResolvedValue(mockSavedDrive),
      };

      mockDriveModel.constructor.mockImplementation(() => mockDrive);

      // Act
      const result = await service.createDrive(dto);

      // Assert
      expect(mockCollegeService.getCollege).toHaveBeenCalledWith(dto.collegeId);
      expect(mockDriveModel.constructor).toHaveBeenCalledWith(dto);
      expect(mockDrive.save).toHaveBeenCalled();
      expect(result).toEqual(mockSavedDrive);
    });

    it('should throw BadRequestException when college does not exist', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dto: CreateDriveDto = {
        name: 'Test Drive',
        collegeId: 'non-existent-college-id',
        collegeName: 'Test College',
        role: 'Associate Engineer',
        practice: 'Application Development',
        startDate: tomorrow,
        primarySpocId: 'spoc-id',
        primarySpocEmail: 'spoc@example.com',
        primarySpocName: 'Test SPOC',
      };

      mockCollegeService.getCollege.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createDrive(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when college name does not match', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dto: CreateDriveDto = {
        name: 'Test Drive',
        collegeId: 'college-id',
        collegeName: 'Wrong College Name',
        role: 'Associate Engineer',
        practice: 'Application Development',
        startDate: tomorrow,
        primarySpocId: 'spoc-id',
        primarySpocEmail: 'spoc@example.com',
        primarySpocName: 'Test SPOC',
      };

      const mockCollege = {
        collegeId: 'college-id',
        name: 'Test College',
      };

      mockCollegeService.getCollege.mockResolvedValue(mockCollege);

      // Act & Assert
      await expect(service.createDrive(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when start date is not in the future', async () => {
      // Arrange
      const today = new Date();

      const dto: CreateDriveDto = {
        name: 'Test Drive',
        collegeId: 'college-id',
        collegeName: 'Test College',
        role: 'Associate Engineer',
        practice: 'Application Development',
        startDate: today,
        primarySpocId: 'spoc-id',
        primarySpocEmail: 'spoc@example.com',
        primarySpocName: 'Test SPOC',
      };

      const mockCollege = {
        collegeId: 'college-id',
        name: 'Test College',
      };

      mockCollegeService.getCollege.mockResolvedValue(mockCollege);

      // Act & Assert
      await expect(service.createDrive(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDrives', () => {
    it('should return paginated drives with no filters', async () => {
      // Arrange
      const page = 1;
      const limit = 10;
      const filters = {};
      const mockDrives = [
        { driveId: 'drive-id-1', name: 'Drive 1' },
        { driveId: 'drive-id-2', name: 'Drive 2' },
      ];
      const total = 2;

      mockDriveModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDrives),
      });

      mockDriveModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(total),
      });

      // Act
      const result = await service.getDrives(page, limit, filters);

      // Assert
      expect(mockDriveModel.find).toHaveBeenCalledWith(filters);
      expect(mockDriveModel.countDocuments).toHaveBeenCalledWith(filters);
      expect(result).toEqual({
        drives: mockDrives,
        total,
      });
    });

    it('should return paginated drives with filters', async () => {
      // Arrange
      const page = 1;
      const limit = 10;
      const filters = { collegeId: 'college-id' };
      const mockDrives = [
        { driveId: 'drive-id-1', name: 'Drive 1', collegeId: 'college-id' },
      ];
      const total = 1;

      mockDriveModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDrives),
      });

      mockDriveModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(total),
      });

      // Act
      const result = await service.getDrives(page, limit, filters);

      // Assert
      expect(mockDriveModel.find).toHaveBeenCalledWith(filters);
      expect(mockDriveModel.countDocuments).toHaveBeenCalledWith(filters);
      expect(result).toEqual({
        drives: mockDrives,
        total,
      });
    });
  });

  describe('getDriveById', () => {
    it('should return a drive by ID', async () => {
      // Arrange
      const driveId = 'drive-id';
      const mockDrive = { driveId, name: 'Test Drive' };

      mockDriveModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDrive),
      });

      // Act
      const result = await service.getDriveById(driveId);

      // Assert
      expect(mockDriveModel.findOne).toHaveBeenCalledWith({ driveId });
      expect(result).toEqual(mockDrive);
    });

    it('should return null if drive not found', async () => {
      // Arrange
      const driveId = 'non-existent-id';

      mockDriveModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act
      const result = await service.getDriveById(driveId);

      // Assert
      expect(mockDriveModel.findOne).toHaveBeenCalledWith({ driveId });
      expect(result).toBeNull();
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

      mockDriveModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedDrive),
      });

      // Act
      const result = await service.updateDrive(driveId, dto);

      // Assert
      expect(mockDriveModel.findOneAndUpdate).toHaveBeenCalledWith(
        { driveId },
        dto,
        { new: true }
      );
      expect(result).toEqual(mockUpdatedDrive);
    });

    it('should return null if drive not found', async () => {
      // Arrange
      const driveId = 'non-existent-id';
      const dto: UpdateDriveDto = { name: 'Updated Drive' };

      mockDriveModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act
      const result = await service.updateDrive(driveId, dto);

      // Assert
      expect(mockDriveModel.findOneAndUpdate).toHaveBeenCalledWith(
        { driveId },
        dto,
        { new: true }
      );
      expect(result).toBeNull();
    });
  });

  describe('deleteDrive', () => {
    it('should soft delete a drive by ID', async () => {
      // Arrange
      const driveId = 'drive-id';
      const mockUpdatedDrive = {
        driveId,
        isActive: false,
      };

      mockDriveModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedDrive),
      });

      // Act
      const result = await service.deleteDrive(driveId);

      // Assert
      expect(mockDriveModel.findOneAndUpdate).toHaveBeenCalledWith(
        { driveId },
        { isActive: false }
      );
      expect(result).toBe(true);
    });

    it('should return false if drive not found', async () => {
      // Arrange
      const driveId = 'non-existent-id';

      mockDriveModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act
      const result = await service.deleteDrive(driveId);

      // Assert
      expect(mockDriveModel.findOneAndUpdate).toHaveBeenCalledWith(
        { driveId },
        { isActive: false }
      );
      expect(result).toBe(false);
    });
  });
});
