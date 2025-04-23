import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Panel, PanelDocument, PanelMember } from './panel.schema';
import { CreatePanelDto } from './dto/create-panel.dto';
import { UpdatePanelDto } from './dto/update-panel.dto';

@Injectable()
export class PanelService {
  private readonly logger = new Logger(PanelService.name);

  constructor(
    @InjectModel(Panel.name) private panelModel: Model<PanelDocument>
  ) {}

  async create(createPanelDto: CreatePanelDto): Promise<Panel> {
    const existingPanel = await this.panelModel.findOne({
      'primaryPanelMember.employeeId': createPanelDto.primaryPanelMember.employeeId
    }).exec();

    if (existingPanel) {
      throw new BadRequestException('Primary panel member is already assigned to another panel');
    }

    const createdPanel = new this.panelModel(createPanelDto);
    return createdPanel.save();
  }

  async findAll(page: number = 1, limit: number = 10, primaryPanelMemberEmployeeId?: string): Promise<Panel[]> {
    const query = primaryPanelMemberEmployeeId
      ? { 'primaryPanelMember.employeeId': primaryPanelMemberEmployeeId }
      : {};

    return this.panelModel
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  async findOne(panelId: string): Promise<Panel> {
    this.logger.debug(`Searching for panel with panelId: ${panelId}`);
    const panel = await this.panelModel.findOne({ panelId }).exec();
    if (panel) {
      this.logger.debug(`Found panel: ${JSON.stringify(panel)}`);
    } else {
      this.logger.debug(`No panel found with panelId: ${panelId}`);
      throw new NotFoundException(`Panel with ID ${panelId} not found`);
    }
    return panel;
  }

  async update(panelId: string, updatePanelDto: UpdatePanelDto): Promise<Panel> {
    const panel = await this.panelModel.findOne({ panelId }).exec();
    if (!panel) {
      throw new NotFoundException(`Panel with ID ${panelId} not found`);
    }

    if (updatePanelDto.additionalPanelMembers) {
      panel.additionalPanelMembers = updatePanelDto.additionalPanelMembers.map(member => {
        return {
          employeeId: member.employeeId || '',
          emailId: member.emailId || '',
          name: member.name || ''
        } as PanelMember;
      });
    }

    if (updatePanelDto.name) {
      panel.name = updatePanelDto.name;
    }

    return panel.save();
  }

  // Note: As per requirements, panels cannot be deleted
}
