import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentController, DriveStudentRoundsController } from './student.controller';
import { Student, StudentSchema } from './student.schema';
import { StudentService } from './student.service';
import { StudentExportService } from './services/student-export.service';
import { CollegeModule } from '../../../college/src/lib/college.module';
import { DriveModule } from '../../../drive/src/lib/drive.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Student.name, schema: StudentSchema }]),
    CollegeModule,
    DriveModule,
  ],
  controllers: [StudentController, DriveStudentRoundsController],
  providers: [StudentService, StudentExportService],
  exports: [StudentService],
})
export class StudentModule {}
