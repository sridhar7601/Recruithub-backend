import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CollegeController } from './college.controller';
import { CollegeService } from './college.service';
import { CreateCollegeDto, UpdateCollegeDto, CollegeResponseDto, PaginatedCollegeResponseDto } from './dto';

describe('CollegeController', () => {
  let controller: CollegeController;
  let mockCollegeService: any;

  beforeEach(async () => {
    mockCollegeService = {
      createCollege: jest.fn(),
      getColleges: jest.fn(),
      getCollege: jest.fn(),
      updateCollege: jest.fn(),
      deleteCollege: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollegeController],
      providers: [
        {
          provide: CollegeService,
          useValue: mockCollegeService,
        },
      ],
    }).compile();

    controller = module.get<CollegeController>(CollegeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCollege', () => {
    it('should create a college', async () => {
      // Arrange
      const dto: CreateCollegeDto = {
        name: 'Test College',
        city: 'Test City',
      };

      const mockCreatedCollege: CollegeResponseDto = {
        collegeId: 'college-id',
        name: 'Test College',
        city: 'Test City',
        isDeleted: false,
        createdTimestamp: new Date(),
        updatedTimestamp: new Date(),
      };

      mockCollegeService.createCollege.mockResolvedValue(mockCreatedCollege);

      // Act
      const result = await controller.createCollege(dto);

      // Assert
      expect(mockCollegeService.createCollege).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockCreatedCollege);
    });

    it('should propagate errors from service', async () => {
      // Arrange
      const dto: CreateCollegeDto = {
        name: 'Test College',
        city: 'Test City',
      };

      mockCollegeService.createCollege.mockRejectedValue(new BadRequestException('Validation failed'));

      // Act & Assert
      await expect(controller.createCollege(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getColleges', () => {
    it('should return paginated colleges with default pagination', async () => {
      // Arrange
      const page = 1;
      const limit = 10;
      const mockColleges = [
        { 
          collegeId: 'college-id-1', 
          name: 'College 1', 
          city: 'City 1', 
          isDeleted: false,
          createdTimestamp: new Date(),
          updatedTimestamp: new Date()
        },
        { 
          collegeId: 'college-id-2', 
          name: 'College 2', 
          city: 'City 2', 
          isDeleted: false,
          createdTimestamp: new Date(),
          updatedTimestamp: new Date()
        },
      ] as CollegeResponseDto[];
      const mockResponse: PaginatedCollegeResponseDto = {
        items: mockColleges,
        meta: {
          totalItems: 2,
          itemsPerPage: limit,
          currentPage: page,
          totalPages: 1,
        },
      };

      mockCollegeService.getColleges.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getColleges();

      // Assert
      expect(mockCollegeService.getColleges).toHaveBeenCalledWith(page, limit, { city: undefined });
      expect(result).toEqual(mockResponse);
    });

    it('should return paginated colleges with custom pagination and filters', async () => {
      // Arrange
      const page = 2;
      const limit = 5;
      const city = 'Test City';
      const mockColleges = [
        { 
          collegeId: 'college-id-3', 
          name: 'College 3', 
          city, 
          isDeleted: false,
          createdTimestamp: new Date(),
          updatedTimestamp: new Date()
        },
        { 
          collegeId: 'college-id-4', 
          name: 'College 4', 
          city, 
          isDeleted: false,
          createdTimestamp: new Date(),
          updatedTimestamp: new Date()
        },
      ] as CollegeResponseDto[];
      const mockResponse: PaginatedCollegeResponseDto = {
        items: mockColleges,
        meta: {
          totalItems: 2,
          itemsPerPage: limit,
          currentPage: page,
          totalPages: 1,
        },
      };

      mockCollegeService.getColleges.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getColleges(page, limit, city);

      // Assert
      expect(mockCollegeService.getColleges).toHaveBeenCalledWith(page, limit, { city });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCollege', () => {
    it('should return a college by ID', async () => {
      // Arrange
      const collegeId = 'college-id';
      const mockCollege: CollegeResponseDto = {
        collegeId,
        name: 'Test College',
        city: 'Test City',
        isDeleted: false,
        createdTimestamp: new Date(),
        updatedTimestamp: new Date(),
      };

      mockCollegeService.getCollege.mockResolvedValue(mockCollege);

      // Act
      const result = await controller.getCollege(collegeId);

      // Assert
      expect(mockCollegeService.getCollege).toHaveBeenCalledWith(collegeId);
      expect(result).toEqual(mockCollege);
    });

    it('should throw NotFoundException when college not found', async () => {
      // Arrange
      const collegeId = 'non-existent-id';

      mockCollegeService.getCollege.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.getCollege(collegeId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCollege', () => {
    it('should update a college by ID', async () => {
      // Arrange
      const collegeId = 'college-id';
      const dto: UpdateCollegeDto = {
        name: 'Updated College Name',
        city: 'Updated City',
      };
      const mockUpdatedCollege: CollegeResponseDto = {
        collegeId,
        name: 'Updated College Name',
        city: 'Updated City',
        isDeleted: false,
        createdTimestamp: new Date(),
        updatedTimestamp: new Date(),
      };

      mockCollegeService.updateCollege.mockResolvedValue(mockUpdatedCollege);

      // Act
      const result = await controller.updateCollege(collegeId, dto);

      // Assert
      expect(mockCollegeService.updateCollege).toHaveBeenCalledWith(collegeId, dto);
      expect(result).toEqual(mockUpdatedCollege);
    });

    it('should throw NotFoundException when college not found', async () => {
      // Arrange
      const collegeId = 'non-existent-id';
      const dto: UpdateCollegeDto = { name: 'Updated College Name' };

      mockCollegeService.updateCollege.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.updateCollege(collegeId, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteCollege', () => {
    it('should delete a college by ID', async () => {
      // Arrange
      const collegeId = 'college-id';

      mockCollegeService.deleteCollege.mockResolvedValue(true);

      // Act
      await controller.deleteCollege(collegeId);

      // Assert
      expect(mockCollegeService.deleteCollege).toHaveBeenCalledWith(collegeId);
    });

    it('should throw NotFoundException when college not found', async () => {
      // Arrange
      const collegeId = 'non-existent-id';

      mockCollegeService.deleteCollege.mockResolvedValue(false);

      // Act & Assert
      await expect(controller.deleteCollege(collegeId)).rejects.toThrow(NotFoundException);
    });
  });
});
