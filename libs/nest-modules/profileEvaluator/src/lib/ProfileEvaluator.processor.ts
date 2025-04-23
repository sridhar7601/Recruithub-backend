import { Injectable } from '@nestjs/common';
import { CustomLogger } from './utils/custom.logger';
import { StudentService } from '../../../student/src/lib/student.service';
import { GitHubScoreService } from './services/github-score.service';
import { WecpService } from './services/wecp.service';
import { ResumeScoreService } from './services/resume-score.service';
import { ConfigService } from '@nestjs/config';
import { Student } from '../../../student/src/lib/student.schema';
import { ProfileEvaluatorJob } from './ProfileEvaluator.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

interface JobStatusUpdate {
  jobId: string;
  type: 'github' | 'resume';
  total: number;
}

@Injectable()
export class ProfileEvaluatorProcessor {
  private readonly logger = new CustomLogger(ProfileEvaluatorProcessor.name);

  constructor(
    private readonly studentService: StudentService,
    private readonly githubScoreService: GitHubScoreService,
    private readonly wecpService: WecpService,
    private readonly configService: ConfigService,
    private readonly resumeScoreService: ResumeScoreService,
    @InjectModel(ProfileEvaluatorJob.name)
    private jobModel: Model<ProfileEvaluatorJob>
  ) {}

