import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PanelController } from './panel.controller';
import { PanelService } from './panel.service';
import { CreatePanelDto } from './dto/create-panel.dto';
import { UpdatePanelDto } from './dto/update-panel.dto';
import { Panel } from './panel.schema';

describe('PanelController', () => {
  let controller: PanelController;
  let mockPanelService: any;

  beforeEach(async () => {
    mockPanelService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PanelController],
      providers: [
        {
          provide: PanelService,
          useValue: mockPanelService,
        },
      ],
    }).compile();

    controller = module.get<PanelController>(PanelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a panel', async () => {
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

      const mockCreatedPanel = {
        panelId: 'panel-id',
        ...dto,
      };

      mockPanelService.create.mockResolvedValue(mockCreatedPanel);

      // Act
      const result = await controller.create(dto);

      // Assert
      expect(mockPanelService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockCreatedPanel);
    });

    it('should propagate BadRequestException from service', async () => {
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

      mockPanelService.create.mockRejectedValue(new BadRequestException('Primary panel member is already assigned'));

      // Act & Assert
      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
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
      ] as Panel[];

      mockPanelService.findAll.mockResolvedValue(mockPanels);

      // Act
      const result = await controller.findAll(page, limit);

      // Assert
      expect(mockPanelService.findAll).toHaveBeenCalledWith(page, limit, undefined);
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
      ] as Panel[];

      mockPanelService.findAll.mockResolvedValue(mockPanels);

      // Act
      const result = await controller.findAll(page, limit, primaryPanelMemberEmployeeId);

      // Assert
      expect(mockPanelService.findAll).toHaveBeenCalledWith(page, limit, primaryPanelMemberEmployeeId);
      expect(result).toEqual(mockPanels);
    });
  });

  describe('findOne', () => {
    it('should return a panel by ID', async () => {
      // Arrange
      const panelId = 'panel-id';
      const mockPanel = {
        panelId,
        name: 'Test Panel',
        primaryPanelMember: {
          employeeId: 'emp-id',
          emailId: 'panel@example.com',
          name: 'Test Panel Member',
        },
        additionalPanelMembers: [],
      } as unknown as Panel;

      mockPanelService.findOne.mockResolvedValue(mockPanel);

      // Act
      const result = await controller.findOne(panelId);

      // Assert
      expect(mockPanelService.findOne).toHaveBeenCalledWith(panelId);
      expect(result).toEqual(mockPanel);
    });

    it('should throw NotFoundException when panel not found', async () => {
      // Arrange
      const panelId = 'non-existent-id';

      mockPanelService.findOne.mockRejectedValue(new NotFoundException(`Panel with ID ${panelId} not found`));

      // Act & Assert
      await expect(controller.findOne(panelId)).rejects.toThrow(NotFoundException);
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

      const mockUpdatedPanel = {
        panelId,
        name: 'Updated Panel',
        primaryPanelMember: {
          employeeId: 'emp-id',
          emailId: 'panel@example.com',
          name: 'Test Panel Member',
        },
        additionalPanelMembers: [
          {
            employeeId: 'emp-id-3',
            emailId: 'panel3@example.com',
            name: 'Test Panel Member 3',
          },
        ],
      } as unknown as Panel;

      mockPanelService.update.mockResolvedValue(mockUpdatedPanel);

      // Act
      const result = await controller.update(panelId, dto);

      // Assert
      expect(mockPanelService.update).toHaveBeenCalledWith(panelId, dto);
      expect(result).toEqual(mockUpdatedPanel);
    });

    it('should throw NotFoundException when panel not found', async () => {
      // Arrange
      const panelId = 'non-existent-id';
      const dto: UpdatePanelDto = { name: 'Updated Panel' };

      mockPanelService.update.mockRejectedValue(new NotFoundException(`Panel with ID ${panelId} not found`));

      // Act & Assert
      await expect(controller.update(panelId, dto)).rejects.toThrow(NotFoundException);
    });
  });
});
