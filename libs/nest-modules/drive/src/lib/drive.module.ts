import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DriveService } from './drive.service';
import { DriveController } from './drive.controller';
import { Drive, DriveSchema } from './drive.schema';
import { CollegeModule } from '../../../college/src/lib/college.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Drive.name, schema: DriveSchema }]),
    CollegeModule,
  ],
  controllers: [DriveController],
  providers: [DriveService],
  exports: [DriveService],
})
export class DriveModule {}