  /**
   * Helper method to update job progress atomically
   */
  private async updateProgress(
    jobId: string, 
    type: 'github' | 'resume',
    { success, total }: { success: boolean; total: number }
  ): Promise<void> {
    const update = {
      $inc: {
        [`progress.${type}.completed`]: 1,
        [`progress.${type}.${success ? 'success' : 'failed'}`]: 1
      }
    };

    try {
      const job = await this.jobModel.findOneAndUpdate(
        { jobId },
        update,
        { new: true }
      ).lean();
      
      if (!job) {
        this.logger.warn(`Job not found for progress update: ${jobId}`);
        return;
      }

      // Calculate and update overall progress atomically
      const totalCompleted = (job.progress?.github?.completed || 0) + (job.progress?.resume?.completed || 0);
      const totalItems = total * 2; // GitHub + Resume for each student
      const percentage = Math.round((totalCompleted / totalItems) * 100);

      await this.jobModel.findOneAndUpdate(
        { jobId },
        {
          $set: {
            'progress.overall.percentage': percentage
          }
        }
      );
    } catch (error) {
      this.logger.error(`Error updating progress: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process a single student's GitHub evaluation
   * @param student The student to evaluate
   * @param averagePercentage Optional average percentage for consideration in full evaluation mode
   * @returns Promise resolving to the updated student or null if skipped/error
   */
  async processGitHubEvaluation(student: Student, averagePercentage?: number): Promise<Student | null> {
    try {
      // Handle students without GitHub URL
      if (!student.githubProfile) {
        return await this.studentService.update(student.studentId, {
          githubDetails: {
            totalScore: 0,
            domainScore: 0,
            contributionScore: 0,
            domains: JSON.stringify({}),
            technologies: '',
            consideration: false,
            error: 'No GitHub profile URL provided',
            lastAttempt: new Date(),
            retryCount: 0,
            isProcessing: false
          },
          githubEvaluated: true
        });
      }
      
      // Skip students that have already been evaluated successfully
      if (student.githubEvaluated && !student.githubDetails?.error) {
        this.logger.log(`Student ${student.studentId} has already been evaluated successfully, skipping`);
        return student;
      }
      
      // Extract GitHub username
      const githubUsername = this.githubScoreService.extractGithubUsername(student.githubProfile);
      if (!githubUsername) {
        this.logger.warn(`Invalid GitHub URL for student ${student.studentId}: ${student.githubProfile}`);
        
        // Update student record with error
        const updateData = {
          githubDetails: {
            totalScore: 0,
            domainScore: 0,
            contributionScore: 0,
            domains: JSON.stringify({}),
            technologies: '',
            consideration: false,
            error: `Invalid GitHub URL: ${student.githubProfile}`,
            lastAttempt: new Date(),
            retryCount: 0,
            isProcessing: false
          },
          githubEvaluated: true
        };
        
        return await this.studentService.update(student.studentId, updateData);
      }
      
      // Calculate GitHub score
      const score = await this.githubScoreService.calculateScore(githubUsername);
      
      // Determine consideration status
      let consideration = false;
      if (averagePercentage !== undefined) {
        // Full evaluation mode
        if (student.wecpTestScore > averagePercentage) {
          consideration = true;
        }
      }
      
      // Create update object with GitHub details and evaluation flag
      const updateData = {
        githubDetails: {
          totalScore: score.total,
          domainScore: score.domainScore,
          contributionScore: score.contributionScore,
          domains: JSON.stringify(score.domains),
          technologies: score.technologies.join(', '),
          consideration,
          error: score.error,
          lastAttempt: new Date(),
          retryCount: student.githubDetails?.retryCount || 0,
          isProcessing: false
        },
        githubEvaluated: true
      };
      
      // Update student record
      const updatedStudent = await this.studentService.update(student.studentId, updateData);
      
      // Log the update
      if (score.error) {
        this.logger.warn(`GitHub evaluation for student ${student.studentId} completed with error: ${score.error}`);
      } else {
        this.logger.debug(`Updated GitHub score for student ${student.studentId}: ${score.total}`);
      }
      
      return updatedStudent;
    } catch (error) {
      this.logger.error(`Error processing student ${student.studentId}: ${error.message}`);
      
      try {
        // Update student record with error
        const updateData = {
          githubDetails: {
            totalScore: 0,
            domainScore: 0,
            contributionScore: 0,
            domains: JSON.stringify({}),
            technologies: '',
            consideration: false,
            error: `Processing error: ${error.message}`,
            lastAttempt: new Date(),
            retryCount: (student.githubDetails?.retryCount || 0) + 1,
            isProcessing: false
          },
          githubEvaluated: true
        };
        
        return await this.studentService.update(student.studentId, updateData);
      } catch (updateError) {
        this.logger.error(`Failed to update student ${student.studentId} with error: ${updateError.message}`);
        return null;
      }
    }
  }

  /**
   * Process GitHub evaluations in parallel batches
   * @param students List of students to evaluate
   * @param averagePercentage Optional average percentage for consideration in full evaluation mode
   */
  async processGitHubEvaluationsInParallel(
    students: Student[], 
    averagePercentage?: number,
    jobStatus?: JobStatusUpdate
  ): Promise<void> {
    const parallelLimit = this.configService.get<number>('GITHUB_PARALLEL_LIMIT') || 5;
    const maxRetries = this.configService.get<number>('GITHUB_MAX_RETRIES') || 3;
    
    // Filter and count students by GitHub profile status
    const studentsWithGithub = students.filter(s => s.githubProfile);
    const studentsWithoutGithub = students.filter(s => !s.githubProfile);
    
    // Log consolidated GitHub profile status
    this.logger.log('GitHub Profile Status:', {
      totalStudents: students.length,
      withGithub: {
        count: studentsWithGithub.length,
        percentage: ((studentsWithGithub.length / students.length) * 100).toFixed(2) + '%'
      },
      withoutGithub: {
        count: studentsWithoutGithub.length,
        percentage: ((studentsWithoutGithub.length / students.length) * 100).toFixed(2) + '%'
      }
    });
    
    // Filter students that need evaluation
    const studentsToEvaluate = students.filter(student => 
      // Include students that:
      // 1. Haven't been evaluated yet
      // 2. Have errors but haven't exceeded retry limit
      // 3. Aren't currently being processed
      (!student.githubEvaluated || 
       (student.githubDetails?.error && 
        (student.githubDetails?.retryCount || 0) < maxRetries)) &&
      !student.githubDetails?.isProcessing
    );
    
    if (studentsToEvaluate.length === 0) {
      this.logger.log('No students require GitHub evaluation');
      return;
    }
    
    this.logger.log(`Starting GitHub evaluation for ${studentsToEvaluate.length} students with parallel limit: ${parallelLimit}`);
    
    // Process in batches
    let processedCount = 0;
    const totalStudents = studentsToEvaluate.length;
    
    // Collect all students into batches first
    const batches: Student[][] = [];
    for (let i = 0; i < totalStudents; i += parallelLimit) {
      batches.push(studentsToEvaluate.slice(i, i + parallelLimit));
    }
    
    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      this.logger.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} students)`);
      
      // Mark batch students as processing
      await Promise.all(
        batch.map(student => this.studentService.update(student.studentId, {
          githubDetails: {
            ...student.githubDetails,
            isProcessing: true
          }
        }))
      );
      
      try {
        // Check rate limit before processing batch
        const rateLimit = await this.githubScoreService.checkRateLimit();
        if (rateLimit.remaining < batch.length * 2) {
          const waitTime = Math.ceil((rateLimit.reset.getTime() - Date.now()) / 1000);
          this.logger.warn(`Rate limit too low, waiting ${waitTime}s for reset`);
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        }
        
        // Process batch in parallel
        const results = await Promise.all(
          batch.map(async student => {
            try {
              const result = await this.processGitHubEvaluation(student, averagePercentage);
              if (result?.githubDetails?.error) {
                // Increment retry count on error
                await this.studentService.update(student.studentId, {
                  githubDetails: {
                    ...student.githubDetails,
                    retryCount: (student.githubDetails?.retryCount || 0) + 1,
                    isProcessing: false
                  }
                });
              } else {
                // Reset processing flag on success
                await this.studentService.update(student.studentId, {
                  githubDetails: {
                    ...student.githubDetails,
                    isProcessing: false
                  }
                });
              }
              return result;
            } catch (error) {
              // Reset processing flag and increment retry count on error
              await this.studentService.update(student.studentId, {
                githubDetails: {
                  ...student.githubDetails,
                  retryCount: (student.githubDetails?.retryCount || 0) + 1,
                  isProcessing: false
                }
              });
              throw error;
            }
          })
        );
        
        // Update processed count
        processedCount += batch.length;
        
        // Log progress
        const successCount = results.filter(result => result !== null && !result.githubDetails?.error).length;
        const errorCount = results.filter(result => result?.githubDetails?.error).length;
        const maxRetriesCount = results.filter(result => 
          result?.githubDetails?.retryCount >= maxRetries
        ).length;
        
        this.logger.log(
          `Batch completed: ${successCount}/${batch.length} processed, ${errorCount} with errors, ${maxRetriesCount} reached max retries. ` +
          `Overall progress: ${processedCount}/${totalStudents} (${Math.round((processedCount/totalStudents) * 100)}%)`
        );

        // Update job status for each student if provided
        if (jobStatus) {
          for (const result of results) {
            await this.updateProgress(jobStatus.jobId, jobStatus.type, {
              success: result !== null && !result?.githubDetails?.error,
              total: jobStatus.total
            });
          }
        }
        
        // Add delay between batches
        const delaySeconds = 2;
        this.logger.debug(`Adding ${delaySeconds}s delay between batches`);
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        
      } catch (error) {
        // Reset processing flag for all students in batch on catastrophic error
        await Promise.all(
          batch.map(student => this.studentService.update(student.studentId, {
            githubDetails: {
              ...student.githubDetails,
              isProcessing: false
            }
          }))
        );
        this.logger.error(`Error processing batch: ${error.message}`);
      }
    }
    
    this.logger.log(`GitHub evaluation completed for ${totalStudents} students`);
  }

