import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomLogger } from './utils/custom.logger';
import { Interval } from '@nestjs/schedule';
import { SQSService } from '../../../../utils/src/lib/services/sqs.service';
import { EvaluationType } from './enums/evaluation-type.enum';
import { JobStatus } from './enums/job-status.enum';
import { ProfileEvaluatorJob, ProfileEvaluatorJobDocument } from './ProfileEvaluator.schema';

enum EvaluationPhase {
  WECP = 'Processing WeCP data',
  GITHUB = 'Processing GitHub profiles',
  RESUME = 'Processing Resumes',
  AI = 'Calculating AI Scores',
  COMPLETED = 'Completed'
}
import { StudentService } from '../../../student/src/lib/student.service';
import { DriveService } from '../../../drive/src/lib/drive.service';
import { AIScoreService } from './services/ai-score.service';
import { WecpService } from './services/wecp.service';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { ProfileEvaluatorProcessor } from './ProfileEvaluator.processor';

@Injectable()
export class ProfileEvaluatorConsumer implements OnModuleInit {
  private readonly logger = new CustomLogger(ProfileEvaluatorConsumer.name);
  private readonly VISIBILITY_TIMEOUT = 3600; // 1 hour in seconds

  constructor(
    @InjectModel(ProfileEvaluatorJob.name)
    private jobModel: Model<ProfileEvaluatorJobDocument>,
    private readonly sqsService: SQSService,
    private readonly studentService: StudentService,
    private readonly driveService: DriveService,
    private readonly configService: ConfigService,
    private readonly aiScoreService: AIScoreService,
    private readonly wecpService: WecpService,
    private readonly processor: ProfileEvaluatorProcessor
  ) {}

  onModuleInit() {
    this.logger.log('ProfileEvaluatorConsumer initialized');
  }

