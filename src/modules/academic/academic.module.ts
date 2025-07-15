import { Module } from '@nestjs/common';
import { DepartmentsModule } from './departments/departments.module';
import { CoursesModule } from './courses/courses.module';

@Module({
  imports: [
    DepartmentsModule,
    CoursesModule,
  ],
  exports: [
    DepartmentsModule,
    CoursesModule,
  ],
})
export class AcademicModule {}