  /**
   * Process a single student's resume evaluation
   * @param student The student to evaluate
   * @returns Promise resolving to the updated student or null if skipped/error
   */
  async processResumeEvaluation(student: Student): Promise<Student | null> {
    try {
      // Handle students without resume URL
      if (!student.resumeUrl) {
        return await this.studentService.update(student.studentId, {
          resumeEvaluated: true,
          lastResumeEvaluation: new Date(),
          resumeScore: {
            totalScore: 0,
            baseScore: 0,
            backgroundBonus: {
              points: 0,
              breakdown: {
                fullStackProficiency: 0,
                additionalSkills: 0
              },
              justification: 'No resume provided'
            },
            technicalFoundationScore: 0,
            projectsPracticalExperienceScore: 0,
            learningAdaptabilityScore: 0,
            summary: 'No resume available for evaluation',
            standoutFactors: 'None - no resume provided',
            stackAnalysis: {
              frontend: { score: 0, technologies: [], expertise: 'LOW' },
              backend: { score: 0, technologies: [], expertise: 'LOW' },
              database: { score: 0, technologies: [], expertise: 'LOW' },
              infrastructure: { score: 0, technologies: [], expertise: 'LOW' }
            },
            projectHighlights: {
              bestProjects: [],
              technicalComplexity: 'LOW',
              architecturalPatterns: []
            },
            careerReadiness: {
              level: 'LOW',
              strengths: [],
              areasForImprovement: ['No resume provided for evaluation']
            },
            recommendedRoles: [],
            growthPotential: 'Cannot be determined - no resume provided',
            error: 'No resume URL provided',
            retryCount: 0,
            isProcessing: false
          }
        });
      }
      
      // Skip students that have already been evaluated successfully
      if (student.resumeEvaluated && !student.resumeScore?.error) {
        this.logger.log(`Student ${student.studentId} resume has already been evaluated, skipping`);
        return student;
      }
      
      // Skip students that haven't completed GitHub evaluation
      if (!student.githubEvaluated) {
        this.logger.warn(`Student ${student.studentId} GitHub evaluation not complete, skipping resume evaluation`);
        return student;
      }
      
      this.logger.log(`Processing resume for student ${student.studentId} with degree: ${student.degree || 'Unknown'}`);
      
      try {
        // Extract text from PDF
        const resumeText = await this.resumeScoreService.extractTextFromPDF(student.resumeUrl);
        
        // Evaluate resume
        const resumeScore = await this.resumeScoreService.evaluateResume(resumeText, student.degree || 'Unknown');
        
        // Update student with resume score
        const updatedStudent = await this.studentService.update(student.studentId, {
          resumeScore: {
            ...resumeScore,
            retryCount: student.resumeScore?.retryCount || 0,
            isProcessing: false
          },
          resumeEvaluated: true,
          lastResumeEvaluation: new Date()
        });
        
        this.logger.log(`Updated resume score for student ${student.studentId}: ${resumeScore.totalScore}`);
        
        return updatedStudent;
      } catch (error) {
        this.logger.error(`Error evaluating resume for student ${student.studentId}: ${error.message}`);
        
        // Update student with error
        const updatedStudent = await this.studentService.update(student.studentId, {
          resumeEvaluated: true,
          lastResumeEvaluation: new Date(),
          resumeScore: {
            totalScore: 0,
            baseScore: 0,
            backgroundBonus: {
              points: 0,
              breakdown: {
                fullStackProficiency: 0,
                additionalSkills: 0
              },
              justification: 'Error during evaluation'
            },
            technicalFoundationScore: 0,
            projectsPracticalExperienceScore: 0,
            learningAdaptabilityScore: 0,
            summary: 'Error evaluating resume',
            standoutFactors: 'None due to evaluation error',
            stackAnalysis: {
              frontend: { score: 0, technologies: [], expertise: 'LOW' },
              backend: { score: 0, technologies: [], expertise: 'LOW' },
              database: { score: 0, technologies: [], expertise: 'LOW' },
              infrastructure: { score: 0, technologies: [], expertise: 'LOW' }
            },
            projectHighlights: {
              bestProjects: [],
              technicalComplexity: 'LOW',
              architecturalPatterns: []
            },
            careerReadiness: {
              level: 'LOW',
              strengths: [],
              areasForImprovement: ['Resume evaluation failed']
            },
            recommendedRoles: [],
            growthPotential: 'Unknown due to evaluation error',
            error: error.message,
            retryCount: (student.resumeScore?.retryCount || 0) + 1,
            isProcessing: false
          }
        });
        
        return updatedStudent;
      }
    } catch (error) {
      this.logger.error(`Error processing resume for student ${student.studentId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Process resume evaluations in parallel batches
   * @param students List of students to evaluate
   */
  async processResumeEvaluationsInParallel(
    students: Student[],
    jobStatus?: JobStatusUpdate
  ): Promise<void> {
    const parallelLimit = this.configService.get<number>('RESUME_PARALLEL_LIMIT') || 5;
    const maxRetries = this.configService.get<number>('RESUME_MAX_RETRIES') || 3;
    
    // Filter and count students by resume status
    const studentsWithResume = students.filter(s => s.resumeUrl);
    const studentsWithoutResume = students.filter(s => !s.resumeUrl);
    
    // Log consolidated resume status
    this.logger.log('Resume Status:', {
      totalStudents: students.length,
      withResume: {
        count: studentsWithResume.length,
        percentage: ((studentsWithResume.length / students.length) * 100).toFixed(2) + '%'
      },
      withoutResume: {
        count: studentsWithoutResume.length,
        percentage: ((studentsWithoutResume.length / students.length) * 100).toFixed(2) + '%'
      }
    });
    
    // Filter students that need evaluation
    const studentsToEvaluate = students.filter(student => 
      // Include students that:
      // 1. Have completed GitHub evaluation
      // 2. Haven't been evaluated yet or have errors but haven't exceeded retry limit
      // 3. Aren't currently being processed
      student.githubEvaluated && 
      (!student.resumeEvaluated || 
       (student.resumeScore?.error && 
        (student.resumeScore?.retryCount || 0) < maxRetries)) &&
      !student.resumeScore?.isProcessing
    );
    
    if (studentsToEvaluate.length === 0) {
      this.logger.log('No students require resume evaluation');
      return;
    }
    
    this.logger.log(`Starting resume evaluation for ${studentsToEvaluate.length} students with parallel limit: ${parallelLimit}`);
    
    // Process in batches
    let processedCount = 0;
    const totalStudents = studentsToEvaluate.length;
    
    // Collect all students into batches first
    const batches: Student[][] = [];
    for (let i = 0; i < totalStudents; i += parallelLimit) {
      batches.push(studentsToEvaluate.slice(i, i + parallelLimit));
    }
    
    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      this.logger.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} students)`);
      
      // Mark batch students as processing
      await Promise.all(
        batch.map(student => this.studentService.update(student.studentId, {
          resumeScore: {
            ...(student.resumeScore || {}),
            isProcessing: true
          }
        }))
      );
      
      try {
        // Process batch in parallel
        const results = await Promise.all(
          batch.map(async student => {
            try {
              const result = await this.processResumeEvaluation(student);
              if (result?.resumeScore?.error) {
                // Increment retry count on error
                await this.studentService.update(student.studentId, {
                  resumeScore: {
                    ...(student.resumeScore || {}),
                    retryCount: (student.resumeScore?.retryCount || 0) + 1,
                    isProcessing: false
                  }
                });
              } else {
                // Reset processing flag on success
                await this.studentService.update(student.studentId, {
                  resumeScore: {
                    ...(result?.resumeScore || {}),
                    isProcessing: false
                  }
                });
              }
              return result;
            } catch (error) {
              // Reset processing flag and increment retry count on error
              await this.studentService.update(student.studentId, {
                resumeScore: {
                  ...(student.resumeScore || {}),
                  retryCount: (student.resumeScore?.retryCount || 0) + 1,
                  isProcessing: false,
                  error: error.message
                }
              });
              throw error;
            }
          })
        );
        
        // Update processed count
        processedCount += batch.length;
        
        // Log progress
        const successCount = results.filter(result => result !== null && !result.resumeScore?.error).length;
        const errorCount = results.filter(result => result?.resumeScore?.error).length;
        const maxRetriesCount = results.filter(result => 
          result?.resumeScore?.retryCount >= maxRetries
        ).length;
        
        this.logger.log(
          `Batch completed: ${successCount}/${batch.length} processed, ${errorCount} with errors, ${maxRetriesCount} reached max retries. ` +
          `Overall progress: ${processedCount}/${totalStudents} (${Math.round((processedCount/totalStudents) * 100)}%)`
        );

        // Update job status for each student if provided
        if (jobStatus) {
          for (const result of results) {
            await this.updateProgress(jobStatus.jobId, jobStatus.type, {
              success: result !== null && !result?.resumeScore?.error,
              total: jobStatus.total
            });
          }
        }
        
        // Add delay between batches
        const delaySeconds = 2;
        this.logger.debug(`Adding ${delaySeconds}s delay between batches`);
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        
      } catch (error) {
        // Reset processing flag for all students in batch on catastrophic error
        await Promise.all(
          batch.map(student => this.studentService.update(student.studentId, {
            resumeScore: {
              ...(student.resumeScore || {}),
              isProcessing: false
            }
          }))
        );
        this.logger.error(`Error processing batch: ${error.message}`);
      }
    }
    
    this.logger.log(`Resume evaluation completed for ${totalStudents} students`);
  }
}
