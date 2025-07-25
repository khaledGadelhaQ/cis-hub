# Chat Automation Integration Guide

## Overview

The chat automation system automatically creates and manages chat rooms when academic entities are created, updated, or deleted. This guide shows how to integrate the automation with your existing academic modules.

## Quick Start

### 1. Import ChatEventEmitterService

In any module that handles classes, sections, or enrollments, import the `ChatModule`:

```typescript
// academic.module.ts
import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { ClassesService } from './services/classes.service';

@Module({
  imports: [ChatModule],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class AcademicModule {}
```

### 2. Inject ChatEventEmitterService

```typescript
// classes.service.ts
import { Injectable } from '@nestjs/common';
import { ChatEventEmitterService } from '../../chat/services/chat-event-emitter.service';

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatEventEmitter: ChatEventEmitterService,
  ) {}
}
```

## Integration Examples

### Class Management

```typescript
// classes.service.ts
export class ClassesService {
  async createClass(createClassDto: CreateClassDto) {
    // Create the class
    const newClass = await this.prisma.courseClass.create({
      data: createClassDto,
      include: {
        course: {
          include: {
            department: true,
          },
        },
      },
    });

    // Emit chat automation event
    await this.chatEventEmitter.emitClassCreated({
      classId: newClass.id,
      courseId: newClass.courseId,
      classNumber: newClass.classNumber,
      courseCode: newClass.course.code,
      courseName: newClass.course.name,
      departmentCode: newClass.course.department.code,
      targetYear: newClass.course.targetYear,
    });

    return newClass;
  }

  async updateClass(id: string, updateClassDto: UpdateClassDto) {
    const updatedClass = await this.prisma.courseClass.update({
      where: { id },
      data: updateClassDto,
      include: {
        course: {
          include: {
            department: true,
          },
        },
      },
    });

    // Emit update event
    await this.chatEventEmitter.emitClassUpdated({
      classId: updatedClass.id,
      courseId: updatedClass.courseId,
      classNumber: updatedClass.classNumber,
      courseCode: updatedClass.course.code,
      courseName: updatedClass.course.name,
      departmentCode: updatedClass.course.department.code,
      targetYear: updatedClass.course.targetYear,
    });

    return updatedClass;
  }

  async deleteClass(id: string) {
    const classToDelete = await this.prisma.courseClass.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            department: true,
          },
        },
      },
    });

    await this.prisma.courseClass.delete({
      where: { id },
    });

    // Emit deletion event
    await this.chatEventEmitter.emitClassDeleted({
      classId: id,
      courseId: classToDelete.courseId,
      classNumber: classToDelete.classNumber,
      courseCode: classToDelete.course.code,
      courseName: classToDelete.course.name,
      departmentCode: classToDelete.course.department.code,
      targetYear: classToDelete.course.targetYear,
    });

    return { success: true };
  }
}
```

### Section Management

```typescript
// sections.service.ts
export class SectionsService {
  async createSection(createSectionDto: CreateSectionDto) {
    const newSection = await this.prisma.courseSection.create({
      data: createSectionDto,
      include: {
        course: {
          include: {
            department: true,
          },
        },
        ta: true,
      },
    });

    // Emit section creation event
    await this.chatEventEmitter.emitSectionCreated({
      sectionId: newSection.id,
      courseId: newSection.courseId,
      taId: newSection.taId,
      sectionNumber: newSection.sectionNumber,
      courseCode: newSection.course.code,
      courseName: newSection.course.name,
      departmentCode: newSection.course.department.code,
      targetYear: newSection.course.targetYear,
      taFirstName: newSection.ta.firstName,
      taLastName: newSection.ta.lastName,
    });

    return newSection;
  }

  async updateSection(id: string, updateSectionDto: UpdateSectionDto) {
    // Get previous data for comparison
    const previousSection = await this.prisma.courseSection.findUnique({
      where: { id },
      include: { ta: true },
    });

    const updatedSection = await this.prisma.courseSection.update({
      where: { id },
      data: updateSectionDto,
      include: {
        course: {
          include: {
            department: true,
          },
        },
        ta: true,
      },
    });

    // Emit update event with previous TA info
    await this.chatEventEmitter.emitSectionUpdated({
      sectionId: updatedSection.id,
      courseId: updatedSection.courseId,
      taId: updatedSection.taId,
      previousTaId: previousSection.taId,
      sectionNumber: updatedSection.sectionNumber,
      courseCode: updatedSection.course.code,
      courseName: updatedSection.course.name,
      departmentCode: updatedSection.course.department.code,
      targetYear: updatedSection.course.targetYear,
      taFirstName: updatedSection.ta.firstName,
      taLastName: updatedSection.ta.lastName,
    });

    return updatedSection;
  }
}
```

### Enrollment Management

