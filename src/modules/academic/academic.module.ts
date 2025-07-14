import { Module } from '@nestjs/common';
import { DepartmentsModule } from './departments/departments.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';

@Module({
  imports: [
    DepartmentsModule,
    CoursesModule,
    EnrollmentsModule,
  ],
  exports: [
    DepartmentsModule,
    CoursesModule,
    EnrollmentsModule,
  ],
})
export class AcademicModule {}

