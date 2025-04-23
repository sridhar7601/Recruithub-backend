import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PanelService } from './panel.service';
import { Panel } from './panel.schema';
import { CreatePanelDto } from './dto/create-panel.dto';
import { UpdatePanelDto } from './dto/update-panel.dto';

describe('PanelService', () => {
  let service: PanelService;
  let mockPanelModel: any;

  beforeEach(async () => {
    // Create a mock constructor function that can be called with 'new'
    const mockPanelDocument = {
      save: jest.fn(),
    };
    
    mockPanelModel = jest.fn().mockImplementation(() => mockPanelDocument);
    
    // Add the model methods to the constructor function
    mockPanelModel.find = jest.fn().mockReturnThis();
    mockPanelModel.findOne = jest.fn().mockReturnThis();
    mockPanelModel.countDocuments = jest.fn().mockReturnThis();
    mockPanelModel.skip = jest.fn().mockReturnThis();
    mockPanelModel.limit = jest.fn().mockReturnThis();
    mockPanelModel.exec = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PanelService,
        {
          provide: getModelToken(Panel.name),
          useValue: mockPanelModel,
        },
      ],
    }).compile();

    service = module.get<PanelService>(PanelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a panel when validation passes', async () => {
      // Arrange
      const dto: CreatePanelDto = {
        primaryPanelMember: {
          employeeId: 'emp-id',
          emailId: 'panel@example.com',
          name: 'Test Panel Member',
        },
        additionalPanelMembers: [
          {
            employeeId: 'emp-id-2',
            emailId: 'panel2@example.com',
            name: 'Test Panel Member 2',
          },
        ],
        name: 'Test Panel',
      };

      // Mock findOne to return null (no existing panel)
      mockPanelModel.exec.mockResolvedValueOnce(null);

      const mockSavedPanel = {
        panelId: 'panel-id',
        ...dto,
      };

      // Set up the mock document's save method to return our mock panel
      const mockPanelInstance = mockPanelModel.mock.results[0].value;
      mockPanelInstance.save.mockResolvedValueOnce(mockSavedPanel);

      // Act
      const result = await service.create(dto);

      // Assert
      expect(mockPanelModel.findOne).toHaveBeenCalledWith({
        'primaryPanelMember.employeeId': dto.primaryPanelMember.employeeId,
      });
      expect(mockPanelModel).toHaveBeenCalledWith(dto);
      expect(mockPanelInstance.save).toHaveBeenCalled();
      expect(result).toEqual(mockSavedPanel);
    });

    it('should throw BadRequestException when primary panel member is already assigned', async () => {
      // Arrange
      const dto: CreatePanelDto = {
        primaryPanelMember: {
          employeeId: 'emp-id',
          emailId: 'panel@example.com',
          name: 'Test Panel Member',
        },
        additionalPanelMembers: [],
        name: 'Test Panel',
      };

      const existingPanel = {
        panelId: 'existing-panel-id',
        primaryPanelMember: {
          employeeId: 'emp-id',
          emailId: 'panel@example.com',
          name: 'Test Panel Member',
        },
      };

      // Mock findOne to return an existing panel
      mockPanelModel.exec.mockResolvedValueOnce(existingPanel);

      // Act & Assert
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated panels with no filters', async () => {
      // Arrange
      const page = 1;
      const limit = 10;
      const mockPanels = [
        { panelId: 'panel-id-1', name: 'Panel 1' },
        { panelId: 'panel-id-2', name: 'Panel 2' },
      ];

      mockPanelModel.exec.mockResolvedValueOnce(mockPanels);

      // Act
      const result = await service.findAll(page, limit);

      // Assert
      expect(mockPanelModel.find).toHaveBeenCalledWith({});
      expect(mockPanelModel.skip).toHaveBeenCalledWith((page - 1) * limit);
      expect(mockPanelModel.limit).toHaveBeenCalledWith(limit);
      expect(result).toEqual(mockPanels);
    });

    it('should return panels filtered by primaryPanelMemberEmployeeId', async () => {
      // Arrange
      const page = 1;
      const limit = 10;
      const primaryPanelMemberEmployeeId = 'emp-id';
      const mockPanels = [
        {
          panelId: 'panel-id-1',
          name: 'Panel 1',
          primaryPanelMember: {
            employeeId: primaryPanelMemberEmployeeId,
          },
        },
      ];

      mockPanelModel.exec.mockResolvedValueOnce(mockPanels);

      // Act
      const result = await service.findAll(page, limit, primaryPanelMemberEmployeeId);

      // Assert
      expect(mockPanelModel.find).toHaveBeenCalledWith({
        'primaryPanelMember.employeeId': primaryPanelMemberEmployeeId,
      });
      expect(result).toEqual(mockPanels);
    });
  });

  describe('findOne', () => {
    it('should return a panel by ID', async () => {
      // Arrange
      const panelId = 'panel-id';
      const mockPanel = { panelId, name: 'Test Panel' };

      mockPanelModel.exec.mockResolvedValueOnce(mockPanel);

      // Act
      const result = await service.findOne(panelId);

      // Assert
      expect(mockPanelModel.findOne).toHaveBeenCalledWith({ panelId });
      expect(result).toEqual(mockPanel);
    });

    it('should throw NotFoundException when panel not found', async () => {
      // Arrange
      const panelId = 'non-existent-id';

      mockPanelModel.exec.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.findOne(panelId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a panel by ID', async () => {
      // Arrange
      const panelId = 'panel-id';
      const dto: UpdatePanelDto = {
        name: 'Updated Panel',
        additionalPanelMembers: [
          {
            employeeId: 'emp-id-3',
            emailId: 'panel3@example.com',
            name: 'Test Panel Member 3',
          },
        ],
      };

      const mockPanel = {
        panelId,
        name: 'Test Panel',
        additionalPanelMembers: [],
        save: jest.fn(),
      };

      mockPanelModel.exec.mockResolvedValueOnce(mockPanel);
      mockPanel.save.mockResolvedValueOnce({
        ...mockPanel,
        name: dto.name,
        additionalPanelMembers: dto.additionalPanelMembers,
      });

      // Act
      const result = await service.update(panelId, dto);

      // Assert
      expect(mockPanelModel.findOne).toHaveBeenCalledWith({ panelId });
      expect(mockPanel.additionalPanelMembers).toEqual(dto.additionalPanelMembers);
      expect(mockPanel.name).toEqual(dto.name);
      expect(mockPanel.save).toHaveBeenCalled();
      expect(result).toEqual({
        ...mockPanel,
        name: dto.name,
        additionalPanelMembers: dto.additionalPanelMembers,
      });
    });

    it('should throw NotFoundException when panel not found', async () => {
      // Arrange
      const panelId = 'non-existent-id';
      const dto: UpdatePanelDto = { name: 'Updated Panel' };

      mockPanelModel.exec.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.update(panelId, dto)).rejects.toThrow(NotFoundException);
    });
  });
});