```typescript
// enrollments.service.ts
export class EnrollmentsService {
  async createEnrollment(createEnrollmentDto: CreateEnrollmentDto) {
    const newEnrollment = await this.prisma.courseEnrollment.create({
      data: createEnrollmentDto,
      include: {
        course: true,
        class: true,
        section: true,
      },
    });

    // Emit enrollment creation event
    await this.chatEventEmitter.emitEnrollmentCreated({
      enrollmentId: newEnrollment.id,
      userId: newEnrollment.userId,
      courseId: newEnrollment.courseId,
      classId: newEnrollment.classId,
      sectionId: newEnrollment.sectionId,
      role: newEnrollment.role,
    });

    return newEnrollment;
  }

  async removeEnrollment(id: string) {
    const enrollmentToRemove = await this.prisma.courseEnrollment.findUnique({
      where: { id },
    });

    await this.prisma.courseEnrollment.delete({
      where: { id },
    });

    // Emit enrollment removal event
    await this.chatEventEmitter.emitEnrollmentRemoved({
      enrollmentId: id,
      userId: enrollmentToRemove.userId,
      courseId: enrollmentToRemove.courseId,
      classId: enrollmentToRemove.classId,
      sectionId: enrollmentToRemove.sectionId,
      role: enrollmentToRemove.role,
    });

    return { success: true };
  }
}
```

### Professor Assignment

```typescript
// professors.service.ts
export class ProfessorsService {
  async assignProfessorToClass(classId: string, professorId: string) {
    // Update the class with professor assignment
    await this.prisma.courseClass.update({
      where: { id: classId },
      data: { professorId },
    });

    // Emit professor assignment event
    await this.chatEventEmitter.emitProfessorAssigned({
      classId,
      professorId,
    });

    return { success: true };
  }

  async removeProfessorFromClass(classId: string, professorId: string) {
    // Remove professor from class
    await this.prisma.courseClass.update({
      where: { id: classId },
      data: { professorId: null },
    });

    // Emit professor removal event
    await this.chatEventEmitter.emitProfessorRemoved({
      classId,
      professorId,
    });

    return { success: true };
  }
}
```

## Data Migration

For existing data, you can create a migration script:

```typescript
// scripts/migrate-chat-rooms.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ChatEventEmitterService } from '../src/modules/chat/services/chat-event-emitter.service';
import { PrismaService } from '../prisma/prisma.service';

async function migrateExistingData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const chatEventEmitter = app.get(ChatEventEmitterService);
  const prisma = app.get(PrismaService);

  // Get all existing classes
  const classes = await prisma.courseClass.findMany({
    include: {
      course: {
        include: {
          department: true,
        },
      },
    },
  });

  // Create chat rooms for existing classes
  for (const cls of classes) {
    await chatEventEmitter.emitClassCreated({
      classId: cls.id,
      courseId: cls.courseId,
      classNumber: cls.classNumber,
      courseCode: cls.course.code,
      courseName: cls.course.name,
      departmentCode: cls.course.department.code,
      targetYear: cls.course.targetYear,
    });
  }

  // Get all existing sections
  const sections = await prisma.courseSection.findMany({
    include: {
      course: {
        include: {
          department: true,
        },
      },
      ta: true,
    },
  });

  // Create section rooms for existing sections
  for (const section of sections) {
    await chatEventEmitter.emitSectionCreated({
      sectionId: section.id,
      courseId: section.courseId,
      taId: section.taId,
      sectionNumber: section.sectionNumber,
      courseCode: section.course.code,
      courseName: section.course.name,
      departmentCode: section.course.department.code,
      targetYear: section.course.targetYear,
      taFirstName: section.ta.firstName,
      taLastName: section.ta.lastName,
    });
  }

  // Get all existing enrollments
  const enrollments = await prisma.courseEnrollment.findMany();

  // Add users to chat rooms for existing enrollments
  for (const enrollment of enrollments) {
    await chatEventEmitter.emitEnrollmentCreated({
      enrollmentId: enrollment.id,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      classId: enrollment.classId,
      sectionId: enrollment.sectionId,
      role: enrollment.role,
    });
  }

  console.log('Migration completed successfully!');
  await app.close();
}

migrateExistingData().catch(console.error);
```

## Error Handling

The chat automation system includes comprehensive error handling and logging. If an event fails to process, it won't break your main academic operations. Monitor the logs for any issues:

```typescript
// The automation service logs all operations
// Check logs for patterns like:
// "Successfully created chat room {id} for class {classId}"
// "Failed to create chat room for class {classId}: {error}"
```

## Testing

Test the integration by creating classes, sections, and enrollments and checking that:

1. Chat rooms are created automatically
2. Users are added to appropriate rooms
3. Room names follow the expected format
4. Professors and TAs get admin roles
5. Students get member roles

## Next Steps

1. **Integrate with your existing services** by adding the event emitter calls
2. **Run the migration script** for existing data
3. **Monitor the logs** to ensure everything works correctly
4. **Test the chat functionality** in the frontend
5. **Add custom room management** features as needed
