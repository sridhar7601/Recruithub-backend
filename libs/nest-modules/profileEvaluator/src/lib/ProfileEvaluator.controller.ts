import { Controller, Post, Body, Param, HttpCode, HttpStatus, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ProfileEvaluatorService } from './ProfileEvaluator.service';
import { GitHubScoreService } from './services/github-score.service';
import { SubmitEvaluationDto } from './dto/submit-evaluation.dto';
import { WecpService } from './services/wecp.service';
import { EvaluationType } from './enums/evaluation-type.enum';
import { JobStatus } from './enums/job-status.enum';

@ApiTags('Profile Evaluator')
@Controller('profile-evaluator')
export class ProfileEvaluatorController {
  constructor(
    private readonly evaluatorService: ProfileEvaluatorService,
    private readonly githubScoreService: GitHubScoreService,
    private readonly wecpService: WecpService
  ) {}

  @Get('jobs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get list of evaluation jobs' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'status', required: false, enum: JobStatus, description: 'Filter by job status' })
  @ApiQuery({ name: 'driveId', required: false, type: String, description: 'Filter by drive ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Jobs retrieved successfully' })
  async getJobs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: JobStatus,
    @Query('driveId') driveId?: string
  ) {
    return this.evaluatorService.getJobs(page, limit, status, driveId);
  }

  @Get('jobs/:jobId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get status of a specific job' })
  @ApiParam({ name: 'jobId', description: 'ID of the job to check' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Job status retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Job not found' })
  async getJobStatus(
    @Param('jobId') jobId: string
  ) {
    return this.evaluatorService.getJobById(jobId);
  }

  @Post('drives/:driveId/submit-evaluation')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Submit a job to evaluate profiles for a drive' })
  @ApiParam({ name: 'driveId', description: 'ID of the drive to evaluate' })
  @ApiResponse({ 
    status: HttpStatus.ACCEPTED, 
    description: 'Job submitted successfully',
    schema: {
      type: 'object',
      properties: {
        messageId: { type: 'string', description: 'SQS message ID' },
        jobId: { type: 'string', description: 'Job tracking ID' }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Drive not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'No students found for drive' })
  async submitEvaluationJob(
    @Param('driveId') driveId: string
  ) {
    return this.evaluatorService.submitPreScreeningJob(
      driveId
    );
  }

  @Post('drives/:driveId/wecp-evaluation')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Submit a job to evaluate WeCP results for a drive' })
  @ApiParam({ name: 'driveId', description: 'ID of the drive to evaluate' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        forceDataRefresh: {
          type: 'boolean',
          description: 'Whether to force refresh WeCP data even if it exists',
          default: false
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.ACCEPTED, 
    description: 'Job submitted successfully',
    schema: {
      type: 'object',
      properties: {
        messageId: { type: 'string', description: 'SQS message ID' },
        jobId: { type: 'string', description: 'Job tracking ID' }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Drive not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'No students found for drive or drive validation failed' })
  async submitWecpEvaluationJob(
    @Param('driveId') driveId: string,
    @Body() body: { forceDataRefresh?: boolean }
  ) {
    // Validate drive exists and has students with WeCP test IDs
    return this.evaluatorService.submitWecpEvaluationJob(driveId, body.forceDataRefresh);
  }

  @Get('github/rate-limit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check GitHub API rate limit status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rate limit information retrieved successfully' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve rate limit information' })
  async checkGitHubRateLimit() {
    return this.githubScoreService.checkRateLimit();
  }
}
