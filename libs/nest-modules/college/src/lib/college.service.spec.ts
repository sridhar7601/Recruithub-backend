import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CollegeService } from './college.service';
import { College } from './college.schema';
import { CreateCollegeDto, UpdateCollegeDto } from './dto';

describe('CollegeService', () => {
  let service: CollegeService;
  let mockCollegeModel: any;
  
  beforeEach(async () => {
    // Create a mock model with all required methods
    const mockCollege = {
      save: jest.fn().mockResolvedValue({
        toJSON: () => ({
          collegeId: 'test-id',
          name: 'Test College',
          city: 'Test City',
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      }),
    };
    
    // Create a proper constructor function mock
    mockCollegeModel = jest.fn().mockImplementation(() => mockCollege);
    mockCollegeModel.find = jest.fn();
    mockCollegeModel.findOne = jest.fn();
    mockCollegeModel.findOneAndUpdate = jest.fn();
    mockCollegeModel.countDocuments = jest.fn();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollegeService,
        {
          provide: getModelToken(College.name),
          useValue: mockCollegeModel,
        },
      ],
    }).compile();

    service = module.get<CollegeService>(CollegeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCollege', () => {
    it('should create a new college', async () => {
      // Arrange
      const dto: CreateCollegeDto = { name: 'Test College', city: 'Test City' };
      
      // Act
      const result = await service.createCollege(dto);

      // Assert
      expect(mockCollegeModel).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        collegeId: 'test-id',
        name: dto.name,
        city: dto.city,
        isDeleted: false,
        createdTimestamp: expect.any(Date),
        updatedTimestamp: expect.any(Date),
      });
    });
  });

  describe('getColleges', () => {
    it('should return paginated colleges with no filters', async () => {
      // Arrange
      const page = 1;
      const limit = 10;
      const filters = {};
      const mockColleges = [
        {
          toJSON: () => ({
            collegeId: 'test-id-1',
            name: 'Test College 1',
            city: 'Test City 1',
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        {
          toJSON: () => ({
            collegeId: 'test-id-2',
            name: 'Test College 2',
            city: 'Test City 2',
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      ];
      
      mockCollegeModel.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockColleges),
          }),
        }),
      } as any);
      
      mockCollegeModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(2),
      } as any);

      // Act
      const result = await service.getColleges(page, limit, filters);

      // Assert
      expect(mockCollegeModel.find).toHaveBeenCalledWith({ isDeleted: false });
      expect(mockCollegeModel.countDocuments).toHaveBeenCalledWith({ isDeleted: false });
      expect(result).toEqual({
        items: [
          {
            collegeId: 'test-id-1',
            name: 'Test College 1',
            city: 'Test City 1',
            isDeleted: false,
            createdTimestamp: expect.any(Date),
            updatedTimestamp: expect.any(Date),
          },
          {
            collegeId: 'test-id-2',
            name: 'Test College 2',
            city: 'Test City 2',
            isDeleted: false,
            createdTimestamp: expect.any(Date),
            updatedTimestamp: expect.any(Date),
          },
        ],
        meta: {
          totalItems: 2,
          itemsPerPage: 10,
          currentPage: 1,
          totalPages: 1,
        },
      });
    });

    it('should return paginated colleges with city filter', async () => {
      // Arrange
      const page = 1;
      const limit = 10;
      const filters = { city: 'Test City 1' };
      const mockColleges = [
        {
          toJSON: () => ({
            collegeId: 'test-id-1',
            name: 'Test College 1',
            city: 'Test City 1',
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      ];
      
      mockCollegeModel.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockColleges),
          }),
        }),
      } as any);
      
      mockCollegeModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      } as any);

      // Act
      const result = await service.getColleges(page, limit, filters);

      // Assert
      expect(mockCollegeModel.find).toHaveBeenCalledWith({ isDeleted: false, city: 'Test City 1' });
      expect(mockCollegeModel.countDocuments).toHaveBeenCalledWith({ isDeleted: false, city: 'Test City 1' });
      expect(result.items.length).toBe(1);
      expect(result.items[0].city).toBe('Test City 1');
      expect(result.meta.totalItems).toBe(1);
    });
  });

  describe('getCollege', () => {
    it('should return a college by ID', async () => {
      // Arrange
      const collegeId = 'test-id';
      const mockCollege = {
        toJSON: () => ({
          collegeId,
          name: 'Test College',
          city: 'Test City',
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };
      
      mockCollegeModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCollege),
      } as any);

      // Act
      const result = await service.getCollege(collegeId);

      // Assert
      expect(mockCollegeModel.findOne).toHaveBeenCalledWith({ collegeId, isDeleted: false });
      expect(result).toEqual({
        collegeId,
        name: 'Test College',
        city: 'Test City',
        isDeleted: false,
        createdTimestamp: expect.any(Date),
        updatedTimestamp: expect.any(Date),
      });
    });

    it('should return null if college not found', async () => {
      // Arrange
      const collegeId = 'non-existent-id';
      
      mockCollegeModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      // Act
      const result = await service.getCollege(collegeId);

      // Assert
      expect(mockCollegeModel.findOne).toHaveBeenCalledWith({ collegeId, isDeleted: false });
      expect(result).toBeNull();
    });
  });

  describe('updateCollege', () => {
    it('should update a college by ID', async () => {
      // Arrange
      const collegeId = 'test-id';
      const dto: UpdateCollegeDto = { name: 'Updated College' };
      const mockCollege = {
        toJSON: () => ({
          collegeId,
          name: 'Updated College',
          city: 'Test City',
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };
      
      mockCollegeModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCollege),
      } as any);

      // Act
      const result = await service.updateCollege(collegeId, dto);

      // Assert
      expect(mockCollegeModel.findOneAndUpdate).toHaveBeenCalledWith(
        { collegeId, isDeleted: false },
        { $set: dto },
        { new: true }
      );
      expect(result).toEqual({
        collegeId,
        name: 'Updated College',
        city: 'Test City',
        isDeleted: false,
        createdTimestamp: expect.any(Date),
        updatedTimestamp: expect.any(Date),
      });
    });

    it('should return null if college not found', async () => {
      // Arrange
      const collegeId = 'non-existent-id';
      const dto: UpdateCollegeDto = { name: 'Updated College' };
      
      mockCollegeModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      // Act
      const result = await service.updateCollege(collegeId, dto);

      // Assert
      expect(mockCollegeModel.findOneAndUpdate).toHaveBeenCalledWith(
        { collegeId, isDeleted: false },
        { $set: dto },
        { new: true }
      );
      expect(result).toBeNull();
    });
  });

  describe('deleteCollege', () => {
    it('should soft delete a college by ID', async () => {
      // Arrange
      const collegeId = 'test-id';
      const mockCollege = { collegeId, name: 'Test College' };
      
      mockCollegeModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCollege),
      } as any);

      // Act
      const result = await service.deleteCollege(collegeId);

      // Assert
      expect(mockCollegeModel.findOneAndUpdate).toHaveBeenCalledWith(
        { collegeId, isDeleted: false },
        { $set: { isDeleted: true } }
      );
      expect(result).toBe(true);
    });

    it('should return false if college not found', async () => {
      // Arrange
      const collegeId = 'non-existent-id';
      
      mockCollegeModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      // Act
      const result = await service.deleteCollege(collegeId);

      // Assert
      expect(mockCollegeModel.findOneAndUpdate).toHaveBeenCalledWith(
        { collegeId, isDeleted: false },
        { $set: { isDeleted: true } }
      );
      expect(result).toBe(false);
    });
  });

  describe('getAllCollege', () => {
    it('should return all non-deleted colleges', async () => {
      // Arrange
      const mockColleges = [
        { collegeId: 'test-id-1', name: 'Test College 1' },
        { collegeId: 'test-id-2', name: 'Test College 2' },
      ];
      
      mockCollegeModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockColleges),
      } as any);

      // Act
      const result = await service.getAllCollege();

      // Assert
      expect(mockCollegeModel.find).toHaveBeenCalledWith({ isDeleted: false });
      expect(result).toEqual(mockColleges);
    });
  });
});
