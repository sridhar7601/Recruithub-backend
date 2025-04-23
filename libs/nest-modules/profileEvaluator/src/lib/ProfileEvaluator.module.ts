import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileEvaluatorJob, ProfileEvaluatorJobSchema } from './ProfileEvaluator.schema';
import { ProfileEvaluatorConsumer } from './ProfileEvaluator.consumer';
import { ProfileEvaluatorProcessor } from './ProfileEvaluator.processor';
import { ProfileEvaluatorController } from './ProfileEvaluator.controller';
import { ProfileEvaluatorService } from './ProfileEvaluator.service';
import { StudentModule } from '../../../student/src/lib/student.module';
import { DriveModule } from '../../../drive/src/lib/drive.module';
import { SQSModule } from '../../../../utils/src/lib/services/sqs.module';
import { AIScoreService } from './services/ai-score.service';
import { WecpService } from './services/wecp.service';
import { GitHubScoreService } from './services/github-score.service';
import { ResumeScoreService } from './services/resume-score.service';
import { DomainService } from './services/domain.service';

@Module({
  imports: [
    ConfigModule,
    SQSModule,
    StudentModule,
    DriveModule,
    HttpModule,
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: ProfileEvaluatorJob.name, schema: ProfileEvaluatorJobSchema }
    ])
  ], 
  controllers: [
    ProfileEvaluatorController
  ],
  providers: [
    ProfileEvaluatorService,
    ProfileEvaluatorConsumer,
    ProfileEvaluatorProcessor,
    AIScoreService,
    WecpService,
    GitHubScoreService,
    ResumeScoreService,
    DomainService
  ],
  exports: [
    ProfileEvaluatorConsumer
  ]
})
export class ProfileEvaluatorModule {}
