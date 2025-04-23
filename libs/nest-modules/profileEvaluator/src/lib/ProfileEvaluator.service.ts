import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { DriveService } from '../../../drive/src/lib/drive.service';
import { StudentService } from '../../../student/src/lib/student.service';
import { SQSService } from '../../../../utils/src/lib/services/sqs.service';
import { EvaluationType } from './enums/evaluation-type.enum';
import { WecpService } from './services/wecp.service';
import { ProfileEvaluatorJob, ProfileEvaluatorJobDocument } from './ProfileEvaluator.schema';
import { JobStatus } from './enums/job-status.enum';

@Injectable()
export class ProfileEvaluatorService {
  constructor(
    @InjectModel(ProfileEvaluatorJob.name)
    private jobModel: Model<ProfileEvaluatorJobDocument>,
    private readonly driveService: DriveService,
    private readonly studentService: StudentService,
    private readonly sqsService: SQSService,
    private readonly wecpService: WecpService
  ) { }

  /**
   * Get all jobs with optional filtering
   */
  async getJobs(page = 1, limit = 10, status?: JobStatus, driveId?: string) {
    const query: any = {};
    if (status) query.status = status;
    if (driveId) query.driveId = driveId;

    const [jobs, total] = await Promise.all([
      this.jobModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.jobModel.countDocuments(query)
    ]);

    return {
      data: jobs,
      total,
      page,
      limit
    };
  }

  /**
   * Get a specific job by ID
   */
  async getJobById(jobId: string) {
    const job = await this.jobModel.findOne({ jobId }).exec();
    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }
    return job;
  }

  /**
   * Create a new job record
   */
  private async createJob(driveId: string, evaluationType: EvaluationType): Promise<ProfileEvaluatorJob> {
    const job = new this.jobModel({
      jobId: uuidv4(),
      driveId,
      evaluationType,
      status: JobStatus.PENDING
    });
    return job.save();
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    progress?: { total: number; completed: number },
    error?: string
  ) {
    const update: any = { status };
    if (progress) update.progress = progress;
    if (error) update.error = error;

    const job = await this.jobModel.findOneAndUpdate(
      { jobId },
      update,
      { new: true }
    ).exec();

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }
    return job;
  }

  /**
   * Submit a job to evaluate profiles for a drive
   * @param driveId The ID of the drive
   * @param evaluationType The type of evaluation to perform
   * @returns The message ID from SQS
   */
  async submitPreScreeningJob(driveId: string): Promise<{ messageId: string; jobId: string }> {
    // Validate drive exists
    const drive = await this.driveService.getDriveById(driveId);
    if (!drive) {
      throw new NotFoundException(`Drive with ID ${driveId} not found`);
    }

    // Get students for the drive
    const students = await this.studentService.findAll(1, 100, { driveId });
    if (!students.data.length) {
      throw new BadRequestException(`No students found for drive ${driveId}`);
    }

    // Create job record
    const job = await this.createJob(driveId, EvaluationType.PreScreening);

    // Send to SQS
    const messageId = await this.sqsService.sendMessage({
      jobId: job.jobId,
      driveId,
      driveName: drive.name,
      collegeId: drive.collegeId,
      collegeName: drive.collegeName,
      studentCount: students.total,
      evaluationType: EvaluationType.PreScreening,
      timestamp: new Date().toISOString()
    });

    return { messageId, jobId: job.jobId };
  }

  /**
    * Submit a job to evaluate WeCP results for a drive
    * @param driveId The ID of the drive
    * @returns The message ID from SQS
    */
  async submitWecpEvaluationJob(driveId: string, forceDataRefresh?: boolean): Promise<{ messageId: string; jobId: string }> {
    // Validate drive exists
    const drive = await this.driveService.getDriveById(driveId);
    if (!drive) {
      throw new NotFoundException(`Drive with ID ${driveId} not found`);
    }

    // Validate drive has WeCP test IDs configured
    if (!drive.wecpTestIds || drive.wecpTestIds.length === 0) {
      throw new BadRequestException(`Drive ${driveId} has no WeCP test IDs configured`);
    }

    // Get students for the drive
    const students = await this.studentService.findAll(1, 100, { driveId });
    if (!students.data.length) {
      throw new BadRequestException(`No students found for drive ${driveId}`);
    }

    // Create job record
    const job = await this.createJob(driveId, EvaluationType.Evaluation);

    // Send to SQS
    const messageId = await this.sqsService.sendMessage({
      jobId: job.jobId,
      driveId,
      driveName: drive.name,
      collegeId: drive.collegeId,
      collegeName: drive.collegeName,
      studentCount: students.total,
      evaluationType: EvaluationType.Evaluation,
      timestamp: new Date().toISOString(),
      forceDataRefresh: forceDataRefresh || false
    });

    return { messageId, jobId: job.jobId };
  }
}
