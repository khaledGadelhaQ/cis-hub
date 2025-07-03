import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { AssignTaDto } from './dto/assign-ta.dto';
import { AssignSectionDto } from './dto/assign-section.dto';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async getMyCourses(userId: string) {
    return this.prisma.courseEnrollment.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        course: {
          include: {
            department: {
              select: {
                name: true,
                code: true,
              },
            },
            semester: {
              select: {
                name: true,
                isActive: true,
              },
            },
          },
        },
        class: {
          select: {
            classNumber: true,
          },
        },
        section: {
          select: {
            sectionNumber: true,
            ta: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        course: {
          name: 'asc',
        },
      },
    });
  }

  async enrollStudent(enrollStudentDto: EnrollStudentDto) {
    const { courseId, userId, classId, sectionId, role } = enrollStudentDto;

    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new BadRequestException('Course not found');
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify class exists if provided
    if (classId) {
      const courseClass = await this.prisma.courseClass.findUnique({
        where: { id: classId },
      });

      if (!courseClass || courseClass.courseId !== courseId) {
        throw new BadRequestException('Class not found or does not belong to this course');
      }
    }

    // Verify section exists if provided
    if (sectionId) {
      const section = await this.prisma.courseSection.findUnique({
        where: { id: sectionId },
      });

      if (!section || section.courseId !== courseId) {
        throw new BadRequestException('Section not found or does not belong to this course');
      }

      // Check section capacity if enrolling as student
      if (role === 'STUDENT') {
        const currentEnrollments = await this.prisma.courseEnrollment.count({
          where: {
            sectionId,
            role: 'STUDENT',
            status: 'ACTIVE',
          },
        });

        if (currentEnrollments >= section.maxStudents) {
          throw new BadRequestException('Section is full');
        }
      }
    }

    try {
      return await this.prisma.courseEnrollment.create({
        data: {
          courseId,
          userId,
          classId,
          sectionId,
          role: role || 'STUDENT',
        },
        include: {
          course: {
            select: {
              name: true,
              code: true,
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          class: {
            select: {
              classNumber: true,
            },
          },
          section: {
            select: {
              sectionNumber: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('User is already enrolled in this course');
      }
      throw error;
    }
  }

  async assignSection(enrollmentId: string, assignSectionDto: AssignSectionDto) {
    const { sectionId } = assignSectionDto;

    // Verify enrollment exists
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    // Verify section exists and belongs to the same course
    const section = await this.prisma.courseSection.findUnique({
      where: { id: sectionId },
    });

    if (!section || section.courseId !== enrollment.courseId) {
      throw new BadRequestException('Section not found or does not belong to this course');
    }

    // Check section capacity if student
    if (enrollment.role === 'STUDENT') {
      const currentEnrollments = await this.prisma.courseEnrollment.count({
        where: {
          sectionId,
          role: 'STUDENT',
          status: 'ACTIVE',
        },
      });

      if (currentEnrollments >= section.maxStudents) {
        throw new BadRequestException('Section is full');
      }
    }

    return this.prisma.courseEnrollment.update({
      where: { id: enrollmentId },
      data: { sectionId },
      include: {
        course: {
          select: {
            name: true,
            code: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        section: {
          select: {
            sectionNumber: true,
          },
        },
      },
    });
  }

  async assignTa(assignTaDto: AssignTaDto) {
    const { courseId, taId, sectionIds } = assignTaDto;

    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new BadRequestException('Course not found');
    }

    // Verify TA exists and has TA role
    const ta = await this.prisma.user.findUnique({
      where: { id: taId },
    });

    if (!ta || ta.role !== 'TA') {
      throw new BadRequestException('User not found or is not a TA');
    }

    // Verify all sections exist and belong to the course
    const sections = await this.prisma.courseSection.findMany({
      where: {
        id: { in: sectionIds },
        courseId,
      },
    });

    if (sections.length !== sectionIds.length) {
      throw new BadRequestException('One or more sections not found or do not belong to this course');
    }

    // Update sections to assign the TA
    await this.prisma.courseSection.updateMany({
      where: {
        id: { in: sectionIds },
      },
      data: {
        taId,
      },
    });

    // Enroll TA in the course if not already enrolled
    const existingEnrollment = await this.prisma.courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId: taId,
        },
      },
    });

    if (!existingEnrollment) {
      await this.prisma.courseEnrollment.create({
        data: {
          courseId,
          userId: taId,
          role: 'TA',
        },
      });
    }

    return { message: 'TA assigned to sections successfully' };
  }

  async removeEnrollment(enrollmentId: string) {
    try {
      await this.prisma.courseEnrollment.delete({
        where: { id: enrollmentId },
      });
      return { message: 'Enrollment removed successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Enrollment not found');
      }
      throw error;
    }
  }

  async findOne(enrollmentId: string) {
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            department: {
              select: {
                name: true,
                code: true,
              },
            },
            semester: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            collegeId: true,
          },
        },
        class: {
          select: {
            classNumber: true,
          },
        },
        section: {
          select: {
            sectionNumber: true,
            ta: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return enrollment;
  }
}
