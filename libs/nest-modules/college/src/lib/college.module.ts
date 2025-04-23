import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { College, CollegeSchema } from './college.schema';
import { CollegeService } from './college.service';
import { CollegeController } from './college.controller';

/**
 * This module sets up the `College` feature in the application.
 *
 * @see [Figma Design](https://www.figma.com/design/xeBQqVWlWMMvLGArwl13hM/RecruitHub?node-id=634-112808&t=IF8epM2kBz5laBWB-4)
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ schema: CollegeSchema, name: College.name }]),
  ],
  controllers: [CollegeController],
  providers: [CollegeService],
  exports: [CollegeService],
})
export class CollegeModule {}