  /**
   * Poll for messages from the SQS queue every 10 seconds
   */
  @Interval(10000)
  async pollMessages() {
    this.logger.trace('Starting message polling cycle');
    
    try {
      this.logger.debug('Attempting to receive message from SQS');
      const message = await this.sqsService.receiveMessage();
      
    if (message) {
      this.logger.debug('Message received', { messageId: message.MessageId });
      
      try {
        this.logger.trace('Starting message processing', { messageId: message.MessageId });
        
        // Ensure message visibility timeout is set to 1 hour
        await this.setMessageVisibility(message);
        
        // Parse message body to get jobId
        const data = JSON.parse(message.Body);
        if (!data.jobId) {
          throw new Error('Message missing jobId');
        }

        // Update job status to IN_PROGRESS atomically
        await this.atomicUpdate(data.jobId, {
          $set: { status: JobStatus.IN_PROGRESS }
        });
        
        const success = await this.processMessage(message);
          
          if (success) {
            this.logger.debug('Message processed successfully, deleting from queue', { messageId: message.MessageId });
            await this.sqsService.deleteMessage(message);
            this.logger.log('Message processing cycle completed successfully', { messageId: message.MessageId });
          } else {
            this.logger.warn('Message processing incomplete', { 
              messageId: message.MessageId,
              reason: 'Processing returned false',
              action: 'Keeping in queue for retry'
            });
          }
        } catch (error) {
          this.logger.error('Message processing failed', {
            messageId: message.MessageId,
            error: error instanceof Error ? error.message : 'Unknown error',
            action: 'Keeping in queue for retry'
          });
        }
      } else {
        this.logger.trace('No messages available in queue');
      }
    } catch (error) {
      this.logger.error('Message polling failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Process a message from the SQS queue
   * @param message The message to process
   * @returns Boolean indicating if processing was successful
   */
  /**
   * Helper method to perform atomic updates with optimistic locking
   */
  private async atomicUpdate(jobId: string, update: any, options: any = {}): Promise<ProfileEvaluatorJobDocument> {
    const currentJob = await this.jobModel.findOne({ jobId }).exec();
    if (!currentJob) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const result = await this.jobModel.findOneAndUpdate(
      { 
        jobId,
        version: currentJob.version 
      },
      {
        ...update,
        $inc: { 
          version: 1,
          ...(update.$inc || {})
        }
      },
      { 
        new: true,
        ...options
      }
    ).lean();

    if (!result) {
      // Retry once if version mismatch
      return this.atomicUpdate(jobId, update, options);
    }

    // Convert lean object back to document
    return new this.jobModel(result).toObject() as ProfileEvaluatorJobDocument;
  }

  private async processMessage(message: AWS.SQS.Message): Promise<boolean> {
    if (!message.Body) {
      throw new Error('Message body is empty');
    }

    // Parse the message body
    const data = JSON.parse(message.Body);
    this.logger.log(`Processing message for drive: ${data.driveId}, type: ${data.evaluationType}`);

    try {
      // Process based on evaluation type
      if (data.evaluationType === EvaluationType.PreScreening) {
        await this.handlePreScreening(data);
      } else if (data.evaluationType === EvaluationType.Evaluation) {
        await this.handleEvaluation(data);
      } else {
        throw new Error(`Unknown evaluation type: ${data.evaluationType}`);
      }
      
      return true; // Processing completed successfully
    } catch (error) {
      this.logger.error(`Error processing message: ${error.message}`);
      
      // Update job status atomically
      await this.atomicUpdate(data.jobId, {
        $set: {
          status: JobStatus.FAILED,
          error: error.message
        }
      });
      
      throw error;
    }
  }

  /**
   * Handle pre-screening evaluation
   * @param data The evaluation data
   */
  private async handlePreScreening(data: { 
    jobId: string;
    driveId: string;
    studentCount: number;
  }): Promise<void> {
    this.logger.log(`Handling pre-screening for drive: ${data.driveId}`);
    
    try {
      // Get drive details
      const drive = await this.driveService.getDriveById(data.driveId);
      if (!drive) {
        throw new Error(`Drive not found: ${data.driveId}`);
      }
      
      // Get all students for the drive
      const students = await this.studentService.findAll(1, 1500, { driveId: data.driveId });
      this.logger.log(`Found ${students.total} students for drive ${data.driveId}`);
      
      // Calculate eligible students for resume evaluation
      const resumeEligibleCount = students.data.filter(s => s.resumeUrl).length;
      
      // Initialize job with total counts atomically
      await this.atomicUpdate(data.jobId, {
        $set: {
          'progress.github.total': students.data.length,
          'progress.resume.total': resumeEligibleCount,
          'progress.overall.status': EvaluationPhase.GITHUB
        }
      });
      
      // Process GitHub evaluations in parallel
      await this.processor.processGitHubEvaluationsInParallel(
        students.data,
        undefined,
        { jobId: data.jobId, type: 'github', total: students.data.length }
      );

      // Update status for resume processing atomically
      await this.atomicUpdate(data.jobId, {
        $set: {
          'progress.overall.status': EvaluationPhase.RESUME
        }
      });

      // Process resume evaluations
      await this.processor.processResumeEvaluationsInParallel(
        students.data,
        { jobId: data.jobId, type: 'resume', total: resumeEligibleCount }
      );
      
      // Update job status to completed atomically
      await this.atomicUpdate(data.jobId, {
        $set: {
          status: JobStatus.COMPLETED,
          'progress.overall.status': EvaluationPhase.COMPLETED,
          'progress.overall.percentage': 100
        }
      });
      
      this.logger.log(`Pre-screening completed for drive: ${data.driveId}`);
    } catch (error) {
      this.logger.error(`Error in pre-screening for drive ${data.driveId}: ${error.message}`);
      
      // Update job status to failed atomically
      await this.atomicUpdate(data.jobId, {
        $set: {
          status: JobStatus.FAILED,
          error: error.message
        }
      });
      
      throw error;
    }
  }

  /**
   * Handle full evaluation
   * @param data The evaluation data
   */
  private async handleEvaluation(data: { 
    jobId: string;
    driveId: string;
    evaluationType: EvaluationType;
    forceDataRefresh?: boolean;
  }): Promise<void> {
    this.logger.log(`Handling full evaluation for drive: ${data.driveId}`);
    
    try {
      // Get drive details
      const drive = await this.driveService.getDriveById(data.driveId);
      if (!drive) {
        throw new Error(`Drive not found: ${data.driveId}`);
      }
      
      // Check if drive has WeCP test IDs
      if (!drive.wecpTestIds || drive.wecpTestIds.length === 0) {
        this.logger.warn(`Drive ${data.driveId} has no WeCP test IDs configured`);
        return;
      }
      
      // Initialize job with WeCP phase
      await this.atomicUpdate(data.jobId, {
        $set: {
          'progress.overall.status': EvaluationPhase.WECP
        }
      });

      // Get all students for the drive
      const students = await this.studentService.findAll(1, undefined, { driveId: data.driveId }, true);
      this.logger.log(`Found ${students.total} students for drive ${data.driveId}`);
      
      // Calculate eligible students for resume evaluation
      const resumeEligibleCount = students.data.filter(s => s.resumeUrl).length;
      
      // Fetch WeCP candidates for each test ID and update student scores
      let allWecpCandidates = [];
      
      for (let i = 0; i < drive.wecpTestIds.length; i++) {
        const testId = drive.wecpTestIds[i];
        try {
          this.logger.log(`Processing test ${i + 1}/${drive.wecpTestIds.length}: ${testId}`);
          this.logger.log(`Fetching candidates from WeCP test: ${testId}`);
          const wecpCandidates = await this.wecpService.fetchCandidates(testId);
          
          if (wecpCandidates.length === 0) {
            this.logger.warn(`No candidates found for WeCP test: ${testId}`);
            continue; // Skip to next test ID
          }
          
          this.logger.log(`Retrieved ${wecpCandidates.length} candidates from WeCP test: ${testId}`);
          
          // Map WeCP candidates to students using registration number or email
          let matchCount = 0;
          let processedCount = 0;
          const totalStudents = students.data.length;
          
          // Log a sample candidate for debugging
          if (wecpCandidates.length > 0) {
            this.logger.debug(`Sample WeCP candidate: ${JSON.stringify(wecpCandidates[0])}`);
          }
          
          for (const student of students.data) {
            processedCount++;
            if (processedCount % 10 === 0 || processedCount === totalStudents) {
              this.logger.log(`WeCP Mapping Progress: ${processedCount}/${totalStudents} students processed (${Math.round((processedCount/totalStudents) * 100)}%) for test ${testId}`);
            }
            
            // Try to find a match by registration number first, then by email
            const wecpData = wecpCandidates.find(c => {
              // First try registration number if available
              if (c.candidateDetails.registrationNumber && student.registrationNumber) {
                return c.candidateDetails.registrationNumber === student.registrationNumber;
              }
              
              // Fall back to email matching (case-insensitive)
              if (c.candidateDetails.Email && student.emailId) {
                return c.candidateDetails.Email.toLowerCase() === student.emailId.toLowerCase();
              }
              
              return false;
            });
            
            if (wecpData) {
              matchCount++;
              
              // Determine which field was used for matching
              let matchField = 'unknown field';
              if (wecpData.candidateDetails.registrationNumber === student.registrationNumber) {
                matchField = 'registration number';
              } else if (wecpData.candidateDetails.Email?.toLowerCase() === student.emailId.toLowerCase()) {
                matchField = 'email';
              }
              
              this.logger.debug(`Found WeCP data for student ${student.emailId} (matched by ${matchField})`);
              
              try {
                // Check if we should skip WeCP data fetch
                if (!data.forceDataRefresh && student.wecpData) {
                  this.logger.debug(`Using existing WeCP data for student ${student.studentId}`);
                  continue;
                }

                this.logger.debug(`Fetching WeCP data for student ${student.studentId}${data.forceDataRefresh ? ' (forced refresh)' : ''}`);
                
                // Fetch detailed candidate information
                const candidateDetails = await this.wecpService.fetchCandidateDetails(wecpData.candidateId);
                
                // Transform to WeCPData format
                const wecpDataFormatted = this.wecpService.transformToWeCPData(candidateDetails);
                
                // Check if we need to update GitHub profile
                const wecpGithubUrl = candidateDetails.candidateDetails['Github URL'];
                const existingGithubUrl = student.githubProfile;

                // Only update GitHub profile and reset evaluation if URLs are different
                if (wecpGithubUrl && 
                    (!existingGithubUrl || 
                     wecpGithubUrl.toLowerCase() !== existingGithubUrl.toLowerCase())) {
                  await this.studentService.update(student.studentId, {
                    wecpTestScore: wecpDataFormatted.percentage,
                    wecpData: wecpDataFormatted,
                    githubProfile: wecpGithubUrl,
                    githubEvaluated: false,
                    githubDetails: null
                  });
                } else {
                  // Just update WeCP data if URLs are same or no GitHub URL provided
                  await this.studentService.update(student.studentId, {
                    wecpTestScore: wecpDataFormatted.percentage,
                    wecpData: wecpDataFormatted
                  });
                }
                
                this.logger.debug(`Updated student ${student.studentId} with detailed WeCP data`);
              } catch (error) {
                this.logger.error(`Error fetching detailed WeCP data for student ${student.studentId}: ${error.message}`);
                
                // Skip WeCP update if not forcing refresh and data exists
                if (!data.forceDataRefresh && student.wecpData) {
                  this.logger.debug(`Keeping existing WeCP data for student ${student.studentId} after error`);
                  continue;
                }

                // Fallback to basic update if detailed fetch fails
                const wecpGithubUrl = wecpData.candidateDetails['Github URL'];
                const existingGithubUrl = student.githubProfile;

                // Only update GitHub profile and reset evaluation if URLs are different
                if (wecpGithubUrl && 
                    (!existingGithubUrl || 
                     wecpGithubUrl.toLowerCase() !== existingGithubUrl.toLowerCase())) {
                  await this.studentService.update(student.studentId, {
                    wecpTestScore: wecpData.percentage,
                    githubProfile: wecpGithubUrl,
                    githubEvaluated: false,
                    githubDetails: null
                  });
                } else {
                  // Just update WeCP score if URLs are same or no GitHub URL provided
                  await this.studentService.update(student.studentId, {
                    wecpTestScore: wecpData.percentage
                  });
                }
              }
            } else {
              this.logger.debug(`No match found for student ${student.studentId} (${student.registrationNumber}, ${student.emailId})`);
            }
          }
          
          this.logger.log(`Matched ${matchCount} students with WeCP candidates for test: ${testId}`);
          allWecpCandidates = [...allWecpCandidates, ...wecpCandidates];
        } catch (error) {
          this.logger.error(`Error fetching candidates from WeCP test ${testId}: ${error.message}`);
          // Continue with other test IDs
        }
      }
      
      if (allWecpCandidates.length === 0) {
        this.logger.warn(`No candidates found for any WeCP tests in drive: ${data.driveId}`);
        return; // Exit early if no candidates found
      }
      
      // Calculate average score of top 20% students from database
      const topPercentage = 0.2;
      const studentsWithScores = students.data
        .filter(s => typeof s.wecpTestScore === 'number')
        .sort((a, b) => (b.wecpTestScore || 0) - (a.wecpTestScore || 0));

      const topCount = Math.max(1, Math.floor(studentsWithScores.length * topPercentage));
      const topStudents = studentsWithScores.slice(0, topCount);
      
      const averagePercentage = topStudents.length > 0
        ? topStudents.reduce((sum, s) => sum + (s.wecpTestScore || 0), 0) / topStudents.length
        : 0;
      
      this.logger.log('Top students WeCP scores:', {
        totalStudents: students.data.length,
        studentsWithScores: studentsWithScores.length,
        topCount,
        averagePercentage: averagePercentage.toFixed(2) + '%'
      });
      
      // Get fresh student data after WeCP updates to ensure we have the latest GitHub URLs
      const studentsWithUpdatedGithub = await this.studentService.findAll(1, undefined, { driveId: data.driveId }, true);
      
      // Initialize job progress for GitHub phase
      await this.atomicUpdate(data.jobId, {
        $set: {
          'progress.github.total': students.data.length,
          'progress.resume.total': resumeEligibleCount,
          'progress.overall.status': EvaluationPhase.GITHUB
        }
      });

      // Process GitHub evaluations in parallel
      await this.processor.processGitHubEvaluationsInParallel(
        studentsWithUpdatedGithub.data,
        averagePercentage,
        { jobId: data.jobId, type: 'github', total: students.data.length }
      );

      // Update status for resume processing
      await this.atomicUpdate(data.jobId, {
        $set: {
          'progress.overall.status': EvaluationPhase.RESUME
        }
      });

      // Process resume evaluations
      const updatedStudents = await this.studentService.findAll(1, undefined, { driveId: data.driveId }, true);
      await this.processor.processResumeEvaluationsInParallel(
        updatedStudents.data,
        { jobId: data.jobId, type: 'resume', total: resumeEligibleCount }
      );
      
      // Update status for AI score calculation
      await this.atomicUpdate(data.jobId, {
        $set: {
          'progress.overall.status': EvaluationPhase.AI
        }
      });

      // Calculate AI scores for each student
      const studentsForAIScore = await this.studentService.findAll(1, undefined, { driveId: data.driveId }, true);
      for (const student of studentsForAIScore.data) {
        if (student.githubEvaluated && student.resumeEvaluated) {
          try {
            const aiScore = await this.aiScoreService.calculateScore({
              github: student.githubDetails,
              resume: student.resumeScore
            });
            
            await this.studentService.update(student.studentId, {
              aiScore: {
                total: aiScore.total || 0,
                components: {
                  github: aiScore.components?.github || { fullStack: 0, aiml: 0, contribution: 0 },
                  resume: aiScore.components?.resume || {
                    fullStack: { frontend: 0, backend: 0, database: 0, infrastructure: 0 },
                    aiml: { core: 0, genai: 0 }
                  }
                },
                expertise: aiScore.expertise || { fullStack: 'LOW', aiml: 'LOW' }
              }
            });
            
            this.logger.debug(`Updated AI score for student ${student.studentId}: ${aiScore.total}`);
          } catch (error) {
            this.logger.error(`Error calculating AI score for student ${student.studentId}: ${error.message}`);
          }
        }
      }
      
      // Get evaluation statistics
      const stats = await this.studentService.findAll(1, undefined, { driveId: data.driveId }, true);
      const totalStudents = stats.total;
      const githubEvaluatedCount = stats.data.filter(s => s.githubEvaluated).length;
      const resumeEvaluatedCount = stats.data.filter(s => s.resumeEvaluated).length;
      
      this.logger.log(`
Drive ${data.driveId} evaluation status:
- WeCP Evaluation: Complete
- GitHub Evaluation: ${githubEvaluatedCount === totalStudents ? 'Complete' : 'Incomplete'}
- Resume Evaluation: ${resumeEvaluatedCount === totalStudents ? 'Complete' : 'Incomplete'}
Total Students: ${totalStudents}
GitHub Evaluated: ${githubEvaluatedCount} (${Math.round((githubEvaluatedCount/totalStudents) * 100)}%)
Resume Evaluated: ${resumeEvaluatedCount} (${Math.round((resumeEvaluatedCount/totalStudents) * 100)}%)
      `);
      
      // Update job status to completed atomically
      await this.atomicUpdate(data.jobId, {
        $set: {
          status: JobStatus.COMPLETED,
          'progress.overall.status': EvaluationPhase.COMPLETED,
          'progress.overall.percentage': 100
        }
      });

      this.logger.log(`Full evaluation completed for drive: ${data.driveId}`);
    } catch (error) {
      this.logger.error(`Error in full evaluation for drive ${data.driveId}: ${error.message}`);
      
      // Update job status to failed atomically
      await this.atomicUpdate(data.jobId, {
        $set: {
          status: JobStatus.FAILED,
          error: error.message
        }
      });
      
      throw error;
    }
  }

  /**
   * Helper method to set message visibility timeout
   * @param message The SQS message
   */
  private async setMessageVisibility(message: AWS.SQS.Message): Promise<void> {
    try {
      await this.sqsService.changeMessageVisibility(message, this.VISIBILITY_TIMEOUT);
      this.logger.debug('Updated message visibility timeout to 1 hour', { 
        messageId: message.MessageId,
        timeoutSeconds: this.VISIBILITY_TIMEOUT
      });
    } catch (error) {
      this.logger.error('Failed to update message visibility timeout', {
        messageId: message.MessageId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Don't throw the error - we can continue processing even if visibility update fails
      // The default visibility timeout from receiveMessage will still be in effect
    }
  }
}
