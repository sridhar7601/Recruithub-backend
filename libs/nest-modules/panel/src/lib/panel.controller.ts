import { Controller, Get, Post, Body, Put, Param, Query, BadRequestException } from '@nestjs/common';
import { PanelService } from './panel.service';
import { Panel } from './panel.schema';
import { CreatePanelDto } from './dto/create-panel.dto';
import { UpdatePanelDto } from './dto/update-panel.dto';

@Controller('panels')
export class PanelController {
  constructor(private readonly panelService: PanelService) {}

  @Post()
  async create(@Body() createPanelDto: CreatePanelDto): Promise<Panel> {
    return this.panelService.create(createPanelDto);
  }

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('primaryPanelMemberEmployeeId') primaryPanelMemberEmployeeId?: string
  ): Promise<Panel[]> {
    return this.panelService.findAll(page, limit, primaryPanelMemberEmployeeId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Panel> {
    const panel = await this.panelService.findOne(id);
    if (!panel) {
      throw new BadRequestException('Panel not found');
    }
    return panel;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updatePanelDto: UpdatePanelDto): Promise<Panel> {
    return this.panelService.update(id, updatePanelDto);
  }

  // Note: As per requirements, panels cannot be deleted, so no delete endpoint
}
