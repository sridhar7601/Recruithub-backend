import { Injectable, NotFoundException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Assignment } from './assignment.schema';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { StudentService } from '../../../student/src/lib/student.service';
import { PanelService } from '../../../panel/src/lib/panel.service';
import { CollegeService } from '../../../college/src/lib/college.service';
import { DriveService } from '../../../drive/src/lib/drive.service';

@Injectable()
export class AssignmentService {
  private readonly logger = new Logger(AssignmentService.name);

  constructor(
    @InjectModel(Assignment.name) private assignmentModel: Model<Assignment>,
    private readonly studentService: StudentService,
    private readonly panelService: PanelService,
    private readonly collegeService: CollegeService,
    private readonly driveService: DriveService
  ) {}

  async create(createAssignmentDto: CreateAssignmentDto): Promise<Assignment> {
    this.logger.debug(`Creating assignment: ${JSON.stringify(createAssignmentDto)}`);
    await this.validateAssignmentData(createAssignmentDto);

    const assignmentData = { ...createAssignmentDto };
    if (!assignmentData.assignmentId) {
      assignmentData.assignmentId = undefined; // Set to undefined to trigger auto-generation
    }

    const createdAssignment = new this.assignmentModel(assignmentData);
    const savedAssignment = await createdAssignment.save();
    this.logger.debug(`Assignment created: ${JSON.stringify(savedAssignment)}`);
    return savedAssignment;
  }

  private async validateAssignmentData(createAssignmentDto: CreateAssignmentDto): Promise<void> {
    const { studentId, panelId, collegeId, driveId, roundNumber } = createAssignmentDto;

    this.logger.debug(`Validating assignment data: studentId=${studentId}, panelId=${panelId}, collegeId=${collegeId}, driveId=${driveId}, roundNumber=${roundNumber}`);

    // Validate studentId exists
    await this.validateEntity(this.studentService.findOne.bind(this.studentService), studentId, 'Student');

    // Validate panelId exists
    await this.validateEntity(this.panelService.findOne.bind(this.panelService), panelId, 'Panel');

    // Validate collegeId and driveId
    await this.validateIds(collegeId, driveId);

    // Ensure the same student is not assigned multiple times in the same round
    const existingAssignment = await this.assignmentModel.findOne({
      studentId,
      roundNumber,
    });

    if (existingAssignment) {
      this.logger.error(`Student ${studentId} is already assigned to a panel in round ${roundNumber}`);
      throw new BadRequestException('Student is already assigned to a panel in this round');
    }

    this.logger.debug('Assignment data validation successful');
  }

  private async validateIds(collegeId: string, driveId: string): Promise<void> {
    this.logger.debug('Starting ID validation process');

    try {
      this.logger.debug(`Validating collegeId: ${collegeId}`);
      const college = await this.collegeService.getCollege(collegeId);
      if (!college) {
        throw new BadRequestException(`College with ID ${collegeId} does not exist`);
      }

      this.logger.debug(`Validating driveId: ${driveId}`);
      const drive = await this.driveService.getDriveById(driveId);
      if (!drive) {
        throw new BadRequestException(`Drive with ID ${driveId} does not exist`);
      }

    } catch (error) {
      this.logger.error('Validation error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to validate IDs');
    }
  }

  private async validateEntity(findFunction: (id: string) => Promise<any>, id: string, entityName: string): Promise<void> {
    this.logger.debug(`Attempting to find ${entityName} with ID: ${id}`);
    try {
      const entity = await findFunction(id);
      this.logger.debug(`${entityName} found: ${JSON.stringify(entity)}`);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        this.logger.error(`${entityName} not found: ${error.message}`);
        throw new BadRequestException(`${entityName} with ID ${id} does not exist`);
      } else {
        this.logger.error(`Error finding ${entityName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw new BadRequestException(`An error occurred while validating the ${entityName.toLowerCase()}`);
      }
    }
  }

  async findAll(page: number, limit: number, filters: any): Promise<{ assignments: Assignment[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const [assignments, total] = await Promise.all([
      this.assignmentModel.find(filters).skip(skip).limit(limit).exec(),
      this.assignmentModel.countDocuments(filters).exec(),
    ]);
    return { assignments, total, page, limit };
  }

  async findOne(assignmentId: string): Promise<Assignment> {
    const assignment = await this.assignmentModel.findOne({ assignmentId }).exec();
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }
    return assignment;
  }

  async update(assignmentId: string, updateAssignmentDto: UpdateAssignmentDto): Promise<Assignment> {
    const updatedAssignment = await this.assignmentModel
      .findOneAndUpdate({ assignmentId }, updateAssignmentDto, { new: true })
      .exec();
    if (!updatedAssignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }
    return updatedAssignment;
  }

  async remove(assignmentId: string): Promise<void> {
    const result = await this.assignmentModel.deleteOne({ assignmentId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }
  }
}
