import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(createCourseDto: CreateCourseDto) {
    // Verify department exists
    const department = await this.prisma.department.findUnique({
      where: { id: createCourseDto.departmentId },
    });

    if (!department) {
      throw new BadRequestException('Department not found');
    }

    // Verify semester exists
    const semester = await this.prisma.semester.findUnique({
      where: { id: createCourseDto.semesterId },
    });

    if (!semester) {
      throw new BadRequestException('Semester not found');
    }

    try {
      return await this.prisma.course.create({
        data: createCourseDto,
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
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Course with this code already exists in this semester');
      }
      throw error;
    }
  }

  async findAll(departmentId?: string, year?: number) {
    const where: any = {};

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (year) {
      where.targetYear = year;
    }

    return this.prisma.course.findMany({
      where,
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
        _count: {
          select: {
            enrollments: true,
            sections: true,
          },
        },
      },
      orderBy: [
        { semester: { isActive: 'desc' } },
        { targetYear: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
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
            startDate: true,
            endDate: true,
            isActive: true,
          },
        },
        sections: {
          include: {
            ta: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
        },
        schedules: {
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            assignments: true,
            posts: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async findSections(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.prisma.courseSection.findMany({
      where: { courseId },
      include: {
        ta: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        sectionNumber: 'asc',
      },
    });
  }

  async findSchedule(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.prisma.courseSchedule.findMany({
      where: { courseId },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
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
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });
  }

  async findEnrolledStudents(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.prisma.courseEnrollment.findMany({
      where: { 
        courseId,
        role: 'STUDENT',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            collegeId: true,
            currentYear: true,
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
      orderBy: {
        user: {
          lastName: 'asc',
        },
      },
    });
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    // Check if department exists if provided
    if (updateCourseDto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: updateCourseDto.departmentId },
      });

      if (!department) {
        throw new BadRequestException('Department not found');
      }
    }

    // Check if semester exists if provided
    if (updateCourseDto.semesterId) {
      const semester = await this.prisma.semester.findUnique({
        where: { id: updateCourseDto.semesterId },
      });

      if (!semester) {
        throw new BadRequestException('Semester not found');
      }
    }

    try {
      const course = await this.prisma.course.update({
        where: { id },
        data: updateCourseDto,
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
      });
      return course;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Course not found');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Course with this code already exists in this semester');
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.course.delete({
        where: { id },
      });
      return { message: 'Course deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Course not found');
      }
      throw error;
    }
  }
}
