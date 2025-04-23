import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Drive, DriveDocument } from './drive.schema';
import { CreateDriveDto } from './dto/create-drive.dto';
import { UpdateDriveDto } from './dto/update-drive.dto';
import { CollegeService } from '../../../college/src/lib/college.service';
import { CreateRoundDto, UpdateRoundDto } from './dto/round.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DriveService {
  constructor(
    @InjectModel(Drive.name) private driveModel: Model<DriveDocument>,
    private readonly collegeService: CollegeService
  ) {}

  async createDrive(createDriveDto: CreateDriveDto): Promise<DriveDocument> {
    await this.validateDriveData(createDriveDto);
    
    // Validate rounds if provided
    if (createDriveDto.rounds && createDriveDto.rounds.length > 0) {
      this.validateRounds(createDriveDto.rounds);
      
      // Ensure each evaluation criteria has a criteriaId
      createDriveDto.rounds.forEach(round => {
        round.evaluationCriteria.forEach(criteria => {
          if (!criteria.criteriaId) {
            criteria.criteriaId = uuidv4();
          }
        });
      });
    }
    
    const createdDrive = new this.driveModel(createDriveDto);
    const savedDrive = await createdDrive.save();
    return savedDrive;
  }

  private async validateDriveData(createDriveDto: CreateDriveDto): Promise<void> {
    const { collegeId, collegeName, startDate } = createDriveDto;

    // Validate collegeId exists
    const college = await this.collegeService.getCollege(collegeId);
    if (!college) {
      throw new BadRequestException(`College with ID ${collegeId} does not exist`);
    }

    // Validate collegeName matches
    if (college.name !== collegeName) {
      throw new BadRequestException(`College name does not match the provided collegeId`);
    }

    // Validate startDate is a future date
    const currentDate = new Date();
    const driveStartDate = new Date(startDate);
    if (driveStartDate <= currentDate) {
      throw new BadRequestException('Start date must be a future date');
    }
  }

  /**
   * Validates rounds configuration
   * - Ensures round numbers are between 1-5
   * - Ensures round numbers are sequential without gaps
   * - Validates that round times don't overlap
   * - Ensures each round has at least one evaluation criteria
   * - Ensures criteria names are unique within a round
   */
  private validateRounds(rounds: any[]): void {
    if (rounds.length === 0) {
      return;
    }

    if (rounds.length > 5) {
      throw new BadRequestException('A drive can have a maximum of 5 rounds');
    }

    // Sort rounds by roundNumber
    const sortedRounds = [...rounds].sort((a, b) => a.roundNumber - b.roundNumber);

    // Check for sequential round numbers without gaps
    for (let i = 0; i < sortedRounds.length; i++) {
      if (sortedRounds[i].roundNumber !== i + 1) {
        throw new BadRequestException('Round numbers must be sequential without gaps (1, 2, 3...)');
      }
    }

    // Check for overlapping times
    for (let i = 0; i < sortedRounds.length - 1; i++) {
      const currentRound = sortedRounds[i];
      const nextRound = sortedRounds[i + 1];
      
      const currentEndTime = new Date(currentRound.endTime).getTime();
      const nextStartTime = new Date(nextRound.startTime).getTime();
      
      if (currentEndTime > nextStartTime) {
        throw new BadRequestException('Round times cannot overlap');
      }
    }

    // Validate each round's evaluation criteria
    rounds.forEach(round => {
      if (!round.evaluationCriteria || round.evaluationCriteria.length === 0) {
        throw new BadRequestException(`Round ${round.roundNumber} must have at least one evaluation criteria`);
      }

      // Check for unique criteria names within a round
      const criteriaNames = new Set();
      round.evaluationCriteria.forEach(criteria => {
        if (criteriaNames.has(criteria.name)) {
          throw new BadRequestException(`Duplicate criteria name "${criteria.name}" in round ${round.roundNumber}`);
        }
        criteriaNames.add(criteria.name);
      });
    });
  }

  async getDrives(page: number = 1, limit: number = 10, filters: FilterQuery<Drive> = {}): Promise<{ drives: DriveDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const [drives, total] = await Promise.all([
      this.driveModel.find(filters).skip(skip).limit(limit).exec(),
      this.driveModel.countDocuments(filters).exec(),
    ]);
    return { drives, total };
  }

  async getDriveById(driveId: string, includeRounds: boolean = true): Promise<DriveDocument | null> {
    const query = this.driveModel.findOne({ driveId });
    
    if (!includeRounds) {
      query.select('-rounds');
    }
    
    return query.exec();
  }

  async updateDrive(driveId: string, updateDriveDto: UpdateDriveDto): Promise<DriveDocument | null> {
    // Validate rounds if provided
    if (updateDriveDto.rounds && updateDriveDto.rounds.length > 0) {
      this.validateRounds(updateDriveDto.rounds);
      
      // Ensure each evaluation criteria has a criteriaId
      updateDriveDto.rounds.forEach(round => {
        round.evaluationCriteria.forEach(criteria => {
          if (!criteria.criteriaId) {
            criteria.criteriaId = uuidv4();
          }
        });
      });
    }
    
    return this.driveModel.findOneAndUpdate({ driveId }, updateDriveDto, { new: true }).exec();
  }

  async deleteDrive(driveId: string): Promise<boolean> {
    const result = await this.driveModel.findOneAndUpdate({ driveId }, { isActive: false }).exec();
    return !!result;
  }

  async updateWecpTests(driveId: string, wecpTestIds: string[]): Promise<DriveDocument | null> {
    return this.driveModel.findOneAndUpdate(
      { driveId },
      { wecpTestIds },
      { new: true }
    ).exec();
  }
  /**
   * Get all rounds for a specific drive
   */
  async getRounds(driveId: string, roundNumber?: number): Promise<any> {
    const drive = await this.getDriveById(driveId);
    
    if (!drive) {
      throw new NotFoundException(`Drive with ID ${driveId} not found`);
    }
    
    if (!drive.rounds || drive.rounds.length === 0) {
      return [];
    }
    
    if (roundNumber) {
      const round = drive.rounds.find(r => r.roundNumber === roundNumber);
      if (!round) {
        throw new NotFoundException(`Round ${roundNumber} not found in drive with ID ${driveId}`);
      }
      return [round];
    }
    
    return drive.rounds;
  }

  /**
   * Get a specific round by number for a drive
   */
  async getRoundByNumber(driveId: string, roundNumber: number): Promise<any> {
    const rounds = await this.getRounds(driveId, roundNumber);
    return rounds[0];
  }

  /**
   * Create a new round for a drive
   */
  async createRound(driveId: string, createRoundDto: CreateRoundDto): Promise<DriveDocument> {
    const drive = await this.getDriveById(driveId);
    
    if (!drive) {
      throw new NotFoundException(`Drive with ID ${driveId} not found`);
    }
    
    // Initialize rounds array if it doesn't exist
    if (!drive.rounds) {
      drive.rounds = [];
    }
    
    // Check if round number already exists
    const existingRound = drive.rounds.find(r => r.roundNumber === createRoundDto.roundNumber);
    if (existingRound) {
      throw new BadRequestException(`Round ${createRoundDto.roundNumber} already exists for this drive`);
    }
    
    // Validate the new round in context of existing rounds
    this.validateRounds([...drive.rounds, createRoundDto]);
    
    // Ensure each evaluation criteria has a criteriaId
    createRoundDto.evaluationCriteria.forEach(criteria => {
      if (!criteria.criteriaId) {
        criteria.criteriaId = uuidv4();
      }
    });
    
    // Add the new round as a plain object
    drive.rounds.push({
      roundNumber: createRoundDto.roundNumber,
      name: createRoundDto.name,
      startTime: createRoundDto.startTime,
      endTime: createRoundDto.endTime,
      evaluationCriteria: createRoundDto.evaluationCriteria.map(criteria => ({
        criteriaId: criteria.criteriaId || uuidv4(),
        name: criteria.name,
        description: criteria.description,
        ratingType: criteria.ratingType,
        isRequired: criteria.isRequired !== undefined ? criteria.isRequired : true
      }))
    });
    
    // Sort rounds by roundNumber
    drive.rounds.sort((a, b) => a.roundNumber - b.roundNumber);
    
    return drive.save();
  }

  /**
   * Update a specific round for a drive
   */
  async updateRound(driveId: string, roundNumber: number, updateRoundDto: UpdateRoundDto): Promise<DriveDocument> {
    const drive = await this.getDriveById(driveId);
    
    if (!drive) {
      throw new NotFoundException(`Drive with ID ${driveId} not found`);
    }
    
    if (!drive.rounds || drive.rounds.length === 0) {
      throw new NotFoundException(`No rounds found for drive with ID ${driveId}`);
    }
    
    const roundIndex = drive.rounds.findIndex(r => r.roundNumber === roundNumber);
    if (roundIndex === -1) {
      throw new NotFoundException(`Round ${roundNumber} not found in drive with ID ${driveId}`);
    }
    
    // Create updated round by merging existing round with updates
    const existingRound = drive.rounds[roundIndex];
    
    // Update basic properties
    if (updateRoundDto.name) existingRound.name = updateRoundDto.name;
    if (updateRoundDto.startTime) existingRound.startTime = updateRoundDto.startTime;
    if (updateRoundDto.endTime) existingRound.endTime = updateRoundDto.endTime;
    
    // If evaluation criteria is being updated, ensure each has a criteriaId
    if (updateRoundDto.evaluationCriteria) {
      existingRound.evaluationCriteria = updateRoundDto.evaluationCriteria.map(criteria => ({
        criteriaId: criteria.criteriaId || uuidv4(),
        name: criteria.name,
        description: criteria.description,
        ratingType: criteria.ratingType,
        isRequired: criteria.isRequired !== undefined ? criteria.isRequired : true
      }));
    }
    
    // Validate all rounds together
    this.validateRounds(drive.rounds);
    
    return drive.save();
  }

  /**
   * Delete a specific round from a drive
   */
  async deleteRound(driveId: string, roundNumber: number): Promise<DriveDocument> {
    const drive = await this.getDriveById(driveId);
    
    if (!drive) {
      throw new NotFoundException(`Drive with ID ${driveId} not found`);
    }
    
    if (!drive.rounds || drive.rounds.length === 0) {
      throw new NotFoundException(`No rounds found for drive with ID ${driveId}`);
    }
    
    const roundIndex = drive.rounds.findIndex(r => r.roundNumber === roundNumber);
    if (roundIndex === -1) {
      throw new NotFoundException(`Round ${roundNumber} not found in drive with ID ${driveId}`);
    }
    
    // Remove the round
    drive.rounds.splice(roundIndex, 1);
    
    // Renumber remaining rounds to ensure sequential numbers without gaps
    drive.rounds.sort((a, b) => a.roundNumber - b.roundNumber);
    drive.rounds.forEach((round, index) => {
      round.roundNumber = index + 1;
    });
    
    return drive.save();
  }
}
