import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';

@Injectable()
export class SemestersService {
  constructor(private prisma: PrismaService) {}

  async create(createSemesterDto: CreateSemesterDto) {
    const { startDate, endDate, ...data } = createSemesterDto;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new BadRequestException('Start date must be before end date');
    }

    return this.prisma.semester.create({
      data: {
        ...data,
        startDate: start,
        endDate: end,
      },
    });
  }

  async findAll() {
    return this.prisma.semester.findMany({
      orderBy: {
        startDate: 'desc',
      },
      include: {
        _count: {
          select: {
            courses: true,
          },
        },
      },
    });
  }

  async findActive() {
    const activeSemester = await this.prisma.semester.findFirst({
      where: {
        isActive: true,
      },
      include: {
        courses: {
          select: {
            id: true,
            name: true,
            code: true,
            department: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!activeSemester) {
      throw new NotFoundException('No active semester found');
    }

    return activeSemester;
  }

  async findOne(id: string) {
    const semester = await this.prisma.semester.findUnique({
      where: { id },
      include: {
        courses: {
          select: {
            id: true,
            name: true,
            code: true,
            department: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
        _count: {
          select: {
            courses: true,
          },
        },
      },
    });

    if (!semester) {
      throw new NotFoundException('Semester not found');
    }

    return semester;
  }

  async update(id: string, updateSemesterDto: UpdateSemesterDto) {
    const { startDate, endDate, ...data } = updateSemesterDto;

    let updateData: any = { ...data };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        throw new BadRequestException('Start date must be before end date');
      }

      updateData = {
        ...updateData,
        startDate: start,
        endDate: end,
      };
    }

    try {
      const semester = await this.prisma.semester.update({
        where: { id },
        data: updateData,
      });
      return semester;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Semester not found');
      }
      throw error;
    }
  }

  async activate(id: string) {
    // First, deactivate all other semesters
    await this.prisma.semester.updateMany({
      where: {
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Then activate the specified semester
    try {
      const semester = await this.prisma.semester.update({
        where: { id },
        data: {
          isActive: true,
        },
      });
      return semester;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Semester not found');
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.semester.delete({
        where: { id },
      });
      return { message: 'Semester deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Semester not found');
      }
      throw error;
    }
  }
}
