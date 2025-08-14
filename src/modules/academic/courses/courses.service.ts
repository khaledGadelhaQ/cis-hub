import { Injectable, NotFoundException, ConflictException, BadRequestException, UseInterceptors } from '@nestjs/common';
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
import { ChatEventEmitterService } from '../../chat/services/chat-event-emitter.service';
import { EnrollmentRole } from '../../../common/enums/enrollment_role.enum';
import { CacheInterceptor } from '../../../common/interceptors/cache.interceptor';
import { Cache, CacheInvalidate } from '../../../common/decorators/cache.decorator';

@Injectable()
@UseInterceptors(CacheInterceptor)
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private chatEventEmitter: ChatEventEmitterService,
  ) {}

  // ================================
  // COURSE CRUD OPERATIONS
  // ================================

  @CacheInvalidate({
    keys: [
      'courses:all:*',
      'courses:department:{{createCourseDto.departmentId}}:*'
    ],
    condition: (result) => result && result.id
  })
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

  @Cache({
    key: 'courses:all:{{departmentId}}:{{year}}:{{search}}',
    ttl: 3600 // 1 hour
  })
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

  @Cache({
    key: 'courses:details:{{id}}',
    ttl: 1800 // 30 minutes
  })
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

  @CacheInvalidate({
    keys: [
      'courses:all:*',
      'courses:id:{{id}}:*',
      'courses:department:*'
    ],
    condition: (result) => result !== null
  })
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

  @CacheInvalidate({
    keys: [
      'courses:all:*',
      'courses:id:{{id}}:*',
      'courses:department:*'
    ],
    condition: (result) => result !== null
  })
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

  @CacheInvalidate({
    keys: [
      'courses:classes:*',
      'courses:classes:course:{{createCourseClassDto.courseId}}:*'
    ],
    condition: (result) => result && result.id
  })
  async createClass(createCourseClassDto: CreateCourseClassDto) {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: createCourseClassDto.courseId },
      include: {
        department: true,
      },
    });

    if (!course) {
      throw new BadRequestException('Course not found');
    }

    try {
      const newClass = await this.prisma.courseClass.create({
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

      // Emit chat automation event
      await this.chatEventEmitter.emitClassCreated({
        classId: newClass.id,
        courseId: newClass.courseId,
        classNumber: newClass.classNumber.toString(),
        courseCode: course.code,
        courseName: course.name,
        departmentCode: course.department.code,
        targetYear: course.targetYear.toString(),
      });

      return newClass;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Class number already exists for this course');
      }
      throw error;
    }
  }

  @Cache({ 
    key: 'courses:classes:all:{{courseId || "all"}}:{{skip}}:{{take}}', 
    ttl: 1800 
  }) // 30 minutes
  async findAllClasses(courseId?: string, skip: number = 0, take: number = 20) {
    const where: any = {};

    if (courseId) {
      where.courseId = courseId;
    }

    const [classes, total] = await Promise.all([
      this.prisma.courseClass.findMany({
        where,
        skip,
        take,
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
      }),
      this.prisma.courseClass.count({ where }),
    ]);

    return {
      data: classes,
      pagination: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  @Cache({ key: 'courses:classes:id:{{id}}', ttl: 3600 }) // 1 hour
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

  @CacheInvalidate({
    keys: [
      'courses:classes:*',
      'courses:classes:id:{{id}}:*'
    ],
    condition: (result) => result !== null
  })
  async updateClass(id: string, updateCourseClassDto: UpdateCourseClassDto) {
    const existingClass = await this.prisma.courseClass.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!existingClass) {
      throw new NotFoundException('Course class not found');
    }

    try {
      const updatedClass = await this.prisma.courseClass.update({
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

      // Emit chat automation event
      await this.chatEventEmitter.emitClassUpdated({
        classId: updatedClass.id,
        courseId: updatedClass.courseId,
        classNumber: updatedClass.classNumber.toString(),
        courseCode: existingClass.course.code,
        courseName: existingClass.course.name,
        departmentCode: existingClass.course.department.code,
        targetYear: existingClass.course.targetYear.toString(),
      });

      return updatedClass;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Class number already exists for this course');
      }
      throw error;
    }
  }

  @CacheInvalidate({
    keys: [
      'courses:classes:*',
      'courses:classes:id:{{id}}:*'
    ],
    condition: (result) => result !== null
  })
  async removeClass(id: string) {
    const courseClass = await this.prisma.courseClass.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!courseClass) {
      throw new NotFoundException('Course class not found');
    }

    await this.prisma.courseClass.delete({
      where: { id },
    });

    // Emit chat automation event
    await this.chatEventEmitter.emitClassDeleted({
      classId: id,
      courseId: courseClass.courseId,
      classNumber: courseClass.classNumber.toString(),
      courseCode: courseClass.course.code,
      courseName: courseClass.course.name,
      departmentCode: courseClass.course.department.code,
      targetYear: courseClass.course.targetYear.toString(),
    });

    return courseClass;
  }

  // ================================
  // COURSE SECTION CRUD OPERATIONS
  // ================================

  @CacheInvalidate({
    keys: [
      'courses:sections:*',
      'courses:sections:class:{{createCourseSectionDto.classId}}:*'
    ],
    condition: (result) => result && result.id
  })
  async createSection(createCourseSectionDto: CreateCourseSectionDto) {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: createCourseSectionDto.courseId },
      include: {
        department: true,
      },
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
      const newSection = await this.prisma.courseSection.create({
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

      // Emit chat automation event
      await this.chatEventEmitter.emitSectionCreated({
        sectionId: newSection.id,
        courseId: newSection.courseId,
        taId: newSection.taId,
        sectionNumber: newSection.sectionNumber.toString(),
        courseCode: course.code,
        courseName: course.name,
        departmentCode: course.department.code,
        targetYear: course.targetYear.toString(),
        taFirstName: ta.firstName,
        taLastName: ta.lastName,
      });

      return newSection;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Section number already exists for this course');
      }
      throw error;
    }
  }

  @Cache({ 
    key: 'courses:sections:all:{{courseId || "all"}}:{{skip}}:{{take}}', 
    ttl: 1800 
  }) // 30 minutes
  async findAllSections(courseId?: string, skip: number = 0, take: number = 20) {
    const where: any = {};

    if (courseId) {
      where.courseId = courseId;
    }

    const [sections, total] = await Promise.all([
      this.prisma.courseSection.findMany({
        where,
        skip,
        take,
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
      }),
      this.prisma.courseSection.count({ where }),
    ]);

    return {
      data: sections,
      pagination: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  @Cache({ key: 'courses:sections:id:{{id}}', ttl: 3600 }) // 1 hour
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

  @CacheInvalidate({
    keys: [
      'courses:sections:*',
      'courses:sections:id:{{id}}:*'
    ],
    condition: (result) => result !== null
  })
  async updateSection(id: string, updateCourseSectionDto: UpdateCourseSectionDto) {
    const existingSection = await this.prisma.courseSection.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            department: true,
          },
        },
        ta: true,
      },
    });

    if (!existingSection) {
      throw new NotFoundException('Course section not found');
    }

    // Store previous TA ID for chat automation
    const previousTaId = existingSection.taId;

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
      const updatedSection = await this.prisma.courseSection.update({
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

      // Emit chat automation event
      await this.chatEventEmitter.emitSectionUpdated({
        sectionId: updatedSection.id,
        courseId: updatedSection.courseId,
        taId: updatedSection.taId,
        previousTaId: previousTaId !== updatedSection.taId ? previousTaId : undefined,
        sectionNumber: updatedSection.sectionNumber.toString(),
        courseCode: existingSection.course.code,
        courseName: existingSection.course.name,
        departmentCode: existingSection.course.department.code,
        targetYear: existingSection.course.targetYear.toString(),
        taFirstName: updatedSection.ta.firstName,
        taLastName: updatedSection.ta.lastName,
      });

      return updatedSection;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Section number already exists for this course');
      }
      throw error;
    }
  }

  @CacheInvalidate({
    keys: [
      'courses:sections:*',
      'courses:sections:id:{{id}}:*'
    ],
    condition: (result) => result !== null
  })
  async removeSection(id: string) {
    const courseSection = await this.prisma.courseSection.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            department: true,
          },
        },
        ta: true,
      },
    });

    if (!courseSection) {
      throw new NotFoundException('Course section not found');
    }

    await this.prisma.courseSection.delete({
      where: { id },
    });

    // Emit chat automation event
    await this.chatEventEmitter.emitSectionDeleted({
      sectionId: id,
      courseId: courseSection.courseId,
      taId: courseSection.taId,
      sectionNumber: courseSection.sectionNumber.toString(),
      courseCode: courseSection.course.code,
      courseName: courseSection.course.name,
      departmentCode: courseSection.course.department.code,
      targetYear: courseSection.course.targetYear.toString(),
      taFirstName: courseSection.ta.firstName,
      taLastName: courseSection.ta.lastName,
    });

    return courseSection;
  }

  // ================================
  // CLASS PROFESSOR OPERATIONS
  // ================================

  @CacheInvalidate({
    keys: [
      'courses:classes:*',
      'courses:classes:professors:{{assignClassProfessorDto.classId}}:*'
    ],
    condition: (result) => result !== null
  })
  async assignProfessorToClass(assignClassProfessorDto: AssignClassProfessorDto) {
    // Verify class exists
    const courseClass = await this.prisma.courseClass.findUnique({
      where: { id: assignClassProfessorDto.classId },
      include: {
        course: true,
      },
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
      const assignment = await this.prisma.classProfessor.create({
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

      // Emit chat automation event
      await this.chatEventEmitter.emitProfessorAssigned({
        classId: assignClassProfessorDto.classId,
        professorId: assignClassProfessorDto.professorId,
        courseId: courseClass.courseId,
        courseName: courseClass.course.name,
        courseCode: courseClass.course.code,
        classNumber: courseClass.classNumber.toString(),
        professorFirstName: professor.firstName,
        professorLastName: professor.lastName,
      });

      return assignment;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Professor is already assigned to this class');
      }
      throw error;
    }
  }

  @CacheInvalidate({
    keys: [
      'courses:classes:*',
      'courses:classes:professors:{{classId}}:*'
    ],
    condition: (result) => result !== null
  })
  async removeProfessorFromClass(classId: string, professorId: string) {
    const classProfessor = await this.prisma.classProfessor.findFirst({
      where: {
        classId,
        professorId,
      },
      include: {
        class: {
          include: {
            course: true,
          },
        },
        professor: true,
      },
    });

    if (!classProfessor) {
      throw new NotFoundException('Professor assignment not found');
    }

    await this.prisma.classProfessor.delete({
      where: { id: classProfessor.id },
    });

    // Emit chat automation event
    await this.chatEventEmitter.emitProfessorRemoved({
      classId,
      professorId,
      courseId: classProfessor.class.courseId,
      courseName: classProfessor.class.course.name,
      courseCode: classProfessor.class.course.code,
      classNumber: classProfessor.class.classNumber.toString(),
      professorFirstName: classProfessor.professor.firstName,
      professorLastName: classProfessor.professor.lastName,
    });

    return classProfessor;
  }

  @Cache({ key: 'courses:classes:professors:{{classId}}', ttl: 1800 }) // 30 minutes
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

  @CacheInvalidate({
    keys: [
      'courses:enrollments:*',
      'courses:enrollments:user:{{createCourseEnrollmentDto.userId}}:*',
      'courses:enrollments:course:{{createCourseEnrollmentDto.courseId}}:*'
    ],
    condition: (result) => result && result.id
  })
  async createEnrollment(createCourseEnrollmentDto: CreateCourseEnrollmentDto) {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: createCourseEnrollmentDto.courseId },
      include: {
        department: true,
      },
    });

    if (!course) {
      throw new BadRequestException('Course not found');
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createCourseEnrollmentDto.userId },
      include: {
        department: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // College System Business Rules Validation
    if (user.role === 'STUDENT') {
      // Years 1-2: Students must be in GE department and can only enroll in GE courses
      if (user.currentYear && user.currentYear <= 2) {
        if (user.department?.code !== 'GE') {
          throw new BadRequestException('Years 1-2 students must be in General Education department');
        }
        if (course.department.code !== 'GE') {
          throw new BadRequestException('Years 1-2 students can only enroll in General Education courses');
        }
      }
      
      // Years 3-4: Students must be in specialized department and can only enroll in their department courses
      if (user.currentYear && user.currentYear >= 3) {
        if (user.department?.code === 'GE') {
          throw new BadRequestException('Years 3-4 students must choose a specialized department (CS, IT, or IS)');
        }
        if (course.department.code !== user.department?.code) {
          throw new BadRequestException('Students can only enroll in courses from their own department');
        }
      }
      
      // Validate target year compatibility
      if (course.targetYear && user.currentYear && course.targetYear !== user.currentYear) {
        throw new BadRequestException(`This course is designed for year ${course.targetYear} students`);
      }
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
      const enrollment = await this.prisma.courseEnrollment.create({
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

      // Emit chat automation event
      await this.chatEventEmitter.emitEnrollmentCreated({
        enrollmentId: enrollment.id,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        classId: enrollment.classId || undefined,
        sectionId: enrollment.sectionId || undefined,
        role: this.mapPrismaRoleToEnum(enrollment.role),
        userFirstName: user.firstName,
        userLastName: user.lastName,
        courseName: course.name,
        courseCode: course.code,
      });

      return enrollment;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('User is already enrolled in this course');
      }
      throw error;
    }
  }

  @Cache({ 
    key: 'courses:enrollments:find:{{courseId || "all"}}:{{userId || "all"}}:{{skip}}:{{take}}', 
    ttl: 600 
  }) // 10 minutes - shorter for dynamic data
  async findEnrollments(
    courseId?: string, 
    classId?: string, 
    sectionId?: string,
    skip: number = 0,
    take: number = 20
  ) {
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

    const [enrollments, total] = await Promise.all([
      this.prisma.courseEnrollment.findMany({
        where,
        skip,
        take,
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
      }),
      this.prisma.courseEnrollment.count({ where })
    ]);

    return {
      data: enrollments,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
        totalPages: Math.ceil(total / take),
        currentPage: Math.floor(skip / take) + 1,
      },
    };
  }

  @CacheInvalidate({
    keys: [
      'courses:enrollments:*'
    ],
    condition: (result) => result !== null
  })
  async removeEnrollment(id: string) {
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { id },
      include: {
        user: true,
        course: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    await this.prisma.courseEnrollment.delete({
      where: { id },
    });

    // Emit chat automation event
    await this.chatEventEmitter.emitEnrollmentRemoved({
      enrollmentId: id,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      classId: enrollment.classId || undefined,
      sectionId: enrollment.sectionId || undefined,
      role: this.mapPrismaRoleToEnum(enrollment.role),
      userFirstName: enrollment.user.firstName,
      userLastName: enrollment.user.lastName,
      courseName: enrollment.course.name,
      courseCode: enrollment.course.code,
    });

    return enrollment;
  }

  // ================================
  // HELPER METHODS
  // ================================

  private mapPrismaRoleToEnum(prismaRole: any): EnrollmentRole {
    switch (prismaRole) {
      case 'STUDENT':
        return EnrollmentRole.STUDENT;
      case 'TA':
        return EnrollmentRole.TA;
      case 'PROFESSOR':
        return EnrollmentRole.PROFESSOR;
      default:
        return EnrollmentRole.STUDENT;
    }
  }
}
