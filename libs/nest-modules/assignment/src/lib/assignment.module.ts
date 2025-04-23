import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';
import { Assignment, AssignmentSchema } from './assignment.schema';
import { StudentModule } from '../../../student/src/lib/student.module';
import { PanelModule } from '../../../panel/src/lib/panel.module';
import { CollegeModule } from '../../../college/src/lib/college.module';
import { DriveModule } from '../../../drive/src/lib/drive.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Assignment.name, schema: AssignmentSchema }]),
    StudentModule,
    PanelModule,
    CollegeModule,
    DriveModule,
  ],
  controllers: [AssignmentController],
  providers: [AssignmentService],
  exports: [AssignmentService],
})
export class AssignmentModule {}
