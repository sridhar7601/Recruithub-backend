import { Controller, Get, Post, Put, Delete, Body, Param, Query, NotFoundException, BadRequestException, ParseBoolPipe, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { DriveService } from './drive.service';
import { DriveDocument } from './drive.schema';
import { CreateDriveDto } from './dto/create-drive.dto';
import { UpdateDriveDto } from './dto/update-drive.dto';
import { UpdateDriveWecpTestsDto } from './dto/update-drive-wecp-tests.dto';
import { CreateRoundDto, UpdateRoundDto } from './dto/round.dto';

@Controller('drives')
export class DriveController {
  constructor(private readonly driveService: DriveService) {}

  @Post()
  async createDrive(@Body() createDriveDto: CreateDriveDto): Promise<DriveDocument> {
   
    return this.driveService.createDrive(createDriveDto);
  }

  @Get()
  async getDrives(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query() filters: Record<string, unknown>
  ): Promise<{ drives: DriveDocument[]; total: number; page: number; limit: number }> {
    const parsedPage = page ? parseInt(page, 10) : 1;
    const parsedLimit = limit ? parseInt(limit, 10) : 10;

    if (isNaN(parsedPage) || isNaN(parsedLimit) || parsedPage < 1 || parsedLimit < 1) {
      throw new BadRequestException('Invalid page or limit parameter');
    }

    const { drives, total } = await this.driveService.getDrives(parsedPage, parsedLimit, filters as any);
    return { drives, total, page: parsedPage, limit: parsedLimit };
  }

  @Get(':driveId')
  async getDriveById(
    @Param('driveId') driveId: string,
    @Query('includeRounds', new DefaultValuePipe(true), ParseBoolPipe) includeRounds: boolean
  ): Promise<DriveDocument> {
    const drive = await this.driveService.getDriveById(driveId, includeRounds);
    if (!drive) {
      throw new NotFoundException(`Drive with ID ${driveId} not found`);
    }
    return drive;
  }

  @Put(':driveId')
  async updateDrive(
    @Param('driveId') driveId: string,
    @Body() updateDriveDto: UpdateDriveDto
  ): Promise<DriveDocument> {
    const updatedDrive = await this.driveService.updateDrive(driveId, updateDriveDto);
    if (!updatedDrive) {
      throw new NotFoundException(`Drive with ID ${driveId} not found`);
    }
    return updatedDrive;
  }

  @Delete(':driveId')
  async deleteDrive(@Param('driveId') driveId: string): Promise<{ success: boolean }> {
    const result = await this.driveService.deleteDrive(driveId);
    if (!result) {
      throw new NotFoundException(`Drive with ID ${driveId} not found`);
    }
    return { success: true };
  }

  @Put(':driveId/wecp-tests')
  async updateWecpTests(
    @Param('driveId') driveId: string,
    @Body() updateWecpTestsDto: UpdateDriveWecpTestsDto
  ): Promise<DriveDocument> {
    const updatedDrive = await this.driveService.updateWecpTests(driveId, updateWecpTestsDto.wecpTestIds);
    if (!updatedDrive) {
      throw new NotFoundException(`Drive with ID ${driveId} not found`);
    }
    return updatedDrive;
  }
  // Rounds Management

  @Get(':driveId/rounds')
  async getRounds(
    @Param('driveId') driveId: string,
    @Query('roundNumber') roundNumber?: number
  ): Promise<any> {
    return this.driveService.getRounds(driveId, roundNumber);
  }

  @Get(':driveId/rounds/:roundNumber')
  async getRoundByNumber(
    @Param('driveId') driveId: string,
    @Param('roundNumber', ParseIntPipe) roundNumber: number
  ): Promise<any> {
    return this.driveService.getRoundByNumber(driveId, roundNumber);
  }

  @Post(':driveId/rounds')
  async createRound(
    @Param('driveId') driveId: string,
    @Body() createRoundDto: CreateRoundDto
  ): Promise<DriveDocument> {
    return this.driveService.createRound(driveId, createRoundDto);
  }

  @Put(':driveId/rounds/:roundNumber')
  async updateRound(
    @Param('driveId') driveId: string,
    @Param('roundNumber', ParseIntPipe) roundNumber: number,
    @Body() updateRoundDto: UpdateRoundDto
  ): Promise<DriveDocument> {
    return this.driveService.updateRound(driveId, roundNumber, updateRoundDto);
  }

  @Delete(':driveId/rounds/:roundNumber')
  async deleteRound(
    @Param('driveId') driveId: string,
    @Param('roundNumber', ParseIntPipe) roundNumber: number
  ): Promise<DriveDocument> {
    return this.driveService.deleteRound(driveId, roundNumber);
  }
}
