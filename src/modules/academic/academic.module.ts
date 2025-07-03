import { Module } from '@nestjs/common';
import { DepartmentsModule } from './departments/departments.module';
import { SemestersModule } from './semesters/semesters.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';

@Module({
  imports: [
    DepartmentsModule,
    SemestersModule,
    CoursesModule,
    EnrollmentsModule,
  ],
  exports: [
    DepartmentsModule,
    SemestersModule,
    CoursesModule,
    EnrollmentsModule,
  ],
})
export class AcademicModule {}
