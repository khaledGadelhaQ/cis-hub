import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    try {
      return await this.prisma.department.create({
        data: createDepartmentDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Department with this code already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.department.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            users: true,
            courses: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        courses: {
          select: {
            id: true,
            name: true,
            code: true,
            targetYear: true,
          },
        },
        _count: {
          select: {
            users: true,
            courses: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    try {
      const department = await this.prisma.department.update({
        where: { id },
        data: updateDepartmentDto,
      });
      return department;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Department not found');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Department with this code already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.department.delete({
        where: { id },
      });
      return { message: 'Department deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Department not found');
      }
      throw error;
    }
  }
}
