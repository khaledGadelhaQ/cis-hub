import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { 
  CreateCourseClassDto, 
  CreateCourseSectionDto, 
  CreateCourseEnrollmentDto,
  AssignClassProfessorDto,
  UpdateCourseClassDto,
  UpdateCourseSectionDto
} from './dto/course-management.dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  // ================================
  // COURSE CRUD OPERATIONS
  // ================================

  async create(createCourseDto: CreateCourseDto) {
    // Verify department exists
    const department = await this.prisma.department.findUnique({
      where: { id: createCourseDto.departmentId },
    });

    if (!department) {
      throw new BadRequestException('Department not found');
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
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Course with this code already exists');
      }
      throw error;
    }
  }

  async findAll(departmentId?: string, year?: number, search?: string) {
    const where: any = {};

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (year) {
      where.targetYear = year;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
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
        _count: {
          select: {
            enrollments: true,
            sections: true,
            classes: true,
          },
        },
      },
      orderBy: [
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
        classes: {
          include: {
            professors: {
              include: {
                professor: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            _count: {
              select: {
                enrollments: true,
              },
            },
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
        _count: {
          select: {
            enrollments: true,
            classes: true,
            sections: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    // Check if course exists
    const existingCourse = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!existingCourse) {
      throw new NotFoundException('Course not found');
    }

    // Verify department exists if being updated
    if (updateCourseDto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: updateCourseDto.departmentId },
      });

      if (!department) {
        throw new BadRequestException('Department not found');
      }
    }

    try {
      return await this.prisma.course.update({
        where: { id },
        data: updateCourseDto,
        include: {
          department: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Course with this code already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.prisma.course.delete({
      where: { id },
    });
  }

  // ================================
  // COURSE CLASS CRUD OPERATIONS
  // ================================

  async createClass(createCourseClassDto: CreateCourseClassDto) {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: createCourseClassDto.courseId },
    });

    if (!course) {
      throw new BadRequestException('Course not found');
    }

    try {
      return await this.prisma.courseClass.create({
        data: createCourseClassDto,
        include: {
          course: {
            select: {
              name: true,
              code: true,
            },
          },
          professors: {
            include: {
              professor: {
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
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Class number already exists for this course');
      }
      throw error;
    }
  }

  async findAllClasses(courseId?: string) {
    const where: any = {};

    if (courseId) {
      where.courseId = courseId;
    }

    return this.prisma.courseClass.findMany({
      where,
      include: {
        course: {
          select: {
            name: true,
            code: true,
          },
        },
        professors: {
          include: {
            professor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: [
        { courseId: 'asc' },
        { classNumber: 'asc' },
      ],
    });
  }

  async findOneClass(id: string) {
    const courseClass = await this.prisma.courseClass.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            name: true,
            code: true,
          },
        },
        professors: {
          include: {
            professor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                collegeId: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!courseClass) {
      throw new NotFoundException('Course class not found');
    }

    return courseClass;
  }

  async updateClass(id: string, updateCourseClassDto: UpdateCourseClassDto) {
    const existingClass = await this.prisma.courseClass.findUnique({
      where: { id },
    });

    if (!existingClass) {
      throw new NotFoundException('Course class not found');
    }

    try {
      return await this.prisma.courseClass.update({
        where: { id },
        data: updateCourseClassDto,
        include: {
          course: {
            select: {
              name: true,
              code: true,
            },
          },
          professors: {
            include: {
              professor: {
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
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Class number already exists for this course');
      }
      throw error;
    }
  }

  async removeClass(id: string) {
    const courseClass = await this.prisma.courseClass.findUnique({
      where: { id },
    });

    if (!courseClass) {
      throw new NotFoundException('Course class not found');
    }

    return this.prisma.courseClass.delete({
      where: { id },
    });
  }

  // ================================
  // COURSE SECTION CRUD OPERATIONS
  // ================================

  async createSection(createCourseSectionDto: CreateCourseSectionDto) {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: createCourseSectionDto.courseId },
    });

    if (!course) {
      throw new BadRequestException('Course not found');
    }

    // Verify TA exists and has TA role
    const ta = await this.prisma.user.findUnique({
      where: { id: createCourseSectionDto.taId },
    });

    if (!ta) {
      throw new BadRequestException('TA not found');
    }

    if (ta.role !== 'TA') {
      throw new BadRequestException('User must have TA role');
    }

    try {
      return await this.prisma.courseSection.create({
        data: createCourseSectionDto,
        include: {
          course: {
            select: {
              name: true,
              code: true,
            },
          },
          ta: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Section number already exists for this course');
      }
      throw error;
    }
  }

  async findAllSections(courseId?: string) {
    const where: any = {};

    if (courseId) {
      where.courseId = courseId;
    }

    return this.prisma.courseSection.findMany({
      where,
      include: {
        course: {
          select: {
            name: true,
            code: true,
          },
        },
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
      orderBy: [
        { courseId: 'asc' },
        { sectionNumber: 'asc' },
      ],
    });
  }

  async findOneSection(id: string) {
    const courseSection = await this.prisma.courseSection.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            name: true,
            code: true,
          },
        },
        ta: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                collegeId: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!courseSection) {
      throw new NotFoundException('Course section not found');
    }

    return courseSection;
  }

  async updateSection(id: string, updateCourseSectionDto: UpdateCourseSectionDto) {
    const existingSection = await this.prisma.courseSection.findUnique({
      where: { id },
    });

    if (!existingSection) {
      throw new NotFoundException('Course section not found');
    }

    // Verify TA exists and has TA role if being updated
    if (updateCourseSectionDto.taId) {
      const ta = await this.prisma.user.findUnique({
        where: { id: updateCourseSectionDto.taId },
      });

      if (!ta) {
        throw new BadRequestException('TA not found');
      }

      if (ta.role !== 'TA') {
        throw new BadRequestException('User must have TA role');
      }
    }

    try {
      return await this.prisma.courseSection.update({
        where: { id },
        data: updateCourseSectionDto,
        include: {
          course: {
            select: {
              name: true,
              code: true,
            },
          },
          ta: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Section number already exists for this course');
      }
      throw error;
    }
  }

  async removeSection(id: string) {
    const courseSection = await this.prisma.courseSection.findUnique({
      where: { id },
    });

    if (!courseSection) {
      throw new NotFoundException('Course section not found');
    }

    return this.prisma.courseSection.delete({
      where: { id },
    });
  }

  // ================================
  // CLASS PROFESSOR OPERATIONS
  // ================================

  async assignProfessorToClass(assignClassProfessorDto: AssignClassProfessorDto) {
    // Verify class exists
    const courseClass = await this.prisma.courseClass.findUnique({
      where: { id: assignClassProfessorDto.classId },
    });

    if (!courseClass) {
      throw new BadRequestException('Course class not found');
    }

    // Verify professor exists and has PROFESSOR role
    const professor = await this.prisma.user.findUnique({
      where: { id: assignClassProfessorDto.professorId },
    });

    if (!professor) {
      throw new BadRequestException('Professor not found');
    }

    if (professor.role !== 'PROFESSOR') {
      throw new BadRequestException('User must have PROFESSOR role');
    }

    try {
      return await this.prisma.classProfessor.create({
        data: assignClassProfessorDto,
        include: {
          class: {
            select: {
              id: true,
              classNumber: true,
              course: {
                select: {
                  name: true,
                  code: true,
                },
              },
            },
          },
          professor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Professor is already assigned to this class');
      }
      throw error;
    }
  }

  async removeProfessorFromClass(classId: string, professorId: string) {
    const classProfessor = await this.prisma.classProfessor.findFirst({
      where: {
        classId,
        professorId,
      },
    });

    if (!classProfessor) {
      throw new NotFoundException('Professor assignment not found');
    }

    return this.prisma.classProfessor.delete({
      where: { id: classProfessor.id },
    });
  }

  async findClassProfessors(classId: string) {
    return this.prisma.classProfessor.findMany({
      where: { classId },
      include: {
        professor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // ================================
  // COURSE ENROLLMENT OPERATIONS
  // ================================

  async createEnrollment(createCourseEnrollmentDto: CreateCourseEnrollmentDto) {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: createCourseEnrollmentDto.courseId },
    });

    if (!course) {
      throw new BadRequestException('Course not found');
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createCourseEnrollmentDto.userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify class exists if provided
    if (createCourseEnrollmentDto.classId) {
      const courseClass = await this.prisma.courseClass.findUnique({
        where: { id: createCourseEnrollmentDto.classId },
      });

      if (!courseClass || courseClass.courseId !== createCourseEnrollmentDto.courseId) {
        throw new BadRequestException('Invalid class for this course');
      }
    }

    // Verify section exists if provided
    if (createCourseEnrollmentDto.sectionId) {
      const courseSection = await this.prisma.courseSection.findUnique({
        where: { id: createCourseEnrollmentDto.sectionId },
      });

      if (!courseSection || courseSection.courseId !== createCourseEnrollmentDto.courseId) {
        throw new BadRequestException('Invalid section for this course');
      }
    }

    try {
      return await this.prisma.courseEnrollment.create({
        data: createCourseEnrollmentDto,
        include: {
          course: {
            select: {
              name: true,
              code: true,
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
              id: true,
              classNumber: true,
            },
          },
          section: {
            select: {
              id: true,
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

  async findEnrollments(courseId?: string, classId?: string, sectionId?: string) {
    const where: any = {};

    if (courseId) {
      where.courseId = courseId;
    }

    if (classId) {
      where.classId = classId;
    }

    if (sectionId) {
      where.sectionId = sectionId;
    }

    return this.prisma.courseEnrollment.findMany({
      where,
      include: {
        course: {
          select: {
            name: true,
            code: true,
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
            id: true,
            classNumber: true,
          },
        },
        section: {
          select: {
            id: true,
            sectionNumber: true,
          },
        },
      },
      orderBy: [
        { enrolledAt: 'desc' },
      ],
    });
  }

  async removeEnrollment(id: string) {
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { id },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return this.prisma.courseEnrollment.delete({
      where: { id },
    });
  }
}
