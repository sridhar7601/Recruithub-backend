import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { CollegeModule } from '@recruit-hub/college';
import { DriveModule } from '@recruit-hub/drive';
import { StudentModule } from '@recruit-hub/student';
import { UserModule } from '@recruit-hub/user';
import { PanelModule } from '@recruit-hub/panel';
import { AssignmentModule } from '@recruit-hub/assignment';
import { ProfileEvaluatorModule } from '@recruit-hub/profileEvaluator';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    CollegeModule,
    DriveModule,
    StudentModule,
    UserModule,
    PanelModule,
    AssignmentModule,
    ProfileEvaluatorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
